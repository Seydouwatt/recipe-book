import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, "..", "public", "recipes.csv");
const OUTPUT_PATH = join(__dirname, "..", "public", "recipes-fr.csv");
const PROGRESS_PATH = join(__dirname, "..", "public", "translate-progress.json");

const BATCH_SIZE = 100;

// Google Translate (free endpoint, no API key)
async function translateText(text, from = "es", to = "fr") {
  if (!text || !text.trim()) return text;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation failed: ${res.status}`);

  const data = await res.json();
  return data[0].map((s) => s[0]).join("");
}

// Parse CSV line (handles quoted fields)
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function escapeCSV(value) {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

// Concat multiple texts with a unique separator, translate once, then split back
async function translateChunk(textsArray) {
  // textsArray = array of { index, fieldName, text }
  // Group all non-empty texts, join with separator, translate in one call, split back
  const SEP = " ||| ";
  const toTranslate = textsArray.filter((t) => t.text && t.text.trim());

  if (toTranslate.length === 0) return new Map();

  // Split into sub-batches to avoid URL length limits (~2000 chars per request)
  const MAX_CHARS = 4000;
  const subBatches = [];
  let currentBatch = [];
  let currentLen = 0;

  for (const item of toTranslate) {
    const addLen = item.text.length + SEP.length;
    if (currentLen + addLen > MAX_CHARS && currentBatch.length > 0) {
      subBatches.push(currentBatch);
      currentBatch = [];
      currentLen = 0;
    }
    currentBatch.push(item);
    currentLen += addLen;
  }
  if (currentBatch.length > 0) subBatches.push(currentBatch);

  const results = new Map();

  for (const batch of subBatches) {
    const joined = batch.map((b) => b.text).join(SEP);

    try {
      const translated = await translateText(joined);
      const parts = translated.split(/\s*\|\|\|\s*/);

      for (let i = 0; i < batch.length; i++) {
        const key = `${batch[i].index}_${batch[i].fieldName}`;
        results.set(key, parts[i] || batch[i].text);
      }
    } catch (err) {
      console.error(`  ⚠ Batch translation error: ${err.message}`);
      for (const item of batch) {
        results.set(`${item.index}_${item.fieldName}`, item.text);
      }
    }

    // Rate limit between sub-batches
    await new Promise((r) => setTimeout(r, 150));
  }

  return results;
}

async function main() {
  console.log("Lecture du CSV...");
  const csv = readFileSync(CSV_PATH, "utf-8");
  const lines = csv.split("\n").filter((l) => l.trim());

  const dataLines = lines.slice(1);
  console.log(`${dataLines.length} recettes a traduire`);

  // Resume support
  let startIndex = 0;
  let outputLines = [];

  if (existsSync(PROGRESS_PATH)) {
    const progress = JSON.parse(readFileSync(PROGRESS_PATH, "utf-8"));
    startIndex = progress.lastIndex + 1;
    outputLines = progress.translatedLines;
    console.log(`Reprise a partir de la recette ${startIndex + 1}/${dataLines.length}`);
  }

  const headerFr =
    "Dish_Title;Recipe_author;Recipe_category;Recipe_subcategory;Recipe_ingredients;Recipe;Source";

  // Process in batches of BATCH_SIZE
  for (let batchStart = startIndex; batchStart < dataLines.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, dataLines.length);
    const batchRecipes = [];

    // Parse all recipes in this batch
    for (let i = batchStart; i < batchEnd; i++) {
      const fields = parseCSVLine(dataLines[i]);
      if (fields.length < 7) {
        batchRecipes.push({ index: i, raw: dataLines[i], fields: null });
      } else {
        batchRecipes.push({ index: i, raw: null, fields });
      }
    }

    // Collect all texts to translate for this batch
    const textsToTranslate = [];
    for (const recipe of batchRecipes) {
      if (!recipe.fields) continue;
      const [title, , category, subcategory, ingredients, steps] = recipe.fields;

      textsToTranslate.push({ index: recipe.index, fieldName: "title", text: title });
      textsToTranslate.push({ index: recipe.index, fieldName: "category", text: category });
      textsToTranslate.push({ index: recipe.index, fieldName: "subcategory", text: subcategory });
      textsToTranslate.push({ index: recipe.index, fieldName: "ingredients", text: ingredients });
      textsToTranslate.push({ index: recipe.index, fieldName: "steps", text: steps });
    }

    // Translate the whole batch
    const translations = await translateChunk(textsToTranslate);

    // Build output lines
    for (const recipe of batchRecipes) {
      if (!recipe.fields) {
        outputLines.push(recipe.raw);
        continue;
      }

      const [, author, , , , , source] = recipe.fields;
      const get = (field) =>
        translations.get(`${recipe.index}_${field}`) || recipe.fields[0];

      const translatedLine = [
        get("title"),
        author,
        get("category"),
        get("subcategory"),
        get("ingredients"),
        get("steps"),
        source,
      ]
        .map(escapeCSV)
        .join(";");

      outputLines.push(translatedLine);
    }

    console.log(`${batchEnd}/${dataLines.length} recettes traduites`);

    // Save progress & partial output
    writeFileSync(
      PROGRESS_PATH,
      JSON.stringify({ lastIndex: batchEnd - 1, translatedLines: outputLines }),
    );
    writeFileSync(
      OUTPUT_PATH,
      headerFr + "\n" + outputLines.join("\n") + "\n",
      "utf-8",
    );
  }

  // Clean up progress file
  if (existsSync(PROGRESS_PATH)) {
    unlinkSync(PROGRESS_PATH);
  }

  console.log(`\nTermine ! ${outputLines.length} recettes traduites`);
  console.log(`Fichier : ${OUTPUT_PATH}`);
}

main().catch(console.error);
