import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Copy, Check, ShieldCheck, Wallet, ArrowRight, Clock, AlertTriangle, Loader2, XCircle, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { verifyUsdtTx, type VerifyResult } from "@/lib/tx-verify.functions";
import { confirmOrder, getMyAddonStatus } from "@/lib/account.functions";
import { validateReferralCode } from "@/lib/admin-referrals.functions";
import { validatePromoCode } from "@/lib/promo-codes.functions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Sparkles, Tag, Ticket } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const searchSchema = z.object({
  plan: z.string().optional(),
  size: z.string().optional(),
  price: z.string().optional(),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Checkout — Trade Rise FX" },
      { name: "description", content: "Complete your funded account purchase. Pay securely with USDT (BEP20 or TRC20)." },
    ],
  }),
  component: CheckoutPage,
});

const WALLETS = {
  bep20: { network: "USDT · BEP20 (BNB Smart Chain)", address: "0xe82d43f2ea3aa12f140dd9a2c21d5375de6c64ae" },
  trc20: { network: "USDT · TRC20 (Tron)", address: "TDy7X9VYsMn4HYDaJcx36mPSkoCqW6M39h" },
} as const;

type Network = keyof typeof WALLETS;

const formSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  lastName: z.string().trim().min(2, "Enter your last name").max(80),
  mobile: z.string().trim().min(6, "Enter a valid mobile number").max(30),
  address: z.string().trim().min(3, "Enter your address").max(200),
  streetNumber: z.string().trim().min(1, "Enter your street number").max(20),
  postalCode: z.string().trim().min(2, "Enter your postal code").max(20),
  district: z.string().trim().min(2, "Enter your district").max(80),
  number: z.string().trim().min(1, "Enter your number").max(20),
});

const txSchema = z.object({
  txHash: z.string().trim().min(1, "Enter a transaction hash").max(120),
});

type Step = "details" | "pay" | "done";

function CheckoutPage() {
  const search = useSearch({ from: "/checkout" });
  const plan = search.plan ?? "Funded Account";
  const size = search.size ?? "$50K";
  const price = search.price ?? "$289";

  const [step, setStep] = useState<Step>("details");
  const [network, setNetwork] = useState<Network>("bep20");
  const [copied, setCopied] = useState(false);
  const [orderId] = useState(() => "AF-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const [form, setForm] = useState({
    firstName: "", email: "", lastName: "", mobile: "",
    address: "", streetNumber: "", postalCode: "", district: "", number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tx, setTx] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [addonFreeNext, setAddonFreeNext] = useState(false);
  const [useFreeCredit, setUseFreeCredit] = useState(false);
  const [freeCredits, setFreeCredits] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const [validatingRef, setValidatingRef] = useState(false);
  const validateRefFn = useServerFn(validateReferralCode);

  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountPercent: number; createdBy: string | null } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const validatePromoFn = useServerFn(validatePromoCode);

  useEffect(() => {
    trackEvent("begin_checkout", { plan, size, value: parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0, currency: "USD" });
  }, [plan, size, price]);


  const basePrice = useMemo(() => {
    const n = parseFloat(String(price).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [price]);

  const addonFee = useMemo(() => Math.round(basePrice * 0.2 * 100) / 100, [basePrice]);
  const subtotal = addonFreeNext ? Math.round((basePrice + addonFee) * 100) / 100 : basePrice;
  const discountAmount = useMemo(() => {
    if (useFreeCredit || !promoApplied) return 0;
    return Math.round(subtotal * (promoApplied.discountPercent / 100) * 100) / 100;
  }, [subtotal, promoApplied, useFreeCredit]);
  const effectivePrice = useFreeCredit ? 0 : Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
  const displayPrice = useFreeCredit ? "$0" : `$${effectivePrice.toFixed(2).replace(/\.00$/, "")}`;

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) { setPromoError("Enter a promo code"); return; }
    if (!user) { setPromoError("Please sign in to apply a promo code"); return; }
    setValidatingPromo(true);
    setPromoError(null);
    try {
      const res = await validatePromoFn({ data: { code } });
      if (res.valid) {
        setPromoApplied({ code: res.code, discountPercent: res.discountPercent, createdBy: res.createdBy });
        toast.success(`Promo applied — ${res.discountPercent}% off`);
      } else {
        setPromoApplied(null);
        setPromoError(res.reason || "Invalid promo code");
      }
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : "Validation failed");
    } finally {
      setValidatingPromo(false);
    }
  };

  const removePromo = () => { setPromoApplied(null); setPromoError(null); setPromoInput(""); };

  const wallet = WALLETS[network];

  const submitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const r = formSchema.safeParse(form);
    if (!r.success) {
      const errs: Record<string, string> = {};
      for (const i of r.error.issues) errs[i.path.join(".")] = i.message;
      setErrors(errs);
      toast.error("Please fix the errors below");
      return;
    }
    setErrors({});
    setStep("pay");
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — select and copy manually");
    }
  };

  const [confirmedNetwork, setConfirmedNetwork] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const verifyFn = useServerFn(verifyUsdtTx);

  // Reset verification if user changes tx hash or network
  useEffect(() => { setVerifyResult(null); }, [tx, network]);

  const expectedAmount = effectivePrice;

  const handleVerify = async () => {
    const r = txSchema.safeParse({ txHash: tx });
    if (!r.success) { toast.error(r.error.issues[0].message); return; }
    if (!expectedAmount) { toast.error("Missing order amount"); return; }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await verifyFn({
        data: { network, txHash: tx.trim(), expectedAddress: wallet.address, expectedAmount },
      });
      setVerifyResult(res);
      if (res.ok) toast.success("Payment verified on-chain");
      else toast.error(res.message);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      setVerifyResult({ ok: false, status: "error", message: msg });
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const { user } = useAuth();
  const confirmOrderFn = useServerFn(confirmOrder);
  const getAddonFn = useServerFn(getMyAddonStatus);

  // Load user's free-account credit balance once signed in
  useEffect(() => {
    if (!user) { setFreeCredits(0); return; }
    let cancelled = false;
    getAddonFn()
      .then((r) => { if (!cancelled) setFreeCredits(r.freeCredits ?? 0); })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, [user, getAddonFn]);

  // Mutually exclusive: redeeming a free credit disables the addon
  useEffect(() => { if (useFreeCredit) setAddonFreeNext(false); }, [useFreeCredit]);

  

  const handleValidateReferral = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) { setReferralStatus(null); return; }
    if (!/^[A-Za-z0-9]+$/.test(code)) {
      setReferralStatus({ valid: false, message: "Referral code must be letters and numbers only" });
      return;
    }
    if (!user) {
      setReferralStatus({ valid: false, message: "Please sign in to apply a referral code" });
      return;
    }
    setValidatingRef(true);
    try {
      const res = await validateRefFn({ data: { code } });
      if (res.valid) setReferralStatus({ valid: true, message: `Referred by ${res.referrerName}` });
      else setReferralStatus({ valid: false, message: res.reason || "Invalid referral code" });
    } catch (e) {
      setReferralStatus({ valid: false, message: e instanceof Error ? e.message : "Validation failed" });
    } finally {
      setValidatingRef(false);
    }
  };

  const referralCodeForSubmit = referralStatus?.valid ? referralCode.trim().toUpperCase() : null;

  const submitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to submit your order"); return; }

    // Free redemption path — no payment proof required
    if (useFreeCredit) {
      try {
        await confirmOrderFn({ data: {
          orderId, plan, size, network,
          txHash: null, paymentProofUrl: null,
          addonFreeNext: false, isFreeRedemption: true,
          referralCode: referralCodeForSubmit,
          customerDetails: form,
        }});
      } catch (err) {
        console.error("confirmOrder failed", err);
        toast.error(err instanceof Error ? err.message : "Failed to submit order");
        return;
      }
      setStep("done");
      trackEvent("purchase", { transaction_id: orderId, value: 0, currency: "USD", items: [{ item_name: plan, item_variant: size }], free_redemption: true });
      if (referralCodeForSubmit) toast.success("Referral Code Applied Successfully. Commission has been recorded.");
      else toast.success("Free account redeemed — admin will deliver shortly");
      return;
    }

    const hasTx = tx.trim().length >= 1;

    let proofPath: string | null = null;
    if (proofFile) {
      setUploading(true);
      try {
        const ext = proofFile.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${user.id}/${orderId}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("payment-proofs")
          .upload(path, proofFile, {
            contentType: proofFile.type || "application/octet-stream",
            upsert: false,
          });
        if (upErr) {
          toast.error(`Upload failed: ${upErr.message}`);
          setUploading(false);
          return;
        }
        proofPath = path;
      } finally {
        setUploading(false);
      }
    }

    try {
      await confirmOrderFn({ data: {
        orderId, plan, size, network,
        txHash: hasTx ? tx.trim() : null,
        paymentProofUrl: proofPath,
        addonFreeNext, isFreeRedemption: false,
        referralCode: referralCodeForSubmit,
        customerDetails: form,
      }});
    } catch (err) {
      console.error("confirmOrder failed", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit order");
      return;
    }
    setStep("done");
    trackEvent("purchase", { transaction_id: orderId, value: effectivePrice, currency: "USD", items: [{ item_name: plan, item_variant: size }] });
    toast.success("Your Account Has Been Activated Successfully");
    if (referralCodeForSubmit) toast.success("Referral Code Applied Successfully. Commission has been recorded.");
  };



  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-28 pb-16">
        <section className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.2em] text-gold">Secure checkout</span>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold">Complete your order</h1>
            <p className="mt-3 text-muted-foreground">Crypto payments only · USDT on BEP20 or TRC20.</p>
          </div>

          <Stepper step={step} />

          <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-8">
            <div>
              {step === "details" && (
                <DetailsForm form={form} setForm={setForm} errors={errors} onSubmit={submitDetails} />
              )}
              {step === "pay" && (
                <PayStep
                  network={network} setNetwork={setNetwork}
                  wallet={wallet} amount={displayPrice} orderId={orderId}
                  copied={copied} copy={copyAddress}
                  tx={tx} setTx={setTx} onSubmit={submitTx}
                  onBack={() => setStep("details")}
                  confirmed={confirmedNetwork} setConfirmed={setConfirmedNetwork}
                  verifying={verifying} verifyResult={verifyResult} onVerify={handleVerify}
                  proofFile={proofFile} setProofFile={setProofFile}
                  uploading={uploading}
                  basePrice={basePrice} addonFee={addonFee}
                  addonFreeNext={addonFreeNext} setAddonFreeNext={setAddonFreeNext}
                  freeCredits={freeCredits}
                  useFreeCredit={useFreeCredit} setUseFreeCredit={setUseFreeCredit}
                  referralCode={referralCode} setReferralCode={setReferralCode}
                  referralStatus={referralStatus} validatingRef={validatingRef}
                  onValidateReferral={handleValidateReferral}
                  promoInput={promoInput} setPromoInput={setPromoInput}
                  promoApplied={promoApplied} promoError={promoError}
                  validatingPromo={validatingPromo}
                  onApplyPromo={handleApplyPromo} onRemovePromo={removePromo}
                  subtotal={subtotal} discountAmount={discountAmount}
                />
              )}
              {step === "done" && <DoneStep orderId={orderId} email={form.email} plan={plan} size={size} price={displayPrice} />}
            </div>
            <OrderSummary
              plan={plan} size={size} price={displayPrice} orderId={orderId}
              basePrice={basePrice} addonFee={addonFee}
              addonFreeNext={addonFreeNext} useFreeCredit={useFreeCredit}
              promoApplied={promoApplied} discountAmount={discountAmount}
            />

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = [
    { id: "details", label: "Your details" },
    { id: "pay", label: "Payment" },
    { id: "done", label: "Confirmation" },
  ] as const;
  const idx = steps.findIndex((s) => s.id === step);
  return (
    <ol className="mt-10 flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-center gap-2 sm:gap-4">
          <span className={`size-7 rounded-full grid place-items-center font-semibold border ${
            i <= idx ? "bg-gold-gradient text-primary-foreground border-transparent" : "border-border text-muted-foreground"
          }`}>{i + 1}</span>
          <span className={i <= idx ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
          {i < steps.length - 1 && <span className="w-6 sm:w-12 h-px bg-border" />}
        </li>
      ))}
    </ol>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

const inputCls = "w-full h-11 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-gold/60 transition";

function DetailsForm({ form, setForm, errors, onSubmit }: any) {
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-5">
      <h2 className="text-xl font-bold">Client information</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First name" error={errors.firstName}>
          <input className={inputCls} value={form.firstName} onChange={set("firstName")} placeholder="Jane" />
        </Field>
        <Field label="Email address" error={errors.email}>
          <input type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="you@email.com" />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <input className={inputCls} value={form.lastName} onChange={set("lastName")} placeholder="Trader" />
        </Field>
        <Field label="Mobile number" error={errors.mobile}>
          <input className={inputCls} value={form.mobile} onChange={set("mobile")} placeholder="+1 555 0123" />
        </Field>
        <Field label="Address" error={errors.address}>
          <input className={inputCls} value={form.address} onChange={set("address")} placeholder="Main Street" />
        </Field>
        <Field label="Street number" error={errors.streetNumber}>
          <input className={inputCls} value={form.streetNumber} onChange={set("streetNumber")} placeholder="123" />
        </Field>
        <Field label="Postal code" error={errors.postalCode}>
          <input className={inputCls} value={form.postalCode} onChange={set("postalCode")} placeholder="10001" />
        </Field>
        <Field label="District" error={errors.district}>
          <input className={inputCls} value={form.district} onChange={set("district")} placeholder="Manhattan" />
        </Field>
        <Field label="Number" error={errors.number}>
          <input className={inputCls} value={form.number} onChange={set("number")} placeholder="Apt / unit no." />
        </Field>
      </div>
      <button type="submit" className="w-full h-12 rounded-lg bg-gold-gradient text-primary-foreground font-semibold hover:opacity-90 transition inline-flex items-center justify-center gap-2">
        Continue to payment <ArrowRight size={18} />
      </button>
    </form>
  );
}

function PayStep({ network, setNetwork, wallet, amount, orderId, copied, copy, tx, setTx, onSubmit, onBack, confirmed, setConfirmed, verifying, verifyResult, onVerify, proofFile, setProofFile, uploading, basePrice, addonFee, addonFreeNext, setAddonFreeNext, freeCredits, useFreeCredit, setUseFreeCredit, referralCode, setReferralCode, referralStatus, validatingRef, onValidateReferral, promoInput, setPromoInput, promoApplied, promoError, validatingPromo, onApplyPromo, onRemovePromo, subtotal, discountAmount }: any) {
  const [secs, setSecs] = useState(30 * 60);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&bgcolor=ffffff&color=0a0a0a&data=${encodeURIComponent(wallet.address)}`;
  const netLabel = wallet.network.split("·")[1].trim();

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="text-gold" />
          <h2 className="text-xl font-bold">Pay with USDT</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <Clock size={16} className="text-gold" />
          <span className="font-mono">{mm}:{ss}</span>
        </div>
      </div>

      {/* Add-on / free credit options */}
      <div className="space-y-3">
        {freeCredits > 0 && (
          <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${useFreeCredit ? "border-gold/60 bg-emerald-gradient" : "border-border bg-background hover:border-gold/40"}`}>
            <input type="checkbox" className="mt-1 size-4 accent-[hsl(var(--gold,45_85%_55%))]"
              checked={useFreeCredit} onChange={(e) => setUseFreeCredit(e.target.checked)} />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles size={16} className="text-gold" />
                Redeem free account credit
                <span className="text-xs font-normal text-muted-foreground">({freeCredits} available)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use one of your free-account credits to claim this account at no cost. No payment proof required.
              </p>
            </div>
          </label>
        )}
        <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${addonFreeNext ? "border-gold/60 bg-emerald-gradient" : "border-border bg-background hover:border-gold/40"} ${useFreeCredit ? "opacity-50 pointer-events-none" : ""}`}>
          <input type="checkbox" className="mt-1 size-4 accent-[hsl(var(--gold,45_85%_55%))]"
            checked={addonFreeNext} onChange={(e) => setAddonFreeNext(e.target.checked)} disabled={useFreeCredit} />
          <div className="flex-1">
            <div className="flex items-center gap-2 font-semibold">
              <Gift size={16} className="text-gold" />
              Add-on: Get your next account FREE
              <span className="text-xs font-normal text-gold">+20% (+${addonFee.toFixed(2).replace(/\.00$/, "")})</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pay an extra 20% on this order (${basePrice.toFixed(2).replace(/\.00$/, "")} → ${(basePrice + addonFee).toFixed(2).replace(/\.00$/, "")}) and your next account purchase is on us — credited to your profile after admin approval.
            </p>
          </div>
        </label>
      </div>

      {!useFreeCredit && (
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border border-border bg-background">
        {(Object.keys(WALLETS) as Network[]).map((n) => (
          <button key={n} type="button" onClick={() => setNetwork(n)}
            className={`py-2.5 rounded-lg text-sm font-medium transition ${
              network === n ? "bg-gold-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {WALLETS[n].network.split("·")[1].trim()}
          </button>
        ))}
      </div>
      )}

      {!useFreeCredit && (
      <div className="rounded-xl border border-gold/30 bg-emerald-gradient p-5">
        <div className="text-xs uppercase tracking-widest text-gold-soft">Send exactly</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold text-gold-gradient">{amount}</span>
          <span className="text-sm text-muted-foreground">in USDT</span>
        </div>
        <div className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{wallet.network}</div>

        <div className="mt-3 grid sm:grid-cols-[180px_1fr] gap-4 items-center">
          <div className="rounded-lg bg-white p-2 mx-auto sm:mx-0">
            <img src={qrUrl} alt={`QR code for ${netLabel} wallet address`} width={180} height={180} className="block" loading="lazy" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-background/60 border border-border p-3">
            <code className="flex-1 text-xs sm:text-sm break-all font-mono">{wallet.address}</code>
            <button type="button" onClick={copy} className="shrink-0 p-2 rounded-md border border-border hover:border-gold/40 transition" aria-label="Copy address">
              {copied ? <Check size={16} className="text-gold" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground flex items-start gap-2">
          <AlertTriangle size={14} className="text-gold shrink-0 mt-0.5" />
          Send only USDT on the <strong className="text-foreground">{netLabel}</strong> network. Other tokens or networks will be lost permanently.
        </p>
      </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {useFreeCredit ? (
          <div className="rounded-lg border border-gold/40 bg-emerald-gradient p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold"><Sparkles size={16} className="text-gold" /> Redeeming a free account credit</div>
            <p className="mt-1 text-xs text-muted-foreground">No payment is required. Your free-account credit will be used on submission and refunded automatically if the order is rejected.</p>
          </div>
        ) : (
        <>
        <div className="rounded-lg border border-gold/30 bg-background/40 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Payment verification</strong> — provide at least one of the following so we can confirm your payment:
          Transaction ID (TXID) <em>or</em> a payment screenshot (any image format or PDF).
        </div>

        <Field label="Transaction hash / TxID (optional)">
          <div className="flex gap-2">
            <input className={inputCls} value={tx} onChange={(e) => setTx(e.target.value)}
              placeholder="0x... or Tron TxID" />
            <button type="button" onClick={onVerify} disabled={verifying || !tx.trim()}
              className="shrink-0 h-11 px-4 rounded-lg border border-gold/40 text-sm font-medium hover:bg-gold/10 transition disabled:opacity-50 inline-flex items-center gap-2">
              {verifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} className="text-gold" />}
              {verifying ? "Checking…" : "Verify"}
            </button>
          </div>
        </Field>

        {verifyResult && <VerifyBanner result={verifyResult} />}

        <Field label="Payment screenshot (optional)">
          <label className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background/40 p-3 cursor-pointer hover:border-gold/40 transition">
            <Upload size={18} className="text-gold shrink-0" />
            <div className="flex-1 text-sm">
              {proofFile ? (
                <span className="inline-flex items-center gap-2">
                  <FileText size={14} className="text-muted-foreground" />
                  <span className="font-medium">{proofFile.name}</span>
                  <span className="text-xs text-muted-foreground">({Math.round(proofFile.size / 1024)} KB)</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Click to upload any image or PDF (any size accepted)</span>
              )}
            </div>
            {proofFile && (
              <button type="button" onClick={(e) => { e.preventDefault(); setProofFile(null); }}
                className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
            )}
            <input type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.bmp,.tiff,.pdf,application/pdf"
              className="hidden"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
          </label>
        </Field>

        <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 size-4 rounded border-border accent-[hsl(var(--gold,45_85%_55%))]" />
          <span className="text-muted-foreground">
            I confirm I sent <strong className="text-foreground">{amount}</strong> in USDT on the <strong className="text-foreground">{netLabel}</strong> network to the address above.
          </span>
        </label>
        </>
        )}

        <div className="rounded-lg border border-border bg-background/40 p-4 space-y-2">
          <Field label="Referral Code (Optional)">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold" />
                <input
                  className={`${inputCls} pl-9 uppercase tracking-wider`}
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32))}
                  placeholder="e.g. GOLD42"
                  maxLength={32}
                />
              </div>
              <button type="button" onClick={onValidateReferral} disabled={validatingRef || !referralCode.trim()}
                className="shrink-0 h-11 px-4 rounded-lg border border-gold/40 text-sm font-medium hover:bg-gold/10 transition disabled:opacity-50 inline-flex items-center gap-2">
                {validatingRef ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
              </button>
            </div>
          </Field>
          {referralStatus && (
            <div className={`text-xs flex items-center gap-1.5 ${referralStatus.valid ? "text-emerald-500" : "text-destructive"}`}>
              {referralStatus.valid ? <Check size={12} /> : <XCircle size={12} />}
              {referralStatus.message}
            </div>
          )}
          {!referralStatus && (
            <p className="text-[11px] text-muted-foreground">
              Have a code from a friend? Enter it to credit them a {/* rate */} commission once your payment is verified.
            </p>
          )}
        </div>

        {!useFreeCredit && (
          <div className="rounded-lg border border-border bg-background/40 p-4 space-y-2">
            <Field label="Promo / Coupon Code (Optional)">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold" />
                  <input
                    className={`${inputCls} pl-9`}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.replace(/[^A-Za-z0-9_\-]/g, "").slice(0, 64))}
                    placeholder="Enter promo code"
                    disabled={!!promoApplied}
                    maxLength={64}
                  />
                </div>
                {promoApplied ? (
                  <button type="button" onClick={onRemovePromo}
                    className="shrink-0 h-11 px-4 rounded-lg border border-border text-sm font-medium hover:bg-destructive/10 transition">
                    Remove
                  </button>
                ) : (
                  <button type="button" onClick={onApplyPromo} disabled={validatingPromo || !promoInput.trim()}
                    className="shrink-0 h-11 px-4 rounded-lg border border-gold/40 text-sm font-medium hover:bg-gold/10 transition disabled:opacity-50 inline-flex items-center gap-2">
                    {validatingPromo ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                  </button>
                )}
              </div>
            </Field>
            {promoApplied ? (
              <div className="text-xs flex items-center gap-1.5 text-emerald-500">
                <Check size={12} /> Promo <strong>{promoApplied.code}</strong> applied — {promoApplied.discountPercent}% off
              </div>
            ) : promoError ? (
              <div className="text-xs flex items-center gap-1.5 text-destructive">
                <XCircle size={12} /> {promoError}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Have a promo code? Enter it to receive an instant discount on this order.
              </p>
            )}
            <div className="mt-2 pt-2 border-t border-border/50 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Original price</span><span>${subtotal.toFixed(2).replace(/\.00$/, "")}</span></div>
              {promoApplied && (
                <div className="flex justify-between text-gold"><span>Discount ({promoApplied.discountPercent}%)</span><span>−${discountAmount.toFixed(2).replace(/\.00$/, "")}</span></div>
              )}
              <div className="flex justify-between font-semibold text-foreground"><span>Final payable</span><span>{amount}</span></div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Order reference: <span className="font-mono text-foreground">{orderId}</span> — include this in your transfer memo if your wallet supports it.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onBack} className="h-12 px-5 rounded-lg border border-border hover:border-gold/40 transition">
            Back
          </button>
          <button type="submit"
            disabled={uploading || (!useFreeCredit && (!confirmed || (!tx.trim() && !proofFile)))}
            className="flex-1 h-12 rounded-lg bg-gold-gradient text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
            {uploading && <Loader2 size={16} className="animate-spin" />}
            {uploading ? "Uploading…" : useFreeCredit ? "Redeem free account" : "Submit for verification"}
          </button>
        </div>
      </form>
    </div>
  );
}

function VerifyBanner({ result }: { result: VerifyResult }) {
  const ok = result.ok;
  const Icon = ok ? Check : result.status === "pending" || result.status === "error" ? Loader2 : XCircle;
  const tone = ok
    ? "border-gold/40 bg-emerald-gradient text-foreground"
    : "border-destructive/40 bg-destructive/10 text-foreground";
  return (
    <div className={`rounded-lg border p-3 text-sm flex items-start gap-3 ${tone}`} role="status" aria-live="polite">
      <Icon size={18} className={ok ? "text-gold mt-0.5 shrink-0" : "text-destructive mt-0.5 shrink-0"} />
      <div className="space-y-1">
        <div className="font-medium">{ok ? "Payment verified on-chain" : "Verification failed"}</div>
        <div className="text-xs text-muted-foreground">{result.message}</div>
        {result.toAddress && !ok && (
          <div className="text-[10px] font-mono break-all text-muted-foreground">to: {result.toAddress}</div>
        )}
      </div>
    </div>
  );
}

function DoneStep({ orderId, email, plan, size, price }: { orderId: string; email: string; plan: string; size: string; price: string }) {
  return (
    <div className="rounded-2xl border border-gold/40 bg-emerald-gradient p-8 md:p-12 text-center glow-gold">
      <div className="mx-auto size-14 rounded-full bg-gold-gradient grid place-items-center text-primary-foreground">
        <ShieldCheck size={28} />
      </div>
      <h2 className="mt-5 text-3xl font-bold">Account Activated Successfully</h2>
      <p className="mt-3 text-muted-foreground max-w-md mx-auto">
        Your <strong className="text-foreground">{plan}</strong> account at <strong className="text-foreground">{size}</strong> for <strong className="text-foreground">{price}</strong> is now active.
      </p>
      <div className="mt-5 mx-auto max-w-sm rounded-xl border border-border bg-background/60 p-4 text-sm text-left space-y-2">
        <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium">{plan}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Account size</span><span className="font-medium">{size}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-medium">{price}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono text-xs">{orderId}</span></div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">A receipt has been emailed to <strong className="text-foreground">{email}</strong>.</p>
      <Link to="/dashboard" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-background text-foreground hover:bg-background/80 transition">
        Go to dashboard
      </Link>
    </div>
  );
}

function OrderSummary({ plan, size, price, orderId, basePrice, addonFee, addonFreeNext, useFreeCredit, promoApplied, discountAmount }: { plan: string; size: string; price: string; orderId: string; basePrice: number; addonFee: number; addonFreeNext: boolean; useFreeCredit: boolean; promoApplied: { code: string; discountPercent: number; createdBy: string | null } | null; discountAmount: number }) {
  const rows = useMemo(() => ([
    ["Account", `${plan} · ${size}`],
    ["Order ID", orderId],
    ["Payment", useFreeCredit ? "Free account credit" : "USDT (BEP20 / TRC20)"],
  ] as [string, string][]), [plan, size, orderId, useFreeCredit]);
  const fmt = (n: number) => `$${n.toFixed(2).replace(/\.00$/, "")}`;
  return (
    <aside className="rounded-2xl border border-border bg-card/50 p-6 h-fit lg:sticky lg:top-24">
      <h3 className="font-bold">Order summary</h3>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium text-right">{v}</dd>
          </div>
        ))}
        {!useFreeCredit && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Account price</dt>
            <dd className="font-medium text-right">{fmt(basePrice)}</dd>
          </div>
        )}
        {addonFreeNext && !useFreeCredit && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground inline-flex items-center gap-1.5">
              <Gift size={12} className="text-gold" /> Free-next add-on (20%)
            </dt>
            <dd className="font-medium text-right">+{fmt(addonFee)}</dd>
          </div>
        )}
        {useFreeCredit && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground inline-flex items-center gap-1.5">
              <Sparkles size={12} className="text-gold" /> Free-account credit
            </dt>
            <dd className="font-medium text-right text-gold">−{fmt(basePrice)}</dd>
          </div>
        )}
        {promoApplied && !useFreeCredit && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground inline-flex items-center gap-1.5">
              <Tag size={12} className="text-gold" /> Promo {promoApplied.code} (−{promoApplied.discountPercent}%)
            </dt>
            <dd className="font-medium text-right text-gold">−{fmt(discountAmount)}</dd>
          </div>
        )}
      </dl>
      <div className="my-5 h-px bg-border" />
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">Total due</span>
        <span className="text-3xl font-display font-bold text-gold-gradient">{price}</span>
      </div>
      <div className="mt-5 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground flex gap-2">
        <ShieldCheck size={14} className="text-gold shrink-0 mt-0.5" />
        One-time fee. No subscriptions, no hidden charges.
      </div>
    </aside>
  );
}
