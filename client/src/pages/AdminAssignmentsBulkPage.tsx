import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Search, Target, Users, Building, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, IndicatorCluster } from "@shared/schema";

interface ObjectiveDictionary {
  id: string;
  title: string;
  description: string;
  indicatorClusterId: string;
  indicatorCluster?: {
    id: string;
    name: string;
  };
}

export default function AdminAssignmentsBulkPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveDictionary | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [weight, setWeight] = useState<number>(20);

  const style = {
    "--sidebar-width": "16rem",
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
    return allUsers.filter((u) => u.department === selectedDepartment && u.role === "employee");
  }, [allUsers, selectedDepartment]);

  const bulkAssignMutation = useMutation({
    mutationFn: async (data: { objectiveId: string; department: string; weight: number }) => {
      const res = await apiRequest("POST", "/api/assignments/bulk", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Assegnazione completata",
        description: `Obiettivo assegnato a ${data.assignedCount || usersInDepartment.length} dipendenti`,
      });
      setStep(1);
      setSelectedObjective(null);
      setSelectedDepartment("");
      setWeight(20);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile completare l'assegnazione",
        variant: "destructive",
      });
    },
  });

  const handleConfirmAssignment = () => {
    if (!selectedObjective || !selectedDepartment) return;
    bulkAssignMutation.mutate({
      objectiveId: selectedObjective.id,
      department: selectedDepartment,
      weight,
    });
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return (f + l).toUpperCase() || "?";
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
            <div className="max-w-5xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-2">Assegnazione Obiettivi in Bulk</h1>
                <p className="text-muted-foreground">
                  Assegna un obiettivo a tutti i dipendenti di un dipartimento
                </p>
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
                  <span className="font-medium">Dipartimento</span>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Seleziona Obiettivo
                    </CardTitle>
                    <CardDescription>
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

              {/* Step 2: Select Department and Weight */}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Seleziona Dipartimento e Peso
                    </CardTitle>
                    <CardDescription>
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
                            {usersInDepartment.length} dipendenti in {selectedDepartment}
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

              {/* Step 3: Confirm */}
              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Conferma Assegnazione
                    </CardTitle>
                    <CardDescription>
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
                      <div className="p-4 border rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Dipartimento</p>
                        <p className="font-medium">{selectedDepartment}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {usersInDepartment.length} dipendenti
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Peso</p>
                      <p className="font-medium text-lg">{weight}%</p>
                      <Progress value={weight} className="mt-2 h-2" />
                    </div>

                    <div className="p-4 bg-muted rounded-md">
                      <p className="font-medium text-sm mb-3">Dipendenti che riceveranno l'obiettivo:</p>
                      <div className="space-y-2 max-h-[200px] overflow-auto">
                        {usersInDepartment.map((u) => (
                          <div key={u.id} className="flex items-center gap-3 p-2 bg-background rounded">
                            <Avatar className="h-8 w-8">
                              {u.profileImageUrl && (
                                <AvatarImage src={u.profileImageUrl} alt={u.firstName || ""} />
                              )}
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(u.firstName, u.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 border-t flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Indietro
                    </Button>
                    <Button
                      onClick={handleConfirmAssignment}
                      disabled={bulkAssignMutation.isPending}
                      data-testid="button-confirm-bulk"
                    >
                      {bulkAssignMutation.isPending ? "Assegnazione in corso..." : "Conferma Assegnazione"}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
