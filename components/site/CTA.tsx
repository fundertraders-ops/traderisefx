import { ArrowRight, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-gold/30 bg-site-mesh p-10 text-center shadow-[0_28px_90px_-55px_color-mix(in_oklab,var(--gold)_70%,transparent)] md:p-16">
          <div className="absolute inset-0 grid-pattern opacity-25" />
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-black uppercase tracking-widest text-gold">
              <Zap size={14} /> Ready to trade?
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-black leading-tight md:text-5xl">
              Your capital is waiting. <span className="text-gold-gradient">Go get it.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Start your evaluation or choose an instant funded route with the same polished dashboard experience.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/challenges" className="primary-button inline-flex h-12 items-center gap-2 rounded-xl px-7 text-sm font-extrabold transition">
                Start a challenge <ArrowRight size={18} />
              </Link>
              <Link to="/instant" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card/80 px-7 text-sm font-bold transition hover:-translate-y-0.5 hover:border-gold/40">
                Get instant funding
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
