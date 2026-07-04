import { useState } from "react";
import { Check } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type Plan = {
  name: string;
  tag?: string;
  profit: string;
  desc: string;
  features: string[];
  accent?: boolean;
};

type Props = {
  plans: Plan[];
  sizes: string[];
  prices: Record<string, string>;
  ctaLabel?: string;
};

export function PlansGrid({ plans, sizes, prices, ctaLabel = "Start" }: Props) {
  const [size, setSize] = useState(sizes[Math.floor(sizes.length / 2)]);
  return (
    <>
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

      <div className={`mt-12 grid gap-6 ${plans.length === 1 ? "md:grid-cols-1 max-w-md mx-auto" : plans.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "md:grid-cols-3"}`}>
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
              <span
                className={`absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold ${
                  p.accent
                    ? "bg-gold-gradient text-primary-foreground"
                    : "bg-secondary text-muted-foreground border border-border"
                }`}
              >
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

            <Link
              to="/checkout"
              search={{ plan: p.name, size, price: prices[size] }}
              className={`mt-8 w-full py-3 rounded-lg font-semibold transition inline-flex items-center justify-center ${
                p.accent
                  ? "bg-background text-foreground hover:bg-background/80"
                  : "bg-gold-gradient text-primary-foreground hover:opacity-90"
              }`}
            >
              {ctaLabel} {p.name}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
