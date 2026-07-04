import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// Public helper for the checkout page (requires auth so we know who's redeeming).
const validateSchema = z.object({
  code: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_\-]+$/),
});

export const validatePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => validateSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim();
    const { data: row, error } = await supabaseAdmin
      .from("promo_codes" as any)
      .select("code, discount_percent, created_by, active")
      .ilike("code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { valid: false as const, reason: "Invalid promo code" };
    const r = row as any;
    if (!r.active) return { valid: false as const, reason: "Promo code is not active" };
    return {
      valid: true as const,
      code: r.code as string,
      discountPercent: Number(r.discount_percent),
      createdBy: (r.created_by as string | null) ?? null,
    };
  });

// Admin: list all promo codes
export const listPromoCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("promo_codes" as any)
      .select("id, code, discount_percent, created_by, active, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as any[] };
  });

const upsertSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  code: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_\-]+$/),
  discount_percent: z.number().min(0).max(100),
  created_by: z.string().trim().max(120).nullable().optional(),
  active: z.boolean(),
});

export const upsertPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: any = {
      code: data.code.trim(),
      discount_percent: data.discount_percent,
      created_by: data.created_by?.trim() || null,
      active: data.active,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("promo_codes" as any).update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("promo_codes" as any).insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const deleteSchema = z.object({ id: z.string().uuid() });
export const deletePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("promo_codes" as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
