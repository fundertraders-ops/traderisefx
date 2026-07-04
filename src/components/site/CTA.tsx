import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-emerald-gradient p-12 md:p-16 text-center glow-gold">
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold max-w-2xl mx-auto leading-tight">
              Your capital is waiting. <span className="text-gold-gradient">Go get it.</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join thousands of traders already funded by Trade Rise FX. Start your evaluation today.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link to="/challenges" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gold-gradient text-primary-foreground font-semibold hover:scale-[1.02] transition">
                Start a challenge <ArrowRight size={18} />
              </Link>
              <Link to="/instant" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border border-gold/30 bg-background/40 hover:bg-background/60 transition">
                Get instant funding
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
