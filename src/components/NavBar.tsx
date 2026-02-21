import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useRecipeStore } from "../stores/recipeStore";

const MASTER_FOOD_ID = "ad2ea0c7-7d56-4652-b84c-d2637343cf12";

export default function NavBar() {
  const user = useAuthStore((s) => s.user);
  const recipes = useRecipeStore((s) => s.recipes);
  const { pathname } = useLocation();

  const isMasterFood = user?.id === MASTER_FOOD_ID;

  const unmoderatedCount = useMemo(
    () =>
      isMasterFood
        ? recipes.filter((r) => r.author_id === MASTER_FOOD_ID && !r.moderated).length
        : 0,
    [recipes, isMasterFood],
  );

  const link = (to: string, label: string, badge?: number) => (
    <Link
      to={to}
      className={`relative flex flex-1 flex-col items-center py-2 text-xs font-medium transition-colors ${
        pathname === to ? "text-amber-600" : "text-amber-400"
      }`}
    >
      {label}
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-amber-200 bg-white safe-bottom">
      {link("/recipes", "Recettes")}
      {user && link("/my-recipes", "Mes recettes")}
      {user && link("/favorites", "Favoris")}
      {isMasterFood && link("/moderation", "Moderation", unmoderatedCount)}
      {link(user ? "/profile" : "/login", user ? "Profil" : "Connexion")}
    </nav>
  );
}
