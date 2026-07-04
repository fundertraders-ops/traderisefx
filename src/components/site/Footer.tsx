export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display text-lg font-black">
            <span className="grid size-9 place-items-center rounded-2xl bg-gold-gradient text-primary-foreground">▾</span>
            Trade Rise <span className="text-gold-gradient">FX</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            A proprietary trading firm backing skilled traders with real capital, fair rules, and a modern funded-trader dashboard.
          </p>
        </div>
        {[
          { h: "Product", l: ["Challenges", "Instant Funding", "How it works", "FAQ"] },
          { h: "Company", l: ["About", "Contact", "Affiliate program", "Reviews"] },
        ].map((c) => (
          <div key={c.h}>
            <h4 className="text-sm font-black">{c.h}</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {c.l.map((i) => <li key={i}><a href="#" className="hover:text-foreground">{i}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-6 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Trade Rise FX. All rights reserved.</p>
          <p className="max-w-2xl">Risk disclosure: Trading involves risk. Past performance does not guarantee future results. Review all trading rules and terms before purchasing an account.</p>
        </div>
      </div>
    </footer>
  );
}
