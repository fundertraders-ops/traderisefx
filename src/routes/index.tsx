import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Ticker } from "@/components/site/Ticker";
import { Features } from "@/components/site/Features";
import { Steps } from "@/components/site/Steps";
import { Stats } from "@/components/site/Stats";
import { LandingPlans } from "@/components/site/LandingPlans";
import { FAQ } from "@/components/site/FAQ";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";

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
        <Steps />
        <LandingPlans />
        <Features />
        <Stats />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
