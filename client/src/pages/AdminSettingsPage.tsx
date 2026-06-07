import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppActionsPanel from "@/components/AppActionsPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Settings, Database, Grid3x3, Calculator, Building2, MapPin, FileText, ShieldCheck, Clock, Briefcase, ToggleLeft, ToggleRight, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags, type FeatureFlags } from "@/contexts/FeatureFlagsContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

// ─── Entry Gate Tab ───────────────────────────────────────────────────────────

interface EntryGateItem {
  id: string;
  year: number;
  indicatorName: string;
  targetValue: number;
  actualValue: number | null;
  thresholdPct: number;
  isActive: boolean;
}

function EntryGateTab() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<EntryGateItem | null>(null);
  const [form, setForm] = useState({
    year: currentYear,
    indicatorName: "",
    targetValue: "",
    actualValue: "",
    thresholdPct: 95,
    isActive: true,
  });

  const { data: gates = [], refetch } = useQuery<EntryGateItem[]>({
    queryKey: ["/api/entry-gates"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = editing
        ? await apiRequest("PUT", `/api/entry-gates/${editing.id}`, data)
        : await apiRequest("POST", "/api/entry-gates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entry-gates"] });
      toast({ title: editing ? "Entry Gate aggiornato" : "Entry Gate creato" });
      setOpenDialog(false);
      setEditing(null);
    },
    onError: () => {
      toast({ title: "Errore", description: "Operazione non riuscita.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/entry-gates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entry-gates"] });
      toast({ title: "Entry Gate eliminato" });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ year: currentYear, indicatorName: "", targetValue: "", actualValue: "", thresholdPct: 95, isActive: true });
    setOpenDialog(true);
  };

  const openEdit = (g: EntryGateItem) => {
    setEditing(g);
    setForm({
      year: g.year,
      indicatorName: g.indicatorName,
      targetValue: String(g.targetValue),
      actualValue: g.actualValue !== null ? String(g.actualValue) : "",
      thresholdPct: g.thresholdPct,
      isActive: g.isActive,
    });
    setOpenDialog(true);
  };

  const handleSubmit = () => {
    saveMutation.mutate({
      year: form.year,
      indicatorName: form.indicatorName,
      targetValue: parseFloat(form.targetValue),
      actualValue: form.actualValue !== "" ? parseFloat(form.actualValue) : null,
      thresholdPct: form.thresholdPct,
      isActive: form.isActive,
    });
  };

  const getGateStatus = (g: EntryGateItem) => {
    if (g.actualValue === null) return null;
    return (g.actualValue / g.targetValue) >= (g.thresholdPct / 100);
  };

  return (
    <TabsContent value="entry-gate" className="mt-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Entry Gate MBO</CardTitle>
              <CardDescription>
                Configura l'indicatore aziendale che condiziona l'erogazione del bonus MBO.
                Se l'Entry Gate è attivo e non superato, il bonus non viene erogato.
              </CardDescription>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuovo Entry Gate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {gates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nessun Entry Gate configurato.</p>
              <p className="text-sm mt-1">Aggiungi un indicatore per condizionare l'erogazione del bonus MBO.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anno</TableHead>
                  <TableHead>Indicatore</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Consuntivo</TableHead>
                  <TableHead className="text-right">Soglia %</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Attivo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {gates.map(g => {
                  const passed = getGateStatus(g);
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.year}</TableCell>
                      <TableCell>{g.indicatorName}</TableCell>
                      <TableCell className="text-right">{g.targetValue.toLocaleString("it-IT")}</TableCell>
                      <TableCell className="text-right">
                        {g.actualValue !== null ? g.actualValue.toLocaleString("it-IT") : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">{g.thresholdPct}%</TableCell>
                      <TableCell>
                        {passed === null ? (
                          <span className="text-muted-foreground text-xs">In attesa</span>
                        ) : passed ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Superato
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-700 text-xs font-medium">
                            <XCircle className="h-4 w-4" />
                            Non superato
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={g.isActive}
                          onCheckedChange={(v) => {
                            apiRequest("PUT", `/api/entry-gates/${g.id}`, { isActive: v }).then(() => {
                              queryClient.invalidateQueries({ queryKey: ["/api/entry-gates"] });
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(g.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifica Entry Gate" : "Nuovo Entry Gate"}</DialogTitle>
            <DialogDescription>
              Definisci l'indicatore aziendale e la soglia di accesso al bonus MBO.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Anno</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Soglia %</Label>
                <Input
                  type="number"
                  min={1} max={100}
                  value={form.thresholdPct}
                  onChange={e => setForm(p => ({ ...p, thresholdPct: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome Indicatore</Label>
              <Input
                placeholder="es. EBITDA, Fatturato, Margine Operativo"
                value={form.indicatorName}
                onChange={e => setForm(p => ({ ...p, indicatorName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valore Target</Label>
                <Input
                  type="number"
                  placeholder="es. 10000000"
                  value={form.targetValue}
                  onChange={e => setForm(p => ({ ...p, targetValue: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Consuntivo (opzionale)</Label>
                <Input
                  type="number"
                  placeholder="Da aggiornare a consuntivo"
                  value={form.actualValue}
                  onChange={e => setForm(p => ({ ...p, actualValue: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))}
              />
              <Label>Attivo (blocca il bonus se non superato)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Annulla</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending || !form.indicatorName || !form.targetValue}>
              {saveMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}

// ─── Manager Assignment Tab ───────────────────────────────────────────────────

function ManagerAssignmentTab() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/settings/manager-assignment"],
  });

  const mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("PUT", "/api/settings/manager-assignment", { enabled });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/settings/manager-assignment"], data);
      toast({ title: data.enabled ? "Assegnazione autonoma abilitata" : "Assegnazione autonoma disabilitata" });
    },
    onError: () => {
      toast({ title: "Errore nel salvataggio", variant: "destructive" });
    },
  });

  const enabled = data?.enabled ?? true;

  return (
    <TabsContent value="manager-mbo" className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Assegnazione Obiettivi MBO da parte dei Manager</CardTitle>
          <CardDescription>
            Abilita o disabilita la possibilità per i manager di assegnare obiettivi MBO ai propri collaboratori.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Caricamento...</p>
          ) : (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <p className="font-medium">Assegnazione autonoma obiettivi</p>
                <p className="text-sm text-muted-foreground">
                  Se attivo, i manager possono assegnare e creare obiettivi MBO per i propri collaboratori diretti
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(v) => mutation.mutate(v)}
                disabled={mutation.isPending}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Composite Score Tab ──────────────────────────────────────────────────────

function CompositeScoreTab() {
  const { toast } = useToast();
  const [mboWeight, setMboWeight] = useState(60);
  const [perfWeight, setPerfWeight] = useState(40);

  const { data: settings, isLoading } = useQuery<{ mboWeight: number; performanceWeight: number }>({
    queryKey: ["/api/admin/composite-score-settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/composite-score-settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) {
      setMboWeight(settings.mboWeight);
      setPerfWeight(settings.performanceWeight);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (data: { mboWeight: number; performanceWeight: number }) => {
      const res = await apiRequest("PUT", "/api/admin/composite-score-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/composite-score-settings"] });
      toast({ title: "Pesi salvati con successo" });
    },
    onError: () => toast({ title: "Errore nel salvataggio", variant: "destructive" }),
  });

  const handleMboChange = (val: number) => {
    setMboWeight(val);
    setPerfWeight(100 - val);
  };

  return (
    <TabsContent value="punteggio-composito" className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Punteggio Composito</CardTitle>
          <CardDescription>
            Configura i pesi per il calcolo del punteggio finale. La somma deve essere 100%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Caricamento...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Peso MBO (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={mboWeight}
                    onChange={e => handleMboChange(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Contributo del raggiungimento obiettivi MBO</p>
                </div>
                <div className="space-y-2">
                  <Label>Peso Performance (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={perfWeight}
                    onChange={e => { setPerfWeight(Number(e.target.value)); setMboWeight(100 - Number(e.target.value)); }}
                  />
                  <p className="text-xs text-muted-foreground">Contributo della valutazione delle competenze</p>
                </div>
              </div>
              <div className="rounded-lg border p-4 bg-muted/30 space-y-1">
                <p className="text-sm font-medium">Formula:</p>
                <p className="text-sm text-muted-foreground font-mono">
                  Punteggio = MBO% × {mboWeight / 100} + (Valutazione/5 × 100) × {perfWeight / 100}
                </p>
                {mboWeight + perfWeight !== 100 && (
                  <p className="text-sm text-destructive">⚠ La somma dei pesi deve essere 100%</p>
                )}
              </div>
              <Button
                onClick={() => mutation.mutate({ mboWeight, performanceWeight: perfWeight })}
                disabled={mutation.isPending || mboWeight + perfWeight !== 100}
              >
                {mutation.isPending ? "Salvataggio..." : "Salva Configurazione"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Company Tab ──────────────────────────────────────────────────────────────

function CompanyTab() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState<string | null>(null);

  const { data: companyData } = useQuery<{ companyName: string }>({
    queryKey: ["/api/settings/company"],
  });

  const displayName = companyName ?? companyData?.companyName ?? "";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/settings/company", { companyName: displayName });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/company"] });
      toast({ title: "Nome società salvato" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile salvare.", variant: "destructive" });
    },
  });

  return (
    <TabsContent value="azienda" className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Dati Azienda</CardTitle>
          <CardDescription>
            Il nome della società viene visualizzato nel regolamento MBO e in altri documenti della piattaforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome Società</Label>
            <Input
              id="company-name"
              value={displayName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="es. Acme S.p.A."
            />
            <p className="text-xs text-muted-foreground">
              Sostituisce il nome predefinito nel regolamento MBO e nelle pagine della piattaforma.
            </p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvataggio..." : "Salva"}
          </Button>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Cycle Tab ────────────────────────────────────────────────────────────────

function CycleTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<{ name: string; startDate: string; endDate: string } | null>(null);

  const { data: cycleData } = useQuery<{ name: string; startDate: string; endDate: string }>({
    queryKey: ["/api/settings/cycle"],
  });

  const current = form ?? cycleData ?? { name: "", startDate: "", endDate: "" };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/settings/cycle", current);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/cycle"] });
      toast({ title: "Ciclo MBO salvato" });
      setForm(null);
    },
    onError: () => toast({ title: "Errore nel salvataggio", variant: "destructive" }),
  });

  const set = (key: keyof typeof current, val: string) =>
    setForm(prev => ({ ...(prev ?? current), [key]: val }));

  return (
    <TabsContent value="ciclo" className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Ciclo MBO</CardTitle>
          <CardDescription>
            Definisci il periodo di riferimento della campagna MBO. Puoi impostare un ciclo annuale o una campagna più corta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="cycle-name">Nome ciclo</Label>
            <Input
              id="cycle-name"
              value={current.name}
              onChange={e => set("name", e.target.value)}
              placeholder="es. MBO 2026 oppure H1 2026"
            />
            <p className="text-xs text-muted-foreground">Viene mostrato nella dashboard dei dipendenti.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycle-start">Data inizio</Label>
              <Input
                id="cycle-start"
                type="date"
                value={current.startDate}
                onChange={e => set("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-end">Data fine</Label>
              <Input
                id="cycle-end"
                type="date"
                value={current.endDate}
                onChange={e => set("endDate", e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvataggio..." : "Salva"}
          </Button>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Moduli Tab ───────────────────────────────────────────────────────────────

const MODULE_DEFS = [
  {
    id: "gestione_anagrafiche",
    label: "Gestione Anagrafiche",
    description: "Gestione utenti, strutture aziendali, campi personalizzati e lookup tabelle.",
  },
  {
    id: "gestione_mbo",
    label: "Gestione MBO",
    description: "Database obiettivi, assegnazione, disassociazione e rendicontazione MBO.",
  },
  {
    id: "performance_management",
    label: "Performance Management",
    description: "Autovalutazione, feedback 360°, piani di sviluppo, valutazioni team e competenze.",
  },
  {
    id: "gestione_organizzazione",
    label: "Gestione Organizzazione",
    description: "Organigramma aziendale e vista team.",
  },
];

function ModuliTab() {
  const flags = useFeatureFlags();
  const { toast } = useToast();
  const [localFlags, setLocalFlags] = useState<FeatureFlags>({ ...flags });

  const saveMutation = useMutation({
    mutationFn: async (updated: FeatureFlags) => {
      const res = await apiRequest("PUT", "/api/settings/features", updated);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/features"] });
      toast({ title: "Moduli aggiornati", description: "Le impostazioni sono state salvate." });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile salvare le impostazioni.", variant: "destructive" });
    },
  });

  const toggle = (key: keyof FeatureFlags) => {
    setLocalFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <TabsContent value="moduli" className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Macro Processi — Attivazione Moduli</CardTitle>
          <CardDescription>
            Controlla la visibilità di ogni modulo separatamente per gli amministratori e per i dipendenti. I moduli disattivati vengono nascosti dalla navigazione del ruolo corrispondente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Header row */}
          <div className="grid grid-cols-[1fr_100px_100px] gap-4 px-4 pb-2 border-b">
            <div />
            <div className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</div>
            <div className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Utente</div>
          </div>
          <div className="space-y-2 mt-2">
            {MODULE_DEFS.map((mod) => {
              const adminKey = `${mod.id}_admin` as keyof FeatureFlags;
              const userKey = `${mod.id}_user` as keyof FeatureFlags;
              return (
                <div key={mod.id} className="grid grid-cols-[1fr_100px_100px] gap-4 items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">{mod.label}</p>
                    <p className="text-sm text-slate-500">{mod.description}</p>
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={localFlags[adminKey]}
                      onCheckedChange={() => toggle(adminKey)}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={localFlags[userKey]}
                      onCheckedChange={() => toggle(userKey)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => saveMutation.mutate(localFlags)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Salvataggio..." : "Salva modifiche"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface IndicatorCluster {
  id: string;
  name: string;
  description?: string;
}

interface CalculationType {
  id: string;
  name: string;
  description?: string;
  formula?: string;
}

interface BusinessFunction {
  id: string;
  name: string;
  description?: string;
  primoLivelloId?: string;
  secondoLivelloId?: string;
}

interface SedeLavoro {
  id: string;
  codiceSede: string;
  descrizioneSede: string;
  comune?: string;
  provincia?: string;
  indirizzo?: string;
  cap?: string;
  isActive: boolean;
}

interface Ccnl {
  id: string;
  codiceCcnl: string;
  descrizioneCcnl: string;
  isActive: boolean;
}

interface CategoriaProtetta {
  id: string;
  codice: string;
  descrizione: string;
  isActive: boolean;
}

interface ConfigurazioneOrario {
  id: string;
  codice: string;
  tipo: "tipo_orario" | "timbra_firma";
  descrizione: string;
  isActive: boolean;
}

interface CausaleAssunzione {
  id: string;
  codice: string;
  descrizione: string;
  isActive: boolean;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection, isActionsPanelOpen, setIsActionsPanelOpen } = useRail();
  const [openClusterDialog, setOpenClusterDialog] = useState(false);
  const [openCalcDialog, setOpenCalcDialog] = useState(false);
  const [openBusinessDialog, setOpenBusinessDialog] = useState(false);
  const [editingCluster, setEditingCluster] = useState<IndicatorCluster | null>(null);
  const [editingCalc, setEditingCalc] = useState<CalculationType | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<BusinessFunction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"cluster" | "calc" | "business" | "sede" | "ccnl" | "categoria" | "orario" | "causale" | null>(null);

  // Nuovi stati per i 5 tab anagrafica
  const [openSedeDialog, setOpenSedeDialog] = useState(false);
  const [openCcnlDialog, setOpenCcnlDialog] = useState(false);
  const [openCategoriaDialog, setOpenCategoriaDialog] = useState(false);
  const [openOrarioDialog, setOpenOrarioDialog] = useState(false);
  const [openCausaleDialog, setOpenCausaleDialog] = useState(false);

  const [editingSede, setEditingSede] = useState<SedeLavoro | null>(null);
  const [editingCcnl, setEditingCcnl] = useState<Ccnl | null>(null);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaProtetta | null>(null);
  const [editingOrario, setEditingOrario] = useState<ConfigurazioneOrario | null>(null);
  const [editingCausale, setEditingCausale] = useState<CausaleAssunzione | null>(null);

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  const [clusterForm, setClusterForm] = useState({ name: "", description: "" });
  const [calcForm, setCalcForm] = useState({ name: "", description: "", formula: "" });
  const [businessForm, setBusinessForm] = useState({ name: "", description: "", primoLivelloId: "", secondoLivelloId: "" });

  // Nuovi form state per anagrafica
  const [sedeForm, setSedeForm] = useState({ codiceSede: "", descrizioneSede: "", comune: "", provincia: "", indirizzo: "", cap: "", isActive: true });
  const [ccnlForm, setCcnlForm] = useState({ codiceCcnl: "", descrizioneCcnl: "", isActive: true });
  const [categoriaForm, setCategoriaForm] = useState({ codice: "", descrizione: "", isActive: true });
  const [orarioForm, setOrarioForm] = useState({ codice: "", tipo: "tipo_orario" as "tipo_orario" | "timbra_firma", descrizione: "", isActive: true });
  const [causaleForm, setCausaleForm] = useState({ codice: "", descrizione: "", isActive: true });

  // Queries
  const { data: clusters = [], isLoading: clusterLoading } = useQuery<IndicatorCluster[]>({
    queryKey: ["/api/indicator-clusters"],
    enabled: !!user,
  });

  const { data: calcTypes = [], isLoading: calcLoading } = useQuery<CalculationType[]>({
    queryKey: ["/api/calculation-types"],
    enabled: !!user,
  });

  const { data: businessFunctions = [], isLoading: businessLoading } = useQuery<BusinessFunction[]>({
    queryKey: ["/api/business-functions"],
    enabled: !!user,
  });

  // Nuove queries per anagrafica
  const { data: sedi = [], isLoading: sediLoading } = useQuery<SedeLavoro[]>({
    queryKey: ["/api/admin/sedi"],
    enabled: !!user,
  });

  const { data: ccnls = [], isLoading: ccnlsLoading } = useQuery<Ccnl[]>({
    queryKey: ["/api/admin/ccnl"],
    enabled: !!user,
  });

  const { data: categorieProtette = [], isLoading: categorieLoading } = useQuery<CategoriaProtetta[]>({
    queryKey: ["/api/admin/categorie-protette"],
    enabled: !!user && user.role === "admin",
  });

  const { data: tipiOrario = [], isLoading: tipiOrarioLoading } = useQuery<ConfigurazioneOrario[]>({
    queryKey: ["/api/admin/configurazioni-orario", { tipo: "tipo_orario" }],
    enabled: !!user,
  });

  const { data: timbraFirma = [], isLoading: timbraFirmaLoading } = useQuery<ConfigurazioneOrario[]>({
    queryKey: ["/api/admin/configurazioni-orario", { tipo: "timbra_firma" }],
    enabled: !!user,
  });

  const { data: causaliAssunzione = [], isLoading: causaliLoading } = useQuery<CausaleAssunzione[]>({
    queryKey: ["/api/admin/causali-assunzione"],
    enabled: !!user,
  });

  // Mutations - Clusters
  const createClusterMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/indicator-clusters", clusterForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicator-clusters"] });
      setClusterForm({ name: "", description: "" });
      setOpenClusterDialog(false);
      toast({ title: "Successo", description: "Cluster creato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione del cluster", variant: "destructive" });
    },
  });

  const updateClusterMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/indicator-clusters/${editingCluster?.id}`, clusterForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicator-clusters"] });
      setClusterForm({ name: "", description: "" });
      setEditingCluster(null);
      setOpenClusterDialog(false);
      toast({ title: "Successo", description: "Cluster aggiornato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento del cluster", variant: "destructive" });
    },
  });

  const deleteClusterMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/indicator-clusters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicator-clusters"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "Cluster eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione del cluster", variant: "destructive" });
    },
  });

  // Mutations - Calculation Types
  const createCalcMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/calculation-types", calcForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculation-types"] });
      setCalcForm({ name: "", description: "", formula: "" });
      setOpenCalcDialog(false);
      toast({ title: "Successo", description: "Tipo di calcolo creato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione del tipo di calcolo", variant: "destructive" });
    },
  });

  const updateCalcMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/calculation-types/${editingCalc?.id}`, calcForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculation-types"] });
      setCalcForm({ name: "", description: "", formula: "" });
      setEditingCalc(null);
      setOpenCalcDialog(false);
      toast({ title: "Successo", description: "Tipo di calcolo aggiornato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento del tipo di calcolo", variant: "destructive" });
    },
  });

  const deleteCalcMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/calculation-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculation-types"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "Tipo di calcolo eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione del tipo di calcolo", variant: "destructive" });
    },
  });

  // Mutations - Business Functions
  const createBusinessMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/business-functions", businessForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-functions"] });
      setBusinessForm({ name: "", description: "", primoLivelloId: "", secondoLivelloId: "" });
      setOpenBusinessDialog(false);
      toast({ title: "Successo", description: "Funzione aziendale creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione della funzione aziendale", variant: "destructive" });
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/business-functions/${editingBusiness?.id}`, businessForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-functions"] });
      setBusinessForm({ name: "", description: "", primoLivelloId: "", secondoLivelloId: "" });
      setEditingBusiness(null);
      setOpenBusinessDialog(false);
      toast({ title: "Successo", description: "Funzione aziendale aggiornata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento della funzione aziendale", variant: "destructive" });
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/business-functions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-functions"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "Funzione aziendale eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione della funzione aziendale", variant: "destructive" });
    },
  });

  // Mutations - Sedi di Lavoro
  const createSedeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/sedi", sedeForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sedi"] });
      setSedeForm({ codiceSede: "", descrizioneSede: "", comune: "", provincia: "", indirizzo: "", cap: "", isActive: true });
      setOpenSedeDialog(false);
      toast({ title: "Successo", description: "Sede creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione della sede", variant: "destructive" });
    },
  });

  const updateSedeMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/sedi/${editingSede?.id}`, sedeForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sedi"] });
      setSedeForm({ codiceSede: "", descrizioneSede: "", comune: "", provincia: "", indirizzo: "", cap: "", isActive: true });
      setEditingSede(null);
      setOpenSedeDialog(false);
      toast({ title: "Successo", description: "Sede aggiornata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento della sede", variant: "destructive" });
    },
  });

  const deleteSedeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/sedi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sedi"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "Sede eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione della sede", variant: "destructive" });
    },
  });

  // Mutations - CCNL
  const createCcnlMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/ccnl", ccnlForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ccnl"] });
      setCcnlForm({ codiceCcnl: "", descrizioneCcnl: "", isActive: true });
      setOpenCcnlDialog(false);
      toast({ title: "Successo", description: "CCNL creato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione del CCNL", variant: "destructive" });
    },
  });

  const updateCcnlMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/ccnl/${editingCcnl?.id}`, ccnlForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ccnl"] });
      setCcnlForm({ codiceCcnl: "", descrizioneCcnl: "", isActive: true });
      setEditingCcnl(null);
      setOpenCcnlDialog(false);
      toast({ title: "Successo", description: "CCNL aggiornato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento del CCNL", variant: "destructive" });
    },
  });

  const deleteCcnlMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/ccnl/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ccnl"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "CCNL eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione del CCNL", variant: "destructive" });
    },
  });

  // Mutations - Categorie Protette
  const createCategoriaMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/categorie-protette", categoriaForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categorie-protette"] });
      setCategoriaForm({ codice: "", descrizione: "", isActive: true });
      setOpenCategoriaDialog(false);
      toast({ title: "Successo", description: "Categoria protetta creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione della categoria protetta", variant: "destructive" });
    },
  });

  const updateCategoriaMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/categorie-protette/${editingCategoria?.id}`, categoriaForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categorie-protette"] });
      setCategoriaForm({ codice: "", descrizione: "", isActive: true });
      setEditingCategoria(null);
      setOpenCategoriaDialog(false);
      toast({ title: "Successo", description: "Categoria protetta aggiornata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento della categoria protetta", variant: "destructive" });
    },
  });

  const deleteCategoriaMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/categorie-protette/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categorie-protette"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "Categoria protetta eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione della categoria protetta", variant: "destructive" });
    },
  });

  // Mutations - Configurazioni Orario
  const createOrarioMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/configurazioni-orario?tipo=${orarioForm.tipo}`, orarioForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/configurazioni-orario"] });
      setOrarioForm({ codice: "", tipo: "tipo_orario", descrizione: "", isActive: true });
      setOpenOrarioDialog(false);
      toast({ title: "Successo", description: "Configurazione orario creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione della configurazione orario", variant: "destructive" });
    },
  });

  const updateOrarioMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/configurazioni-orario/${editingOrario?.id}?tipo=${orarioForm.tipo}`, orarioForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/configurazioni-orario"] });
      setOrarioForm({ codice: "", tipo: "tipo_orario", descrizione: "", isActive: true });
      setEditingOrario(null);
      setOpenOrarioDialog(false);
      toast({ title: "Successo", description: "Configurazione orario aggiornata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento della configurazione orario", variant: "destructive" });
    },
  });

  const deleteOrarioMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/configurazioni-orario/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/configurazioni-orario"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "Configurazione orario eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione della configurazione orario", variant: "destructive" });
    },
  });

  // Mutations - Causali Assunzione
  const createCausaleMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/causali-assunzione", causaleForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/causali-assunzione"] });
      setCausaleForm({ codice: "", descrizione: "", isActive: true });
      setOpenCausaleDialog(false);
      toast({ title: "Successo", description: "Causale assunzione creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nella creazione della causale assunzione", variant: "destructive" });
    },
  });

  const updateCausaleMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/causali-assunzione/${editingCausale?.id}`, causaleForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/causali-assunzione"] });
      setCausaleForm({ codice: "", descrizione: "", isActive: true });
      setEditingCausale(null);
      setOpenCausaleDialog(false);
      toast({ title: "Successo", description: "Causale assunzione aggiornata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'aggiornamento della causale assunzione", variant: "destructive" });
    },
  });

  const deleteCausaleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/causali-assunzione/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/causali-assunzione"] });
      setDeleteId(null);
      setDeleteType(null);
      toast({ title: "Successo", description: "Causale assunzione eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Errore nell'eliminazione della causale assunzione", variant: "destructive" });
    },
  });

  const handleEditCluster = (cluster: IndicatorCluster) => {
    setEditingCluster(cluster);
    setClusterForm({ name: cluster.name, description: cluster.description || "" });
    setOpenClusterDialog(true);
  };

  const handleEditCalc = (calc: CalculationType) => {
    setEditingCalc(calc);
    setCalcForm({ name: calc.name, description: calc.description || "", formula: calc.formula || "" });
    setOpenCalcDialog(true);
  };

  const handleEditBusiness = (business: BusinessFunction) => {
    setEditingBusiness(business);
    setBusinessForm({ 
      name: business.name, 
      description: business.description || "",
      primoLivelloId: business.primoLivelloId || "",
      secondoLivelloId: business.secondoLivelloId || ""
    });
    setOpenBusinessDialog(true);
  };

  const handleSaveCluster = () => {
    if (!clusterForm.name.trim()) {
      toast({ title: "Errore", description: "Il nome è obbligatorio", variant: "destructive" });
      return;
    }
    if (editingCluster) {
      updateClusterMutation.mutate();
    } else {
      createClusterMutation.mutate();
    }
  };

  const handleSaveCalc = () => {
    if (!calcForm.name.trim()) {
      toast({ title: "Errore", description: "Il nome è obbligatorio", variant: "destructive" });
      return;
    }
    if (editingCalc) {
      updateCalcMutation.mutate();
    } else {
      createCalcMutation.mutate();
    }
  };

  const handleSaveBusiness = () => {
    if (!businessForm.name.trim()) {
      toast({ title: "Errore", description: "Il nome del dipartimento è obbligatorio", variant: "destructive" });
      return;
    }
    if (editingBusiness) {
      updateBusinessMutation.mutate();
    } else {
      createBusinessMutation.mutate();
    }
  };

  const handleEditSede = (sede: SedeLavoro) => {
    setEditingSede(sede);
    setSedeForm({
      codiceSede: sede.codiceSede,
      descrizioneSede: sede.descrizioneSede,
      comune: sede.comune || "",
      provincia: sede.provincia || "",
      indirizzo: sede.indirizzo || "",
      cap: sede.cap || "",
      isActive: sede.isActive
    });
    setOpenSedeDialog(true);
  };

  const handleEditCcnl = (ccnl: Ccnl) => {
    setEditingCcnl(ccnl);
    setCcnlForm({ codiceCcnl: ccnl.codiceCcnl, descrizioneCcnl: ccnl.descrizioneCcnl, isActive: ccnl.isActive });
    setOpenCcnlDialog(true);
  };

  const handleEditCategoria = (categoria: CategoriaProtetta) => {
    setEditingCategoria(categoria);
    setCategoriaForm({ codice: categoria.codice, descrizione: categoria.descrizione, isActive: categoria.isActive });
    setOpenCategoriaDialog(true);
  };

  const handleEditOrario = (orario: ConfigurazioneOrario) => {
    setEditingOrario(orario);
    setOrarioForm({ codice: orario.codice, tipo: orario.tipo, descrizione: orario.descrizione, isActive: orario.isActive });
    setOpenOrarioDialog(true);
  };

  const handleEditCausale = (causale: CausaleAssunzione) => {
    setEditingCausale(causale);
    setCausaleForm({ codice: causale.codice, descrizione: causale.descrizione, isActive: causale.isActive });
    setOpenCausaleDialog(true);
  };

  const handleSaveSede = () => {
    if (!sedeForm.codiceSede.trim() || !sedeForm.descrizioneSede.trim()) {
      toast({ title: "Errore", description: "Codice e descrizione sono obbligatori", variant: "destructive" });
      return;
    }
    if (editingSede) {
      updateSedeMutation.mutate();
    } else {
      createSedeMutation.mutate();
    }
  };

  const handleSaveCcnl = () => {
    if (!ccnlForm.codiceCcnl.trim() || !ccnlForm.descrizioneCcnl.trim()) {
      toast({ title: "Errore", description: "Codice e descrizione sono obbligatori", variant: "destructive" });
      return;
    }
    if (editingCcnl) {
      updateCcnlMutation.mutate();
    } else {
      createCcnlMutation.mutate();
    }
  };

  const handleSaveCategoria = () => {
    if (!categoriaForm.codice.trim() || !categoriaForm.descrizione.trim()) {
      toast({ title: "Errore", description: "Codice e descrizione sono obbligatori", variant: "destructive" });
      return;
    }
    if (editingCategoria) {
      updateCategoriaMutation.mutate();
    } else {
      createCategoriaMutation.mutate();
    }
  };

  const handleSaveOrario = () => {
    if (!orarioForm.codice.trim() || !orarioForm.descrizione.trim()) {
      toast({ title: "Errore", description: "Codice e descrizione sono obbligatori", variant: "destructive" });
      return;
    }
    if (editingOrario) {
      updateOrarioMutation.mutate();
    } else {
      createOrarioMutation.mutate();
    }
  };

  const handleSaveCausale = () => {
    if (!causaleForm.codice.trim() || !causaleForm.descrizione.trim()) {
      toast({ title: "Errore", description: "Codice e descrizione sono obbligatori", variant: "destructive" });
      return;
    }
    if (editingCausale) {
      updateCausaleMutation.mutate();
    } else {
      createCausaleMutation.mutate();
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteId || !deleteType) return;
    if (deleteType === "cluster") {
      deleteClusterMutation.mutate(deleteId);
    } else if (deleteType === "calc") {
      deleteCalcMutation.mutate(deleteId);
    } else if (deleteType === "business") {
      deleteBusinessMutation.mutate(deleteId);
    } else if (deleteType === "sede") {
      deleteSedeMutation.mutate(deleteId);
    } else if (deleteType === "ccnl") {
      deleteCcnlMutation.mutate(deleteId);
    } else if (deleteType === "categoria") {
      deleteCategoriaMutation.mutate(deleteId);
    } else if (deleteType === "orario") {
      deleteOrarioMutation.mutate(deleteId);
    } else if (deleteType === "causale") {
      deleteCausaleMutation.mutate(deleteId);
    }
  };

  // Seed mutation
  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/seed", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/indicator-clusters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calculation-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/business-functions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives-dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ 
        title: "Dati di test creati", 
        description: `Creati: ${data.created?.indicatorClusters || 0} cluster, ${data.created?.calculationTypes || 0} tipi calcolo, ${data.created?.businessFunctions || 0} funzioni, ${data.created?.objectives || 0} obiettivi, ${data.created?.users || 0} utenti`
      });
    },
    onError: (error) => {
      toast({ 
        title: "Errore", 
        description: error instanceof Error ? error.message : "Errore nella creazione dei dati di test", 
        variant: "destructive" 
      });
    },
  });

  return (
    <>
      <div className="w-full">
        <div className="w-full">
          {/* SIDEBAR CONTAINER - Fixed 312px width, always reserved */}
          {/* MAIN CONTENT - flex-1, never resizes, NO margin transitions */}
          <main className="w-full space-y-6 flex flex-col pt-4" >
          <div className="w-full space-y-6">
            <PageHeader 
              context="IMPOSTAZIONI PIATTAFORMA" 
              title="Gestione Tabelle Base" 
              description="Configura i cluster, le funzioni aziendali, le sedi, i contratti e le causali predefinite."
            />
            <div className="flex items-center justify-end gap-4 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  data-testid="button-seed-data"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {seedMutation.isPending ? "Creazione..." : "Popola Dati Test"}
                </Button>
              </div>

              <Tabs defaultValue="moduli" className="w-full">
                <TabsList className="mb-6 bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 space-x-8">
                  <TabsTrigger value="moduli" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Moduli</TabsTrigger>
                  <TabsTrigger value="clusters" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Indicatori</TabsTrigger>
                  <TabsTrigger value="calculations" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Tipi di Calcolo</TabsTrigger>
                  <TabsTrigger value="business" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Funzioni Aziendali</TabsTrigger>
                  <TabsTrigger value="sedi" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Sedi di Lavoro</TabsTrigger>
                  <TabsTrigger value="ccnl" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">CCNL</TabsTrigger>
                  {user?.role === "admin" && (
                    <TabsTrigger value="categorie-protette" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Categorie Protette</TabsTrigger>
                  )}
                  <TabsTrigger value="configurazioni-orario" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Configurazioni Orario</TabsTrigger>
                  <TabsTrigger value="causali-assunzione" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Causali Assunzione</TabsTrigger>
                  <TabsTrigger value="entry-gate" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Entry Gate MBO</TabsTrigger>
                  <TabsTrigger value="azienda" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Azienda</TabsTrigger>
                  <TabsTrigger value="ciclo" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Ciclo MBO</TabsTrigger>
                  <TabsTrigger value="manager-mbo" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Manager MBO</TabsTrigger>
                  <TabsTrigger value="punteggio-composito" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Punteggio Composito</TabsTrigger>
                </TabsList>

                {/* Moduli Tab */}
                <ModuliTab />

                {/* Clusters Tab */}
                <TabsContent value="clusters" className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle>Cluster Indicatori</CardTitle>
                        <CardDescription>Crea e gestisci i cluster di indicatori per gli obiettivi</CardDescription>
                      </div>
                      <Dialog open={openClusterDialog} onOpenChange={setOpenClusterDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingCluster(null); setClusterForm({ name: "", description: "" }); }} data-testid="button-add-cluster">
                            <Plus className="h-4 w-4 mr-2" />
                            Nuovo Cluster
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="dialog-cluster">
                          <DialogHeader>
                            <DialogTitle>{editingCluster ? "Modifica Cluster" : "Nuovo Cluster"}</DialogTitle>
                            <DialogDescription>
                              Compila i dettagli del cluster indicatore
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="cluster-name">Nome *</Label>
                              <Input
                                id="cluster-name"
                                value={clusterForm.name}
                                onChange={(e) => setClusterForm({ ...clusterForm, name: e.target.value })}
                                placeholder="Es: Obiettivi di Gruppo"
                                data-testid="input-cluster-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cluster-description">Descrizione</Label>
                              <Textarea
                                id="cluster-description"
                                value={clusterForm.description}
                                onChange={(e) => setClusterForm({ ...clusterForm, description: e.target.value })}
                                placeholder="Descrizione del cluster"
                                data-testid="input-cluster-description"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSaveCluster}
                              disabled={createClusterMutation.isPending || updateClusterMutation.isPending}
                              data-testid="button-save-cluster"
                            >
                              {createClusterMutation.isPending || updateClusterMutation.isPending ? "Salvataggio..." : "Salva"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {clusterLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                      ) : clusters.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nessun cluster trovato</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Descrizione</TableHead>
                              <TableHead className="w-32">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {clusters.map((cluster) => (
                              <TableRow key={cluster.id} data-testid={`row-cluster-${cluster.id}`}>
                                <TableCell className="font-medium" data-testid={`text-cluster-name-${cluster.id}`}>{cluster.name}</TableCell>
                                <TableCell data-testid={`text-cluster-description-${cluster.id}`}>{cluster.description || "-"}</TableCell>
                                <TableCell className="flex flex-nowrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditCluster(cluster)}
                                    data-testid={`button-edit-cluster-${cluster.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setDeleteId(cluster.id); setDeleteType("cluster"); }}
                                    data-testid={`button-delete-cluster-${cluster.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Calculation Types Tab */}
                <TabsContent value="calculations" className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle>Tipi di Calcolo</CardTitle>
                        <CardDescription>Crea e gestisci i tipi di calcolo per la valutazione degli obiettivi</CardDescription>
                      </div>
                      <Dialog open={openCalcDialog} onOpenChange={setOpenCalcDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingCalc(null); setCalcForm({ name: "", description: "", formula: "" }); }} data-testid="button-add-calc">
                            <Plus className="h-4 w-4 mr-2" />
                            Nuovo Tipo
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="dialog-calc">
                          <DialogHeader>
                            <DialogTitle>{editingCalc ? "Modifica Tipo" : "Nuovo Tipo di Calcolo"}</DialogTitle>
                            <DialogDescription>
                              Compila i dettagli del tipo di calcolo
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="calc-name">Nome *</Label>
                              <Input
                                id="calc-name"
                                value={calcForm.name}
                                onChange={(e) => setCalcForm({ ...calcForm, name: e.target.value })}
                                placeholder="Es: Interpolazione Lineare"
                                data-testid="input-calc-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="calc-description">Descrizione</Label>
                              <Textarea
                                id="calc-description"
                                value={calcForm.description}
                                onChange={(e) => setCalcForm({ ...calcForm, description: e.target.value })}
                                placeholder="Descrizione del tipo di calcolo"
                                data-testid="input-calc-description"
                              />
                            </div>
                            <div>
                              <Label htmlFor="calc-formula">Formula</Label>
                              <Textarea
                                id="calc-formula"
                                value={calcForm.formula}
                                onChange={(e) => setCalcForm({ ...calcForm, formula: e.target.value })}
                                placeholder="Es: score = (actual / target) * 100"
                                data-testid="input-calc-formula"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSaveCalc}
                              disabled={createCalcMutation.isPending || updateCalcMutation.isPending}
                              data-testid="button-save-calc"
                            >
                              {createCalcMutation.isPending || updateCalcMutation.isPending ? "Salvataggio..." : "Salva"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {calcLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                      ) : calcTypes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nessun tipo trovato</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Descrizione</TableHead>
                              <TableHead>Formula</TableHead>
                              <TableHead className="w-32">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {calcTypes.map((calc) => (
                              <TableRow key={calc.id} data-testid={`row-calc-${calc.id}`}>
                                <TableCell className="font-medium" data-testid={`text-calc-name-${calc.id}`}>{calc.name}</TableCell>
                                <TableCell data-testid={`text-calc-description-${calc.id}`}>{calc.description || "-"}</TableCell>
                                <TableCell className="text-xs font-mono" data-testid={`text-calc-formula-${calc.id}`}>{calc.formula ? calc.formula.substring(0, 40) + "..." : "-"}</TableCell>
                                <TableCell className="flex flex-nowrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditCalc(calc)}
                                    data-testid={`button-edit-calc-${calc.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setDeleteId(calc.id); setDeleteType("calc"); }}
                                    data-testid={`button-delete-calc-${calc.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business Functions Tab - Departments */}
                <TabsContent value="business" className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle>Funzioni Aziendali</CardTitle>
                        <CardDescription>Gestisci i dipartimenti (strutture di primo livello)</CardDescription>
                      </div>
                      <Dialog open={openBusinessDialog} onOpenChange={setOpenBusinessDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingBusiness(null); setBusinessForm({ name: "", description: "", primoLivelloId: "", secondoLivelloId: "" }); }} data-testid="button-add-business">
                            <Plus className="h-4 w-4 mr-2" />
                            Nuovo Dipartimento
                          </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="dialog-business">
                          <DialogHeader>
                            <DialogTitle>{editingBusiness ? "Modifica Dipartimento" : "Nuovo Dipartimento"}</DialogTitle>
                            <DialogDescription>
                              Compila i dettagli del dipartimento con le sue strutture gerarchiche
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="business-name">Nome del Dipartimento *</Label>
                              <Input
                                id="business-name"
                                value={businessForm.name}
                                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                                placeholder="Es: Contabilità, Risorse Umane, IT"
                                data-testid="input-business-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="business-primo-livello">Struttura di Primo Livello</Label>
                              <Input
                                id="business-primo-livello"
                                value={businessForm.primoLivelloId}
                                onChange={(e) => setBusinessForm({ ...businessForm, primoLivelloId: e.target.value })}
                                placeholder="Es: Direzione Generale"
                                data-testid="input-business-primo-livello"
                              />
                            </div>
                            <div>
                              <Label htmlFor="business-secondo-livello">Struttura di Secondo Livello</Label>
                              <Input
                                id="business-secondo-livello"
                                value={businessForm.secondoLivelloId}
                                onChange={(e) => setBusinessForm({ ...businessForm, secondoLivelloId: e.target.value })}
                                placeholder="Es: IT Development"
                                data-testid="input-business-secondo-livello"
                              />
                            </div>
                            <div>
                              <Label htmlFor="business-description">Descrizione</Label>
                              <Textarea
                                id="business-description"
                                value={businessForm.description}
                                onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                                placeholder="Descrizione del dipartimento"
                                data-testid="input-business-description"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSaveBusiness}
                              disabled={createBusinessMutation.isPending || updateBusinessMutation.isPending}
                              data-testid="button-save-business"
                            >
                              {createBusinessMutation.isPending || updateBusinessMutation.isPending ? "Salvataggio..." : "Salva"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {businessLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                      ) : businessFunctions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nessun dipartimento trovato</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome Dipartimento</TableHead>
                              <TableHead>Primo Livello</TableHead>
                              <TableHead>Secondo Livello</TableHead>
                              <TableHead>Descrizione</TableHead>
                              <TableHead className="w-32">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {businessFunctions.map((business) => (
                              <TableRow key={business.id} data-testid={`row-business-${business.id}`}>
                                <TableCell className="font-medium" data-testid={`text-business-name-${business.id}`}>{business.name}</TableCell>
                                <TableCell data-testid={`text-business-primo-${business.id}`}>{businessFunctions.find((b) => b.id === business.primoLivelloId)?.name || "-"}</TableCell>
                                <TableCell data-testid={`text-business-secondo-${business.id}`}>{businessFunctions.find((b) => b.id === business.secondoLivelloId)?.name || "-"}</TableCell>
                                <TableCell data-testid={`text-business-description-${business.id}`}>{business.description || "-"}</TableCell>
                                <TableCell className="flex flex-nowrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditBusiness(business)}
                                    data-testid={`button-edit-business-${business.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setDeleteId(business.id); setDeleteType("business"); }}
                                    data-testid={`button-delete-business-${business.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sedi di Lavoro Tab */}
                <TabsContent value="sedi" className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle>Sedi di Lavoro</CardTitle>
                        <CardDescription>Gestisci le sedi di lavoro aziendali</CardDescription>
                      </div>
                      <Dialog open={openSedeDialog} onOpenChange={setOpenSedeDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingSede(null); setSedeForm({ codiceSede: "", descrizioneSede: "", comune: "", provincia: "", indirizzo: "", cap: "", isActive: true }); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuova Sede
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{editingSede ? "Modifica Sede" : "Nuova Sede di Lavoro"}</DialogTitle>
                            <DialogDescription>
                              Compila i dettagli della sede di lavoro
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="sede-codice">Codice Sede *</Label>
                              <Input
                                id="sede-codice"
                                value={sedeForm.codiceSede}
                                onChange={(e) => setSedeForm({ ...sedeForm, codiceSede: e.target.value })}
                                placeholder="Es: MI01"
                              />
                            </div>
                            <div>
                              <Label htmlFor="sede-descrizione">Descrizione *</Label>
                              <Input
                                id="sede-descrizione"
                                value={sedeForm.descrizioneSede}
                                onChange={(e) => setSedeForm({ ...sedeForm, descrizioneSede: e.target.value })}
                                placeholder="Es: Milano Centro"
                              />
                            </div>
                            <div>
                              <Label htmlFor="sede-comune">Comune</Label>
                              <Input
                                id="sede-comune"
                                value={sedeForm.comune}
                                onChange={(e) => setSedeForm({ ...sedeForm, comune: e.target.value })}
                                placeholder="Es: Milano"
                              />
                            </div>
                            <div>
                              <Label htmlFor="sede-provincia">Provincia</Label>
                              <Input
                                id="sede-provincia"
                                value={sedeForm.provincia}
                                onChange={(e) => setSedeForm({ ...sedeForm, provincia: e.target.value })}
                                placeholder="Es: MI"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="sede-indirizzo">Indirizzo</Label>
                              <Input
                                id="sede-indirizzo"
                                value={sedeForm.indirizzo}
                                onChange={(e) => setSedeForm({ ...sedeForm, indirizzo: e.target.value })}
                                placeholder="Es: Via Roma, 123"
                              />
                            </div>
                            <div>
                              <Label htmlFor="sede-cap">CAP</Label>
                              <Input
                                id="sede-cap"
                                value={sedeForm.cap}
                                onChange={(e) => setSedeForm({ ...sedeForm, cap: e.target.value })}
                                placeholder="Es: 20100"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="sede-active"
                                checked={sedeForm.isActive}
                                onChange={(e) => setSedeForm({ ...sedeForm, isActive: e.target.checked })}
                                className="h-4 w-4"
                              />
                              <Label htmlFor="sede-active">Attivo</Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSaveSede}
                              disabled={createSedeMutation.isPending || updateSedeMutation.isPending}
                            >
                              {createSedeMutation.isPending || updateSedeMutation.isPending ? "Salvataggio..." : "Salva"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {sediLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                      ) : sedi.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nessuna sede trovata</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Codice</TableHead>
                              <TableHead>Descrizione</TableHead>
                              <TableHead>Comune</TableHead>
                              <TableHead>Provincia</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead className="w-32">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sedi.map((sede) => (
                              <TableRow key={sede.id}>
                                <TableCell className="font-medium">{sede.codiceSede}</TableCell>
                                <TableCell>{sede.descrizioneSede}</TableCell>
                                <TableCell>{sede.comune || "-"}</TableCell>
                                <TableCell>{sede.provincia || "-"}</TableCell>
                                <TableCell>
                                  <span className={sede.isActive ? "text-green-600" : "text-gray-400"}>
                                    {sede.isActive ? "Attivo" : "Inattivo"}
                                  </span>
                                </TableCell>
                                <TableCell className="flex flex-nowrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditSede(sede)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setDeleteId(sede.id); setDeleteType("sede"); }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* CCNL Tab */}
                <TabsContent value="ccnl" className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle>CCNL</CardTitle>
                        <CardDescription>Gestisci i Contratti Collettivi Nazionali di Lavoro</CardDescription>
                      </div>
                      <Dialog open={openCcnlDialog} onOpenChange={setOpenCcnlDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingCcnl(null); setCcnlForm({ codiceCcnl: "", descrizioneCcnl: "", isActive: true }); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuovo CCNL
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editingCcnl ? "Modifica CCNL" : "Nuovo CCNL"}</DialogTitle>
                            <DialogDescription>
                              Compila i dettagli del Contratto Collettivo Nazionale
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="ccnl-codice">Codice CCNL *</Label>
                              <Input
                                id="ccnl-codice"
                                value={ccnlForm.codiceCcnl}
                                onChange={(e) => setCcnlForm({ ...ccnlForm, codiceCcnl: e.target.value })}
                                placeholder="Es: COMMERCIO"
                              />
                            </div>
                            <div>
                              <Label htmlFor="ccnl-descrizione">Descrizione *</Label>
                              <Input
                                id="ccnl-descrizione"
                                value={ccnlForm.descrizioneCcnl}
                                onChange={(e) => setCcnlForm({ ...ccnlForm, descrizioneCcnl: e.target.value })}
                                placeholder="Es: CCNL Commercio e Terziario"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="ccnl-active"
                                checked={ccnlForm.isActive}
                                onChange={(e) => setCcnlForm({ ...ccnlForm, isActive: e.target.checked })}
                                className="h-4 w-4"
                              />
                              <Label htmlFor="ccnl-active">Attivo</Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSaveCcnl}
                              disabled={createCcnlMutation.isPending || updateCcnlMutation.isPending}
                            >
                              {createCcnlMutation.isPending || updateCcnlMutation.isPending ? "Salvataggio..." : "Salva"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {ccnlsLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                      ) : ccnls.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nessun CCNL trovato</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Codice</TableHead>
                              <TableHead>Descrizione</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead className="w-32">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ccnls.map((ccnl) => (
                              <TableRow key={ccnl.id}>
                                <TableCell className="font-medium">{ccnl.codiceCcnl}</TableCell>
                                <TableCell>{ccnl.descrizioneCcnl}</TableCell>
                                <TableCell>
                                  <span className={ccnl.isActive ? "text-green-600" : "text-gray-400"}>
                                    {ccnl.isActive ? "Attivo" : "Inattivo"}
                                  </span>
                                </TableCell>
                                <TableCell className="flex flex-nowrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditCcnl(ccnl)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setDeleteId(ccnl.id); setDeleteType("ccnl"); }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Categorie Protette Tab - SOLO ADMIN */}
                {user?.role === "admin" && (
                  <TabsContent value="categorie-protette" className="mt-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <div>
                          <CardTitle>Categorie Protette (L.68/99)</CardTitle>
                          <CardDescription>Gestisci le categorie protette ai sensi della Legge 68/99</CardDescription>
                        </div>
                        <Dialog open={openCategoriaDialog} onOpenChange={setOpenCategoriaDialog}>
                          <DialogTrigger asChild>
                            <Button onClick={() => { setEditingCategoria(null); setCategoriaForm({ codice: "", descrizione: "", isActive: true }); }}>
                              <Plus className="h-4 w-4 mr-2" />
                              Nuova Categoria
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{editingCategoria ? "Modifica Categoria Protetta" : "Nuova Categoria Protetta"}</DialogTitle>
                              <DialogDescription>
                                Compila i dettagli della categoria protetta
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="categoria-codice">Codice *</Label>
                                <Input
                                  id="categoria-codice"
                                  value={categoriaForm.codice}
                                  onChange={(e) => setCategoriaForm({ ...categoriaForm, codice: e.target.value })}
                                  placeholder="Es: ART1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="categoria-descrizione">Descrizione *</Label>
                                <Input
                                  id="categoria-descrizione"
                                  value={categoriaForm.descrizione}
                                  onChange={(e) => setCategoriaForm({ ...categoriaForm, descrizione: e.target.value })}
                                  placeholder="Es: Art. 1 - Disabili"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="categoria-active"
                                  checked={categoriaForm.isActive}
                                  onChange={(e) => setCategoriaForm({ ...categoriaForm, isActive: e.target.checked })}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="categoria-active">Attivo</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleSaveCategoria}
                                disabled={createCategoriaMutation.isPending || updateCategoriaMutation.isPending}
                              >
                                {createCategoriaMutation.isPending || updateCategoriaMutation.isPending ? "Salvataggio..." : "Salva"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardHeader>
                      <CardContent>
                        {categorieLoading ? (
                          <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                        ) : categorieProtette.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">Nessuna categoria trovata</div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Codice</TableHead>
                                <TableHead>Descrizione</TableHead>
                                <TableHead>Stato</TableHead>
                                <TableHead className="w-32">Azioni</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categorieProtette.map((categoria) => (
                                <TableRow key={categoria.id}>
                                  <TableCell className="font-medium">{categoria.codice}</TableCell>
                                  <TableCell>{categoria.descrizione}</TableCell>
                                  <TableCell>
                                    <span className={categoria.isActive ? "text-green-600" : "text-gray-400"}>
                                      {categoria.isActive ? "Attivo" : "Inattivo"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="flex flex-nowrap gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditCategoria(categoria)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => { setDeleteId(categoria.id); setDeleteType("categoria"); }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* Configurazioni Orario Tab - CON SOTTOTAB */}
                <TabsContent value="configurazioni-orario" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurazioni Orario</CardTitle>
                      <CardDescription>Gestisci i tipi orario e le modalità di timbratura/firma</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="tipo_orario" className="w-full">
                        <TabsList className="mb-6 bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 space-x-8">
                          <TabsTrigger value="tipo_orario" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Tipo Orario</TabsTrigger>
                          <TabsTrigger value="timbra_firma" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 py-3 font-semibold text-slate-500 data-[state=active]:text-slate-900">Timbra/Firma</TabsTrigger>
                        </TabsList>

                        {/* Sottotab Tipo Orario */}
                        <TabsContent value="tipo_orario" className="mt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Tipo Orario</h3>
                            <Dialog open={openOrarioDialog && orarioForm.tipo === "tipo_orario"} onOpenChange={(open) => { setOpenOrarioDialog(open); if (!open) setOrarioForm({ ...orarioForm, tipo: "tipo_orario" }); }}>
                              <DialogTrigger asChild>
                                <Button onClick={() => { setEditingOrario(null); setOrarioForm({ codice: "", tipo: "tipo_orario", descrizione: "", isActive: true }); }}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Nuovo Tipo Orario
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{editingOrario ? "Modifica Tipo Orario" : "Nuovo Tipo Orario"}</DialogTitle>
                                  <DialogDescription>
                                    Compila i dettagli del tipo orario
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="orario-codice">Codice *</Label>
                                    <Input
                                      id="orario-codice"
                                      value={orarioForm.codice}
                                      onChange={(e) => setOrarioForm({ ...orarioForm, codice: e.target.value })}
                                      placeholder="Es: FT"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="orario-descrizione">Descrizione *</Label>
                                    <Input
                                      id="orario-descrizione"
                                      value={orarioForm.descrizione}
                                      onChange={(e) => setOrarioForm({ ...orarioForm, descrizione: e.target.value })}
                                      placeholder="Es: Full Time"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="orario-active"
                                      checked={orarioForm.isActive}
                                      onChange={(e) => setOrarioForm({ ...orarioForm, isActive: e.target.checked })}
                                      className="h-4 w-4"
                                    />
                                    <Label htmlFor="orario-active">Attivo</Label>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleSaveOrario}
                                    disabled={createOrarioMutation.isPending || updateOrarioMutation.isPending}
                                  >
                                    {createOrarioMutation.isPending || updateOrarioMutation.isPending ? "Salvataggio..." : "Salva"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                          {tipiOrarioLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                          ) : tipiOrario.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">Nessun tipo orario trovato</div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Codice</TableHead>
                                  <TableHead>Descrizione</TableHead>
                                  <TableHead>Stato</TableHead>
                                  <TableHead className="w-32">Azioni</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tipiOrario.map((orario) => (
                                  <TableRow key={orario.id}>
                                    <TableCell className="font-medium">{orario.codice}</TableCell>
                                    <TableCell>{orario.descrizione}</TableCell>
                                    <TableCell>
                                      <span className={orario.isActive ? "text-green-600" : "text-gray-400"}>
                                        {orario.isActive ? "Attivo" : "Inattivo"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="flex flex-nowrap gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditOrario(orario)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => { setDeleteId(orario.id); setDeleteType("orario"); }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </TabsContent>

                        {/* Sottotab Timbra/Firma */}
                        <TabsContent value="timbra_firma" className="mt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Timbra/Firma</h3>
                            <Dialog open={openOrarioDialog && orarioForm.tipo === "timbra_firma"} onOpenChange={(open) => { setOpenOrarioDialog(open); if (!open) setOrarioForm({ ...orarioForm, tipo: "timbra_firma" }); }}>
                              <DialogTrigger asChild>
                                <Button onClick={() => { setEditingOrario(null); setOrarioForm({ codice: "", tipo: "timbra_firma", descrizione: "", isActive: true }); }}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Nuova Modalità
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{editingOrario ? "Modifica Modalità Timbra/Firma" : "Nuova Modalità Timbra/Firma"}</DialogTitle>
                                  <DialogDescription>
                                    Compila i dettagli della modalità di timbratura/firma
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="timbra-codice">Codice *</Label>
                                    <Input
                                      id="timbra-codice"
                                      value={orarioForm.codice}
                                      onChange={(e) => setOrarioForm({ ...orarioForm, codice: e.target.value })}
                                      placeholder="Es: BADGE"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="timbra-descrizione">Descrizione *</Label>
                                    <Input
                                      id="timbra-descrizione"
                                      value={orarioForm.descrizione}
                                      onChange={(e) => setOrarioForm({ ...orarioForm, descrizione: e.target.value })}
                                      placeholder="Es: Badge Elettronico"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="timbra-active"
                                      checked={orarioForm.isActive}
                                      onChange={(e) => setOrarioForm({ ...orarioForm, isActive: e.target.checked })}
                                      className="h-4 w-4"
                                    />
                                    <Label htmlFor="timbra-active">Attivo</Label>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleSaveOrario}
                                    disabled={createOrarioMutation.isPending || updateOrarioMutation.isPending}
                                  >
                                    {createOrarioMutation.isPending || updateOrarioMutation.isPending ? "Salvataggio..." : "Salva"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                          {timbraFirmaLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                          ) : timbraFirma.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">Nessuna modalità trovata</div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Codice</TableHead>
                                  <TableHead>Descrizione</TableHead>
                                  <TableHead>Stato</TableHead>
                                  <TableHead className="w-32">Azioni</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {timbraFirma.map((modalita) => (
                                  <TableRow key={modalita.id}>
                                    <TableCell className="font-medium">{modalita.codice}</TableCell>
                                    <TableCell>{modalita.descrizione}</TableCell>
                                    <TableCell>
                                      <span className={modalita.isActive ? "text-green-600" : "text-gray-400"}>
                                        {modalita.isActive ? "Attivo" : "Inattivo"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="flex flex-nowrap gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditOrario(modalita)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => { setDeleteId(modalita.id); setDeleteType("orario"); }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Causali Assunzione Tab */}
                <TabsContent value="causali-assunzione" className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <CardTitle>Causali Assunzione</CardTitle>
                        <CardDescription>Gestisci le causali di assunzione</CardDescription>
                      </div>
                      <Dialog open={openCausaleDialog} onOpenChange={setOpenCausaleDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingCausale(null); setCausaleForm({ codice: "", descrizione: "", isActive: true }); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuova Causale
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editingCausale ? "Modifica Causale" : "Nuova Causale Assunzione"}</DialogTitle>
                            <DialogDescription>
                              Compila i dettagli della causale di assunzione
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="causale-codice">Codice *</Label>
                              <Input
                                id="causale-codice"
                                value={causaleForm.codice}
                                onChange={(e) => setCausaleForm({ ...causaleForm, codice: e.target.value })}
                                placeholder="Es: TEMPO_IND"
                              />
                            </div>
                            <div>
                              <Label htmlFor="causale-descrizione">Descrizione *</Label>
                              <Input
                                id="causale-descrizione"
                                value={causaleForm.descrizione}
                                onChange={(e) => setCausaleForm({ ...causaleForm, descrizione: e.target.value })}
                                placeholder="Es: Tempo Indeterminato"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="causale-active"
                                checked={causaleForm.isActive}
                                onChange={(e) => setCausaleForm({ ...causaleForm, isActive: e.target.checked })}
                                className="h-4 w-4"
                              />
                              <Label htmlFor="causale-active">Attivo</Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSaveCausale}
                              disabled={createCausaleMutation.isPending || updateCausaleMutation.isPending}
                            >
                              {createCausaleMutation.isPending || updateCausaleMutation.isPending ? "Salvataggio..." : "Salva"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {causaliLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                      ) : causaliAssunzione.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nessuna causale trovata</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Codice</TableHead>
                              <TableHead>Descrizione</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead className="w-32">Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {causaliAssunzione.map((causale) => (
                              <TableRow key={causale.id}>
                                <TableCell className="font-medium">{causale.codice}</TableCell>
                                <TableCell>{causale.descrizione}</TableCell>
                                <TableCell>
                                  <span className={causale.isActive ? "text-green-600" : "text-gray-400"}>
                                    {causale.isActive ? "Attivo" : "Inattivo"}
                                  </span>
                                </TableCell>
                                <TableCell className="flex flex-nowrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditCausale(causale)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setDeleteId(causale.id); setDeleteType("causale"); }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <EntryGateTab />
                <CompanyTab />
                <CycleTab />
                <ManagerAssignmentTab />
                <CompositeScoreTab />
              </Tabs>

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={deleteId !== null} onOpenChange={() => { setDeleteId(null); setDeleteType(null); }}>
                <AlertDialogContent data-testid="dialog-confirm-delete">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare questo elemento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questa azione non può essere annullata
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    disabled={
                      deleteClusterMutation.isPending ||
                      deleteCalcMutation.isPending ||
                      deleteBusinessMutation.isPending ||
                      deleteSedeMutation.isPending ||
                      deleteCcnlMutation.isPending ||
                      deleteCategoriaMutation.isPending ||
                      deleteOrarioMutation.isPending ||
                      deleteCausaleMutation.isPending
                    }
                    data-testid="button-confirm-delete"
                  >
                    Elimina
                  </AlertDialogAction>
                <AlertDialogCancel data-testid="button-cancel-delete">Annulla</AlertDialogCancel>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>

          {isActionsPanelOpen && (
            <AppActionsPanel
              isOpen={isActionsPanelOpen}
              onClose={() => setIsActionsPanelOpen(false)}
              title="Azioni Impostazioni"
            >
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              <Database className="h-4 w-4" />
              {seedMutation.isPending ? "Creazione..." : "Popola Dati Test"}
            </Button>

            <div className="pt-4 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Statistiche</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Indicatori</span>
                  <span className="font-semibold" data-testid="stat-clusters">{clusters.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipi Calcolo</span>
                  <span className="font-semibold" data-testid="stat-calculation-types">{calcTypes.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Funzioni Aziendali</span>
                  <span className="font-semibold" data-testid="stat-business-functions">{businessFunctions.length}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Gestisci le strutture di base del sistema: cluster di indicatori, tipi di calcolo e funzioni aziendali/dipartimenti.
              </p>
            </div>
          </AppActionsPanel>
          )}
      </div>
    </div>
    </>
  );
}
