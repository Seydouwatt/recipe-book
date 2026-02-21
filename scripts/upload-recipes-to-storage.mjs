import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, "..", "public", "recipes.json");

const BUCKET = "recipes-pool";
const FILE = "recipes.json";

// Load env from .env file manually
const envPath = join(__dirname, "..", ".env");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  env[key.trim()] = rest.join("=").trim();
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Erreur: VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env");
  console.error("Ajoute SUPABASE_SERVICE_ROLE_KEY=... dans ton .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("Lecture de recipes.json...");
  const data = readFileSync(JSON_PATH, "utf-8");
  const recipes = JSON.parse(data);
  console.log(`${recipes.length} recettes a uploader`);

  // Create bucket if not exists
  const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, {
    public: false,
  });
  if (bucketErr && !bucketErr.message.includes("already exists")) {
    console.error("Erreur creation bucket:", bucketErr.message);
    process.exit(1);
  }
  console.log(`Bucket "${BUCKET}" pret`);

  // Upload file
  const blob = new Blob([data], { type: "application/json" });
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(FILE, blob, {
      contentType: "application/json",
      upsert: true,
    });

  if (uploadErr) {
    console.error("Erreur upload:", uploadErr.message);
    process.exit(1);
  }

  console.log(`Upload OK : ${BUCKET}/${FILE} (${(data.length / 1024 / 1024).toFixed(1)} Mo)`);
}

main().catch(console.error);
