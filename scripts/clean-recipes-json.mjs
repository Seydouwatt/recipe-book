import { readFileSync, writeFileSync } from "fs";

const file = "/Users/seydouwatt/Developpement/git/recipe-book/public/recipes.json";
const recipes = JSON.parse(readFileSync(file, "utf-8"));

// Temps de préparation estimés par catégorie/sous-catégorie
const PREP_TIMES = {
  // Catégorie principale -> sous-catégorie -> minutes
  "Apéritifs et tapas": { default: 20, "Canapés": 15, "Tapas": 20, "Biscuits salés": 30 },
  "Entrées": { default: 25, "Salades": 15, "Soupes": 40, "Crèmes": 35 },
  "Plats principaux": { default: 45, "Viandes": 50, "Poissons": 35, "Pâtes": 25, "Riz": 30, "Légumineuses": 60 },
  "Desserts": { default: 40, "Gâteaux": 50, "Biscuits": 30, "Glaces": 20, "Crèmes": 30, "Tartes": 45 },
  "Boissons": { default: 10 },
  "Pains et viennoiseries": { default: 60 },
  "Sauces": { default: 15 },
  "Accompagnements": { default: 25 },
};

function estimatePrepTime(recipe) {
  const tags = recipe.tags || [];
  const category = tags[0] || "";
  const subcategory = tags[1] || "";

  const catTimes = PREP_TIMES[category];
  if (catTimes) {
    return catTimes[subcategory] || catTimes.default;
  }

  // Estimation par nombre d'étapes et d'ingrédients
  const steps = (recipe.steps || []).length;
  const ingredients = (recipe.ingredients || []).length;
  if (steps >= 8 || ingredients >= 10) return 50;
  if (steps >= 5 || ingredients >= 6) return 35;
  return 25;
}

function isInvalidIngredient(ing) {
  if (!ing || !ing.name) return true;
  const name = String(ing.name).trim();
  // Nom vide
  if (name === "") return true;
  // Nom qui est juste un chiffre
  if (/^\d+$/.test(name)) return true;
  return false;
}

let fixedIngredients = 0;
let fixedPrepTime = 0;

for (const recipe of recipes) {
  // Nettoyer les ingrédients
  const before = recipe.ingredients?.length || 0;
  recipe.ingredients = (recipe.ingredients || []).filter((ing) => !isInvalidIngredient(ing));
  const removed = before - recipe.ingredients.length;
  if (removed > 0) fixedIngredients += removed;

  // Estimer prep_time si 0
  if (!recipe.prep_time || recipe.prep_time === 0) {
    recipe.prep_time = estimatePrepTime(recipe);
    fixedPrepTime++;
  }
}

writeFileSync(file, JSON.stringify(recipes, null, 2) + "\n", "utf-8");

console.log(`Nettoyage terminé :`);
console.log(`  - ${fixedIngredients} ingrédients invalides supprimés`);
console.log(`  - ${fixedPrepTime} temps de préparation estimés`);
console.log(`  - ${recipes.length} recettes au total`);
