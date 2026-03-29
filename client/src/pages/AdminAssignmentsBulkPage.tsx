import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import PageHeader from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Search, Target, Users, Building, CheckCircle, ArrowRight, ArrowLeft, AlertTriangle, Trash2, ShieldAlert, UserCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User, IndicatorCluster } from "@shared/schema";

interface ObjectiveDictionary {
  id: string;
  title: string;
  description: string;
  indicatorClusterId: string;
  deadline?: number | null;
  indicatorCluster?: {
    id: string;
    name: string;
  };
}

export default function AdminAssignmentsBulkPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isRailOpen, activeSection, setActiveSection, isPanelOpen, setIsPanelOpen, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [mode, setMode] = useState<"bulk" | "single">("bulk");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveDictionary | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [weight, setWeight] = useState<number>(20);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
      setIsPanelOpen(false);
    } else {
      setActiveSection(sectionId);
      setIsPanelOpen(true);
    }
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
    setActiveSection(null);
  };

  const { data: objectivesDictionary = [] } = useQuery<ObjectiveDictionary[]>({
    queryKey: ["/api/objectives-dictionary"],
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const { data: indicatorClusters = [] } = useQuery<IndicatorCluster[]>({
    queryKey: ["/api/indicator-clusters"],
    enabled: !!user,
  });

  const departments = useMemo(() => {
    const depts = new Set<string>();
    allUsers.forEach((u) => {
      if (u.department) depts.add(u.department);
    });
    return Array.from(depts).sort();
  }, [allUsers]);

  const filteredObjectives = useMemo(() => {
    if (!searchQuery) return objectivesDictionary;
    const query = searchQuery.toLowerCase();
    return objectivesDictionary.filter(
      (obj) =>
        obj.title.toLowerCase().includes(query) ||
        obj.description?.toLowerCase().includes(query) ||
        obj.indicatorCluster?.name.toLowerCase().includes(query)
    );
  }, [objectivesDictionary, searchQuery]);

  const objectivesByCluster = useMemo(() => {
    const groups: Record<string, ObjectiveDictionary[]> = {};
    filteredObjectives.forEach((obj) => {
      const clusterName = obj.indicatorCluster?.name || "Altro";
      if (!groups[clusterName]) groups[clusterName] = [];
      groups[clusterName].push(obj);
    });
    return groups;
  }, [filteredObjectives]);

  const usersInDepartment = useMemo(() => {
    if (!selectedDepartment) return [];
    if (selectedDepartment === "all") {
      return allUsers.filter((u) => u.role === "employee");
    }
    return allUsers.filter((u) => u.department === selectedDepartment && u.role === "employee");
  }, [allUsers, selectedDepartment]);

  const filteredUsers = useMemo(() => {
    const employees = allUsers.filter((u) => u.role === "employee");
    if (!userSearchQuery) return employees;
    const q = userSearchQuery.toLowerCase();
    return employees.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        u.matricola?.toLowerCase().includes(q)
    );
  }, [allUsers, userSearchQuery]);

  // Single-person: fetch current assignments for selected user
  type UserAssignment = {
    id: string;
    weight: number;
    status: string;
    objective: { title: string; indicatorCluster?: { name: string } | null };
  };
  const { data: userAssignments = [] } = useQuery<UserAssignment[]>({
    queryKey: ["/api/assignments", selectedUser?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/assignments/${selectedUser!.id}`);
      return res.json();
    },
    enabled: mode === "single" && !!selectedUser,
  });

  const currentWeight = useMemo(
    () => userAssignments.reduce((sum, a) => sum + (a.weight || 0), 0),
    [userAssignments]
  );
  const totalWeightAfter = currentWeight + weight;
  const weightOverflow = mode === "single" && totalWeightAfter > 100;

  // Preview: fetch weight conflicts when entering step 3
  const { data: preview } = useQuery<{
    eligible: { id: string; name: string; currentWeight: number }[];
    skipped: { id: string; name: string; currentWeight: number }[];
    totalUsers: number;
  }>({
    queryKey: ["/api/assignments/bulk-preview", selectedObjective?.id, selectedDepartment, weight],
    queryFn: async () => {
      const params = new URLSearchParams({
        objectiveId: selectedObjective!.id,
        department: selectedDepartment,
        weight: String(weight),
      });
      const res = await apiRequest("GET", `/api/assignments/bulk-preview?${params}`);
      return res.json();
    },
    enabled: step === 3 && !!selectedObjective && !!selectedDepartment,
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/assignments/clear-all", {});
      if (!res.ok) throw new Error((await res.json()).message || "Errore");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === "string" && q.queryKey[0].includes("/api/assignments") });
      queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-with-assignments"] });
      toast({ title: "Disassociazione completata", description: `${data.deletedCount || 0} assegnazioni rimosse` });
      setShowClearConfirm(false);
      setClearConfirmText("");
    },
    onError: (error) => {
      toast({ title: "Errore", description: error instanceof Error ? error.message : "Impossibile completare", variant: "destructive" });
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async (data: { objectiveId: string; department: string; weight: number }) => {
      const res = await apiRequest("POST", "/api/assignments/bulk", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Impossibile completare l'assegnazione");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      let description = `Obiettivo assegnato a ${data.assignedCount} dipendenti`;
      if (data.skippedUsers > 0) description += `. ${data.skippedUsers} esclusi (peso > 100%)`;
      toast({ title: "Assegnazione completata", description });
      setStep(1);
      setSelectedObjective(null);
      setSelectedDepartment("");
      setWeight(20);
    },
    onError: (error) => {
      toast({ title: "Errore", description: error instanceof Error ? error.message : "Impossibile completare l'assegnazione", variant: "destructive" });
    },
  });

  const singleAssignMutation = useMutation({
    mutationFn: async (data: { userId: string; objectiveId: string; weight: number }) => {
      const res = await apiRequest("POST", "/api/assignments", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Impossibile completare l'assegnazione");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === "string" && q.queryKey[0].includes("/api/assignments") });
      toast({ title: "Assegnazione completata", description: `Obiettivo assegnato a ${selectedUser?.firstName} ${selectedUser?.lastName}` });
      setStep(1);
      setSelectedObjective(null);
      setSelectedUser(null);
      setUserSearchQuery("");
      setWeight(20);
    },
    onError: (error) => {
      toast({ title: "Errore", description: error instanceof Error ? error.message : "Impossibile completare l'assegnazione", variant: "destructive" });
    },
  });

  const handleConfirmAssignment = () => {
    if (!selectedObjective) return;
    if (mode === "bulk") {
      if (!selectedDepartment) return;
      bulkAssignMutation.mutate({ objectiveId: selectedObjective.id, department: selectedDepartment, weight });
    } else {
      if (!selectedUser) return;
      singleAssignMutation.mutate({ userId: selectedUser.id, objectiveId: selectedObjective.id, weight });
    }
  };

  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await apiRequest("DELETE", `/api/assignments/${assignmentId}`);
      if (!res.ok) throw new Error("Impossibile rimuovere l'assegnazione");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", selectedUser?.id] });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile disassociare l'obiettivo", variant: "destructive" });
    },
  });

  const switchMode = (newMode: "bulk" | "single") => {
    setMode(newMode);
    setStep(1);
    setSelectedObjective(null);
    setSelectedDepartment("");
    setSelectedUser(null);
    setUserSearchQuery("");
    setSearchQuery("");
    setWeight(20);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return (f + l).toUpperCase() || "?";
  };

  return (
    <>
      <div className="w-full">
        <div className="w-full">
          {/* SIDEBAR CONTAINER - Fixed 312px width, always reserved */}
          <main className="w-full space-y-6 flex flex-col pt-4" >
          <div className="w-full space-y-6">
              <PageHeader
                context="GESTIONE ASSEGNAZIONI"
                title="Assegnazione Obiettivi"
                description="Assegna obiettivi in blocco a un dipartimento, oppure a un singolo dipendente."
              />

              {/* Mode toggle */}
              <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30 gap-1">
                <button
                  onClick={() => switchMode("bulk")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "bulk" ? "bg-white shadow-sm text-slate-900" : "text-muted-foreground hover:text-slate-700"}`}
                >
                  <Users className="h-4 w-4" />
                  Assegnazione massiva
                </button>
                <button
                  onClick={() => switchMode("single")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "single" ? "bg-white shadow-sm text-slate-900" : "text-muted-foreground hover:text-slate-700"}`}
                >
                  <UserCheck className="h-4 w-4" />
                  Singola persona
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    1
                  </div>
                  <span className="font-medium">Obiettivo</span>
                </div>
                <div className="flex-1 h-px bg-border" />
                <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    2
                  </div>
                  <span className="font-medium">{mode === "single" ? "Dipendente" : "Dipartimento"}</span>
                </div>
                <div className="flex-1 h-px bg-border" />
                <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    3
                  </div>
                  <span className="font-medium">Conferma</span>
                </div>
              </div>

              {/* Step 1: Select Objective */}
              {step === 1 && (
                <Card className="md3-surface md3-motion-standard">
                  <CardHeader>
                    <CardTitle className="md3-title-large flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Seleziona Obiettivo
                    </CardTitle>
                    <CardDescription className="md3-body-medium">
                      Scegli l'obiettivo da assegnare in blocco
                    </CardDescription>
                    <div className="relative mt-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca obiettivo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-objective"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="max-h-[400px] overflow-auto">
                    {Object.keys(objectivesByCluster).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nessun obiettivo trovato
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(objectivesByCluster).map(([clusterName, objectives]) => (
                          <div key={clusterName}>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                              {clusterName}
                            </h3>
                            <div className="space-y-2">
                              {objectives.map((obj) => (
                                <div
                                  key={obj.id}
                                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                                    selectedObjective?.id === obj.id
                                      ? "border-primary bg-primary/5"
                                      : "hover-elevate"
                                  }`}
                                  onClick={() => setSelectedObjective(obj)}
                                  data-testid={`objective-${obj.id}`}
                                >
                                  <p className="font-medium text-sm">{obj.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {obj.description || "Nessuna descrizione"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <div className="p-4 border-t flex justify-end">
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!selectedObjective}
                      data-testid="button-next-step1"
                    >
                      Avanti
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Step 2 — Bulk: Select Department and Weight */}
              {step === 2 && mode === "bulk" && (
                <Card className="md3-surface md3-motion-standard">
                  <CardHeader>
                    <CardTitle className="md3-title-large flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Seleziona Dipartimento e Peso
                    </CardTitle>
                    <CardDescription className="md3-body-medium">
                      L'obiettivo "{selectedObjective?.title}" sarà assegnato a tutti i dipendenti del dipartimento selezionato
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="department">Dipartimento</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger id="department" data-testid="select-department">
                          <SelectValue placeholder="Seleziona dipartimento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            Tutti gli utenti
                          </SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso nella Scheda ({weight}%)</Label>
                      <Slider
                        id="weight"
                        min={5}
                        max={100}
                        step={5}
                        value={[weight]}
                        onValueChange={(val) => setWeight(val[0])}
                        className="mt-2"
                        data-testid="slider-weight"
                      />
                      <p className="text-xs text-muted-foreground">
                        Seleziona il peso in percentuale (multipli di 5%)
                      </p>
                    </div>

                    {selectedDepartment && (
                      <div className="p-4 bg-muted rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {usersInDepartment.length} dipendenti{selectedDepartment !== "all" && ` in ${selectedDepartment}`}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {usersInDepartment.slice(0, 5).map((u) => (
                            <Badge key={u.id} variant="secondary">
                              {u.firstName} {u.lastName}
                            </Badge>
                          ))}
                          {usersInDepartment.length > 5 && (
                            <Badge variant="outline">+{usersInDepartment.length - 5} altri</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <div className="p-4 border-t flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Indietro
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!selectedDepartment}
                      data-testid="button-next-step2"
                    >
                      Avanti
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Step 2 — Single: Select Person and Weight */}
              {step === 2 && mode === "single" && (
                <Card className="md3-surface md3-motion-standard">
                  <CardHeader>
                    <CardTitle className="md3-title-large flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Seleziona Dipendente e Peso
                    </CardTitle>
                    <CardDescription className="md3-body-medium">
                      L'obiettivo "{selectedObjective?.title}" sarà assegnato al dipendente selezionato
                    </CardDescription>
                    <div className="relative mt-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca per nome, email, dipartimento..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="max-h-[320px] overflow-auto space-y-1.5 rounded-lg border border-border p-2">
                      {filteredUsers.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">Nessun dipendente trovato</div>
                      ) : (
                        filteredUsers.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className={`flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors ${
                              selectedUser?.id === u.id
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted/50 border border-transparent"
                            }`}
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={u.profileImageUrl || undefined} />
                              <AvatarFallback className="bg-slate-900 text-white text-xs">
                                {getInitials(u.firstName, u.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.department || "—"} · {u.email}</p>
                            </div>
                            {selectedUser?.id === u.id && (
                              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight-single">Peso nella Scheda ({weight}%)</Label>
                      <Slider
                        id="weight-single"
                        min={5}
                        max={100}
                        step={5}
                        value={[weight]}
                        onValueChange={(val) => setWeight(val[0])}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground">Seleziona il peso in percentuale (multipli di 5%)</p>
                    </div>
                  </CardContent>
                  <div className="p-4 border-t flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Indietro
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!selectedUser}
                    >
                      Avanti
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && (
                <Card className="md3-surface md3-motion-standard">
                  <CardHeader>
                    <CardTitle className="md3-title-large flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Conferma Assegnazione
                    </CardTitle>
                    <CardDescription className="md3-body-medium">
                      Verifica i dettagli e conferma l'assegnazione
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Obiettivo</p>
                        <p className="font-medium">{selectedObjective?.title}</p>
                        {selectedObjective?.indicatorCluster && (
                          <Badge variant="outline" className="mt-2">
                            {selectedObjective.indicatorCluster.name}
                          </Badge>
                        )}
                      </div>
                      {mode === "single" ? (
                        <div className="p-4 border rounded-md">
                          <p className="text-xs text-muted-foreground mb-2">Dipendente</p>
                          {selectedUser && (
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarImage src={selectedUser.profileImageUrl || undefined} />
                                <AvatarFallback className="bg-slate-900 text-white text-xs">
                                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{selectedUser.firstName} {selectedUser.lastName}</p>
                                <p className="text-xs text-muted-foreground">{selectedUser.department || "—"}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 border rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">Destinatari</p>
                          <p className="font-medium">{selectedDepartment === "all" ? "Tutti gli utenti" : selectedDepartment}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {preview ? `${preview.eligible.length} di ${preview.totalUsers} dipendenti` : `${usersInDepartment.length} dipendenti`}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Peso</p>
                      <p className="font-medium text-lg">{weight}%</p>
                      <Progress value={weight} className="mt-2 h-2" />
                    </div>
                    {selectedObjective?.deadline && (
                      <div className="p-4 border rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Scadenza / Verifica</p>
                        <p className="font-medium">
                          {new Date((selectedObjective.deadline as unknown as number) * 1000).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Il dipendente riceverà alert 60 e 30 giorni prima</p>
                      </div>
                    )}

                    {/* ── Single mode: peso corrente + overflow alert ── */}
                    {mode === "single" && (
                      <div className="rounded-lg border border-border overflow-hidden">
                        {/* Weight bar */}
                        <div className="p-4 bg-muted/30 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Peso attuale</span>
                            <span className="font-semibold">{currentWeight}%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Nuovo obiettivo</span>
                            <span className="font-semibold">+{weight}%</span>
                          </div>
                          <div className="h-px bg-border" />
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold">Totale dopo assegnazione</span>
                            <span className={`font-bold text-base ${totalWeightAfter > 100 ? "text-red-600" : totalWeightAfter === 100 ? "text-amber-600" : "text-emerald-600"}`}>
                              {totalWeightAfter}%
                            </span>
                          </div>
                          {/* Stacked bar: current (slate) + new (indigo) + overflow (red) */}
                          <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
                            <div className="h-full bg-slate-500 transition-all" style={{ width: `${Math.min(currentWeight, 100)}%` }} />
                            <div
                              className={`h-full transition-all ${totalWeightAfter > 100 ? "bg-red-500" : "bg-indigo-500"}`}
                              style={{ width: `${Math.min(weight, 100 - Math.min(currentWeight, 100))}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Già assegnato</span>
                            <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full inline-block ${totalWeightAfter > 100 ? "bg-red-500" : "bg-indigo-500"}`} /> Nuovo</span>
                          </div>
                        </div>

                        {/* Overflow: show current objectives with unassign buttons */}
                        {weightOverflow && userAssignments.length > 0 && (
                          <div className="border-t border-border">
                            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-200">
                              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                              <p className="text-sm font-semibold text-red-800">
                                Il peso supererebbe il 100%. Disassocia uno o più obiettivi per liberare spazio.
                              </p>
                            </div>
                            <div className="divide-y divide-border">
                              {userAssignments.map((a) => (
                                <div key={a.id} className="flex items-center justify-between px-4 py-3">
                                  <div className="flex-1 min-w-0 mr-3">
                                    <p className="text-sm font-medium truncate">{a.objective.title}</p>
                                    {a.objective.indicatorCluster && (
                                      <p className="text-xs text-muted-foreground">{a.objective.indicatorCluster.name}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${a.weight >= 30 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                                      {a.weight}%
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8 px-3 text-xs"
                                      onClick={() => removeAssignmentMutation.mutate(a.id)}
                                      disabled={removeAssignmentMutation.isPending}
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Disassocia
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* OK state */}
                        {!weightOverflow && (
                          <div className="border-t border-border px-4 py-3 flex items-center gap-2 bg-emerald-50">
                            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                            <p className="text-sm text-emerald-800 font-medium">
                              {totalWeightAfter === 100 ? "Il peso raggiungerà esattamente il 100%." : `Rimane ${100 - totalWeightAfter}% disponibile dopo l'assegnazione.`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Bulk mode: weight overflow warnings ── */}
                    {mode === "bulk" && preview && preview.skipped.length > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-300 rounded-md space-y-3">
                        <div className="flex items-center gap-2 text-amber-800">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <p className="font-semibold text-sm">
                            {preview.skipped.length} {preview.skipped.length === 1 ? "dipendente superererebbe" : "dipendenti supererebbero"} il 100% — {preview.skipped.length === 1 ? "verrà escluso" : "verranno esclusi"}
                          </p>
                        </div>
                        <div className="space-y-1 max-h-[120px] overflow-auto">
                          {preview.skipped.map((u) => (
                            <div key={u.id} className="flex items-center justify-between text-xs text-amber-700 bg-amber-100 rounded px-2 py-1">
                              <span>{u.name}</span>
                              <span className="font-semibold">{u.currentWeight}% già assegnato → {u.currentWeight + weight}% con nuovo</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-amber-600">
                          Per assegnare l'obiettivo anche a questi utenti, riduci il peso o disassocia prima alcuni obiettivi.
                        </p>
                      </div>
                    )}

                    {mode === "bulk" && preview && preview.eligible.length === 0 && (
                      <div className="p-4 bg-red-50 border border-red-300 rounded-md">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertTriangle className="h-4 w-4" />
                          <p className="font-semibold text-sm">Nessun utente può ricevere questo obiettivo con il peso selezionato</p>
                        </div>
                        <p className="text-xs text-red-600 mt-1">Tutti i dipendenti supererebbero il 100%. Riduci il peso o disassocia prima degli obiettivi.</p>
                      </div>
                    )}

                    {mode === "bulk" && preview && preview.eligible.length > 0 && (
                      <div className="p-4 bg-muted rounded-md">
                        <p className="font-medium text-sm mb-3">Dipendenti che riceveranno l'obiettivo ({preview.eligible.length}):</p>
                        <div className="space-y-2 max-h-[200px] overflow-auto">
                          {preview.eligible.map((u) => (
                            <div key={u.id} className="flex items-center justify-between p-2 bg-background rounded">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {u.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm font-medium">{u.name}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">{u.currentWeight}% → {u.currentWeight + weight}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <div className="p-4 border-t flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Indietro
                    </Button>
                    <Button
                      onClick={handleConfirmAssignment}
                      disabled={
                        bulkAssignMutation.isPending ||
                        singleAssignMutation.isPending ||
                        (mode === "single" && weightOverflow) ||
                        (mode === "bulk" && preview !== undefined && preview.eligible.length === 0)
                      }
                      data-testid="button-confirm-bulk"
                    >
                      {(bulkAssignMutation.isPending || singleAssignMutation.isPending) ? "Assegnazione in corso..." : "Conferma Assegnazione"}
                    </Button>
                  </div>
              </Card>
            )}

              {/* Danger Zone */}
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-800 text-sm uppercase tracking-wide">Zona di Pericolo</h3>
                </div>
                <p className="text-sm text-red-700">
                  Disassocia tutti gli obiettivi da tutti i dipendenti. <strong>L'operazione è irreversibile</strong> — gli obiettivi rimarranno nel dizionario ma tutte le assegnazioni verranno eliminate definitivamente.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { setShowClearConfirm(true); setClearConfirmText(""); }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Disassocia tutti gli obiettivi
                </Button>
              </div>
          </div>
        </main>

          <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-5 w-5" />
                  Disassocia tutti gli obiettivi
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">Stai per rimuovere <strong>tutte le assegnazioni</strong> da <strong>tutti i dipendenti</strong>. Questa azione <strong>non può essere annullata</strong>.</span>
                  <span className="block text-sm">Digita <strong>CONFERMA</strong> per procedere:</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                placeholder="Digita CONFERMA"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                className="border-destructive/50 focus-visible:ring-destructive"
              />
              <div className="flex gap-3 justify-end mt-2">
                <AlertDialogCancel onClick={() => setClearConfirmText("")}>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearConfirmText !== "CONFERMA" || clearAllMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
                >
                  {clearAllMutation.isPending ? "Rimozione in corso..." : "Disassocia tutti"}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          {isActionsPanelOpen && (
            <AppActionsPanel
              isOpen={isActionsPanelOpen}
              onClose={() => setIsActionsPanelOpen(false)}
              title="Assegnazione Massiva"
            >
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Procedura Guidata</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</div>
                  <span className={step >= 1 ? "font-medium" : "text-muted-foreground"}>Seleziona Obiettivo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</div>
                  <span className={step >= 2 ? "font-medium" : "text-muted-foreground"}>Seleziona Dipartimento</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>3</div>
                  <span className={step >= 3 ? "font-medium" : "text-muted-foreground"}>Conferma e Assegna</span>
                </div>
              </div>
            </div>

            {selectedObjective && (
              <div className="pt-4 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Obiettivo Selezionato</p>
                <div className="p-2 rounded-lg bg-primary/10">
                  <p className="text-sm font-medium">{selectedObjective.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedObjective.indicatorCluster?.name}</p>
                </div>
              </div>
            )}

            {selectedDepartment && (
              <div className="pt-4 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Dipartimento</p>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <p className="text-sm font-medium">{selectedDepartment}</p>
                  <p className="text-xs text-muted-foreground">
                    {usersInDepartment.length} {usersInDepartment.length === 1 ? "dipendente" : "dipendenti"}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Assegna rapidamente lo stesso obiettivo a tutti i dipendenti di un dipartimento specificato.
              </p>
            </div>
          </AppActionsPanel>
          )}
      </div>
    </div>
    </>
  );
}
