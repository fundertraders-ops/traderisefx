import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Nav } from "@/components/site/Nav";
import { captureRefFromUrl, getStoredRef, clearStoredRef } from "@/lib/referral";
import { trackEvent } from "@/lib/analytics";

const search = z.object({
  ref: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => search.parse(s),
  head: () => ({ meta: [{ title: "Sign in — Trade Rise FX" }] }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, "Enter your name").max(80),
});

function AuthPage() {
  const navigate = useNavigate();
  const s = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">(s.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    captureRefFromUrl();
    if (s.ref) {
      try { localStorage.setItem("traderise_ref", s.ref.toUpperCase()); } catch {}
    }
  }, [s.ref]);

  // Only allow same-origin relative paths to prevent open-redirect phishing.
  const safeRedirect = (() => {
    const r = s.redirect;
    if (typeof r !== "string") return "/dashboard";
    if (!r.startsWith("/") || r.startsWith("//") || r.startsWith("/\\")) return "/dashboard";
    return r;
  })();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate({ to: safeRedirect });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, safeRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const r = signUpSchema.safeParse({ email, password, fullName });
        if (!r.success) { toast.error(r.error.issues[0].message); return; }
        const ref = getStoredRef();
        const { error } = await supabase.auth.signUp({
          email: r.data.email,
          password: r.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: r.data.fullName, ref: ref ?? undefined },
          },
        });
        if (error) throw error;
        clearStoredRef();
        trackEvent("sign_up", { method: "email", has_referral: !!ref });
        toast.success("Account created. Check your email to confirm.");
      } else {
        const r = signInSchema.safeParse({ email, password });
        if (!r.success) { toast.error(r.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword(r.data);
        if (error) throw error;
        trackEvent("login", { method: "email" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) { toast.error(result.error.message ?? "Google sign-in failed"); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) { toast.error("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Check your inbox for a reset link");
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-28 pb-16 px-6">
        <div className="max-w-md mx-auto rounded-2xl border border-border bg-card/50 p-8">
          <div className="flex gap-2 p-1 rounded-lg bg-background border border-border mb-6">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} type="button"
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                  mode === m ? "bg-gold-gradient text-primary-foreground" : "text-muted-foreground"
                }`}>
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to access your dashboard." : "Join free — earn 10% on every referral."}
          </p>

          <button type="button" onClick={handleGoogle} disabled={busy}
            className="mt-6 w-full h-11 rounded-lg border border-border hover:border-gold/40 transition inline-flex items-center justify-center gap-2 text-sm font-medium">
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex-1 h-px bg-border" /> OR <span className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input className={inputCls} placeholder="Full name" value={fullName}
                onChange={(e) => setFullName(e.target.value)} />
            )}
            <input className={inputCls} placeholder="Email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} />
            <input className={inputCls} placeholder="Password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" disabled={busy}
              className="w-full h-11 rounded-lg bg-gold-gradient text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {busy && <Loader2 size={16} className="animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "signin" && (
            <button type="button" onClick={handleReset}
              className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground">
              Forgot your password?
            </button>
          )}

          <p className="mt-6 text-xs text-muted-foreground text-center">
            By continuing you agree to our terms. <Link to="/" className="underline">Back home</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

const inputCls = "w-full h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-gold/60 transition";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.45.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
  );
}
