import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { getTickerQuotes } from "@/lib/ticker.functions";

const tickerQueryOptions = queryOptions({
  queryKey: ["ticker-quotes"],
  queryFn: () => getTickerQuotes(),
  refetchInterval: 30_000,
  refetchIntervalInBackground: true,
  staleTime: 25_000,
});

function MiniSparkline({ positive }: { positive: boolean }) {
  return (
    <svg viewBox="0 0 64 28" className="h-7 w-16" aria-hidden="true">
      <path
        d={positive ? "M2 23 C10 18 14 20 21 15 S32 18 40 10 52 5 62 3" : "M2 8 C12 10 16 16 24 14 S36 8 44 17 54 21 62 24"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TickerRow() {
  const { data } = useSuspenseQuery(tickerQueryOptions);
  const loop = [...data, ...data];
  return (
    <div className="flex gap-3 py-3 whitespace-nowrap animate-ticker">
      {loop.map((i, idx) => {
        const positive = i.c.startsWith("+");
        return (
          <div key={idx} className="flex min-w-[170px] items-center justify-between gap-3 rounded-2xl border border-border bg-card/82 px-4 py-2 shadow-sm">
            <div>
              <div className="text-[11px] font-black tracking-wide text-foreground">{i.s}</div>
              <div className="mt-0.5 text-xs font-semibold text-muted-foreground">{i.p}</div>
            </div>
            <div className={`flex items-center gap-2 ${positive ? "text-success" : "text-destructive"}`}>
              <MiniSparkline positive={positive} />
              <span className="text-xs font-bold">{i.c}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TickerSkeleton() {
  return (
    <div className="flex gap-3 py-3 whitespace-nowrap">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[58px] min-w-[170px] rounded-2xl border border-border bg-card/70" />
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <div className="relative overflow-hidden border-y border-border bg-background/80 px-4 shadow-[0_24px_70px_-60px_color-mix(in_oklab,var(--gold)_50%,transparent)] sm:px-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-background to-transparent" />
      <Suspense fallback={<TickerSkeleton />}>
        <TickerRow />
      </Suspense>
    </div>
  );
}
