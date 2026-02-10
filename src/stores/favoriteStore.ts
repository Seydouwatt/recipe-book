import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface FavoriteState {
  favoriteIds: string[];
  loading: boolean;
  loadFavorites: (userId: string) => Promise<void>;
  toggleFavorite: (userId: string, recipeId: string) => Promise<void>;
  clear: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favoriteIds: [],
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

  toggleFavorite: async (userId, recipeId) => {
    const { favoriteIds } = get();
    const isFav = favoriteIds.includes(recipeId);

    if (isFav) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("recipe_id", recipeId);
      set({ favoriteIds: favoriteIds.filter((id) => id !== recipeId) });
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: userId, recipe_id: recipeId });
      set({ favoriteIds: [...favoriteIds, recipeId] });
    }
  },

  clear: () => set({ favoriteIds: [] }),
}));
