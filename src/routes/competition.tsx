import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy, Loader2, Clock, Users, ShieldCheck, Award, Radio } from "lucide-react";
import { toast } from "sonner";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  getActiveCompetition,
  getLeaderboard,
  joinCompetition,
  listPreviousWinners,
  getMyCompetitionAccount,
} from "@/lib/competitions.functions";

export const Route = createFileRoute("/competition")({
  head: () => ({
    meta: [
      { title: "Monthly Trading Competition — Trade Rise FX" },
      { name: "description", content: "Free $20,000 monthly trading competition. Win up to $5,000 cash. Live leaderboard, no entry fee." },
    ],
  }),
  component: CompetitionPage,
});

function useCountdown(target?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const ms = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s };
}

function CompetitionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const join = useServerFn(joinCompetition);
  const queryClient = useQueryClient();
  const [liveConnected, setLiveConnected] = useState(false);

  const activeQ = useQuery({ queryKey: ["competition", "active"], queryFn: () => getActiveCompetition() });
  const comp = activeQ.data?.competition;
  const participantCount = activeQ.data?.participantCount ?? 0;

  const lbQ = useQuery({
    queryKey: ["competition", "leaderboard", comp?.id],
    queryFn: () => getLeaderboard({ data: { competitionId: comp!.id } }),
    enabled: !!comp?.id,
  });

  const myQ = useQuery({
    queryKey: ["competition", "me"],
    queryFn: () => getMyCompetitionAccount(),
    enabled: !!user,
  });

  // Live updates via Realtime — replaces polling
  useEffect(() => {
    if (!comp?.id) return;
    const channel = supabase
      .channel(`competition:${comp.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "competition_accounts", filter: `competition_id=eq.${comp.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["competition", "leaderboard", comp.id] });
          queryClient.invalidateQueries({ queryKey: ["competition", "me"] });
          queryClient.invalidateQueries({ queryKey: ["competition", "active"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "competitions", filter: `id=eq.${comp.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["competition", "active"] }),
      )
      .subscribe((status) => setLiveConnected(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
      setLiveConnected(false);
    };
  }, [comp?.id, queryClient]);

  const prevQ = useQuery({ queryKey: ["competition", "winners"], queryFn: () => listPreviousWinners() });

  const countdown = useCountdown(comp?.ends_at);

  const joinMut = useMutation({
    mutationFn: () => join(),
    onSuccess: (r: any) => {
      if (r.alreadyJoined) toast.info("You're already in this month's competition.");
      else toast.success("Joined! Credentials sent to your email.");
      myQ.refetch();
      activeQ.refetch();
      lbQ.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not join"),
  });

  const handleJoin = () => {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/competition" } });
      return;
    }
    joinMut.mutate();
  };

  const alreadyIn = !!myQ.data?.account;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-28 pb-20">
        <section className="max-w-7xl mx-auto px-6">
          <div className="rounded-2xl border border-gold/30 bg-gradient-to-b from-card to-background p-8 md:p-12 text-center">
            <Badge className="bg-gold/10 text-gold border-gold/30">FREE · MONTHLY</Badge>
            <h1 className="mt-4 text-4xl md:text-6xl font-bold">Monthly Trading Competition</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Trade a free $20,000 demo account. Top profit % each month wins real cash. No entry fee. No restrictions.
            </p>
            {comp && countdown && (
              <div className="mt-6 inline-flex items-center gap-4 text-sm text-muted-foreground">
                <Clock className="text-gold" size={16} />
                <span>Ends in <strong className="text-foreground">{countdown.d}d {countdown.h}h {countdown.m}m {countdown.s}s</strong></span>
                <span className="hidden md:inline">·</span>
                <span className="hidden md:inline"><Users className="inline mr-1" size={14} /> {participantCount} participants</span>
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="bg-gold-gradient text-primary-foreground" onClick={handleJoin} disabled={joinMut.isPending || alreadyIn || !comp}>
                {joinMut.isPending ? <Loader2 className="animate-spin" /> : <Trophy />}
                {alreadyIn ? "You're In — View Your Account" : "Join Monthly Competition"}
              </Button>
              {user && <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground self-center">Open dashboard →</Link>}
            </div>
          </div>
        </section>

        {/* Prizes */}
        <section className="max-w-7xl mx-auto px-6 mt-12 grid md:grid-cols-3 gap-4">
          {[
            { rank: "1st", amount: comp?.prize_1 ?? 5000, color: "text-yellow-400" },
            { rank: "2nd", amount: comp?.prize_2 ?? 2000, color: "text-zinc-300" },
            { rank: "3rd", amount: comp?.prize_3 ?? 1000, color: "text-amber-700" },
          ].map((p) => (
            <div key={p.rank} className="rounded-xl border border-border bg-card/40 p-6 text-center">
              <Award className={`mx-auto ${p.color}`} />
              <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{p.rank} Place</div>
              <div className="mt-1 text-3xl font-bold">${Number(p.amount).toLocaleString()}</div>
            </div>
          ))}
        </section>

        {/* Rules */}
        <section className="max-w-7xl mx-auto px-6 mt-12">
          <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-gold" size={20}/> Competition Rules</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <Rule label="Account Size" value={`$${Number(comp?.account_size ?? 20000).toLocaleString()}`} />
            <Rule label="Daily Drawdown Limit" value={`${comp?.daily_drawdown_pct ?? 10}%`} />
            <Rule label="Maximum Drawdown Limit" value={`${comp?.max_drawdown_pct ?? 20}%`} />
            <Rule label="Minimum Trading Days" value="None" />
            <Rule label="Consistency Rule" value="None" />
            <Rule label="News / EA / Lot Size Restrictions" value="None" />
          </div>
        </section>

        {/* Leaderboard */}
        <section className="max-w-7xl mx-auto px-6 mt-12">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold">Live Leaderboard</h2>
            <span className={`text-xs inline-flex items-center gap-1.5 ${liveConnected ? "text-emerald-500" : "text-muted-foreground"}`}>
              <Radio className={`h-3 w-3 ${liveConnected ? "animate-pulse" : ""}`} />
              {liveConnected ? "Live" : "Connecting…"}
            </span>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-card/60 text-muted-foreground">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                  <th>#</th><th>Trader</th><th>Account</th><th>Profit %</th><th>Profit $</th><th>Trades</th><th>Win Rate</th><th>Equity</th><th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {lbQ.isLoading ? (
                  <tr><td colSpan={9} className="text-center py-8"><Loader2 className="inline animate-spin" /></td></tr>
                ) : (lbQ.data?.active.length ?? 0) === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No participants yet. Be the first to join!</td></tr>
                ) : (
                  lbQ.data!.active.map((r, i) => (
                    <tr key={r.id} className="border-t border-border [&>td]:px-4 [&>td]:py-3">
                      <td className="font-bold">{i + 1}</td>
                      <td>{r.display_name || "Trader"}</td>
                      <td className="font-mono text-xs">—</td>
                      <td className={Number(r.profit_pct) >= 0 ? "text-emerald-400 font-semibold" : "text-red-400"}>{Number(r.profit_pct).toFixed(2)}%</td>
                      <td>${Number(r.profit_usd).toLocaleString()}</td>
                      <td>{r.trades_count}</td>
                      <td>{Number(r.win_rate).toFixed(1)}%</td>
                      <td>${Number(r.current_equity).toLocaleString()}</td>
                      <td className="text-xs text-muted-foreground">{new Date(r.last_updated_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
                {(lbQ.data?.inactive ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-border opacity-50 [&>td]:px-4 [&>td]:py-2">
                    <td>—</td><td>{r.display_name || "Trader"}</td><td className="font-mono text-xs">—</td>
                    <td colSpan={6} className="text-xs text-red-400">{r.status === "breached" ? "Breached" : "Disqualified"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Previous winners */}
        {(prevQ.data?.length ?? 0) > 0 && (
          <section className="max-w-7xl mx-auto px-6 mt-12">
            <h2 className="text-2xl font-bold">Previous Winners</h2>
            <div className="mt-4 grid md:grid-cols-3 gap-3">
              {prevQ.data!.slice(0, 9).map((p: any) => (
                <div key={p.id} className="rounded-lg border border-border bg-card/40 p-4">
                  <div className="text-xs text-muted-foreground">{p.competition?.name}</div>
                  <div className="mt-1 font-semibold">#{p.rank} · ${Number(p.amount).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{p.account ? Number(p.account.profit_pct).toFixed(2) + "%" : "—"}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
