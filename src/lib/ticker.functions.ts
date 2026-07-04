import { createServerFn } from "@tanstack/react-start";

type TickerItem = { s: string; p: string; c: string };

const COINS = [
  { id: "bitcoin", symbol: "BTC/USD" },
  { id: "ethereum", symbol: "ETH/USD" },
  { id: "solana", symbol: "SOL/USD" },
  { id: "binancecoin", symbol: "BNB/USD" },
  { id: "ripple", symbol: "XRP/USD" },
  { id: "cardano", symbol: "ADA/USD" },
  { id: "dogecoin", symbol: "DOGE/USD" },
  { id: "avalanche-2", symbol: "AVAX/USD" },
  { id: "chainlink", symbol: "LINK/USD" },
  { id: "polkadot", symbol: "DOT/USD" },
];

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function formatChange(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export const getTickerQuotes = createServerFn({ method: "GET" }).handler(async (): Promise<TickerItem[]> => {
  const ids = COINS.map((c) => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = (await res.json()) as Record<string, { usd: number; usd_24h_change: number }>;

    return COINS.map((c) => {
      const row = data[c.id];
      if (!row) return { s: c.symbol, p: "—", c: "0.00%" };
      return {
        s: c.symbol,
        p: formatPrice(row.usd),
        c: formatChange(row.usd_24h_change ?? 0),
      };
    });
  } catch (err) {
    console.error("Ticker fetch failed:", err);
    return COINS.map((c) => ({ s: c.symbol, p: "—", c: "0.00%" }));
  }
});
