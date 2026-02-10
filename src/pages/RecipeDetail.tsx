import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useRecipeStore } from "../stores/recipeStore";
import FavoriteButton from "../components/FavoriteButton";
import type { Recipe } from "../types";

function formatQty(qty: number): string {
  const rounded = Math.round(qty * 100) / 100;
  if (rounded === Math.floor(rounded)) return String(rounded);
  return rounded.toFixed(1).replace(/\.0$/, "");
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const recipes = useRecipeStore((s) => s.recipes);
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe);
  const forkRecipe = useRecipeStore((s) => s.forkRecipe);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [servings, setServings] = useState(4);
  const [forking, setForking] = useState(false);

  useEffect(() => {
    const found = recipes.find((r) => r.id === id);
    setRecipe(found ?? null);
    if (found) setServings(found.servings);
  }, [recipes, id]);

  const isAuthor = user && recipe && recipe.author_id === user.id;
  const ratio = recipe ? servings / recipe.servings : 1;

  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) => ({
      ...ing,
      qty: ing.qty * ratio,
    }));
  }, [recipe, ratio]);

  const forkedFromRecipe = useMemo(() => {
    if (!recipe?.forked_from_id) return null;
    return recipes.find((r) => r.id === recipe.forked_from_id) ?? null;
  }, [recipe, recipes]);

  if (!recipe) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6">
        <p className="text-amber-600">Recette introuvable.</p>
        <Link to="/recipes" className="mt-4 inline-block text-amber-500 underline">
          Retour
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteRecipe(recipe.id);
    navigate("/recipes");
  };

  const handleFork = async () => {
    if (!user) return;
    setForking(true);
    const newId = await forkRecipe(recipe.id, user.id);
    if (newId) navigate(`/recipes/${newId}/edit`);
    setForking(false);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <Link to="/recipes" className="mb-4 inline-block font-medium text-amber-500">
        ← Retour
      </Link>

      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-amber-900">{recipe.title}</h1>
        <FavoriteButton recipeId={recipe.id} />
      </div>
      <p className="mt-1 text-amber-600">{recipe.prep_time} min de préparation</p>

      {forkedFromRecipe && (
        <p className="mt-1 text-sm text-amber-500">
          Inspirée de{" "}
          <Link
            to={`/recipes/${forkedFromRecipe.id}`}
            className="font-medium underline"
          >
            {forkedFromRecipe.title}
          </Link>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1">
        {recipe.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700"
          >
            {tag}
          </span>
        ))}
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-amber-800">Ingrédients</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200 text-lg font-bold text-amber-800 active:bg-amber-300"
            >
              −
            </button>
            <span className="min-w-[3rem] text-center text-lg font-bold text-amber-900">
              {servings} <span className="text-sm font-normal">pers.</span>
            </span>
            <button
              onClick={() => setServings(servings + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200 text-lg font-bold text-amber-800 active:bg-amber-300"
            >
              +
            </button>
          </div>
        </div>
        <ul className="mt-2 space-y-1">
          {scaledIngredients.map((ing, i) => (
            <li key={i} className="flex gap-2 text-amber-900">
              <span className="font-medium">
                {ing.qty > 0 && formatQty(ing.qty)} {ing.unit}
              </span>
              <span>{ing.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-amber-800">Préparation</h2>
        <ol className="mt-2 space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-amber-900">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {user && (
        <div className="mt-8 flex gap-3">
          {isAuthor ? (
            <>
              <Link
                to={`/recipes/${recipe.id}/edit`}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-center text-lg font-bold text-white active:bg-amber-600"
              >
                Modifier
              </Link>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex-1 rounded-xl bg-red-100 py-3 text-lg font-bold text-red-600 active:bg-red-200"
                >
                  Supprimer
                </button>
              ) : (
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-lg font-bold text-white active:bg-red-600"
                >
                  Confirmer
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleFork}
              disabled={forking}
              className="flex-1 rounded-xl bg-amber-500 py-3 text-center text-lg font-bold text-white active:bg-amber-600 disabled:opacity-50"
            >
              {forking ? "Duplication…" : "Dupliquer et modifier"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
