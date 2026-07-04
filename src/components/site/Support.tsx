import { Mail, MessageCircle, Globe } from "lucide-react";

export function Support() {
  return (
    <section className="py-24 bg-card/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-gold">Support</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">We're Here to Help</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Our support team is available to help you with your trading journey.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl border border-border bg-background/60 hover:border-gold/30 transition-colors text-center">
            <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold mb-4 mx-auto">
              <Mail size={20} />
            </div>
            <h3 className="text-lg font-semibold">Email Support</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Reach us anytime for detailed assistance and account inquiries.
            </p>
            <a
              href="mailto:fxtradersrise@gmail.com"
              className="mt-3 inline-block text-sm font-medium text-gold hover:underline"
            >
              fxtradersrise@gmail.com
            </a>
          </div>
          <div className="p-6 rounded-xl border border-border bg-background/60 hover:border-gold/30 transition-colors text-center">
            <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold mb-4 mx-auto">
              <MessageCircle size={20} />
            </div>
            <h3 className="text-lg font-semibold">Live Chat Support</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get instant answers from our team through real-time chat.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-background/60 hover:border-gold/30 transition-colors text-center">
            <div className="size-10 rounded-lg bg-gold/10 grid place-items-center text-gold mb-4 mx-auto">
              <Globe size={20} />
            </div>
            <h3 className="text-lg font-semibold">Global Customer Service</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Multi-language support for traders around the world.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
