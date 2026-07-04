import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Briefcase, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/trade-results.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  listSalesTeam,
  upsertSalesMember,
  deleteSalesMember,
  upsertBusinessEntry,
  deleteBusinessEntry,
} from "@/lib/sales-team.functions";
import {
  SALARY_TIERS,
  SMALL_BUSINESS_RATE,
  computeSalary,
  currentMonthKey,
  monthKeyFromDate,
} from "@/lib/sales-team";

export const Route = createFileRoute("/admin/sales-team")({
  head: () => ({ meta: [{ title: "Sales Team — Trade Rise FX Admin" }] }),
  component: AdminSalesTeamPage,
});

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  role: "BDM" | "RM" | "ARM";
  notes: string | null;
  active: boolean;
};

type Entry = {
  id: string;
  member_id: string;
  period_month: string;
  business_volume: number | string;
  approved: boolean;
  description: string | null;
};

function AdminSalesTeamPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchAll = useServerFn(listSalesTeam);
  const saveMember = useServerFn(upsertSalesMember);
  const removeMember = useServerFn(deleteSalesMember);
  const saveEntry = useServerFn(upsertBusinessEntry);
  const removeEntry = useServerFn(deleteBusinessEntry);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin/sales-team" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
    enabled: !!user,
  });

  const dataQ = useQuery({
    queryKey: ["sales-team"],
    queryFn: () => fetchAll(),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [memberForm, setMemberForm] = useState<Partial<Member> | null>(null);
  const [entryForm, setEntryForm] = useState<
    | (Partial<Entry> & { _memberId?: string })
    | null
  >(null);

  const members: Member[] = (dataQ.data?.members ?? []) as Member[];
  const entries: Entry[] = (dataQ.data?.entries ?? []) as Entry[];

  const monthEntries = useMemo(
    () => entries.filter((e) => monthKeyFromDate(e.period_month) === selectedMonth),
    [entries, selectedMonth],
  );

  const memberRows = useMemo(() => {
    return members.map((m) => {
      const memberMonthEntries = monthEntries.filter((e) => e.member_id === m.id);
      const approvedVol = memberMonthEntries
        .filter((e) => e.approved)
        .reduce((s, e) => s + Number(e.business_volume), 0);
      const pendingVol = memberMonthEntries
        .filter((e) => !e.approved)
        .reduce((s, e) => s + Number(e.business_volume), 0);
      const calc = computeSalary(approvedVol);
      return { member: m, approvedVol, pendingVol, ...calc, entries: memberMonthEntries };
    });
  }, [members, monthEntries]);

  const totalApproved = memberRows.reduce((s, r) => s + r.approvedVol, 0);
  const totalPayout = memberRows.reduce((s, r) => s + r.salary, 0);

  const saveMemberMut = useMutation({
    mutationFn: (m: Partial<Member>) => saveMember({ data: m as any }),
    onSuccess: () => {
      toast.success("Team member saved");
      setMemberForm(null);
      qc.invalidateQueries({ queryKey: ["sales-team"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  const removeMemberMut = useMutation({
    mutationFn: (id: string) => removeMember({ data: { id } }),
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: ["sales-team"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const saveEntryMut = useMutation({
    mutationFn: (e: any) => saveEntry({ data: e }),
    onSuccess: () => {
      toast.success("Entry saved");
      setEntryForm(null);
      qc.invalidateQueries({ queryKey: ["sales-team"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const removeEntryMut = useMutation({
    mutationFn: (id: string) => removeEntry({ data: { id } }),
    onSuccess: () => {
      toast.success("Entry deleted");
      qc.invalidateQueries({ queryKey: ["sales-team"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
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

  const input =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold/60";

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
                <AdminBreadcrumb currentPage="Sales Team" />
              </div>

              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-gold">Admin</span>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-bold inline-flex items-center gap-3">
                    <Briefcase className="text-gold" /> Sales Team Commissions
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    BDM / RM / ARM compensation — salary auto-calculated from approved monthly
                    business volume.
                  </p>
                </div>
                <div className="flex items-end gap-3">
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Month</span>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className={`${input} mt-1 w-44`}
                    />
                  </label>
                  <Button
                    onClick={() =>
                      setMemberForm({ full_name: "", email: "", role: "BDM", active: true })
                    }
                    className="bg-gold-gradient text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add member
                  </Button>
                </div>
              </div>

              {/* Tiers */}
              <div className="rounded-2xl border border-gold/30 bg-card/50 p-5 mb-6">
                <h2 className="font-semibold mb-3">Salary tiers</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[...SALARY_TIERS].reverse().map((t) => (
                    <div
                      key={t.volume}
                      className="rounded-xl border border-border bg-background/60 p-3"
                    >
                      <div className="text-xs text-muted-foreground">Business volume</div>
                      <div className="font-semibold">${t.volume.toLocaleString()}+</div>
                      <div className="mt-1 text-xs text-muted-foreground">Salary</div>
                      <div className="text-gold font-semibold">
                        ${t.salary.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Volumes below $2,000 earn a proportional small-business commission at{" "}
                  {(SMALL_BUSINESS_RATE * 100).toFixed(0)}%.
                </p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <Card label="Team members" value={members.length.toString()} />
                <Card
                  label={`Approved volume (${selectedMonth})`}
                  value={`$${totalApproved.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                />
                <Card
                  label="Total payout"
                  value={`$${totalPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  accent
                />
              </div>

              {/* Member table */}
              <div className="rounded-2xl border border-border bg-card/50 p-5">
                <h2 className="font-semibold mb-3">Team performance — {selectedMonth}</h2>
                {dataQ.isLoading ? (
                  <div className="py-8 grid place-items-center">
                    <Loader2 className="animate-spin text-gold h-5 w-5" />
                  </div>
                ) : memberRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No team members yet. Add one to get started.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-border">
                          <th className="py-2 pr-3">Member</th>
                          <th className="py-2 pr-3">Role</th>
                          <th className="py-2 pr-3 text-right">Approved volume</th>
                          <th className="py-2 pr-3 text-right">Pending</th>
                          <th className="py-2 pr-3">Tier</th>
                          <th className="py-2 pr-3 text-right">Salary</th>
                          <th className="py-2 pr-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberRows.map((r) => (
                          <tr
                            key={r.member.id}
                            className="border-b border-border/50 last:border-0 align-top"
                          >
                            <td className="py-3 pr-3">
                              <div className="font-medium">{r.member.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {r.member.email ?? "—"}
                              </div>
                              {!r.member.active && (
                                <span className="mt-1 inline-block text-[10px] uppercase border border-border rounded px-1 text-muted-foreground">
                                  inactive
                                </span>
                              )}
                              {r.entries.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {r.entries.map((e) => (
                                    <li
                                      key={e.id}
                                      className="text-xs flex items-center gap-2 flex-wrap"
                                    >
                                      <span
                                        className={
                                          e.approved
                                            ? "text-emerald-500"
                                            : "text-yellow-500"
                                        }
                                      >
                                        {e.approved ? "✓" : "•"}
                                      </span>
                                      <span>
                                        ${Number(e.business_volume).toLocaleString()}
                                      </span>
                                      {e.description && (
                                        <span className="text-muted-foreground truncate max-w-[200px]">
                                          {e.description}
                                        </span>
                                      )}
                                      <button
                                        onClick={() =>
                                          setEntryForm({
                                            id: e.id,
                                            member_id: e.member_id,
                                            period_month: monthKeyFromDate(e.period_month),
                                            business_volume: Number(e.business_volume),
                                            approved: e.approved,
                                            description: e.description,
                                          })
                                        }
                                        className="text-muted-foreground hover:text-foreground"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => removeEntryMut.mutate(e.id)}
                                        className="text-muted-foreground hover:text-red-500"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                            <td className="py-3 pr-3">
                              <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs text-gold">
                                {r.member.role}
                              </span>
                            </td>
                            <td className="py-3 pr-3 text-right font-medium">
                              ${r.approvedVol.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 pr-3 text-right text-yellow-500">
                              ${r.pendingVol.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 pr-3 text-xs text-muted-foreground">{r.tier}</td>
                            <td className="py-3 pr-3 text-right font-semibold text-gold">
                              ${r.salary.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 pr-3 text-right">
                              <div className="inline-flex gap-1">
                                <button
                                  onClick={() =>
                                    setEntryForm({
                                      member_id: r.member.id,
                                      period_month: selectedMonth,
                                      business_volume: 0,
                                      approved: false,
                                      description: "",
                                    })
                                  }
                                  className="p-1.5 rounded-md border border-gold/30 text-gold hover:bg-gold/10"
                                  title="Add business entry"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => setMemberForm(r.member)}
                                  className="p-1.5 rounded-md border border-border hover:bg-muted/30"
                                  title="Edit member"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete ${r.member.full_name}? All entries will be removed.`))
                                      removeMemberMut.mutate(r.member.id);
                                  }}
                                  className="p-1.5 rounded-md border border-red-500/30 text-red-500 hover:bg-red-500/10"
                                  title="Delete member"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Member modal */}
              {memberForm && (
                <Modal title={memberForm.id ? "Edit member" : "Add member"} onClose={() => setMemberForm(null)}>
                  <div className="space-y-3">
                    <Field label="Full name">
                      <input
                        className={input}
                        value={memberForm.full_name ?? ""}
                        onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                      />
                    </Field>
                    <Field label="Email (optional)">
                      <input
                        className={input}
                        value={memberForm.email ?? ""}
                        onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                      />
                    </Field>
                    <Field label="Role">
                      <select
                        className={input}
                        value={memberForm.role ?? "BDM"}
                        onChange={(e) =>
                          setMemberForm({ ...memberForm, role: e.target.value as any })
                        }
                      >
                        <option value="BDM">BDM — Business Development Manager</option>
                        <option value="RM">RM — Relationship Manager</option>
                        <option value="ARM">ARM — Assistant Relationship Manager</option>
                      </select>
                    </Field>
                    <Field label="Notes">
                      <textarea
                        className={`${input} h-20 py-2`}
                        value={memberForm.notes ?? ""}
                        onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={memberForm.active ?? true}
                        onChange={(e) =>
                          setMemberForm({ ...memberForm, active: e.target.checked })
                        }
                      />
                      Active
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setMemberForm(null)}>Cancel</Button>
                      <Button
                        onClick={() => {
                          if (!memberForm.full_name?.trim()) {
                            toast.error("Name is required");
                            return;
                          }
                          saveMemberMut.mutate({
                            id: memberForm.id,
                            full_name: memberForm.full_name!.trim(),
                            email: memberForm.email?.trim() || null,
                            role: (memberForm.role ?? "BDM") as any,
                            notes: memberForm.notes ?? null,
                            active: memberForm.active ?? true,
                          });
                        }}
                        disabled={saveMemberMut.isPending}
                        className="bg-gold-gradient text-primary-foreground"
                      >
                        {saveMemberMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </Modal>
              )}

              {/* Entry modal */}
              {entryForm && (
                <Modal
                  title={entryForm.id ? "Edit business entry" : "Add business entry"}
                  onClose={() => setEntryForm(null)}
                >
                  <div className="space-y-3">
                    <Field label="Member">
                      <select
                        className={input}
                        value={entryForm.member_id ?? ""}
                        onChange={(e) =>
                          setEntryForm({ ...entryForm, member_id: e.target.value })
                        }
                      >
                        <option value="">— select —</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name} ({m.role})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Month">
                      <input
                        type="month"
                        className={input}
                        value={entryForm.period_month ?? selectedMonth}
                        onChange={(e) =>
                          setEntryForm({ ...entryForm, period_month: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Business volume (USD)">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className={input}
                        value={Number(entryForm.business_volume ?? 0)}
                        onChange={(e) =>
                          setEntryForm({
                            ...entryForm,
                            business_volume: Number(e.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Projected salary:{" "}
                        <span className="text-gold font-medium">
                          ${computeSalary(Number(entryForm.business_volume ?? 0)).salary.toLocaleString()}
                        </span>{" "}
                        — only counts when approved.
                      </p>
                    </Field>
                    <Field label="Description (optional)">
                      <input
                        className={input}
                        value={entryForm.description ?? ""}
                        onChange={(e) =>
                          setEntryForm({ ...entryForm, description: e.target.value })
                        }
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={entryForm.approved ?? false}
                        onChange={(e) =>
                          setEntryForm({ ...entryForm, approved: e.target.checked })
                        }
                      />
                      Approved (counts toward salary)
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setEntryForm(null)}>Cancel</Button>
                      <Button
                        onClick={() => {
                          if (!entryForm.member_id) {
                            toast.error("Select a member");
                            return;
                          }
                          saveEntryMut.mutate({
                            id: entryForm.id,
                            member_id: entryForm.member_id,
                            period_month: entryForm.period_month ?? selectedMonth,
                            business_volume: Number(entryForm.business_volume ?? 0),
                            approved: entryForm.approved ?? false,
                            description: entryForm.description ?? null,
                          });
                        }}
                        disabled={saveEntryMut.isPending}
                        className="bg-gold-gradient text-primary-foreground"
                      >
                        {saveEntryMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </Modal>
              )}
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${accent ? "border-gold/40 bg-gold/5" : "border-border bg-card/50"}`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ? "text-gold" : ""}`}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
