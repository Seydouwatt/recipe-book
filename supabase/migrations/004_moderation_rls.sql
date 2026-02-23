-- Mise à jour de la policy de lecture des recettes
-- Les recettes de Master-food (importées automatiquement) ne sont visibles par les autres
-- utilisateurs que si elles ont été validées (moderated = true).

DROP POLICY "Lecture publique" ON recipes;

CREATE POLICY "Lecture publique" ON recipes FOR SELECT USING (
  -- Recettes utilisateurs normaux + seeds (author_id IS NULL) : toujours visibles
  (author_id IS DISTINCT FROM 'ad2ea0c7-7d56-4652-b84c-d2637343cf12')
  -- Recettes Master-food modérées : visibles par tous
  OR (moderated = true)
  -- Master-food lui-même : voit toutes ses recettes pour pouvoir les modérer
  OR (auth.uid() = 'ad2ea0c7-7d56-4652-b84c-d2637343cf12')
);
