import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { useRecipeStore } from "./stores/recipeStore";
import { useFavoriteStore } from "./stores/favoriteStore";
import NavBar from "./components/NavBar";
import AuthGuard from "./components/AuthGuard";
import RecipeList from "./pages/RecipeList";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeForm from "./pages/RecipeForm";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import MyRecipes from "./pages/MyRecipes";
import Favorites from "./pages/Favorites";
import ModerationPage from "./pages/ModerationPage";

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const loadRecipes = useRecipeStore((s) => s.loadRecipes);
  const loadFavorites = useFavoriteStore((s) => s.loadFavorites);
  const loadFavoriteCounts = useFavoriteStore((s) => s.loadFavoriteCounts);

  useEffect(() => {
    const unsub = initialize();
    return unsub;
  }, [initialize]);

  useEffect(() => {
    loadRecipes();
    loadFavoriteCounts();
  }, [loadRecipes, loadFavoriteCounts]);

  useEffect(() => {
    if (user) loadFavorites(user.id);
  }, [user, loadFavorites]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <p className="text-lg text-amber-600">Chargement…</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-amber-50 pb-16">
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<RecipeList />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route
            path="/recipes/new"
            element={
              <AuthGuard>
                <RecipeForm />
              </AuthGuard>
            }
          />
          <Route
            path="/recipes/:id/edit"
            element={
              <AuthGuard>
                <RecipeForm />
              </AuthGuard>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />
          <Route
            path="/my-recipes"
            element={
              <AuthGuard>
                <MyRecipes />
              </AuthGuard>
            }
          />
          <Route
            path="/favorites"
            element={
              <AuthGuard>
                <Favorites />
              </AuthGuard>
            }
          />
          <Route
            path="/moderation"
            element={
              <AuthGuard>
                <ModerationPage />
              </AuthGuard>
            }
          />
        </Routes>
        <NavBar />
      </div>
    </HashRouter>
  );
}
