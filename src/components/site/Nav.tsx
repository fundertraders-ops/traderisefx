import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/challenges", label: "Challenges" },
  { to: "/instant", label: "Instant Funding" },
  { to: "/competition", label: "Competition" },
  { to: "/reviews", label: "Reviews" },
  { to: "/", hash: "how", label: "How it works" },
  { to: "/", hash: "faq", label: "FAQ" },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="size-8 rounded-md bg-gold-gradient grid place-items-center text-primary-foreground">T</span>
          <span>Trade Rise <span className="text-gold-gradient">FX</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={"hash" in l ? l.hash : undefined}
              className="hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <LayoutDashboard size={14} /> Dashboard
              </Link>
              <button onClick={signOut} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <LogOut size={14} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ mode: "signin" }} className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
              <Link to="/auth" search={{ mode: "signup" }} className="px-4 py-2 rounded-md bg-gold-gradient text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
                Sign up
              </Link>
            </>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2" aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={"hash" in l ? l.hash : undefined}
              onClick={() => setOpen(false)}
              className="block text-sm text-muted-foreground"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground">Dashboard</Link>
              <button onClick={() => { setOpen(false); signOut(); }} className="block text-sm text-muted-foreground">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ mode: "signin" }} onClick={() => setOpen(false)} className="block text-sm text-muted-foreground">Sign in</Link>
              <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-md bg-gold-gradient text-primary-foreground font-semibold text-sm text-center">
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
