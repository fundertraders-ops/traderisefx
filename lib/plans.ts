import type { Plan } from "@/components/site/PlansGrid";

export const CHALLENGE_SIZES = ["$10K", "$25K", "$50K", "$100K", "$200K", "$400K"];

export const CHALLENGE_PRICES: Record<string, string> = {
  "$10K": "$89",
  "$25K": "$189",
  "$50K": "$289",
  "$100K": "$489",
  "$200K": "$989",
  "$400K": "$1,200",
};

export const CHALLENGE_PLANS: Plan[] = [
  {
    name: "One-Step",
    tag: "Fastest",
    profit: "10% target · 21-day payouts",
    desc: "Hit a single profit target and you're funded. No second phase, no waiting.",
    features: [
      "10% profit target",
      "5% max daily loss",
      "10% max overall loss",
      "Payout cycle: 21 days",
      "Fee-based account: no 2-minute hold rule",
      "Up to 80% profit split",
    ],
  },
  {
    name: "Two-Step",
    tag: "Most Popular",
    profit: "8% + 5% target · 14-day payouts",
    desc: "Lower targets, more flexibility. The classic evaluation path.",
    features: [
      "Phase 1: 8% target",
      "Phase 2: 5% target",
      "5% daily / 10% overall",
      "Payout cycle: 14 days",
      "Fee-based account: no 2-minute hold rule",
      "Up to 90% profit split",
    ],
    accent: true,
  },
];

export const INSTANT_SIZES = [
  "$200",
  "$500",
  "$1,000",
  "$2,000",
  "$3,000",
  "$4,000",
  "$5,000",
  "$10,000",
  "$20,000",
  "$30,000",
  "$40,000",
  "$50,000",
];

export const INSTANT_PRICES: Record<string, string> = {
  "$200": "$35",
  "$500": "$70",
  "$1,000": "$130",
  "$2,000": "$240",
  "$3,000": "$390",
  "$4,000": "$520",
  "$5,000": "$650",
  "$10,000": "$1,300",
  "$20,000": "$2,500",
  "$30,000": "$3,600",
  "$40,000": "$5,000",
  "$50,000": "$6,000",
};

export const INSTANT_PLANS: Plan[] = [
  {
    name: "Instant Funded",
    tag: "No Evaluation",
    profit: "Direct funding · 14-day payouts",
    desc: "Get a live funded account immediately. All account sizes share the same transparent rules and instant access.",
    features: [
      "No evaluation phase",
      "Live account in minutes",
      "Payout cycle: 14 days",
      "2-minute minimum hold time",
      "25% daily loss limit",
      "50% overall loss limit",
      "70% profit split",
    ],
    accent: true,
  },
];
