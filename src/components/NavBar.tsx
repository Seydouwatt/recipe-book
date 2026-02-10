import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function NavBar() {
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();

  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={`flex flex-1 flex-col items-center py-2 text-xs font-medium transition-colors ${
        pathname === to ? "text-amber-600" : "text-amber-400"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-amber-200 bg-white safe-bottom">
      {link("/recipes", "Recettes")}
      {user && link("/my-recipes", "Mes recettes")}
      {user && link("/favorites", "Favoris")}
      {link(user ? "/profile" : "/login", user ? "Profil" : "Connexion")}
    </nav>
  );
}
