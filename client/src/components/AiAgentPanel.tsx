import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useAiPanel } from "@/contexts/AiPanelContext";
import {
  Bot, ChevronRight, Sparkles, RefreshCw,
  Target, FileText, Users, BarChart3, AlertTriangle, Lightbulb,
  TrendingUp, Loader2, CheckCircle2, SendHorizonal, MessageSquare, ArrowLeft, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember { id: string; firstName?: string; lastName?: string; department?: string }

interface EmployeeInsight {
  summary: string;
  strengths: string[];
  developmentAreas: string[];
  mboFocus: string;
  riskFlags: string[];
  generatedAt: number;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

type PanelCtx =
  | { type: "employee-eval"; userId: string; cycleId: string }
  | { type: "self-assessment" }
  | { type: "mbo-assign" }
  | { type: "ai-wizard" }
  | { type: "dashboard" }
  | { type: "generic" };

function detectCtx(path: string): PanelCtx {
  const m = path.match(/^\/manager\/team-evaluations\/([^/]+)\/([^/]+)$/);
  if (m) return { type: "employee-eval", userId: m[1], cycleId: m[2] };
  if (path === "/manager/mbo-assign") return { type: "mbo-assign" };
  if (path.startsWith("/ai/")) return { type: "ai-wizard" };
  if (path === "/employee/self-assessment") return { type: "self-assessment" };
  if (path === "/" || path === "") return { type: "dashboard" };
  return { type: "generic" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  loading,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  loading?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full text-left p-3 rounded-xl bg-slate-50/50 hover:bg-white transition-all group disabled:opacity-60 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-md ai-gradient text-white flex items-center justify-center shrink-0 ai-glow-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{title}</span>
            {badge && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{badge}</Badge>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
        {!loading && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0 mt-1 transition-colors" />}
      </div>
    </button>
  );
}

function InsightSection({ icon: Icon, title, children, color = "slate" }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  color?: "slate" | "emerald" | "amber" | "blue" | "red";
}) {
  const colors = {
    slate: "text-slate-700 bg-slate-100",
    emerald: "text-emerald-700 bg-emerald-100",
    amber: "text-amber-700 bg-amber-100",
    blue: "text-blue-700 bg-blue-100",
    red: "text-red-700 bg-red-100",
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className={cn("w-5 h-5 rounded flex items-center justify-center", colors[color])}>
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Suggested prompts per context ───────────────────────────────────────────

function getDefaultPrompts(ctx: PanelCtx): string[] {
  if (ctx.type === "employee-eval") return [
    "Punti di forza di questo dipendente",
    "Aree di miglioramento prioritarie",
    "Suggerisci azioni di sviluppo",
    "C'è rischio di disengagement?",
  ];
  if (ctx.type === "mbo-assign") return [
    "Come bilanciare i pesi degli obiettivi?",
    "Quali cluster sono più rilevanti?",
    "Suggerisci un mix obiettivi quantitativi/qualitativi",
  ];
  if (ctx.type === "self-assessment") return [
    "Come scelgo il rating giusto?",
    "Aiutami con i punti di forza",
    "Come descrivere aree di miglioramento?",
    "Suggeriscimi obiettivi professionali",
  ];
  return [
    "Come funziona il ciclo MBO?",
    "Quali best practice per la valutazione 360°?",
    "Come scrivere obiettivi SMART efficaci?",
    "Come gestire un colloquio di feedback?",
    "Differenza tra MBO e OKR",
  ];
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function AiAgentPanel() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const aiPanel = useAiPanel();

  const [insight, setInsight] = useState<EmployeeInsight | null>(null);
  const [chatMode, setChatMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ctx = detectCtx(location);
  const isManagerOrAdmin = user?.role === "admin" || user?.role === "manager";
  const isSelfAssessmentCtx = ctx.type === "self-assessment" || !!aiPanel.options.competencyContext;
  const isEmployee = !!user && !isManagerOrAdmin;

  // Panel visibile per tutti gli utenti autenticati
  const shouldRender = !!user;

  // Reset on location change
  useEffect(() => {
    setInsight(null);
    setChatMode(false);
    setChatMessages([]);
    setChatInput("");
    aiPanel.clearOptions();
  }, [location]);

  // When panel opened from external context, go straight to chat
  useEffect(() => {
    if (aiPanel.isOpen && aiPanel.options.initialMessage) {
      const msg = aiPanel.options.initialMessage;
      setChatMessages([{ role: "user", text: msg }]);
      setChatMode(true);
      chatMutation.mutate(msg);
    }
  }, [aiPanel.isOpen, aiPanel.options.initialMessage]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Team members (for employee name lookup)
  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/manager/mbo/team-members"],
    enabled: isManagerOrAdmin && ctx.type === "employee-eval",
  });

  const currentEmployee = ctx.type === "employee-eval"
    ? teamMembers?.find((m) => m.id === ctx.userId)
    : null;

  const expanded = aiPanel.isOpen || (isManagerOrAdmin && false); // always use context

  // Chat mutation — routes to right endpoint
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Employees always use self-assessment endpoint (no isManager required)
      if (isEmployee || isSelfAssessmentCtx || aiPanel.options.endpoint === "/api/ai/self-assessment-chat") {
        const res = await apiRequest("POST", "/api/ai/self-assessment-chat", {
          message,
          competencyContext: aiPanel.options.competencyContext,
        });
        return res.json() as Promise<{ reply: string }>;
      }
      // Manager/admin endpoint
      const pageContext = ctx.type === "employee-eval"
        ? { type: ctx.type, userId: ctx.userId, cycleId: ctx.cycleId }
        : { type: ctx.type };
      const res = await apiRequest("POST", "/api/ai/chat", { message, pageContext });
      return res.json() as Promise<{ reply: string }>;
    },
    onSuccess: (data) => {
      setChatMessages((msgs) => [...msgs, { role: "ai", text: data.reply }]);
    },
    onError: (err: any) => {
      let msg = "Errore durante la risposta. Riprova.";
      try {
        const raw = err?.message ?? "";
        const jsonPart = raw.includes("{") ? raw.slice(raw.indexOf("{")) : null;
        if (jsonPart) {
          const parsed = JSON.parse(jsonPart);
          if (parsed.message) msg = parsed.message;
        }
      } catch { /* usa messaggio di default */ }
      setChatMessages((msgs) => [...msgs, { role: "ai", text: msg }]);
    },
  });

  function handleSendChat(text?: string) {
    const msg = (text ?? chatInput).trim();
    if (!msg) return;
    setChatMessages((msgs) => [...msgs, { role: "user", text: msg }]);
    setChatInput("");
    setChatMode(true);
    chatMutation.mutate(msg);
  }

  // Insight mutation
  const insightMutation = useMutation({
    mutationFn: async () => {
      if (ctx.type !== "employee-eval") throw new Error("Contesto non valido");
      const res = await apiRequest("POST", "/api/ai/employee-insight", {
        targetUserId: ctx.userId,
        cycleId: ctx.cycleId,
      });
      return res.json() as Promise<EmployeeInsight>;
    },
    onSuccess: (data) => { setInsight(data); },
  });

  if (!shouldRender) return null;

  const employeeName = currentEmployee
    ? `${currentEmployee.firstName || ""} ${currentEmployee.lastName || ""}`.trim()
    : "dipendente";

  const suggestedPrompts = aiPanel.options.suggestedPrompts ?? getDefaultPrompts(ctx);
  const contextLabel = aiPanel.options.contextLabel
    ?? (ctx.type === "employee-eval" ? employeeName : null);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "h-screen sticky top-0 shrink-0 bg-white flex flex-col transition-[width] duration-500 ease-in-out overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.03)]",
        aiPanel.isOpen ? "w-[360px]" : "w-14",
      )}
    >
      {/* Collapsed: vertical tab */}
      {!aiPanel.isOpen && (
        <button
          onClick={() => aiPanel.open()}
          className="flex-1 flex flex-col items-center justify-center gap-4 hover:bg-slate-50 transition-all group relative overflow-hidden"
          title="Apri Assistente IA"
        >
          <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-10 h-10 rounded-xl ai-gradient text-white flex items-center justify-center ai-glow group-hover:scale-110 transition-transform duration-300">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.2em] ai-text-gradient"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Assistant
            </span>
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
          </div>
        </button>
      )}

      {/* Expanded */}
      {aiPanel.isOpen && (
        <>
          {/* Header */}
          <div className="h-16 ai-gradient flex items-center px-4 gap-3 shrink-0 shadow-lg">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-white flex-1 text-sm tracking-tight">
              {(isSelfAssessmentCtx || isEmployee) ? "Assistente AI" : "Agente IA Strategico"}
            </span>
            {insight && (
              <button
                onClick={() => setInsight(null)}
                className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all"
                title="Nuova analisi"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
              <button
                onClick={() => aiPanel.close()}
                className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all"
                title="Chiudi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          {/* Context badge */}
          {contextLabel && (
            <div className="px-4 py-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_5px_rgba(0,242,255,0.8)]", isSelfAssessmentCtx ? "bg-cyan-500" : "bg-blue-500")} />
                <span className="flex-1 truncate">
                  {isSelfAssessmentCtx ? "" : "Contesto: "}
                  <span className="font-medium text-slate-700">{contextLabel}</span>
                </span>
                {isSelfAssessmentCtx && aiPanel.options.competencyContext && (
                  <button
                    onClick={() => aiPanel.clearOptions()}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">

            {/* ── CHAT MODE ── */}
            {chatMode && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setChatMode(false); setChatMessages([]); }}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chat</span>
                </div>

                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "ai" && (
                      <div className="w-8 h-8 rounded-lg ai-gradient text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap shadow-sm",
                      msg.role === "user"
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-slate-50 text-slate-700 rounded-tl-none ai-gradient-subtle",
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {chatMutation.isPending && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div className="bg-slate-100 rounded-xl px-3 py-2">
                      <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}

            {/* ── ACTIONS MODE ── */}
            {!chatMode && (
              <>
                {/* Employee empty state (self-assessment or generic) */}
                {(isSelfAssessmentCtx || isEmployee) && (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Sono qui per aiutarti</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {aiPanel.options.competencyContext
                          ? `Pronto ad aiutarti su "${aiPanel.options.competencyContext.name}"`
                          : "Clicca un suggerimento o scrivi una domanda"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Manager/admin: loading insight */}
                {!isSelfAssessmentCtx && !isEmployee && insightMutation.isPending && (
                  <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Analisi in corso…</p>
                      <p className="text-xs text-slate-400 mt-1">L'agente sta elaborando i dati</p>
                    </div>
                  </div>
                )}

                {/* Insight result */}
                {!isSelfAssessmentCtx && !isEmployee && !insightMutation.isPending && insight && (
                  <div className="space-y-4">
                    <InsightSection icon={Lightbulb} title="Sintesi" color="blue">
                      <p className="text-xs text-slate-600 leading-relaxed">{insight.summary}</p>
                    </InsightSection>
                    <Separator />
                    {insight.strengths.length > 0 && (
                      <InsightSection icon={CheckCircle2} title="Punti di Forza" color="emerald">
                        <ul className="space-y-1">
                          {insight.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-0.5">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      </InsightSection>
                    )}
                    {insight.developmentAreas.length > 0 && (
                      <InsightSection icon={TrendingUp} title="Aree di Sviluppo" color="amber">
                        <ul className="space-y-1">
                          {insight.developmentAreas.map((s, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <span className="text-amber-500 mt-0.5">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      </InsightSection>
                    )}
                    <InsightSection icon={Target} title="Focus MBO" color="blue">
                      <p className="text-xs text-slate-600 leading-relaxed">{insight.mboFocus}</p>
                    </InsightSection>
                    {insight.riskFlags.length > 0 && (
                      <InsightSection icon={AlertTriangle} title="Segnalazioni" color="red">
                        <ul className="space-y-1">
                          {insight.riskFlags.map((s, i) => (
                            <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                              <span className="mt-0.5">⚠</span>{s}
                            </li>
                          ))}
                        </ul>
                      </InsightSection>
                    )}
                    <Separator />
                    <p className="text-[10px] text-slate-400 text-center">
                      Generato {new Date(insight.generatedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                )}

                {/* Manager actions */}
                {!isSelfAssessmentCtx && !isEmployee && !insightMutation.isPending && !insight && (
                  <div className="space-y-2">
                    {ctx.type === "employee-eval" && (
                      <>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Azioni disponibili</p>
                        <ActionCard icon={Sparkles} title={`Analizza ${employeeName.split(" ")[0]}`} description="Sintesi AI di punti di forza, aree sviluppo e focus MBO" onClick={() => insightMutation.mutate()} loading={insightMutation.isPending} />
                        <ActionCard icon={FileText} title="Genera scheda valutazione" description="Bozza strutturata basata su autovalutazione e feedback" onClick={() => navigate(`/ai/valuta?userId=${ctx.userId}&cycleId=${ctx.cycleId}`)} badge="wizard" />
                        <ActionCard icon={Target} title="Assegna obiettivi" description="Proposta AI di obiettivi MBO per questo dipendente" onClick={() => navigate(`/ai/assegna?userId=${ctx.userId}`)} badge="wizard" />
                      </>
                    )}
                    {ctx.type === "mbo-assign" && (
                      <>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Azioni disponibili</p>
                        <ActionCard icon={Sparkles} title="Assegna Obiettivi con AI" description="L'agente raccoglie il contesto e propone obiettivi personalizzati" onClick={() => navigate("/ai/assegna")} />
                      </>
                    )}
                    {(ctx.type === "dashboard" || ctx.type === "generic") && (
                      <>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Cosa posso fare</p>
                        <ActionCard icon={Target} title="Assegna Obiettivi" description="Wizard AI per assegnare obiettivi MBO a un dipendente" onClick={() => navigate("/ai/assegna")} />
                        <ActionCard icon={FileText} title="Valuta Dipendente" description="Genera bozza di scheda di valutazione performance" onClick={() => navigate("/ai/valuta")} />
                        <ActionCard icon={Users} title="Apri una valutazione" description="Vai alle valutazioni del team per analizzare un dipendente" onClick={() => navigate("/manager/team-evaluations")} />
                      </>
                    )}
                    {ctx.type === "ai-wizard" && (
                      <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">Sessione AI attiva</p>
                          <p className="text-xs text-slate-400 mt-1">Completa il wizard in corso</p>
                        </div>
                      </div>
                    )}
                    {insightMutation.isError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        Errore durante l'analisi. Riprova.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Chat input + suggested prompts ── */}
          <div className="p-3 space-y-3 shrink-0 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            {!chatMutation.isPending && (
              <div className="flex gap-1.5 flex-wrap">
                {suggestedPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChat(p)}
                    className="text-[10px] px-2 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Chiedi qualcosa…"
                rows={1}
                className="resize-none text-xs flex-1 min-h-[32px] max-h-[80px] py-1.5"
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 ai-gradient ai-glow hover:scale-105 transition-transform"
                onClick={() => handleSendChat()}
                disabled={!chatInput.trim() || chatMutation.isPending}
              >
                {chatMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <SendHorizonal className="w-4 h-4" />
                }
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
