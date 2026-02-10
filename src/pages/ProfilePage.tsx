import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useFavoriteStore } from "../stores/favoriteStore";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const clearFavorites = useFavoriteStore((s) => s.clear);
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    clearFavorites();
    await signOut();
    navigate("/recipes");
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-amber-900">Mon profil</h1>

      <div className="rounded-2xl bg-white p-4 shadow-md">
        <p className="text-amber-800">
          <span className="font-medium">Email :</span> {user.email}
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 w-full rounded-xl bg-red-100 py-3 text-lg font-bold text-red-600 active:bg-red-200"
      >
        Se déconnecter
      </button>
    </div>
  );
}
