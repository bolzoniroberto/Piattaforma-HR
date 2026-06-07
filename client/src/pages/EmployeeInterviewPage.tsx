import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertCircle, FileSignature, Sparkles, ChevronDown, Loader2 } from "lucide-react";

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: string;
}

interface Interview {
  id: string;
  status: string;
  scheduledAt: number | null;
  completedAt: number | null;
  outcome: string | null;
  notes: string | null;
  managerSignedAt: number | null;
  employeeSignedAt: number | null;
}

interface Competency {
  id: string;
  name: string;
}

interface Assessment {
  competencyId: string;
  rating: number;
}

interface Calibration {
  competencyId: string;
  calibratedRating: number;
}

export default function EmployeeInterviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCycle, setSelectedCycle] = useState("");
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { data: cycles = [] } = useQuery<EvaluationCycle[]>({
    queryKey: ["/api/evaluation-cycles/active"],
    enabled: !!user,
  });

  useEffect(() => {
    if (cycles.length > 0 && !selectedCycle) {
      const active = cycles.find(c => c.status === "active") ?? cycles[0];
      setSelectedCycle(active.id);
    }
  }, [cycles, selectedCycle]);

  const { data: interview } = useQuery<Interview | null>({
    queryKey: ["/api/interviews", selectedCycle],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/interviews/${selectedCycle}`);
        return res.json();
      } catch {
        return null;
      }
    },
    enabled: !!selectedCycle,
  });

  const { data: competencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/my-competencies"],
    enabled: !!user,
  });

  const { data: selfAssessments = [] } = useQuery<Assessment[]>({
    queryKey: ["/api/self-assessments", selectedCycle],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/self-assessments/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  const { data: managerEvals = [] } = useQuery<Assessment[]>({
    queryKey: ["/api/manager/my-evaluations/me", selectedCycle],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/manager/my-evaluations/${user?.id}/${selectedCycle}`);
        return res.json();
      } catch {
        return [];
      }
    },
    enabled: !!selectedCycle && !!user?.id,
  });

  const summaryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/interview-summary", { cycleId: selectedCycle });
      return res.json() as Promise<{ summary: string }>;
    },
    onSuccess: (data) => {
      setAiSummary(data.summary);
      setSummaryOpen(true);
    },
    onError: () => {
      toast({ title: "Errore riepilogo AI", variant: "destructive" });
    },
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/interviews/${selectedCycle}/sign`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews", selectedCycle] });
      toast({ title: "Firma apposta con successo" });
      setShowSignDialog(false);
    },
    onError: () => {
      toast({ title: "Errore firma", variant: "destructive" });
    },
  });

  const radarData = competencies.map(c => {
    const self = selfAssessments.find(s => s.competencyId === c.id);
    const mgr = managerEvals.find(m => m.competencyId === c.id);
    return {
      competency: c.name.length > 20 ? c.name.slice(0, 18) + "…" : c.name,
      fullName: c.name,
      autovalutazione: self?.rating ?? 0,
      manager: mgr?.rating ?? 0,
    };
  });

  const alreadySigned = !!interview?.employeeSignedAt;

  return (
    <div className="w-full space-y-6 pt-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          context="VALUTAZIONE"
          title="Colloquio di Feedback"
          description="Visualizza i risultati e firma il colloquio con il tuo manager"
        />
        {cycles.length > 0 && (
          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Seleziona ciclo" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Interview status */}
      {interview ? (
        <Card className={interview.status === "completed" ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <CardContent className="pt-4 flex items-center gap-4">
            {interview.status === "completed" ? (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            ) : interview.status === "scheduled" ? (
              <Clock className="h-5 w-5 text-orange-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium">
                {interview.status === "completed" ? "Colloquio completato"
                  : interview.status === "scheduled" ? "Colloquio schedulato"
                  : "Colloquio in attesa"}
              </p>
              {interview.scheduledAt && (
                <p className="text-sm text-muted-foreground">
                  Data: {new Date(interview.scheduledAt * 1000).toLocaleDateString("it-IT")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant={interview.managerSignedAt ? "default" : "outline"}>
                Manager {interview.managerSignedAt ? "✓" : "—"}
              </Badge>
              <Badge variant={interview.employeeSignedAt ? "default" : "outline"}>
                Dipendente {interview.employeeSignedAt ? "✓" : "—"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-muted">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Nessun colloquio ancora schedulato per questo ciclo</p>
          </CardContent>
        </Card>
      )}

      {/* Notes from manager */}
      {interview?.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Note del manager</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{interview.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Outcome */}
      {interview?.outcome && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Esito del colloquio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{interview.outcome}</p>
          </CardContent>
        </Card>
      )}

      {/* Radar */}
      {radarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Il tuo profilo competenze</CardTitle>
            <CardDescription>Confronto autovalutazione vs valutazione manager</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="competency" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} tick={{ fontSize: 10 }} />
                <Radar name="Autovalutazione" dataKey="autovalutazione" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                <Radar name="Manager" dataKey="manager" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                <Legend />
                <Tooltip
                  formatter={(value, name) => [`${value}/5`, name]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* AI summary — sotto il radar */}
      {selectedCycle && (
        <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              onClick={() => {
                if (!aiSummary && !summaryMutation.isPending) summaryMutation.mutate();
              }}
            >
              {summaryMutation.isPending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Sparkles className="w-3 h-3" />
              }
              <span>Riepilogo AI</span>
              {aiSummary && <ChevronDown className="w-3 h-3" />}
            </button>
          </CollapsibleTrigger>
          {aiSummary && (
            <CollapsibleContent>
              <Card className="mt-2 border-slate-200 bg-slate-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                </CardContent>
              </Card>
            </CollapsibleContent>
          )}
        </Collapsible>
      )}

      {/* Sign button */}
      {interview && interview.managerSignedAt && !alreadySigned && (
        <div className="flex justify-end">
          <Button onClick={() => setShowSignDialog(true)}>
            <FileSignature className="h-4 w-4 mr-2" /> Firma colloquio
          </Button>
        </div>
      )}

      {alreadySigned && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">Hai firmato il colloquio il {new Date((interview?.employeeSignedAt ?? 0) * 1000).toLocaleDateString("it-IT")}</p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Firma colloquio</AlertDialogTitle>
            <AlertDialogDescription>
              Firmando confermi di aver partecipato al colloquio di feedback e di aver preso visione dei risultati della valutazione.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => signMutation.mutate()} disabled={signMutation.isPending}>
              Conferma firma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
