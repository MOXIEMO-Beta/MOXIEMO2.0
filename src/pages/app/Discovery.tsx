import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MoxieLogo } from "@/components/MoxieLogo";
import { ArrowUp, Sparkles, CheckCircle2, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Msg = { role: "user" | "assistant"; content: string };

const SECTIONS = ["Business Foundation", "Positioning", "Voice", "Content & Channel", "Goals & Capacity"];

// Strip the hidden mode-tracking tag from assistant messages before displaying.
const MODE_TAG_RE = /\n?\[MODE:(standard|coaching|placeholder)\]\s*\[Q:\d+\]\s*$/i;
const stripModeTag = (text: string) => text.replace(MODE_TAG_RE, "").trimEnd();

export default function Discovery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [welcomeName, setWelcomeName] = useState<string>("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // progress: count assistant questions answered = number of user messages
  const answered = messages.filter((m) => m.role === "user").length;
  const progress = Math.min(100, Math.round((answered / 14) * 100));
  const currentSection = Math.min(5, Math.floor(answered / 3) + 1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const flag = searchParams.get("welcome") === "true";
    const dismissed = sessionStorage.getItem("welcome_dismissed") === "true";
    if (flag && !dismissed) {
      setShowWelcome(true);
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
        setWelcomeName((data?.full_name || "").split(" ")[0] || "");
      });
    }
  }, [user, searchParams]);

  function dismissWelcome() {
    sessionStorage.setItem("welcome_dismissed", "true");
    setShowWelcome(false);
    const next = new URLSearchParams(searchParams);
    next.delete("welcome");
    setSearchParams(next, { replace: true });
  }

  // load or start session
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("discovery_sessions").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setSessionId(data.id);
        setMessages((data.messages as Msg[]) || []);
        if (data.status === "completed") setCompleted(true);
        if (!data.messages || (data.messages as any[]).length === 0) {
          startConversation(data.id);
        }
      } else {
        const { data: created, error } = await supabase.from("discovery_sessions").insert({ user_id: user.id }).select().single();
        if (error) return toast.error(error.message);
        setSessionId(created.id);
        startConversation(created.id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function startConversation(sid: string) {
    await streamReply([], sid);
  }

  async function persist(next: Msg[], sid: string, completed = false) {
    await supabase
      .from("discovery_sessions")
      .update({ messages: next as any, status: completed ? "completed" : "in_progress", completed_at: completed ? new Date().toISOString() : null })
      .eq("id", sid);
  }

  async function streamReply(history: Msg[], sid: string) {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discovery-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: history }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limit. Please wait a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Failed to reach MOXIE.");
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: accumulated };
                return copy;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      const finalAssistant: Msg = { role: "assistant", content: accumulated };
      const newHistory = [...history, finalAssistant];
      const isComplete = accumulated.includes("<DISCOVERY_COMPLETE>");
      if (isComplete) {
        finalAssistant.content = accumulated.replace(/<DISCOVERY_COMPLETE>/g, "").trim();
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = finalAssistant;
          return copy;
        });
        setCompleted(true);
      }
      await persist(newHistory, sid, isComplete);
      if (isComplete) await synthesize(newHistory);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading || !sessionId) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    await streamReply(next, sessionId);
  }

  async function synthesize(history: Msg[]) {
    setSynthesizing(true);
    try {
      const transcript = history.map((m) => `${m.role === "user" ? "USER" : "MOXIE"}: ${m.content}`).join("\n\n");
      const { data, error } = await supabase.functions.invoke("synthesize-strategy", { body: { transcript } });
      if (error) throw error;
      if (!user) return;
      // upsert strategy
      await supabase.from("strategies").upsert({ user_id: user.id, ...data, raw_foundation: data }, { onConflict: "user_id" });
      toast.success("Your strategy is ready.");
      setTimeout(() => navigate("/app/strategy"), 1200);
    } catch (e: any) {
      toast.error("Couldn't synthesize strategy. " + (e.message || ""));
    } finally {
      setSynthesizing(false);
    }
  }

  async function restart() {
    if (!user || !sessionId) return;
    setCompleted(false);
    setMessages([]);
    await supabase
      .from("discovery_sessions")
      .update({ messages: [] as any, status: "in_progress", completed_at: null })
      .eq("id", sessionId);
    toast.success("New discovery session started", {
      description: `Session ${sessionId.slice(0, 8)} · 3-attempt coaching flow active`,
    });
    await streamReply([], sessionId);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {showWelcome && (
        <div className="border-b border-border bg-accent/5 px-6 lg:px-10 py-4">
          <div className="max-w-3xl mx-auto flex items-start gap-3">
            <span className="text-xl">🎉</span>
            <div className="flex-1">
              <p className="font-medium">Welcome to MOXIE{welcomeName ? `, ${welcomeName}` : ""}!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your account is ready. The best place to start is your marketing strategy — everything in MOXIE flows from here. Let's build it together.
              </p>
            </div>
            <button onClick={dismissWelcome} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Top progress */}
      <div className="border-b border-border bg-background px-6 lg:px-10 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">MOXIE Discovery</span>
            <span className="text-xs text-muted-foreground">Section {currentSection} of 5 — {SECTIONS[currentSection - 1]}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">{answered}/14 answered</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                  <RotateCcw className="h-3 w-3" /> Restart
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restart discovery?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This clears your current conversation and starts a fresh discovery using the latest MOXIE coaching flow. Your existing strategy (if any) won't be deleted until you complete and synthesize a new one.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={restart}>Restart discovery</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-10 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                </div>
              )}
              <div className={cn(
                "max-w-[78%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap",
                m.role === "user" ? "bg-foreground text-background" : "bg-card border border-border shadow-soft text-foreground"
              )}>
                {m.content
                  ? (m.role === "assistant" ? stripModeTag(m.content) : m.content)
                  : <span className="inline-flex items-center gap-1 text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" /> thinking…</span>}
              </div>
            </div>
          ))}
          {synthesizing && (
            <div className="flex items-center gap-3 justify-center text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Synthesizing your strategy…
            </div>
          )}
          {completed && !synthesizing && (
            <div className="flex items-center justify-center pt-4">
              <Button onClick={() => navigate("/app/strategy")} className="bg-foreground text-background hover:bg-foreground/90 h-11 rounded-lg">
                <CheckCircle2 className="mr-2 h-4 w-4 text-accent" /> View your strategy
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      {!completed && (
        <div className="border-t border-border bg-background px-4 lg:px-10 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft focus-within:border-foreground/30 transition">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={loading ? "MOXIE is responding…" : "Type your answer… (Enter to send, Shift+Enter for new line)"}
                disabled={loading}
                rows={1}
                className="resize-none border-0 bg-transparent focus-visible:ring-0 min-h-[44px] max-h-40 text-[15px]"
              />
              <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="h-9 w-9 rounded-xl bg-foreground hover:bg-foreground/90 text-background flex-shrink-0">
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">MOXIE adapts to how you answer. Be as detailed or quick as you like.</p>
          </div>
        </div>
      )}
    </div>
  );
}