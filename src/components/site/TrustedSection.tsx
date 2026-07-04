import { ShieldCheck, CheckCircle2, Star, Quote } from "lucide-react";

export function TrustedSection() {
  const testimonials = [
    {
      text: "Excellent experience. My payout was processed quickly and the support team was very responsive.",
      author: "UMAR ALI KHAN",
    },
    {
      text: "One of the best funded trading firms I have worked with. Highly recommended.",
      author: "NITIN KSHIR",
    },
    {
      text: "Fair rules, reliable payouts, and a professional platform.",
      author: "USMAN SHAHID",
    },
  ];

  return (
    <section className="py-24 bg-card/30 border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-gold">Testimonials</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold leading-tight">
              What Our Traders Say
            </h2>
            <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
              Thousands of traders trust our platform for their funded trading journey. With fast payouts, transparent rules, and dedicated support, we are committed to helping traders succeed.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Over $500,000+ paid out to successful traders.",
                "Fast and reliable payout processing.",
                "Transparent trading conditions.",
                "Professional customer support.",
                "Trusted by traders from multiple countries.",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-6 rounded-full bg-gold/10 grid place-items-center text-gold">
                    <CheckCircle2 size={14} />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 rounded-2xl border border-gold/20 bg-emerald-gradient relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck size={120} />
              </div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="text-gold" /> Disclaimer
              </h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed relative z-10">
                Trading involves risk. Past performance does not guarantee future results. All testimonials reflect individual experiences and may not be representative of all traders. Please review all trading rules and terms before purchasing an account.
              </p>
              <p className="mt-6 font-semibold text-gold-gradient relative z-10">
                Join hundreds of successful traders and start your funded trading journey with confidence today.
              </p>
              <div className="mt-2 text-2xl">۔.</div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="flex items-center gap-2 text-gold mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill="currentColor" />
              ))}
              <span className="ml-2 text-sm font-bold text-foreground">EXCELLENT RATING</span>
            </div>
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-border bg-background/60 hover:border-gold/30 transition-colors relative group"
              >
                <Quote className="absolute top-6 right-6 size-8 opacity-5 text-gold group-hover:opacity-10 transition-opacity" />
                <p className="text-muted-foreground italic leading-relaxed">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="size-8 rounded-full bg-gold-gradient" />
                  <span className="text-sm font-semibold">— {t.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
