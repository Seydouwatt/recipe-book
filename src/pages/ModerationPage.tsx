import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useRecipeStore } from "../stores/recipeStore";

const MASTER_FOOD_ID = "ad2ea0c7-7d56-4652-b84c-d2637343cf12";

export default function ModerationPage() {
  const user = useAuthStore((s) => s.user);
  const recipes = useRecipeStore((s) => s.recipes);
  const moderateRecipe = useRecipeStore((s) => s.moderateRecipe);
  const moderateAll = useRecipeStore((s) => s.moderateAll);
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe);

  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  if (!user || user.id !== MASTER_FOOD_ID) {
    return <Navigate to="/recipes" replace />;
  }

  const unmoderated = useMemo(
    () =>
      recipes
        .filter((r) => r.author_id === MASTER_FOOD_ID && !r.moderated)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [recipes],
  );

  const handleValidate = async (id: string) => {
    setBusyIds((prev) => new Set(prev).add(id));
    await moderateRecipe(id);
    setBusyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    setBusyIds((prev) => new Set(prev).add(id));
    await deleteRecipe(id);
    setBusyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleValidateAll = async () => {
    if (!confirm(`Valider les ${unmoderated.length} recettes ?`)) return;
    setBulkBusy(true);
    await moderateAll(unmoderated.map((r) => r.id));
    setBulkBusy(false);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-2 text-2xl font-bold text-amber-900">Moderation</h1>
      <p className="mb-4 text-sm text-amber-600">
        {unmoderated.length} recette{unmoderated.length !== 1 ? "s" : ""} a moderer
      </p>

      {unmoderated.length > 0 && (
        <button
          onClick={handleValidateAll}
          disabled={bulkBusy}
          className="mb-4 w-full rounded-xl bg-green-600 py-2 text-sm font-semibold text-white active:bg-green-700 disabled:opacity-50"
        >
          {bulkBusy ? "Validation en cours..." : `Tout valider (${unmoderated.length})`}
        </button>
      )}

      <div className="space-y-3">
        {unmoderated.length === 0 ? (
          <p className="py-8 text-center text-amber-600">
            Aucune recette a moderer.
          </p>
        ) : (
          unmoderated.map((recipe) => {
            const busy = busyIds.has(recipe.id);
            return (
              <div
                key={recipe.id}
                className={`rounded-2xl bg-white p-4 shadow-md ${busy ? "opacity-50" : ""}`}
              >
                <h3 className="text-lg font-bold text-amber-900">{recipe.title}</h3>
                <p className="mt-1 text-sm text-amber-600">
                  {recipe.prep_time} min · {recipe.ingredients.length} ing. · {recipe.steps.length} etapes
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-amber-400 line-clamp-1">
                  {recipe.ingredients.slice(0, 4).map((i) => i.name).join(", ")}
                  {recipe.ingredients.length > 4 ? "..." : ""}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleValidate(recipe.id)}
                    disabled={busy}
                    className="flex-1 rounded-lg bg-green-600 py-1.5 text-sm font-medium text-white active:bg-green-700 disabled:opacity-50"
                  >
                    Valider
                  </button>
                  <Link
                    to={`/recipes/${recipe.id}/edit?moderation=1`}
                    className="flex-1 rounded-lg bg-amber-500 py-1.5 text-center text-sm font-medium text-white active:bg-amber-600"
                  >
                    Editer
                  </Link>
                  <button
                    onClick={() => handleDelete(recipe.id, recipe.title)}
                    disabled={busy}
                    className="flex-1 rounded-lg bg-red-500 py-1.5 text-sm font-medium text-white active:bg-red-600 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
