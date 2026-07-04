import trader from "@/assets/trader.jpg";

const steps = [
  { n: "01", t: "Purchase Your Challenge Account", d: "Select your preferred account size and evaluation plan that suits your trading style." },
  { n: "02", t: "Trade and Meet the Required Objectives", d: "Trade your strategy while respecting drawdown limits and reaching the profit goal." },
  { n: "03", t: "Successfully Complete the Evaluation", d: "Pass the challenge phase and receive your live funded account credentials within 24 hours." },
  { n: "04", t: "Receive Your Funded Account and Start Earning Payouts", d: "Request payouts whenever you want and keep up to 90% of your earned profits." },
];

export function Steps() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <img
            src={trader}
            alt="Funded trader at workstation"
            width={1280}
            height={1280}
            loading="lazy"
            className="rounded-2xl border border-border w-full"
          />
          <div className="absolute -bottom-6 -right-6 hidden md:block rounded-xl bg-card border border-gold/40 p-5 glow-gold">
            <div className="text-xs text-muted-foreground">Last payout</div>
            <div className="text-2xl font-display font-bold text-gold-gradient">$8,420.00</div>
            <div className="text-xs text-success mt-1">● Processed in 14 minutes</div>
          </div>
        </div>
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-gold">How It Works</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">Get Funded in Four Simple Steps</h2>
          <div className="mt-10 space-y-6">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-5 items-start">
                <div className="font-display text-3xl font-bold text-gold-gradient w-12 shrink-0">{s.n}</div>
                <div>
                  <h3 className="font-semibold text-lg">{s.t}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
