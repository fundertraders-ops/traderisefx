import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM_PROMPT_EN = `You are the AI support assistant for Trade Rise FX, a prop trading firm offering instant funded accounts and challenge-based accounts.

Key facts:
- Account types: Instant Funded Accounts and Challenge Accounts (1-step / 2-step).
- Trading rules: Instant Funded Accounts require a 2-minute minimum hold time per trade. Trades closed before 2 minutes are not valid for compliance. Fee-based challenge accounts are exempt from this hold rule.
- Payouts: One-Step accounts use a 21-day cycle; Two-Step and Instant Funded accounts use a 14-day cycle from activation. Withdrawals are processed via the dashboard.
- Payments: crypto and other supported networks; eligible accounts activate automatically after submission.
- Challenges: pass profit target while respecting drawdown rules to get funded.
- Affiliate: 10% commission for referrals.
- Support email: fxtradersrise@gmail.com.

Reply in the same language the user wrote in (English, Urdu, or Hindi). Be concise, friendly, and accurate. If you cannot resolve a question, tell the user they can type "agent" to be transferred to a live human support agent.`;

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAccess(supabase: any, userId: string) {
  const [{ data: a }, { data: s }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "support_agent" }),
  ]);
  if (!a && !s) throw new Error("Forbidden");
}

// ---------- VISITOR (public) ----------

const visitorIdSchema = z.string().trim().min(8).max(80);

export const getOrCreateConversation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      visitorId: visitorIdSchema,
      language: z.enum(["en", "ur", "hi"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const { data: existing } = await admin
      .from("chat_conversations")
      .select("*")
      .eq("visitor_id", data.visitorId)
      .neq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (data.language && existing.language !== data.language) {
        await admin.from("chat_conversations").update({ language: data.language }).eq("id", existing.id);
        existing.language = data.language;
      }
      return { conversation: existing };
    }

    const { data: created, error } = await admin
      .from("chat_conversations")
      .insert({ visitor_id: data.visitorId, language: data.language ?? "en" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { conversation: created };
  });

export const setConversationMode = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      visitorId: visitorIdSchema,
      conversationId: z.string().uuid(),
      mode: z.enum(["ai", "agent"]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const { data: conv } = await admin
      .from("chat_conversations")
      .select("id, visitor_id, status")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!conv || conv.visitor_id !== data.visitorId) throw new Error("Not found");

    const patch: any = { mode: data.mode };
    if (data.mode === "agent" && conv.status === "open") patch.status = "pending_agent";
    patch.unread_for_agent = data.mode === "agent";
    await admin.from("chat_conversations").update(patch).eq("id", data.conversationId);

    await admin.from("chat_messages").insert({
      conversation_id: data.conversationId,
      sender_type: "system",
      content: data.mode === "agent" ? "Visitor requested a live agent." : "Visitor switched to AI assistant.",
    });
    return { ok: true };
  });

export const sendVisitorMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      visitorId: visitorIdSchema,
      conversationId: z.string().uuid(),
      content: z.string().trim().min(1).max(4000),
      name: z.string().trim().max(120).optional(),
      email: z.string().trim().email().max(200).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const { data: conv } = await admin
      .from("chat_conversations")
      .select("*")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!conv || conv.visitor_id !== data.visitorId) throw new Error("Not found");

    await admin.from("chat_messages").insert({
      conversation_id: conv.id,
      sender_type: "visitor",
      content: data.content,
    });

    const patch: any = {
      last_message_at: new Date().toISOString(),
      unread_for_agent: true,
      unread_for_visitor: false,
    };
    if (data.name && !conv.visitor_name) patch.visitor_name = data.name;
    if (data.email && !conv.visitor_email) patch.visitor_email = data.email;
    await admin.from("chat_conversations").update(patch).eq("id", conv.id);

    let aiReply: string | null = null;
    if (conv.mode === "ai") {
      const lower = data.content.toLowerCase();
      if (/(live agent|talk to agent|human|^agent$|connect.*agent)/.test(lower)) {
        await admin
          .from("chat_conversations")
          .update({ mode: "agent", status: "pending_agent", unread_for_agent: true })
          .eq("id", conv.id);
        await admin.from("chat_messages").insert({
          conversation_id: conv.id,
          sender_type: "system",
          content: "Transferring to a live agent...",
        });
      } else {
        aiReply = await runAiBot(conv.id, conv.language);
      }
    }

    return { ok: true, aiReply };
  });

async function runAiBot(conversationId: string, language: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return "AI is temporarily unavailable. Please try again later or request a live agent.";

  const admin = await getAdmin();
  const { data: msgs } = await admin
    .from("chat_messages")
    .select("sender_type, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(30);

  const { generateText } = await import("ai");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(key);

  const langNote =
    language === "ur"
      ? " Reply in Urdu."
      : language === "hi"
        ? " Reply in Hindi."
        : " Reply in English.";

  try {
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: SYSTEM_PROMPT_EN + langNote,
      messages: (msgs ?? []).map((m) => ({
        role: m.sender_type === "visitor" ? "user" : "assistant",
        content: m.content,
      })) as any,
    });
    const reply = text?.trim() || "I'm not sure — type 'agent' to talk to a live person.";
    await admin.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_type: "ai",
      content: reply,
    });
    await admin
      .from("chat_conversations")
      .update({ last_message_at: new Date().toISOString(), unread_for_visitor: true })
      .eq("id", conversationId);
    return reply;
  } catch (e: any) {
    const msg = "AI is temporarily unavailable. Type 'agent' to talk to a human.";
    await admin.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_type: "system",
      content: msg,
    });
    return msg;
  }
}

export const getConversationMessages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      visitorId: visitorIdSchema,
      conversationId: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const { data: conv } = await admin
      .from("chat_conversations")
      .select("*")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!conv || conv.visitor_id !== data.visitorId) throw new Error("Not found");

    const { data: messages } = await admin
      .from("chat_messages")
      .select("id, sender_type, content, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    if (conv.unread_for_visitor) {
      await admin.from("chat_conversations").update({ unread_for_visitor: false }).eq("id", conv.id);
    }

    return { conversation: conv, messages: messages ?? [] };
  });

export const leaveOfflineMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      visitorId: visitorIdSchema,
      conversationId: z.string().uuid(),
      email: z.string().trim().email().max(200),
      name: z.string().trim().max(120).optional(),
      content: z.string().trim().min(1).max(4000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const { data: conv } = await admin
      .from("chat_conversations")
      .select("id, visitor_id")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!conv || conv.visitor_id !== data.visitorId) throw new Error("Not found");

    await admin.from("chat_messages").insert({
      conversation_id: conv.id,
      sender_type: "visitor",
      content: `[Offline message] ${data.content}`,
    });
    await admin
      .from("chat_conversations")
      .update({
        visitor_email: data.email,
        visitor_name: data.name ?? null,
        status: "pending_agent",
        mode: "agent",
        unread_for_agent: true,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conv.id);
    return { ok: true };
  });

export const getAgentAvailability = createServerFn({ method: "GET" })
  .handler(async () => {
    const admin = await getAdmin();
    const { count } = await admin
      .from("agent_status")
      .select("*", { count: "exact", head: true })
      .eq("status", "online");
    return { online: (count ?? 0) > 0 };
  });

// ---------- ADMIN / AGENT ----------

export const adminListConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAccess(supabase, userId);
    const admin = await getAdmin();
    const { data, error } = await admin
      .from("chat_conversations")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { conversations: data ?? [] };
  });

export const adminGetConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAccess(supabase, userId);
    const admin = await getAdmin();
    const [{ data: conv }, { data: messages }] = await Promise.all([
      admin.from("chat_conversations").select("*").eq("id", data.id).maybeSingle(),
      admin
        .from("chat_messages")
        .select("id, sender_type, content, created_at")
        .eq("conversation_id", data.id)
        .order("created_at", { ascending: true }),
    ]);
    if (conv?.unread_for_agent) {
      await admin.from("chat_conversations").update({ unread_for_agent: false }).eq("id", data.id);
    }
    return { conversation: conv, messages: messages ?? [] };
  });

export const adminSendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      content: z.string().trim().min(1).max(4000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAccess(supabase, userId);
    const admin = await getAdmin();
    await admin.from("chat_messages").insert({
      conversation_id: data.id,
      sender_type: "agent",
      sender_id: userId,
      content: data.content,
    });
    await admin
      .from("chat_conversations")
      .update({
        status: "active",
        mode: "agent",
        assigned_agent_id: userId,
        last_message_at: new Date().toISOString(),
        unread_for_visitor: true,
        unread_for_agent: false,
      })
      .eq("id", data.id);
    return { ok: true };
  });

export const adminCloseConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAccess(supabase, userId);
    const admin = await getAdmin();
    await admin.from("chat_conversations").update({ status: "closed" }).eq("id", data.id);
    await admin.from("chat_messages").insert({
      conversation_id: data.id,
      sender_type: "system",
      content: "Conversation closed by agent.",
    });
    return { ok: true };
  });

export const setMyAgentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ status: z.enum(["online", "offline", "busy"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAccess(supabase, userId);
    const admin = await getAdmin();
    await admin
      .from("agent_status")
      .upsert({ user_id: userId, status: data.status, updated_at: new Date().toISOString() });
    return { ok: true };
  });

export const getMyAgentStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAccess(supabase, userId);
    const admin = await getAdmin();
    const { data } = await admin.from("agent_status").select("status").eq("user_id", userId).maybeSingle();
    return { status: (data?.status as "online" | "offline" | "busy") ?? "offline" };
  });

export const listAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAccess(supabase, userId);
    const admin = await getAdmin();
    const { data: statuses } = await admin
      .from("agent_status")
      .select("user_id, status, updated_at")
      .order("updated_at", { ascending: false });
    const ids = (statuses ?? []).map((s: any) => s.user_id);
    let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (ids.length) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      (profiles ?? []).forEach((p: any) => profileMap.set(p.id, { full_name: p.full_name, email: p.email }));
    }
    return {
      agents: (statuses ?? []).map((s: any) => ({
        user_id: s.user_id,
        status: s.status as "online" | "offline" | "busy",
        updated_at: s.updated_at,
        name: profileMap.get(s.user_id)?.full_name ?? null,
        email: profileMap.get(s.user_id)?.email ?? null,
      })),
    };
  });

