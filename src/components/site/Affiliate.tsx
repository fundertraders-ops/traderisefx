import { DollarSign, Megaphone, BarChart3 } from "lucide-react";

export function Affiliate() {
  return (
    <section className="py-24 bg-background border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">Partners</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">Become an Affiliate Partner</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Promote our services and earn commissions from every successful referral.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-gold/30 transition-colors">
            <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold mb-4">
              <DollarSign size={20} />
            </div>
            <h3 className="text-lg font-semibold">High Commission Rates</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Earn competitive commissions on every successful referral purchase.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-gold/30 transition-colors">
            <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold mb-4">
              <Megaphone size={20} />
            </div>
            <h3 className="text-lg font-semibold">Marketing Materials Provided</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Access ready-made banners, links, and content to boost your promotions.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card/50 hover:border-gold/30 transition-colors">
            <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold mb-4">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-lg font-semibold">Performance Tracking Dashboard</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitor clicks, conversions, and earnings in real time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
