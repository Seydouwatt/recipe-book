import { useAuthStore } from "../stores/authStore";
import { useFavoriteStore } from "../stores/favoriteStore";

export default function FavoriteButton({ recipeId }: { recipeId: string }) {
  const user = useAuthStore((s) => s.user);
  const favoriteIds = useFavoriteStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  if (!user) return null;

  const isFav = favoriteIds.includes(recipeId);

  return (
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
  );
}
