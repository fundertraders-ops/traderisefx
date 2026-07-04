import { useEffect, useState, useMemo } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Search, Users as UsersIcon, Shield, X } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/trade-results.functions";
import {
  listAllUsers,
  getUserDetails,
  setUserRole,
  updateWithdrawalStatus,
} from "@/lib/admin-users.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Trade Rise FX Admin" }] }),
  component: AdminUsersPage,
});

function fmt(n: number) {
  return `$${Number(n ?? 0).toFixed(2)}`;
}

function AdminUsersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin/users" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
    enabled: !!user,
  });

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listAllUsers(),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  const [search, setSearch] = useState("");
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = usersQ.data?.users ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u: any) =>
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.referral_code?.toLowerCase().includes(q),
    );
  }, [usersQ.data, search]);

  const roleMut = useMutation({
    mutationFn: (vars: { userId: string; action: "grant" | "revoke" }) =>
      setUserRole({ data: { userId: vars.userId, role: "admin", action: vars.action } }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
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

  const totalWallet = (usersQ.data?.users ?? []).reduce(
    (s: number, u: any) => s + Number(u.wallet_balance ?? 0),
    0,
  );
  const totalRevenue = (usersQ.data?.users ?? []).reduce(
    (s: number, u: any) => s + Number(u.orders_total ?? 0),
    0,
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Nav />
          <main className="flex-1 pt-28 pb-16">
            <section className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-2 mb-4">
                <SidebarTrigger className="h-8 w-8 shrink-0" />
                <AdminBreadcrumb currentPage="Users" />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-gold">Admin</span>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-bold inline-flex items-center gap-3">
                    <UsersIcon className="text-gold" /> User management
                  </h1>
                </div>
              </div>

              <div className="mt-6 grid sm:grid-cols-3 gap-3">
                <StatCard label="Total users" value={String(usersQ.data?.users?.length ?? 0)} />
                <StatCard label="Total revenue" value={fmt(totalRevenue)} />
                <StatCard label="Wallet liability" value={fmt(totalWallet)} />
              </div>

              <div className="mt-6 flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search email, name, or referral code"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card/50">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Wallet</th>
                      <th className="text-left p-3">Earned</th>
                      <th className="text-left p-3">Orders</th>
                      <th className="text-left p-3">Refs</th>
                      <th className="text-left p-3">Pending W/D</th>
                      <th className="text-left p-3">Roles</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersQ.isLoading ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center">
                          <Loader2 className="animate-spin text-gold inline" />
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((u: any) => {
                        const isAdmin = u.roles.includes("admin");
                        return (
                          <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                            <td className="p-3">
                              <div className="font-medium">{u.full_name || "—"}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                              <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                                Code: {u.referral_code}
                              </div>
                            </td>
                            <td className="p-3">{fmt(u.wallet_balance)}</td>
                            <td className="p-3">{fmt(u.total_earned)}</td>
                            <td className="p-3">
                              {u.orders_count} <span className="text-xs text-muted-foreground">({fmt(u.orders_total)})</span>
                            </td>
                            <td className="p-3">{u.referral_count}</td>
                            <td className="p-3">{fmt(u.withdrawals_pending)}</td>
                            <td className="p-3">
                              {u.roles.map((r: string) => (
                                <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="mr-1">
                                  {r}
                                </Badge>
                              ))}
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setOpenUserId(u.id)}>
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant={isAdmin ? "destructive" : "default"}
                                  disabled={roleMut.isPending}
                                  onClick={() =>
                                    roleMut.mutate({ userId: u.id, action: isAdmin ? "revoke" : "grant" })
                                  }
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  {isAdmin ? "Revoke" : "Make admin"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
          <Footer />
        </div>
      </div>

      <UserDetailDialog userId={openUserId} onClose={() => setOpenUserId(null)} />
    </SidebarProvider>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gold-gradient">{value}</div>
    </div>
  );
}

function UserDetailDialog({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const detailQ = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => getUserDetails({ data: { userId: userId! } }),
    enabled: !!userId,
  });

  const wMut = useMutation({
    mutationFn: (vars: { id: string; status: "pending" | "approved" | "rejected" | "paid" }) =>
      updateWithdrawalStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Withdrawal updated");
      qc.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
        </DialogHeader>
        {detailQ.isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="animate-spin text-gold inline" />
          </div>
        ) : !detailQ.data?.profile ? (
          <div className="text-sm text-muted-foreground">Not found</div>
        ) : (
          <div className="space-y-6 text-sm">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Name" value={detailQ.data.profile.full_name ?? "—"} />
              <Field label="Email" value={detailQ.data.profile.email ?? "—"} />
              <Field label="Referral code" value={detailQ.data.profile.referral_code ?? "—"} />
              <Field label="Wallet balance" value={fmt(detailQ.data.profile.wallet_balance)} />
              <Field label="Total earned" value={fmt(detailQ.data.profile.total_earned)} />
              <Field
                label="Joined"
                value={new Date(detailQ.data.profile.created_at).toLocaleString()}
              />
            </div>

            <Section title={`Orders (${detailQ.data.orders.length})`}>
              {detailQ.data.orders.length === 0 ? (
                <Empty />
              ) : (
                detailQ.data.orders.map((o: any) => (
                  <Row key={o.id}>
                    <div>
                      <div className="font-medium">{o.plan} · {o.size}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground/70 break-all">tx: {o.tx_hash}</div>
                    </div>
                    <div className="text-right">
                      <div>{fmt(o.amount)}</div>
                      <Badge variant="secondary">{o.status}</Badge>
                    </div>
                  </Row>
                ))
              )}
            </Section>

            <Section title={`Withdrawals (${detailQ.data.withdrawals.length})`}>
              {detailQ.data.withdrawals.length === 0 ? (
                <Empty />
              ) : (
                detailQ.data.withdrawals.map((w: any) => (
                  <Row key={w.id}>
                    <div>
                      <div className="font-medium">{fmt(w.amount)} via {w.method}</div>
                      <div className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</div>
                      <pre className="text-[10px] text-muted-foreground/70 mt-1 whitespace-pre-wrap break-all">
                        {JSON.stringify(w.payout_details, null, 0)}
                      </pre>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge>{w.status}</Badge>
                      {w.status === "pending" && (
                        <div className="flex flex-col gap-1">
                          <Button size="sm" onClick={() => wMut.mutate({ id: w.id, status: "paid" })}>
                            Mark paid
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => wMut.mutate({ id: w.id, status: "rejected" })}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </Row>
                ))
              )}
            </Section>

            <Section title={`Commissions (${detailQ.data.commissions.length})`}>
              {detailQ.data.commissions.length === 0 ? (
                <Empty />
              ) : (
                detailQ.data.commissions.map((c: any) => (
                  <Row key={c.id}>
                    <div className="text-xs text-muted-foreground">
                      Order {c.order_id} · {new Date(c.created_at).toLocaleString()}
                    </div>
                    <div className="text-right">
                      <div>{fmt(c.amount)}</div>
                      <Badge variant="secondary">{c.status}</Badge>
                    </div>
                  </Row>
                ))
              )}
            </Section>

            <Section title={`Referrals (${detailQ.data.referrals.length})`}>
              {detailQ.data.referrals.length === 0 ? (
                <Empty />
              ) : (
                detailQ.data.referrals.map((r: any) => (
                  <Row key={r.referred_user_id}>
                    <div className="text-xs break-all">{r.referred_user_id}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </Row>
                ))
              )}
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 break-all">{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-gold mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/40 p-3">
      {children}
    </div>
  );
}
function Empty() {
  return <div className="text-xs text-muted-foreground italic">None</div>;
}
