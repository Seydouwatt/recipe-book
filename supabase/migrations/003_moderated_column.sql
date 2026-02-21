-- Ajouter la colonne moderated aux recettes
ALTER TABLE recipes ADD COLUMN moderated boolean DEFAULT false;

-- Les recettes existantes (seed + manuelles) sont considérées comme modérées
UPDATE recipes SET moderated = true WHERE author_id != 'ad2ea0c7-7d56-4652-b84c-d2637343cf12' OR author_id IS NULL;

-- Les recettes importées par Master Food restent moderated = false
-- (elles seront modérées via la page /moderation)
