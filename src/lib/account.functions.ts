import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, referralsRes, commissionsRes, withdrawalsRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, referral_code, wallet_balance, total_earned, free_account_credits, created_at").eq("id", userId).maybeSingle(),
      supabase.from("referrals").select("id, referred_user_id, created_at").eq("referrer_id", userId).order("created_at", { ascending: false }),
      supabase.from("commissions").select("id, amount, status, order_id, created_at").eq("referrer_id", userId).order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("id, amount, method, status, created_at, processed_at").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("orders").select("id, plan, size, amount, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);

    return {
      profile: profileRes.data,
      referrals: referralsRes.data ?? [],
      commissions: commissionsRes.data ?? [],
      withdrawals: withdrawalsRes.data ?? [],
      orders: ordersRes.data ?? [],
    };
  });

export const getMyAddonStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("free_account_credits")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { freeCredits: ((data as { free_account_credits?: number } | null)?.free_account_credits) ?? 0 };
  });

const codeSchema = z.object({
  code: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, underscore and hyphen only"),
});
export const updateMyReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => codeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("update_own_referral_code" as never, { _code: data.code } as never);
    if (error) throw new Error(error.message);
    return { code: result as unknown as string };
  });

export const checkReferralCodeAvailable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => codeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const normalized = data.code.trim().toUpperCase();
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("referral_code", normalized)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.id === userId) return { available: true, normalized };
    return { available: false, normalized };
  });

const withdrawalSchema = z.object({
  amount: z.number().min(100).max(1_000_000),
  method: z.enum(["usdt_bep20", "usdt_trc20", "bank"]),
  payoutDetails: z.object({
    address: z.string().trim().min(2).max(200).optional(),
    bankName: z.string().trim().max(100).optional(),
    accountName: z.string().trim().max(100).optional(),
    accountNumber: z.string().trim().max(60).optional(),
    notes: z.string().trim().max(300).optional(),
  }),
});

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => withdrawalSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: id, error } = await supabase.rpc("request_withdrawal", {
      _amount: data.amount,
      _method: data.method,
      _payout_details: data.payoutDetails,
    });
    if (error) throw new Error(error.message);
    return { id };
  });

const confirmSchema = z.object({
  orderId: z.string().trim().min(3).max(60).regex(/^[A-Za-z0-9-]+$/),
  plan: z.string().trim().min(1).max(60),
  size: z.string().trim().min(1).max(20),
  network: z.enum(["bep20", "trc20"]),
  txHash: z.string().trim().max(120).optional().nullable(),
  paymentProofUrl: z.string().trim().max(500).optional().nullable(),
  addonFreeNext: z.boolean().optional().default(false),
  isFreeRedemption: z.boolean().optional().default(false),
  referralCode: z.string().trim().max(32).regex(/^[A-Za-z0-9]*$/, "Referral code must be letters and numbers only").optional().nullable(),
  customerDetails: z.object({
    firstName: z.string().trim().max(80).optional(),
    lastName: z.string().trim().max(80).optional(),
    email: z.string().trim().max(255).optional(),
    mobile: z.string().trim().max(30).optional(),
    address: z.string().trim().max(200).optional(),
    streetNumber: z.string().trim().max(20).optional(),
    postalCode: z.string().trim().max(20).optional(),
    district: z.string().trim().max(80).optional(),
    number: z.string().trim().max(20).optional(),
  }).optional(),
});

const ADMIN_NOTIFICATION_EMAIL = "fxtradersrise@gmail.com";
const SUPPORT_EMAIL = "fxtradersrise@gmail.com";
const WEBSITE_URL = "https://traderisefx.com";

async function sendPaymentReceivedEmails(args: {
  orderId: string;
  plan: string;
  size: string;
  network: string;
  amount: number;
  isFreeRedemption: boolean;
  userId: string;
  customerEmailFromForm?: string | null;
  customerNameFromForm?: string | null;
}) {
  try {
    const { enqueueTransactionalEmail } = await import("@/lib/email/send-transactional.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", args.userId)
      .maybeSingle();
    const customerEmail = (args.customerEmailFromForm?.trim() || profile?.email || "").toLowerCase();
    const customerName = args.customerNameFromForm?.trim() || profile?.full_name || "Trader";
    const amountStr = args.isFreeRedemption ? "$0 (free credit)" : `$${args.amount.toFixed(2).replace(/\.00$/, "")}`;
    const purchaseDate = new Date().toLocaleString("en-US");

    const templateData = {
      customerName,
      customerEmail,
      orderId: args.orderId,
      accountType: args.plan,
      accountSize: args.size,
      amount: amountStr,
      network: args.network,
      purchaseDate,
      supportEmail: SUPPORT_EMAIL,
      websiteUrl: WEBSITE_URL,
    };

    const tasks: Array<Promise<any>> = [];
    if (customerEmail) {
      tasks.push(
        enqueueTransactionalEmail({
          templateName: "payment-received",
          recipientEmail: customerEmail,
          templateData: { ...templateData, isAdminCopy: false },
          idempotencyKey: `payment-received-customer-${args.orderId}`,
        }),
      );
    }
    tasks.push(
      enqueueTransactionalEmail({
        templateName: "payment-received",
        recipientEmail: ADMIN_NOTIFICATION_EMAIL,
        templateData: { ...templateData, isAdminCopy: true },
        idempotencyKey: `payment-received-admin-${args.orderId}`,
      }),
    );

    const results = await Promise.allSettled(tasks);
    for (const r of results) {
      if (r.status === "rejected" || (r.status === "fulfilled" && !r.value?.ok)) {
        await supabaseAdmin.from("email_send_log").insert({
          message_id: null,
          template_name: "payment-received",
          recipient_email: ADMIN_NOTIFICATION_EMAIL,
          status: "failed",
          error_message: `Delivery failure for order ${args.orderId}: ${
            r.status === "rejected" ? r.reason?.message ?? r.reason : r.value?.reason
          }`,
        });
      }
    }
  } catch (e) {
    console.error("payment-received email failed", e);
  }
}

async function sendReferralAppliedEmail(args: {
  orderId: string;
  referralCode: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  isFreeRedemption: boolean;
}) {
  try {
    const { enqueueTransactionalEmail } = await import("@/lib/email/send-transactional.server");
    const amountStr = args.isFreeRedemption ? "$0 (free credit)" : `$${args.amount.toFixed(2).replace(/\.00$/, "")}`;
    await enqueueTransactionalEmail({
      templateName: "referral-applied",
      recipientEmail: args.customerEmail,
      templateData: {
        customerName: args.customerName,
        orderId: args.orderId,
        referralCode: args.referralCode,
        amount: amountStr,
        supportEmail: SUPPORT_EMAIL,
        websiteUrl: WEBSITE_URL,
      },
      idempotencyKey: `referral-applied-${args.orderId}`,
    });
  } catch (e) {
    console.error("referral-applied email failed", e);
  }
}

export const confirmOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => confirmSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { lookupCanonicalPrice } = await import("@/lib/tx-verify.server");

    const basePrice = lookupCanonicalPrice(data.plan, data.size);
    if (!basePrice) throw new Error("Unknown plan or size");

    const referralCode = data.referralCode?.trim().toUpperCase() || null;

    const callRpc = async (amount: number, txHash: string | null, proofUrl: string | null, isFree: boolean, addon: boolean) => {
      const { error } = await supabase.rpc("confirm_order_and_credit_referral", {
        _order_id: data.orderId,
        _amount: amount,
        _plan: data.plan,
        _size: data.size,
        _network: data.network,
        _tx_hash: txHash,
        _payment_proof_url: proofUrl,
        _customer_details: data.customerDetails ?? null,
        _addon_free_next: addon,
        _is_free_redemption: isFree,
        _referral_code: referralCode,
      } as never);
      if (error) throw new Error(error.message);
    };

    // Free redemption: amount = 0, no on-chain verification
    if (data.isFreeRedemption) {
      await callRpc(0, null, null, true, false);
    } else {
      const expectedAmount = data.addonFreeNext
        ? Math.round(basePrice * 1.2 * 100) / 100
        : basePrice;

      let verifiedAmount = expectedAmount;
      const txHash = data.txHash?.trim() || null;
      if (txHash && txHash.length >= 1) {
        try {
          const { verifyBep20, verifyTrc20, DEPOSIT_ADDRESSES } = await import("@/lib/tx-verify.server");
          const depositAddress = DEPOSIT_ADDRESSES[data.network];
          const result = data.network === "bep20"
            ? await verifyBep20(txHash, depositAddress, expectedAmount)
            : await verifyTrc20(txHash, depositAddress, expectedAmount);
          if (result.ok && result.paidAmount) verifiedAmount = result.paidAmount;
        } catch {
          // Invalid or unverifiable hash — still record the order for manual admin review
        }
      }

      await callRpc(verifiedAmount, txHash, data.paymentProofUrl?.trim() || null, false, !!data.addonFreeNext);
      // Re-read order to capture verified amount for emails
      data = { ...data } as any;
      (data as any)._verifiedAmount = verifiedAmount;
    }

    const verifiedAmount = (data as any)._verifiedAmount ?? 0;
    const customerEmail = data.customerDetails?.email?.trim() || null;
    const customerName = [data.customerDetails?.firstName, data.customerDetails?.lastName].filter(Boolean).join(" ") || null;

    await sendPaymentReceivedEmails({
      orderId: data.orderId,
      plan: data.plan,
      size: data.size,
      network: data.network,
      amount: verifiedAmount,
      isFreeRedemption: !!data.isFreeRedemption,
      userId,
      customerEmailFromForm: customerEmail,
      customerNameFromForm: customerName,
    });

    // Send referral-applied confirmation to buyer
    if (referralCode) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .maybeSingle();
      const toEmail = (customerEmail || profile?.email || "").toLowerCase();
      if (toEmail) {
        await sendReferralAppliedEmail({
          orderId: data.orderId,
          referralCode,
          customerEmail: toEmail,
          customerName: customerName || profile?.full_name || "Trader",
          amount: verifiedAmount,
          isFreeRedemption: !!data.isFreeRedemption,
        });
      }
    }

    return { ok: true, amount: verifiedAmount, status: "pending", referralApplied: !!referralCode };
  });
