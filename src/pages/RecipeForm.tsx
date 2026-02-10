import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useRecipeStore } from "../stores/recipeStore";
import type { Ingredient } from "../types";
import IngredientInput from "../components/IngredientInput";
import StepInput from "../components/StepInput";

export default function RecipeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const recipes = useRecipeStore((s) => s.recipes);
  const addRecipe = useRecipeStore((s) => s.addRecipe);
  const updateRecipe = useRecipeStore((s) => s.updateRecipe);

  const isEdit = Boolean(id);

  const [title, setTitle] = useState("");
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState(0);
  const [tagsInput, setTagsInput] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", qty: 0, unit: "" },
  ]);
  const [steps, setSteps] = useState<string[]>([""]);

  useEffect(() => {
    if (isEdit) {
      const recipe = recipes.find((r) => r.id === id);
      if (recipe) {
        if (user && recipe.author_id !== user.id) {
          navigate("/recipes");
          return;
        }
        setTitle(recipe.title);
        setServings(recipe.servings);
        setPrepTime(recipe.prep_time);
        setTagsInput(recipe.tags.join(", "));
        setIngredients(recipe.ingredients);
        setSteps(recipe.steps);
      }
    }
  }, [id, isEdit, recipes, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (isEdit && id) {
      await updateRecipe(id, {
        title,
        servings,
        prep_time: prepTime,
        tags,
        ingredients,
        steps,
      });
      navigate(`/recipes/${id}`);
    } else {
      const newId = await addRecipe({
        title,
        servings,
        prep_time: prepTime,
        tags,
        ingredients,
        steps,
        author_id: user.id,
        forked_from_id: null,
      });
      if (newId) navigate(`/recipes/${newId}`);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <Link
        to={isEdit ? `/recipes/${id}` : "/recipes"}
        className="mb-4 inline-block font-medium text-amber-500"
      >
        ← Retour
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-amber-900">
        {isEdit ? "Modifier la recette" : "Nouvelle recette"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-amber-900">
            Titre
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-amber-200 px-4 py-3 text-lg"
            placeholder="Ex : Tarte aux pommes"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-amber-900">
              Personnes
            </label>
            <input
              type="number"
              required
              min={1}
              value={servings || ""}
              onChange={(e) => setServings(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-amber-200 px-4 py-3 text-lg"
              placeholder="4"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-amber-900">
              Temps (min)
            </label>
            <input
              type="number"
              required
              min={1}
              value={prepTime || ""}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-amber-200 px-4 py-3 text-lg"
              placeholder="30"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-amber-900">
            Tags (séparés par des virgules)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="mt-1 w-full rounded-xl border border-amber-200 px-4 py-3 text-lg"
            placeholder="dessert, chocolat, rapide"
          />
        </div>

        <IngredientInput ingredients={ingredients} onChange={setIngredients} />
        <StepInput steps={steps} onChange={setSteps} />

        <button
          type="submit"
          className="w-full rounded-xl bg-amber-500 py-4 text-lg font-bold text-white active:bg-amber-600"
        >
          {isEdit ? "Enregistrer" : "Créer la recette"}
        </button>
      </form>
    </div>
  );
}
