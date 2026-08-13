import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Send, User, Sparkles, Copy, MessageSquarePlus, Trash2, Brain, Zap, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/markdown";
import { ThinkingDots } from "@/components/thinking-dots";
import { SynapseLogo } from "@/components/synapse-logo";
import {
  sendMessage,
  listConversations,
  getConversation,
  deleteConversation,
} from "@/lib/synapse.functions";

type Mode = "socratic" | "direct" | "revision";
type Msg = { id?: string; role: "user" | "assistant"; content: string; confidence?: number | null };

const MODE_META: Record<Mode, { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }> = {
  socratic: { label: "Socratic", desc: "Guides with questions", icon: Brain },
  direct: { label: "Direct", desc: "Clear explanations", icon: Zap },
  revision: { label: "Revision", desc: "Exam is imminent", icon: Timer },
};

const SUGGESTIONS = [
  "Explain photosynthesis like I'm 14",
  "Solve: x\u00b2 \u2212 5x + 6 = 0",
  "What's the difference between speed and velocity?",
  "Give me a scenario question on Newton's Third Law",
];

export function TutorView({ conversationId }: { conversationId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const send = useServerFn(sendMessage);
  const listFn = useServerFn(listConversations);
  const getFn = useServerFn(getConversation);
  const delFn = useServerFn(deleteConversation);

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("socratic");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [pending, setPending] = useState<Msg | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const conversations = useQuery({ queryKey: ["conversations"], queryFn: () => listFn() });
  const current = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getFn({ data: { id: conversationId! } }),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (current.data?.conversation?.mode) setMode(current.data.conversation.mode as Mode);
  }, [current.data?.conversation?.mode]);

  const messages: Msg[] = (current.data?.messages ?? []) as Msg[];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const mutation = useMutation({
    mutationFn: (payload: { content: string }) =>
      send({ data: { conversationId: conversationId ?? null, content: payload.content, mode, confidence } }),
    onMutate: (payload) => {
      setPending({ role: "user", content: payload.content, confidence });
    },
    onSuccess: (result) => {
      setPending(null);
      setInput("");
      setConfidence(null);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (!conversationId) {
        navigate({ to: "/tutor/$id", params: { id: result.conversationId } });
      } else {
        queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      }
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    onError: (e) => {
      setPending(null);
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    },
  });

  const submit = () => {
    const t = input.trim();
    if (!t || mutation.isPending) return;
    mutation.mutate({ content: t });
  };

  const empty = !conversationId && messages.length === 0 && !pending;

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-sidebar/50 md:flex md:flex-col">
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => navigate({ to: "/tutor" })}
          >
            <MessageSquarePlus className="h-4 w-4" />
            New conversation
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2 pb-3">
          <div className="space-y-1">
            {conversations.data?.map((c) => (
              <div key={c.id} className="group relative animate-slide-in-left">
                <button
                  className={`w-full truncate rounded-lg px-3 py-2 pr-8 text-left text-sm transition-all duration-200 hover:translate-x-0.5 hover:bg-accent ${
                    c.id === conversationId ? "bg-gradient-brand-soft font-medium ring-glow" : ""
                  }`}
                  onClick={() => navigate({ to: "/tutor/$id", params: { id: c.id } })}
                >
                  {c.title}
                </button>
                <button
                  aria-label="Delete conversation"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  onClick={async () => {
                    await delFn({ data: { id: c.id } });
                    queryClient.invalidateQueries({ queryKey: ["conversations"] });
                    if (c.id === conversationId) navigate({ to: "/tutor" });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {conversations.data?.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No conversations yet.</p>
            )}
          </div>
        </ScrollArea>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border/60 bg-background/70 px-4 py-2 backdrop-blur">
          {(Object.keys(MODE_META) as Mode[]).map((k) => {
            const M = MODE_META[k];
            const active = mode === k;
            return (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all duration-300 hover:-translate-y-0.5 ${
                  active
                    ? "animate-pop border-primary bg-gradient-brand text-white shadow-glow"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <M.icon className="h-3 w-3" /> {M.label}
              </button>
            );
          })}
          <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">{MODE_META[mode].desc}</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {empty ? (
              <EmptyState mode={mode} onPick={(s) => { setInput(s); inputRef.current?.focus(); }} />
            ) : (
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <MessageBubble key={m.id ?? i} msg={m} index={i} />
                ))}
                {pending && <MessageBubble msg={pending} />}
                {mutation.isPending && (
                  <div className="flex items-start gap-3 animate-fade-in-up">
                    <div className="animate-pulse-glow"><SynapseLogo size={32} /></div>
                    <div className="rounded-2xl bg-muted/60 px-4 py-3"><ThinkingDots /></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <div className="flex-1 max-w-[200px]">
                <Slider
                  value={[confidence ?? 3]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(v) => setConfidence(v[0])}
                />
              </div>
              <span className="w-8 text-xs font-medium">{confidence ?? "\u2014"}/5</span>
              {confidence !== null && (
                <Badge variant="secondary" className="text-[10px]">
                  {confidence <= 2 ? "I'll go slower" : confidence >= 4 ? "I'll push harder" : "balanced"}
                </Badge>
              )}
            </div>
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Ask anything \u2014 I'll think with you, not for you..."
                className="min-h-[60px] resize-none pr-14"
              />
              <Button
                size="icon"
                onClick={submit}
                disabled={mutation.isPending || !input.trim()}
                className="absolute bottom-2 right-2 h-9 w-9 bg-gradient-brand text-white shadow-glow"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">Synapse asks before it answers. Try a low confidence for simpler explanations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, index = 0 }: { msg: Msg; index?: number }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse animate-slide-in-right" : "animate-slide-in-left"}`}
    >
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <User className="h-4 w-4" />
        </div>
      ) : (
        <SynapseLogo size={32} />
      )}
      <div className={`group max-w-[85%] ${isUser ? "text-right" : ""}`}>
        {isUser ? (
          <div className="inline-block rounded-2xl bg-gradient-brand px-4 py-2.5 text-left text-primary-foreground shadow-glow transition-shadow duration-300">
            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            {msg.confidence != null && (
              <span className="ml-2 text-[10px] opacity-70">confidence {msg.confidence}/5</span>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-muted/50 px-4 py-3 transition-colors duration-300 hover:bg-muted/70">
            <Markdown>{msg.content}</Markdown>
            <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                aria-label="Copy"
                onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied"); }}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ mode, onPick }: { mode: Mode; onPick: (s: string) => void }) {
  return (
    <div className="mx-auto max-w-2xl py-12 text-center animate-fade-in-up">
      <div className="mx-auto mb-4"><SynapseLogo size={64} className="mx-auto" /></div>
      <h2 className="text-2xl font-bold tracking-tight">What are we thinking about today?</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        I'll guide you with questions in <span className="font-medium text-foreground">{MODE_META[mode].label}</span> mode. Change mode above anytime.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="glass animate-scale-in rounded-xl p-3 text-left text-sm hover-lift hover:shadow-glow"
          >
            <Sparkles className="mb-1 h-3.5 w-3.5 text-primary" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
