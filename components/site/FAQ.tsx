import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const faqs = [
  { q: "How do I get funded?", a: "Purchase a challenge, meet the objectives, and complete the evaluation." },
  { q: "When do payouts occur?", a: "Eligible traders can request payouts according to the payout schedule assigned to their account type." },
  { q: "Can I hold trades overnight?", a: "Please review the trading rules associated with your account type before placing trades." },
  { q: "What happens if I close a trade too quickly?", a: "Instant accounts require trades to be held for a minimum of 2 minutes. Fee-based challenge accounts are exempt from that rule." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-gold">FAQ</span>
          <h2 className="mt-3 text-4xl font-black md:text-5xl">Frequently Asked Questions</h2>
          <p className="mt-4 text-muted-foreground">Important rules stay clear and readable in both white and dark mode.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="premium-card overflow-hidden rounded-[1.35rem]">
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                  <span className="font-black">{f.q}</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                    {isOpen ? <Minus size={17} /> : <Plus size={17} />}
                  </span>
                </button>
                {isOpen && <div className="px-6 pb-5 text-sm leading-6 text-muted-foreground">{f.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
