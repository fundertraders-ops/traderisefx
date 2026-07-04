const rows = [
  { name: "Marcus T.", country: "🇬🇧 UK", account: "$200K", amount: "$18,420" },
  { name: "Sofia R.", country: "🇪🇸 Spain", account: "$100K", amount: "$9,810" },
  { name: "Daniel K.", country: "🇩🇪 Germany", account: "$50K", amount: "$4,230" },
  { name: "Aisha O.", country: "🇳🇬 Nigeria", account: "$100K", amount: "$11,640" },
  { name: "Hiro M.", country: "🇯🇵 Japan", account: "$25K", amount: "$2,180" },
  { name: "Camila V.", country: "🇧🇷 Brazil", account: "$50K", amount: "$5,720" },
];

export function Payouts() {
  return (
    <section id="payouts" className="py-24 bg-card/30 border-y border-border">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">Payout history</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">Verified Payouts</h2>
          <p className="mt-4 text-muted-foreground">
            We are committed to rewarding successful traders. Our payout history demonstrates our dedication to transparency, reliability, and trader success.
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground tracking-wide">
            Fast Processing • Secure Payments • Trusted Worldwide
          </p>
        </div>
        <div className="mt-12 rounded-2xl border border-border bg-background overflow-hidden">
          <div className="grid grid-cols-4 px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
            <div>Trader</div><div>Country</div><div>Account</div><div className="text-right">Payout</div>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-4 px-6 py-4 text-sm border-b border-border/50 last:border-0 hover:bg-card/50 transition">
              <div className="font-medium">{r.name}</div>
              <div className="text-muted-foreground">{r.country}</div>
              <div className="text-muted-foreground">{r.account}</div>
              <div className="text-right font-semibold text-gold-gradient">{r.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
