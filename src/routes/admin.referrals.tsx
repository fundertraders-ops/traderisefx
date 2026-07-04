import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users, ArrowLeft, RefreshCcw, Percent, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/trade-results.functions";
import {
  getReferralSettings,
  updateReferralRate,
  listAllReferralActivity,
  setCommissionStatus,
} from "@/lib/admin-referrals.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export const Route = createFileRoute("/admin/referrals")({
  head: () => ({ meta: [{ title: "Referrals — Trade Rise FX Admin" }] }),
  component: AdminReferralsPage,
});

function AdminReferralsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchSettings = useServerFn(getReferralSettings);
  const updateRate = useServerFn(updateReferralRate);
  const fetchActivity = useServerFn(listAllReferralActivity);
  const updateStatus = useServerFn(setCommissionStatus);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin/referrals" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
    enabled: !!user,
  });

  const settingsQ = useQuery({
    queryKey: ["referral-settings"],
    queryFn: () => fetchSettings(),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  const activityQ = useQuery({
    queryKey: ["referral-activity"],
    queryFn: () => fetchActivity(),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  const [rate, setRate] = useState<string>("");
  useEffect(() => {
    if (settingsQ.data?.rate !== undefined) setRate(String(settingsQ.data.rate));
  }, [settingsQ.data]);

  const saveRateMut = useMutation({
    mutationFn: () => updateRate({ data: { rate: Number(rate) } }),
    onSuccess: () => {
      toast.success("Commission rate updated");
      qc.invalidateQueries({ queryKey: ["referral-settings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update rate"),
  });

  const statusMut = useMutation({
    mutationFn: (vars: { id: string; status: "credited" | "pending" | "rejected" }) =>
      updateStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Commission updated");
      qc.invalidateQueries({ queryKey: ["referral-activity"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update commission"),
  });

  if (loading || !user || adminQ.isLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Loader2 className="animate-spin text-gold" />
      </div>
    );
  }

  if (!adminQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="pt-32 pb-16 px-6 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm text-gold">
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  const summary = activityQ.data?.summary ?? [];
  const commissions = activityQ.data?.commissions ?? [];

  const statusBadge = (s: string) => {
    const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs";
    if (s === "credited") return `${base} border-emerald-500/30 text-emerald-500 bg-emerald-500/10`;
    if (s === "pending") return `${base} border-yellow-500/30 text-yellow-600 bg-yellow-500/10`;
    return `${base} border-red-500/30 text-red-600 bg-red-500/10`;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Nav />
          <main className="flex-1 pt-28 pb-16">
            <section className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-2 mb-4 min-w-0">
                <SidebarTrigger className="h-8 w-8 shrink-0" />
                <AdminBreadcrumb currentPage="Referrals" />
              </div>

              <div className="mb-6">
                <span className="text-xs uppercase tracking-[0.2em] text-gold">Admin</span>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold inline-flex items-center gap-3">
                  <Users className="text-gold" /> Referrals & Commissions
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monitor referral activity, adjust the commission rate, and moderate payouts.
                </p>
              </div>

              {/* Settings card */}
              <div className="rounded-2xl border border-gold/30 bg-card/50 p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Percent className="text-gold h-4 w-4" />
                  <h2 className="font-semibold">Commission rate</h2>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Rate (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className="mt-1 h-10 w-32 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold/60"
                    />
                  </label>
                  <Button
                    onClick={() => saveRateMut.mutate()}
                    disabled={saveRateMut.isPending || !rate || Number(rate) < 0 || Number(rate) > 100}
                    className="bg-gold-gradient text-primary-foreground"
                  >
                    {saveRateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save rate
                  </Button>
                  {settingsQ.data?.updatedAt && (
                    <span className="text-xs text-muted-foreground">
                      Last updated {new Date(settingsQ.data.updatedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Applies to all newly approved orders. Existing commissions are unaffected.
                </p>
              </div>

              {/* Top referrers */}
              <div className="rounded-2xl border border-border bg-card/50 p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Top referrers</h2>
                  <button
                    onClick={() => activityQ.refetch()}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Refresh"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                </div>
                {activityQ.isLoading ? (
                  <div className="py-8 grid place-items-center">
                    <Loader2 className="animate-spin text-gold h-5 w-5" />
                  </div>
                ) : summary.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No referral activity yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-border">
                          <th className="py-2 pr-3">User</th>
                          <th className="py-2 pr-3">Code</th>
                          <th className="py-2 pr-3 text-right">Referrals</th>
                          <th className="py-2 pr-3 text-right">Credited</th>
                          <th className="py-2 pr-3 text-right">Pending</th>
                          <th className="py-2 pr-3 text-right">Wallet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.map((s: any) => (
                          <tr key={s.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2 pr-3">
                              <div className="font-medium">{s.full_name ?? "—"}</div>
                              <div className="text-xs text-muted-foreground">{s.email}</div>
                            </td>
                            <td className="py-2 pr-3 font-mono text-xs">{s.referral_code}</td>
                            <td className="py-2 pr-3 text-right">{s.referrals_count}</td>
                            <td className="py-2 pr-3 text-right text-emerald-500">${s.credited.toFixed(2)}</td>
                            <td className="py-2 pr-3 text-right text-yellow-600">${s.pending.toFixed(2)}</td>
                            <td className="py-2 pr-3 text-right">${s.wallet_balance.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* All commissions */}
              <div className="rounded-2xl border border-border bg-card/50 p-5">
                <h2 className="font-semibold mb-3">All commissions</h2>
                {commissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No commissions recorded.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-border">
                          <th className="py-2 pr-3">Date</th>
                          <th className="py-2 pr-3">Referrer</th>
                          <th className="py-2 pr-3">Referred</th>
                          <th className="py-2 pr-3">Order</th>
                          <th className="py-2 pr-3 text-right">Amount</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map((c: any) => (
                          <tr key={c.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2 pr-3 text-xs text-muted-foreground">
                              {new Date(c.created_at).toLocaleString()}
                            </td>
                            <td className="py-2 pr-3">
                              <div className="font-medium">{c.referrer?.full_name ?? "—"}</div>
                              <div className="text-xs text-muted-foreground">{c.referrer?.email}</div>
                            </td>
                            <td className="py-2 pr-3 text-xs">
                              {c.referred?.email ?? c.referred_user_id?.slice(0, 8) ?? "—"}
                            </td>
                            <td className="py-2 pr-3 font-mono text-xs">{c.order_id}</td>
                            <td className="py-2 pr-3 text-right font-medium">${Number(c.amount).toFixed(2)}</td>
                            <td className="py-2 pr-3"><span className={statusBadge(c.status)}>{c.status}</span></td>
                            <td className="py-2 pr-3 text-right">
                              <div className="inline-flex gap-1">
                                {c.status !== "credited" && (
                                  <button
                                    onClick={() => statusMut.mutate({ id: c.id, status: "credited" })}
                                    className="p-1.5 rounded-md border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                    title="Approve / credit"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                )}
                                {c.status !== "pending" && (
                                  <button
                                    onClick={() => statusMut.mutate({ id: c.id, status: "pending" })}
                                    className="p-1.5 rounded-md border border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
                                    title="Mark pending"
                                  >
                                    <Clock className="h-3 w-3" />
                                  </button>
                                )}
                                {c.status !== "rejected" && (
                                  <button
                                    onClick={() => statusMut.mutate({ id: c.id, status: "rejected" })}
                                    className="p-1.5 rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10"
                                    title="Reject"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
