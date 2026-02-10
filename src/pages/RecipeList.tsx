import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useRecipeStore } from "../stores/recipeStore";
import SearchBar from "../components/SearchBar";
import TagFilter from "../components/TagFilter";
import RecipeCard from "../components/RecipeCard";

export default function RecipeList() {
  const user = useAuthStore((s) => s.user);
  const recipes = useRecipeStore((s) => s.recipes);
  const searchQuery = useRecipeStore((s) => s.searchQuery);
  const selectedTags = useRecipeStore((s) => s.selectedTags);

  const filtered = useMemo(() => {
    let result = recipes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (selectedTags.length > 0) {
      result = result.filter((r) =>
        selectedTags.every((t) => r.tags.includes(t)),
      );
    }
    return result;
  }, [recipes, searchQuery, selectedTags]);

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-4 text-2xl font-bold text-amber-900">
        Mon Livre de Recettes
      </h1>
      <div className="space-y-3">
        <SearchBar />
        <TagFilter />
      </div>
      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-amber-600">
            Aucune recette trouvée.
          </p>
        ) : (
          filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>
      {user && (
        <Link
          to="/recipes/new"
          className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl font-bold text-white shadow-lg active:bg-amber-600"
        >
          +
        </Link>
      )}
    </div>
  );
}
