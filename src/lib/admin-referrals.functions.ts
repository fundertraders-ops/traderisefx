import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const getReferralSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("referral_settings")
      .select("commission_rate, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { rate: Number(data?.commission_rate ?? 10), updatedAt: data?.updated_at ?? null };
  });

const rateSchema = z.object({ rate: z.number().min(0).max(100) });
export const updateReferralRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => rateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.rpc("set_commission_rate", { _rate: data.rate } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllReferralActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: commissions }, { data: referrals }, { data: orders }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id, email, full_name, referral_code, wallet_balance, total_earned"),
        supabaseAdmin.from("commissions").select("id, referrer_id, referred_user_id, order_id, amount, status, created_at").order("created_at", { ascending: false }),
        supabaseAdmin.from("referrals").select("referrer_id, referred_user_id, created_at"),
        supabaseAdmin.from("orders").select("id, referrer_id, referral_code_used, amount, verification_status, created_at").not("referrer_id", "is", null).order("created_at", { ascending: false }),
      ]);

    const profilesById = new Map<string, any>();
    (profiles ?? []).forEach((p: any) => profilesById.set(p.id, p));

    const summary = (profiles ?? []).map((p: any) => {
      const userCommissions = (commissions ?? []).filter((c: any) => c.referrer_id === p.id);
      const credited = userCommissions.filter((c: any) => c.status === "credited").reduce((s: number, c: any) => s + Number(c.amount), 0);
      const pending = userCommissions.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + Number(c.amount), 0);
      const refCount = (referrals ?? []).filter((r: any) => r.referrer_id === p.id).length
        + (orders ?? []).filter((o: any) => o.referrer_id === p.id).length;
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        referral_code: p.referral_code,
        wallet_balance: Number(p.wallet_balance ?? 0),
        total_earned: Number(p.total_earned ?? 0),
        credited,
        pending,
        commissions_count: userCommissions.length,
        referrals_count: refCount,
      };
    }).filter((s) => s.commissions_count > 0 || s.referrals_count > 0)
      .sort((a, b) => b.credited - a.credited);

    const enrichedCommissions = (commissions ?? []).map((c: any) => ({
      ...c,
      referrer: profilesById.get(c.referrer_id) ?? null,
      referred: profilesById.get(c.referred_user_id) ?? null,
    }));

    return {
      summary,
      commissions: enrichedCommissions,
      orders: orders ?? [],
    };
  });

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["credited", "pending", "rejected"]),
});
export const setCommissionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => statusSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.rpc("admin_set_commission_status", {
      _commission_id: data.id,
      _status: data.status,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public helper: validate a referral code at checkout (does not require admin).
const validateSchema = z.object({ code: z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9]+$/) });
export const validateReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => validateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.toUpperCase();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("referral_code", code)
      .maybeSingle();
    if (!profile) return { valid: false, reason: "Invalid referral code" };
    if (profile.id === userId) return { valid: false, reason: "You cannot use your own referral code" };
    return { valid: true, referrerName: profile.full_name ?? "a Trade Rise FX trader" };
  });
