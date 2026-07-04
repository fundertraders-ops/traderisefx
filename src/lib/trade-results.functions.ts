import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "trade-results";

const listSchema = z.object({
  search: z.string().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(["all", "public", "targeted"]).optional().nullable(),
}).optional();

export const listTradeResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let query = supabase
      .from("trade_results")
      .select("id, title, caption, image_path, user_id, trade_date, created_at")
      .order("trade_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);

    const filters = data ?? {};
    if (filters.search?.trim()) {
      query = query.ilike("title", `%${filters.search.trim()}%`);
    }
    if (filters.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters.tradeDate) {
      query = query.eq("trade_date", filters.tradeDate);
    }
    if (filters.status === "public") {
      query = query.is("user_id", null);
    } else if (filters.status === "targeted") {
      query = query.not("user_id", "is", null);
    }

    const { data: rowsData, error } = await query;
    if (error) throw new Error(error.message);

    const rows = rowsData ?? [];
    const signed = await Promise.all(
      rows.map(async (r) => {
        const { data: s } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(r.image_path, 60 * 60);
        return { ...r, image_url: s?.signedUrl ?? null };
      })
    );
    return { results: signed };
  });

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  caption: z.string().trim().max(500).optional().nullable(),
  imagePath: z.string().trim().min(1).max(300),
  userId: z.string().uuid().optional().nullable(),
  tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Trade date must be YYYY-MM-DD"),
});

export const createTradeResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { data: row, error } = await supabase
      .from("trade_results")
      .insert({
        title: data.title,
        caption: data.caption ?? null,
        image_path: data.imagePath,
        user_id: data.userId ?? null,
        trade_date: data.tradeDate,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const deleteSchema = z.object({ id: z.string().uuid() });

export const deleteTradeResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: row } = await supabase
      .from("trade_results")
      .select("image_path")
      .eq("id", data.id)
      .maybeSingle();

    const { error } = await supabase.from("trade_results").delete().eq("id", data.id);
    if (error) throw new Error(error.message);

    if (row?.image_path) {
      await supabase.storage.from(BUCKET).remove([row.image_path]);
    }
    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { isAdmin: !!data };
  });
