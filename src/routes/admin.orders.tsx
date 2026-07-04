import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Search, Receipt, Plus, CheckCircle2, XCircle, FileText, ExternalLink } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/trade-results.functions";
import { listAllOrders, createTradingAccount, approveOrder, rejectOrder } from "@/lib/admin-accounts.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Cryptographically secure password generator for trading account defaults. */
function generateSecurePassword(length = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Trade Rise FX Admin" }] }),
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin/orders" } });
  }, [user, loading, navigate]);

  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => checkIsAdmin(), enabled: !!user });
  const ordersQ = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listAllOrders(),
    enabled: !!user && adminQ.data?.isAdmin === true,
  });

  const [search, setSearch] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [deliver, setDeliver] = useState<any>(null);
  const [review, setReview] = useState<any>(null);

  const filtered = useMemo(() => {
    const list = ordersQ.data?.orders ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((o: any) =>
      o.id?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.tx_hash?.toLowerCase().includes(q) ||
      o.full_name?.toLowerCase().includes(q),
    );
  }, [ordersQ.data, search]);

  if (loading || !user || adminQ.isLoading) {
    return <div className="min-h-screen bg-background grid place-items-center"><Loader2 className="animate-spin text-gold" /></div>;
  }
  if (!adminQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
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
                <AdminBreadcrumb currentPage="Orders" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold">Admin</span>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold inline-flex items-center gap-3">
                  <Receipt className="text-gold" /> Orders & Receipts
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">Review every customer's purchase receipt and deliver the trading account.</p>
              </div>

              <div className="mt-6 relative max-w-sm">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search order id, email, tx hash" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card/50">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Order</th>
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Plan / Size</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Verification</th>
                      <th className="text-left p-3">Account</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersQ.isLoading ? (
                      <tr><td colSpan={7} className="p-6 text-center"><Loader2 className="animate-spin text-gold inline" /></td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No orders</td></tr>
                    ) : filtered.map((o: any) => (
                      <tr key={o.id} className="border-t border-border hover:bg-muted/20">
                        <td className="p-3">
                          <div className="font-mono text-xs">{o.id}</div>
                          <div className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{o.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{o.email}</div>
                        </td>
                        <td className="p-3">{o.plan} · {o.size}</td>
                        <td className="p-3">${Number(o.amount).toFixed(2)}</td>
                        <td className="p-3">
                          <VerificationBadge status={o.verification_status} />
                          <div className="mt-1 flex gap-1.5 text-[10px] text-muted-foreground">
                            {o.tx_hash && <span className="inline-flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" /> TxID</span>}
                            {o.payment_proof_url && <span className="inline-flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" /> Proof</span>}
                            {!o.tx_hash && !o.payment_proof_url && <span>—</span>}
                          </div>
                        </td>
                        <td className="p-3">
                          {o.trading_account ? (
                            <Badge variant={o.trading_account.status === "breached" ? "destructive" : "default"}>
                              {o.trading_account.login} · {o.trading_account.status}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not delivered</Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex gap-2 flex-wrap justify-end">
                            <Button size="sm" variant="outline" onClick={() => setReceipt(o)}>Receipt</Button>
                            <Button size="sm" variant="outline" onClick={() => setReview(o)}>Verify</Button>
                            {!o.trading_account && o.verification_status === "approved" && (
                              <Button size="sm" onClick={() => setDeliver(o)}>
                                <Plus className="h-3 w-3 mr-1" /> Deliver
                              </Button>
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

      <ReceiptDialog order={receipt} onClose={() => setReceipt(null)} />
      <VerifyDialog
        order={review}
        onClose={() => setReview(null)}
        onDone={() => {
          setReview(null);
          qc.invalidateQueries({ queryKey: ["admin-orders"] });
        }}
      />
      <DeliverDialog
        order={deliver}
        onClose={() => setDeliver(null)}
        onDone={() => {
          setDeliver(null);
          qc.invalidateQueries({ queryKey: ["admin-orders"] });
          qc.invalidateQueries({ queryKey: ["admin-accounts"] });
        }}
      />
    </SidebarProvider>
  );
}

function ReceiptDialog({ order, onClose }: { order: any; onClose: () => void }) {
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Order receipt</DialogTitle></DialogHeader>
        {!order ? null : (
          <div className="space-y-2 text-sm">
            <Row k="Order ID" v={order.id} />
            <Row k="Created" v={new Date(order.created_at).toLocaleString()} />
            <Row k="Customer" v={`${order.full_name || ""} (${order.email || "—"})`} />
            <Row k="Plan" v={`${order.plan} · ${order.size}`} />
            <Row k="Amount" v={`$${Number(order.amount).toFixed(2)}`} />
            <Row k="Network" v={order.network?.toUpperCase()} />
            <Row k="Order status" v={order.status} />
            <Row k="Verification" v={order.verification_status} />
            {order.addon_free_next && <Row k="Add-on" v="Paid +20% — grant 1 free-account credit on approval" />}
            {order.is_free_redemption && <Row k="Free redemption" v="Yes — redeems 1 free-account credit" />}
            {order.tx_hash && (
              <div className="pt-2 border-t border-border">
                <div className="text-[10px] uppercase text-muted-foreground">Transaction ID (TxID)</div>
                <div className="font-mono text-xs break-all">{order.tx_hash}</div>
              </div>
            )}
            {order.payment_proof_signed_url && (
              <div className="pt-2 border-t border-border space-y-2">
                <div className="text-[10px] uppercase text-muted-foreground">Payment screenshot</div>
                <ProofPreview url={order.payment_proof_signed_url} />
              </div>
            )}
            {order.verification_notes && (
              <Row k="Notes" v={order.verification_notes} />
            )}
            {order.customer_details && (
              <div className="pt-2 border-t border-border">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Billing details</div>
                <pre className="text-xs whitespace-pre-wrap bg-background/50 p-2 rounded border border-border">
                  {JSON.stringify(order.customer_details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right break-all">{v ?? "—"}</span>
    </div>
  );
}

function DeliverDialog({ order, onClose, onDone }: { order: any; onClose: () => void; onDone: () => void }) {
  const [platform, setPlatform] = useState("MT5");
  const [server, setServer] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      setLogin("");
      setPassword(generateSecurePassword(14));
      const sz = String(order.size ?? "").replace(/[^0-9.]/g, "");
      setStartingBalance(sz || "");
    }
  }, [order]);

  const mut = useMutation({
    mutationFn: () => createTradingAccount({ data: {
      orderId: order.id,
      userId: order.user_id,
      plan: order.plan,
      size: order.size,
      platform,
      server,
      login,
      password,
      startingBalance: Number(startingBalance) || 0,
      notes,
    }}),
    onSuccess: () => { toast.success("Account delivered to user"); onDone(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Deliver trading account</DialogTitle></DialogHeader>
        {!order ? null : (
          <div className="space-y-3 text-sm">
            <div className="text-xs text-muted-foreground">
              For order <span className="font-mono">{order.id}</span> · {order.email}
            </div>
            <Labelled label="Platform">
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                <option>MT5</option><option>MT4</option><option>cTrader</option><option>Match-Trader</option>
              </select>
            </Labelled>
            <Labelled label="Server"><Input value={server} onChange={(e) => setServer(e.target.value)} placeholder="TradeRiseFX-Live" /></Labelled>
            <Labelled label="Login"><Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="100123" /></Labelled>
            <Labelled label="Password"><Input value={password} onChange={(e) => setPassword(e.target.value)} /></Labelled>
            <Labelled label="Starting balance ($)"><Input type="number" value={startingBalance} onChange={(e) => setStartingBalance(e.target.value)} /></Labelled>
            <Labelled label="Admin notes (optional)">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </Labelled>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => mut.mutate()} disabled={mut.isPending || !login || !password}>
                {mut.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Deliver account
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function VerificationBadge({ status }: { status?: string }) {
  const s = status ?? "pending";
  const variant: any =
    s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";
  return <Badge variant={variant} className="capitalize">{s}</Badge>;
}

function ProofPreview({ url }: { url: string }) {
  const isPdf = /\.pdf($|\?)/i.test(url);
  return (
    <div className="space-y-2">
      {isPdf ? (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-gold hover:underline">
          <FileText size={14} /> Open PDF proof
        </a>
      ) : (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img src={url} alt="Payment proof" className="max-h-72 w-auto rounded-lg border border-border" />
        </a>
      )}
      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ExternalLink size={12} /> Open in new tab
      </a>
    </div>
  );
}

function VerifyDialog({ order, onClose, onDone }: { order: any; onClose: () => void; onDone: () => void }) {
  const [notes, setNotes] = useState("");
  useEffect(() => { setNotes(order?.verification_notes ?? ""); }, [order?.id]);

  const approveMut = useMutation({
    mutationFn: () => approveOrder({ data: { orderId: order.id, notes: notes || null } }),
    onSuccess: () => { toast.success("Payment approved"); onDone(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to approve"),
  });
  const rejectMut = useMutation({
    mutationFn: () => rejectOrder({ data: { orderId: order.id, notes: notes || null } }),
    onSuccess: () => { toast.success("Payment rejected"); onDone(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to reject"),
  });

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Review payment</DialogTitle></DialogHeader>
        {!order ? null : (
          <div className="space-y-3 text-sm">
            <div className="text-xs text-muted-foreground">
              Order <span className="font-mono">{order.id}</span> · {order.email} · ${Number(order.amount).toFixed(2)}
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Current status</div>
              <VerificationBadge status={order.verification_status} />
            </div>
            {order.tx_hash ? (
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Transaction ID (TxID)</div>
                <div className="font-mono text-xs break-all bg-background/50 p-2 rounded border border-border">{order.tx_hash}</div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No TxID provided</div>
            )}
            {order.payment_proof_signed_url ? (
              <div>
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Payment screenshot</div>
                <ProofPreview url={order.payment_proof_signed_url} />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No screenshot uploaded</div>
            )}
            <Labelled label="Review notes (optional)">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Reason for rejection or confirmation note" />
            </Labelled>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button variant="destructive" disabled={rejectMut.isPending || approveMut.isPending} onClick={() => rejectMut.mutate()}>
                {rejectMut.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <XCircle className="h-3 w-3 mr-1" />} Reject
              </Button>
              <Button disabled={approveMut.isPending || rejectMut.isPending} onClick={() => approveMut.mutate()}>
                {approveMut.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />} Approve
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
