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

function TickerRow() {
  const { data } = useSuspenseQuery(tickerQueryOptions);
  const loop = [...data, ...data];
  return (
    <div className="flex gap-12 py-3 whitespace-nowrap animate-ticker">
      {loop.map((i, idx) => (
        <div key={idx} className="flex items-center gap-3 text-sm">
          <span className="font-semibold tracking-wide">{i.s}</span>
          <span className="text-muted-foreground">{i.p}</span>
          <span className={i.c.startsWith("+") ? "text-success" : "text-destructive"}>{i.c}</span>
        </div>
      ))}
    </div>
  );
}

function TickerSkeleton() {
  const placeholders = Array.from({ length: 10 });
  return (
    <div className="flex gap-12 py-3 whitespace-nowrap">
      {placeholders.map((_, i) => (
        <div key={i} className="flex items-center gap-3 text-sm opacity-50">
          <span className="font-semibold tracking-wide">———</span>
          <span className="text-muted-foreground">·····</span>
        </div>
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <div className="border-y border-border bg-card/30 overflow-hidden">
      <Suspense fallback={<TickerSkeleton />}>
        <TickerRow />
      </Suspense>
    </div>
  );
}
