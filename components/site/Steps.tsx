import { ArrowRight, BadgeCheck, CreditCard, Goal, WalletCards } from "lucide-react";

const steps = [
  { n: "01", icon: CreditCard, t: "Choose a Challenge", d: "Pick the plan and account size that fits your goals and trading style." },
  { n: "02", icon: Goal, t: "Prove Your Skills", d: "Trade with clean risk rules and hit the required profit target." },
  { n: "03", icon: BadgeCheck, t: "Get Funded", d: "Complete the evaluation and receive your funded account credentials." },
  { n: "04", icon: WalletCards, t: "Get Paid & Scale", d: "Request payouts, grow your capital, and keep your profit split." },
];

export function Steps() {
  return (
    <section id="how" className="relative py-18 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-gold">Trader journey</span>
          <h2 className="mt-3 text-4xl font-black md:text-5xl">Your Path To Funding In 4 Simple Steps</h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map((s, index) => (
            <div key={s.n} className="premium-card group relative rounded-[1.45rem] p-6 transition hover:-translate-y-1">
              {index < steps.length - 1 && (
                <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-gold/70 md:block" />
              )}
              <div className="flex items-center justify-between">
                <div className="grid size-12 place-items-center rounded-2xl bg-gold/10 text-gold transition group-hover:scale-105">
                  <s.icon size={22} />
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-black text-gold">{s.n}</span>
              </div>
              <h3 className="mt-6 text-lg font-black">{s.t}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
