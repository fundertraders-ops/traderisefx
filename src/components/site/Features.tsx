import { Zap, Banknote, Scale, Users, Shield, Layers, Rocket, Globe } from "lucide-react";

const features = [
  { icon: Zap, title: "Fast Payout Processing", desc: "Request payouts anytime. Money typically lands the next business day." },
  { icon: Banknote, title: "Up to 90% Profit Split", desc: "Scale your share to 90% as you grow your funded account." },
  { icon: Scale, title: "Transparent Trading Rules", desc: "No hidden consistency clauses. No surprise account terminations." },
  { icon: Users, title: "Professional Customer Support", desc: "Our dedicated team is here to help you succeed at every step." },
  { icon: Shield, title: "Secure Trading Environment", desc: "Your data and account are protected with enterprise-grade security." },
  { icon: Layers, title: "Multiple Account Options", desc: "Choose from one-step, two-step, or instant funding plans." },
  { icon: Rocket, title: "Instant Account Delivery", desc: "Receive your live account credentials within 24 hours of passing." },
  { icon: Globe, title: "Global Trader Community", desc: "Join thousands of traders from over 120 countries worldwide." },
];

export function Features() {
  return (
    <section id="how" className="py-24 bg-card/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-gold">Why Traders Choose Our Firm</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">Built by traders, <br />for traders.</h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Every rule, every payout, every spread — engineered to keep serious traders trading. No gotchas.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-background/60 p-5 hover:border-gold/40 transition">
                <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold">
                  <f.icon size={20} />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
