import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "How do I get funded?", a: "Purchase a challenge, meet the objectives, and complete the evaluation." },
  { q: "When do payouts occur?", a: "Eligible traders can request payouts according to the payout schedule." },
  { q: "Can I hold trades overnight?", a: "Please review the trading rules associated with your account type." },
  {
    q: "What happens if I close a trade too quickly?",
    a: "Trades must be held for a minimum of 2 minutes. Closing a trade before this threshold is a strict violation and may result in permanent account termination without prior notice.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">FAQ</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">Frequently Asked Questions</h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-medium">{f.q}</span>
                  {isOpen ? <Minus size={18} className="text-gold" /> : <Plus size={18} className="text-gold" />}
                </button>
                {isOpen && <div className="px-6 pb-5 text-sm text-muted-foreground">{f.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
