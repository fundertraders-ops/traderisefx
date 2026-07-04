import heroBg from "@/assets/hero-bg.jpg";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-hero">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <img
        src={heroBg}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />

      <div className="relative max-w-7xl mx-auto px-6 text-center animate-float-up">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/5 text-xs uppercase tracking-widest text-gold-soft">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Fast Payouts • Transparent Rules • Professional Support
        </span>
        <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-[1.05] max-w-4xl mx-auto">
          Trade with Company Capital.<br />
          Keep <span className="text-gold-gradient">Up to 90%</span> of the Profits.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Join thousands of traders worldwide and prove your skills through our evaluation program.
          Pass the challenge, get funded, and start earning real payouts from the markets.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link to="/challenges" className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-gold-gradient text-primary-foreground font-semibold glow-gold hover:scale-[1.02] transition">
            Get Funded Now
            <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { v: "$1.2M+", l: "Paid to traders" },
            { v: "2800+", l: "Funded accounts" },
            { v: "24h", l: "Avg. payout time" },
            { v: "120+", l: "Countries served" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border/60 bg-card/40 backdrop-blur p-5">
              <div className="text-2xl md:text-3xl font-display font-bold text-gold-gradient">{s.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-gold" /> Regulated broker</span>
          <span className="inline-flex items-center gap-2"><Zap size={16} className="text-gold" /> Instant funding option</span>
        </div>
      </div>
    </section>
  );
}
