import { PlansGrid } from "@/components/site/PlansGrid";
import { CHALLENGE_PLANS, CHALLENGE_PRICES, CHALLENGE_SIZES } from "@/lib/plans";

export function LandingPlans() {
  return (
    <section id="plans" className="relative overflow-hidden py-20">
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-gold/5 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-gold">Flexible plans for every trader</span>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Choose Your Challenge</h2>
            <p className="mt-4 text-muted-foreground">
              The cards below use the existing challenge plans and pricing already defined inside the system. Nothing extra is injected from the design.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm font-semibold text-muted-foreground shadow-sm">
            Default theme: <span className="font-black text-foreground">White</span> · Toggle available
          </div>
        </div>

        <PlansGrid plans={CHALLENGE_PLANS} sizes={CHALLENGE_SIZES} prices={CHALLENGE_PRICES} ctaLabel="Start" />
      </div>
    </section>
  );
}
