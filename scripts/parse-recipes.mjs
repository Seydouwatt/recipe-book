import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, "..", "public", "recipes-fr.csv");
const OUTPUT_PATH = join(__dirname, "..", "public", "recipes.json");
const ERRORS_PATH = join(__dirname, "..", "public", "recipes-errors.json");

// Parse CSV line (handles quoted fields with semicolons)
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

// Known units for ingredient parsing
const UNITS = [
  "cuillères à soupe", "cuillère à soupe", "cuillères à café", "cuillère à café",
  "cuillères à dessert", "cuillère à dessert", "c\\. à soupe", "c\\. à café",
  "grammes", "gramme", "kilogrammes", "kilogramme",
  "millilitres", "millilitre", "litres", "litre",
  "kg", "ml", "cl", "dl", "l\\.", "g",
  "unités", "unité", "paquets", "paquet", "pots", "pot",
  "pincées", "pincée", "feuilles", "feuille",
  "morceaux", "morceau", "filets", "filet",
  "brins", "brin", "tranches", "tranche",
  "boîtes", "boîte", "tasses", "tasse",
  "miches", "miche", "sachets", "sachet",
  "bouquets", "bouquet", "gousses", "gousse",
  "poignées", "poignée", "enveloppes", "enveloppe",
  "verres", "verre", "barres", "barre",
  "branches", "branche", "douzaines", "douzaine",
  "cuillères", "cuillère",
];

const UNIT_PATTERN = UNITS.join("|");

// Convert quantity string to number
function parseQty(raw) {
  let q = raw.trim();
  q = q.replace("½", "0.5").replace("¼", "0.25").replace("¾", "0.75")
    .replace("⅓", "0.33").replace("⅔", "0.66");
  if (q.includes("/")) {
    const [num, den] = q.split("/");
    const n = parseFloat(num);
    const d = parseFloat(den);
    if (d) return n / d;
  }
  q = q.replace(",", ".");
  return parseFloat(q) || 0;
}

// Clean ingredient name
function cleanName(name) {
  let n = name.trim();
  // Remove leading "de ", "d'", "d'"
  n = n.replace(/^(?:de\s+|d[''])/i, "");
  // Remove trailing comma, period, parentheses fragments
  n = n.replace(/[,.\s]+$/, "");
  // Remove leading comma
  n = n.replace(/^[,.\s]+/, "");
  return n.trim();
}

// Parse a single ingredient string into { name, qty, unit }
function parseIngredient(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Build regex: qty + unit + (de/d') + name
  const qtyPat = "([\\d½¼¾⅓⅔,./]+)";
  const unitPat = `(${UNIT_PATTERN})`;

  // Pattern 1: "100 grammes de bœuf", "2 cuillères à soupe de moutarde"
  const re1 = new RegExp(`^${qtyPat}\\s+${unitPat}\\s+(?:de\\s+|d[''])?(.+)`, "i");
  const m1 = trimmed.match(re1);
  if (m1) {
    return { name: cleanName(m1[3]), qty: parseQty(m1[1]), unit: m1[2].trim() };
  }

  // Pattern 2: "1 oignon", "3 tomates" (qty + name, no unit)
  const re2 = new RegExp(`^${qtyPat}\\s+(.+)`, "i");
  const m2 = trimmed.match(re2);
  if (m2) {
    const rest = m2[2].trim();
    // Check if rest starts with a unit
    const reUnit = new RegExp(`^(${UNIT_PATTERN})(?:\\s+(?:de\\s+|d[''])?(.+))?`, "i");
    const mu = rest.match(reUnit);
    if (mu && mu[2]) {
      return { name: cleanName(mu[2]), qty: parseQty(m2[1]), unit: mu[1].trim() };
    }
    return { name: cleanName(rest), qty: parseQty(m2[1]), unit: "" };
  }

  // Pattern 3: no quantity — standalone ingredient like "Sel", "Poivre", "Huile d'olive"
  return { name: cleanName(trimmed) || trimmed.trim(), qty: 0, unit: "" };
}

// Parse ingredients string into array
function parseIngredients(text) {
  if (!text || !text.trim()) return [];

  // Normalize: replace "Une "/"Un " with "1 "
  let normalized = text
    .replace(/\bUne\s+/gi, "1 ")
    .replace(/\bUn\s+/gi, "1 ");

  // Build a regex that finds the START of a new ingredient:
  // A qty (number/fraction) followed by a known unit word
  const qtyStart = "(?:[\\d½¼¾⅓⅔]+[\\d,./½¼¾⅓⅔]*)";
  const unitStart = `(?:${UNIT_PATTERN})`;

  // Split strategy: first try splitting on real separators (comma not inside decimals)
  // A comma that is NOT between two digits is a separator
  const commaSegments = normalized.split(/,(?!\d)/).map(s => s.trim()).filter(Boolean);

  const allParts = [];

  for (const segment of commaSegments) {
    // Within each comma-segment, split where a new ingredient starts
    // A new ingredient starts at: number + space + (unit or word)
    // But we must not split inside "2,5 kg" (already handled by comma split above)
    const splitRe = new RegExp(
      `(?=(?:^|\\s)${qtyStart}\\s+(?:${unitStart}|[a-zA-ZÀ-ÿ]))`,
      "gi"
    );

    const subParts = segment.split(splitRe).map(s => s.trim()).filter(Boolean);
    allParts.push(...subParts);
  }

  // Parse each part
  const ingredients = allParts
    .map(parseIngredient)
    .filter(ing => {
      if (!ing) return false;
      const name = ing.name.trim();
      // Filter out empty names, pure numbers, very short garbage
      if (!name) return false;
      if (/^\d+[,.]?\d*$/.test(name)) return false;
      if (name.length < 2) return false;
      return true;
    });

  return ingredients;
}

// Parse steps string into array
function parseSteps(text) {
  if (!text || !text.trim()) return [];

  // Split on "1- ", "2- ", etc. or "1. ", "2. "
  const steps = text
    .split(/\d+[-–.]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Clean up: remove "Truco:" tips prefix, trailing URLs, etc.
  return steps.map((s) =>
    s.replace(/^\s*-\s*/, "").trim()
  );
}

// Estimate prep time based on category/tags
const PREP_TIMES = {
  "Apéritifs et tapas": { default: 20, "Canapés": 15, "Tapas": 20, "Biscuits salés": 30, "Empanadas": 35 },
  "Entrées": { default: 25, "Salades": 15, "Soupes": 40, "Crèmes": 35 },
  "Plats principaux": { default: 45, "Viandes": 50, "Poissons": 35, "Pâtes": 25, "Riz": 30 },
  "Desserts": { default: 40, "Gâteaux": 50, "Biscuits": 30, "Glaces": 20, "Crèmes": 30, "Tartes": 45 },
  "Cocktails et boissons": { default: 10 },
  "Boissons": { default: 10 },
  "Pain et viennoiseries": { default: 60 },
  "Sauces": { default: 15 },
  "Accompagnements": { default: 25 },
  "Salades": { default: 20 },
  "Légumineuses": { default: 60 },
  "Oiseaux et chasse": { default: 50 },
  "Coller": { default: 30 },
};

function estimatePrepTime(tags, numSteps, numIngredients) {
  const category = tags[0] || "";
  const subcategory = tags[1] || "";
  const catTimes = PREP_TIMES[category];
  if (catTimes) return catTimes[subcategory] || catTimes.default;
  if (numSteps >= 8 || numIngredients >= 10) return 50;
  if (numSteps >= 5 || numIngredients >= 6) return 35;
  return 25;
}

function main() {
  console.log("Lecture du CSV traduit...");
  const csv = readFileSync(CSV_PATH, "utf-8");
  const lines = csv.split("\n").filter((l) => l.trim());

  const dataLines = lines.slice(1); // skip header
  console.log(`${dataLines.length} lignes a traiter`);

  const recipes = [];
  const errors = [];

  for (let i = 0; i < dataLines.length; i++) {
    const fields = parseCSVLine(dataLines[i]);

    if (fields.length < 7) {
      errors.push({
        line: i + 2,
        reason: "Nombre de colonnes insuffisant",
        raw: dataLines[i].substring(0, 200),
      });
      continue;
    }

    const [title, author, category, subcategory, ingredientsRaw, stepsRaw, source] = fields;

    // Validation: titre requis
    if (!title || !title.trim()) {
      errors.push({
        line: i + 2,
        reason: "Titre manquant",
        raw: dataLines[i].substring(0, 200),
      });
      continue;
    }

    // Validation: ingrédients requis
    if (!ingredientsRaw || !ingredientsRaw.trim()) {
      errors.push({
        line: i + 2,
        reason: "Ingrédients manquants",
        title: title.trim(),
      });
      continue;
    }

    // Validation: étapes requises
    if (!stepsRaw || !stepsRaw.trim()) {
      errors.push({
        line: i + 2,
        reason: "Étapes manquantes",
        title: title.trim(),
      });
      continue;
    }

    const ingredients = parseIngredients(ingredientsRaw);
    const steps = parseSteps(stepsRaw);

    // Validation: au moins 1 ingrédient parsé
    if (ingredients.length === 0) {
      errors.push({
        line: i + 2,
        reason: "Aucun ingrédient parsable",
        title: title.trim(),
        ingredientsRaw: ingredientsRaw.substring(0, 200),
      });
      continue;
    }

    // Validation: minimum 3 étapes
    if (steps.length < 3) {
      errors.push({
        line: i + 2,
        reason: `Seulement ${steps.length} étape(s) (minimum 3)`,
        title: title.trim(),
      });
      continue;
    }

    // Build tags from category + subcategory
    const tags = [];
    if (category && category.trim()) tags.push(category.trim());
    if (subcategory && subcategory.trim()) tags.push(subcategory.trim());

    // Estimate prep_time from tags
    const prepTime = estimatePrepTime(tags, steps.length, ingredients.length);

    // Clean title: remove "Recette de/du/d'/des/..." prefix
    let cleanTitle = title.trim();
    const titlePatterns = [
      /^Recette facile de /i, /^Recette pratique de /i,
      /^Recette traditionnelle de /i, /^La délicieuse recette de /i,
      /^Délicieuse recette de /i, /^Recette de la /i, /^Recette de l'/i,
      /^Recette de /i, /^Recette du /i, /^Recette des /i, /^Recette d'/i,
      /^Recette /i,
    ];
    for (const p of titlePatterns) {
      if (p.test(cleanTitle)) { cleanTitle = cleanTitle.replace(p, ""); break; }
    }
    cleanTitle = cleanTitle.replace(/[\s\u200B]+recette$/i, "");
    if (cleanTitle.length > 0) {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }

    recipes.push({
      id: randomUUID(),
      title: cleanTitle,
      servings: 4,
      prep_time: prepTime,
      tags,
      ingredients,
      steps,
      author_id: null,
      forked_from_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Write valid recipes
  writeFileSync(OUTPUT_PATH, JSON.stringify(recipes, null, 2), "utf-8");

  // Write errors
  writeFileSync(ERRORS_PATH, JSON.stringify(errors, null, 2), "utf-8");

  console.log(`\nResultat :`);
  console.log(`  Recettes valides : ${recipes.length}`);
  console.log(`  Recettes rejetees : ${errors.length}`);
  console.log(`  Fichier JSON : ${OUTPUT_PATH}`);
  console.log(`  Fichier erreurs : ${ERRORS_PATH}`);

  // Stats on error reasons
  const reasonCounts = {};
  for (const err of errors) {
    reasonCounts[err.reason] = (reasonCounts[err.reason] || 0) + 1;
  }
  console.log(`\nRaisons de rejet :`);
  for (const [reason, count] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason}: ${count}`);
  }
}

main();
