import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  if (user) return <Navigate to="/recipes" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp) {
      const err = await signUp(email, password);
      if (err) {
        setError(err);
      } else {
        setSignUpSuccess(true);
      }
    } else {
      const err = await signIn(email, password);
      if (err) {
        setError(err);
      } else {
        navigate("/recipes");
      }
    }
    setLoading(false);
  };

  if (signUpSuccess) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4">
        <div className="w-full rounded-2xl bg-white p-6 shadow-md">
          <h2 className="mb-2 text-xl font-bold text-amber-900">
            Inscription réussie
          </h2>
          <p className="text-amber-700">
            Un email de confirmation a été envoyé. Vérifiez votre boîte mail
            puis connectez-vous.
          </p>
          <button
            onClick={() => {
              setSignUpSuccess(false);
              setIsSignUp(false);
            }}
            className="mt-4 w-full rounded-xl bg-amber-500 py-3 text-lg font-bold text-white active:bg-amber-600"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl bg-white p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-amber-900">
          {isSignUp ? "Créer un compte" : "Connexion"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-amber-200 px-4 py-3 text-lg"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-amber-200 px-4 py-3 text-lg"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 py-3 text-lg font-bold text-white active:bg-amber-600 disabled:opacity-50"
          >
            {loading
              ? "Chargement…"
              : isSignUp
                ? "S'inscrire"
                : "Se connecter"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-amber-200" />
          <span className="text-sm text-amber-400">ou</span>
          <div className="h-px flex-1 bg-amber-200" />
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full rounded-xl border border-amber-200 py-3 text-lg font-medium text-amber-800 active:bg-amber-50"
        >
          Continuer avec Google
        </button>

        <p className="mt-4 text-center text-sm text-amber-600">
          {isSignUp ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="font-bold text-amber-500 underline"
          >
            {isSignUp ? "Se connecter" : "S'inscrire"}
          </button>
        </p>
      </div>
    </div>
  );
}
