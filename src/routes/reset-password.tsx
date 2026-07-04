import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Nav } from "@/components/site/Nav";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Trade Rise FX" }] }),
  component: ResetPasswordPage,
});

type Phase = "verifying" | "invalid" | "form" | "success";

function scorePassword(pw: string): { score: number; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score: s, label: labels[s] };
}

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("verifying");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const recoveryReady = useRef(false);
  const usedRef = useRef(false);

  // Verify the recovery link. Supabase parses the hash and emits PASSWORD_RECOVERY.
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const qs = typeof window !== "undefined" ? window.location.search : "";

    // Surface server-reported errors (e.g. ?error=access_denied&error_code=otp_expired)
    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(qs);
    const errCode =
      hashParams.get("error_code") ||
      queryParams.get("error_code") ||
      hashParams.get("error") ||
      queryParams.get("error");
    if (errCode) {
      setErrorMsg(
        errCode.includes("expired")
          ? "This reset link has expired. Reset links are valid for a short time only."
          : "This reset link is invalid or has already been used."
      );
      setPhase("invalid");
      return;
    }

    if (!hash.includes("type=recovery") && !queryParams.get("code")) {
      setErrorMsg("This page can only be opened from a password reset email.");
      setPhase("invalid");
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryReady.current = true;
        setPhase("form");
      }
    });

    // Fallback check in case the event already fired before subscribe
    const timer = setTimeout(async () => {
      if (recoveryReady.current) return;
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setErrorMsg("This reset link has expired or is no longer valid.");
        setPhase("invalid");
      } else {
        setPhase("form");
      }
    }, 1200);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const strength = scorePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usedRef.current) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (strength.score < 3) {
      toast.error("Please choose a stronger password (mix letters, numbers, symbols).");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      // HIBP and other server-side validation errors surface here
      toast.error(error.message);
      return;
    }
    usedRef.current = true;
    setPhase("success");
    // Invalidate the recovery session so the link cannot be reused
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-28 pb-16 px-6">
        <div className="max-w-md mx-auto rounded-2xl border border-border bg-card/50 p-8">
          {phase === "verifying" && (
            <div className="text-center py-8">
              <Loader2 size={32} className="mx-auto animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Verifying your reset link…</p>
            </div>
          )}

          {phase === "invalid" && (
            <div className="text-center py-4">
              <AlertTriangle size={40} className="mx-auto text-destructive" />
              <h2 className="mt-4 text-xl font-semibold">Link expired or invalid</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {errorMsg || "This password reset link is no longer valid."} For your security,
                reset links expire shortly after they're sent and can only be used once.
              </p>
              <Link
                to="/auth"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold-gradient text-primary-foreground font-semibold px-6 py-2.5 text-sm"
              >
                Request new link
              </Link>
            </div>
          )}

          {phase === "form" && (
            <>
              <div className="flex items-center gap-2 text-xs text-emerald-500">
                <ShieldCheck size={14} /> Secure recovery session verified
              </div>
              <h1 className="mt-2 text-2xl font-bold">Set a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a strong password. You&apos;ll be signed out and need to sign in again with
                your new credentials.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <input
                  type="password"
                  placeholder="New password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  className="w-full h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-gold/60 transition"
                />
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition ${
                            i < strength.score
                              ? strength.score <= 2
                                ? "bg-destructive"
                                : strength.score === 3
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                              : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Strength: {strength.label}</p>
                  </div>
                )}
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-gold/60 transition"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 rounded-lg bg-gold-gradient text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {busy && <Loader2 size={16} className="animate-spin" />} Update password
                </button>
              </form>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Passwords are checked against known breach databases. Compromised passwords will
                be rejected.
              </p>
              <Link to="/auth" className="mt-4 block text-xs text-center text-muted-foreground hover:text-foreground">
                Back to sign in
              </Link>
            </>
          )}

          {phase === "success" && (
            <div className="text-center py-4">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <h2 className="mt-4 text-xl font-semibold">Password updated</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your password has been changed and the reset link has been invalidated. Please
                sign in with your new credentials.
              </p>
              <Link
                to="/auth"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold-gradient text-primary-foreground font-semibold px-6 py-2.5 text-sm"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
