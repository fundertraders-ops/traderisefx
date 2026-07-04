import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function genLogin() {
  const arr = new Uint32Array(2);
  crypto.getRandomValues(arr);
  return String(50_000_000 + (arr[0] % 49_999_999));
}

function genPassword(len = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function computeRanking(rows: any[]) {
  return [...rows]
    .filter((r) => r.status === "active")
    .sort((a, b) => {
      const dp = Number(b.profit_pct) - Number(a.profit_pct);
      if (dp !== 0) return dp;
      return Number(a.max_drawdown_pct) - Number(b.max_drawdown_pct);
    });
}

// ---------- PUBLIC ----------

export const getActiveCompetition = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: comp } = await supabaseAdmin
    .from("competitions")
    .select("*")
    .eq("status", "active")
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!comp) return { competition: null, participantCount: 0 };
  const { count } = await supabaseAdmin
    .from("competition_accounts")
    .select("id", { count: "exact", head: true })
    .eq("competition_id", comp.id);
  return { competition: comp, participantCount: count ?? 0 };
});

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((d: { competitionId: string }) => z.object({ competitionId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("competition_accounts")
      .select("id,user_id,display_name,starting_balance,current_equity,profit_pct,profit_usd,trades_count,win_rate,max_drawdown_pct,status,last_updated_at")
      .eq("competition_id", data.competitionId);
    if (error) throw new Error(error.message);
    const sorted = computeRanking(rows ?? []);
    const breachedOrDQ = (rows ?? []).filter((r) => r.status !== "active");
    return { active: sorted, inactive: breachedOrDQ };
  });

export const listPreviousWinners = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: prizes } = await supabaseAdmin
    .from("competition_prizes")
    .select("id,competition_id,user_id,account_id,rank,amount,status,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (!prizes || prizes.length === 0) return [];
  const compIds = [...new Set(prizes.map((p) => p.competition_id))];
  const acctIds = [...new Set(prizes.map((p) => p.account_id))];
  const [{ data: comps }, { data: accts }] = await Promise.all([
    supabaseAdmin.from("competitions").select("id,name,month").in("id", compIds),
    supabaseAdmin.from("competition_accounts").select("id,display_name,profit_pct").in("id", acctIds),
  ]);
  const cmap = new Map((comps ?? []).map((c: any) => [c.id, c]));
  const amap = new Map((accts ?? []).map((a: any) => [a.id, a]));
  return prizes.map((p: any) => ({
    ...p,
    competition: cmap.get(p.competition_id) ?? null,
    account: amap.get(p.account_id) ?? null,
  }));
});

// ---------- USER ----------

export const joinCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: comp } = await supabaseAdmin
      .from("competitions")
      .select("*")
      .eq("status", "active")
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!comp) throw new Error("No active competition right now. Check back soon.");

    const { data: existing } = await supabaseAdmin
      .from("competition_accounts")
      .select("*")
      .eq("competition_id", comp.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) return { account: existing, competition: comp, alreadyJoined: true };

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,email")
      .eq("id", userId)
      .maybeSingle();

    const login = genLogin();
    const password = genPassword(14);

    const { data: created, error: insErr } = await supabaseAdmin
      .from("competition_accounts")
      .insert({
        competition_id: comp.id,
        user_id: userId,
        display_name: profile?.full_name || profile?.email?.split("@")[0] || "Trader",
        account_login: login,
        account_password: password,
        platform: "mt5",
        server: "TradeRiseFX-Demo",
        starting_balance: comp.account_size,
        current_balance: comp.account_size,
        current_equity: comp.account_size,
        peak_equity: comp.account_size,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    // Send credentials email (fire and forget)
    try {
      if (profile?.email) {
        const { enqueueTransactionalEmail } = await import("@/lib/email/send-transactional.server");
        await enqueueTransactionalEmail({
          templateName: "competition-joined",
          recipientEmail: profile.email,
          idempotencyKey: `comp-join-${created.id}`,
          templateData: {
            customerName: profile.full_name || "Trader",
            competitionName: comp.name,
            accountSize: `$${Number(comp.account_size).toLocaleString()}`,
            login,
            password,
            server: created.server,
            platform: "MetaTrader 5",
            dailyDrawdown: `${comp.daily_drawdown_pct}%`,
            maxDrawdown: `${comp.max_drawdown_pct}%`,
            endsAt: new Date(comp.ends_at).toLocaleString("en-US"),
          },
        });
      }
    } catch (e) {
      console.error("competition-joined email failed:", e);
    }

    return { account: created, competition: comp, alreadyJoined: false };
  });

export const getMyCompetitionAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: comp } = await supabaseAdmin
      .from("competitions")
      .select("*")
      .eq("status", "active")
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!comp) return { competition: null, account: null, rank: null };

    const { data: account } = await supabase
      .from("competition_accounts")
      .select("*")
      .eq("competition_id", comp.id)
      .eq("user_id", userId)
      .maybeSingle();

    let rank: number | null = null;
    if (account) {
      const { data: rows } = await supabaseAdmin
        .from("competition_accounts")
        .select("id,profit_pct,max_drawdown_pct,status")
        .eq("competition_id", comp.id);
      const sorted = computeRanking(rows ?? []);
      const idx = sorted.findIndex((r) => r.id === account.id);
      rank = idx >= 0 ? idx + 1 : null;
    }
    return { competition: comp, account, rank };
  });

// ---------- ADMIN ----------

export const adminListCompetitions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("competitions")
      .select("*")
      .order("month", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminCreateCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { month: string; name?: string }) =>
    z.object({ month: z.string(), name: z.string().min(1).max(120).optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const monthDate = new Date(data.month + "T00:00:00Z");
    const starts = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1));
    const ends = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1) - 1000);
    const name =
      data.name ??
      `Monthly Trading Competition — ${starts.toLocaleString("en-US", { month: "long", year: "numeric" })}`;
    const { data: row, error } = await supabaseAdmin
      .from("competitions")
      .insert({
        month: starts.toISOString().slice(0, 10),
        name,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: "active",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminUpdateCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    name?: string;
    prize_1?: number;
    prize_2?: number;
    prize_3?: number;
    daily_drawdown_pct?: number;
    max_drawdown_pct?: number;
    account_size?: number;
    status?: string;
  }) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(120).optional(),
        prize_1: z.number().min(0).optional(),
        prize_2: z.number().min(0).optional(),
        prize_3: z.number().min(0).optional(),
        daily_drawdown_pct: z.number().min(0).max(100).optional(),
        max_drawdown_pct: z.number().min(0).max(100).optional(),
        account_size: z.number().min(0).optional(),
        status: z.enum(["upcoming", "active", "paused", "ended"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("competitions").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListParticipants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { competitionId: string }) => z.object({ competitionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("competition_accounts")
      .select("*")
      .eq("competition_id", data.competitionId)
      .order("profit_pct", { ascending: false });
    if (error) throw new Error(error.message);
    const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id,full_name,email")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return (rows ?? []).map((r: any) => ({ ...r, profile: pmap.get(r.user_id) ?? null }));
  });

export const adminUpdateAccountStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    accountId: string;
    current_equity?: number;
    current_balance?: number;
    trades_count?: number;
    win_rate?: number;
    daily_loss_pct?: number;
  }) =>
    z
      .object({
        accountId: z.string().uuid(),
        current_equity: z.number().optional(),
        current_balance: z.number().optional(),
        trades_count: z.number().int().min(0).optional(),
        win_rate: z.number().min(0).max(100).optional(),
        daily_loss_pct: z.number().min(0).max(100).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: acct } = await supabaseAdmin
      .from("competition_accounts")
      .select("*")
      .eq("id", data.accountId)
      .maybeSingle();
    if (!acct) throw new Error("Account not found");

    const equity = data.current_equity ?? Number(acct.current_equity);
    const balance = data.current_balance ?? Number(acct.current_balance);
    const start = Number(acct.starting_balance);
    const peak = Math.max(Number(acct.peak_equity), equity);
    const profit_usd = equity - start;
    const profit_pct = (profit_usd / start) * 100;
    const drawdown_pct = peak > 0 ? Math.max(0, ((peak - equity) / peak) * 100) : 0;
    const max_drawdown_pct = Math.max(Number(acct.max_drawdown_pct), drawdown_pct);

    let status = acct.status;
    let disqualified_reason = acct.disqualified_reason;
    const { data: comp } = await supabaseAdmin
      .from("competitions")
      .select("daily_drawdown_pct,max_drawdown_pct")
      .eq("id", acct.competition_id)
      .single();
    const daily = data.daily_loss_pct ?? Number(acct.daily_loss_pct);
    if (status === "active") {
      if (daily >= Number(comp!.daily_drawdown_pct)) {
        status = "breached";
        disqualified_reason = `Daily drawdown ${daily.toFixed(2)}% exceeded ${comp!.daily_drawdown_pct}%`;
      } else if (max_drawdown_pct >= Number(comp!.max_drawdown_pct)) {
        status = "breached";
        disqualified_reason = `Max drawdown ${max_drawdown_pct.toFixed(2)}% exceeded ${comp!.max_drawdown_pct}%`;
      }
    }

    const { error } = await supabaseAdmin
      .from("competition_accounts")
      .update({
        current_equity: equity,
        current_balance: balance,
        peak_equity: peak,
        profit_usd,
        profit_pct,
        daily_loss_pct: daily,
        max_drawdown_pct,
        trades_count: data.trades_count ?? acct.trades_count,
        win_rate: data.win_rate ?? acct.win_rate,
        status,
        disqualified_reason,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", data.accountId);
    if (error) throw new Error(error.message);

    if (status === "breached" && acct.status === "active") {
      try {
        const { data: prof } = await supabaseAdmin
          .from("profiles").select("email,full_name").eq("id", acct.user_id).maybeSingle();
        if (prof?.email) {
          const { enqueueTransactionalEmail } = await import("@/lib/email/send-transactional.server");
          await enqueueTransactionalEmail({
            templateName: "competition-breached",
            recipientEmail: prof.email,
            idempotencyKey: `comp-breach-${acct.id}`,
            templateData: {
              customerName: prof.full_name || "Trader",
              accountLogin: acct.account_login,
              reason: disqualified_reason,
            },
          });
        }
      } catch (e) { console.error("breach email failed", e); }
    }
    return { ok: true, status };
  });

export const adminDisqualifyParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { accountId: string; reason: string }) =>
    z.object({ accountId: z.string().uuid(), reason: z.string().min(1).max(500) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("competition_accounts")
      .update({ status: "disqualified", disqualified_reason: data.reason })
      .eq("id", data.accountId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRemoveParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { accountId: string }) => z.object({ accountId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("competition_accounts").delete().eq("id", data.accountId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAnnounceWinners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { competitionId: string }) => z.object({ competitionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: comp } = await supabaseAdmin.from("competitions").select("*").eq("id", data.competitionId).single();
    if (!comp) throw new Error("Competition not found");

    const { data: rows } = await supabaseAdmin
      .from("competition_accounts")
      .select("*")
      .eq("competition_id", data.competitionId);
    const sorted = computeRanking(rows ?? []).slice(0, 3);
    const amounts = [Number(comp.prize_1), Number(comp.prize_2), Number(comp.prize_3)];

    for (let i = 0; i < sorted.length; i++) {
      const w = sorted[i];
      await supabaseAdmin
        .from("competition_prizes")
        .upsert(
          {
            competition_id: data.competitionId,
            account_id: w.id,
            user_id: w.user_id,
            rank: i + 1,
            amount: amounts[i],
            status: "pending",
          },
          { onConflict: "competition_id,rank" },
        );
      try {
        const { data: prof } = await supabaseAdmin
          .from("profiles").select("email,full_name").eq("id", w.user_id).maybeSingle();
        if (prof?.email) {
          const { enqueueTransactionalEmail } = await import("@/lib/email/send-transactional.server");
          await enqueueTransactionalEmail({
            templateName: "competition-winner",
            recipientEmail: prof.email,
            idempotencyKey: `comp-winner-${data.competitionId}-${i + 1}`,
            templateData: {
              customerName: prof.full_name || "Trader",
              competitionName: comp.name,
              rank: i + 1,
              prizeAmount: `$${amounts[i].toLocaleString()}`,
              profitPct: `${Number(w.profit_pct).toFixed(2)}%`,
            },
          });
        }
      } catch (e) { console.error("winner email failed", e); }
    }

    await supabaseAdmin
      .from("competitions")
      .update({ status: "ended", winners_announced_at: new Date().toISOString() })
      .eq("id", data.competitionId);

    return { ok: true, winners: sorted.length };
  });

export const adminListPrizes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prizes } = await supabaseAdmin
      .from("competition_prizes")
      .select("*")
      .order("created_at", { ascending: false });
    const userIds = [...new Set((prizes ?? []).map((p) => p.user_id))];
    const compIds = [...new Set((prizes ?? []).map((p) => p.competition_id))];
    const [{ data: profiles }, { data: comps }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,full_name,email")
        .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
      supabaseAdmin.from("competitions").select("id,name").in("id", compIds.length ? compIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);
    const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const cmap = new Map((comps ?? []).map((c: any) => [c.id, c]));
    return (prizes ?? []).map((p: any) => ({
      ...p,
      profile: pmap.get(p.user_id) ?? null,
      competition: cmap.get(p.competition_id) ?? null,
    }));
  });

export const adminSetPrizeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prizeId: string; status: "pending" | "approved" | "paid" }) =>
    z.object({ prizeId: z.string().uuid(), status: z.enum(["pending", "approved", "paid"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = { status: data.status };
    if (data.status === "paid") patch.paid_at = new Date().toISOString();
    const { error } = await supabaseAdmin.from("competition_prizes").update(patch).eq("id", data.prizeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
