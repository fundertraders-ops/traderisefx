import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles, error: pErr }, { data: roles }, { data: orders }, { data: referrals }, { data: withdrawals }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, email, full_name, referral_code, referred_by, wallet_balance, total_earned, created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("user_roles").select("user_id, role"),
        supabaseAdmin.from("orders").select("user_id, amount, status"),
        supabaseAdmin.from("referrals").select("referrer_id"),
        supabaseAdmin.from("withdrawals").select("user_id, amount, status"),
      ]);

    if (pErr) throw new Error(pErr.message);

    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });

    const ordersByUser = new Map<string, { count: number; total: number }>();
    (orders ?? []).forEach((o: any) => {
      const cur = ordersByUser.get(o.user_id) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(o.amount ?? 0);
      ordersByUser.set(o.user_id, cur);
    });

    const refCountByUser = new Map<string, number>();
    (referrals ?? []).forEach((r: any) => {
      refCountByUser.set(r.referrer_id, (refCountByUser.get(r.referrer_id) ?? 0) + 1);
    });

    const withdrawalsByUser = new Map<string, { pending: number; total: number }>();
    (withdrawals ?? []).forEach((w: any) => {
      const cur = withdrawalsByUser.get(w.user_id) ?? { pending: 0, total: 0 };
      if (w.status === "pending") cur.pending += Number(w.amount ?? 0);
      cur.total += Number(w.amount ?? 0);
      withdrawalsByUser.set(w.user_id, cur);
    });

    const users = (profiles ?? []).map((p: any) => ({
      ...p,
      roles: rolesByUser.get(p.id) ?? [],
      orders_count: ordersByUser.get(p.id)?.count ?? 0,
      orders_total: ordersByUser.get(p.id)?.total ?? 0,
      referral_count: refCountByUser.get(p.id) ?? 0,
      withdrawals_pending: withdrawalsByUser.get(p.id)?.pending ?? 0,
      withdrawals_total: withdrawalsByUser.get(p.id)?.total ?? 0,
    }));

    return { users };
  });

const userIdSchema = z.object({ userId: z.string().uuid() });

export const getUserDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => userIdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profile }, { data: orders }, { data: referrals }, { data: commissions }, { data: withdrawals }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*").eq("id", data.userId).maybeSingle(),
        supabaseAdmin.from("orders").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }),
        supabaseAdmin
          .from("referrals")
          .select("referred_user_id, created_at")
          .eq("referrer_id", data.userId)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("commissions")
          .select("*")
          .eq("referrer_id", data.userId)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("withdrawals")
          .select("*")
          .eq("user_id", data.userId)
          .order("created_at", { ascending: false }),
      ]);

    return {
      profile,
      orders: orders ?? [],
      referrals: referrals ?? [],
      commissions: commissions ?? [],
      withdrawals: withdrawals ?? [],
    };
  });

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "user"]),
  action: z.enum(["grant", "revoke"]),
});

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => roleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "grant") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && !String(error.message).includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const withdrawalSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "paid"]),
});

export const updateWithdrawalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => withdrawalSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: any = { status: data.status };
    if (data.status === "paid" || data.status === "rejected" || data.status === "approved") {
      patch.processed_at = new Date().toISOString();
    }
    const { error } = await supabaseAdmin.from("withdrawals").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
