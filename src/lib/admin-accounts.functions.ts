import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export function payoutCycleDaysForPlan(plan?: string | null): number {
  const s = (plan ?? "").toLowerCase();
  if (/(^|[^a-z0-9])(1|one)[ \-]?step|^(1|one)[ \-]?step/.test(s)) return 21;
  if (/(^|[^a-z0-9])(2|two)[ \-]?step|^(2|two)[ \-]?step/.test(s)) return 14;
  if (/instant/.test(s)) return 14;
  return 14;
}

export function isInstantAccountPlan(plan?: string | null): boolean {
  return /instant/.test((plan ?? "").toLowerCase());
}

export function minimumHoldSecondsForPlan(plan?: string | null, isFeeBased = false): number {
  return !isFeeBased && isInstantAccountPlan(plan) ? 120 : 0;
}

function withAccountRules(account: any) {
  const payoutDays = payoutCycleDaysForPlan(account.plan);
  const minHoldSeconds = minimumHoldSecondsForPlan(account.plan);
  return {
    ...account,
    payout_cycle_days: payoutDays,
    requires_min_hold: minHoldSeconds > 0,
    min_hold_seconds: minHoldSeconds,
    fee_based_exempt: minHoldSeconds === 0,
  };
}

// ---------- ORDERS (admin) ----------

export const listAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: orders, error }, { data: accounts }, { data: profiles }] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id, user_id, email, plan, size, amount, network, tx_hash, status, customer_details, created_at, payment_proof_url, verification_status, verification_notes, verified_at, verified_by, addon_free_next, is_free_redemption")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("trading_accounts").select("id, order_id, status, login"),
      supabaseAdmin.from("profiles").select("id, full_name"),
    ]);
    if (error) throw new Error(error.message);

    const acctByOrder = new Map<string, any>();
    (accounts ?? []).forEach((a: any) => { if (a.order_id) acctByOrder.set(a.order_id, a); });
    const nameById = new Map<string, string>();
    (profiles ?? []).forEach((p: any) => nameById.set(p.id, p.full_name ?? ""));

    // Generate signed URLs for any payment-proof attachments
    const withProof = await Promise.all((orders ?? []).map(async (o: any) => {
      let proofSignedUrl: string | null = null;
      if (o.payment_proof_url) {
        const { data: signed } = await supabaseAdmin.storage
          .from("payment-proofs")
          .createSignedUrl(o.payment_proof_url, 60 * 60);
        proofSignedUrl = signed?.signedUrl ?? null;
      }
      return {
        ...o,
        full_name: o.user_id ? nameById.get(o.user_id) ?? "" : "",
        trading_account: acctByOrder.get(o.id) ?? null,
        payment_proof_signed_url: proofSignedUrl,
      };
    }));

    return { orders: withProof };
  });

// ---------- ORDER VERIFICATION ----------

const reviewSchema = z.object({
  orderId: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const approveOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reviewSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.rpc("approve_order", {
      _order_id: data.orderId,
      _notes: data.notes ?? null,
    } as never);
    if (error) throw new Error(error.message);

    // Fire-and-forget: notify referrer of commission credit
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: commission } = await supabaseAdmin
        .from("commissions")
        .select("amount, referrer_id, order_id")
        .eq("order_id", data.orderId)
        .maybeSingle();
      if (commission && commission.referrer_id) {
        const [{ data: refProfile }, { data: settings }] = await Promise.all([
          supabaseAdmin
            .from("profiles")
            .select("email, full_name, wallet_balance")
            .eq("id", commission.referrer_id)
            .maybeSingle(),
          supabaseAdmin
            .from("referral_settings")
            .select("commission_rate")
            .eq("id", 1)
            .maybeSingle(),
        ]);
        if (refProfile?.email) {
          const { enqueueTransactionalEmail } = await import("@/lib/email/send-transactional.server");
          await enqueueTransactionalEmail({
            templateName: "commission-credited",
            recipientEmail: refProfile.email.toLowerCase(),
            templateData: {
              referrerName: refProfile.full_name || "Trader",
              amount: `$${Number(commission.amount).toFixed(2)}`,
              rate: `${Number(settings?.commission_rate ?? 10)}%`,
              orderId: commission.order_id,
              walletBalance: `$${Number(refProfile.wallet_balance ?? 0).toFixed(2)}`,
              dashboardUrl: "https://traderisefx.com/dashboard",
              supportEmail: "fxtradersrise@gmail.com",
            },
            idempotencyKey: `commission-credited-${commission.order_id}`,
          });
        }
      }
    } catch (e) {
      console.error("commission-credited email failed", e);
    }

    return { ok: true };
  });

export const rejectOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reviewSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.rpc("reject_order", {
      _order_id: data.orderId,
      _notes: data.notes ?? null,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// ---------- TRADING ACCOUNTS ----------

export const listAllTradingAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: accounts, error }, { data: profiles }] = await Promise.all([
      supabaseAdmin
        .from("trading_accounts")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("profiles").select("id, email, full_name"),
    ]);
    if (error) throw new Error(error.message);

    const pById = new Map<string, any>();
    (profiles ?? []).forEach((p: any) => pById.set(p.id, p));

    // Detect Phase 2 children via admin_notes tag and map them back to parents
    const phase2ParentIds = new Set<string>();
    const phase2ByParent = new Map<string, any>();
    const phase2Ids = new Set<string>();
    const re = /\[PHASE2_PARENT:([0-9a-f-]{36})\]/i;
    (accounts ?? []).forEach((a: any) => {
      const m = a.admin_notes ? String(a.admin_notes).match(re) : null;
      if (m) {
        phase2ParentIds.add(m[1]);
        phase2ByParent.set(m[1], { id: a.id, login: a.login });
        phase2Ids.add(a.id);
      }
    });

    return {
      accounts: (accounts ?? []).map((a: any) => withAccountRules({
        ...a,
        user_email: pById.get(a.user_id)?.email ?? null,
        user_name: pById.get(a.user_id)?.full_name ?? null,
        is_phase2: phase2Ids.has(a.id),
        phase2_account: phase2ByParent.get(a.id) ?? null,
      })),
    };
  });

const createSchema = z.object({
  orderId: z.string().min(1).max(60).optional().nullable(),
  userId: z.string().uuid(),
  plan: z.string().trim().max(60).optional().nullable(),
  size: z.string().trim().max(20).optional().nullable(),
  platform: z.string().trim().min(1).max(40),
  server: z.string().trim().max(120).optional().nullable(),
  login: z.string().trim().min(1).max(60),
  password: z.string().trim().min(1).max(120),
  startingBalance: z.number().min(0).max(100_000_000),
  notes: z.string().trim().max(1000).optional().nullable(),
});

const ADMIN_NOTIFICATION_EMAIL = "fxtradersrise@gmail.com";
const SUPPORT_EMAIL = "fxtradersrise@gmail.com";
const WEBSITE_URL = "https://traderisefx.com";

export const createTradingAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("trading_accounts")
      .insert({
        user_id: data.userId,
        order_id: data.orderId ?? null,
        plan: data.plan ?? null,
        size: data.size ?? null,
        platform: data.platform,
        server: data.server ?? null,
        login: data.login,
        password: data.password,
        starting_balance: data.startingBalance,
        balance: data.startingBalance,
        equity: data.startingBalance,
        profit: 0,
        status: "active",
        admin_notes: data.notes ?? null,
        delivered_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Send activation email (customer + admin copy). Failures are logged but do
    // not block account creation.
    try {
      const { enqueueTransactionalEmail } = await import("@/lib/email/send-transactional.server");
      const [{ data: profile }, { data: order }] = await Promise.all([
        supabaseAdmin.from("profiles").select("email, full_name").eq("id", data.userId).maybeSingle(),
        data.orderId
          ? supabaseAdmin.from("orders").select("id, plan, size, amount, created_at").eq("id", data.orderId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const customerEmail = profile?.email ?? null;
      const customerName = profile?.full_name ?? "Trader";
      const orderId = data.orderId ?? (row.id as string);
      const accountType = data.plan ?? (order as any)?.plan ?? "Trading Account";
      const accountSize = data.size ?? (order as any)?.size ?? `$${data.startingBalance.toLocaleString()}`;
      const purchaseDate = new Date((order as any)?.created_at ?? Date.now()).toLocaleString("en-US");

      const templateData = {
        customerName,
        customerEmail,
        orderId,
        accountType,
        accountSize,
        purchaseDate,
        platform: data.platform,
        serverName: data.server ?? undefined,
        loginEmail: data.login,
        loginPassword: data.password,
        supportEmail: SUPPORT_EMAIL,
        websiteUrl: WEBSITE_URL,
      };

      const tasks: Array<Promise<any>> = [];
      if (customerEmail) {
        tasks.push(
          enqueueTransactionalEmail({
            templateName: "account-activated",
            recipientEmail: customerEmail,
            templateData: { ...templateData, isAdminCopy: false },
            idempotencyKey: `account-activated-customer-${row.id}`,
          }),
        );
      }
      tasks.push(
        enqueueTransactionalEmail({
          templateName: "account-activated",
          recipientEmail: ADMIN_NOTIFICATION_EMAIL,
          templateData: { ...templateData, isAdminCopy: true },
          idempotencyKey: `account-activated-admin-${row.id}`,
        }),
      );

      const results = await Promise.allSettled(tasks);
      for (const r of results) {
        if (r.status === "rejected" || (r.status === "fulfilled" && !r.value?.ok)) {
          // Notify admin of delivery failure (best-effort, secondary log row)
          await supabaseAdmin.from("email_send_log").insert({
            message_id: null,
            template_name: "account-activated",
            recipient_email: ADMIN_NOTIFICATION_EMAIL,
            status: "failed",
            error_message: `Delivery failure for trading account ${row.id}: ${
              r.status === "rejected" ? r.reason?.message ?? r.reason : r.value?.reason
            }`,
          });
        }
      }
    } catch (e) {
      console.error("Failed to send activation email", e);
    }

    return { id: row.id };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  platform: z.string().trim().min(1).max(40).optional(),
  server: z.string().trim().max(120).optional().nullable(),
  login: z.string().trim().min(1).max(60).optional(),
  password: z.string().trim().min(1).max(120).optional(),
  balance: z.number().min(-100_000_000).max(100_000_000).optional(),
  equity: z.number().min(-100_000_000).max(100_000_000).optional(),
  profit: z.number().min(-100_000_000).max(100_000_000).optional(),
  status: z.enum(["pending", "active", "breached", "passed", "suspended"]).optional(),
  breachedReason: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

async function sendBreachEmail(accountId: string, reason: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: acct } = await supabaseAdmin
      .from("trading_accounts")
      .select("id, user_id, plan, size, login, starting_balance")
      .eq("id", accountId)
      .maybeSingle();
    if (!acct?.user_id) return;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", acct.user_id)
      .maybeSingle();
    if (!profile?.email) return;
    const { enqueueTransactionalEmail } = await import("@/lib/email/send-transactional.server");
    await enqueueTransactionalEmail({
      templateName: "account-breached",
      recipientEmail: profile.email.toLowerCase(),
      templateData: {
        customerName: profile.full_name || "Trader",
        accountType: acct.plan ?? "Trading Account",
        accountSize: acct.size ?? (acct.starting_balance ? `$${Number(acct.starting_balance).toLocaleString()}` : "—"),
        login: acct.login ?? "—",
        reason: reason || "Rule violation",
        breachedAt: new Date().toLocaleString("en-US"),
        supportEmail: SUPPORT_EMAIL,
        websiteUrl: WEBSITE_URL,
      },
      idempotencyKey: `account-breached-${accountId}`,
    });
  } catch (e) {
    console.error("account-breached email failed", e);
  }
}

export const updateTradingAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Capture prior status to detect breach transition
    const { data: prior } = await supabaseAdmin
      .from("trading_accounts")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();

    const patch: any = {};
    if (data.platform !== undefined) patch.platform = data.platform;
    if (data.server !== undefined) patch.server = data.server;
    if (data.login !== undefined) patch.login = data.login;
    if (data.password !== undefined) patch.password = data.password;
    if (data.balance !== undefined) patch.balance = data.balance;
    if (data.equity !== undefined) patch.equity = data.equity;
    if (data.profit !== undefined) patch.profit = data.profit;
    if (data.status !== undefined) patch.status = data.status;
    if (data.breachedReason !== undefined) patch.breached_reason = data.breachedReason;
    if (data.notes !== undefined) patch.admin_notes = data.notes;

    const { error } = await supabaseAdmin.from("trading_accounts").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.status === "breached" && prior?.status !== "breached") {
      await sendBreachEmail(data.id, data.breachedReason ?? "Rule violation");
    }
    return { ok: true };
  });

const idSchema = z.object({ id: z.string().uuid() });

export const breachTradingAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), reason: z.string().trim().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prior } = await supabaseAdmin
      .from("trading_accounts")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    const reason = data.reason ?? "Rule violation";
    const { error } = await supabaseAdmin
      .from("trading_accounts")
      .update({ status: "breached", breached_reason: reason })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (prior?.status !== "breached") {
      await sendBreachEmail(data.id, reason);
    }
    return { ok: true };
  });


export const deleteTradingAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("trading_accounts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- USER (their own accounts) ----------

export const getMyTradingAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("trading_accounts")
      .select("id, plan, size, platform, server, login, password, starting_balance, balance, equity, profit, status, breached_reason, delivered_at, created_at, last_payout_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return {
      accounts: (data ?? []).map((a: any) => {
        const cycleDays = payoutCycleDaysForPlan(a.plan);
        const anchor = a.last_payout_at ?? a.delivered_at ?? a.created_at;
        const eligibleAt = anchor
          ? new Date(new Date(anchor).getTime() + cycleDays * 86400000).toISOString()
          : null;
        return { ...withAccountRules(a), payout_cycle_days: cycleDays, payout_eligible_at: eligibleAt };
      }),
    };
  });

const payoutSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive().max(10_000_000),
  method: z.enum(["usdt_bep20", "usdt_trc20", "bank"]),
  payoutDetails: z.record(z.string(), z.any()).optional(),
});

export const requestAccountPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => payoutSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: pid, error } = await supabase.rpc("request_account_payout", {
      _account_id: data.accountId,
      _amount: data.amount,
      _method: data.method,
      _payout_details: data.payoutDetails ?? {},
    } as never);
    if (error) throw new Error(error.message);
    return { id: pid };
  });

const tradeComplianceSchema = z.object({
  accountId: z.string().uuid(),
  openedAt: z.string().datetime({ offset: true }),
  closedAt: z.string().datetime({ offset: true }),
  isFeeBased: z.boolean().optional().default(false),
});

export const validateAccountTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => tradeComplianceSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("validate_account_trade", {
      _account_id: data.accountId,
      _opened_at: data.openedAt,
      _closed_at: data.closedAt,
      _is_fee_based: data.isFeeBased,
    } as never);
    if (error) throw new Error(error.message);
    return result as {
      valid_for_compliance: boolean;
      requires_min_hold: boolean;
      minimum_hold_seconds: number;
      actual_hold_seconds: number | null;
      reason: string;
    };
  });

// ---------- ACCOUNT GALLERY ----------

const accountIdSchema = z.object({ accountId: z.string().uuid() });

async function signGalleryRows(rows: any[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return Promise.all(
    rows.map(async (g: any) => {
      let url: string | null = null;
      if (g.image_path) {
        const { data } = await supabaseAdmin.storage
          .from("account-gallery")
          .createSignedUrl(g.image_path, 60 * 60);
        url = data?.signedUrl ?? null;
      }
      return { ...g, image_url: url };
    }),
  );
}

export const listAccountGallery = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => accountIdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: acct } = await supabaseAdmin
      .from("trading_accounts")
      .select("user_id")
      .eq("id", data.accountId)
      .maybeSingle();
    if (!acct) throw new Error("Account not found");
    if (!isAdmin && acct.user_id !== userId) throw new Error("Forbidden");

    const { data: rows, error } = await supabaseAdmin
      .from("account_gallery")
      .select("id, trading_account_id, user_id, image_path, caption, created_at, updated_at")
      .eq("trading_account_id", data.accountId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { items: await signGalleryRows(rows ?? []) };
  });

const uploadSchema = z.object({
  accountId: z.string().uuid(),
  caption: z.string().trim().max(1000).optional().nullable(),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(120),
  // data URL or base64 body, max ~8MB encoded
  fileBase64: z.string().min(1).max(12_000_000),
});

export const uploadGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: acct } = await supabaseAdmin
      .from("trading_accounts")
      .select("id, user_id")
      .eq("id", data.accountId)
      .maybeSingle();
    if (!acct?.user_id) throw new Error("Account not found");

    const base64 = data.fileBase64.includes(",") ? data.fileBase64.split(",")[1] : data.fileBase64;
    const bytes = Buffer.from(base64, "base64");
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${acct.user_id}/${data.accountId}/${Date.now()}-${safe}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("account-gallery")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: row, error } = await supabaseAdmin
      .from("account_gallery")
      .insert({
        trading_account_id: data.accountId,
        user_id: acct.user_id,
        image_path: path,
        caption: data.caption ?? null,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const captionSchema = z.object({
  id: z.string().uuid(),
  caption: z.string().trim().max(1000).nullable(),
});

export const updateGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => captionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("account_gallery")
      .update({ caption: data.caption })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("account_gallery")
      .select("image_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.image_path) {
      await supabaseAdmin.storage.from("account-gallery").remove([row.image_path]);
    }
    const { error } = await supabaseAdmin.from("account_gallery").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// ---------- PHASE 2 ACCOUNT ISSUANCE ----------

const PHASE2_TAG = "[PHASE2_PARENT:";

const phase2Schema = z.object({
  parentAccountId: z.string().uuid(),
  platform: z.string().trim().min(1).max(40),
  server: z.string().trim().max(120).optional().nullable(),
  login: z.string().trim().min(1).max(60),
  password: z.string().trim().min(1).max(120),
  plan: z.string().trim().max(60).optional().nullable(),
  size: z.string().trim().max(20).optional().nullable(),
  startingBalance: z.number().min(0).max(100_000_000),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const issuePhase2Account = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => phase2Schema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: parent, error: pErr } = await supabaseAdmin
      .from("trading_accounts")
      .select("id, user_id, plan, size, login, admin_notes")
      .eq("id", data.parentAccountId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!parent?.user_id) throw new Error("Parent account not found");

    // Prevent duplicate Phase 2 issuance for the same parent
    const tag = `${PHASE2_TAG}${parent.id}]`;
    const { data: existing } = await supabaseAdmin
      .from("trading_accounts")
      .select("id")
      .eq("user_id", parent.user_id)
      .ilike("admin_notes", `%${tag}%`)
      .maybeSingle();
    if (existing) throw new Error("A Phase 2 account already exists for this client.");

    const planLabel = data.plan ?? (parent.plan ? `Phase 2 — ${parent.plan}` : "Phase 2 Challenge");
    const sizeLabel = data.size ?? parent.size ?? `$${data.startingBalance.toLocaleString()}`;
    const notes = `${tag} ${data.notes ?? ""}`.trim();

    const { data: row, error } = await supabaseAdmin
      .from("trading_accounts")
      .insert({
        user_id: parent.user_id,
        order_id: null,
        plan: planLabel,
        size: sizeLabel,
        platform: data.platform,
        server: data.server ?? null,
        login: data.login,
        password: data.password,
        starting_balance: data.startingBalance,
        balance: data.startingBalance,
        equity: data.startingBalance,
        profit: 0,
        status: "active",
        admin_notes: notes,
        delivered_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Send the Phase 2 issued email to the client
    try {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", parent.user_id)
        .maybeSingle();
      if (profile?.email) {
        const { enqueueTransactionalEmail } = await import("@/lib/email/send-transactional.server");
        await enqueueTransactionalEmail({
          templateName: "phase2-issued",
          recipientEmail: profile.email.toLowerCase(),
          templateData: {
            customerName: profile.full_name || "Trader",
            phase1Login: parent.login ?? "—",
            accountType: planLabel,
            accountSize: sizeLabel,
            platform: data.platform,
            serverName: data.server ?? undefined,
            loginEmail: data.login,
            loginPassword: data.password,
            issuedAt: new Date().toLocaleString("en-US"),
            supportEmail: SUPPORT_EMAIL,
            websiteUrl: WEBSITE_URL,
            dashboardUrl: `${WEBSITE_URL}/dashboard`,
          },
          idempotencyKey: `phase2-issued-${row.id}`,
        });
      }
    } catch (e) {
      console.error("phase2-issued email failed", e);
    }

    return { id: row.id };
  });
