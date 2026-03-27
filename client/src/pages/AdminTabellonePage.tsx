import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, AlertTriangle, ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";

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
  };
  totalWeight: number;
  objectives: TabelloneObjective[];
}

export default function AdminTabellonePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleUser = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(rows.map((r) => r.user.id)));

  const { data: rows = [], isLoading } = useQuery<TabelloneRow[]>({
    queryKey: ["/api/tabellone"],
    enabled: !!user,
  });

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

  const handleExportCSV = () => {
    const headers = [
      "Dipartimento", "Nominativo", "Codice Fiscale", "Livello", "RAL", "MBO%", "Premio Max €",
      "Peso Totale %", "Obiettivo", "Cluster", "Modello Calcolo", "Peso%",
      "Premio Obiettivo €", "Target", "Soglia", "Payout Soglia%", "Overperf.",
      "Risultato", "Esito", "Avanzamento%", "Descrizione Target", "Fonte Dati"
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
          obj.title,
          obj.clusterName,
          curveLabel,
          `${obj.weight}%`,
          obj.objMboTarget.toFixed(2),
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tabellone_mbo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildCurveLabel = (obj: TabelloneObjective) => {
    if (obj.thresholdValue !== null && obj.allowOverperformance) {
      return `Interpolazione lineare (soglia ${obj.thresholdValue} → ${obj.thresholdPayout}%, max ${obj.maxPayout}%)`;
    }
    if (obj.thresholdValue !== null) {
      return `Interpolazione lineare (soglia ${obj.thresholdValue} → ${obj.thresholdPayout}%)`;
    }
    if (obj.allowOverperformance) {
      return `100% al target + overperformance (max ${obj.maxPayout}%)`;
    }
    return "100% al raggiungimento del target";
  };

  const getResultBadge = (obj: TabelloneObjective) => {
    if (!obj.qualitativeResult) return <span className="text-slate-400 text-xs">—</span>;
    if (obj.qualitativeResult === "reached") return <Badge className="bg-emerald-100 text-emerald-800 text-xs">Raggiunto</Badge>;
    if (obj.qualitativeResult === "partial") return <Badge className="bg-amber-100 text-amber-800 text-xs">Parziale</Badge>;
    return <Badge className="bg-red-100 text-red-800 text-xs">Non raggiunto</Badge>;
  };

  const getWeightBadge = (totalWeight: number) => {
    if (totalWeight === 100) return <Badge className="bg-emerald-100 text-emerald-700 text-xs">{totalWeight}%</Badge>;
    if (totalWeight < 100) return <Badge className="bg-amber-100 text-amber-700 text-xs">{totalWeight}%</Badge>;
    return <Badge className="bg-red-100 text-red-700 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{totalWeight}%</Badge>;
  };

  return (
    <>
      <div className="w-full">
        <div className="w-full">
          <main className="w-full space-y-6 flex flex-col pt-4" >
            <div className="space-y-6">
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
              </div>

              {/* Summary stats */}
              <div className="flex gap-4 text-sm text-slate-500">
                <span>{filtered.length} dipendenti</span>
                <span>·</span>
                <span>{filtered.reduce((s, r) => s + r.objectives.length, 0)} obiettivi totali</span>
                <span>·</span>
                <span>{filtered.filter(r => r.totalWeight === 100).length} con peso completo</span>
                <span>·</span>
                <span>{filtered.filter(r => r.totalWeight !== 100).length} con peso incompleto</span>
              </div>

              {isLoading ? (
                <div className="text-center py-16 text-muted-foreground">Caricamento tabellone...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">Nessun dato trovato</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm border-collapse min-w-[1400px]">
                    <thead>
                      <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                        <th className="w-8 px-2 py-3" />
                        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Dipartimento</th>
                        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Nominativo</th>
                        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">CF</th>
                        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Livello</th>
                        <th className="text-right px-3 py-3 font-semibold whitespace-nowrap">MBO%</th>
                        <th className="text-right px-3 py-3 font-semibold whitespace-nowrap">Premio Max €</th>
                        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Obiettivo</th>
                        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Cluster</th>
                        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Modello Calcolo</th>
                        <th className="text-right px-3 py-3 font-semibold whitespace-nowrap">Peso %</th>
                        <th className="text-right px-3 py-3 font-semibold whitespace-nowrap">Σ Pesi</th>
                        <th className="text-right px-3 py-3 font-semibold whitespace-nowrap">Premio Obiet. €</th>
                        <th className="text-right px-3 py-3 font-semibold whitespace-nowrap">Target</th>
                        <th className="text-right px-3 py-3 font-semibold whitespace-nowrap">Risultato</th>
                        <th className="text-center px-3 py-3 font-semibold whitespace-nowrap">Esito</th>
                        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Descrizione Target</th>
                        <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Fonte Dati</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => {
                        const u = row.user;
                        const isOpen = !collapsed.has(u.id);
                        return (
                          <>
                            {/* User header row */}
                            <tr
                              key={`user-${u.id}`}
                              className="bg-slate-50 border-b-2 border-slate-200 cursor-pointer hover:bg-slate-100 select-none"
                              onClick={() => toggleUser(u.id)}
                            >
                              <td className="px-2 py-2.5 text-slate-500">
                                {isOpen
                                  ? <ChevronDown className="h-4 w-4" />
                                  : <ChevronRight className="h-4 w-4" />}
                              </td>
                              <td className="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap text-sm">
                                {u.department || "—"}
                              </td>
                              <td className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap text-sm">
                                {u.firstName} {u.lastName}
                              </td>
                              <td className="px-3 py-2.5 text-slate-500 font-mono text-xs whitespace-nowrap">
                                {u.codiceFiscale || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap text-sm">
                                {u.livello || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right text-slate-700 whitespace-nowrap text-sm">
                                {u.mboPercentage}%
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap text-sm">
                                € {u.mboTarget.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </td>
                              {/* Objective columns: summary when collapsed */}
                              <td colSpan={5} className="px-3 py-2.5 text-xs text-slate-500">
                                {isOpen ? (
                                  <span className="italic">{row.objectives.length} obiettiv{row.objectives.length === 1 ? "o" : "i"}</span>
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
                              <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                {getWeightBadge(row.totalWeight)}
                              </td>
                              <td colSpan={5} />
                            </tr>

                            {/* Objective detail rows (shown when expanded) */}
                            {isOpen && row.objectives.map((obj, idx) => {
                              const isLast = idx === row.objectives.length - 1;
                              return (
                                <tr
                                  key={obj.assignmentId}
                                  className={`border-b border-slate-100 ${isLast ? "border-b-2 border-slate-300" : ""} hover:bg-slate-50/50`}
                                >
                                  <td className="px-2 py-2 bg-slate-50/30" />
                                  <td className="px-3 py-2 border-r border-slate-100" />
                                  <td className="px-3 py-2 border-r border-slate-100" />
                                  <td className="px-3 py-2 border-r border-slate-100" />
                                  <td className="px-3 py-2 border-r border-slate-100" />
                                  <td className="px-3 py-2 border-r border-slate-100" />
                                  <td className="px-3 py-2 border-r border-slate-100" />
                                  <td className="px-3 py-2 border-r border-slate-100 font-medium text-slate-800 max-w-[200px]">
                                    <div className="truncate" title={obj.title}>{obj.title}</div>
                                  </td>
                                  <td className="px-3 py-2 border-r border-slate-100 whitespace-nowrap">
                                    <Badge variant="outline" className="text-xs">{obj.clusterName || "—"}</Badge>
                                  </td>
                                  <td className="px-3 py-2 border-r border-slate-100 text-slate-500 text-xs max-w-[180px]">
                                    <div className="line-clamp-2" title={buildCurveLabel(obj)}>{buildCurveLabel(obj)}</div>
                                  </td>
                                  <td className="px-3 py-2 border-r border-slate-100 text-right font-semibold text-slate-900 whitespace-nowrap">
                                    {obj.weight}%
                                  </td>
                                  <td className="px-3 py-2 border-r border-slate-100" />
                                  <td className="px-3 py-2 border-r border-slate-100 text-right text-slate-700 whitespace-nowrap">
                                    € {obj.objMboTarget.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                  </td>
                                  <td className="px-3 py-2 border-r border-slate-100 text-right text-slate-700 whitespace-nowrap">
                                    {obj.targetValue !== null ? obj.targetValue.toLocaleString("it-IT") : "—"}
                                  </td>
                                  <td className="px-3 py-2 border-r border-slate-100 text-right text-slate-700 whitespace-nowrap">
                                    {obj.actualValue !== null ? obj.actualValue.toLocaleString("it-IT") : "—"}
                                  </td>
                                  <td className="px-3 py-2 border-r border-slate-100 text-center whitespace-nowrap">
                                    {getResultBadge(obj)}
                                  </td>
                                  <td className="px-3 py-2 border-r border-slate-100 text-slate-500 text-xs max-w-[200px]">
                                    <div className="line-clamp-2" title={obj.targetDescription}>{obj.targetDescription || "—"}</div>
                                  </td>
                                  <td className="px-3 py-2 text-slate-500 text-xs max-w-[180px]">
                                    <div className="line-clamp-2" title={obj.dataSource}>{obj.dataSource || "—"}</div>
                                  </td>
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
