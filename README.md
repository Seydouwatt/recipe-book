# Mon Livre de Recettes

Application mobile-first de livre de recettes en SPA + PWA avec authentification Supabase.

## Fonctionnalités

- Consulter toutes les recettes (public, sans login)
- Recherche par texte et filtrage par tags
- Recalcul des quantités selon le nombre de personnes
- Créer, modifier, supprimer ses recettes (login requis)
- Dupliquer et modifier une recette d'un autre auteur (fork)
- Ajouter des recettes en favoris
- Section "Mes recettes" et "Favoris"
- Authentification email/mot de passe + Google OAuth
- Fonctionne offline (PWA installable)

## Stack

- React + TypeScript + Vite
- Zustand (state management)
- Supabase (Auth + Postgres + RLS)
- Tailwind CSS
- vite-plugin-pwa

## Setup

### 1. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. SQL Editor → exécuter `supabase/migrations/001_init.sql`
3. Auth > Providers > activer Google OAuth (optionnel)
4. Auth > URL Configuration > ajouter `http://localhost:5173`

### 2. Variables d'environnement

```bash
cp .env.example .env
```

Remplir `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec les valeurs du projet Supabase.

### 3. Lancer

```bash
npm install
npm run dev
```

## Scripts

| Commande          | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Serveur dev (port 5173)  |
| `npm run build`   | Build production         |
| `npm run preview` | Preview du build         |
| `npm run lint`    | Lint ESLint              |

## Structure

```
src/
├── lib/supabase.ts              # Client Supabase
├── stores/
│   ├── authStore.ts             # Auth (login, signup, Google)
│   ├── recipeStore.ts           # CRUD recettes + fork
│   └── favoriteStore.ts         # Gestion favoris
├── pages/
│   ├── RecipeList.tsx           # Liste + recherche + filtres
│   ├── RecipeDetail.tsx         # Détail + scaling portions
│   ├── RecipeForm.tsx           # Création / édition
│   ├── LoginPage.tsx            # Login / Signup
│   ├── ProfilePage.tsx          # Profil + déconnexion
│   ├── MyRecipes.tsx            # Mes recettes
│   └── Favorites.tsx            # Mes favoris
├── components/
│   ├── AuthGuard.tsx            # Protection routes
│   ├── NavBar.tsx               # Navigation bottom
│   ├── FavoriteButton.tsx       # Toggle favori
│   ├── RecipeCard.tsx           # Carte recette
│   ├── SearchBar.tsx            # Barre de recherche
│   ├── TagFilter.tsx            # Filtres tags
│   ├── IngredientInput.tsx      # Form ingrédients
│   └── StepInput.tsx            # Form étapes
└── types.ts                     # Interfaces TypeScript
```
