import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Bot, User, ChevronRight, Loader2, CheckCircle2, AlertCircle, RotateCcw,
  ClipboardList, TrendingUp, Target, Copy, Check,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  firstName?: string;
  lastName?: string;
  department?: string;
}

interface QuestionPayload {
  key: string;
  text: string;
  type: "free" | "choice" | "number";
  choices?: string[];
  optional?: boolean;
}

interface ProposalEval {
  executiveSummary: string;
  strengths: string[];
  developmentAreas: string[];
  mboHighlights: string;
  competencyGaps: string[];
  peerThemes: string[];
  proposedDevelopmentActions: string[];
  riskFlags: string[];
  tone: string;
}

interface TurnResult {
  sessionId: string;
  state: "questioning" | "ready" | "finalized";
  question?: QuestionPayload;
  proposal?: ProposalEval;
  turnCount: number;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
        done && "bg-emerald-600 border-emerald-600 text-white",
        active && !done && "bg-slate-900 border-slate-900 text-white",
        !active && !done && "bg-white border-slate-300 text-slate-400",
      )}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : null}
      </div>
      <span className={cn("text-[10px] font-medium uppercase tracking-wide", active ? "text-slate-900" : "text-slate-400")}>
        {label}
      </span>
    </div>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  answer,
  onAnswer,
  onSubmit,
  loading,
}: {
  question: QuestionPayload;
  answer: string;
  onAnswer: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const canSubmit = answer.trim().length > 0 || question.optional;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-medium leading-snug text-slate-800">
            {question.text}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.type === "choice" && question.choices && (
          <RadioGroup value={answer} onValueChange={onAnswer} className="space-y-2">
            {question.choices.map((c) => (
              <div key={c} className="flex items-center gap-3">
                <RadioGroupItem value={c} id={c} />
                <Label htmlFor={c} className="cursor-pointer text-sm">{c}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
        {question.type === "free" && (
          <Textarea
            placeholder={question.optional ? "Opzionale — lascia vuoto per saltare" : "Scrivi la tua risposta…"}
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            rows={3}
            className="resize-none"
          />
        )}
        {question.type === "number" && (
          <Input
            type="number"
            placeholder="Inserisci un valore numerico"
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-48"
          />
        )}
        <Button onClick={onSubmit} disabled={!canSubmit || loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
          {loading ? "Elaborazione…" : "Continua"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Proposal section ─────────────────────────────────────────────────────────

function EvalSection({
  icon: Icon,
  title,
  items,
  color = "slate",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
  color?: "emerald" | "amber" | "red" | "blue" | "slate";
}) {
  if (items.length === 0) return null;
  const colors = {
    slate: "text-slate-700 bg-slate-100",
    emerald: "text-emerald-700 bg-emerald-100",
    amber: "text-amber-700 bg-amber-100",
    blue: "text-blue-700 bg-blue-100",
    red: "text-red-700 bg-red-100",
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={cn("w-5 h-5 rounded flex items-center justify-center", colors[color])}>
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
      </div>
      <ul className="space-y-1 pl-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-1.5">
            <span className="mt-1 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Phase = "select" | "chat" | "review" | "done";

export default function AiEvalWizardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const search = useSearch();

  const [phase, setPhase] = useState<Phase>("select");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [session, setSession] = useState<TurnResult | null>(null);
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [copied, setCopied] = useState(false);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/manager/mbo/team-members"],
  });

  // Pre-select employee from ?userId= query param
  useEffect(() => {
    const preselected = new URLSearchParams(search).get("userId");
    if (preselected && teamMembers.length > 0 && !selectedUserId) {
      setSelectedUserId(preselected);
    }
  }, [search, teamMembers, selectedUserId]);

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const startMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const cycleId = new URLSearchParams(search).get("cycleId") ?? undefined;
      const res = await apiRequest("POST", "/api/ai/session/start", {
        scope: "eval",
        targetUserId,
        ...(cycleId ? { cycleId } : {}),
      });
      return res.json() as Promise<TurnResult>;
    },
    onSuccess: (data) => {
      setSession(data);
      setHistory([]);
      setPhase("chat");
    },
    onError: (err: any) => {
      toast({ title: "Errore avvio sessione", description: err.message, variant: "destructive" });
    },
  });

  const answerMutation = useMutation({
    mutationFn: async ({ answer, questionKey }: { answer: string; questionKey: string }) => {
      const res = await apiRequest("POST", `/api/ai/session/${session!.sessionId}/answer`, {
        answer,
        questionKey,
      });
      return res.json() as Promise<TurnResult>;
    },
    onSuccess: (data) => {
      if (session?.question) {
        setHistory((h) => [...h, { question: session.question!.text, answer }]);
      }
      setAnswer("");
      setSession(data);
      if (data.state === "ready") {
        setPhase("review");
      }
    },
    onError: (err: any) => {
      toast({ title: "Errore risposta", description: err.message, variant: "destructive" });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/ai/session/${session!.sessionId}/finalize`, {});
    },
    onSuccess: () => {
      setPhase("done");
      toast({ title: "Scheda finalizzata", description: "La bozza è stata registrata." });
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const selectedMember = teamMembers.find((m) => m.id === selectedUserId);
  const proposal = session?.proposal as ProposalEval | undefined;

  function handleReset() {
    setPhase("select");
    setSelectedUserId("");
    setSession(null);
    setAnswer("");
    setHistory([]);
    setCopied(false);
  }

  function buildCopyText(): string {
    if (!proposal) return "";
    const lines: string[] = [
      `SCHEDA VALUTAZIONE — ${selectedMember?.firstName ?? ""} ${selectedMember?.lastName ?? ""}`,
      "",
      "SINTESI ESECUTIVA",
      proposal.executiveSummary,
      "",
    ];
    if (proposal.strengths.length) {
      lines.push("PUNTI DI FORZA");
      proposal.strengths.forEach((s) => lines.push(`• ${s}`));
      lines.push("");
    }
    if (proposal.developmentAreas.length) {
      lines.push("AREE DI SVILUPPO");
      proposal.developmentAreas.forEach((s) => lines.push(`• ${s}`));
      lines.push("");
    }
    if (proposal.mboHighlights) {
      lines.push("MBO HIGHLIGHTS");
      lines.push(proposal.mboHighlights);
      lines.push("");
    }
    if (proposal.proposedDevelopmentActions.length) {
      lines.push("AZIONI DI SVILUPPO PROPOSTE");
      proposal.proposedDevelopmentActions.forEach((s) => lines.push(`• ${s}`));
      lines.push("");
    }
    if (proposal.riskFlags.length) {
      lines.push("SEGNALAZIONI");
      proposal.riskFlags.forEach((s) => lines.push(`⚠ ${s}`));
    }
    return lines.join("\n");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <PageHeader
        title="Valuta Dipendente con AI"
        description="L'agente raccoglie il punto di vista del manager e genera una bozza di scheda di valutazione."
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <StepDot active={phase === "select"} done={phase !== "select"} label="Dipendente" />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot active={phase === "chat"} done={phase === "review" || phase === "done"} label="Dialogo" />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot active={phase === "review"} done={phase === "done"} label="Bozza" />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot active={phase === "done"} done={false} label="Fine" />
      </div>

      {/* Phase: select */}
      {phase === "select" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4" />
              Seleziona dipendente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Scegli un dipendente…" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                    {m.department ? ` — ${m.department}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => startMutation.mutate(selectedUserId)}
              disabled={!selectedUserId || startMutation.isPending}
              className="w-full"
            >
              {startMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Avvio sessione…</>
                : <><Bot className="w-4 h-4 mr-2" />Avvia Agente AI</>
              }
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Phase: chat */}
      {phase === "chat" && session && (
        <div className="space-y-4">
          {history.map((h, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 flex-1">{h.question}</p>
              </div>
              <div className="flex items-start gap-3 justify-end">
                <p className="text-sm text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2">{h.answer}</p>
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-600">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              </div>
              <Separator className="my-2" />
            </div>
          ))}

          {session.question && (
            <QuestionCard
              question={session.question}
              answer={answer}
              onAnswer={setAnswer}
              onSubmit={() => answerMutation.mutate({ answer, questionKey: session.question!.key })}
              loading={answerMutation.isPending}
            />
          )}

          <p className="text-xs text-slate-400 text-center">
            Domanda {session.turnCount} di max 6
          </p>
        </div>
      )}

      {/* Phase: review */}
      {phase === "review" && proposal && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  Bozza per {selectedMember?.firstName} {selectedMember?.lastName}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiato" : "Copia"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Executive summary */}
              <div className="bg-slate-50 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Sintesi Esecutiva</p>
                <p className="text-sm text-slate-700 leading-relaxed">{proposal.executiveSummary}</p>
                {proposal.tone && (
                  <Badge variant="outline" className="mt-2 text-[10px]">Tono: {proposal.tone}</Badge>
                )}
              </div>

              <Separator />

              <EvalSection icon={CheckCircle2} title="Punti di Forza" items={proposal.strengths} color="emerald" />
              <EvalSection icon={TrendingUp} title="Aree di Sviluppo" items={proposal.developmentAreas} color="amber" />

              {proposal.mboHighlights && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center text-blue-700 bg-blue-100">
                      <Target className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">MBO Highlights</span>
                  </div>
                  <p className="text-sm text-slate-600 pl-1">{proposal.mboHighlights}</p>
                </div>
              )}

              <EvalSection icon={TrendingUp} title="Azioni di Sviluppo Proposte" items={proposal.proposedDevelopmentActions} color="blue" />
              <EvalSection icon={AlertCircle} title="Segnalazioni" items={proposal.riskFlags} color="red" />

              {(proposal.competencyGaps.length > 0 || proposal.peerThemes.length > 0) && (
                <>
                  <Separator />
                  <EvalSection icon={Target} title="Gap di Competenza" items={proposal.competencyGaps} color="amber" />
                  <EvalSection icon={User} title="Temi Peer Feedback" items={proposal.peerThemes} color="slate" />
                </>
              )}

              <Separator />

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Ricomincia
                </Button>
                <Button
                  onClick={() => finalizeMutation.mutate()}
                  disabled={finalizeMutation.isPending}
                  className="flex-1"
                >
                  {finalizeMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvataggio…</>
                    : <><CheckCircle2 className="w-4 h-4 mr-2" />Finalizza Bozza</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Phase: done */}
      {phase === "done" && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div>
              <p className="font-semibold text-emerald-800 text-lg">Bozza finalizzata</p>
              <p className="text-sm text-emerald-700 mt-1">
                La scheda di {selectedMember?.firstName} {selectedMember?.lastName} è stata registrata.
              </p>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Nuova valutazione
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
