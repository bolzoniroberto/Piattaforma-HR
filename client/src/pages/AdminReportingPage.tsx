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
  objective: Objective;
  dictionary: ObjectivesDictionary | null;
  indicatorCluster: IndicatorCluster | null;
  calculationType: CalculationType | null;
  assignedUsers: { user: User; assignment: ObjectiveAssignment }[];
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
    mutationFn: async (data: { objectiveId: string; actualValue?: number; qualitativeResult?: string }) => {
      const res = await apiRequest("PATCH", `/api/objectives/${data.objectiveId}/report`, {
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
    const numeric = objectivesWithAssignments.filter((o) => o.dictionary?.objectiveType === "numeric").length;
    const qualitative = objectivesWithAssignments.filter((o) => o.dictionary?.objectiveType === "qualitative").length;
    const reported = objectivesWithAssignments.filter((o) => o.objective.reportedAt).length;
    return { total, numeric, qualitative, reported };
  }, [objectivesWithAssignments]);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return `${f}${l}`.toUpperCase() || "U";
  };

  const openReportDialog = (item: ObjectiveWithAssignments) => {
    setSelectedObjective(item);
    setReportValue(item.objective.actualValue?.toString() || "");
    setQualitativeResult(item.objective.qualitativeResult || "");
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

    if (selectedObjective.dictionary?.objectiveType === "numeric") {
      const numValue = parseFloat(reportValue);
      if (isNaN(numValue)) {
        toast({ title: "Inserisci un valore numerico valido", variant: "destructive" });
        return;
      }
      reportMutation.mutate({ 
        objectiveId: selectedObjective.objective.id, 
        actualValue: numValue,
      });
    } else {
      if (!qualitativeResult) {
        toast({ title: "Seleziona se l'obiettivo è stato raggiunto", variant: "destructive" });
        return;
      }
      reportMutation.mutate({ objectiveId: selectedObjective.objective.id, qualitativeResult });
    }
  };

  const getProgressColor = (item: ObjectiveWithAssignments) => {
    if (!item.objective.reportedAt) return "secondary";
    if (item.dictionary?.objectiveType === "qualitative") {
      return item.objective.qualitativeResult === "reached" ? "default" : "destructive";
    }
    if (item.dictionary?.targetValue && item.objective.actualValue) {
      const target = parseFloat(String(item.dictionary.targetValue));
      const actual = parseFloat(String(item.objective.actualValue));
      const percentage = (actual / target) * 100;
      if (percentage >= 100) return "default";
      if (percentage >= 75) return "secondary";
      return "destructive";
    }
    return "secondary";
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
                            const isReported = !!item.objective.reportedAt;
                            const isNumeric = item.dictionary?.objectiveType === "numeric";

                            return (
                              <TableRow key={item.objective.id} data-testid={`row-objective-${item.objective.id}`}>
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
                                <TableCell>
                                  <Badge variant={isNumeric ? "default" : "secondary"}>
                                    {isNumeric ? "Numerico" : "Qualitativo"}
                                  </Badge>
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
                                      item.objective.actualValue
                                        ? Number(item.objective.actualValue).toLocaleString()
                                        : "-"
                                    ) : (
                                      <div className="flex items-center justify-end gap-1">
                                        {item.objective.qualitativeResult === "reached" ? (
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
                                <TableCell>
                                  <div className="flex -space-x-2">
                                    {item.assignedUsers.slice(0, 3).map(({ user: assignedUser }) => (
                                      <Avatar key={assignedUser.id} className="h-6 w-6 border-2 border-background">
                                        {assignedUser.profileImageUrl && (
                                          <AvatarImage src={assignedUser.profileImageUrl} />
                                        )}
                                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                          {getInitials(assignedUser.firstName, assignedUser.lastName)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                    {item.assignedUsers.length > 3 && (
                                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                        +{item.assignedUsers.length - 3}
                                      </div>
                                    )}
                                    {item.assignedUsers.length === 0 && (
                                      <span className="text-muted-foreground text-sm">Nessuno</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getProgressColor(item)}>
                                    {isReported ? "Rendicontato" : "In attesa"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant={isReported ? "outline" : "default"}
                                    onClick={() => openReportDialog(item)}
                                    data-testid={`button-report-${item.objective.id}`}
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
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tipo: <span className="font-medium text-foreground">
                    {selectedObjective.dictionary?.objectiveType === "numeric" ? "Numerico" : "Qualitativo"}
                  </span>
                </p>
                {selectedObjective.dictionary?.objectiveType === "numeric" && selectedObjective.dictionary?.targetValue && (
                  <p className="text-sm text-muted-foreground">
                    Target: <span className="font-medium text-foreground">
                      {Number(selectedObjective.dictionary.targetValue).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Utenti assegnati ({selectedObjective.assignedUsers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedObjective.assignedUsers.map(({ user: assignedUser }) => (
                    <Badge key={assignedUser.id} variant="outline" className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">
                          {getInitials(assignedUser.firstName, assignedUser.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      {assignedUser.firstName} {assignedUser.lastName}
                    </Badge>
                  ))}
                </div>
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
