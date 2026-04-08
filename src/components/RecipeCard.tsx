import { Link } from "react-router-dom";
import type { Recipe } from "../types";
import FavoriteButton from "./FavoriteButton";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-md transition-shadow hover:shadow-lg active:shadow-sm">
      <Link to={`/recipes/${recipe.id}`} className="block">
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-36 w-full object-cover"
          />
        )}
        <div className="p-4 pr-12">
          <h3 className="text-lg font-bold text-amber-900">{recipe.title}</h3>
          <p className="mt-1 text-sm text-amber-600">
            {recipe.prep_time} min · {recipe.servings} pers.
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3">
        <FavoriteButton recipeId={recipe.id} />
      </div>
    </div>
  );
}
