import { Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Zap } from "lucide-react";

export function AccountTypes() {
  return (
    <section id="accounts" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">Two paths to capital</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">Pick how you want to get funded</h2>
          <p className="mt-4 text-muted-foreground">
            Prove yourself through an evaluation, or skip the test and trade live capital from day one.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <Link
            to="/challenges"
            className="group relative rounded-2xl p-8 border border-border bg-card hover:border-gold/40 hover:-translate-y-1 transition"
          >
            <div className="size-12 rounded-xl bg-gold/10 grid place-items-center text-gold">
              <GraduationCap size={22} />
            </div>
            <h3 className="mt-6 text-2xl font-bold">Challenge Accounts</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Pass a one-step or two-step evaluation to unlock live capital. Best for traders who want
              the highest profit splits and largest scaling.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>· Up to 90% profit split</li>
              <li>· Scale to $400K</li>
              <li>· Free retry on first fail</li>
            </ul>
            <span className="mt-6 inline-flex items-center gap-2 text-gold font-medium">
              View challenges <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </span>
          </Link>

          <Link
            to="/instant"
            className="group relative rounded-2xl p-8 border border-gold/40 bg-emerald-gradient glow-gold hover:-translate-y-1 transition"
          >
            <span className="absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold bg-gold-gradient text-primary-foreground">
              Skip the test
            </span>
            <div className="size-12 rounded-xl bg-background/40 grid place-items-center text-gold">
              <Zap size={22} />
            </div>
            <h3 className="mt-6 text-2xl font-bold">Instant Funded Accounts</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Directly funded and live immediately — no evaluation phase. Trade real capital from
              day one with conservative scaling rules.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>· No evaluation required</li>
              <li>· Live account in minutes</li>
              <li>· Weekly payouts</li>
            </ul>
            <span className="mt-6 inline-flex items-center gap-2 text-gold font-medium">
              View instant accounts <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
