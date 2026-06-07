import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Users, Target, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  mboPercentage?: number;
  managerId?: string;
}

interface ObjDictionary {
  id: string;
  title: string;
  description?: string | null;
  objectiveType: string;
  targetValue?: number | null;
  indicatorClusterId?: string | null;
}

interface Assignment {
  id: string;
  weight: number;
  status: string;
  objective?: { dictionaryId: string; id: string };
  dictionary?: { title: string; objectiveType: string };
}

interface Cluster {
  id: string;
  name: string;
}

type WizardStep = 1 | 2 | 3 | 4;
type Mode = "pick" | "create";

interface WizardState {
  step: WizardStep;
  selectedUser: TeamMember | null;
  mode: Mode;
  selectedDictionaryId: string | null;
  newObj: {
    title: string;
    description: string;
    objectiveType: "numeric" | "qualitative";
    targetValue: string;
    thresholdValue: string;
    clusterId: string;
  };
  weight: number;
}

const INITIAL_STATE: WizardState = {
  step: 1,
  selectedUser: null,
  mode: "pick",
  selectedDictionaryId: null,
  newObj: {
    title: "",
    description: "",
    objectiveType: "numeric",
    targetValue: "",
    thresholdValue: "",
    clusterId: "",
  },
  weight: 0,
};

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: WizardStep }) {
  const steps = ["Collaboratore", "Obiettivo", "Peso", "Conferma"];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const n = (i + 1) as WizardStep;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  done ? "bg-emerald-500 text-white" :
                  active ? "bg-slate-900 text-white" :
                  "bg-slate-100 text-slate-400"
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              <span className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                active ? "text-slate-900" : "text-slate-400"
              )}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "w-16 h-0.5 mx-2 mb-5 transition-colors",
                done ? "bg-emerald-500" : "bg-slate-200"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ManagerMboAssignPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wizard, setWizard] = useState<WizardState>(INITIAL_STATE);

  const { data: teamMembers = [], isLoading: loadingTeam } = useQuery<TeamMember[]>({
    queryKey: ["/api/manager/mbo/team-members"],
    enabled: !!user,
  });

  const { data: allObjectives = [] } = useQuery<ObjDictionary[]>({
    queryKey: ["/api/manager/mbo/objectives"],
    enabled: !!user,
  });

  const { data: clusters = [] } = useQuery<Cluster[]>({
    queryKey: ["/api/indicator-clusters"],
    enabled: !!user,
  });

  const { data: userAssignments = [], isLoading: loadingAssignments } = useQuery<Assignment[]>({
    queryKey: [`/api/manager/mbo/team-member/${wizard.selectedUser?.id}/assignments`],
    enabled: !!wizard.selectedUser,
  });

  const currentTotalWeight = userAssignments.reduce((sum, a) => sum + (a.weight || 0), 0);
  const remainingWeight = 100 - currentTotalWeight;

  const alreadyAssignedDictIds = new Set(
    userAssignments.map(a => a.objective?.dictionaryId).filter(Boolean)
  );
  const availableObjectives = allObjectives.filter(o => !alreadyAssignedDictIds.has(o.id));

  const selectedDict = allObjectives.find(o => o.id === wizard.selectedDictionaryId) ?? null;

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (wizard.mode === "pick") {
        const res = await apiRequest("POST", "/api/manager/mbo/assignments", {
          userId: wizard.selectedUser!.id,
          dictionaryId: wizard.selectedDictionaryId!,
          weight: wizard.weight,
        });
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/manager/mbo/assignments/new", {
          userId: wizard.selectedUser!.id,
          weight: wizard.weight,
          title: wizard.newObj.title,
          description: wizard.newObj.description || null,
          objectiveType: wizard.newObj.objectiveType,
          targetValue: wizard.newObj.targetValue ? parseFloat(wizard.newObj.targetValue) : null,
          thresholdValue: wizard.newObj.thresholdValue ? parseFloat(wizard.newObj.thresholdValue) : null,
          clusterId: wizard.newObj.clusterId,
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/manager/mbo/team-member/${wizard.selectedUser?.id}/assignments`],
      });
      toast({ title: "Obiettivo assegnato con successo" });
      setWizard(INITIAL_STATE);
    },
    onError: (err: any) => {
      toast({
        title: "Errore nell'assegnazione",
        description: err?.message || "Riprova",
        variant: "destructive",
      });
    },
  });

  // ─── Validity checks per step ────────────────────────────────────────────────
  const step2Valid = wizard.mode === "pick"
    ? !!wizard.selectedDictionaryId
    : wizard.newObj.title.trim() !== "" && !!wizard.newObj.clusterId;
  const step3Valid = wizard.weight > 0 && wizard.weight <= remainingWeight;

  // ─── Step navigation ─────────────────────────────────────────────────────────
  const goTo = (s: WizardStep) => setWizard(w => ({ ...w, step: s }));

  // ─── Render steps ────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        context="MBO TEAM"
        title="Assegna Obiettivi al tuo Team"
        description="Assegna o crea obiettivi MBO per i tuoi collaboratori diretti."
      />

      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <StepIndicator step={wizard.step} />

          {/* ── STEP 1: select collaborator ── */}
          {wizard.step === 1 && (
            <div className="space-y-4">
              <CardTitle className="text-base mb-4">Scegli il collaboratore</CardTitle>
              {loadingTeam ? (
                <p className="text-sm text-muted-foreground text-center py-8">Caricamento...</p>
              ) : teamMembers.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-sm">Nessun collaboratore con MBO attivo assegnato a te.</p>
                  <p className="text-slate-400 text-xs">Chiedi all'amministratore di impostare il campo Responsabile (managerId) per i tuoi collaboratori.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teamMembers.map((member) => {
                    const isSelected = wizard.selectedUser?.id === member.id;
                    return (
                      <div
                        key={member.id}
                        onClick={() => setWizard(w => ({ ...w, selectedUser: member }))}
                        className={cn(
                          "border rounded-xl p-4 cursor-pointer transition-all space-y-1",
                          isSelected
                            ? "border-slate-900 bg-slate-50 shadow-sm ring-2 ring-slate-900/10"
                            : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-slate-900">
                            {member.firstName} {member.lastName}
                          </p>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        {member.department && (
                          <p className="text-xs text-slate-500">{member.department}</p>
                        )}
                        {member.mboPercentage != null && (
                          <Badge variant="outline" className="text-[10px]">
                            MBO {member.mboPercentage}%
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button onClick={() => goTo(2)} disabled={!wizard.selectedUser}>
                  Avanti <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: pick or create objective ── */}
          {wizard.step === 2 && (
            <div className="space-y-5">
              <div>
                <CardTitle className="text-base">
                  Obiettivo per {wizard.selectedUser?.firstName} {wizard.selectedUser?.lastName}
                </CardTitle>
                {loadingAssignments ? (
                  <p className="text-xs text-muted-foreground mt-1">Caricamento assegnazioni...</p>
                ) : (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Peso assegnato</span>
                      <span className={currentTotalWeight >= 100 ? "text-red-600 font-bold" : "font-medium text-slate-700"}>
                        {currentTotalWeight}% / 100%
                      </span>
                    </div>
                    <Progress value={currentTotalWeight} className="h-2" />
                  </div>
                )}
              </div>

              {currentTotalWeight >= 100 ? (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-red-700">Peso massimo raggiunto</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Questo collaboratore ha già il 100% di peso assegnato. Non è possibile aggiungere altri obiettivi.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mode toggle */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={wizard.mode === "pick" ? "default" : "outline"}
                      onClick={() => setWizard(w => ({ ...w, mode: "pick", selectedDictionaryId: null }))}
                    >
                      <Target className="h-3.5 w-3.5 mr-1.5" />
                      Dal catalogo
                    </Button>
                    <Button
                      size="sm"
                      variant={wizard.mode === "create" ? "default" : "outline"}
                      onClick={() => setWizard(w => ({ ...w, mode: "create", selectedDictionaryId: null }))}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Crea nuovo
                    </Button>
                  </div>

                  {/* Already assigned (read-only) */}
                  {userAssignments.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Già assegnati</p>
                      <div className="space-y-1.5">
                        {userAssignments.map((a) => (
                          <div key={a.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-slate-700 truncate max-w-[280px]">
                              {(a as any).objective?.title || a.objective?.dictionaryId || a.id}
                            </span>
                            <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{a.weight}%</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pick from catalogue */}
                  {wizard.mode === "pick" && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Disponibili ({availableObjectives.length})
                      </p>
                      {availableObjectives.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">Tutti gli obiettivi del catalogo sono già assegnati.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {availableObjectives.map((obj) => {
                            const isSelected = wizard.selectedDictionaryId === obj.id;
                            return (
                              <div
                                key={obj.id}
                                onClick={() => setWizard(w => ({ ...w, selectedDictionaryId: obj.id }))}
                                className={cn(
                                  "border rounded-lg p-3 cursor-pointer transition-all",
                                  isSelected
                                    ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                                    : "border-slate-200 hover:border-slate-400"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5 min-w-0">
                                    <p className="font-medium text-sm text-slate-900 truncate">{obj.title}</p>
                                    {obj.description && (
                                      <p className="text-xs text-slate-500 line-clamp-2">{obj.description}</p>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    <Badge variant="outline" className="text-[10px]">
                                      {obj.objectiveType === "numeric" ? "Quantitativo" : "Qualitativo"}
                                    </Badge>
                                    {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create new */}
                  {wizard.mode === "create" && (
                    <div className="space-y-4 border rounded-xl p-4 bg-slate-50/50">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nuovo obiettivo</p>
                      <div className="space-y-2">
                        <Label>Titolo *</Label>
                        <Input
                          placeholder="Es. Incremento fatturato area Nord"
                          value={wizard.newObj.title}
                          onChange={e => setWizard(w => ({ ...w, newObj: { ...w.newObj, title: e.target.value } }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrizione</Label>
                        <Textarea
                          rows={2}
                          placeholder="Descrizione opzionale..."
                          value={wizard.newObj.description}
                          onChange={e => setWizard(w => ({ ...w, newObj: { ...w.newObj, description: e.target.value } }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo *</Label>
                          <Select
                            value={wizard.newObj.objectiveType}
                            onValueChange={v => setWizard(w => ({ ...w, newObj: { ...w.newObj, objectiveType: v as "numeric" | "qualitative" } }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="numeric">Quantitativo</SelectItem>
                              <SelectItem value="qualitative">Qualitativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Cluster / Area *</Label>
                          <Select
                            value={wizard.newObj.clusterId}
                            onValueChange={v => setWizard(w => ({ ...w, newObj: { ...w.newObj, clusterId: v } }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona..." />
                            </SelectTrigger>
                            <SelectContent>
                              {clusters.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {wizard.newObj.objectiveType === "numeric" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Target</Label>
                            <Input
                              type="number"
                              step="any"
                              placeholder="Es. 100"
                              value={wizard.newObj.targetValue}
                              onChange={e => setWizard(w => ({ ...w, newObj: { ...w.newObj, targetValue: e.target.value } }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Soglia minima</Label>
                            <Input
                              type="number"
                              step="any"
                              placeholder="Es. 80"
                              value={wizard.newObj.thresholdValue}
                              onChange={e => setWizard(w => ({ ...w, newObj: { ...w.newObj, thresholdValue: e.target.value } }))}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => goTo(1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
                </Button>
                <Button
                  onClick={() => goTo(3)}
                  disabled={currentTotalWeight >= 100 || !step2Valid}
                >
                  Avanti <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: set weight ── */}
          {wizard.step === 3 && (
            <div className="space-y-5">
              <div>
                <CardTitle className="text-base mb-1">Imposta il peso</CardTitle>
                <p className="text-sm text-slate-500">
                  {wizard.mode === "pick" ? selectedDict?.title : wizard.newObj.title}
                  {" "}·{" "}
                  <span className="capitalize">
                    {wizard.mode === "pick"
                      ? (selectedDict?.objectiveType === "numeric" ? "Quantitativo" : "Qualitativo")
                      : (wizard.newObj.objectiveType === "numeric" ? "Quantitativo" : "Qualitativo")}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Peso attuale: {currentTotalWeight}%</span>
                  <span>Disponibile: <strong>{remainingWeight}%</strong></span>
                </div>
                <Progress value={currentTotalWeight} className="h-2" />
              </div>

              <div>
                <Label className="mb-3 block">Seleziona peso *</Label>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].filter(v => v <= remainingWeight).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setWizard(w => ({ ...w, weight: v }))}
                      className={cn(
                        "w-14 h-10 rounded-lg border text-sm font-semibold transition-all",
                        wizard.weight === v
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                      )}
                    >
                      {v}%
                    </button>
                  ))}
                  {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].filter(v => v <= remainingWeight).length === 0 && (
                    <p className="text-sm text-red-500">Nessun peso disponibile (multipli di 5).</p>
                  )}
                </div>
              </div>

              {wizard.weight > 0 && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
                  Totale dopo assegnazione:{" "}
                  <strong className={currentTotalWeight + wizard.weight > 100 ? "text-red-600" : "text-slate-900"}>
                    {currentTotalWeight + wizard.weight}%
                  </strong>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => goTo(2)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
                </Button>
                <Button onClick={() => goTo(4)} disabled={!step3Valid}>
                  Avanti <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: confirm ── */}
          {wizard.step === 4 && (
            <div className="space-y-5">
              <CardTitle className="text-base">Conferma assegnazione</CardTitle>

              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                <SummaryRow label="Collaboratore">
                  <span className="font-semibold">
                    {wizard.selectedUser?.firstName} {wizard.selectedUser?.lastName}
                  </span>
                  {wizard.selectedUser?.department && (
                    <span className="text-slate-500 text-xs ml-1.5">— {wizard.selectedUser.department}</span>
                  )}
                </SummaryRow>
                <SummaryRow label="Obiettivo">
                  <span className="font-semibold">
                    {wizard.mode === "pick" ? selectedDict?.title : wizard.newObj.title}
                  </span>
                  {wizard.mode === "create" && (
                    <Badge variant="outline" className="text-[10px] ml-1.5">Nuovo</Badge>
                  )}
                </SummaryRow>
                <SummaryRow label="Tipo">
                  <span>
                    {(wizard.mode === "pick" ? selectedDict?.objectiveType : wizard.newObj.objectiveType) === "numeric"
                      ? "Quantitativo" : "Qualitativo"}
                  </span>
                </SummaryRow>
                <SummaryRow label="Peso assegnato">
                  <span className="font-bold text-slate-900">{wizard.weight}%</span>
                </SummaryRow>
                <SummaryRow label="Totale dopo assegnazione">
                  <span className="font-bold">
                    {currentTotalWeight + wizard.weight}% / 100%
                  </span>
                </SummaryRow>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => goTo(3)} disabled={assignMutation.isPending}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
                </Button>
                <Button
                  onClick={() => assignMutation.mutate()}
                  disabled={assignMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {assignMutation.isPending ? "Salvataggio..." : (
                    <><CheckCircle2 className="h-4 w-4 mr-1.5" />Conferma Assegnazione</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm text-right">{children}</span>
    </div>
  );
}
