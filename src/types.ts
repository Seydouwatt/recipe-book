export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  servings: number;
  prep_time: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  author_id: string | null;
  forked_from_id: string | null;
  moderated: boolean;
  created_at: string;
  updated_at: string;
}

export type RecipeInsert = Omit<Recipe, "id" | "created_at" | "updated_at">;
