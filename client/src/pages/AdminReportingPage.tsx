import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Target, Users, CheckCircle2, XCircle, TrendingUp, Hash, ToggleLeft, BarChart3 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, Objective, ObjectivesDictionary, IndicatorCluster, CalculationType, ObjectiveAssignment } from "@shared/schema";

interface ObjectiveWithAssignments {
  dictionary: ObjectivesDictionary;
  indicatorCluster: IndicatorCluster | null;
  calculationType: CalculationType | null;
  assignedUsers: { user: User; assignment: ObjectiveAssignment; objective: Objective }[];
}

export default function AdminReportingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [clusterFilter, setClusterFilter] = useState<string>("all");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveWithAssignments | null>(null);
  const [reportValue, setReportValue] = useState<string>("");
  const [qualitativeResult, setQualitativeResult] = useState<string>("");

  const style = {
    "--sidebar-width": "16rem",
  };

  const { data: objectivesWithAssignments = [], isLoading } = useQuery<ObjectiveWithAssignments[]>({
    queryKey: ["/api/objectives-with-assignments"],
    enabled: !!user,
  });

  const { data: clusters = [] } = useQuery<IndicatorCluster[]>({
    queryKey: ["/api/indicator-clusters"],
    enabled: !!user,
  });

  const reportMutation = useMutation({
    mutationFn: async (data: { dictionaryId: string; actualValue?: number; qualitativeResult?: string }) => {
      const res = await apiRequest("PATCH", `/api/dictionary/${data.dictionaryId}/report`, {
        actualValue: data.actualValue,
        qualitativeResult: data.qualitativeResult,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-with-assignments"] });
      toast({ title: "Rendicontazione salvata con successo" });
      setReportDialogOpen(false);
      setSelectedObjective(null);
      setReportValue("");
      setQualitativeResult("");
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile salvare la rendicontazione",
        variant: "destructive",
      });
    },
  });

  const filteredObjectives = useMemo(() => {
    let filtered = objectivesWithAssignments;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const title = item.dictionary?.title || "";
        const description = item.dictionary?.description || "";
        return title.toLowerCase().includes(query) || description.toLowerCase().includes(query);
      });
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.dictionary?.objectiveType === typeFilter);
    }

    if (clusterFilter !== "all") {
      filtered = filtered.filter((item) => item.indicatorCluster?.id === clusterFilter);
    }

    return filtered;
  }, [objectivesWithAssignments, searchQuery, typeFilter, clusterFilter]);

  const stats = useMemo(() => {
    const total = objectivesWithAssignments.length;
    const numeric = objectivesWithAssignments.filter((o) => o.dictionary.objectiveType === "numeric").length;
    const qualitative = objectivesWithAssignments.filter((o) => o.dictionary.objectiveType === "qualitative").length;
    const reported = objectivesWithAssignments.filter((o) => o.dictionary.reportedAt).length;
    return { total, numeric, qualitative, reported };
  }, [objectivesWithAssignments]);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return `${f}${l}`.toUpperCase() || "U";
  };

  const openReportDialog = (item: ObjectiveWithAssignments) => {
    setSelectedObjective(item);
    setReportValue(item.dictionary.actualValue?.toString() || "");
    setQualitativeResult(item.dictionary.qualitativeResult || "");
    setReportDialogOpen(true);
  };

  const handleCloseReportDialog = (open: boolean) => {
    if (!open) {
      // Reset values when dialog is closed
      setReportValue("");
      setQualitativeResult("");
      setSelectedObjective(null);
    }
    setReportDialogOpen(open);
  };

  const handleSaveReport = () => {
    if (!selectedObjective) return;

    if (selectedObjective.dictionary.objectiveType === "numeric") {
      const numValue = parseFloat(reportValue);
      if (isNaN(numValue)) {
        toast({ title: "Inserisci un valore numerico valido", variant: "destructive" });
        return;
      }
      reportMutation.mutate({
        dictionaryId: selectedObjective.dictionary.id,
        actualValue: numValue,
      });
    } else {
      if (!qualitativeResult) {
        toast({ title: "Seleziona se l'obiettivo è stato raggiunto", variant: "destructive" });
        return;
      }
      reportMutation.mutate({ dictionaryId: selectedObjective.dictionary.id, qualitativeResult });
    }
  };

  const getProgressColor = (item: ObjectiveWithAssignments) => {
    if (!item.dictionary.reportedAt) return "secondary";
    if (item.dictionary.objectiveType === "qualitative") {
      if (item.dictionary.qualitativeResult === "reached") return "default";
      if (item.dictionary.qualitativeResult === "partial") return "secondary"; // Yellow/neutral for partial
      return "destructive";
    }
    // For numeric objectives, check the qualitative result set by backend
    if (item.dictionary.qualitativeResult === "reached") return "default"; // Green
    if (item.dictionary.qualitativeResult === "partial") return "secondary"; // Yellow for partial
    return "destructive"; // Red for not_reached
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AppHeader
            userName={user?.firstName || "Admin"}
            userRole="Amministratore"
            showSidebarTrigger={true}
          />

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-1 flex items-center gap-2">
                  <BarChart3 className="h-8 w-8" />
                  Rendicontazione Obiettivi
                </h1>
                <p className="text-muted-foreground">
                  Gestisci la rendicontazione degli obiettivi assegnati
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Totale Obiettivi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold" data-testid="text-total-objectives">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Numerici
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold" data-testid="text-numeric-objectives">{stats.numeric}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4" />
                      Qualitativi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold" data-testid="text-qualitative-objectives">{stats.qualitative}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Rendicontati
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold" data-testid="text-reported-objectives">{stats.reported}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle>Obiettivi e Rendicontazione</CardTitle>
                      <CardDescription>
                        Inserisci i valori di rendicontazione per ogni obiettivo
                      </CardDescription>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-3 flex-wrap">
                      <div className="flex-1 min-w-[250px]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Cerca per titolo o descrizione..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            data-testid="input-search"
                          />
                        </div>
                      </div>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[150px]" data-testid="select-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti i tipi</SelectItem>
                          <SelectItem value="numeric">Numerici</SelectItem>
                          <SelectItem value="qualitative">Qualitativi</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={clusterFilter} onValueChange={setClusterFilter}>
                        <SelectTrigger className="w-[200px]" data-testid="select-cluster">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti i cluster</SelectItem>
                          {clusters.map((cluster) => (
                            <SelectItem key={cluster.id} value={cluster.id}>
                              {cluster.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                  ) : filteredObjectives.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nessun obiettivo trovato
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Obiettivo</TableHead>
                            <TableHead>Cluster</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Target</TableHead>
                            <TableHead className="text-right">Rendicontato</TableHead>
                            <TableHead>Utenti Assegnati</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredObjectives.map((item) => {
                            const isReported = !!item.dictionary.reportedAt;
                            const isNumeric = item.dictionary.objectiveType === "numeric";

                            return (
                              <TableRow key={item.dictionary.id} data-testid={`row-objective-${item.dictionary.id}`}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {item.dictionary?.title || "Obiettivo senza titolo"}
                                    </p>
                                    {item.dictionary?.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {item.dictionary.description}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {item.indicatorCluster ? (
                                    <Badge variant="outline">{item.indicatorCluster.name}</Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {isNumeric ? "Numerico" : "Qualitativo"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {isNumeric
                                    ? item.dictionary?.targetValue
                                      ? Number(item.dictionary.targetValue).toLocaleString()
                                      : "-"
                                    : "Raggiunto/Non raggiunto"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {isReported ? (
                                    isNumeric ? (
                                      item.dictionary.actualValue
                                        ? Number(item.dictionary.actualValue).toLocaleString()
                                        : "-"
                                    ) : (
                                      <div className="flex items-center justify-end gap-1">
                                        {item.dictionary.qualitativeResult === "reached" ? (
                                          <>
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            <span className="text-green-600">Raggiunto</span>
                                          </>
                                        ) : (
                                          <>
                                            <XCircle className="h-4 w-4 text-red-600" />
                                            <span className="text-red-600">Non raggiunto</span>
                                          </>
                                        )}
                                      </div>
                                    )
                                  ) : (
                                    <span className="text-muted-foreground">Da rendicontare</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {item.assignedUsers.length} {item.assignedUsers.length === 1 ? "utente" : "utenti"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getProgressColor(item)}>
                                    {isReported ? (
                                      item.dictionary.qualitativeResult === "reached" ? "Raggiunto" :
                                      item.dictionary.qualitativeResult === "partial" ? "Raggiunto parzialmente" :
                                      "Non raggiunto"
                                    ) : "In attesa"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant={isReported ? "outline" : "default"}
                                    onClick={() => openReportDialog(item)}
                                    data-testid={`button-report-${item.dictionary.id}`}
                                  >
                                    {isReported ? "Modifica" : "Rendiconta"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>

      <Dialog open={reportDialogOpen} onOpenChange={handleCloseReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rendicontazione Obiettivo</DialogTitle>
            <DialogDescription>
              {selectedObjective?.dictionary?.title || "Obiettivo"}
            </DialogDescription>
          </DialogHeader>

          {selectedObjective && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">{selectedObjective.dictionary?.objectiveType === "numeric" ? "Numerico" : "Qualitativo"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Assegnato a</p>
                  <p className="font-medium">{selectedObjective.assignedUsers.length} {selectedObjective.assignedUsers.length === 1 ? "utente" : "utenti"}</p>
                </div>
                {selectedObjective.dictionary?.objectiveType === "numeric" && selectedObjective.dictionary?.targetValue && (
                  <div>
                    <p className="text-muted-foreground">Target</p>
                    <p className="font-medium">{Number(selectedObjective.dictionary.targetValue).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {selectedObjective.dictionary?.objectiveType === "numeric"
                    ? "Valore Rendicontato"
                    : "Risultato"}
                </label>
                {selectedObjective.dictionary?.objectiveType === "numeric" ? (
                  <Input
                    type="number"
                    placeholder="Inserisci il valore raggiunto"
                    value={reportValue}
                    onChange={(e) => setReportValue(e.target.value)}
                    data-testid="input-report-value"
                  />
                ) : (
                  <Select value={qualitativeResult} onValueChange={setQualitativeResult}>
                    <SelectTrigger data-testid="select-qualitative-result">
                      <SelectValue placeholder="Seleziona il risultato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reached">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Raggiunto
                        </div>
                      </SelectItem>
                      <SelectItem value="not_reached">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Non raggiunto
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)} data-testid="button-cancel-report">
              Annulla
            </Button>
            <Button onClick={handleSaveReport} disabled={reportMutation.isPending} data-testid="button-save-report">
              {reportMutation.isPending ? "Salvataggio..." : "Salva Rendicontazione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
