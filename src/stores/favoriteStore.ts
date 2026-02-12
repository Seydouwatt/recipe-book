import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface FavoriteState {
  favoriteIds: string[];
  favoriteCounts: Record<string, number>;
  loading: boolean;
  loadFavorites: (userId: string) => Promise<void>;
  loadFavoriteCounts: () => Promise<void>;
  toggleFavorite: (userId: string, recipeId: string) => Promise<void>;
  clear: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favoriteIds: [],
  favoriteCounts: {},
  loading: false,

  loadFavorites: async (userId) => {
    set({ loading: true });
    const { data } = await supabase
      .from("favorites")
      .select("recipe_id")
      .eq("user_id", userId);

    const ids = data?.map((f) => f.recipe_id) ?? [];
    set({ favoriteIds: ids, loading: false });
  },

  loadFavoriteCounts: async () => {
    const { data } = await supabase
      .from("favorites")
      .select("recipe_id");

    const counts: Record<string, number> = {};
    if (data) {
      for (const row of data) {
        counts[row.recipe_id] = (counts[row.recipe_id] || 0) + 1;
      }
    }
    set({ favoriteCounts: counts });
  },

  toggleFavorite: async (userId, recipeId) => {
    const { favoriteIds, favoriteCounts } = get();
    const isFav = favoriteIds.includes(recipeId);
    const currentCount = favoriteCounts[recipeId] || 0;

    if (isFav) {
      set({
        favoriteIds: favoriteIds.filter((id) => id !== recipeId),
        favoriteCounts: { ...favoriteCounts, [recipeId]: Math.max(0, currentCount - 1) },
      });
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("recipe_id", recipeId);
    } else {
      set({
        favoriteIds: [...favoriteIds, recipeId],
        favoriteCounts: { ...favoriteCounts, [recipeId]: currentCount + 1 },
      });
      await supabase
        .from("favorites")
        .insert({ user_id: userId, recipe_id: recipeId });
    }
  },

  clear: () => set({ favoriteIds: [], favoriteCounts: {} }),
}));
