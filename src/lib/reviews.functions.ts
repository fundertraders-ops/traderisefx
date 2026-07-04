import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const submitSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(2000),
});

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("reviews")
      .insert({
        user_id: userId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, title, content, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { reviews: data ?? [] };
  });

export const listPublicReviews = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("id, rating, title, content, created_at, user_id")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    let nameMap = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      nameMap = new Map((profs ?? []).map((p) => [p.id, p.full_name || "Member"]));
    }
    return {
      reviews: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        created_at: r.created_at,
        reviewer_name: nameMap.get(r.user_id) || "Member",
      })),
    };
  }
);

const listAdminSchema = z
  .object({
    status: z.enum(["all", "pending", "approved", "rejected"]).optional(),
  })
  .optional();

export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listAdminSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    let q = supabase
      .from("reviews")
      .select(
        "id, user_id, rating, title, content, status, moderation_notes, created_at, moderated_at"
      )
      .order("created_at", { ascending: false })
      .limit(300);
    const status = data?.status ?? "all";
    if (status !== "all") q = q.eq("status", status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    let emailMap = new Map<string, string>();
    let nameMap = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", ids);
      emailMap = new Map((profs ?? []).map((p) => [p.id, p.email || ""]));
      nameMap = new Map((profs ?? []).map((p) => [p.id, p.full_name || ""]));
    }
    return {
      reviews: (rows ?? []).map((r) => ({
        ...r,
        reviewer_email: emailMap.get(r.user_id) || "",
        reviewer_name: nameMap.get(r.user_id) || "",
      })),
    };
  });

const moderateSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const moderateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => moderateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase
      .from("reviews")
      .update({
        status: data.action === "approve" ? "approved" : "rejected",
        moderation_notes: data.notes ?? null,
        moderated_at: new Date().toISOString(),
        moderated_by: userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const deleteSchema = z.object({ id: z.string().uuid() });

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
