import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useRecipeStore } from "../stores/recipeStore";
import RecipeCard from "../components/RecipeCard";

export default function MyRecipes() {
  const user = useAuthStore((s) => s.user);
  const recipes = useRecipeStore((s) => s.recipes);

  const myRecipes = useMemo(
    () => recipes.filter((r) => r.author_id === user?.id),
    [recipes, user],
  );

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-4 text-2xl font-bold text-amber-900">Mes recettes</h1>

      <div className="space-y-3">
        {myRecipes.length === 0 ? (
          <p className="py-8 text-center text-amber-600">
            Vous n'avez pas encore créé de recette.
          </p>
        ) : (
          myRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>

      <Link
        to="/recipes/new"
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl font-bold text-white shadow-lg active:bg-amber-600"
      >
        +
      </Link>
    </div>
  );
}
