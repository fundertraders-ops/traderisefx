import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Ticker } from "@/components/site/Ticker";
import { AccountTypes } from "@/components/site/AccountTypes";
import { Features } from "@/components/site/Features";
import { Steps } from "@/components/site/Steps";
import { Stats } from "@/components/site/Stats";
import { Referral } from "@/components/site/Referral";
import { Affiliate } from "@/components/site/Affiliate";
import { Rankings } from "@/components/site/Rankings";
import { Payouts } from "@/components/site/Payouts";
import { FAQ } from "@/components/site/FAQ";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";
import { TrustedSection } from "@/components/site/TrustedSection";
import { Support } from "@/components/site/Support";
import { Reviews } from "@/components/site/Reviews";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trade Rise FX — Get funded up to $400K and keep 90% of profits" },
      { name: "description", content: "Pass our one-step or two-step evaluation, or skip it with instant funding. 90% profit split, 24-hour payouts, fair rules." },
      { property: "og:title", content: "Trade Rise FX — Trade our capital, keep the profits" },
      { property: "og:description", content: "Funded trading accounts up to $400K with 90% profit split and 24-hour payouts." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <Ticker />
        <AccountTypes />
        <Features />
        <Steps />
        <Stats />
        <Referral />
        <Affiliate />
        <Rankings />
        <Payouts />
        <FAQ />
        <Reviews />
        <TrustedSection />
        <Support />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
