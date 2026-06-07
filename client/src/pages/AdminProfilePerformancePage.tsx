import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { XCircle } from "lucide-react";

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: string;
}

interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  department: string | null;
  role: string;
}

interface Competency {
  id: string;
  name: string;
}

interface SelfAssessment {
  competencyId: string;
  rating: number;
}

interface ManagerEval {
  competencyId: string;
  rating: number;
}

interface Calibration {
  competencyId: string;
  calibratedRating: number;
}

interface EvaluationSheet {
  id: string;
  status: string;
  currentPhase: number;
  mboScore: number | null;
  performanceScore: number | null;
  compositeScore: number | null;
}

export default function AdminProfilePerformancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/admin/profile-performance/:userId");
  const userId = params?.userId ?? "";
  const [selectedCycle, setSelectedCycle] = useState("");
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const { data: cycles = [] } = useQuery<EvaluationCycle[]>({
    queryKey: ["/api/admin/evaluation-cycles"],
    enabled: !!user,
  });

  useEffect(() => {
    if (cycles.length > 0 && !selectedCycle) {
      const active = cycles.find(c => c.status === "active") ?? cycles[0];
      setSelectedCycle(active.id);
    }
  }, [cycles, selectedCycle]);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/admin/users", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: competencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/my-competencies", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/user-competencies/${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: selfAssessments = [] } = useQuery<SelfAssessment[]>({
    queryKey: ["/api/admin/self-assessments", selectedCycle, userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/self-assessments/${selectedCycle}/${userId}`);
      return res.json();
    },
    enabled: !!selectedCycle && !!userId,
  });

  const { data: managerEvals = [] } = useQuery<ManagerEval[]>({
    queryKey: ["/api/admin/manager-evals", selectedCycle, userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/manager/employee-evaluations/${userId}/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle && !!userId,
  });

  const { data: calibrations = [] } = useQuery<Calibration[]>({
    queryKey: ["/api/admin/calibrations", selectedCycle, userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/calibrations/${selectedCycle}?employeeUserId=${userId}`);
      return res.json();
    },
    enabled: !!selectedCycle && !!userId,
  });

  const { data: sheet } = useQuery<EvaluationSheet | null>({
    queryKey: ["/api/admin/sheet", selectedCycle, userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/sheets/${selectedCycle}`);
      const sheets: EvaluationSheet[] = await res.json();
      return sheets.find((s: any) => s.userId === userId) ?? null;
    },
    enabled: !!selectedCycle && !!userId,
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      if (!sheet?.id) throw new Error("Sheet not found");
      const res = await apiRequest("POST", `/api/admin/sheets/${sheet.id}/close`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sheet"] });
      toast({ title: "Scheda chiusa con successo" });
      setShowCloseDialog(false);
    },
    onError: () => {
      toast({ title: "Errore chiusura scheda", variant: "destructive" });
    },
  });

  const radarData = competencies.map(c => {
    const self = selfAssessments.find(s => s.competencyId === c.id);
    const mgr = managerEvals.find(m => m.competencyId === c.id);
    const calib = calibrations.find(cal => cal.competencyId === c.id);
    return {
      competency: c.name.length > 20 ? c.name.slice(0, 18) + "…" : c.name,
      fullName: c.name,
      autovalutazione: self?.rating ?? 0,
      manager: calib?.calibratedRating ?? mgr?.rating ?? 0,
    };
  });

  const phaseLabel = ["", "Autovalutazione", "Valutazione Manager", "Calibrazione", "Colloquio"][sheet?.currentPhase ?? 1] ?? "";

  return (
    <div className="w-full space-y-6 pt-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          context="PERFORMANCE"
          title={profile ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() : "Profilo Performance"}
          description={profile?.email ?? ""}
        />
        <div className="flex gap-3">
          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Seleziona ciclo" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sheet && sheet.status === "open" && (
            <Button variant="destructive" size="sm" onClick={() => setShowCloseDialog(true)}>
              <XCircle className="h-4 w-4 mr-2" /> Chiudi scheda
            </Button>
          )}
        </div>
      </div>

      {/* Sheet status */}
      {sheet && (
        <Card>
          <CardContent className="pt-4 flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Stato scheda</p>
              <Badge variant={sheet.status === "closed" ? "default" : "secondary"}>
                {sheet.status === "closed" ? "Chiusa" : "Aperta"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fase corrente</p>
              <p className="font-medium text-sm">{phaseLabel}</p>
            </div>
            {sheet.compositeScore !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Punteggio composito</p>
                <p className="font-bold text-lg">{sheet.compositeScore.toFixed(1)}%</p>
              </div>
            )}
            {sheet.mboScore !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Score MBO</p>
                <p className="font-medium">{sheet.mboScore.toFixed(1)}%</p>
              </div>
            )}
            {sheet.performanceScore !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Score Competenze</p>
                <p className="font-medium">{sheet.performanceScore.toFixed(2)}/5</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Radar chart */}
      {radarData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Profilo Competenze</CardTitle>
            <CardDescription>Confronto autovalutazione vs valutazione manager (calibrata)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="competency" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} tick={{ fontSize: 10 }} />
                <Radar name="Autovalutazione" dataKey="autovalutazione" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                <Radar name="Manager / Calibrato" dataKey="manager" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                <Legend />
                <Tooltip
                  formatter={(value, name, props) => [`${value}/5`, name]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nessuna competenza o valutazione disponibile per questo ciclo
          </CardContent>
        </Card>
      )}

      {/* Competency detail table */}
      {radarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dettaglio per Competenza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {radarData.map(row => (
                <div key={row.competency} className="py-3 grid grid-cols-3 gap-4">
                  <div className="font-medium text-sm">{row.fullName}</div>
                  <div className="text-sm">
                    <span className="text-muted-foreground mr-1">Autovalutazione:</span>
                    <span className="font-semibold text-indigo-600">{row.autovalutazione}/5</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground mr-1">Manager/Calibrato:</span>
                    <span className="font-semibold text-amber-600">{row.manager}/5</span>
                    {calibrations.some(c => c.competencyId === competencies.find(comp => comp.name === row.fullName)?.id) && (
                      <Badge variant="outline" className="ml-2 text-xs">Calibrato</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chiudi scheda di valutazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler chiudere la scheda di valutazione di {profile?.firstName} {profile?.lastName}?
              Questa azione finalizza il processo per questo ciclo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
              Chiudi scheda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
