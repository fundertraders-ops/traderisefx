export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="size-8 rounded-md bg-gold-gradient grid place-items-center text-primary-foreground">T</span>
            Trade Rise <span className="text-gold-gradient">FX</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            A proprietary trading firm backing skilled traders with real capital and fair rules.
          </p>
        </div>
        {[
          { h: "Product", l: ["Challenges", "How it works", "Payouts", "FAQ"] },
          { h: "Company", l: ["About", "Contact", "Affiliate program", "Careers"] },
        ].map((c) => (
          <div key={c.h}>
            <h4 className="font-semibold text-sm">{c.h}</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {c.l.map((i) => <li key={i}><a href="#" className="hover:text-foreground">{i}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-3 justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Trade Rise FX. All rights reserved.</p>
          <div className="max-w-2xl whitespace-pre-line text-left">
            Risk disclosure: Trusted by Traders Worldwide


            Thousands of traders trust our platform for their funded trading journey. With fast payouts, transparent rules, and dedicated support, we are committed to helping traders succeed.


            ✅ Over $500,000+ paid out to successful traders.
            ✅ Fast and reliable payout processing.
            ✅ Transparent trading conditions.
            ✅ Professional customer support.
            ✅ Trusted by traders from multiple countries.


            “I received my payout on time without any issues. The evaluation process was fair and straightforward.” – UMAR ALI KHAN


            “One of the best funded trading firms I’ve worked with. Great support team and smooth experience.” – NITIN KSHIR


            “The rules are clear, and the payout process is very fast. Highly recommended for serious traders.” – USMAN SHAHID


            “Excellent trading environment and reliable funding opportunities. I would definitely recommend this company.” – Verified Client


            Disclaimer


            Trading involves risk. Past performance does not guarantee future results. All testimonials reflect individual experiences and may not be representative of all traders. Please review all trading rules and terms before purchasing an account.


            Join hundreds of successful traders and start your funded trading journey with confidence today.


            ۔
          </div>
        </div>
      </div>
    </footer>
  );
}
