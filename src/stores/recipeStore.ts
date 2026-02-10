import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Recipe, RecipeInsert } from "../types";

interface RecipeState {
  recipes: Recipe[];
  searchQuery: string;
  selectedTags: string[];
  allTags: string[];
  loading: boolean;
  loadRecipes: () => Promise<void>;
  addRecipe: (data: RecipeInsert) => Promise<string | null>;
  updateRecipe: (id: string, data: Partial<RecipeInsert>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  forkRecipe: (
    id: string,
    userId: string,
  ) => Promise<string | null>;
  setSearch: (query: string) => void;
  toggleTag: (tag: string) => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  searchQuery: "",
  selectedTags: [],
  allTags: [],
  loading: false,

  loadRecipes: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    const recipes = (data as Recipe[]) ?? [];
    const allTags = [...new Set(recipes.flatMap((r) => r.tags))].sort();
    set({ recipes, allTags, loading: false });
  },

  addRecipe: async (data) => {
    const { data: result, error } = await supabase
      .from("recipes")
      .insert(data)
      .select("id")
      .single();

    if (error) return null;
    await get().loadRecipes();
    return result.id;
  },

  updateRecipe: async (id, data) => {
    await supabase.from("recipes").update(data).eq("id", id);
    await get().loadRecipes();
  },

  deleteRecipe: async (id) => {
    await supabase.from("recipes").delete().eq("id", id);
    await get().loadRecipes();
  },

  forkRecipe: async (id, userId) => {
    const { data: original } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .single();

    if (!original) return null;

    const forked: RecipeInsert = {
      title: original.title,
      servings: original.servings,
      prep_time: original.prep_time,
      tags: original.tags,
      ingredients: original.ingredients,
      steps: original.steps,
      author_id: userId,
      forked_from_id: id,
    };

    const { data: result } = await supabase
      .from("recipes")
      .insert(forked)
      .select("id")
      .single();

    if (!result) return null;
    await get().loadRecipes();
    return result.id;
  },

  setSearch: (searchQuery) => set({ searchQuery }),

  toggleTag: (tag) => {
    const { selectedTags } = get();
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    set({ selectedTags: next });
  },
}));
