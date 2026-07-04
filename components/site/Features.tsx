import { Banknote, Globe, Headphones, Layers, Rocket, Scale, Shield, Zap } from "lucide-react";

const features = [
  { icon: Zap, title: "Fast Payout Processing", desc: "Request payouts on schedule with a clean dashboard flow." },
  { icon: Banknote, title: "Up to 90% Profit Split", desc: "Keep the majority of profits as your funded account grows." },
  { icon: Scale, title: "Transparent Trading Rules", desc: "Clear drawdown, target, and payout-cycle rules by account type." },
  { icon: Headphones, title: "Professional Support", desc: "A support-first experience for traders who need quick answers." },
  { icon: Shield, title: "Secure Environment", desc: "Modern auth, protected account data, and controlled admin workflows." },
  { icon: Layers, title: "Multiple Account Options", desc: "Choose from one-step, two-step, or instant funding paths." },
  { icon: Rocket, title: "Fast Account Delivery", desc: "Credentials and funded-account details appear inside the dashboard." },
  { icon: Globe, title: "Global Community", desc: "Built for traders across regions with simple, polished UX." },
];

export function Features() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-site-mesh py-20">
      <div className="absolute inset-0 grid-pattern opacity-25" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-gold">Built for traders</span>
            <h2 className="mt-3 text-4xl font-black leading-tight md:text-5xl">Clean platform. Smooth experience. Real controls.</h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              The whole theme now follows the same white-first fintech look, with a dark toggle for users who prefer a trading-terminal feel.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="premium-card rounded-[1.4rem] p-5 transition hover:-translate-y-1 hover:border-gold/50">
                <div className="grid size-11 place-items-center rounded-2xl bg-gold/10 text-gold">
                  <f.icon size={20} />
                </div>
                <h3 className="mt-4 font-black">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
