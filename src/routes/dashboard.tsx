import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Check, Wallet, Users, DollarSign, Clock, Loader2, LogOut, ImageIcon, Shield, Pencil, X as XIcon } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { getDashboardData, requestWithdrawal, updateMyReferralCode, checkReferralCodeAvailable } from "@/lib/account.functions";
import { getMyTradingAccounts, requestAccountPayout, listAccountGallery } from "@/lib/admin-accounts.functions";
import { listTradeResults, checkIsAdmin } from "@/lib/trade-results.functions";
import { buildReferralLink } from "@/lib/referral";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Trade Rise FX" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/dashboard" } });
  }, [user, loading, navigate]);

  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    enabled: !!user,
  });

  const [copied, setCopied] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Loader2 className="animate-spin text-gold" />
      </div>
    );
  }

  if (isLoading) return (
    <div className="min-h-screen bg-background"><Nav /><div className="pt-32 grid place-items-center"><Loader2 className="animate-spin text-gold" /></div></div>
  );

  if (error || !data?.profile) return (
    <div className="min-h-screen bg-background"><Nav />
      <main className="pt-28 pb-16 px-6 text-center">
        <p className="text-muted-foreground">Couldn't load your dashboard. Please try again.</p>
      </main>
    </div>
  );

  const { profile, referrals, commissions, withdrawals } = data;
  const refLink = buildReferralLink(profile.referral_code);
  const balance = Number(profile.wallet_balance);
  const totalEarned = Number(profile.total_earned);
  const pendingCommissions = commissions.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);
  const withdrawableCommissions = commissions.filter((c) => c.status === "credited").reduce((s, c) => s + Number(c.amount), 0);
  const pendingWithdrawal = withdrawals.filter((w) => w.status === "pending").length;
  const canWithdraw = balance >= 100;

  const copyLink = async () => {
    await navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success("Referral link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-28 pb-16">
        <section className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-gold">Account</span>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold">
                Welcome{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <button onClick={signOut}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-gold/40 text-sm">
              <LogOut size={14} /> Sign out
            </button>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Stat icon={<Wallet className="text-gold" />} label="Wallet balance" value={`$${balance.toFixed(2)}`} />
            <Stat icon={<DollarSign className="text-gold" />} label="Total earned" value={`$${totalEarned.toFixed(2)}`} />
            <Stat icon={<Users className="text-gold" />} label="Referrals" value={String(referrals.length)} />
            <Stat icon={<DollarSign className="text-gold" />} label="Withdrawable" value={`$${withdrawableCommissions.toFixed(2)}`} />
            <Stat icon={<Clock className="text-gold" />} label="Pending commissions" value={`$${pendingCommissions.toFixed(2)}`} />
            <Stat icon={<Clock className="text-gold" />} label="Pending withdrawals" value={String(pendingWithdrawal)} />
          </div>

          <ReferralLinkPanel
            currentCode={profile.referral_code}
            refLink={refLink}
            copied={copied}
            copyLink={copyLink}
            canWithdraw={canWithdraw}
            balance={balance}
            onWithdraw={() => setShowWithdraw(true)}
            onCodeUpdated={() => qc.invalidateQueries({ queryKey: ["dashboard"] })}
          />

          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            <Panel title="Recent referrals" empty="No referrals yet — share your link to start earning.">
              {referrals.slice(0, 8).map((r) => (
                <Row key={r.id} left={`User ${r.referred_user_id.slice(0, 8)}`} right={fmt(r.created_at)} />
              ))}
            </Panel>
            <Panel title="Commissions" empty="Commissions will appear here when a referral makes a purchase.">
              {commissions.slice(0, 8).map((c) => (
                <Row key={c.id} left={`+$${Number(c.amount).toFixed(2)}`} subLeft={`Order ${c.order_id}`} right={c.status} />
              ))}
            </Panel>
            <Panel title="Withdrawals" empty="No withdrawal requests yet.">
              {withdrawals.slice(0, 8).map((w) => (
                <Row key={w.id} left={`$${Number(w.amount).toFixed(2)}`} subLeft={w.method.replace("_", " ").toUpperCase()} right={w.status} />
              ))}
            </Panel>
          </div>

          <MyTradingAccountsSection />

          <TradeResultsSection />
        </section>
      </main>
      <Footer />
      {showWithdraw && (
        <WithdrawDialog balance={balance} onClose={() => setShowWithdraw(false)} onDone={() => {
          setShowWithdraw(false);
          qc.invalidateQueries({ queryKey: ["dashboard"] });
        }} />
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">{icon} {label}</div>
      <div className="mt-2 text-2xl font-bold font-display text-gold-gradient">{value}</div>
    </div>
  );
}

function Panel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const isEmpty = Array.isArray(children) ? children.length === 0 : !children;
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-3 space-y-2">
        {isEmpty ? <p className="text-xs text-muted-foreground">{empty}</p> : children}
      </div>
    </div>
  );
}

function Row({ left, subLeft, right }: { left: string; subLeft?: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border last:border-0">
      <div>
        <div className="font-medium">{left}</div>
        {subLeft && <div className="text-xs text-muted-foreground">{subLeft}</div>}
      </div>
      <span className="text-xs text-muted-foreground capitalize">{right}</span>
    </div>
  );
}

function fmt(s: string) {
  try { return new Date(s).toLocaleDateString(); } catch { return s; }
}

function MyTradingAccountsSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-trading-accounts"],
    queryFn: () => getMyTradingAccounts(),
  });
  const accounts = data?.accounts ?? [];
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [payoutFor, setPayoutFor] = useState<any | null>(null);

  if (isLoading) {
    return <div className="mt-10 grid place-items-center py-6"><Loader2 className="animate-spin text-gold" /></div>;
  }

  return (
    <div className="mt-10">
      <div>
        <span className="text-xs uppercase tracking-[0.2em] text-gold">Trading Accounts</span>
        <h2 className="mt-1 text-2xl font-bold">Your funded accounts</h2>
      </div>

      {accounts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center">
          <Wallet className="mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No trading account delivered yet. After your purchase is verified, your account credentials will appear here.</p>
        </div>
      ) : (
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {accounts.map((a: any) => {
            const breached = a.status === "breached";
            const cycle = a.payout_cycle_days ?? 14;
            const eligibleAt = a.payout_eligible_at ? new Date(a.payout_eligible_at) : null;
            const now = Date.now();
            const remainingMs = eligibleAt ? eligibleAt.getTime() - now : 0;
            const remainingDays = Math.max(0, Math.ceil(remainingMs / 86400000));
            const payoutReady = !breached && eligibleAt && remainingMs <= 0;
            return (
              <div key={a.id} className={`rounded-2xl border bg-card/50 p-5 ${breached ? "border-destructive/40" : "border-border"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">{a.plan} · {a.size}</div>
                    <div className="mt-1 font-mono text-lg font-bold">{a.login}</div>
                    <div className="text-xs text-muted-foreground">{a.platform} · {a.server || "—"}</div>
                  </div>
                  <span className={`text-[10px] uppercase font-semibold px-2 py-1 rounded ${
                    breached ? "bg-destructive/20 text-destructive" :
                    a.status === "passed" ? "bg-emerald-500/20 text-emerald-500" :
                    "bg-gold/20 text-gold"
                  }`}>{a.status === "passed" ? "Account Passed" : a.status}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Mini label="Balance" v={`$${Number(a.balance).toFixed(2)}`} />
                  <Mini label="Equity" v={`$${Number(a.equity).toFixed(2)}`} />
                  <Mini label="P/L" v={`${Number(a.profit) >= 0 ? "+" : ""}$${Number(a.profit).toFixed(2)}`}
                    cls={Number(a.profit) >= 0 ? "text-emerald-500" : "text-destructive"} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Password</span>
                  <code className="font-mono">{show[a.id] ? a.password : "••••••••"}</code>
                  <button onClick={() => setShow({ ...show, [a.id]: !show[a.id] })} className="text-gold hover:underline">
                    {show[a.id] ? "Hide" : "Show"}
                  </button>
                </div>

                {!breached && (
                  <div className="mt-4 rounded-lg border border-border bg-background/60 p-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-2">
                        <div className="text-muted-foreground uppercase tracking-widest text-[10px]">Payout cycle</div>
                        <div className="mt-0.5 font-semibold">
                          {cycle} days ·{" "}
                          {payoutReady ? (
                            <span className="text-emerald-500">Eligible now</span>
                          ) : (
                            <span className="text-gold">{remainingDays} day{remainingDays === 1 ? "" : "s"} remaining</span>
                          )}
                        </div>
                        {eligibleAt && !payoutReady && (
                          <div className="mt-0.5 text-[10px] text-muted-foreground">Eligible on {eligibleAt.toLocaleDateString()}</div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          {a.requires_min_hold
                            ? "Instant account: trades must stay open at least 2 minutes for compliance."
                            : "Fee-based account: 2-minute holding rule does not apply."}
                        </div>
                      </div>
                      <button
                        onClick={() => setPayoutFor(a)}
                        disabled={!payoutReady}
                        className="shrink-0 px-3 h-9 rounded-lg bg-gold-gradient text-primary-foreground text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {payoutReady ? "Request payout" : "Locked"}
                      </button>
                    </div>
                  </div>
                )}

                {breached && a.breached_reason && (
                  <div className="mt-3 text-xs text-destructive">⚠ Breached: {a.breached_reason}</div>
                )}

                {a.status === "passed" && <UserAccountGallery accountId={a.id} />}
              </div>
            );
          })}
        </div>
      )}

      {payoutFor && (
        <PayoutDialog
          account={payoutFor}
          onClose={() => setPayoutFor(null)}
          onDone={() => {
            setPayoutFor(null);
            qc.invalidateQueries({ queryKey: ["my-trading-accounts"] });
          }}
        />
      )}
    </div>
  );
}

function PayoutDialog({ account, onClose, onDone }: { account: any; onClose: () => void; onDone: () => void }) {
  const profitNum = Number(account.profit) || 0;
  const defaultAmt = profitNum > 0 ? profitNum.toFixed(2) : "0";
  const [amount, setAmount] = useState(defaultAmt);
  const [method, setMethod] = useState<"usdt_bep20" | "usdt_trc20" | "bank">("usdt_bep20");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");
      const payoutDetails = method === "bank"
        ? { bankName, accountName, accountNumber }
        : { address };
      if (method !== "bank" && !address.trim()) throw new Error("Enter your wallet address");
      if (method === "bank" && (!bankName.trim() || !accountName.trim() || !accountNumber.trim())) throw new Error("Enter bank details");
      return requestAccountPayout({ data: { accountId: account.id, amount: amt, method, payoutDetails } });
    },
    onSuccess: () => { toast.success("Payout request submitted"); onDone(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to submit payout request"),
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Request payout</h3>
        <p className="mt-1 text-xs text-muted-foreground">{account.plan} · {account.size} · Login {account.login}</p>

        <div className="mt-4 space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-muted-foreground">Amount (USD)</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border" />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border">
              <option value="usdt_bep20">USDT BEP20</option>
              <option value="usdt_trc20">USDT TRC20</option>
              <option value="bank">Bank transfer</option>
            </select>
          </label>
          {method === "bank" ? (
            <>
              <input placeholder="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-background border border-border" />
              <input placeholder="Account holder name" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-background border border-border" />
              <input placeholder="Account number / IBAN" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-background border border-border" />
            </>
          ) : (
            <input placeholder="Wallet address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-background border border-border" />
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm">Cancel</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending}
            className="h-10 px-4 rounded-lg bg-gold-gradient text-primary-foreground text-sm font-semibold disabled:opacity-60">
            {mut.isPending ? "Submitting…" : "Submit request"}
          </button>
        </div>
      </div>
    </div>
  );
}


function Mini({ label, v, cls }: { label: string; v: string; cls?: string }) {
  return (
    <div className="rounded-lg bg-background/60 border border-border p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-bold ${cls ?? ""}`}>{v}</div>
    </div>
  );
}

function TradeResultsSection() {
  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => checkIsAdmin() });
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-trade-results"],
    queryFn: () => listTradeResults(),
  });
  const results = data?.results ?? [];
  const [active, setActive] = useState<string | null>(null);
  const activeResult = results.find((r) => r.id === active);

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-gold">Trade Results</span>
          <h2 className="mt-1 text-2xl font-bold">Trade Rise FX latest screenshots</h2>
        </div>
        {adminQ.data?.isAdmin && (
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/40 text-sm text-gold hover:bg-gold/10"
            >
              <Shield size={14} /> Trade Rise FX Admin panel
            </Link>
            <Link
              to="/admin/trade-results"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:border-gold/40"
            >
              Manage Trade Rise FX uploads
            </Link>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-6 grid place-items-center py-10"><Loader2 className="animate-spin text-gold" /></div>
      ) : results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center">
          <ImageIcon className="mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No Trade Rise FX trade results published yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => setActive(r.id)}
              className="text-left rounded-2xl border border-border bg-card/50 overflow-hidden hover:border-gold/40 transition group"
            >
              {r.image_url ? (
                <img src={r.image_url} alt={r.title} className="w-full aspect-video object-cover group-hover:scale-[1.02] transition" />
              ) : (
                <div className="w-full aspect-video grid place-items-center bg-muted"><ImageIcon className="text-muted-foreground" /></div>
              )}
              <div className="p-4">
                <div className="font-semibold truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground">Trade date: {new Date(r.trade_date + "T00:00:00").toLocaleDateString()}</div>
                {r.caption && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{r.caption}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {activeResult && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm grid place-items-center p-4" onClick={() => setActive(null)}>
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {activeResult.image_url && (
              <img src={activeResult.image_url} alt={activeResult.title} className="w-full max-h-[70vh] object-contain bg-black" />
            )}
            <div className="p-5">
              <div className="font-bold">{activeResult.title}</div>
              <div className="text-xs text-muted-foreground">Trade date: {new Date(activeResult.trade_date + "T00:00:00").toLocaleDateString()} · Uploaded {new Date(activeResult.created_at).toLocaleString()}</div>
              {activeResult.caption && <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{activeResult.caption}</p>}
              <button onClick={() => setActive(null)} className="mt-5 h-10 px-4 rounded-lg border border-border text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawDialog({ balance, onClose, onDone }: { balance: number; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(String(Math.min(balance, 100).toFixed(2)));
  const [method, setMethod] = useState<"usdt_bep20" | "usdt_trc20" | "bank">("usdt_bep20");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt < 100) throw new Error("Minimum withdrawal is $100");
      if (amt > balance) throw new Error("Amount exceeds balance");
      const payoutDetails = method === "bank"
        ? { bankName, accountName, accountNumber }
        : { address };
      if (method !== "bank" && !address.trim()) throw new Error("Enter your wallet address");
      if (method === "bank" && (!bankName || !accountName || !accountNumber)) throw new Error("Enter bank details");
      return requestWithdrawal({ data: { amount: amt, method, payoutDetails } });
    },
    onSuccess: () => { toast.success("Withdrawal requested"); onDone(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Request withdrawal</h3>
        <p className="mt-1 text-xs text-muted-foreground">Available balance: <span className="text-foreground font-medium">${balance.toFixed(2)}</span></p>
        <div className="mt-5 space-y-3">
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Amount (USD)</span>
            <input type="number" min="100" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full h-11 rounded-lg border border-border bg-background px-3 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Payout method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as any)}
              className="mt-1 w-full h-11 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="usdt_bep20">USDT (BEP20)</option>
              <option value="usdt_trc20">USDT (TRC20)</option>
              <option value="bank">Bank transfer</option>
            </select>
          </label>
          {method === "bank" ? (
            <>
              <input className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm" placeholder="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <input className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm" placeholder="Account name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              <input className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm" placeholder="Account number / IBAN" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </>
          ) : (
            <input className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm" placeholder="Wallet address" value={address} onChange={(e) => setAddress(e.target.value)} />
          )}
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-lg border border-border">Cancel</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending}
            className="flex-1 h-11 rounded-lg bg-gold-gradient text-primary-foreground font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {mut.isPending && <Loader2 size={16} className="animate-spin" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function UserAccountGallery({ accountId }: { accountId: string }) {
  const q = useQuery({
    queryKey: ["account-gallery", accountId],
    queryFn: () => listAccountGallery({ data: { accountId } }),
  });
  const items = q.data?.items ?? [];
  if (q.isLoading || items.length === 0) return null;
  return (
    <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 mb-2">
        <ImageIcon className="h-3 w-3" /> Gallery
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((g: any) => (
          <div key={g.id} className="rounded-md overflow-hidden border border-border bg-background">
            {g.image_url && <img src={g.image_url} alt={g.caption ?? ""} className="w-full aspect-video object-cover" />}
            {g.caption && <p className="px-2 py-1 text-[11px] whitespace-pre-wrap">{g.caption}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferralLinkPanel({
  currentCode, refLink, copied, copyLink, canWithdraw, balance, onWithdraw, onCodeUpdated,
}: {
  currentCode: string;
  refLink: string;
  copied: boolean;
  copyLink: () => void;
  canWithdraw: boolean;
  balance: number;
  onWithdraw: () => void;
  onCodeUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentCode);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<null | { ok: boolean; msg: string }>(null);
  const [saving, setSaving] = useState(false);

  const updateFn = useServerFn(updateMyReferralCode);
  const checkFn = useServerFn(checkReferralCodeAvailable);

  useEffect(() => { setDraft(currentCode); }, [currentCode]);

  useEffect(() => {
    if (!editing) { setAvailability(null); return; }
    const normalized = draft.trim().toUpperCase();
    if (normalized === currentCode.toUpperCase()) { setAvailability(null); return; }
    if (!/^[A-Z0-9_-]{3,32}$/.test(normalized)) {
      setAvailability({ ok: false, msg: "3-32 chars · letters, numbers, _ or -" });
      return;
    }
    let cancelled = false;
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const res = await checkFn({ data: { code: normalized } });
        if (!cancelled) setAvailability(res.available
          ? { ok: true, msg: `${normalized} is available` }
          : { ok: false, msg: `${normalized} is already taken` });
      } catch (e) {
        if (!cancelled) setAvailability({ ok: false, msg: e instanceof Error ? e.message : "Check failed" });
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [draft, editing, currentCode, checkFn]);

  const save = async () => {
    const normalized = draft.trim().toUpperCase();
    if (normalized === currentCode.toUpperCase()) { setEditing(false); return; }
    setSaving(true);
    try {
      await updateFn({ data: { code: normalized } });
      toast.success("Affiliate link updated");
      setEditing(false);
      onCodeUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-gold/30 bg-emerald-gradient p-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-gold-soft">Your referral link</div>
          <div className="mt-2 text-sm font-medium">Share and earn <span className="text-gold-gradient font-bold">10%</span> on every purchase.</div>
          {!editing ? (
            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              Code: <span className="font-mono text-foreground">{currentCode}</span>
              <button onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 text-gold hover:underline">
                <Pencil size={12} /> Customize
              </button>
            </div>
          ) : (
            <div className="mt-2 space-y-2 max-w-sm">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32))}
                  className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm font-mono uppercase"
                  placeholder="YOUR-CODE"
                />
                <button onClick={save} disabled={saving || checking || availability?.ok === false}
                  className="h-10 px-3 rounded-md bg-gold-gradient text-primary-foreground text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                </button>
                <button onClick={() => { setEditing(false); setDraft(currentCode); }}
                  className="h-10 px-2 rounded-md border border-border text-sm" aria-label="Cancel">
                  <XIcon size={14} />
                </button>
              </div>
              <div className="text-[11px] min-h-[14px]">
                {checking ? (
                  <span className="text-muted-foreground inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Checking availability…</span>
                ) : availability ? (
                  <span className={availability.ok ? "text-emerald-500" : "text-destructive"}>{availability.msg}</span>
                ) : (
                  <span className="text-muted-foreground">3-32 characters · letters, numbers, underscore or hyphen.</span>
                )}
              </div>
            </div>
          )}
        </div>
        <button onClick={onWithdraw} disabled={!canWithdraw}
          className="px-5 h-11 rounded-lg bg-gold-gradient text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
          {canWithdraw ? "Request withdrawal" : `Withdraw at $100 (${(100 - balance).toFixed(2)} to go)`}
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-background/60 border border-border p-3">
        <code className="flex-1 text-xs sm:text-sm break-all font-mono">{refLink}</code>
        <button onClick={copyLink} className="shrink-0 p-2 rounded-md border border-border hover:border-gold/40 transition" aria-label="Copy link">
          {copied ? <Check size={16} className="text-gold" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
