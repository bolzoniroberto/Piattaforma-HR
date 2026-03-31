import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import EmployeeCard from "@/components/EmployeeCard";
import DocumentList, { type Document } from "@/components/DocumentList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, AlertCircle, Target, Users, Leaf, Building, Calculator, Euro, TrendingUp, BarChart3, CheckCircle2, XCircle, Check, LayoutDashboard, HelpCircle, ChevronDown, Clock } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useRail } from "@/contexts/RailContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ObjectiveAssignment, Document as DocumentType, IndicatorCluster, CalculationType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import StatusBadge, { type ObjectiveStatus } from "@/components/StatusBadge";

interface EnrichedObjective {
  id: string;
  title: string;
  description: string;
  clusterName: string;
  clusterId: string;
  calculationTypeName: string;
  calculationTypeId: string;
  status: ObjectiveStatus;
  deadline?: string;
  deadlineTs?: number | null;
  daysToDeadline?: number | null;
  progress: number;
  weight: number;
  economicValue: number;
  objectiveType?: string;
  targetValue?: number | null;
  thresholdValue?: number | null;
  actualValue?: number | null;
  qualitativeResult?: string | null;
  reportedAt?: Date | null;
}
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function EmployeeDashboard() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection } = useRail();
  const [showRegulationModal, setShowRegulationModal] = useState(false);
  const [showRegulationDialog, setShowRegulationDialog] = useState(false);

  // Fetch user's objectives
  const { data: objectiveAssignments = [], isLoading: assignmentsLoading } = useQuery<
    Array<ObjectiveAssignment & { objective: any }>
  >({
    queryKey: ["/api/my-objectives"],
    enabled: !!user,
  });

  // Fetch documents
  const { data: allDocuments = [], isLoading: documentsLoading } = useQuery<DocumentType[]>({
    queryKey: ["/api/documents"],
    enabled: !!user,
  });

  // Fetch user stats
  const { data: stats } = useQuery<{
    totalObjectives: number;
    completedObjectives: number;
  }>({
    queryKey: ["/api/my-stats"],
    enabled: !!user,
  });

  // Fetch document acceptances
  const { data: acceptedDocs = [] } = useQuery<Array<{ documentId: string }>>({
    queryKey: ["/api/my-acceptances"],
    enabled: !!user,
  });

  // Fetch MBO cycle
  const { data: cycleData } = useQuery<{ name: string; startDate: string; endDate: string }>({
    queryKey: ["/api/settings/cycle"],
    enabled: !!user,
  });

  const cycleLabel = cycleData?.name || String(new Date().getFullYear());
  const cyclePeriod = cycleData?.startDate && cycleData?.endDate
    ? `${new Date(cycleData.startDate).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })} – ${new Date(cycleData.endDate).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}`
    : null;


  // Mutation for updating objective status
  const updateObjectiveMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; status: string; progress?: number }) => {
      const res = await apiRequest("PATCH", `/api/assignments/${data.assignmentId}`, {
        status: data.status,
        progress: data.progress,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-stats"] });
      toast({ title: "Obiettivo aggiornato con successo" });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare l'obiettivo",
        variant: "destructive",
      });
    },
  });

  // Mutation for accepting MBO regulation
  const acceptRegulationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/accept-mbo-regulation", {});
      return res.json();
    },
    onSuccess: () => {
      // Invalidate user query to refetch user with updated mboRegulationAcceptedAt
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowRegulationModal(false);
      toast({ 
        title: "Regolamento accettato",
        description: "Hai accettato il regolamento MBO con successo"
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile accettare il regolamento",
        variant: "destructive",
      });
    },
  });

  // Mutation for reading FAQs
  const readFaqMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/read-faq", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ 
        title: "FAQ consultate",
        description: "Abbiamo registrato che hai letto le FAQ"
      });
    },
  });

  // Transform API data to component format
  const employee = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      role: "Employee",
      department: user.department || "N/A",
      totalObjectives: stats?.totalObjectives || 0,
      completedObjectives: stats?.completedObjectives || 0,
      clusters: [],
      ral: parseFloat(String(user.ral || 0)),
      mboPercentage: user.mboPercentage || 0,
    };
  }, [user, stats]);

  // Calculate MBO target value
  const mboTarget = useMemo(() => {
    if (!employee) return 0;
    return employee.ral * (employee.mboPercentage / 100);
  }, [employee]);

  // Overall progress (weighted by objective weight, based on reported status)
  const hasRendicontazione = useMemo(() => {
    return objectiveAssignments.some(a => (a.objective as any)?.reportedAt);
  }, [objectiveAssignments]);

  const overallProgress = useMemo(() => {
    if (objectiveAssignments.length === 0) return 0;
    if (!hasRendicontazione) return 0;
    let totalWeight = 0;
    let weightedProgress = 0;
    objectiveAssignments.forEach(a => {
      const weight = a.weight || 0;
      totalWeight += weight;

      const obj = a.objective as any;
      let progressValue = 0;
      if (obj?.reportedAt) {
        if (obj.qualitativeResult === "reached") progressValue = 100;
        else if (obj.qualitativeResult === "partial") progressValue = 50;
        else progressValue = 0;
      }
      weightedProgress += progressValue * weight;
    });
    if (totalWeight === 0) return 0;
    return Math.round(weightedProgress / totalWeight);
  }, [objectiveAssignments]);

  // Total assigned weight
  const totalWeight = useMemo(() => {
    return objectiveAssignments.reduce((sum, a) => sum + (a.weight || 0), 0);
  }, [objectiveAssignments]);

  const objectives: EnrichedObjective[] = useMemo(() => {
    return objectiveAssignments.map((assignment) => {
      const weight = assignment.weight || 0;
      const economicValue = mboTarget * (weight / 100);
      const obj = assignment.objective as any;
      
      return {
        id: assignment.id,
        title: obj?.title || "N/A",
        description: obj?.description || "",
        clusterName: obj?.indicatorCluster?.name || "N/A",
        clusterId: obj?.indicatorCluster?.id || "",
        calculationTypeName: obj?.calculationType?.name || "N/A",
        calculationTypeId: obj?.calculationType?.id || "",
        status: assignment.status as ObjectiveStatus,
        deadline: obj?.deadline
          ? new Date(obj.deadline * 1000).toLocaleDateString("it-IT")
          : undefined,
        deadlineTs: obj?.deadline ?? null,
        daysToDeadline: obj?.deadline
          ? Math.ceil((obj.deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        progress: assignment.progress || 0,
        weight,
        economicValue,
        objectiveType: obj?.objectiveType,
        targetValue: obj?.targetValue,
        thresholdValue: obj?.thresholdValue,
        actualValue: obj?.actualValue,
        qualitativeResult: obj?.qualitativeResult,
        reportedAt: obj?.reportedAt,
      };
    });
  }, [objectiveAssignments, mboTarget]);

  // Deadline alerts: objectives with deadline in ≤60 days and not completed
  const deadlineAlerts = useMemo(() => {
    return objectives
      .filter(o =>
        o.daysToDeadline !== null &&
        o.daysToDeadline !== undefined &&
        o.daysToDeadline <= 60 &&
        o.status !== "completato"
      )
      .sort((a, b) => (a.daysToDeadline ?? 0) - (b.daysToDeadline ?? 0));
  }, [objectives]);

  // Group objectives by cluster
  const objectivesByCluster = useMemo(() => {
    const map = new Map<string, { clusterName: string; clusterId: string; totalWeight: number; objectives: EnrichedObjective[] }>();
    objectives.forEach(obj => {
      if (!map.has(obj.clusterId)) {
        map.set(obj.clusterId, { clusterName: obj.clusterName, clusterId: obj.clusterId, totalWeight: 0, objectives: [] });
      }
      const cluster = map.get(obj.clusterId)!;
      cluster.objectives.push(obj);
      cluster.totalWeight += obj.weight;
    });
    return Array.from(map.values());
  }, [objectives]);

  const documents: Document[] = useMemo(() => {
    const acceptedDocIds = new Set(acceptedDocs.map((d) => d.documentId));
    return allDocuments.map((doc) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description || "",
      type: doc.type as "regulation" | "policy" | "contract",
      date: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("it-IT") : "N/A",
      requiresAcceptance: doc.requiresAcceptance,
      accepted: acceptedDocIds.has(doc.id),
    }));
  }, [allDocuments, acceptedDocs]);

  // Generate natural language activity feed
  const activityFeed = useMemo(() => {
    if (!user) return [];
    const activities: Array<{ id: string; title: string; description: string; icon: any; color: string }> = [];

    // 1. Regulation Activity
    if (!user.mboRegulationAcceptedAt) {
      activities.push({
        id: "reg-pending",
        title: "Compliance Necessaria",
        description: "Non hai ancora firmato il regolamento MBO. È importante farlo per sbloccare tutte le funzionalità.",
        icon: AlertCircle,
        color: "bg-amber-100 text-amber-600"
      });
    } else {
      activities.push({
        id: "reg-signed",
        title: "Regolamento Firmato",
        description: `Ottimo! Hai firmato il regolamento MBO il ${new Date(user.mboRegulationAcceptedAt * 1000).toLocaleDateString("it-IT")}. Sei in regola!`,
        icon: CheckCircle2,
        color: "bg-emerald-100 text-emerald-600"
      });
    }

    // 2. FAQ Activity
    if (!user.faqReadAt) {
      activities.push({
        id: "faq-pending",
        title: "Dubbi sulla piattaforma?",
        description: "Ti consigliamo di leggere le FAQ per chiarire ogni dubbio sul calcolo dei premi e sugli obiettivi.",
        icon: HelpCircle,
        color: "bg-blue-100 text-blue-600"
      });
    } else {
      activities.push({
        id: "faq-read",
        title: "FAQ Consultate",
        description: "Hai già letto le FAQ. Resta sintonizzato per nuovi aggiornamenti sulle policy!",
        icon: HelpCircle,
        color: "bg-slate-100 text-slate-600"
      });
    }

    // 3. Objectives Activity (Top 2 based on deadline urgency)
    const urgentObjectives = [...objectives]
      .filter(o => o.status !== "completato")
      .sort((a, b) => (a.daysToDeadline ?? 999) - (b.daysToDeadline ?? 999))
      .slice(0, 2);

    urgentObjectives.forEach(obj => {
      let desc = "";
      if (obj.daysToDeadline !== null && obj.daysToDeadline !== undefined) {
        if (obj.daysToDeadline < 0) {
          desc = `L'obiettivo "${obj.title}" è scaduto da ${Math.abs(obj.daysToDeadline)} giorni. Parlane con il tuo manager.`;
        } else if (obj.daysToDeadline === 0) {
          desc = `Oggi è l'ultimo giorno per completare "${obj.title}"! Sei al ${obj.progress}%, manca poco!`;
        } else if (obj.daysToDeadline < 10) {
          desc = `Mancano solo ${obj.daysToDeadline} giorni alla scadenza di "${obj.title}". Sei al ${obj.progress}%, forza!`;
        } else {
          desc = `Hai ancora ${obj.daysToDeadline} giorni per "${obj.title}". Sei al ${obj.progress}%, continua così!`;
        }
      } else {
        desc = `L'obiettivo "${obj.title}" è al ${obj.progress}%. Mantieni il ritmo!`;
      }

      activities.push({
        id: `obj-${obj.id}`,
        title: "Focus Obiettivo",
        description: desc,
        icon: Target,
        color: obj.progress >= 100 ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
      });
    });

    return activities;
  }, [user, objectives]);

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  const isLoading = userLoading || assignmentsLoading || documentsLoading;
  const isAdmin = user?.role === "admin";
  const regulationNotAccepted = user && !user.mboRegulationAcceptedAt;

  if (!employee) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Non autenticato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Effettua il login per accedere alla Piattaforma Talent.
            </p>
            <Button onClick={() => (window.location.href = "/api/login")} className="w-full">
              Accedi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show modal if regulation not accepted - wrapped in useEffect to prevent infinite re-render
  useEffect(() => {
    if (regulationNotAccepted && !showRegulationModal) {
      setShowRegulationModal(true);
    }
  }, [regulationNotAccepted, showRegulationModal]);

  // Regulation view modal (dialog) - defined before any usage
  const regulationViewDialog = (
    <Dialog open={showRegulationDialog} onOpenChange={setShowRegulationDialog}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-view-regulation">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">
            Regolamento della Piattaforma Talent
          </DialogTitle>
          <DialogDescription>
            Consulta il regolamento completo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong>Regolamento della Piattaforma Talent</strong>
          </p>
          
          <p>
            La presente piattaforma di gestione degli Obiettivi di Management by Objectives (MBO) è uno strumento aziendale dedicato alla gestione, monitoraggio e valutazione degli obiettivi lavorativi. Tutti gli utenti della piattaforma sono tenuti a leggere e accettare le seguenti condizioni di utilizzo:
          </p>

          <p>
            <strong>1. Scopo e Utilizzo</strong><br />
            La piattaforma è destinata alla gestione degli obiettivi MBO per i dipendenti dell'azienda. Gli utenti si impegnano a utilizzare la piattaforma in conformità alle politiche aziendali e alle normative vigenti.
          </p>

          <p>
            <strong>2. Riservatezza e Protezione dei Dati</strong><br />
            Tutti i dati personali e le informazioni sensibili contenute nella piattaforma sono soggetti alla normativa sulla privacy aziendale e alle normative sulla protezione dei dati (GDPR). Gli utenti si impegnano a mantenere la riservatezza delle informazioni.
          </p>

          <p>
            <strong>3. Integrità dei Dati</strong><br />
            Gli utenti sono responsabili dell'accuratezza e della completezza dei dati che inseriscono nella piattaforma. È vietato modificare, eliminare o alterare i dati di altri utenti.
          </p>

          <p>
            <strong>4. Obiettivi e Rendicontazione</strong><br />
            Gli obiettivi assegnati devono essere rendicontati con accuratezza. La falsificazione dei dati di rendicontazione può comportare conseguenze disciplinari.
          </p>

          <p>
            <strong>5. Accesso e Autorizzazione</strong><br />
            L'accesso alla piattaforma è limitato al personale autorizzato. Ogni utente è responsabile della confidenzialità delle proprie credenziali di accesso.
          </p>

          <p>
            <strong>6. Conformità Normativa</strong><br />
            L'utilizzo della piattaforma è soggetto alle leggi e ai regolamenti applicabili. Qualsiasi utilizzo non autorizzato è vietato.
          </p>

          <p className="pt-2 border-t">
            Accettando questo regolamento, dichiari di aver letto e compreso le condizioni di utilizzo della Piattaforma Talent e ti impegni a rispettarle.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Content to render (same for both admin and employee)
  const dashboardContent = (
    <div className="w-full space-y-8 pb-10">
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Caricamento dati...</p>
        </div>
      ) : (
        <>
          {/* Deadline Alerts */}
          {deadlineAlerts.length > 0 && (
            <div className="space-y-2">
              {deadlineAlerts.map(obj => {
                const isUrgent = (obj.daysToDeadline ?? 999) <= 30;
                return (
                  <div
                    key={obj.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${
                      isUrgent
                        ? "bg-red-50 border-red-200 text-red-800"
                        : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}
                  >
                    <Clock className={`h-4 w-4 mt-0.5 shrink-0 ${isUrgent ? "text-red-600" : "text-amber-600"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold">{obj.title}</span>
                      {" "}—{" "}
                      {obj.daysToDeadline !== null && obj.daysToDeadline !== undefined && obj.daysToDeadline <= 0
                        ? <span className="font-bold">Scaduto!</span>
                        : <>
                            scade il <span className="font-semibold">{obj.deadline}</span>
                            {" "}(<span className="font-bold">{obj.daysToDeadline} giorni</span>)
                          </>
                      }
                      {" "}— Avanzamento: <span className="font-semibold">{obj.progress}%</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold shrink-0 ${
                      isUrgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {isUrgent ? "Urgente" : "In scadenza"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top Section: Overall Achievement + Dark Summary Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[320px]">
            {/* Main Rendicontazione Card (White) */}
            <Card className="lg:col-span-2 bg-white border-slate-200 shadow-none flex flex-col justify-between p-8">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">
                  {cyclePeriod ?? cycleLabel}
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {cycleLabel}
                </h2>
              </div>

              {!hasRendicontazione ? (
                <div className="flex flex-col justify-center flex-1 mt-8">
                  <div className="text-2xl font-bold text-slate-400 tracking-tight">Non ancora rendicontata</div>
                  <p className="text-sm text-slate-400 mt-2">Il payout sarà calcolato al completamento della rendicontazione.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-end mt-8 relative">
                    <div className="text-slate-900">
                      <span className="text-[5rem] font-bold leading-none tracking-tighter" style={{ fontSize: '100px' }}>
                        {overallProgress}
                      </span>
                      <span className="text-3xl font-bold ml-2">%</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">PAYOUT STIMATO</div>
                      <div className="text-xl font-bold text-slate-900">
                        €{Math.round(mboTarget * overallProgress / 100).toLocaleString("it-IT")}
                      </div>
                    </div>
                    {/* Decorative Chart placeholder */}
                    <div className="absolute top-0 right-10 bottom-0 w-32 opacity-10 flex gap-2 items-end">
                      <div className="w-4 bg-slate-900 h-1/4"></div>
                      <div className="w-4 bg-slate-900 h-2/4"></div>
                      <div className="w-4 bg-slate-900 h-3/4"></div>
                      <div className="w-4 bg-slate-900 h-full"></div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="w-full flex h-3 bg-slate-100 mb-2 relative">
                      <div className="bg-slate-700 h-full" style={{ width: `${Math.min(overallProgress, 100)}%` }}></div>
                      {overallProgress > 100 && (
                        <div className="absolute right-0 top-0 h-full bg-emerald-500" style={{ width: `${Math.min(overallProgress - 100, 20)}%` }}></div>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                      <span>BASE: 0%</span>
                      <span>THRESHOLD: 70%</span>
                      <span>TARGET: 100%</span>
                      <span>STRETCH: 120%</span>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Dark Target Card */}
            <Card className="lg:col-span-1 bg-[#111827] text-white border-0 shadow-none flex flex-col justify-between rounded-xl overflow-hidden p-8 h-full">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                   <Target className="h-4 w-4 text-white" />
                 </div>
                 <div className="border border-white/20 px-2 py-1 text-[9px] uppercase tracking-widest font-bold rounded">
                   TALENT MODEL {new Date().getFullYear()}
                 </div>
              </div>
              
              <div className="space-y-8 flex-1 flex flex-col justify-center">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-white/50 mb-2 uppercase">
                    MBO Target Value
                  </div>
                  <div className="text-[32px] font-semibold tracking-tight font-serif">
                    € {mboTarget.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="w-full h-px bg-white/10 my-1"></div>

                <div>
                  <div className="text-[10px] font-bold tracking-widest text-white/50 mb-2 uppercase">
                    Estimated Payout
                  </div>
                  <div className="text-[40px] font-semibold tracking-tight leading-none font-serif">
                    € {((mboTarget * overallProgress) / 100).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <Button className="w-full mt-8 bg-white text-slate-900 hover:bg-white/90 font-bold py-6 rounded-md">
                View Detail Report
              </Button>
            </Card>
          </div>

          <div className="w-full my-8">
             <div className="flex justify-between items-end mb-6">
                <h3 className="text-xl font-bold text-slate-900">Objective Clusters</h3>
                <span className="text-xs font-semibold text-slate-500">Last calculated: 15 mins ago</span>
             </div>
             
             {/* Objective Clusters — grouped by cluster */}
             <div className="space-y-10">
               {objectivesByCluster.map((cluster) => (
                 <div key={cluster.clusterId}>
                   {/* Cluster header */}
                   <div className="flex items-center justify-between mb-4">
                     <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">{cluster.clusterName}</h4>
                     <span className="text-[10px] font-bold tracking-widest uppercase bg-slate-100 text-slate-600 px-3 py-1 rounded">
                       PESO CLUSTER: {cluster.totalWeight}%
                     </span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {cluster.objectives.map((objective) => (
                       <Card key={objective.id} className="bg-white border-slate-200 shadow-none rounded-xl overflow-hidden relative" style={{ minHeight: '220px' }}>
                         <div className="h-1 w-full bg-slate-800 absolute top-0 left-0"></div>
                         <CardContent className="p-6 pt-8 flex flex-col h-full justify-between">
                           <div className="flex justify-between items-start mb-6">
                             <div className="w-10 h-10 bg-slate-50 rounded flex items-center justify-center">
                               <BarChart3 className="w-5 h-5 text-slate-700" />
                             </div>
                             <div className="bg-blue-50 text-blue-800 px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded">
                               WEIGHT: {objective.weight}%
                             </div>
                           </div>
                           <div className="mb-6">
                             <h4 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{objective.title}</h4>
                             <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                               {objective.description || "Corporate performance indicators and metrics."}
                             </p>
                             {objective.deadline && (
                               <div className={`inline-flex items-center gap-1 mt-2 text-[10px] font-semibold px-2 py-0.5 rounded ${
                                 (objective.daysToDeadline ?? 999) <= 30
                                   ? "bg-red-100 text-red-700"
                                   : (objective.daysToDeadline ?? 999) <= 60
                                   ? "bg-amber-100 text-amber-700"
                                   : "bg-slate-100 text-slate-600"
                               }`}>
                                 <Clock className="h-3 w-3" />
                                 Scadenza: {objective.deadline}
                               </div>
                             )}
                           </div>
                           <div className="mt-auto">
                             <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 pb-2">
                               <span>Score</span>
                               <span className={objective.progress > 100 ? "text-emerald-600" : "text-slate-900"}>
                                 {objective.progress}%{objective.progress > 100 && " ↑"}
                               </span>
                             </div>
                             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div
                                 className={`h-full rounded-full ${objective.progress > 100 ? "bg-emerald-500" : "bg-slate-700"}`}
                                 style={{ width: `${Math.min(objective.progress, 100)}%` }}
                               ></div>
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Compliance & Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
            {/* Compliance & Acceptance */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Compliance & Acceptance</h3>
                  <p className="text-xs text-slate-500">Cycle Q3 Policy Finalization</p>
                </div>
              </div>
              <div className="w-full h-px bg-slate-200 my-4" />
              {documents.filter(d => d.requiresAcceptance && !d.accepted).length === 0 ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Tutto in regola</p>
                    <p className="text-xs text-green-600">Hai accettato tutti i documenti richiesti.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {documents.filter(d => d.requiresAcceptance && !d.accepted).map(doc => (
                    <div key={doc.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                          {doc.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{doc.description}</p>}
                          <div className="flex items-center gap-1 mt-2">
                            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-xs font-semibold text-red-600">Awaiting Digital Signature</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                {documents.filter(d => d.requiresAcceptance && !d.accepted).length > 0 ? (
                  <>
                    <Button
                      className="flex-1 bg-slate-900 text-white hover:bg-slate-700 font-bold"
                      onClick={() => setShowRegulationModal(true)}
                    >
                      Finalize & Accept
                    </Button>
                    <Button variant="outline" className="flex-1 font-semibold text-slate-600">
                      Request Clarification
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full font-semibold text-slate-600" onClick={() => setShowRegulationModal(false)}>
                    Visualizza Documenti
                  </Button>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
                <TrendingUp className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-5">
                {activityFeed.length > 0 ? (
                  activityFeed.map((activity) => (
                    <div key={activity.id} className="flex gap-4 group">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${activity.color}`}>
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{activity.title}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {activity.description}
                        </p>
                        {activity.id === "faq-pending" && (
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-[10px] font-bold text-indigo-600 mt-2 uppercase tracking-widest"
                            onClick={() => readFaqMutation.mutate()}
                          >
                            Segna come lette →
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Nessuna attività</p>
                      <p className="text-xs text-slate-500 mt-0.5">Le attività appariranno qui man mano che il ciclo procede</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );


  // Regulation acceptance modal
  const regulationModal = (
    <AlertDialog open={showRegulationModal} onOpenChange={setShowRegulationModal}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-regulation-required">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Accettazione Regolamento MBO
          </AlertDialogTitle>
          <AlertDialogDescription>
            È necessario leggere e accettare il regolamento MBO prima di proseguire
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 my-4 text-sm text-muted-foreground max-h-[40vh] overflow-y-auto">
          <p>
            <strong>Regolamento della Piattaforma Talent</strong>
          </p>

          <p>
            La presente piattaforma di gestione degli Obiettivi di Management by Objectives (MBO) è uno strumento aziendale dedicato alla gestione, monitoraggio e valutazione degli obiettivi lavorativi. Tutti gli utenti della piattaforma sono tenuti a leggere e accettare le seguenti condizioni di utilizzo:
          </p>

          <p>
            <strong>1. Scopo e Utilizzo</strong><br />
            La piattaforma è destinata alla gestione degli obiettivi MBO per i dipendenti dell'azienda. Gli utenti si impegnano a utilizzare la piattaforma in conformità alle politiche aziendali e alle normative vigenti.
          </p>

          <p>
            <strong>2. Riservatezza e Protezione dei Dati</strong><br />
            Tutti i dati personali e le informazioni sensibili contenute nella piattaforma sono soggetti alla normativa sulla privacy aziendale e alle normative sulla protezione dei dati (GDPR). Gli utenti si impegnano a mantenere la riservatezza delle informazioni.
          </p>

          <p>
            <strong>3. Integrità dei Dati</strong><br />
            Gli utenti sono responsabili dell'accuratezza e della completezza dei dati che inseriscono nella piattaforma. È vietato modificare, eliminare o alterare i dati di altri utenti.
          </p>

          <p>
            <strong>4. Obiettivi e Rendicontazione</strong><br />
            Gli obiettivi assegnati devono essere rendicontati con accuratezza. La falsificazione dei dati di rendicontazione può comportare conseguenze disciplinari.
          </p>

          <p>
            <strong>5. Accesso e Autorizzazione</strong><br />
            L'accesso alla piattaforma è limitato al personale autorizzato. Ogni utente è responsabile della confidenzialità delle proprie credenziali di accesso.
          </p>

          <p>
            <strong>6. Conformità Normativa</strong><br />
            L'utilizzo della piattaforma è soggetto alle leggi e ai regolamenti applicabili. Qualsiasi utilizzo non autorizzato è vietato.
          </p>

          <p className="pt-2">
            Accettando questo regolamento, dichiari di aver letto e compreso le condizioni di utilizzo della Piattaforma Talent e ti impegni a rispettarle.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <AlertDialogCancel
            data-testid="button-skip-regulation"
            disabled={acceptRegulationMutation.isPending}
          >
            Accetta in seguito
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => acceptRegulationMutation.mutate()}
            disabled={acceptRegulationMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-accept-regulation"
          >
            {acceptRegulationMutation.isPending ? "Registrazione in corso..." : "Accetto"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );

  // New full-viewport layout matching "Enterprise HR"
  return (
    <div className="w-full font-sans text-slate-900 pb-8">
      {regulationModal}
      {regulationViewDialog}
      {dashboardContent}
    </div>
  );
}
