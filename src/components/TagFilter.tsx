import { useRecipeStore } from "../stores/recipeStore";

export default function TagFilter() {
  const allTags = useRecipeStore((s) => s.allTags);
  const selectedTags = useRecipeStore((s) => s.selectedTags);
  const toggleTag = useRecipeStore((s) => s.toggleTag);

  if (allTags.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedTags.includes(tag)
              ? "bg-amber-500 text-white"
              : "border border-amber-200 bg-white text-amber-800"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
