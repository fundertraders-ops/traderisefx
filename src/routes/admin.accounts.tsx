import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Search, Wallet, Ban, Save, Trash2, CheckCircle2, ImagePlus, Pencil, Shield, Rocket } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/trade-results.functions";
import {
  listAllTradingAccounts,
  updateTradingAccount,
  breachTradingAccount,
  deleteTradingAccount,
  listAccountGallery,
  uploadGalleryImage,
  updateGalleryItem,
  deleteGalleryItem,
  validateAccountTrade,
  issuePhase2Account,
} from "@/lib/admin-accounts.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/accounts")({
  head: () => ({ meta: [{ title: "Trading Accounts — Trade Rise FX Admin" }] }),
  component: AdminAccountsPage,
});

function AdminAccountsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin/accounts" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => checkIsAdmin(), enabled: !!user });
  const accountsQ = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: () => listAllTradingAccounts(),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<any>(null);
  const [phase2For, setPhase2For] = useState<any>(null);

  const filtered = useMemo(() => {
    const list = accountsQ.data?.accounts ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a: any) =>
      a.login?.toLowerCase().includes(q) ||
      a.user_email?.toLowerCase().includes(q) ||
      a.user_name?.toLowerCase().includes(q) ||
      a.order_id?.toLowerCase().includes(q),
    );
  }, [accountsQ.data, search]);

  if (loading || !user || adminQ.isLoading) {
    return <div className="min-h-screen bg-background grid place-items-center"><Loader2 className="animate-spin text-gold" /></div>;
  }
  if (!adminQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-background"><Nav />
        <main className="pt-32 pb-16 px-6 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm text-gold"><ArrowLeft size={14} /> Back</Link>
        </main>
      </div>
    );
  }

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
                <AdminBreadcrumb currentPage="Trading Accounts" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold">Admin</span>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold inline-flex items-center gap-3">
                  <Wallet className="text-gold" /> Trading Accounts
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">Edit balance, equity, P/L, breach or pass accounts.</p>
              </div>

              <div className="mt-6 relative max-w-sm">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search login, email, order id" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card/50">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Account</th>
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Plan</th>
                      <th className="text-left p-3">Balance</th>
                      <th className="text-left p-3">Equity</th>
                      <th className="text-left p-3">P/L</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountsQ.isLoading ? (
                      <tr><td colSpan={8} className="p-6 text-center"><Loader2 className="animate-spin text-gold inline" /></td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No accounts yet</td></tr>
                    ) : filtered.map((a: any) => (
                      <tr key={a.id} className="border-t border-border hover:bg-muted/20">
                        <td className="p-3">
                          <div className="font-mono font-medium">{a.login}</div>
                          <div className="text-[10px] text-muted-foreground">{a.platform} · {a.server || "—"}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{a.user_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{a.user_email}</div>
                        </td>
                        <td className="p-3">
                          <div>{a.plan} · {a.size}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Payout: {a.payout_cycle_days ?? 14} days · {a.requires_min_hold ? "2-min hold applies" : "Hold rule exempt"}
                          </div>
                        </td>
                        <td className="p-3">${Number(a.balance).toFixed(2)}</td>
                        <td className="p-3">${Number(a.equity).toFixed(2)}</td>
                        <td className={`p-3 ${Number(a.profit) >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                          {Number(a.profit) >= 0 ? "+" : ""}${Number(a.profit).toFixed(2)}
                        </td>
                        <td className="p-3">
                          {a.status === "passed" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Account Passed
                            </Badge>
                          ) : (
                            <Badge variant={a.status === "breached" ? "destructive" : "secondary"}>
                              {a.status}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => setEdit(a)}>Manage</Button>
                            {a.status === "passed" && !a.is_phase2 && (
                              a.phase2_account ? (
                                <span className="text-[10px] text-emerald-500 inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Phase 2 issued ({a.phase2_account.login})
                                </span>
                              ) : (
                                <Button size="sm" className="bg-gold text-background hover:bg-gold/90" onClick={() => setPhase2For(a)}>
                                  <Rocket className="h-3 w-3 mr-1" /> Issue Phase 2
                                </Button>
                              )
                            )}
                            {a.is_phase2 && (
                              <span className="text-[10px] text-muted-foreground">Phase 2 account</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
          <Footer />
        </div>
      </div>

      <EditDialog account={edit} onClose={() => setEdit(null)} />
      <Phase2Dialog parent={phase2For} onClose={() => setPhase2For(null)} />
    </SidebarProvider>
  );
}

function EditDialog({ account, onClose }: { account: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (account) {
      setForm({
        platform: account.platform,
        server: account.server ?? "",
        login: account.login,
        password: account.password,
        balance: String(account.balance ?? 0),
        equity: String(account.equity ?? 0),
        profit: String(account.profit ?? 0),
        status: account.status,
        breachedReason: account.breached_reason ?? "",
        notes: account.admin_notes ?? "",
      });
    }
  }, [account]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const saveMut = useMutation({
    mutationFn: () => updateTradingAccount({ data: {
      id: account.id,
      platform: form.platform,
      server: form.server || null,
      login: form.login,
      password: form.password,
      balance: Number(form.balance),
      equity: Number(form.equity),
      profit: Number(form.profit),
      status: form.status,
      breachedReason: form.breachedReason || null,
      notes: form.notes || null,
    }}),
    onSuccess: () => { toast.success("Account updated"); refresh(); onClose(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const breachMut = useMutation({
    mutationFn: () => breachTradingAccount({ data: { id: account.id, reason: form.breachedReason || "Rule violation" } }),
    onSuccess: () => { toast.success("Account breached"); refresh(); onClose(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const delMut = useMutation({
    mutationFn: () => deleteTradingAccount({ data: { id: account.id } }),
    onSuccess: () => { toast.success("Account deleted"); refresh(); onClose(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <Dialog open={!!account} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Manage trading account</DialogTitle></DialogHeader>
        {!account ? null : (
          <div className="space-y-3 text-sm">
            <div className="text-xs text-muted-foreground">User: {account.user_email}</div>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Payout cycle: <span className="font-semibold text-foreground">{account.payout_cycle_days ?? 14} days</span> · {account.requires_min_hold
                ? "Instant account trades must remain open for at least 2 minutes."
                : "Fee-based account: the 2-minute holding rule is not applied."}
            </div>
            <TradeComplianceChecker account={account} />
            {(form.status === "passed" || account.status === "passed") && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-500 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Account Passed
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <L label="Platform"><Input value={form.platform || ""} onChange={(e) => setForm({ ...form, platform: e.target.value })} /></L>
              <L label="Server"><Input value={form.server || ""} onChange={(e) => setForm({ ...form, server: e.target.value })} /></L>
              <L label="Login"><Input value={form.login || ""} onChange={(e) => setForm({ ...form, login: e.target.value })} /></L>
              <L label="Password"><Input value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} /></L>
              <L label="Balance ($)"><Input type="number" value={form.balance || ""} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></L>
              <L label="Equity ($)"><Input type="number" value={form.equity || ""} onChange={(e) => setForm({ ...form, equity: e.target.value })} /></L>
              <L label="Profit / Loss ($)"><Input type="number" value={form.profit || ""} onChange={(e) => setForm({ ...form, profit: e.target.value })} /></L>
              <L label="Status">
                <select value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="pending">pending</option>
                  <option value="active">active</option>
                  <option value="breached">breached</option>
                  <option value="passed">passed</option>
                  <option value="suspended">suspended</option>
                </select>
              </L>
            </div>
            <L label="Breach / status reason">
              <Input value={form.breachedReason || ""} onChange={(e) => setForm({ ...form, breachedReason: e.target.value })} placeholder="e.g. Daily loss limit hit" />
            </L>
            <L label="Admin notes">
              <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </L>

            {(form.status === "passed" || account.status === "passed") && (
              <GallerySection accountId={account.id} />
            )}


            <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border">
              <Button variant="destructive" size="sm" onClick={() => { if (confirm("Delete this account?")) delMut.mutate(); }} disabled={delMut.isPending}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
              <Button variant="destructive" size="sm" onClick={() => breachMut.mutate()} disabled={breachMut.isPending}>
                <Ban className="h-3 w-3 mr-1" /> Breach now
              </Button>
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                {saveMut.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />} Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TradeComplianceChecker({ account }: { account: any }) {
  const [openedAt, setOpenedAt] = useState("");
  const [closedAt, setClosedAt] = useState("");
  const [result, setResult] = useState<any>(null);

  const checkMut = useMutation({
    mutationFn: () => {
      if (!openedAt || !closedAt) throw new Error("Enter open and close time");
      return validateAccountTrade({ data: {
        accountId: account.id,
        openedAt: new Date(openedAt).toISOString(),
        closedAt: new Date(closedAt).toISOString(),
        isFeeBased: !account.requires_min_hold,
      }});
    },
    onSuccess: (data) => setResult(data),
    onError: (e: any) => toast.error(e.message ?? "Validation failed"),
  });

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Trade compliance</div>
      <div className="grid grid-cols-2 gap-2">
        <L label="Opened"><Input type="datetime-local" value={openedAt} onChange={(e) => setOpenedAt(e.target.value)} /></L>
        <L label="Closed"><Input type="datetime-local" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} /></L>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => checkMut.mutate()} disabled={checkMut.isPending}>
        {checkMut.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Shield className="h-3 w-3 mr-1" />} Validate trade
      </Button>
      {result && (
        <div className={`text-xs rounded-md px-3 py-2 border ${result.valid_for_compliance ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
          {result.valid_for_compliance ? "Valid for compliance" : "Not valid for compliance"} · {result.reason}
          {typeof result.actual_hold_seconds === "number" && <span> · Held {result.actual_hold_seconds}s</span>}
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

function GallerySection({ accountId }: { accountId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const galleryQ = useQuery({
    queryKey: ["account-gallery", accountId],
    queryFn: () => listAccountGallery({ data: { accountId } }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["account-gallery", accountId] });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 8 * 1024 * 1024) throw new Error("Max 8MB image");
      const b64 = await fileToBase64(file);
      return uploadGalleryImage({ data: {
        accountId,
        caption: caption || null,
        fileName: file.name,
        contentType: file.type || "image/jpeg",
        fileBase64: b64,
      }});
    },
    onSuccess: () => { toast.success("Image uploaded"); setCaption(""); if (fileRef.current) fileRef.current.value = ""; refresh(); },
    onError: (e: any) => toast.error(e.message ?? "Upload failed"),
  });

  const saveCapMut = useMutation({
    mutationFn: (vars: { id: string; caption: string }) =>
      updateGalleryItem({ data: { id: vars.id, caption: vars.caption || null } }),
    onSuccess: (_d, vars) => { toast.success("Caption updated"); setEditing((s) => { const n = { ...s }; delete n[vars.id]; return n; }); refresh(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteGalleryItem({ data: { id } }),
    onSuccess: () => { toast.success("Image deleted"); refresh(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const items = galleryQ.data?.items ?? [];

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Gallery</div>
        <span className="text-[10px] text-muted-foreground">{items.length} image{items.length === 1 ? "" : "s"}</span>
      </div>

      <div className="space-y-2 rounded-lg border border-dashed border-border bg-background/50 p-3">
        <Input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadMut.mutate(f);
          }}
          disabled={uploadMut.isPending}
        />
        <Input
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={1000}
        />
        <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
          <ImagePlus className="h-3 w-3" /> Select an image to upload it instantly. Max 8MB.
        </div>
      </div>

      {galleryQ.isLoading ? (
        <div className="text-center py-4"><Loader2 className="animate-spin text-gold inline h-4 w-4" /></div>
      ) : items.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-4">No images yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((g: any) => {
            const isEditing = editing[g.id] !== undefined;
            return (
              <div key={g.id} className="rounded-lg border border-border bg-background overflow-hidden">
                {g.image_url ? (
                  <img src={g.image_url} alt={g.caption ?? ""} className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video grid place-items-center text-xs text-muted-foreground">Image unavailable</div>
                )}
                <div className="p-2 space-y-2">
                  {isEditing ? (
                    <>
                      <textarea
                        value={editing[g.id]}
                        onChange={(e) => setEditing((s) => ({ ...s, [g.id]: e.target.value }))}
                        rows={2}
                        maxLength={1000}
                        className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                      />
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditing((s) => { const n = { ...s }; delete n[g.id]; return n; })}>Cancel</Button>
                        <Button size="sm" onClick={() => saveCapMut.mutate({ id: g.id, caption: editing[g.id] })} disabled={saveCapMut.isPending}>Save</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs whitespace-pre-wrap min-h-[1.25rem]">{g.caption || <span className="text-muted-foreground italic">No caption</span>}</p>
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditing((s) => ({ ...s, [g.id]: g.caption ?? "" }))}>
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete this image?")) delMut.mutate(g.id); }}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function Phase2Dialog({ parent, onClose }: { parent: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (parent) {
      setForm({
        platform: parent.platform || "MetaTrader 5",
        server: parent.server || "",
        login: "",
        password: "",
        plan: parent.plan ? `Phase 2 — ${parent.plan}` : "Phase 2 Challenge",
        size: parent.size || "",
        startingBalance: String(parent.starting_balance ?? 0),
        notes: "",
      });
    }
  }, [parent]);

  const mut = useMutation({
    mutationFn: () => issuePhase2Account({ data: {
      parentAccountId: parent.id,
      platform: form.platform,
      server: form.server || null,
      login: form.login,
      password: form.password,
      plan: form.plan || null,
      size: form.size || null,
      startingBalance: Number(form.startingBalance),
      notes: form.notes || null,
    }}),
    onSuccess: () => {
      toast.success("Phase 2 account issued and email sent");
      qc.invalidateQueries({ queryKey: ["admin-accounts"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to issue Phase 2"),
  });

  return (
    <Dialog open={!!parent} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2"><Rocket className="text-gold h-4 w-4" /> Issue Phase 2 Account</DialogTitle>
        </DialogHeader>
        {!parent ? null : (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs">
              Client <span className="font-semibold">{parent.user_name || parent.user_email}</span> passed Phase 1 (account <span className="font-mono">{parent.login}</span>). Enter the new Phase 2 credentials below.
            </div>
            <div className="grid grid-cols-2 gap-2">
              <L label="Platform"><Input value={form.platform || ""} onChange={(e) => setForm({ ...form, platform: e.target.value })} /></L>
              <L label="Server"><Input value={form.server || ""} onChange={(e) => setForm({ ...form, server: e.target.value })} /></L>
              <L label="Login"><Input value={form.login || ""} onChange={(e) => setForm({ ...form, login: e.target.value })} /></L>
              <L label="Password"><Input value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} /></L>
              <L label="Plan label"><Input value={form.plan || ""} onChange={(e) => setForm({ ...form, plan: e.target.value })} /></L>
              <L label="Size label"><Input value={form.size || ""} onChange={(e) => setForm({ ...form, size: e.target.value })} /></L>
              <L label="Starting balance ($)"><Input type="number" value={form.startingBalance || ""} onChange={(e) => setForm({ ...form, startingBalance: e.target.value })} /></L>
            </div>
            <L label="Admin notes (optional)">
              <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </L>
            <div className="text-[11px] text-muted-foreground">
              An email will be sent automatically informing the client that they passed Phase 1 and their Phase 2 account has been issued.
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={() => mut.mutate()} disabled={mut.isPending || !form.login || !form.password}>
                {mut.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Rocket className="h-3 w-3 mr-1" />} Issue & notify
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
