import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TabelloneObjective {
  assignmentId: string;
  dictionaryId: string;
  title: string;
  description?: string;
  objectiveType?: string;
  targetValue?: number | null;
  actualValue?: number | null;
  qualitativeResult?: string | null;
  dataSource?: string | null;
  dataSourceEmail?: string | null;
  progress: number;
  status: string;
  weight: number;
}

interface TabelloneRow {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    department?: string;
  };
  objectives: TabelloneObjective[];
}

export default function RendicontatorePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedObj, setSelectedObj] = useState<TabelloneObjective | null>(null);
  const [actualValue, setActualValue] = useState("");
  const [qualitativeResult, setQualitativeResult] = useState("");
  const [notes, setNotes] = useState("");

  // Redirect if not authorized
  if (user && user.role !== "admin" && !(user as any).isRendicontatore) {
    setLocation("/");
    return null;
  }

  const { data: rows = [], isLoading } = useQuery<TabelloneRow[]>({
    queryKey: ["/api/tabellone"],
    enabled: !!user,
  });

  // Flatten all objectives with user info
  const allObjectives = rows.flatMap((row) =>
    row.objectives.map((obj) => ({ ...obj, user: row.user }))
  );

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedObj?.dictionaryId) throw new Error("No dictionary id");
      const payload: Record<string, any> = { notes };
      // Detect objectiveType: if targetValue is set, treat as numeric
      if (selectedObj.targetValue != null) {
        payload.actualValue = parseFloat(actualValue);
      } else {
        payload.qualitativeResult = qualitativeResult;
      }
      const res = await apiRequest("PATCH", `/api/dictionary/${selectedObj.dictionaryId}/report`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/tabellone"] });
      toast({ title: "Rendicontazione salvata" });
      setSelectedObj(null);
      setActualValue(""); setQualitativeResult(""); setNotes("");
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile salvare.", variant: "destructive" });
    },
  });

  const openForm = (obj: TabelloneObjective & { user: TabelloneRow["user"] }) => {
    setSelectedObj(obj);
    setActualValue(obj.actualValue != null ? String(obj.actualValue) : "");
    setQualitativeResult(obj.qualitativeResult ?? "");
    setNotes("");
  };

  const isNumeric = selectedObj?.targetValue != null;
  const isValid = isNumeric
    ? actualValue !== "" && !isNaN(parseFloat(actualValue))
    : qualitativeResult !== "";

  const qrLabel = (r?: string | null) => {
    if (r === "reached") return <Badge className="bg-emerald-100 text-emerald-700">Raggiunto</Badge>;
    if (r === "partial") return <Badge className="bg-amber-100 text-amber-700">Parziale</Badge>;
    if (r === "not_reached") return <Badge className="bg-red-100 text-red-700">Non raggiunto</Badge>;
    return <span className="text-slate-400 text-xs">—</span>;
  };

  return (
    <>
      <PageHeader
        context="RENDICONTAZIONE"
        title="Rendiconta Obiettivi"
        description="Inserisci i valori consuntivi degli obiettivi MBO di tua competenza"
      />

      <Card>
        <CardHeader>
          <CardTitle>Obiettivi da rendicontare</CardTitle>
          <CardDescription>
            Sono visibili gli obiettivi la cui fonte dati è associata alla tua email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-400 text-sm py-8 text-center">Caricamento...</p>
          ) : allObjectives.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-sm">Nessun obiettivo assegnato alla tua email come fonte dati.</p>
              <p className="text-slate-400 text-xs">Chiedi all'amministratore di configurare la tua email nel campo "Email Responsabile Fonte" degli obiettivi.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Obiettivo</TableHead>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Consuntivo</TableHead>
                  <TableHead>Esito</TableHead>
                  <TableHead>Fonte Dati</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {allObjectives.map((obj, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="truncate">{obj.title}</div>
                      {obj.dataSource && (
                        <div className="text-[10px] text-slate-400 truncate">{obj.dataSource}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {obj.user.firstName} {obj.user.lastName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {obj.targetValue != null ? obj.targetValue : <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {obj.actualValue != null ? obj.actualValue : <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell>{qrLabel(obj.qualitativeResult)}</TableCell>
                    <TableCell className="text-xs text-slate-400">{obj.dataSourceEmail || "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openForm(obj as any)}>
                        {obj.actualValue != null || obj.qualitativeResult ? (
                          <><CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />Aggiorna</>
                        ) : (
                          <><Clock className="h-3.5 w-3.5 mr-1" />Rendiconta</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form dialog */}
      <Dialog open={!!selectedObj} onOpenChange={(open) => !open && setSelectedObj(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rendiconta: {selectedObj?.title}</DialogTitle>
            <DialogDescription>
              {selectedObj?.dataSource && `Fonte: ${selectedObj.dataSource}`}
              {selectedObj?.targetValue != null && ` · Target: ${selectedObj.targetValue}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isNumeric ? (
              <div className="space-y-2">
                <Label>Valore Consuntivo *</Label>
                <Input
                  type="number"
                  step="any"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  placeholder={selectedObj?.targetValue != null ? `Target: ${selectedObj.targetValue}` : ""}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Risultato *</Label>
                <Select value={qualitativeResult} onValueChange={setQualitativeResult}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il risultato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reached">Raggiunto</SelectItem>
                    <SelectItem value="partial">Parzialmente raggiunto</SelectItem>
                    <SelectItem value="not_reached">Non raggiunto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Aggiungi note..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedObj(null)}>Annulla</Button>
            <Button onClick={() => reportMutation.mutate()} disabled={!isValid || reportMutation.isPending}>
              {reportMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
