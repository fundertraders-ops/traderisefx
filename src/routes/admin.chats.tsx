import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send, X, CircleDot, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  adminListConversations,
  adminGetConversation,
  adminSendMessage,
  adminCloseConversation,
  setMyAgentStatus,
  getMyAgentStatus,
  listAgents,
} from "@/lib/chat.functions";

export const Route = createFileRoute("/admin/chats")({
  component: AdminChatsPage,
});

function playPing() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.3);
  } catch {
    /* no-op */
  }
}

function AdminChatsPage() {
  const list = useServerFn(adminListConversations);
  const getOne = useServerFn(adminGetConversation);
  const send = useServerFn(adminSendMessage);
  const close = useServerFn(adminCloseConversation);
  const setStatus = useServerFn(setMyAgentStatus);
  const getStatus = useServerFn(getMyAgentStatus);
  const agentsFn = useServerFn(listAgents);
  const qc = useQueryClient();

  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "pending_agent" | "active" | "closed">("all");
  const [reply, setReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);

  const conversations = useQuery({
    queryKey: ["admin-chats"],
    queryFn: () => list({}) as any,
    refetchInterval: 2000,
  });

  const myStatus = useQuery({
    queryKey: ["my-agent-status"],
    queryFn: () => getStatus({}) as any,
  });

  const agents = useQuery({
    queryKey: ["admin-agents"],
    queryFn: () => agentsFn({}) as any,
    refetchInterval: 5000,
  });

  const detail = useQuery({
    queryKey: ["admin-chat-detail", selected],
    queryFn: () => (selected ? (getOne({ data: { id: selected } }) as any) : null),
    enabled: !!selected,
    refetchInterval: selected ? 2000 : false,
  });

  const sendMut = useMutation({
    mutationFn: (content: string) => send({ data: { id: selected!, content } }) as any,
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["admin-chat-detail", selected] });
      qc.invalidateQueries({ queryKey: ["admin-chats"] });
    },
  });

  const closeMut = useMutation({
    mutationFn: () => close({ data: { id: selected! } }) as any,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-chat-detail", selected] });
      qc.invalidateQueries({ queryKey: ["admin-chats"] });
    },
  });

  const statusMut = useMutation({
    mutationFn: (status: "online" | "offline" | "busy") => setStatus({ data: { status } }) as any,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-agent-status"] }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [detail.data]);

  const convs = (conversations.data?.conversations ?? []) as any[];

  // Toast + ping when new conversations or unread messages arrive.
  useEffect(() => {
    if (!convs.length && knownIdsRef.current === null) {
      knownIdsRef.current = new Set();
      return;
    }
    if (knownIdsRef.current === null) {
      knownIdsRef.current = new Set(convs.map((c) => `${c.id}:${c.last_message_at}:${c.unread_for_agent ? 1 : 0}`));
      return;
    }
    const prev = knownIdsRef.current;
    const next = new Set<string>();
    let newConv = 0;
    let newMsg = 0;
    for (const c of convs) {
      const key = `${c.id}:${c.last_message_at}:${c.unread_for_agent ? 1 : 0}`;
      next.add(key);
      if (prev.has(key)) continue;
      // Detect brand-new conversation vs updated existing one
      const wasKnown = [...prev].some((k) => k.startsWith(`${c.id}:`));
      if (!wasKnown) newConv++;
      else if (c.unread_for_agent) newMsg++;
    }
    if (newConv > 0) {
      toast.info(`${newConv} new chat${newConv > 1 ? "s" : ""} from visitor${newConv > 1 ? "s" : ""}`);
      playPing();
    } else if (newMsg > 0) {
      toast(`${newMsg} new message${newMsg > 1 ? "s" : ""}`);
      playPing();
    }
    knownIdsRef.current = next;
  }, [convs]);

  const filtered = filter === "all" ? convs : convs.filter((c) => c.status === filter);
  const pendingCount = convs.filter((c) => c.status === "pending_agent" || c.unread_for_agent).length;
  const activeCount = convs.filter((c) => c.status === "active" || c.status === "open").length;
  const agentList = (agents.data?.agents ?? []) as any[];
  const onlineAgents = agentList.filter((a) => a.status === "online");

  const statusColor: Record<string, string> = {
    online: "text-green-500",
    busy: "text-yellow-500",
    offline: "text-muted-foreground",
  };


  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
          <SidebarTrigger />
          <AdminBreadcrumb currentPage="Support Chat" />
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="px-2 py-1 rounded bg-muted">
              Pending: <strong className="text-foreground">{pendingCount}</strong>
            </span>
            <span className="px-2 py-1 rounded bg-muted">
              Active: <strong className="text-foreground">{activeCount}</strong>
            </span>
            <span className="px-2 py-1 rounded bg-muted flex items-center gap-1">
              <Users className="size-3" /> Online agents:{" "}
              <strong className="text-foreground">{onlineAgents.length}</strong>
            </span>
            <span className="text-muted-foreground">My status:</span>
            <select
              value={myStatus.data?.status ?? "offline"}
              onChange={(e) => statusMut.mutate(e.target.value as any)}
              className={`text-xs rounded-md border border-border bg-background px-2 py-1 ${statusColor[myStatus.data?.status ?? "offline"]}`}
            >
              <option value="online">Online</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </header>


        <div className="flex h-[calc(100vh-3.5rem)]">
          {/* List */}
          <div className="w-72 border-r border-border/60 flex flex-col">
            <div className="p-2 border-b border-border/60 flex gap-1 flex-wrap">
              {(["all", "open", "pending_agent", "active", "closed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 text-[11px] rounded ${
                    filter === f ? "bg-gold text-primary-foreground" : "bg-muted hover:bg-accent"
                  }`}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="p-4 text-xs text-muted-foreground">No conversations.</p>
              )}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`w-full text-left p-3 border-b border-border/40 hover:bg-accent ${
                    selected === c.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">
                      {c.visitor_name || c.visitor_email || c.visitor_id.slice(0, 8)}
                    </span>
                    {c.unread_for_agent && (
                      <CircleDot className="size-3 text-gold shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {c.status} · {c.mode} · {c.language}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(c.last_message_at).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Thread */}
          <div className="flex-1 flex flex-col">
            {!selected || !detail.data ? (
              <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
                Select a conversation
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-border/60 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {detail.data.conversation.visitor_name ||
                        detail.data.conversation.visitor_email ||
                        "Visitor"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {detail.data.conversation.visitor_email ?? "—"} · {detail.data.conversation.language} ·{" "}
                      {detail.data.conversation.status}
                    </div>
                  </div>
                  {detail.data.conversation.status !== "closed" && (
                    <button
                      onClick={() => closeMut.mutate()}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-accent flex items-center gap-1"
                    >
                      <X className="size-3" /> Close
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
                  {detail.data.messages.map((m: any) => {
                    if (m.sender_type === "system") {
                      return (
                        <div key={m.id} className="text-[11px] italic text-center text-muted-foreground">
                          {m.content}
                        </div>
                      );
                    }
                    const isAgent = m.sender_type === "agent";
                    return (
                      <div key={m.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                            isAgent
                              ? "bg-gold-gradient text-primary-foreground"
                              : m.sender_type === "ai"
                                ? "bg-blue-500/10 text-foreground"
                                : "bg-muted text-foreground"
                          }`}
                        >
                          <div className="text-[10px] opacity-70 mb-0.5 uppercase">{m.sender_type}</div>
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {detail.data.conversation.status !== "closed" && (
                  <div className="p-2 border-t border-border/60 flex gap-2">
                    <input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && reply.trim() && sendMut.mutate(reply.trim())
                      }
                      placeholder="Reply..."
                      className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
                    />
                    <button
                      onClick={() => reply.trim() && sendMut.mutate(reply.trim())}
                      disabled={!reply.trim() || sendMut.isPending}
                      className="px-3 rounded-md bg-gold-gradient text-primary-foreground disabled:opacity-50"
                    >
                      <Send className="size-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Agents */}
          <div className="w-60 border-l border-border/60 flex flex-col">
            <div className="px-3 py-2 border-b border-border/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Users className="size-3" /> Support Agents
            </div>
            <div className="flex-1 overflow-y-auto">
              {agentList.length === 0 && (
                <p className="p-4 text-xs text-muted-foreground">No agents registered yet.</p>
              )}
              {agentList.map((a) => (
                <div key={a.user_id} className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${
                      a.status === "online"
                        ? "bg-green-500"
                        : a.status === "busy"
                          ? "bg-yellow-500"
                          : "bg-muted-foreground/50"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{a.name || a.email || "Agent"}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{a.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
