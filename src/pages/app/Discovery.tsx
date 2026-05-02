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

const SECTIONS = [
  "Business Foundation",
  "Positioning",
  "Voice",
  "Content & Channel",
  "Goals & Capacity",
  "Final Context (optional)",
];
const TOTAL_QUESTIONS = 16;
const REQUIRED_QUESTIONS = 13;

// Strip the hidden mode-tracking tag from assistant messages before displaying.
const MODE_TAG_RE = /\n?\[MODE:(standard|coaching|placeholder)\]\s*\[Q:\d+\]\s*$/i;
const stripModeTag = (text: string) => text.replace(MODE_TAG_RE, "").trimEnd();

type UserContext = { firstName?: string; role?: string; businessName?: string };

const REVENUE_OPTIONS = ["Under $100K", "$100K–$300K", "$300K–$600K", "$600K–$1M", "$1M–$2M", "$2M+"];
const CHALLENGE_OPTIONS = [
  "Getting visible to the right people",
  "Converting leads into clients",
  "Creating content consistently",
  "Clarifying my message",
  "Managing too many marketing tools",
  "Not enough time for marketing",
  "Not sure where to focus",
];

function isSkip(text: string) {
  return /^\s*skip\b/i.test(text.trim());
}

function matchOption(text: string, options: string[]): string | undefined {
  const t = text.toLowerCase().trim();
  for (const opt of options) {
    if (t.includes(opt.toLowerCase())) return opt;
  }
  return undefined;
}

// Walk the transcript: when an assistant message contains a Q14/Q15 cue,
// the next user reply (if not a skip) is the answer.
function extractOptionalAnswers(history: Msg[]): { revenueRange?: string; biggestChallenge?: string } {
  let revenueRange: string | undefined;
  let biggestChallenge: string | undefined;
  for (let i = 0; i < history.length - 1; i++) {
    const m = history[i];
    if (m.role !== "assistant") continue;
    const content = stripModeTag(m.content).toLowerCase();
    const next = history[i + 1];
    if (next?.role !== "user") continue;
    const reply = next.content;
    if (isSkip(reply)) continue;
    if (!revenueRange && /annual revenue|revenue range|approximate annual/.test(content)) {
      revenueRange = matchOption(reply, REVENUE_OPTIONS) || reply.trim().slice(0, 60);
    }
    if (!biggestChallenge && /biggest (marketing )?challenge/.test(content)) {
      biggestChallenge = matchOption(reply, CHALLENGE_OPTIONS) || reply.trim().slice(0, 120);
    }
  }
  return { revenueRange, biggestChallenge };
}

export default function Discovery() {
  const { user } = useAuth();
  const userId = user?.id;
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
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const userContextRef = useRef<UserContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const lastHistoryRef = useRef<Msg[] | null>(null);
  const [synthFailed, setSynthFailed] = useState(false);
  const lastSynthHistoryRef = useRef<Msg[] | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const autoRetryRef = useRef<number | null>(null);

  // progress: count assistant questions answered = number of user messages
  const answered = messages.filter((m) => m.role === "user").length;
  const answeredDisplay = Math.min(answered, TOTAL_QUESTIONS);
  const progress = Math.min(100, Math.round((answered / TOTAL_QUESTIONS) * 100));
  // Sections 1-5 cover Q1-Q13 (~3 each); section 6 covers Q14-Q15 (optional).
  const currentSection = answered >= REQUIRED_QUESTIONS
    ? 6
    : Math.min(5, Math.floor(answered / 3) + 1);

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
  }, [userId, searchParams]);

  function dismissWelcome() {
    sessionStorage.setItem("welcome_dismissed", "true");
    setShowWelcome(false);
    const next = new URLSearchParams(searchParams);
    next.delete("welcome");
    setSearchParams(next, { replace: true });
  }

  // load or start session
  useEffect(() => {
    if (!userId) return;
    (async () => {
      // Fetch profile first so the system prompt is personalized.
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, business_name")
        .eq("id", user.id)
        .maybeSingle();
      const ctx: UserContext = {
        firstName: (profile?.full_name || "").split(" ")[0] || "there",
        role: profile?.role || undefined,
        businessName: profile?.business_name || undefined,
      };
      setUserContext(ctx);
      userContextRef.current = ctx;

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
  }, [userId]);

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
    setInlineError(null);
    lastHistoryRef.current = history;
    // Track whether we've already added the placeholder assistant message,
    // so we can roll it back on error.
    let placeholderAdded = false;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase environment variables");
      }

      const url = `${supabaseUrl}/functions/v1/discovery-chat`;
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token ?? supabaseKey;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ messages: history, userContext: userContextRef.current ?? undefined }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("Discovery chat error:", resp.status, errorText);
        throw new Error(`Connection failed: ${resp.status} — ${errorText}`);
      }

      if (!resp.body) {
        throw new Error("No response body received");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let streamError: string | null = null;
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      placeholderAdded = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed?.type === "error") {
              streamError = parsed.message || "MOXIE had a moment — tap Send again to continue.";
              continue;
            }
            const chunk = parsed?.choices?.[0]?.delta?.content ?? "";
            if (chunk) {
              assistantText += chunk;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText };
                return updated;
              });
            }
          } catch {
            // Skip malformed lines
          }
        }
        if (streamError) throw new Error(streamError);
      }

      const isComplete = assistantText.includes("<STRATEGY_COMPLETE>") || assistantText.includes("<DISCOVERY_COMPLETE>");
      const cleanText = assistantText.replace(/<STRATEGY_COMPLETE>|<DISCOVERY_COMPLETE>/g, "").trim();
      const finalAssistant: Msg = { role: "assistant", content: cleanText };
      const newHistory = [...history, finalAssistant];
      if (isComplete) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = finalAssistant;
          return copy;
        });
        setCompleted(true);
      } else {
        setMessages(newHistory);
      }
      await persist(newHistory, sid, isComplete);
      if (isComplete) await synthesize(newHistory);
      lastHistoryRef.current = null;
    } catch (e: any) {
      console.error("streamReply error:", e);
      // Roll back the empty assistant placeholder so the UI doesn't show a blank bubble.
      if (placeholderAdded) {
        setMessages((prev) => {
          if (prev.length && prev[prev.length - 1].role === "assistant") {
            return prev.slice(0, -1);
          }
          return prev;
        });
      }
      const raw = typeof e?.message === "string" ? e.message : "";
      const message = raw.includes("MOXIE")
        ? raw
        : "MOXIE is thinking — just a moment...";
      setInlineError(message);
      // Auto-retry after 3s for the "thinking" message, no user tap required.
      if (message.includes("thinking") && lastHistoryRef.current && sid) {
        if (autoRetryRef.current) window.clearTimeout(autoRetryRef.current);
        autoRetryRef.current = window.setTimeout(() => {
          autoRetryRef.current = null;
          if (lastHistoryRef.current) {
            setInlineError(null);
            streamReply(lastHistoryRef.current, sid);
          }
        }, 3000);
      }
    } finally {
      setLoading(false);
      // 800ms cooldown so users can't fire the next question before the previous call clears.
      setCooldown(true);
      window.setTimeout(() => setCooldown(false), 800);
    }
  }

  async function send() {
    if (loading || cooldown || !sessionId) return;
    const text = input.trim();

    // Retry path: previous attempt failed and the user message is already in history.
    if (!text && lastHistoryRef.current) {
      setInlineError(null);
      await streamReply(lastHistoryRef.current, sessionId);
      return;
    }

    if (!text) return;
    setInput("");
    setInlineError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    await streamReply(next, sessionId);
  }

  async function synthesize(history: Msg[]) {
    setSynthesizing(true);
    setSynthFailed(false);
    lastSynthHistoryRef.current = history;
    // Save discovery answers BEFORE calling Anthropic so they're never lost on failure.
    try {
      await persist(history, sessionId!, true);
    } catch (saveErr) {
      console.error("pre-synth persist failed:", saveErr);
    }
    try {
      const transcript = history.map((m) => `${m.role === "user" ? "USER" : "MOXIE"}: ${m.content}`).join("\n\n");
      // Extract the optional Q14 (revenue) and Q15 (challenge) answers from the transcript.
      const optional = extractOptionalAnswers(history);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase environment variables");
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token ?? supabaseKey;

      const resp = await fetch(`${supabaseUrl}/functions/v1/synthesize-strategy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({
          transcript,
          revenueRange: optional.revenueRange,
          biggestChallenge: optional.biggestChallenge,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errText = !resp.ok ? await resp.text().catch(() => "") : "no body";
        throw new Error(`Synthesis request failed: ${resp.status} ${errText}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let data: any = null;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "complete") {
              data = evt.strategy;
            } else if (evt.type === "error") {
              streamError = evt.message || "Stream error";
            }
            // 'progress' events keep the UI alive; nothing else to do.
          } catch {
            // ignore non-JSON heartbeat lines
          }
        }
      }

      if (streamError) throw new Error(streamError);
      if (!data) throw new Error("Stream ended before strategy was generated");
      if (!user) return;
      // upsert strategy — preserve optional context inside raw_foundation
      const rawFoundation = {
        ...data,
        revenueRange: optional.revenueRange,
        biggestChallenge: optional.biggestChallenge,
      };
      await supabase
        .from("strategies")
        .upsert({ user_id: user.id, ...data, raw_foundation: rawFoundation }, { onConflict: "user_id" });
      setSynthFailed(false);
      toast.success("Your strategy is ready.");
      setTimeout(() => navigate("/app/strategy"), 1200);
    } catch (e: any) {
      console.error("synthesize error:", e);
      setSynthFailed(true);
      toast.error("Strategy generation hit a snag — your answers are saved.", {
        description: "Click 'Generate Strategy' to try again.",
      });
    } finally {
      setSynthesizing(false);
    }
  }

  async function retrySynthesize() {
    const h = lastSynthHistoryRef.current ?? messages;
    setSynthFailed(false);
    await synthesize(h);
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
            <span className="text-xs text-muted-foreground">Section {currentSection} of {SECTIONS.length} — {SECTIONS[currentSection - 1]}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {answeredDisplay}/{TOTAL_QUESTIONS} answered
              {answered >= REQUIRED_QUESTIONS && answered < TOTAL_QUESTIONS && " · bonus questions"}
            </span>
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
              <span className="inline-flex items-center gap-1">
                MOXIE is building your strategy
                <span className="inline-flex gap-0.5 ml-1">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </span>
            </div>
          )}
          {completed && !synthesizing && (
            <></>
          )}
          {/* keep original completed button below */}
          {false && (
            <div className="hidden" />
          )}
          {completed && !synthesizing && (
            <div className="flex items-center justify-center pt-4">
              {synthFailed ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Strategy generation hit a snag — your answers are saved. Click below to try again.
                  </p>
                  <Button onClick={retrySynthesize} className="bg-foreground text-background hover:bg-foreground/90 h-11 rounded-lg">
                    <Sparkles className="mr-2 h-4 w-4 text-accent" /> Generate Strategy
                  </Button>
                </div>
              ) : (
                <Button onClick={() => navigate("/app/strategy")} className="bg-foreground text-background hover:bg-foreground/90 h-11 rounded-lg">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-accent" /> View your strategy
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      {!completed && (
        <div className="border-t border-border bg-background px-4 lg:px-10 py-4">
          <div className="max-w-3xl mx-auto">
            {inlineError && (
              <div
                role="status"
                className="mb-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
              >
                {inlineError}
              </div>
            )}
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
              <Button onClick={send} disabled={loading || cooldown || (!input.trim() && !inlineError)} size="icon" className="h-9 w-9 rounded-xl bg-foreground hover:bg-foreground/90 text-background flex-shrink-0">
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