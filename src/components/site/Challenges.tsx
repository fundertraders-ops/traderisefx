import { useState } from "react";
import { Check } from "lucide-react";

const sizes = ["$10K", "$25K", "$50K", "$100K", "$200K"];
const prices: Record<string, string> = { "$10K": "$89", "$25K": "$189", "$50K": "$289", "$100K": "$489", "$200K": "$989" };

const plans = [
  {
    name: "One-Step",
    tag: "Fastest",
    profit: "10% target",
    desc: "Hit a single profit target and you're funded. No second phase, no waiting.",
    features: ["10% profit target", "5% max daily loss", "10% max overall loss", "No min trading days", "Up to 80% profit split"],
    accent: false,
  },
  {
    name: "Two-Step",
    tag: "Most Popular",
    profit: "8% + 5% target",
    desc: "Lower targets, more flexibility. The classic evaluation path.",
    features: ["Phase 1: 8% target", "Phase 2: 5% target", "5% daily / 10% overall", "Up to 90% profit split", "Free retry on first fail"],
    accent: true,
  },
  {
    name: "Instant",
    tag: "Skip the test",
    profit: "Direct funding",
    desc: "Get live capital immediately. Conservative scaling, real payouts from day one.",
    features: ["No evaluation phase", "Scale to $400K", "Weekly payouts", "Up to 70% profit split", "Conservative rules"],
    accent: false,
  },
];

export function Challenges() {
  const [size, setSize] = useState("$50K");
  return (
    <section id="challenges" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">Choose your path</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">Three ways to get funded</h2>
          <p className="mt-4 text-muted-foreground">Pick the challenge model that fits your style. Same payouts, same support — different paths to capital.</p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition border ${
                size === s
                  ? "bg-gold-gradient text-primary-foreground border-transparent"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-gold/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-8 border transition hover:-translate-y-1 ${
                p.accent
                  ? "border-gold/40 bg-emerald-gradient shadow-[var(--shadow-card)] glow-gold"
                  : "border-border bg-card"
              }`}
            >
              {p.tag && (
                <span className={`absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold ${
                  p.accent ? "bg-gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
                }`}>
                  {p.tag}
                </span>
              )}
              <h3 className="text-2xl font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.profit}</p>
              <p className="mt-4 text-sm text-muted-foreground">{p.desc}</p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold text-gold-gradient">{prices[size]}</span>
                <span className="text-sm text-muted-foreground">one-time · {size}</span>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={16} className="text-gold mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button className={`mt-8 w-full py-3 rounded-lg font-semibold transition ${
                p.accent
                  ? "bg-background text-foreground hover:bg-background/80"
                  : "bg-gold-gradient text-primary-foreground hover:opacity-90"
              }`}>
                Start {p.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
