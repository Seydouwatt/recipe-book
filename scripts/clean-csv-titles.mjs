import { readFileSync, writeFileSync } from 'fs';

const file = '/Users/seydouwatt/Developpement/git/recipe-book/public/recipes-fr.csv';
const content = readFileSync(file, 'utf-8');
const lines = content.split('\n');

function cleanTitle(title) {
  let cleaned = title;

  const patterns = [
    /^Recette facile de /i,
    /^Recette pratique de /i,
    /^Recette traditionnelle de /i,
    /^La délicieuse recette de /i,
    /^Délicieuse recette de /i,
    /^Recette de la /i,
    /^Recette de l'/i,
    /^Recette de /i,
    /^Recette du /i,
    /^Recette des /i,
    /^Recette d'/i,
    /^Recette /i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '');
      break;
    }
  }

  // Remove trailing "recette" (including with zero-width spaces)
  cleaned = cleaned.replace(/[\s\u200B]+recette$/i, '');

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

let changed = 0;
const output = lines.map((line, i) => {
  if (i === 0 || line.trim() === '') return line; // skip header and empty lines

  const sep = line.indexOf(';');
  if (sep === -1) return line;

  const title = line.substring(0, sep);
  const rest = line.substring(sep);
  const newTitle = cleanTitle(title);

  if (title !== newTitle) {
    changed++;
    if (changed <= 20) console.log(`  "${title}"\n→ "${newTitle}"\n`);
  }

  return newTitle + rest;
});

writeFileSync(file, output.join('\n'), 'utf-8');
console.log(`\nDone: ${changed}/${lines.length - 1} titles modified.`);
