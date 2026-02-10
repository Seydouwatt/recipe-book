import { useRecipeStore } from "../stores/recipeStore";

export default function SearchBar() {
  const searchQuery = useRecipeStore((s) => s.searchQuery);
  const setSearch = useRecipeStore((s) => s.setSearch);

  return (
    <input
      type="text"
      placeholder="Rechercher une recette…"
      value={searchQuery}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-lg shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
    />
  );
}
