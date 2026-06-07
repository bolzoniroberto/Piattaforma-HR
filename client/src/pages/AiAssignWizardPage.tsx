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
import { Bot, Sparkles, User, ChevronRight, Loader2, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  mboPercentage?: number;
}

interface QuestionPayload {
  key: string;
  text: string;
  type: "free" | "choice" | "number";
  choices?: string[];
  optional?: boolean;
}

interface ProposalObjective {
  dictionaryId: string;
  weight: number;
  deadline?: number;
  rationale: string;
}

interface ProposalAssign {
  objectives: ProposalObjective[];
  note: string;
}

interface TurnResult {
  sessionId: string;
  state: "questioning" | "ready" | "finalized";
  question?: QuestionPayload;
  proposal?: ProposalAssign;
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

// ─── Proposal card ────────────────────────────────────────────────────────────

function ProposalObjectiveCard({
  obj,
  index,
  weight,
  onWeightChange,
}: {
  obj: ProposalObjective;
  index: number;
  weight: number;
  onWeightChange: (v: number) => void;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <Badge variant="outline" className="text-xs font-mono">{obj.dictionaryId}</Badge>
          <p className="text-sm text-slate-600 leading-relaxed">{obj.rationale}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Input
            type="number"
            min={5}
            max={100}
            step={5}
            value={weight}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            className="w-20 text-center"
          />
          <span className="text-sm text-slate-500">%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Phase = "select" | "chat" | "review" | "done";

export default function AiAssignWizardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const search = useSearch();

  const [phase, setPhase] = useState<Phase>("select");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [session, setSession] = useState<TurnResult | null>(null);
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [weights, setWeights] = useState<number[]>([]);

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
      const res = await apiRequest("POST", "/api/ai/session/start", {
        scope: "assign",
        targetUserId,
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
      if (data.state === "ready" && data.proposal) {
        setWeights(data.proposal.objectives.map((o) => o.weight));
        setPhase("review");
      }
    },
    onError: (err: any) => {
      toast({ title: "Errore risposta", description: err.message, variant: "destructive" });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const proposal = session!.proposal!;
      for (let i = 0; i < proposal.objectives.length; i++) {
        const obj = proposal.objectives[i];
        await apiRequest("POST", "/api/manager/mbo/assignments", {
          userId: selectedUserId,
          dictionaryId: obj.dictionaryId,
          weight: weights[i],
        });
      }
      await apiRequest("POST", `/api/ai/session/${session!.sessionId}/finalize`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/mbo/team-member"] });
      setPhase("done");
      toast({ title: "Obiettivi assegnati", description: "La proposta AI è stata applicata con successo." });
    },
    onError: (err: any) => {
      toast({ title: "Errore assegnazione", description: err.message, variant: "destructive" });
    },
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const weightOk = totalWeight === 100;
  const selectedMember = teamMembers.find((m) => m.id === selectedUserId);

  function handleReset() {
    setPhase("select");
    setSelectedUserId("");
    setSession(null);
    setAnswer("");
    setHistory([]);
    setWeights([]);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <PageHeader
        title="Assegna Obiettivi con AI"
        description="L'agente raccoglie il contesto e propone obiettivi MBO personalizzati."
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <StepDot active={phase === "select"} done={phase !== "select"} label="Dipendente" />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot active={phase === "chat"} done={phase === "review" || phase === "done"} label="Dialogo" />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot active={phase === "review"} done={phase === "done"} label="Proposta" />
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
                    {m.mboPercentage ? ` (MBO ${m.mboPercentage}%)` : ""}
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
          {/* History */}
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
      {phase === "review" && session?.proposal && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Proposta per {selectedMember?.firstName} {selectedMember?.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.proposal.note && (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                  {session.proposal.note}
                </p>
              )}

              <div className="space-y-3">
                {session.proposal.objectives.map((obj, i) => (
                  <ProposalObjectiveCard
                    key={obj.dictionaryId}
                    obj={obj}
                    index={i}
                    weight={weights[i] ?? obj.weight}
                    onWeightChange={(v) => setWeights((ws) => ws.map((w, idx) => idx === i ? v : w))}
                  />
                ))}
              </div>

              <div className={cn(
                "flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2",
                weightOk ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
              )}>
                {weightOk
                  ? <><CheckCircle2 className="w-4 h-4" />Pesi corretti — totale 100%</>
                  : <><AlertCircle className="w-4 h-4" />Totale attuale: {totalWeight}% (deve essere 100%)</>
                }
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Ricomincia
                </Button>
                <Button
                  onClick={() => applyMutation.mutate()}
                  disabled={!weightOk || applyMutation.isPending}
                  className="flex-1"
                >
                  {applyMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Assegnazione…</>
                    : <><CheckCircle2 className="w-4 h-4 mr-2" />Applica Proposta</>
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
              <p className="font-semibold text-emerald-800 text-lg">Obiettivi assegnati</p>
              <p className="text-sm text-emerald-700 mt-1">
                La proposta è stata applicata a {selectedMember?.firstName} {selectedMember?.lastName}.
              </p>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Nuova assegnazione
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
