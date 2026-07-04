import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/site/ThemeToggle";

const links = [
  { to: "/challenges", label: "Challenges" },
  { to: "/instant", label: "Instant Funding" },
  { to: "/competition", label: "Competition" },
  { to: "/reviews", label: "Reviews" },
  { to: "/", hash: "how", label: "How It Works" },
  { to: "/", hash: "faq", label: "FAQ" },
] as const;

function LogoMark() {
  return (
    <span className="relative grid size-9 place-items-center rounded-2xl bg-gold-gradient shadow-[0_14px_35px_-18px_color-mix(in_oklab,var(--gold)_75%,transparent)]">
      <span className="absolute inset-1 rounded-xl border border-white/35" />
      <span className="h-0 w-0 border-l-[9px] border-r-[9px] border-t-[15px] border-l-transparent border-r-transparent border-t-white drop-shadow-sm" />
    </span>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/78 shadow-[0_10px_35px_-30px_rgba(40,60,120,.45)] backdrop-blur-2xl">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5 font-display text-[15px] font-extrabold tracking-tight">
          <LogoMark />
          <span className="leading-none">
            Trade Rise <span className="text-gold-gradient">FX</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/70 px-2 py-1 shadow-sm lg:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={"hash" in l ? l.hash : undefined}
              className="rounded-full px-3.5 py-2 text-[13px] font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground shadow-sm" }}
              activeOptions={{ exact: true }}
            >
              <span className="inline-flex items-center gap-1">
                {l.label}
                {l.label === "FAQ" && <ChevronDown size={12} className="opacity-60" />}
              </span>
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:border-gold/50 hover:text-foreground">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button onClick={signOut} className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:border-gold/50 hover:text-foreground">
                <LogOut size={15} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ mode: "signin" }} className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:border-gold/50 hover:text-foreground">
                Log in
              </Link>
              <Link to="/auth" search={{ mode: "signup" }} className="primary-button inline-flex h-10 items-center rounded-full px-5 text-sm font-bold transition">
                Get Started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button onClick={() => setOpen(!open)} className="grid size-10 place-items-center rounded-full border border-border bg-card" aria-label="Menu">
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background/96 px-4 py-4 shadow-xl backdrop-blur-xl md:hidden">
          <div className="space-y-1">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                hash={"hash" in l ? l.hash : undefined}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold">Dashboard</Link>
                <button onClick={() => { setOpen(false); signOut(); }} className="rounded-xl border border-border px-4 py-3 text-sm font-semibold">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/auth" search={{ mode: "signin" }} onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold">Log in</Link>
                <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)} className="primary-button rounded-xl px-4 py-3 text-center text-sm font-bold">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
