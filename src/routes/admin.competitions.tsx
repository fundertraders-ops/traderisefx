import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Trophy, UserX, Play, Pause, Award, Edit2, X } from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  adminListCompetitions,
  adminUpdateCompetition,
  adminListParticipants,
  adminUpdateAccountStats,
  adminDisqualifyParticipant,
  adminRemoveParticipant,
  adminAnnounceWinners,
  adminListPrizes,
  adminSetPrizeStatus,
} from "@/lib/competitions.functions";

export const Route = createFileRoute("/admin/competitions")({
  head: () => ({ meta: [{ title: "Competitions — Admin" }] }),
  component: AdminCompetitionsPage,
});

function AdminCompetitionsPage() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center gap-3 mb-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">Monthly Competitions</h1>
          </div>
          <CompetitionsManager />
        </main>
      </div>
    </SidebarProvider>
  );
}

function CompetitionsManager() {
  const qc = useQueryClient();
  const list = useServerFn(adminListCompetitions);
  const upd = useServerFn(adminUpdateCompetition);
  const announce = useServerFn(adminAnnounceWinners);
  const compsQ = useQuery({ queryKey: ["admin", "competitions"], queryFn: () => list() });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);

  const updateMut = useMutation({
    mutationFn: (v: any) => upd({ data: v }),
    onSuccess: () => { toast.success("Updated"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "competitions"] }); },
    onError: (e: any) => toast.error(e?.message),
  });

  const announceMut = useMutation({
    mutationFn: (id: string) => announce({ data: { competitionId: id } }),
    onSuccess: (r: any) => { toast.success(`Winners announced (${r.winners})`); qc.invalidateQueries({ queryKey: ["admin", "competitions"] }); },
    onError: (e: any) => toast.error(e?.message),
  });

  if (compsQ.isLoading) return <Loader2 className="animate-spin" />;
  const selected = compsQ.data?.find((c: any) => c.id === selectedId) ?? compsQ.data?.[0];

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      <div className="space-y-2">
        {(compsQ.data ?? []).map((c: any) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`w-full text-left rounded-lg border p-3 transition ${selected?.id === c.id ? "border-gold bg-card" : "border-border bg-card/40"}`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{new Date(c.starts_at).toLocaleString("en-US", { month: "long", year: "numeric" })}</div>
              <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{c.name}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border p-5 bg-card/40">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <p className="text-sm text-muted-foreground">${Number(selected.account_size).toLocaleString()} account · {selected.daily_drawdown_pct}% daily / {selected.max_drawdown_pct}% max drawdown</p>
                <p className="text-sm text-muted-foreground">Prizes: ${selected.prize_1} / ${selected.prize_2} / ${selected.prize_3}</p>
                <p className="text-sm text-muted-foreground">Ends {new Date(selected.ends_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(selected)}><Edit2 size={14}/> Edit</Button>
                {selected.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: selected.id, status: "paused" })}><Pause size={14}/> Pause</Button>
                )}
                {selected.status === "paused" && (
                  <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: selected.id, status: "active" })}><Play size={14}/> Resume</Button>
                )}
                {selected.status !== "ended" && (
                  <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: selected.id, status: "ended" })}>End</Button>
                )}
                {!selected.winners_announced_at && (
                  <Button size="sm" className="bg-gold-gradient text-primary-foreground"
                    onClick={() => announceMut.mutate(selected.id)} disabled={announceMut.isPending}>
                    <Trophy size={14}/> Announce Winners
                  </Button>
                )}
              </div>
            </div>
          </div>

          <ParticipantsPanel competitionId={selected.id} />
          <PrizesPanel />
        </div>
      )}

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Competition</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Name"><Input defaultValue={editing.name} onChange={(e) => (editing.name = e.target.value)} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="1st Prize"><Input type="number" defaultValue={editing.prize_1} onChange={(e) => (editing.prize_1 = Number(e.target.value))} /></Field>
                <Field label="2nd Prize"><Input type="number" defaultValue={editing.prize_2} onChange={(e) => (editing.prize_2 = Number(e.target.value))} /></Field>
                <Field label="3rd Prize"><Input type="number" defaultValue={editing.prize_3} onChange={(e) => (editing.prize_3 = Number(e.target.value))} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Daily Drawdown %"><Input type="number" defaultValue={editing.daily_drawdown_pct} onChange={(e) => (editing.daily_drawdown_pct = Number(e.target.value))} /></Field>
                <Field label="Max Drawdown %"><Input type="number" defaultValue={editing.max_drawdown_pct} onChange={(e) => (editing.max_drawdown_pct = Number(e.target.value))} /></Field>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => updateMut.mutate({
                id: editing.id, name: editing.name,
                prize_1: Number(editing.prize_1), prize_2: Number(editing.prize_2), prize_3: Number(editing.prize_3),
                daily_drawdown_pct: Number(editing.daily_drawdown_pct), max_drawdown_pct: Number(editing.max_drawdown_pct),
              })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs">{label}</Label>{children}</div>;
}

function ParticipantsPanel({ competitionId }: { competitionId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(adminListParticipants);
  const updStats = useServerFn(adminUpdateAccountStats);
  const dq = useServerFn(adminDisqualifyParticipant);
  const rm = useServerFn(adminRemoveParticipant);
  const q = useQuery({ queryKey: ["admin", "participants", competitionId], queryFn: () => list({ data: { competitionId } }) });
  const [editing, setEditing] = useState<any>(null);

  const statsMut = useMutation({
    mutationFn: (v: any) => updStats({ data: v }),
    onSuccess: () => { toast.success("Stats updated"); setEditing(null); q.refetch(); },
    onError: (e: any) => toast.error(e?.message),
  });
  const dqMut = useMutation({
    mutationFn: (v: any) => dq({ data: v }),
    onSuccess: () => { toast.success("Disqualified"); q.refetch(); },
  });
  const rmMut = useMutation({
    mutationFn: (id: string) => rm({ data: { accountId: id } }),
    onSuccess: () => { toast.success("Removed"); q.refetch(); },
  });

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <h3 className="font-semibold mb-3">Participants ({q.data?.length ?? 0})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground"><tr className="[&>th]:py-2 [&>th]:px-2 [&>th]:text-left">
            <th>Trader</th><th>Email</th><th>Login</th><th>Equity</th><th>Profit %</th><th>DD %</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {(q.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-border [&>td]:py-2 [&>td]:px-2">
                <td>{r.profile?.full_name || r.display_name || "—"}</td>
                <td className="text-xs">{r.profile?.email}</td>
                <td className="font-mono text-xs">{r.account_login}</td>
                <td>${Number(r.current_equity).toLocaleString()}</td>
                <td className={Number(r.profit_pct) >= 0 ? "text-emerald-400" : "text-red-400"}>{Number(r.profit_pct).toFixed(2)}%</td>
                <td>{Number(r.max_drawdown_pct).toFixed(2)}%</td>
                <td><Badge variant={r.status === "active" ? "default" : "destructive"}>{r.status}</Badge></td>
                <td className="text-right space-x-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}><Edit2 size={12}/></Button>
                  {r.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => {
                      const reason = prompt("Disqualification reason:"); if (reason) dqMut.mutate({ accountId: r.id, reason });
                    }}><UserX size={12}/></Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remove?")) rmMut.mutate(r.id); }}><X size={12}/></Button>
                </td>
              </tr>
            ))}
            {(q.data?.length ?? 0) === 0 && (
              <tr><td colSpan={8} className="text-center py-6 text-muted-foreground">No participants yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Update Stats — {editing.account_login}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Current Equity"><Input type="number" defaultValue={editing.current_equity} onChange={(e) => (editing.current_equity = Number(e.target.value))} /></Field>
              <Field label="Current Balance"><Input type="number" defaultValue={editing.current_balance} onChange={(e) => (editing.current_balance = Number(e.target.value))} /></Field>
              <Field label="Trades Count"><Input type="number" defaultValue={editing.trades_count} onChange={(e) => (editing.trades_count = Number(e.target.value))} /></Field>
              <Field label="Win Rate %"><Input type="number" defaultValue={editing.win_rate} onChange={(e) => (editing.win_rate = Number(e.target.value))} /></Field>
              <Field label="Daily Loss %"><Input type="number" defaultValue={editing.daily_loss_pct} onChange={(e) => (editing.daily_loss_pct = Number(e.target.value))} /></Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => statsMut.mutate({
                accountId: editing.id,
                current_equity: Number(editing.current_equity),
                current_balance: Number(editing.current_balance),
                trades_count: Number(editing.trades_count),
                win_rate: Number(editing.win_rate),
                daily_loss_pct: Number(editing.daily_loss_pct),
              })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PrizesPanel() {
  const list = useServerFn(adminListPrizes);
  const set = useServerFn(adminSetPrizeStatus);
  const q = useQuery({ queryKey: ["admin", "prizes"], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (v: any) => set({ data: v }),
    onSuccess: () => { toast.success("Updated"); q.refetch(); },
  });
  if (!q.data?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2"><Award size={16}/> Prizes</h3>
      <div className="space-y-2">
        {q.data.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <div className="text-sm font-semibold">#{p.rank} · ${Number(p.amount).toLocaleString()} · {p.profile?.full_name || p.profile?.email}</div>
              <div className="text-xs text-muted-foreground">{p.competition?.name}</div>
            </div>
            <div className="flex gap-2">
              <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
              {p.status === "pending" && <Button size="sm" variant="outline" onClick={() => mut.mutate({ prizeId: p.id, status: "approved" })}>Approve</Button>}
              {p.status !== "paid" && <Button size="sm" onClick={() => mut.mutate({ prizeId: p.id, status: "paid" })}>Mark Paid</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
