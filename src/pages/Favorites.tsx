import { useMemo } from "react";
import { useRecipeStore } from "../stores/recipeStore";
import { useFavoriteStore } from "../stores/favoriteStore";
import RecipeCard from "../components/RecipeCard";

export default function Favorites() {
  const recipes = useRecipeStore((s) => s.recipes);
  const favoriteIds = useFavoriteStore((s) => s.favoriteIds);

  const favoriteRecipes = useMemo(
    () => recipes.filter((r) => favoriteIds.includes(r.id)),
    [recipes, favoriteIds],
  );

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-4 text-2xl font-bold text-amber-900">Mes favoris</h1>

      <div className="space-y-3">
        {favoriteRecipes.length === 0 ? (
          <p className="py-8 text-center text-amber-600">
            Aucun favori pour le moment.
          </p>
        ) : (
          favoriteRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>
    </div>
  );
}
