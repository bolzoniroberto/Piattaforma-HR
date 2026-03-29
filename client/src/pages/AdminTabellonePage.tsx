import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search, Download, AlertTriangle,
  ChevronDown, ChevronRight, Columns3, ShieldAlert, CalendarClock,
} from "lucide-react";

interface EntryGate {
  id: string;
  year: number;
  indicatorName: string;
  targetValue: number;
  actualValue: number | null;
  thresholdPct: number;
  isActive: boolean;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TabelloneObjective {
  assignmentId: string;
  title: string;
  description: string;
  targetDescription: string;
  dataSource: string;
  clusterName: string;
  calculationTypeName: string;
  thresholdValue: number | null;
  thresholdPayout: number;
  allowOverperformance: number;
  maxPayout: number | null;
  targetValue: number | null;
  actualValue: number | null;
  qualitativeResult: string | null;
  weight: number;
  objMboTarget: number;
  progress: number;
  status: string;
  deadline: number | null;
}

interface TabelloneRow {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    codiceFiscale: string | null;
    department: string | null;
    livello: string | null;
    ral: number;
    mboPercentage: number;
    mboTarget: number;
    beneficiaryType: "standard" | "DIRS" | "CEO";
    hireDate: string | null;
  };
  totalWeight: number;
  objectives: TabelloneObjective[];
}

// ─── Column definitions ───────────────────────────────────────────────────────

type ColId =
  | "dept" | "name" | "cf" | "livello" | "mbo_pct" | "premio_max"
  | "obiettivo" | "cluster" | "modello" | "peso"
  | "sigma_pesi"
  | "premio_obiet" | "target" | "risultato" | "esito" | "desc_target" | "fonte_dati" | "scadenza";

type ColGroup = "user" | "obj" | "shared" | "result";

interface ColDef {
  id: ColId;
  label: string;
  width: number;
  align: "left" | "right" | "center";
  defaultVisible: boolean;
  group: ColGroup;
}

const COLUMNS: ColDef[] = [
  { id: "dept",         label: "Dipartimento",      width: 140, align: "left",   defaultVisible: true,  group: "user"   },
  { id: "name",         label: "Nominativo",         width: 160, align: "left",   defaultVisible: true,  group: "user"   },
  { id: "cf",           label: "CF",                 width: 130, align: "left",   defaultVisible: true,  group: "user"   },
  { id: "livello",      label: "Livello",            width: 90,  align: "left",   defaultVisible: true,  group: "user"   },
  { id: "mbo_pct",      label: "MBO%",               width: 72,  align: "right",  defaultVisible: true,  group: "user"   },
  { id: "premio_max",   label: "Premio Max €",       width: 120, align: "right",  defaultVisible: true,  group: "user"   },
  { id: "obiettivo",    label: "Obiettivo",          width: 200, align: "left",   defaultVisible: true,  group: "obj"    },
  { id: "cluster",      label: "Cluster",            width: 130, align: "left",   defaultVisible: true,  group: "obj"    },
  { id: "modello",      label: "Modello Calcolo",    width: 200, align: "left",   defaultVisible: false, group: "obj"    },
  { id: "peso",         label: "Peso %",             width: 72,  align: "right",  defaultVisible: true,  group: "obj"    },
  { id: "sigma_pesi",   label: "Σ Pesi",             width: 72,  align: "right",  defaultVisible: true,  group: "shared" },
  { id: "premio_obiet", label: "Premio Obiet. €",    width: 120, align: "right",  defaultVisible: true,  group: "result" },
  { id: "target",       label: "Target",             width: 90,  align: "right",  defaultVisible: true,  group: "result" },
  { id: "risultato",    label: "Risultato",          width: 90,  align: "right",  defaultVisible: true,  group: "result" },
  { id: "esito",        label: "Esito",              width: 110, align: "center", defaultVisible: true,  group: "result" },
  { id: "desc_target",  label: "Descrizione Target", width: 200, align: "left",   defaultVisible: true,  group: "result" },
  { id: "fonte_dati",   label: "Fonte Dati",         width: 160, align: "left",   defaultVisible: false, group: "result" },
  { id: "scadenza",     label: "Scadenza",           width: 110, align: "center", defaultVisible: false, group: "result" },
];

const STORAGE_KEY = "adminTabelloneVisibleCols";
const DEFAULT_VISIBLE = new Set<ColId>(COLUMNS.filter(c => c.defaultVisible).map(c => c.id));

function loadVisibleCols(): Set<ColId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as ColId[]);
  } catch {}
  return new Set(DEFAULT_VISIBLE);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminTabellonePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<Set<ColId>>(loadVisibleCols);

  const activeCols = useMemo(() => COLUMNS.filter(c => visibleCols.has(c.id)), [visibleCols]);

  function toggleCol(id: ColId) {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  const { data: rows = [], isLoading } = useQuery<TabelloneRow[]>({
    queryKey: ["/api/tabellone"],
    enabled: !!user,
  });

  const currentYear = new Date().getFullYear();
  const { data: entryGates = [] } = useQuery<EntryGate[]>({
    queryKey: [`/api/entry-gates?year=${currentYear}`],
    enabled: !!user,
  });

  // Compute Entry Gate status
  const activeGate = entryGates.find(g => g.isActive);
  const entryGatePassed = activeGate
    ? activeGate.actualValue !== null && (activeGate.actualValue / activeGate.targetValue) >= (activeGate.thresholdPct / 100)
    : true; // no gate = pass

  // Pro-rata: hire in current year
  const isProRata = (hireDate: string | null) => {
    if (!hireDate) return false;
    return hireDate.startsWith(String(currentYear));
  };

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        `${r.user.firstName} ${r.user.lastName}`.toLowerCase().includes(q) ||
        r.user.department?.toLowerCase().includes(q) ||
        r.user.codiceFiscale?.toLowerCase().includes(q) ||
        r.objectives.some((o) => o.title.toLowerCase().includes(q) || o.clusterName.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const toggleUser = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll  = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(rows.map((r) => r.user.id)));

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const buildCurveLabel = (obj: TabelloneObjective) => {
    if (obj.thresholdValue !== null && obj.allowOverperformance)
      return `Interpolazione lineare (soglia ${obj.thresholdValue} → ${obj.thresholdPayout}%, max ${obj.maxPayout}%)`;
    if (obj.thresholdValue !== null)
      return `Interpolazione lineare (soglia ${obj.thresholdValue} → ${obj.thresholdPayout}%)`;
    if (obj.allowOverperformance)
      return `100% al target + overperformance (max ${obj.maxPayout}%)`;
    return "100% al raggiungimento del target";
  };

  const getResultBadge = (obj: TabelloneObjective) => {
    if (!obj.qualitativeResult) return <span className="text-slate-400 text-xs">—</span>;
    if (obj.qualitativeResult === "reached")
      return <Badge className="bg-emerald-100 text-emerald-800 text-xs">Raggiunto</Badge>;
    if (obj.qualitativeResult === "partial")
      return <Badge className="bg-amber-100 text-amber-800 text-xs">Parziale</Badge>;
    return <Badge className="bg-red-100 text-red-800 text-xs">Non raggiunto</Badge>;
  };

  const getWeightBadge = (w: number) => {
    if (w === 100) return <Badge className="bg-emerald-100 text-emerald-700 text-xs">{w}%</Badge>;
    if (w < 100)   return <Badge className="bg-amber-100 text-amber-700 text-xs">{w}%</Badge>;
    return (
      <Badge className="bg-red-100 text-red-700 text-xs flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />{w}%
      </Badge>
    );
  };

  // ─── CSV export ────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const headers = [
      "Dipartimento", "Nominativo", "Codice Fiscale", "Livello", "RAL", "MBO%", "Premio Max €",
      "Peso Totale %", "Obiettivo", "Cluster", "Modello Calcolo", "Peso%",
      "Premio Obiettivo €", "Target", "Soglia", "Payout Soglia%", "Overperf.",
      "Risultato", "Esito", "Avanzamento%", "Descrizione Target", "Fonte Dati",
    ].join(";");

    const lines: string[] = [headers];
    for (const row of filtered) {
      const u = row.user;
      row.objectives.forEach((obj, idx) => {
        const curveLabel = buildCurveLabel(obj);
        lines.push([
          idx === 0 ? (u.department || "") : "",
          idx === 0 ? `${u.firstName} ${u.lastName}` : "",
          idx === 0 ? (u.codiceFiscale || "") : "",
          idx === 0 ? (u.livello || "") : "",
          idx === 0 ? u.ral.toFixed(2) : "",
          idx === 0 ? `${u.mboPercentage}%` : "",
          idx === 0 ? u.mboTarget.toFixed(2) : "",
          idx === 0 ? `${row.totalWeight}%` : "",
          obj.title, obj.clusterName, curveLabel,
          `${obj.weight}%`, obj.objMboTarget.toFixed(2),
          obj.targetValue !== null ? String(obj.targetValue) : "",
          obj.thresholdValue !== null ? String(obj.thresholdValue) : "",
          obj.thresholdValue !== null ? `${obj.thresholdPayout}%` : "",
          obj.allowOverperformance ? `Sì (max ${obj.maxPayout}%)` : "No",
          obj.actualValue !== null ? String(obj.actualValue) : (obj.qualitativeResult || ""),
          obj.qualitativeResult || "",
          `${obj.progress}%`,
          obj.targetDescription || "",
          obj.dataSource || "",
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"));
      });
    }

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `tabellone_mbo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render helpers ────────────────────────────────────────────────────────

  /** Content for a detail (objective) row cell */
  function detailCell(col: ColDef, obj: TabelloneObjective) {
    switch (col.id) {
      case "dept": case "name": case "cf": case "livello":
      case "mbo_pct": case "premio_max": case "sigma_pesi":
        return null;
      case "obiettivo":
        return <div className="truncate font-medium text-slate-800" title={obj.title}>{obj.title}</div>;
      case "cluster":
        return <Badge variant="outline" className="text-xs">{obj.clusterName || "—"}</Badge>;
      case "modello":
        return (
          <div className="line-clamp-2 text-xs text-slate-500" title={buildCurveLabel(obj)}>
            {buildCurveLabel(obj)}
          </div>
        );
      case "peso":
        return <span className="font-semibold text-slate-900">{obj.weight}%</span>;
      case "premio_obiet":
        return (
          <span className="text-slate-700">
            € {obj.objMboTarget.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        );
      case "target":
        return <span className="text-slate-700">{obj.targetValue !== null ? obj.targetValue.toLocaleString("it-IT") : "—"}</span>;
      case "risultato":
        return <span className="text-slate-700">{obj.actualValue !== null ? obj.actualValue.toLocaleString("it-IT") : "—"}</span>;
      case "esito":
        return getResultBadge(obj);
      case "desc_target":
        return (
          <div className="line-clamp-2 text-xs text-slate-500" title={obj.targetDescription}>
            {obj.targetDescription || "—"}
          </div>
        );
      case "fonte_dati":
        return (
          <div className="line-clamp-2 text-xs text-slate-500" title={obj.dataSource}>
            {obj.dataSource || "—"}
          </div>
        );
      case "scadenza": {
        if (!obj.deadline) return <span className="text-slate-400 text-xs">—</span>;
        const daysLeft = Math.ceil((obj.deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
        const dateStr = new Date(obj.deadline * 1000).toLocaleDateString("it-IT");
        return (
          <div className={`text-xs font-medium whitespace-nowrap ${daysLeft <= 0 ? "text-red-700" : daysLeft <= 30 ? "text-red-600" : daysLeft <= 60 ? "text-amber-600" : "text-slate-600"}`}>
            {dateStr}
            {daysLeft <= 60 && daysLeft > 0 && <span className="ml-1">({daysLeft}gg)</span>}
            {daysLeft <= 0 && <span className="ml-1">Scaduto</span>}
          </div>
        );
      }
    }
  }

  /** Content for a user header row cell */
  function userCell(col: ColDef, row: TabelloneRow) {
    const u = row.user;
    switch (col.id) {
      case "dept":       return <span className="font-medium text-slate-700 text-sm whitespace-nowrap">{u.department || "—"}</span>;
      case "name": return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 text-sm whitespace-nowrap">{u.firstName} {u.lastName}</span>
          {u.beneficiaryType === "DIRS" && (
            <Badge className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0 font-semibold">DIRS</Badge>
          )}
          {u.beneficiaryType === "CEO" && (
            <Badge className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0 font-semibold">CEO</Badge>
          )}
          {isProRata(u.hireDate) && (
            <span title={`Data assunzione: ${u.hireDate} — Verifica pro-rata`}>
              <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
            </span>
          )}
        </div>
      );
      case "cf":         return <span className="text-slate-500 font-mono text-xs whitespace-nowrap">{u.codiceFiscale || "—"}</span>;
      case "livello":    return <span className="text-slate-600 text-sm whitespace-nowrap">{u.livello || "—"}</span>;
      case "mbo_pct":    return <span className="text-slate-700 text-sm whitespace-nowrap">{u.mboPercentage}%</span>;
      case "premio_max": return (
        <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">
          € {u.mboTarget.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      );
      default: return null;
    }
  }

  // ─── Table metrics ─────────────────────────────────────────────────────────

  // 32px expand col + sum of visible col widths
  const totalWidth = 32 + activeCols.reduce((s, c) => s + c.width, 0);

  // Groups of visible columns
  const visibleObjCols    = activeCols.filter(c => c.group === "obj");
  const visibleUserCols   = activeCols.filter(c => c.group === "user");
  const visibleResultCols = activeCols.filter(c => c.group === "result");
  const showSigma         = visibleCols.has("sigma_pesi");

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="w-full">
        <div className="w-full">
          <main className="w-full space-y-6 flex flex-col pt-4">
            <div className="space-y-6">

              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <PageHeader
                  context="GESTIONE MBO"
                  title="Tabellone MBO"
                  description="Vista completa del piano MBO per tutti gli eligibili — obiettivi, pesi, premi, target e fonti dati."
                />
                <Button onClick={handleExportCSV} variant="outline" className="gap-2 shrink-0">
                  <Download className="h-4 w-4" />
                  Esporta CSV
                </Button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[240px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome, dipartimento, CF, obiettivo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Button variant="outline" size="sm" onClick={expandAll} className="gap-1.5">
                  <ChevronDown className="h-3.5 w-3.5" />
                  Espandi tutto
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5" />
                  Comprimi tutto
                </Button>

                {/* Column selector */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Columns3 className="h-4 w-4" />
                      Colonne
                      <span className="text-xs text-muted-foreground ml-0.5">({activeCols.length})</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      Colonne visibili
                    </p>
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {COLUMNS.map(col => (
                        <label
                          key={col.id}
                          className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-accent/50 text-sm"
                        >
                          <Checkbox
                            checked={visibleCols.has(col.id)}
                            onCheckedChange={() => toggleCol(col.id)}
                          />
                          <span className="flex-1">{col.label}</span>
                          <span className="text-[10px] text-muted-foreground/50 uppercase">
                            {col.group === "user" ? "utente" : col.group === "obj" ? "obiettivo" : col.group === "result" ? "esito" : ""}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t flex gap-2">
                      <Button
                        variant="ghost" size="sm" className="flex-1 h-7 text-xs"
                        onClick={() => {
                          const all = new Set<ColId>(COLUMNS.map(c => c.id));
                          setVisibleCols(all);
                          localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(all)));
                        }}
                      >
                        Tutti
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="flex-1 h-7 text-xs"
                        onClick={() => {
                          setVisibleCols(new Set(DEFAULT_VISIBLE));
                          localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(DEFAULT_VISIBLE)));
                        }}
                      >
                        Ripristina
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Entry Gate Warning */}
              {activeGate && !entryGatePassed && (
                <Alert className="border-red-200 bg-red-50">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 font-medium">
                    Entry Gate non superato — {activeGate.indicatorName}: {activeGate.actualValue?.toLocaleString("it-IT") ?? "—"} / {activeGate.targetValue.toLocaleString("it-IT")} (soglia {activeGate.thresholdPct}%).
                    Il bonus MBO non è erogabile nelle condizioni attuali.
                  </AlertDescription>
                </Alert>
              )}
              {activeGate && entryGatePassed && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <ShieldAlert className="h-4 w-4 text-emerald-600" />
                  Entry Gate superato — {activeGate.indicatorName}: {activeGate.actualValue?.toLocaleString("it-IT") ?? "—"} / {activeGate.targetValue.toLocaleString("it-IT")} (soglia {activeGate.thresholdPct}%)
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-4 text-sm text-slate-500">
                <span>{filtered.length} dipendenti</span>
                <span>·</span>
                <span>{filtered.reduce((s, r) => s + r.objectives.length, 0)} obiettivi totali</span>
                <span>·</span>
                <span>{filtered.filter(r => r.totalWeight === 100).length} con peso completo</span>
                <span>·</span>
                <span>{filtered.filter(r => r.totalWeight !== 100).length} con peso incompleto</span>
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="text-center py-16 text-muted-foreground">Caricamento tabellone...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">Nessun dato trovato</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table
                    className="text-sm border-collapse table-fixed"
                    style={{ width: totalWidth, minWidth: totalWidth }}
                  >
                    {/* colgroup fixes column widths on expand/collapse */}
                    <colgroup>
                      <col style={{ width: 32, minWidth: 32 }} />
                      {activeCols.map(col => (
                        <col key={col.id} style={{ width: col.width, minWidth: col.width }} />
                      ))}
                    </colgroup>

                    <thead>
                      <tr className="bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider">
                        <th className="w-8 px-2 py-2.5" />
                        {activeCols.map(col => (
                          <th
                            key={col.id}
                            className={`px-3 py-2.5 whitespace-nowrap ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((row) => {
                        const u = row.user;
                        const isOpen = !collapsed.has(u.id);

                        return (
                          <>
                            {/* ── User header row ── */}
                            <tr
                              key={`user-${u.id}`}
                              className="bg-slate-50 border-b-2 border-slate-200 cursor-pointer hover:bg-slate-100 select-none"
                              onClick={() => toggleUser(u.id)}
                            >
                              {/* Expand chevron */}
                              <td className="px-2 py-2.5 text-slate-500 w-8">
                                {isOpen
                                  ? <ChevronDown className="h-4 w-4" />
                                  : <ChevronRight className="h-4 w-4" />}
                              </td>

                              {/* User info columns */}
                              {visibleUserCols.map(col => (
                                <td
                                  key={col.id}
                                  className={`px-3 py-2.5 ${col.align === "right" ? "text-right" : ""}`}
                                >
                                  {userCell(col, row)}
                                </td>
                              ))}

                              {/* Objective columns — merged cell with summary */}
                              {visibleObjCols.length > 0 && (
                                <td
                                  colSpan={visibleObjCols.length}
                                  className="px-3 py-2.5 text-xs text-slate-500"
                                >
                                  {isOpen ? (
                                    <span className="italic">
                                      {row.objectives.length} obiettiv{row.objectives.length === 1 ? "o" : "i"}
                                    </span>
                                  ) : (
                                    <div className="flex gap-2 flex-wrap">
                                      {row.objectives.map((o) => (
                                        <Badge key={o.assignmentId} variant="outline" className="text-xs">
                                          {o.title.length > 30 ? o.title.slice(0, 30) + "…" : o.title} — {o.weight}%
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* Σ Pesi — weight badge */}
                              {showSigma && (
                                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                  {getWeightBadge(row.totalWeight)}
                                </td>
                              )}

                              {/* Result columns — empty in user header row */}
                              {visibleResultCols.map(col => (
                                <td key={col.id} className="px-3 py-2.5" />
                              ))}
                            </tr>

                            {/* ── Objective detail rows ── */}
                            {isOpen && row.objectives.map((obj, idx) => {
                              const isLast = idx === row.objectives.length - 1;
                              return (
                                <tr
                                  key={obj.assignmentId}
                                  className={`border-b border-slate-100 ${isLast ? "border-b-2 border-slate-300" : ""} hover:bg-slate-50/50`}
                                >
                                  {/* Expand col — blank */}
                                  <td className="px-2 py-2 bg-slate-50/30 w-8" />

                                  {/* All visible columns */}
                                  {activeCols.map(col => (
                                    <td
                                      key={col.id}
                                      className={`px-3 py-2 border-r border-slate-100 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""} whitespace-nowrap`}
                                    >
                                      {detailCell(col, obj)}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </>
  );
}
