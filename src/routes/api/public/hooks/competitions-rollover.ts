import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/competitions-rollover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Require service-role bearer token (sent by pg_cron) to prevent
        // unauthenticated triggering of competition rollover.
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const authHeader = request.headers.get("Authorization");
        if (!serviceKey) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (token !== serviceKey) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1. End any active comps whose ends_at has passed
        const nowIso = new Date().toISOString();
        const { data: toEnd } = await supabaseAdmin
          .from("competitions")
          .select("id,winners_announced_at,prize_1,prize_2,prize_3,name")
          .in("status", ["active", "paused"])
          .lt("ends_at", nowIso);

        for (const c of toEnd ?? []) {
          if (!c.winners_announced_at) {
            // Inline winner announcement
            const { data: rows } = await supabaseAdmin
              .from("competition_accounts").select("*").eq("competition_id", c.id);
            const sorted = [...(rows ?? [])]
              .filter((r) => r.status === "active")
              .sort((a, b) => (Number(b.profit_pct) - Number(a.profit_pct)) || (Number(a.max_drawdown_pct) - Number(b.max_drawdown_pct)))
              .slice(0, 3);
            const amounts = [Number(c.prize_1), Number(c.prize_2), Number(c.prize_3)];
            for (let i = 0; i < sorted.length; i++) {
              await supabaseAdmin.from("competition_prizes").upsert({
                competition_id: c.id, account_id: sorted[i].id, user_id: sorted[i].user_id,
                rank: i + 1, amount: amounts[i], status: "pending",
              }, { onConflict: "competition_id,rank" });
            }
          }
          await supabaseAdmin.from("competitions")
            .update({ status: "ended", winners_announced_at: c.winners_announced_at ?? new Date().toISOString() })
            .eq("id", c.id);
        }

        // 2. Ensure current month exists
        const now = new Date();
        const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - 1000);
        const monthStr = firstOfMonth.toISOString().slice(0, 10);

        const { data: existing } = await supabaseAdmin
          .from("competitions").select("id").eq("month", monthStr).maybeSingle();
        if (!existing) {
          await supabaseAdmin.from("competitions").insert({
            month: monthStr,
            name: `Monthly Trading Competition — ${firstOfMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
            starts_at: firstOfMonth.toISOString(),
            ends_at: endOfMonth.toISOString(),
            status: "active",
          });
        }

        return Response.json({ ok: true, ended: toEnd?.length ?? 0 });
      },
    },
  },
});
