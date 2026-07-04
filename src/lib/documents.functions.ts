import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "generated-documents";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const generateDocumentationPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildDocumentationPdf } = await import("./documents.server");

    const generatedAt = new Date();
    const { bytes, pageCount } = await buildDocumentationPdf({ generatedAt });

    const stamp = generatedAt.toISOString().replace(/[:.]/g, "-");
    const path = `documentation/${stamp}.pdf`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw new Error(upErr.message);

    const title = `Trade Rise FX Documentation — ${generatedAt.toUTCString()}`;

    const { data: row, error: insErr } = await supabaseAdmin
      .from("generated_documents")
      .insert({
        title,
        storage_path: path,
        size_bytes: bytes.byteLength,
        page_count: pageCount,
        generated_by: userId,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    const { data: signed } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60);

    return { document: row, signedUrl: signed?.signedUrl ?? null };
  });

export const listGeneratedDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("generated_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const docs = await Promise.all(
      (data ?? []).map(async (d: any) => {
        const { data: signed } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(d.storage_path, 60 * 60);
        return { ...d, signedUrl: signed?.signedUrl ?? null };
      }),
    );

    return { documents: docs };
  });

const idSchema = z.object({ id: z.string().uuid() });

export const deleteGeneratedDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: doc, error: getErr } = await supabaseAdmin
      .from("generated_documents")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!doc) throw new Error("Document not found");

    await supabaseAdmin.storage.from(BUCKET).remove([doc.storage_path]);

    const { error: delErr } = await supabaseAdmin
      .from("generated_documents")
      .delete()
      .eq("id", data.id);
    if (delErr) throw new Error(delErr.message);

    return { ok: true };
  });
