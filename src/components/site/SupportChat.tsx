import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, X, Send, Bot, Headset, ChevronLeft } from "lucide-react";
import {
  getOrCreateConversation,
  setConversationMode,
  sendVisitorMessage,
  getConversationMessages,
  leaveOfflineMessage,
  getAgentAvailability,
} from "@/lib/chat.functions";
import { CHAT_I18N, CHAT_LANG_LABELS, type ChatLang } from "@/lib/chat-i18n";

type Msg = { id: string; sender_type: string; content: string; created_at: string };
type Step = "lang" | "mode" | "chat" | "offline";

const VISITOR_KEY = "trfx_chat_visitor_id";
const CONV_KEY = "trfx_chat_conv_id";
const LANG_KEY = "trfx_chat_lang";

function ensureVisitorId(): string {
  if (typeof window === "undefined") return "";
  let v = localStorage.getItem(VISITOR_KEY);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, v);
  }
  return v;
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("lang");
  const [lang, setLang] = useState<ChatLang>("en");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [convStatus, setConvStatus] = useState<string>("open");
  const [convMode, setConvMode] = useState<string>("ai");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agentsOnline, setAgentsOnline] = useState(false);
  const [offlineForm, setOfflineForm] = useState({ email: "", name: "", content: "" });
  const [offlineSent, setOfflineSent] = useState(false);
  const visitorIdRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const create = useServerFn(getOrCreateConversation);
  const setMode = useServerFn(setConversationMode);
  const sendMsg = useServerFn(sendVisitorMessage);
  const fetchMsgs = useServerFn(getConversationMessages);
  const offline = useServerFn(leaveOfflineMessage);
  const availability = useServerFn(getAgentAvailability);

  const t = CHAT_I18N[lang];
  const isRtl = lang === "ur";

  // Init visitor + restore lang
  useEffect(() => {
    visitorIdRef.current = ensureVisitorId();
    const saved = localStorage.getItem(LANG_KEY) as ChatLang | null;
    if (saved && CHAT_I18N[saved]) {
      setLang(saved);
      setStep("mode");
    }
    const cid = localStorage.getItem(CONV_KEY);
    if (cid) setConversationId(cid);
  }, []);

  // Check availability when opened
  useEffect(() => {
    if (!open) return;
    availability({}).then((r: any) => setAgentsOnline(r.online)).catch(() => {});
  }, [open]);

  // Poll messages
  useEffect(() => {
    if (!open || !conversationId || step !== "chat") return;
    let stopped = false;
    const tick = async () => {
      try {
        const r: any = await fetchMsgs({
          data: { visitorId: visitorIdRef.current, conversationId },
        });
        if (stopped) return;
        setMessages(r.messages);
        setConvStatus(r.conversation.status);
        setConvMode(r.conversation.mode);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [open, conversationId, step]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function pickLang(l: ChatLang) {
    setLang(l);
    localStorage.setItem(LANG_KEY, l);
    setStep("mode");
    try {
      const r: any = await create({ data: { visitorId: visitorIdRef.current, language: l } });
      setConversationId(r.conversation.id);
      localStorage.setItem(CONV_KEY, r.conversation.id);
      setConvMode(r.conversation.mode);
      setConvStatus(r.conversation.status);
    } catch {}
  }

  async function pickMode(mode: "ai" | "agent") {
    if (!conversationId) {
      const r: any = await create({ data: { visitorId: visitorIdRef.current, language: lang } });
      setConversationId(r.conversation.id);
      localStorage.setItem(CONV_KEY, r.conversation.id);
    }
    const cid = conversationId ?? localStorage.getItem(CONV_KEY);
    if (!cid) return;

    if (mode === "agent") {
      const a: any = await availability({}).catch(() => ({ online: false }));
      setAgentsOnline(a.online);
      if (!a.online) {
        await setMode({ data: { visitorId: visitorIdRef.current, conversationId: cid, mode: "agent" } }).catch(() => {});
        setStep("offline");
        return;
      }
    }
    await setMode({ data: { visitorId: visitorIdRef.current, conversationId: cid, mode } }).catch(() => {});
    setConvMode(mode);
    setStep("chat");
  }

  async function send() {
    const text = input.trim();
    if (!text || !conversationId || sending) return;
    setSending(true);
    const optimistic: Msg = {
      id: "tmp-" + Date.now(),
      sender_type: "visitor",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setInput("");
    try {
      await sendMsg({
        data: { visitorId: visitorIdRef.current, conversationId, content: text },
      });
    } catch {}
    setSending(false);
  }

  async function submitOffline() {
    if (!conversationId || !offlineForm.email || !offlineForm.content) return;
    try {
      await offline({
        data: {
          visitorId: visitorIdRef.current,
          conversationId,
          email: offlineForm.email,
          name: offlineForm.name || undefined,
          content: offlineForm.content,
        },
      });
      setOfflineSent(true);
    } catch {}
  }

  function reset() {
    setStep("lang");
    setMessages([]);
    setOfflineSent(false);
    setOfflineForm({ email: "", name: "", content: "" });
    localStorage.removeItem(LANG_KEY);
    localStorage.removeItem(CONV_KEY);
    setConversationId(null);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open support chat"
          className="fixed bottom-5 right-5 z-50 size-14 rounded-full bg-gold-gradient text-primary-foreground shadow-lg grid place-items-center hover:scale-105 transition-transform"
        >
          <MessageCircle className="size-6" />
        </button>
      )}

      {open && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm h-[32rem] max-h-[calc(100vh-3rem)] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gold-gradient text-primary-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step !== "lang" && (
                <button onClick={reset} aria-label="Restart" className="hover:opacity-80">
                  <ChevronLeft className="size-4" />
                </button>
              )}
              <div>
                <div className="font-semibold text-sm">{t.title}</div>
                <div className="text-[10px] opacity-80">Trade Rise FX</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" ref={scrollRef}>
            {step === "lang" && (
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">{t.welcome}</p>
                <p className="text-sm font-medium">{t.pickLanguage}</p>
                <div className="space-y-2">
                  {(Object.keys(CHAT_LANG_LABELS) as ChatLang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => pickLang(l)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-gold hover:bg-accent transition-colors text-sm font-medium"
                    >
                      {CHAT_LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "mode" && (
              <div className="p-4 space-y-3">
                <p className="text-sm font-medium">{t.pickMode}</p>
                <button
                  onClick={() => pickMode("ai")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-gold hover:bg-accent transition-colors text-sm font-medium"
                >
                  <Bot className="size-5 text-gold" />
                  {t.chatWithAi}
                </button>
                <button
                  onClick={() => pickMode("agent")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-gold hover:bg-accent transition-colors text-sm font-medium"
                >
                  <Headset className="size-5 text-gold" />
                  {t.chatWithAgent}
                </button>
              </div>
            )}

            {step === "chat" && (
              <div className="p-3 space-y-2">
                {convMode === "agent" && convStatus === "pending_agent" && (
                  <div className="text-xs text-center text-muted-foreground py-2">
                    {t.waitingAgent}
                  </div>
                )}
                {messages.map((m) => (
                  <MessageBubble key={m.id} m={m} />
                ))}
                {convStatus === "closed" && (
                  <div className="text-xs text-center text-muted-foreground py-2">
                    {t.closedByAgent}
                  </div>
                )}
              </div>
            )}

            {step === "offline" && (
              <div className="p-4 space-y-3">
                {!offlineSent ? (
                  <>
                    <p className="text-sm font-medium">{t.noAgentsTitle}</p>
                    <p className="text-xs text-muted-foreground">{t.noAgentsBody}</p>
                    <input
                      type="email"
                      placeholder={t.yourEmail}
                      value={offlineForm.email}
                      onChange={(e) => setOfflineForm({ ...offlineForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                    />
                    <input
                      type="text"
                      placeholder={t.yourName}
                      value={offlineForm.name}
                      onChange={(e) => setOfflineForm({ ...offlineForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                    />
                    <textarea
                      rows={4}
                      placeholder={t.yourMessage}
                      value={offlineForm.content}
                      onChange={(e) => setOfflineForm({ ...offlineForm, content: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background resize-none"
                    />
                    <button
                      onClick={submitOffline}
                      disabled={!offlineForm.email || !offlineForm.content}
                      className="w-full py-2 rounded-md bg-gold-gradient text-primary-foreground text-sm font-medium disabled:opacity-50"
                    >
                      {t.submit}
                    </button>
                    <button
                      onClick={() => pickMode("ai")}
                      className="w-full py-2 rounded-md border border-border text-sm hover:bg-accent"
                    >
                      {t.continueAi}
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-center py-6">{t.thanks}</p>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          {step === "chat" && convStatus !== "closed" && (
            <div className="p-2 border-t border-border flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={t.inputPlaceholder}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="size-9 grid place-items-center rounded-md bg-gold-gradient text-primary-foreground disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function MessageBubble({ m }: { m: Msg }) {
  const isVisitor = m.sender_type === "visitor";
  const isSystem = m.sender_type === "system";
  if (isSystem) {
    return (
      <div className="text-[11px] text-center text-muted-foreground py-1 italic">{m.content}</div>
    );
  }
  return (
    <div className={`flex ${isVisitor ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
          isVisitor
            ? "bg-gold-gradient text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {m.sender_type === "ai" && (
          <div className="text-[10px] opacity-70 mb-0.5 flex items-center gap-1">
            <Bot className="size-3" /> AI
          </div>
        )}
        {m.sender_type === "agent" && (
          <div className="text-[10px] opacity-70 mb-0.5 flex items-center gap-1">
            <Headset className="size-3" /> Agent
          </div>
        )}
        {m.content}
      </div>
    </div>
  );
}
