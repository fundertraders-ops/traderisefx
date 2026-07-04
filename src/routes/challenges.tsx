import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { PlansGrid, type Plan } from "@/components/site/PlansGrid";
import { CTA } from "@/components/site/CTA";

const sizes = ["$10K", "$25K", "$50K", "$100K", "$200K", "$400K"];
const prices: Record<string, string> = {
  "$10K": "$89",
  "$25K": "$189",
  "$50K": "$289",
  "$100K": "$489",
  "$200K": "$989",
  "$400K": "$1,200",
};

const plans: Plan[] = [
  {
    name: "One-Step",
    tag: "Fastest",
    profit: "10% target · 21-day payouts",
    desc: "Hit a single profit target and you're funded. No second phase, no waiting.",
    features: [
      "10% profit target",
      "5% max daily loss",
      "10% max overall loss",
      "Payout cycle: 21 days",
      "Fee-based account: no 2-minute hold rule",
      "Up to 80% profit split",
    ],
  },
  {
    name: "Two-Step",
    tag: "Most Popular",
    profit: "8% + 5% target · 14-day payouts",
    desc: "Lower targets, more flexibility. The classic evaluation path.",
    features: [
      "Phase 1: 8% target",
      "Phase 2: 5% target",
      "5% daily / 10% overall",
      "Payout cycle: 14 days",
      "Fee-based account: no 2-minute hold rule",
      "Up to 90% profit split",
    ],
    accent: true,
  },
];

export const Route = createFileRoute("/challenges")({
  head: () => ({
    meta: [
      { title: "Challenge Accounts — Trade Rise FX" },
      {
        name: "description",
        content:
          "Pass our one-step or two-step evaluation to get funded up to $400K. Up to 90% profit split, free retry, no hidden rules.",
      },
      { property: "og:title", content: "Challenge Accounts — Trade Rise FX" },
      {
        property: "og:description",
        content: "Earn your funded account through a transparent one-step or two-step evaluation.",
      },
    ],
    links: [{ rel: "canonical", href: "/challenges" }],
  }),
  component: ChallengesPage,
});

function ChallengesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-32 pb-12">
        <section className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.2em] text-gold">Evaluation route</span>
            <h1 className="mt-3 text-4xl md:text-6xl font-bold">Challenge Accounts</h1>
            <p className="mt-4 text-muted-foreground">
              Prove your edge in a transparent evaluation, then trade live capital with the highest
              profit splits we offer. One-step for speed, two-step for flexibility.
            </p>
          </div>
          <PlansGrid plans={plans} sizes={sizes} prices={prices} ctaLabel="Start" />

          <div className="mt-16 max-w-3xl mx-auto rounded-2xl border border-gold/30 bg-gold/5 p-6 md:p-8">
            <span className="text-xs uppercase tracking-[0.2em] text-gold">Payout and hold rules</span>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold">Challenge accounts are fee-based</h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              One-Step accounts follow a <span className="font-semibold text-foreground">21-day</span> payout cycle.
              Two-Step accounts follow a <span className="font-semibold text-foreground">14-day</span> payout cycle.
              The 2-minute minimum holding rule is not applied to fee-based challenge accounts.
            </p>
          </div>
        </section>
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
