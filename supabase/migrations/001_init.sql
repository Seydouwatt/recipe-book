-- ============================================
-- Migration 001 : Schema recipes + favorites
-- ============================================

-- Table recipes
create table recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  servings int not null default 4,
  prep_time int not null,
  tags text[] default '{}',
  ingredients jsonb not null default '[]',
  steps text[] default '{}',
  author_id uuid references auth.users(id) on delete set null,
  forked_from_id uuid references recipes(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table favorites
create table favorites (
  user_id uuid references auth.users(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete cascade,
  primary key (user_id, recipe_id)
);

-- Index
create index idx_recipes_author on recipes(author_id);
create index idx_recipes_tags on recipes using gin(tags);
create index idx_favorites_user on favorites(user_id);

-- RLS recipes
alter table recipes enable row level security;
create policy "Lecture publique" on recipes for select using (true);
create policy "Insert si connecté" on recipes for insert with check (auth.uid() = author_id);
create policy "Update si auteur" on recipes for update using (auth.uid() = author_id);
create policy "Delete si auteur" on recipes for delete using (auth.uid() = author_id);

-- RLS favorites
alter table favorites enable row level security;
create policy "Select ses favoris" on favorites for select using (auth.uid() = user_id);
create policy "Insert ses favoris" on favorites for insert with check (auth.uid() = user_id);
create policy "Delete ses favoris" on favorites for delete using (auth.uid() = user_id);

-- Trigger updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on recipes
  for each row execute function update_updated_at();

-- ============================================
-- Seed : recettes système (author_id = null)
-- ============================================

insert into recipes (title, servings, prep_time, tags, ingredients, steps) values
(
  'Pâtes Carbonara', 4, 25,
  '{"pâtes","italien","rapide"}',
  '[{"name":"Spaghetti","qty":400,"unit":"g"},{"name":"Lardons","qty":200,"unit":"g"},{"name":"Œufs","qty":3,"unit":""},{"name":"Parmesan râpé","qty":100,"unit":"g"},{"name":"Poivre noir","qty":1,"unit":"pincée"}]'::jsonb,
  '{"Faire cuire les pâtes dans une grande casserole d''eau salée selon les instructions du paquet.","Pendant ce temps, faire revenir les lardons dans une poêle sans matière grasse.","Dans un bol, battre les œufs avec le parmesan râpé et le poivre.","Égoutter les pâtes en gardant un peu d''eau de cuisson.","Hors du feu, mélanger les pâtes avec les lardons, puis verser le mélange œufs-parmesan.","Mélanger rapidement. Ajouter un peu d''eau de cuisson si besoin. Servir immédiatement."}'
),
(
  'Salade Niçoise', 4, 20,
  '{"salade","été","rapide"}',
  '[{"name":"Tomates","qty":4,"unit":""},{"name":"Thon en boîte","qty":200,"unit":"g"},{"name":"Œufs durs","qty":3,"unit":""},{"name":"Olives noires","qty":100,"unit":"g"},{"name":"Haricots verts","qty":200,"unit":"g"},{"name":"Anchois","qty":6,"unit":"filets"},{"name":"Huile d''olive","qty":3,"unit":"c. à soupe"}]'::jsonb,
  '{"Cuire les haricots verts et les œufs durs. Laisser refroidir.","Couper les tomates en quartiers.","Disposer tous les ingrédients dans un grand saladier.","Émietter le thon et ajouter les anchois.","Assaisonner avec l''huile d''olive, sel et poivre."}'
),
(
  'Gâteau au Chocolat', 8, 45,
  '{"dessert","chocolat"}',
  '[{"name":"Chocolat noir","qty":200,"unit":"g"},{"name":"Beurre","qty":100,"unit":"g"},{"name":"Sucre","qty":150,"unit":"g"},{"name":"Farine","qty":80,"unit":"g"},{"name":"Œufs","qty":4,"unit":""}]'::jsonb,
  '{"Préchauffer le four à 180°C.","Faire fondre le chocolat et le beurre au bain-marie.","Dans un saladier, mélanger les œufs et le sucre.","Ajouter le chocolat fondu, puis la farine tamisée.","Verser dans un moule beurré.","Enfourner 25 minutes. Le centre doit rester légèrement fondant."}'
),
(
  'Soupe à l''Oignon', 4, 50,
  '{"soupe","hiver","français"}',
  '[{"name":"Oignons","qty":6,"unit":""},{"name":"Beurre","qty":50,"unit":"g"},{"name":"Bouillon de bœuf","qty":1,"unit":"L"},{"name":"Pain rassis","qty":4,"unit":"tranches"},{"name":"Gruyère râpé","qty":150,"unit":"g"},{"name":"Vin blanc sec","qty":10,"unit":"cL"}]'::jsonb,
  '{"Émincer finement les oignons.","Les faire revenir dans le beurre à feu doux pendant 30 minutes jusqu''à caramélisation.","Déglacer au vin blanc et laisser réduire 2 minutes.","Ajouter le bouillon et laisser mijoter 15 minutes.","Verser dans des bols allant au four, ajouter le pain et le gruyère.","Gratiner sous le gril 5 minutes."}'
),
(
  'Crêpes Bretonnes', 6, 30,
  '{"dessert","breton","rapide"}',
  '[{"name":"Farine","qty":250,"unit":"g"},{"name":"Œufs","qty":3,"unit":""},{"name":"Lait","qty":50,"unit":"cL"},{"name":"Beurre fondu","qty":30,"unit":"g"},{"name":"Sucre","qty":30,"unit":"g"},{"name":"Sel","qty":1,"unit":"pincée"}]'::jsonb,
  '{"Mettre la farine dans un saladier, creuser un puits.","Ajouter les œufs, le sucre et le sel. Mélanger.","Verser le lait progressivement en fouettant pour éviter les grumeaux.","Ajouter le beurre fondu. Laisser reposer 1 heure.","Cuire les crêpes dans une poêle beurrée bien chaude.","Garnir selon vos envies : sucre, Nutella, confiture, citron…"}'
),
(
  'Ratatouille', 6, 60,
  '{"légumes","été","français"}',
  '[{"name":"Aubergines","qty":2,"unit":""},{"name":"Courgettes","qty":2,"unit":""},{"name":"Poivrons","qty":2,"unit":""},{"name":"Tomates","qty":4,"unit":""},{"name":"Oignon","qty":1,"unit":""},{"name":"Ail","qty":3,"unit":"gousses"},{"name":"Huile d''olive","qty":4,"unit":"c. à soupe"},{"name":"Herbes de Provence","qty":1,"unit":"c. à soupe"}]'::jsonb,
  '{"Couper tous les légumes en dés de taille similaire.","Faire revenir l''oignon et l''ail dans l''huile d''olive.","Ajouter les poivrons, cuire 5 minutes.","Ajouter aubergines et courgettes, cuire 10 minutes.","Ajouter les tomates et les herbes de Provence.","Couvrir et laisser mijoter 30 minutes à feu doux. Saler, poivrer."}'
),
(
  'Dahl de Lentilles Corail au Lait de Coco', 4, 35,
  '{"indien","végétarien","lentilles","réconfortant"}',
  '[{"name":"Lentilles corail","qty":300,"unit":"g"},{"name":"Lait de coco","qty":400,"unit":"mL"},{"name":"Oignon","qty":1,"unit":""},{"name":"Ail","qty":3,"unit":"gousses"},{"name":"Gingembre frais","qty":3,"unit":"cm"},{"name":"Tomates concassées","qty":400,"unit":"g"},{"name":"Curcuma","qty":1,"unit":"c. à café"},{"name":"Cumin","qty":1,"unit":"c. à café"},{"name":"Curry","qty":1,"unit":"c. à soupe"},{"name":"Huile d''olive","qty":2,"unit":"c. à soupe"},{"name":"Coriandre fraîche","qty":1,"unit":"bouquet"},{"name":"Jus de citron","qty":1,"unit":"c. à soupe"},{"name":"Sel","qty":1,"unit":"pincée"}]'::jsonb,
  '{"Rincer les lentilles corail à l''eau froide et égoutter.","Émincer l''oignon, hacher l''ail et râper le gingembre.","Dans une grande casserole, faire chauffer l''huile et faire revenir l''oignon 3 minutes.","Ajouter l''ail, le gingembre, le curcuma, le cumin et le curry. Mélanger 1 minute.","Ajouter les lentilles, les tomates concassées et 400 mL d''eau. Porter à ébullition.","Réduire le feu, couvrir et laisser mijoter 15 minutes en remuant de temps en temps.","Verser le lait de coco, mélanger et poursuivre la cuisson 5 minutes.","Saler, ajouter le jus de citron. Parsemer de coriandre fraîche. Servir avec du riz basmati."}'
);
