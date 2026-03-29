import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Users,
  UserPlus,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  Trash2,
  Search,
  Columns3,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";

// ─── Column config ────────────────────────────────────────────────────────────

type ColType = "text" | "number" | "currency" | "select" | "boolean" | "timestamp";

interface ColDef {
  key: keyof User;
  label: string;
  type: ColType;
  width: number;
  editable: boolean;
  defaultVisible: boolean;
  options?: { value: string; label: string }[];
}

const COLUMNS: ColDef[] = [
  // ── default visible ─────────────────────────────────────────────────────────
  { key: "lastName",      label: "Cognome",         type: "text",      width: 120, editable: true,  defaultVisible: true },
  { key: "firstName",     label: "Nome",            type: "text",      width: 120, editable: true,  defaultVisible: true },
  { key: "email",         label: "Email",           type: "text",      width: 200, editable: true,  defaultVisible: true },
  { key: "codiceFiscale", label: "Cod. Fiscale",    type: "text",      width: 140, editable: true,  defaultVisible: true },
  { key: "matricola",     label: "Matricola",       type: "text",      width: 100, editable: true,  defaultVisible: true },
  {
    key: "role", label: "Ruolo", type: "select", width: 110, editable: true, defaultVisible: true,
    options: [
      { value: "employee", label: "Dipendente" },
      { value: "admin",    label: "Admin" },
      { value: "hr",       label: "HR" },
      { value: "manager",  label: "Manager" },
    ],
  },
  { key: "department",    label: "Dipartimento",    type: "text",      width: 150, editable: true,  defaultVisible: true },
  { key: "cdc",           label: "CDC",             type: "text",      width: 90,  editable: true,  defaultVisible: true },
  { key: "ral",           label: "RAL (€)",         type: "currency",  width: 110, editable: true,  defaultVisible: true },
  { key: "mboPercentage", label: "MBO %",           type: "number",    width: 75,  editable: true,  defaultVisible: true },
  { key: "telefono",      label: "Telefono",        type: "text",      width: 130, editable: true,  defaultVisible: true },
  { key: "citta",         label: "Città",           type: "text",      width: 100, editable: true,  defaultVisible: true },
  { key: "isActive",      label: "Attivo",          type: "boolean",   width: 65,  editable: true,  defaultVisible: true },
  {
    key: "beneficiaryType", label: "Tipo MBO", type: "select", width: 110, editable: true, defaultVisible: true,
    options: [
      { value: "standard", label: "Standard" },
      { value: "DIRS",     label: "DIRS" },
      { value: "CEO",      label: "CEO" },
    ],
  },
  { key: "isRendicontatore", label: "Rendicontatore", type: "boolean", width: 110, editable: true, defaultVisible: true },
  { key: "hireDate",      label: "Data Assunzione", type: "text",      width: 120, editable: true,  defaultVisible: false },
  // ── hidden by default ───────────────────────────────────────────────────────
  { key: "indirizzo",              label: "Indirizzo",           type: "text",      width: 180, editable: true,  defaultVisible: false },
  { key: "cap",                    label: "CAP",                 type: "text",      width: 80,  editable: true,  defaultVisible: false },
  { key: "profileImageUrl",        label: "URL Foto",            type: "text",      width: 200, editable: true,  defaultVisible: false },
  { key: "managerId",              label: "Manager ID",          type: "text",      width: 160, editable: false, defaultVisible: false },
  { key: "mboRegulationAcceptedAt",label: "Acc. Regolamento",    type: "timestamp", width: 130, editable: false, defaultVisible: false },
  { key: "createdAt",              label: "Creato il",           type: "timestamp", width: 130, editable: false, defaultVisible: false },
  { key: "updatedAt",              label: "Aggiornato il",       type: "timestamp", width: 130, editable: false, defaultVisible: false },
  { key: "id",                     label: "ID",                  type: "text",      width: 200, editable: false, defaultVisible: false },
];

const STORAGE_KEY = "adminUsersVisibleCols";
const DEFAULT_VISIBLE = new Set(COLUMNS.filter(c => c.defaultVisible).map(c => c.key));

function loadVisibleCols(): Set<keyof User> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as (keyof User)[]);
  } catch {}
  return new Set(DEFAULT_VISIBLE);
}

function cellDisplay(col: ColDef, value: any): string {
  if (value === null || value === undefined) return "";
  if (col.type === "select")    return col.options?.find(o => o.value === value)?.label ?? String(value);
  if (col.type === "currency")  return Number(value).toLocaleString("it-IT", { maximumFractionDigits: 0 });
  if (col.type === "boolean")   return "";
  if (col.type === "timestamp") return value ? new Date(Number(value) * 1000).toLocaleDateString("it-IT") : "";
  return String(value);
}

function parseInputValue(col: ColDef, raw: string): any {
  if (raw === "") return null;
  if (col.type === "number")   return Number(raw);
  if (col.type === "currency") return Number(raw.replace(/[^0-9.,]/g, "").replace(",", "."));
  return raw;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Edit state
  const [editingCell, setEditingCell] = useState<{ userId: string; field: keyof User } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Grid state
  const [sortField, setSortField] = useState<keyof User | null>("lastName");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc");
  const [globalFilter, setGlobalFilter] = useState("");
  const [visibleCols, setVisibleCols]   = useState<Set<keyof User>>(loadVisibleCols);

  const activeColumns = COLUMNS.filter(c => visibleCols.has(c.key));

  function toggleCol(key: keyof User) {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  // Dialog state
  const [deleteUserId, setDeleteUserId]   = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen]   = useState(false);
  const [createData, setCreateData]       = useState({ codiceFiscale: "", firstName: "", lastName: "", email: "" });

  // ─── Data ──────────────────────────────────────────────────────────────────

  const { data: rows = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res  = await fetch("/api/users", { credentials: "include" });
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data ?? []);
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const filteredAndSorted = useMemo(() => {
    let list = [...rows];
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      list = list.filter(u =>
        COLUMNS.some(col => {  // search all fields, not just visible
          const v = u[col.key];
          return v !== null && v !== undefined && String(v).toLowerCase().includes(q);
        })
      );
    }
    if (sortField) {
      list.sort((a, b) => {
        const av = a[sortField] ?? "";
        const bv = b[sortField] ?? "";
        const cmp = String(av).localeCompare(String(bv), "it");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [rows, globalFilter, sortField, sortDir]);

  const stats = useMemo(() => ({
    total:     rows.length,
    employees: rows.filter(u => u.role === "employee").length,
    admins:    rows.filter(u => u.role === "admin").length,
    active:    rows.filter(u => u.isActive).length,
  }), [rows]);

  // ─── Sorting ───────────────────────────────────────────────────────────────

  function toggleSort(field: keyof User) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  // ─── Inline edit ───────────────────────────────────────────────────────────

  function startEdit(userId: string, field: keyof User, currentValue: any) {
    setEditingCell({ userId, field });
    setEditValue(currentValue === null || currentValue === undefined ? "" : String(currentValue));
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditValue("");
  }

  const patchMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, data);
      return res.json();
    },
    onMutate: async ({ userId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });
      const prev = queryClient.getQueryData<User[]>(["/api/users"]);
      queryClient.setQueryData<User[]>(["/api/users"], old =>
        old?.map(u => u.id === userId ? { ...u, ...data } : u) ?? []
      );
      return { prev };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(["/api/users"], ctx.prev);
      toast({ title: "Errore nel salvataggio", variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["/api/users"] }),
  });

  function saveEdit() {
    if (!editingCell) return;
    const { userId, field } = editingCell;
    const col = COLUMNS.find(c => c.key === field);
    if (!col) return;
    cancelEdit();
    patchMutation.mutate({ userId, data: { [field]: parseInputValue(col, editValue) } });
  }

  function toggleBoolean(userId: string, field: keyof User, currentVal: any) {
    patchMutation.mutate({ userId, data: { [field]: !currentVal } });
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users", {
        firstName:     createData.firstName,
        lastName:      createData.lastName,
        email:         createData.email,
        codiceFiscale: createData.codiceFiscale || null,
        role: "employee",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Dipendente creato" });
      setIsCreateOpen(false);
      setCreateData({ codiceFiscale: "", firstName: "", lastName: "", email: "" });
    },
    onError: () => toast({ title: "Errore nella creazione", variant: "destructive" }),
  });

  // ─── Delete ────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
      return userId;
    },
    onSuccess: (userId: string) => {
      queryClient.setQueryData<User[]>(["/api/users"], old => old?.filter(u => u.id !== userId) ?? []);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente eliminato" });
      setDeleteUserId(null);
    },
    onError: () => toast({ title: "Errore nell'eliminazione", variant: "destructive" }),
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  const totalWidth = activeColumns.reduce((s, c) => s + c.width, 0) + 110;

  return (
    <>
      <div className="w-full">
        <div className="w-full">
          {/* Main */}
          <main
            className="w-full space-y-6 flex flex-col pt-4"
            
          >
            <PageHeader 
              context="GESTIONE ANAGRAFICHE" 
              title="Gestione Utenti" 
              description="Visualizza e gestisci i dipendenti, amministratori e ruoli della piattaforma."
            />
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: "Totale",     val: stats.total     },
                { label: "Dipendenti", val: stats.employees },
                { label: "Admin",      val: stats.admins    },
                { label: "Attivi",     val: stats.active    },
              ].map(s => (
                <div key={s.label} className="rounded-xl border bg-background p-4">
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className="text-2xl font-bold">{s.val}</div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca in tutti i campi..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>

              {/* Column selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Columns3 className="h-4 w-4" />
                    Colonne
                    <span className="text-xs text-muted-foreground ml-0.5">({activeColumns.length})</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Campi visibili
                  </p>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {COLUMNS.map(col => (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-accent/50 text-sm"
                      >
                        <Checkbox
                          checked={visibleCols.has(col.key)}
                          onCheckedChange={() => toggleCol(col.key)}
                        />
                        <span className="flex-1">{col.label}</span>
                        {!col.editable && (
                          <span className="text-[10px] text-muted-foreground/60">sola lett.</span>
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => {
                        const all = new Set(COLUMNS.map(c => c.key));
                        setVisibleCols(all);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(all)));
                      }}
                    >
                      Tutti
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-7 text-xs"
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

              <div className="text-xs text-muted-foreground">
                {filteredAndSorted.length} / {rows.length}
              </div>
              <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                Nuovo
              </Button>
            </div>

            {/* Grid */}
            <div className="flex-1 rounded-lg border border-border overflow-auto">
              <table
                className="border-collapse text-sm"
                style={{ width: totalWidth, minWidth: totalWidth }}
              >
                <thead>
                  <tr className="bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
                    <th className="w-10 px-2 py-2.5 text-center text-white/60">
                      #
                    </th>
                    {activeColumns.map(col => (
                      <th
                        key={col.key}
                        className="px-3 py-2.5 text-left whitespace-nowrap cursor-pointer select-none hover:bg-slate-800 transition-colors"
                        style={{ width: col.width, minWidth: col.width }}
                        onClick={() => toggleSort(col.key)}
                      >
                        <div className="flex items-center gap-1">
                          <span>{col.label}</span>
                          {sortField === col.key
                            ? sortDir === "asc"
                              ? <ChevronUp   className="h-3 w-3 text-white/70 shrink-0" />
                              : <ChevronDown className="h-3 w-3 text-white/70 shrink-0" />
                            : <ChevronsUpDown className="h-3 w-3 text-white/30 shrink-0" />
                          }
                        </div>
                      </th>
                    ))}
                    <th className="w-20 px-3 py-2.5 text-center">
                      Azioni
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={activeColumns.length + 2} className="py-20 text-center text-sm text-muted-foreground">
                        Caricamento...
                      </td>
                    </tr>
                  ) : filteredAndSorted.length === 0 ? (
                    <tr>
                      <td colSpan={activeColumns.length + 2} className="py-20 text-center text-sm text-muted-foreground">
                        Nessun utente trovato
                      </td>
                    </tr>
                  ) : (
                    filteredAndSorted.map((u, idx) => (
                      <tr
                        key={u.id}
                        className={cn(
                          "border-b border-border hover:bg-accent/20 transition-colors",
                          idx % 2 === 1 && "bg-muted/10"
                        )}
                      >
                        {/* Row number */}
                        <td className="border-r border-border px-2 text-center text-xs text-muted-foreground/60 h-8 select-none">
                          {idx + 1}
                        </td>

                        {/* Data cells */}
                        {activeColumns.map(col => {
                          const isEditing = editingCell?.userId === u.id && editingCell.field === col.key;
                          const value     = u[col.key];

                          return (
                            <td
                              key={col.key}
                              className={cn(
                                "border-r border-border p-0 h-8",
                                col.editable && col.type !== "boolean" && !isEditing && "cursor-pointer hover:bg-accent/30",
                                col.type === "boolean" && "cursor-pointer",
                                isEditing && "ring-2 ring-inset ring-primary relative z-10"
                              )}
                              style={{ width: col.width, minWidth: col.width }}
                              onClick={() => {
                                if (col.type === "boolean") {
                                  toggleBoolean(u.id, col.key, value);
                                } else if (col.editable && !isEditing) {
                                  startEdit(u.id, col.key, value);
                                }
                              }}
                            >
                              {/* Boolean cell */}
                              {col.type === "boolean" ? (
                                <div className="flex items-center justify-center h-full">
                                  <span className={cn(
                                    "w-2 h-2 rounded-full transition-colors",
                                    value ? "bg-green-500" : "bg-muted-foreground/25"
                                  )} />
                                </div>

                              /* Editing: select */
                              ) : isEditing && col.type === "select" ? (
                                <select
                                  autoFocus
                                  value={editValue}
                                  className="w-full h-full px-2 text-sm bg-background border-0 focus:outline-none"
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={saveEdit}
                                  onKeyDown={e => {
                                    if (e.key === "Enter")  { e.preventDefault(); saveEdit(); }
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                >
                                  {col.options?.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>

                              /* Editing: text / number */
                              ) : isEditing ? (
                                <input
                                  autoFocus
                                  type={col.type === "number" || col.type === "currency" ? "number" : "text"}
                                  value={editValue}
                                  className="w-full h-full px-2 text-sm bg-background border-0 focus:outline-none"
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={saveEdit}
                                  onKeyDown={e => {
                                    if (e.key === "Enter")  { e.preventDefault(); saveEdit(); }
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                />

                              /* Display */
                              ) : (
                                <div className="px-2 h-full flex items-center overflow-hidden">
                                  {col.key === "role" ? (
                                    <span className={cn(
                                      "text-xs px-1.5 py-0.5 rounded font-medium",
                                      value === "admin" ? "bg-primary/10 text-primary"
                                        : value === "hr" ? "bg-blue-500/10 text-blue-600"
                                        : "bg-muted text-muted-foreground"
                                    )}>
                                      {cellDisplay(col, value) || "–"}
                                    </span>
                                  ) : (
                                    <span className={cn(
                                      "text-sm truncate",
                                      (!value && value !== 0) && "text-muted-foreground/40 italic"
                                    )}>
                                      {cellDisplay(col, value) || "–"}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Actions */}
                        <td className="px-2">
                          <div className="flex items-center justify-center gap-1 h-8">
                            <Link href={`/admin/users/${u.codiceFiscale || u.id}`}>
                              <Button size="icon" variant="ghost" className="h-6 w-6" title="Apri profilo">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              title="Elimina"
                              onClick={() => setDeleteUserId(u.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Clicca una cella per modificarla · <kbd className="font-mono">Enter</kbd> o <kbd className="font-mono">Tab</kbd> per confermare · <kbd className="font-mono">Esc</kbd> per annullare · Clicca il punto verde/grigio per attivare/disattivare
            </p>
          </main>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Dipendente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="qc-cf">Codice Fiscale</Label>
              <Input
                id="qc-cf"
                value={createData.codiceFiscale}
                onChange={e => setCreateData(d => ({ ...d, codiceFiscale: e.target.value }))}
                placeholder="Es: BNCRSS80A01F205O"
              />
            </div>
            <div>
              <Label htmlFor="qc-name">Nome *</Label>
              <Input
                id="qc-name"
                value={createData.firstName}
                onChange={e => setCreateData(d => ({ ...d, firstName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="qc-surname">Cognome *</Label>
              <Input
                id="qc-surname"
                value={createData.lastName}
                onChange={e => setCreateData(d => ({ ...d, lastName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="qc-email">Email *</Label>
              <Input
                id="qc-email"
                type="email"
                value={createData.email}
                onChange={e => setCreateData(d => ({ ...d, email: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (!createData.firstName || !createData.lastName || !createData.email) {
                  toast({ title: "Nome, cognome ed email sono obbligatori", variant: "destructive" });
                  return;
                }
                createMutation.mutate();
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creazione..." : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={o => !o && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina utente</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro? L'azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
