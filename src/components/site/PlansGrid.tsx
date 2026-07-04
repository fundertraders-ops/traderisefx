import { useState } from "react";
import { Check, Crown, Sparkles } from "lucide-react";
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
      <div className="mt-10 flex justify-center">
        <div className="thin-scrollbar flex max-w-full gap-2 overflow-x-auto rounded-2xl border border-border bg-card/82 p-2 shadow-sm backdrop-blur-xl">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                size === s
                  ? "primary-button"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-10 grid gap-5 ${plans.length === 1 ? "mx-auto max-w-md md:grid-cols-1" : plans.length === 2 ? "mx-auto max-w-5xl md:grid-cols-2" : "md:grid-cols-3"}`}>
        {plans.map((p) => (
          <div
            key={p.name}
            className={`premium-card shimmer relative overflow-hidden rounded-[1.6rem] p-6 transition duration-300 hover:-translate-y-1 ${
              p.accent ? "border-gold/60 shadow-[0_28px_70px_-42px_color-mix(in_oklab,var(--gold)_80%,transparent)]" : ""
            }`}
          >
            {p.tag && (
              <span
                className={`absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                  p.accent
                    ? "bg-gold-gradient text-primary-foreground"
                    : "border border-border bg-secondary text-muted-foreground"
                }`}
              >
                {p.accent ? <Crown size={12} /> : <Sparkles size={12} />} {p.tag}
              </span>
            )}

            <div className="relative">
              <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-gold/10 text-gold">
                <Sparkles size={21} />
              </div>
              <h3 className="pr-24 text-2xl font-black">{p.name}</h3>
              <p className="mt-1 text-sm font-semibold text-gold">{p.profit}</p>
              <p className="mt-4 min-h-[44px] text-sm leading-6 text-muted-foreground">{p.desc}</p>

              <div className="mt-6 rounded-2xl border border-border bg-background/66 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Selected account</div>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <span className="text-4xl font-black tracking-tight text-foreground">{size}</span>
                  <span className="text-3xl font-black text-gold-gradient">{prices[size]}</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-muted-foreground">One-time fee</div>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/10 text-success">
                      <Check size={13} />
                    </span>
                    <span className="leading-5 text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/checkout"
                search={{ plan: p.name, size, price: prices[size] }}
                className={`mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-extrabold transition ${
                  p.accent ? "primary-button" : "border border-border bg-card hover:-translate-y-0.5 hover:border-gold/40"
                }`}
              >
                {ctaLabel} {p.name}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
