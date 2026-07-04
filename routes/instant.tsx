import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { PlansGrid } from "@/components/site/PlansGrid";
import { CTA } from "@/components/site/CTA";
import { Zap, Clock, Shield } from "lucide-react";

import { INSTANT_PLANS, INSTANT_PRICES, INSTANT_SIZES } from "@/lib/plans";

const perks = [
  { icon: Zap, t: "Live in minutes", d: "Receive your credentials right after checkout." },
  { icon: Clock, t: "14-day payouts", d: "Payout eligibility starts from the account activation date." },
  { icon: Shield, t: "2-minute hold", d: "Trades closed before 2 minutes are not valid for compliance." },
];

export const Route = createFileRoute("/instant")({
  head: () => ({
    meta: [
      { title: "Instant Funded Accounts — Trade Rise FX" },
      {
        name: "description",
        content:
          "Skip the evaluation and trade live capital from day one. Instant funded accounts up to $100K with weekly payouts.",
      },
      { property: "og:title", content: "Instant Funded Accounts — Trade Rise FX" },
      {
        property: "og:description",
        content: "Directly funded trading accounts — no challenge, no waiting. Live capital in minutes.",
      },
    ],
    links: [{ rel: "canonical", href: "/instant" }],
  }),
  component: InstantPage,
});

function InstantPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-32 pb-12">
        <section className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-[10px] uppercase tracking-widest text-gold-soft">
              <Zap size={12} /> No evaluation needed
            </span>
            <h1 className="mt-4 text-4xl md:text-6xl font-bold">Instant Funded Accounts</h1>
            <p className="mt-4 text-muted-foreground">
              Skip the challenge entirely. Pay once, receive live capital, and start trading the same
              day with a 14-day payout cycle and instant-account compliance rules.
            </p>
          </div>

          <PlansGrid plans={INSTANT_PLANS} sizes={INSTANT_SIZES} prices={INSTANT_PRICES} ctaLabel="Get" />

          <div className="mt-20 grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {perks.map((p) => (
              <div key={p.t} className="rounded-xl border border-border bg-card p-5">
                <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold">
                  <p.icon size={20} />
                </div>
                <h3 className="mt-4 font-semibold">{p.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </section>
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
