import { useAuthStore } from "../stores/authStore";
import { useFavoriteStore } from "../stores/favoriteStore";

export default function FavoriteButton({ recipeId }: { recipeId: string }) {
  const user = useAuthStore((s) => s.user);
  const favoriteIds = useFavoriteStore((s) => s.favoriteIds);
  const favoriteCounts = useFavoriteStore((s) => s.favoriteCounts);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const count = favoriteCounts[recipeId] || 0;
  const isFav = user ? favoriteIds.includes(recipeId) : false;

  return (
    <div className="flex items-center gap-1">
      {user && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(user.id, recipeId);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl active:scale-90"
          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          {isFav ? "❤️" : "🤍"}
        </button>
      )}
      {count > 0 && (
        <span className="text-sm font-medium text-amber-600">{count}</span>
      )}
    </div>
  );
}
