# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server on port 5173
npm run build     # tsc -b + vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite is configured.

## Environment

Copy `.env.example` to `.env` and fill in:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Architecture

**React + TypeScript + Vite SPA/PWA**, using **HashRouter** (all routes are `#/...`).

### State management (Zustand stores)

- `authStore` — session, user, login/signup/Google OAuth. `initialize()` subscribes to Supabase auth events and returns an unsubscribe function (called in `App.tsx` useEffect cleanup).
- `recipeStore` — full recipe list, search/tag filter state, CRUD, fork, and moderation actions. Every mutating action re-fetches all recipes via `loadRecipes()`.
- `favoriteStore` — favorite IDs for the current user + global counts per recipe. `toggleFavorite` optimistically updates local state before the Supabase call.

### Data layer

Single Supabase client at `src/lib/supabase.ts`. All DB access goes through the Zustand stores — pages never call Supabase directly.

**Tables:**
- `recipes` — core recipe data with RLS (public read, auth-restricted write). `moderated: boolean` flags whether a recipe is visible/approved.
- `favorites` — (user_id, recipe_id) join table with RLS scoped to current user.

`RecipeInsert` (in `types.ts`) omits `id`, `created_at`, `updated_at`, and `moderated` from `Recipe`.

### Moderation flow

A special system account (`MASTER_FOOD_ID = "ad2ea0c7-7d56-4652-b84c-d2637343cf12"`) is used to import recipes via a **Deno Edge Function** (`supabase/functions/import-recipes/index.ts`). The function runs weekly (cron via `pg_cron` + `pg_net`, see `supabase/migrations/002_cron_import.sql`), reads up to 200 recipes from a Supabase Storage bucket (`recipes-pool/recipes.json`), inserts them with `moderated: false`, and marks them as imported in the JSON.

The `/moderation` route (`ModerationPage.tsx`) is only accessible to the MASTER_FOOD_ID user and shows all unmoderated recipes for validation, editing, or deletion.

### Routing

Routes are defined in `App.tsx`. Protected routes are wrapped in `<AuthGuard>`. The bottom `<NavBar>` is always rendered outside the Routes.

### Styling

Tailwind CSS v4 loaded via `@tailwindcss/vite` plugin (no `tailwind.config.js`). Color palette is amber-based (`bg-amber-50`, `text-amber-900`, etc.).
