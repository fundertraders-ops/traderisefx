import { Users, TrendingUp, CreditCard } from "lucide-react";

export function Referral() {
  const items = [
    {
      title: "Unlimited Referrals",
      description: "No cap on how many traders you can bring in. The more you refer, the more you earn.",
      icon: Users,
    },
    {
      title: "Real-Time Tracking",
      description: "Monitor clicks, sign-ups, and commissions live from your personal dashboard.",
      icon: TrendingUp,
    },
    {
      title: "Instant Commission Credits",
      description: "Your commissions are credited to your account as soon as a referred trader purchases a challenge.",
      icon: CreditCard,
    },
  ];

  return (
    <section id="referral" className="py-24 border-t border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">Affiliate Program</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">
            Refer Traders and Earn Rewards
          </h2>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
            Invite your friends and earn commissions on every successful purchase made through your referral link.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.title}
              className="relative group rounded-2xl border border-border bg-card/50 p-8 hover:border-gold/30 transition-colors"
            >
              <div className="size-12 rounded-xl bg-gold/10 grid place-items-center text-gold mb-6 group-hover:bg-gold/20 transition-colors">
                <item.icon size={24} />
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
