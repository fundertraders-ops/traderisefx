import { TrendingUp, Wallet, ShieldCheck } from "lucide-react";

export function Rankings() {
  return (
    <section className="py-24 bg-card/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">Leaderboard</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">Monthly Rankings</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Recognizing traders who consistently demonstrate discipline, profitability, and risk management.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl border border-border bg-background/60 hover:border-gold/30 transition-colors">
            <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold mb-4">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-lg font-semibold">Highest Returns</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Top performers with exceptional profit percentages this month.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-background/60 hover:border-gold/30 transition-colors">
            <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold mb-4">
              <Wallet size={20} />
            </div>
            <h3 className="text-lg font-semibold">Top Payout Recipients</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Traders who earned the largest verified payouts this month.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-background/60 hover:border-gold/30 transition-colors">
            <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold mb-4">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-semibold">Most Disciplined</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Traders demonstrating outstanding risk management and consistency.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
