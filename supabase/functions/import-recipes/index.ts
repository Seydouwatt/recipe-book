import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "recipes-pool";
const FILE = "recipes.json";
const BATCH_SIZE = 200;
const MASTER_FOOD_ID = "ad2ea0c7-7d56-4652-b84c-d2637343cf12";

interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

interface PoolRecipe {
  id: string;
  title: string;
  servings: number;
  prep_time: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  author_id: string | null;
  forked_from_id: string | null;
  created_at: string;
  updated_at: string;
  imported_at?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Download recipes.json from Storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(FILE);

    if (dlErr || !fileData) {
      return new Response(
        JSON.stringify({ error: "Cannot download recipes.json", details: dlErr?.message }),
        { status: 500 },
      );
    }

    const allRecipes: PoolRecipe[] = JSON.parse(await fileData.text());

    // 3. Filter non-imported recipes
    const available = allRecipes.filter((r) => !r.imported_at);

    if (available.length === 0) {
      return new Response(
        JSON.stringify({ message: "No more recipes to import", total: allRecipes.length }),
        { status: 200 },
      );
    }

    // 4. Pick random batch
    const count = Math.min(BATCH_SIZE, available.length);
    const selected = shuffle(available).slice(0, count);
    const selectedIds = new Set(selected.map((r) => r.id));

    // 5. Insert into Supabase
    const toInsert = selected.map((r) => ({
      title: r.title,
      servings: r.servings,
      prep_time: r.prep_time,
      tags: r.tags,
      ingredients: r.ingredients,
      steps: r.steps,
      author_id: MASTER_FOOD_ID,
      forked_from_id: null,
      moderated: false,
    }));

    const { error: insertErr } = await supabase.from("recipes").insert(toInsert);

    if (insertErr) {
      return new Response(
        JSON.stringify({ error: "Insert failed", details: insertErr.message }),
        { status: 500 },
      );
    }

    // 6. Mark imported in JSON
    const now = new Date().toISOString();
    for (const recipe of allRecipes) {
      if (selectedIds.has(recipe.id)) {
        recipe.imported_at = now;
      }
    }

    // 7. Re-upload updated JSON
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .update(FILE, JSON.stringify(allRecipes, null, 2), {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadErr) {
      return new Response(
        JSON.stringify({
          warning: "Recipes inserted but JSON update failed",
          imported: count,
          details: uploadErr.message,
        }),
        { status: 207 },
      );
    }

    const remaining = available.length - count;

    return new Response(
      JSON.stringify({
        message: `${count} recipes imported`,
        imported: count,
        remaining,
        total: allRecipes.length,
      }),
      { status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(err) }),
      { status: 500 },
    );
  }
});
