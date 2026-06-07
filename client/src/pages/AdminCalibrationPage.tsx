import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Star, Pencil } from "lucide-react";

interface EvaluationCycle {
  id: string;
  name: string;
  year: number;
  status: string;
}

interface ActivityRow {
  userId: string;
  fullName: string;
  email: string;
  department: string | null;
  managerEvaluation: string;
}

interface ManagerEvalEntry {
  competencyId: string;
  competencyName: string;
  rating: number;
  comment: string;
  calibratedRating?: number;
  calibrationReason?: string;
}

interface Competency {
  id: string;
  name: string;
}

interface ManagerEval {
  competencyId: string;
  rating: number;
  comment: string;
}

interface Calibration {
  id: string;
  competencyId: string;
  originalRating: number;
  calibratedRating: number;
  reason: string | null;
}

const RATING_LABELS: Record<number, string> = {
  1: "Insufficiente", 2: "Base", 3: "Intermedio", 4: "Avanzato", 5: "Esperto",
};

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{RATING_LABELS[value] ?? ""}</span>
    </div>
  );
}

export default function AdminCalibrationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<ActivityRow | null>(null);
  const [editEntry, setEditEntry] = useState<ManagerEvalEntry | null>(null);
  const [calibForm, setCalibForm] = useState({ calibratedRating: 3, reason: "" });

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

  const { data: activities = [] } = useQuery<ActivityRow[]>({
    queryKey: ["/api/admin/activities", selectedCycle],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/activities/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedCycle,
  });

  const employees = activities.filter(r => r.managerEvaluation !== "pending");

  const { data: competencies = [] } = useQuery<Competency[]>({
    queryKey: ["/api/admin/competencies"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/competencies");
      return res.json();
    },
    enabled: !!selectedEmployee,
  });

  const { data: managerEvals = [] } = useQuery<ManagerEval[]>({
    queryKey: ["/api/admin/manager-evaluations", selectedCycle, selectedEmployee?.userId],
    queryFn: async () => {
      if (!selectedEmployee) return [];
      const res = await apiRequest("GET", `/api/manager/employee-evaluations/${selectedEmployee.userId}/${selectedCycle}`);
      return res.json();
    },
    enabled: !!selectedEmployee && !!selectedCycle,
  });

  const { data: calibrations = [] } = useQuery<Calibration[]>({
    queryKey: ["/api/admin/calibrations", selectedCycle, selectedEmployee?.userId],
    queryFn: async () => {
      if (!selectedEmployee) return [];
      const res = await apiRequest("GET", `/api/admin/calibrations/${selectedCycle}?employeeUserId=${selectedEmployee.userId}`);
      return res.json();
    },
    enabled: !!selectedEmployee && !!selectedCycle,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { cycleId: string; employeeUserId: string; competencyId: string; originalRating: number; calibratedRating: number; reason: string; year: number }) => {
      const res = await apiRequest("POST", "/api/admin/calibrations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/calibrations"] });
      toast({ title: "Calibrazione salvata" });
      setEditEntry(null);
    },
    onError: () => {
      toast({ title: "Errore", variant: "destructive" });
    },
  });

  const entries: ManagerEvalEntry[] = managerEvals.map(ev => {
    const comp = competencies.find(c => c.id === ev.competencyId);
    const calib = calibrations.find(c => c.competencyId === ev.competencyId);
    return {
      competencyId: ev.competencyId,
      competencyName: comp?.name ?? ev.competencyId,
      rating: ev.rating,
      comment: ev.comment,
      calibratedRating: calib?.calibratedRating,
      calibrationReason: calib?.reason ?? undefined,
    };
  });

  function openEdit(entry: ManagerEvalEntry) {
    setEditEntry(entry);
    setCalibForm({
      calibratedRating: entry.calibratedRating ?? entry.rating,
      reason: entry.calibrationReason ?? "",
    });
  }

  function handleSave() {
    if (!editEntry || !selectedEmployee) return;
    const cycle = cycles.find(c => c.id === selectedCycle);
    saveMutation.mutate({
      cycleId: selectedCycle,
      employeeUserId: selectedEmployee.userId,
      competencyId: editEntry.competencyId,
      originalRating: editEntry.rating,
      calibratedRating: calibForm.calibratedRating,
      reason: calibForm.reason,
      year: cycle?.year ?? new Date().getFullYear(),
    });
  }

  return (
    <div className="w-full space-y-6 pt-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          context="PERFORMANCE"
          title="Calibrazione Valutazioni"
          description="Allinea le valutazioni manager prima dei colloqui di feedback"
        />
        <Select value={selectedCycle} onValueChange={v => { setSelectedCycle(v); setSelectedEmployee(null); }}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Seleziona ciclo" />
          </SelectTrigger>
          <SelectContent>
            {cycles.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Employee list */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Dipendenti</CardTitle>
            <CardDescription>Con valutazione manager disponibile</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {employees.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nessuna valutazione disponibile</p>
            ) : (
              <div className="divide-y">
                {employees.map(emp => (
                  <button
                    key={emp.userId}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${selectedEmployee?.userId === emp.userId ? "bg-muted" : ""}`}
                  >
                    <div className="font-medium text-sm">{emp.fullName}</div>
                    <div className="text-xs text-muted-foreground">{emp.email}</div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competency ratings */}
        <Card className="md:col-span-2">
          {!selectedEmployee ? (
            <CardContent className="py-16 text-center text-muted-foreground">
              Seleziona un dipendente per calibrare le valutazioni
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-base">{selectedEmployee.fullName}</CardTitle>
                <CardDescription>Calibra i rating del manager per ogni competenza</CardDescription>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessuna valutazione trovata</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Competenza</TableHead>
                        <TableHead>Rating Manager</TableHead>
                        <TableHead>Rating Calibrato</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map(entry => (
                        <TableRow key={entry.competencyId}>
                          <TableCell className="font-medium">{entry.competencyName}</TableCell>
                          <TableCell><RatingStars value={entry.rating} /></TableCell>
                          <TableCell>
                            {entry.calibratedRating ? (
                              <div>
                                <RatingStars value={entry.calibratedRating} />
                                {entry.calibrationReason && (
                                  <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.calibrationReason}</p>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline">Non calibrato</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editEntry} onOpenChange={open => !open && setEditEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calibra: {editEntry?.competencyName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Rating originale manager</p>
              <RatingStars value={editEntry?.rating ?? 0} />
            </div>
            <div className="space-y-2">
              <Label>Rating calibrato</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(r => (
                  <Button
                    key={r}
                    type="button"
                    variant={calibForm.calibratedRating === r ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setCalibForm(p => ({ ...p, calibratedRating: r }))}
                  >
                    {r}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{RATING_LABELS[calibForm.calibratedRating]}</p>
            </div>
            <div className="space-y-2">
              <Label>Motivazione (opzionale)</Label>
              <Textarea
                value={calibForm.reason}
                onChange={e => setCalibForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="Spiega la modifica al rating..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>Annulla</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>Salva calibrazione</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
