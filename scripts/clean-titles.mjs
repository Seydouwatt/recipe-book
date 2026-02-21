import { readFileSync, writeFileSync } from 'fs';

const file = '/Users/seydouwatt/Developpement/git/recipe-book/public/recipes.json';
const recipes = JSON.parse(readFileSync(file, 'utf-8'));

function cleanTitle(title) {
  let cleaned = title;

  // Order matters: match longer patterns first
  const patterns = [
    /^Recette facile de /i,
    /^Recette pratique de /i,
    /^La délicieuse recette de /i,
    /^Recette de la /i,
    /^Recette de l'/i,
    /^Recette de /i,
    /^Recette du /i,
    /^Recette des /i,
    /^Recette d'/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '');
      break;
    }
  }

  // Remove trailing "Recette" (including with zero-width spaces)
  cleaned = cleaned.replace(/[\s\u200B]+recette$/i, '');

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

let changed = 0;
for (const recipe of recipes) {
  const original = recipe.title;
  recipe.title = cleanTitle(recipe.title);
  if (original !== recipe.title) {
    changed++;
    console.log(`  "${original}"\n→ "${recipe.title}"\n`);
  }
}

writeFileSync(file, JSON.stringify(recipes, null, 2) + '\n', 'utf-8');
console.log(`\nDone: ${changed}/${recipes.length} titles modified.`);
