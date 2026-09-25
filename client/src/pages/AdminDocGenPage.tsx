import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  FilePlus2, Upload, CheckCircle2, Loader2, Trash2, Copy,
  AlertCircle, Download, ArrowLeft, Settings2,
  Mail, ClipboardList, BarChart2, Eye, Plus, X, FileText,
  PenLine, Star, FileOutput, ChevronLeft, ChevronRight, Users, Database,
  ImageIcon, LayoutTemplate, Maximize2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { renderAsync } from "docx-preview";
import { MBO_PALETTE_GROUPS, ALL_MBO_KEYS } from "@/lib/docPalette";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Letterhead { id: string; name: string; description?: string; filePath: string; uploadedAt: number }
interface DocSigner { id: string; name: string; role: string; signatureImagePath: string; isDefault: number; uploadedAt: number }
type OutputFormat = 'docx' | 'pdf' | 'both';
interface PreviewSession {
  templateId: string;
  letterheadId?: string;
  signerId?: string;
  logoId?: string;
  excelPath?: string;
  dataSource?: 'excel' | 'db';
  params: Record<string, string>;
  pageOrientation?: 'portrait' | 'landscape';
  fitToPage?: boolean;
  logoWidthCm?: number;
  signatureWidthCm?: number;
}
interface TemplateParam { key: string; type: 'text' | 'date' | 'currency'; label: string; default: string; required: boolean }
interface DocTemplate {
  id: string; name: string; letterType: string; category: string; bodyContent: string;
  fieldMappings: string; calculatedFields: string; parameters: string;
  fontFamily: string;
  version: number; createdAt: number; updatedAt: number;
}
interface Job {
  id: string; templateId: string; letterheadId: string | null;
  paramsSnapshot: string; status: string; beneficiaryCount: number;
  outputZipPath: string | null; createdAt: number;
}
interface DocLogo { id: string; name: string; filePath: string; uploadedAt: number }

// ─── Classic fonts palette ────────────────────────────────────────────────────

const FONT_GROUPS = [
  {
    label: 'Sans-serif',
    fonts: ['Calibri', 'Arial', 'Helvetica', 'Verdana', 'Trebuchet MS', 'Century Gothic', 'Gill Sans MT'],
  },
  {
    label: 'Serif',
    fonts: ['Times New Roman', 'Georgia', 'Garamond', 'Palatino Linotype', 'Book Antiqua', 'Cambria', 'Baskerville Old Face'],
  },
] as const;

const ALL_FONTS = FONT_GROUPS.flatMap(g => g.fonts);
interface ExcelPreview {
  sheets: string[]; headers: { col: string; idx: number; name: string }[];
  rows: Record<string, unknown>[]; suggestedMappings: Record<string, string>;
  suggestionConfidence?: Record<string, number>;
  tempPath: string;
}

// ─── Known fields palette (imported from shared lib) ──────────────────────────

const PALETTE_GROUPS = MBO_PALETTE_GROUPS;
const ALL_KNOWN_KEYS = ALL_MBO_KEYS;

// ─── Letter type metadata ──────────────────────────────────────────────────────

const LETTER_TYPES: Record<string, { label: string; icon: typeof Mail; description: string; color: string }> = {
  cover_letter: { label: 'Cover Letter', icon: Mail, description: 'Lettera di accompagnamento con indirizzo del destinatario', color: 'border-sky-200 bg-sky-50' },
  assegnazione_mbo: { label: 'Lettera di Assegnazione', icon: ClipboardList, description: 'Scheda obiettivi con impegni e bonus target (3 pagine)', color: 'border-violet-200 bg-violet-50' },
  scheda_obiettivi: { label: 'Scheda Obiettivi', icon: BarChart2, description: 'Allegato con dettaglio degli indicatori di performance', color: 'border-emerald-200 bg-emerald-50' },
};

// ─── Main page ────────────────────────────────────────────────────────────────

type PageView = 'list' | 'editor' | 'generate';

export default function AdminDocGenPage() {
  const [view, setView] = useState<PageView>('list');
  const [editTemplate, setEditTemplate] = useState<DocTemplate | null>(null);
  const [category, setCategory] = useState<'mbo' | 'hr'>('mbo');

  if (view === 'editor' && editTemplate) {
    return (
      <TemplateEditorView
        template={editTemplate}
        category={editTemplate.category === 'hr' ? 'hr' : 'mbo'}
        onBack={() => setView('list')}
        onSaved={t => setEditTemplate(t)}
      />
    );
  }

  if (view === 'generate') {
    return <GenerateView category={category} onBack={() => setView('list')} />;
  }

  return (
    <TemplateListView
      category={category}
      onCategoryChange={setCategory}
      onEdit={t => { setEditTemplate(t); setView('editor'); }}
      onGenerate={() => setView('generate')}
    />
  );
}

// ─── Template List View ───────────────────────────────────────────────────────

function TemplateListView({
  category, onCategoryChange, onEdit, onGenerate,
}: {
  category: 'mbo' | 'hr';
  onCategoryChange: (c: 'mbo' | 'hr') => void;
  onEdit: (t: DocTemplate) => void;
  onGenerate: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newLetterDialog, setNewLetterDialog] = useState(false);
  const [newLetterName, setNewLetterName] = useState('');
  const [creatingLetter, setCreatingLetter] = useState(false);

  const { data: templates = [] } = useQuery<DocTemplate[]>({ queryKey: ['/api/doc/templates'] });
  const { data: jobs = [] } = useQuery<Job[]>({ queryKey: ['/api/doc/jobs'] });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/doc/templates/seed-default').then(r => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['/api/doc/templates'] });
      toast({ title: `${data.created} template creati` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/doc/templates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/doc/templates'] }); toast({ title: 'Template eliminato' }); },
  });

  const dupMutation = useMutation({
    mutationFn: (id: string) => apiRequest('POST', `/api/doc/templates/${id}/duplicate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/doc/templates'] }); toast({ title: 'Template duplicato' }); },
  });

  const mboBuiltinTypes = ['cover_letter', 'assegnazione_mbo', 'scheda_obiettivi'] as const;

  const orderedMboTemplates = mboBuiltinTypes
    .map(type => templates.find(t => t.letterType === type))
    .filter(Boolean) as DocTemplate[];

  const mboOtherTemplates = templates.filter(t =>
    (t.category ?? 'mbo') === 'mbo' && !mboBuiltinTypes.includes(t.letterType as any)
  );

  const hrTemplates = templates.filter(t => (t.category ?? 'mbo') === 'hr');

  async function handleCreateLetter() {
    if (!newLetterName.trim()) return;
    setCreatingLetter(true);
    try {
      const slug = newLetterName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const res = await apiRequest('POST', '/api/doc/templates', {
        name: newLetterName.trim(),
        letter_type: slug || 'lettera_' + Date.now(),
        category: 'hr',
        body_content: '',
        field_mappings: {},
        calculated_fields: { titolo: 'titolo', saluto_formula: 'saluto_formula' },
        parameters: [
          { key: 'data_documento', type: 'date', label: 'Data documento', default: '', required: true },
          { key: 'citta_mittente', type: 'text', label: 'Città mittente', default: 'Milano', required: true },
        ],
      });
      const t = await res.json();
      qc.invalidateQueries({ queryKey: ['/api/doc/templates'] });
      setNewLetterDialog(false);
      setNewLetterName('');
      toast({ title: 'Template creato' });
      onEdit(t);
    } catch (e) {
      toast({ title: 'Errore creazione', description: String(e), variant: 'destructive' });
    } finally {
      setCreatingLetter(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          context="STRUMENTI"
          title="Documenti"
          description="Gestisci e modifica i modelli di lettera."
          className="mb-0"
        />
        <div className="flex gap-2 shrink-0">
          <Link href="/admin/doc-settings">
            <Button variant="outline" className="gap-2">
              <Settings2 className="w-4 h-4" /> Impostazioni
            </Button>
          </Link>
          <Button onClick={onGenerate} className="gap-2">
            <FilePlus2 className="w-4 h-4" /> Genera documenti
          </Button>
        </div>
      </div>

      {/* Category selector */}
      <div className="flex gap-2">
        <button
          onClick={() => onCategoryChange('mbo')}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
            category === 'mbo' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400',
          )}
        >
          <ClipboardList className="w-4 h-4" /> Lettere MBO
        </button>
        <button
          onClick={() => onCategoryChange('hr')}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
            category === 'hr' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400',
          )}
        >
          <Users className="w-4 h-4" /> Lettere HR
        </button>
      </div>

      {/* MBO view */}
      {category === 'mbo' && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Modelli lettera</h3>
              {orderedMboTemplates.length < 3 && (
                <Button size="sm" variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                  {seedMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                  Crea template mancanti
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mboBuiltinTypes.map(type => {
                const meta = LETTER_TYPES[type];
                const tmpl = templates.find(t => t.letterType === type);
                const Icon = meta.icon;

                if (!tmpl) {
                  return (
                    <div key={type} className={cn('border-2 border-dashed rounded-xl p-5 flex flex-col gap-3 opacity-60', meta.color)}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-slate-400" />
                        <span className="font-semibold text-slate-500">{meta.label}</span>
                      </div>
                      <p className="text-xs text-slate-400">{meta.description}</p>
                      <Badge variant="outline" className="w-fit text-slate-400">Non configurato</Badge>
                    </div>
                  );
                }

                const fieldCount = Object.keys(JSON.parse(tmpl.fieldMappings || '{}')).length
                  + Object.keys(JSON.parse(tmpl.calculatedFields || '{}')).length
                  + JSON.parse(tmpl.parameters || '[]').length;

                return (
                  <div key={type} className={cn('border-2 rounded-xl p-5 flex flex-col gap-3', meta.color)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-slate-700" />
                        <span className="font-semibold text-slate-800">{meta.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">v{tmpl.version}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{meta.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{fieldCount} campi</Badge>
                      <Badge variant="outline" className="text-xs">{JSON.parse(tmpl.parameters || '[]').length} parametri</Badge>
                    </div>
                    <div className="flex gap-2 mt-auto pt-1">
                      <Button size="sm" className="flex-1" onClick={() => onEdit(tmpl)}>
                        <Settings2 className="w-3 h-3 mr-1" /> Modifica
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => dupMutation.mutate(tmpl.id)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600"
                        onClick={() => deleteMutation.mutate(tmpl.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {mboOtherTemplates.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Template personalizzati MBO</CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y">
                  {mboOtherTemplates.map(t => (
                    <div key={t.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.letterType} · v{t.version}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(t)}><Settings2 className="w-3 h-3 mr-1" /> Modifica</Button>
                        <Button size="sm" variant="outline" onClick={() => dupMutation.mutate(t.id)}><Copy className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" className="text-red-500" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* HR view */}
      {category === 'hr' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Modelli lettera HR</h3>
            <div className="flex gap-2">
              {hrTemplates.length === 0 && (
                <Button size="sm" variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                  {seedMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                  Crea template starter
                </Button>
              )}
              <Button size="sm" onClick={() => setNewLetterDialog(true)} className="gap-1">
                <Plus className="w-3 h-3" /> Nuova lettera
              </Button>
            </div>
          </div>

          {hrTemplates.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-500">Nessun template HR</p>
              <p className="text-xs text-slate-400 mt-1">Crea i template starter oppure aggiungi una nuova lettera.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hrTemplates.map(t => {
                const fieldCount = Object.keys(JSON.parse(t.fieldMappings || '{}')).length
                  + Object.keys(JSON.parse(t.calculatedFields || '{}')).length
                  + JSON.parse(t.parameters || '[]').length;
                return (
                  <div key={t.id} className="border rounded-xl p-5 flex flex-col gap-3 bg-white hover:border-slate-400 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <span className="font-semibold text-slate-800 text-sm">{t.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">v{t.version}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{t.letterType}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{fieldCount} campi</Badge>
                      <Badge variant="outline" className="text-xs">{JSON.parse(t.parameters || '[]').length} parametri</Badge>
                    </div>
                    <div className="flex gap-2 mt-auto pt-1">
                      <Button size="sm" className="flex-1" onClick={() => onEdit(t)}>
                        <Settings2 className="w-3 h-3 mr-1" /> Modifica
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => dupMutation.mutate(t.id)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600"
                        onClick={() => deleteMutation.mutate(t.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* History */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Ultime generazioni</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {jobs.slice(0, 5).map(j => (
                <div key={j.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{new Date(j.createdAt * 1000).toLocaleString('it-IT')}</p>
                    <p className="text-xs text-slate-500">{j.beneficiaryCount} beneficiari · {j.status}</p>
                  </div>
                  {j.status === 'done' && j.outputZipPath && (
                    <a href={`/api/doc/jobs/${j.id}/download`} download>
                      <Button size="sm" variant="outline"><Download className="w-3 h-3 mr-1" /> ZIP</Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Letter Dialog */}
      <Dialog open={newLetterDialog} onOpenChange={setNewLetterDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuova lettera HR</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div>
              <Label className="text-xs">Nome lettera</Label>
              <Input
                value={newLetterName}
                onChange={e => setNewLetterName(e.target.value)}
                placeholder="es. Lettera di promozione"
                className="mt-1"
                onKeyDown={e => { if (e.key === 'Enter') handleCreateLetter(); }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setNewLetterDialog(false)}>Annulla</Button>
              <Button onClick={handleCreateLetter} disabled={!newLetterName.trim() || creatingLetter}>
                {creatingLetter ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Crea e modifica
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Template Editor View ─────────────────────────────────────────────────────

interface HrFieldDef { key: string; label: string; isLiteral?: boolean }
interface HrFieldGroup { id: string; label: string; color: string; fields: HrFieldDef[] }

function TemplateEditorView({
  template, category, onBack, onSaved,
}: {
  template: DocTemplate;
  category: 'mbo' | 'hr';
  onBack: () => void;
  onSaved: (t: DocTemplate) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState(template.name);
  const [body, setBody] = useState(template.bodyContent);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(
    JSON.parse(template.fieldMappings || '{}')
  );
  const [calculatedFields, setCalculatedFields] = useState<Record<string, string>>(
    JSON.parse(template.calculatedFields || '{}')
  );
  const [parameters, setParameters] = useState<TemplateParam[]>(
    JSON.parse(template.parameters || '[]')
  );
  const [fontFamily, setFontFamily] = useState(template.fontFamily ?? 'Calibri');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewExcelPath, setPreviewExcelPath] = useState<string | null>(null);
  const [editorDataSource, setEditorDataSource] = useState<'db' | 'excel'>('db');
  const [mapExcelPreview, setMapExcelPreview] = useState<ExcelPreview | null>(null);
  const [uploadingMapExcel, setUploadingMapExcel] = useState(false);
  const [aiMapping, setAiMapping] = useState(false);
  const mapExcelInputRef = useRef<HTMLInputElement>(null);

  const { data: editorLogos = [] } = useQuery<DocLogo[]>({ queryKey: ['/api/doc/logos'] });
  const { data: editorSigners = [] } = useQuery<DocSigner[]>({ queryKey: ['/api/doc/signers'] });
  const editorDefaultSignerId = (editorSigners.find(s => s.isDefault === 1) ?? editorSigners[0])?.id;

  // HR dynamic field groups
  const { data: hrFieldGroups = [] } = useQuery<HrFieldGroup[]>({
    queryKey: ['/api/doc/data-fields', 'hr'],
    queryFn: () => fetch('/api/doc/data-fields?category=hr').then(r => r.json()),
    enabled: category === 'hr',
  });

  // Field analysis
  const detectedFields = Array.from(new Set(
    Array.from(body.matchAll(/\{([^}#/^@]+)\}/g)).map(m => m[1])
  ));

  const hrKnownKeys: string[] = [];
  hrFieldGroups.forEach(g => g.fields.forEach(f => hrKnownKeys.push(f.key)));

  const allSourceKeys = new Set([
    ...Object.keys(fieldMappings),
    ...Object.keys(calculatedFields),
    ...parameters.map(p => p.key),
    ...(category === 'hr' ? hrKnownKeys : Object.keys(Object.fromEntries(
      PALETTE_GROUPS.flatMap(g => g.fields.map(f => [f.key, true]))
    ))),
    'idx', 'codice', 'indicatore', 'descrizione', 'target', 'peso',
    'modalita_calcolo', 'tipo_obiettivo', 'rendicontatore', 'note', 'obiettivi',
  ]);
  const unmappedFields = detectedFields.filter(f => !allSourceKeys.has(f));

  function markDirty() { setDirty(true); }

  // Insert field at cursor
  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setBody(prev => prev + text);
      setDirty(true);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = body.substring(0, start) + text + body.substring(end);
    setBody(newVal);
    setDirty(true);
    const newPos = start + text.length;
    setTimeout(() => { ta.focus(); ta.setSelectionRange(newPos, newPos); }, 0);
  }, [body]);

  async function save() {
    setSaving(true);
    try {
      const res = await apiRequest('PUT', `/api/doc/templates/${template.id}`, {
        name,
        body_content: body,
        field_mappings: fieldMappings,
        calculated_fields: calculatedFields,
        parameters,
        font_family: fontFamily,
        category,
      });
      const data = await res.json();
      onSaved(data);
      qc.invalidateQueries({ queryKey: ['/api/doc/templates'] });
      setDirty(false);
      toast({ title: 'Template salvato' });
    } catch (e) {
      toast({ title: 'Errore salvataggio', description: String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  // Placeholder mappabili (escludo campi calcolati, parametri e il loop obiettivi)
  const mappableFields = detectedFields.filter(f =>
    !Object.keys(calculatedFields).includes(f) &&
    !parameters.map(p => p.key).includes(f) &&
    f !== 'obiettivi'
  );

  async function handleMapExcel(file: File) {
    setUploadingMapExcel(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/doc/excel/preview', { method: 'POST', body: fd });
      const data: ExcelPreview = await res.json();
      if (!res.ok) throw new Error((data as any).error);
      setMapExcelPreview(data);
      setPreviewExcelPath(data.tempPath);
      // Prefill solo i placeholder ancora vuoti, senza sovrascrivere scelte manuali.
      setFieldMappings(prev => {
        const next = { ...prev };
        for (const [ph, col] of Object.entries(data.suggestedMappings ?? {})) {
          if (mappableFields.includes(ph) && !next[ph]) next[ph] = col;
        }
        return next;
      });
      setDirty(true);
      const matched = Object.keys(data.suggestedMappings ?? {}).filter(ph => mappableFields.includes(ph)).length;
      toast({ title: `${data.headers.length} colonne — ${matched} mappate in automatico` });
    } catch (e) {
      toast({ title: 'Errore upload Excel', description: String(e), variant: 'destructive' });
    } finally {
      setUploadingMapExcel(false);
    }
  }

  async function handleAiMap() {
    if (!mapExcelPreview) return;
    setAiMapping(true);
    try {
      const res = await fetch('/api/doc/excel/ai-map', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: mapExcelPreview.headers.map(h => h.name),
          sampleRows: mapExcelPreview.rows,
          placeholders: mappableFields,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const mappings: Record<string, string> = data.mappings ?? {};
      setFieldMappings(prev => ({ ...prev, ...mappings }));
      setDirty(true);
      toast({ title: `Auto-map AI: ${Object.keys(mappings).length} placeholder mappati` });
    } catch (e) {
      toast({ title: 'Errore Auto-map AI', description: String(e), variant: 'destructive' });
    } finally {
      setAiMapping(false);
    }
  }

  const meta = LETTER_TYPES[template.letterType] ?? { label: template.name, icon: FileText, color: 'bg-slate-50' };
  const Icon = meta.icon;

  const editorLogoId = editorLogos[0]?.id;
  // useMemo prevents new object ref on every render (would cause DocPreviewModal race condition)
  const editorPreviewSession = useMemo<PreviewSession | null>(() => {
    if (editorDataSource === 'db') {
      return { templateId: template.id, dataSource: 'db', logoId: editorLogoId, signerId: editorDefaultSignerId, params: {} };
    }
    if (previewExcelPath) {
      return { templateId: template.id, excelPath: previewExcelPath, logoId: editorLogoId, signerId: editorDefaultSignerId, params: {} };
    }
    return null;
  }, [template.id, editorDataSource, editorLogoId, editorDefaultSignerId, previewExcelPath]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-0">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Modelli
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <Icon className="w-4 h-4 text-slate-500" />
          <Input
            value={name}
            onChange={e => { setName(e.target.value); setDirty(true); }}
            className="font-semibold text-base h-8 border-0 shadow-none px-0 focus-visible:ring-0 max-w-sm"
          />
          {dirty && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Non salvato</Badge>}
        </div>
        {/* Font picker */}
        <Select value={fontFamily} onValueChange={v => { setFontFamily(v); setDirty(true); }}>
          <SelectTrigger className="h-8 w-44 text-sm" style={{ fontFamily }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-2 pb-1">{group.label}</p>
                {group.fonts.map(f => (
                  <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => setEditorDataSource('db')}
            className={cn(
              'text-xs px-2 py-1 rounded-md transition-colors',
              editorDataSource === 'db' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800',
            )}
          >DB</button>
          <button
            onClick={() => setEditorDataSource('excel')}
            className={cn(
              'text-xs px-2 py-1 rounded-md transition-colors',
              editorDataSource === 'excel' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800',
            )}
          >Excel</button>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => setPreviewOpen(true)}
          disabled={editorDataSource === 'excel' && !previewExcelPath}
          className="gap-1"
        >
          <Eye className="w-3 h-3" /> Anteprima
        </Button>
        <Button onClick={save} disabled={saving || !dirty} size="sm">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
          Salva
        </Button>
      </div>

      <DocPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        session={editorPreviewSession}
        onSessionReady={path => setPreviewExcelPath(path)}
      />

      {/* Main layout: editor + sidebar */}
      <div className="flex flex-1 gap-4 overflow-hidden pt-4">
        {/* Editor panel */}
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contenuto lettera</p>
            <p className="text-xs text-slate-400">
              {detectedFields.length} campi rilevati
              {unmappedFields.length > 0 && (
                <span className="text-amber-600 ml-2">⚠ {unmappedFields.length} non mappati</span>
              )}
            </p>
          </div>
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={e => { setBody(e.target.value); markDirty(); }}
            className="flex-1 font-mono text-xs resize-none leading-relaxed"
            style={{ minHeight: 0 }}
          />
          {/* Unmapped warnings */}
          {unmappedFields.length > 0 && (
            <div className="flex flex-wrap gap-1 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-xs text-amber-700 font-medium">Campi non riconosciuti:</span>
              {unmappedFields.map(f => (
                <Badge key={f} variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                  {'{' + f + '}'}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 flex flex-col gap-0 overflow-hidden border border-slate-200 rounded-xl">
          <Tabs defaultValue="fields" className="flex flex-col h-full">
            <TabsList className="rounded-none rounded-t-xl border-b border-slate-200 h-9 bg-slate-50">
              <TabsTrigger value="fields" className="text-xs flex-1">Campi</TabsTrigger>
              <TabsTrigger value="mapping" className="text-xs flex-1">Mapping Excel</TabsTrigger>
              <TabsTrigger value="params" className="text-xs flex-1">Parametri</TabsTrigger>
            </TabsList>

            {/* CAMPI tab */}
            <TabsContent value="fields" className="flex-1 overflow-y-auto p-3 mt-0 space-y-4">
              <p className="text-[11px] text-slate-400">
                Clicca un campo per inserirlo nella posizione del cursore nel testo.
              </p>
              {category === 'hr' ? (
                // HR dynamic palette from API
                hrFieldGroups.map(group => (
                  <div key={group.id}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{group.label}</p>
                    <div className="flex flex-wrap gap-1">
                      {group.fields.map(field => {
                        const isUsed = detectedFields.includes(field.key);
                        if (field.isLiteral) {
                          return (
                            <button
                              key={field.key}
                              onClick={() => insertAtCursor(field.key)}
                              title={field.label}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded border cursor-pointer transition-colors font-mono',
                                group.color,
                                'hover:opacity-80',
                              )}
                            >
                              {field.key}
                            </button>
                          );
                        }
                        return (
                          <button
                            key={field.key}
                            onClick={() => insertAtCursor(`{${field.key}}`)}
                            title={field.label}
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded border cursor-pointer transition-colors font-mono',
                              group.color,
                              isUsed ? 'ring-1 ring-current font-bold' : 'hover:opacity-80',
                            )}
                          >
                            {'{' + field.key + '}'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                // MBO hardcoded palette
                PALETTE_GROUPS.map(group => (
                  <div key={group.id}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{group.label}</p>
                    <div className="flex flex-wrap gap-1">
                      {group.fields.map(field => {
                        const isUsed = detectedFields.includes(field.key);
                        const f = field as any;
                        if (f.isLoop) {
                          return (
                            <button
                              key={f.key}
                              onClick={() => insertAtCursor(`{#${f.open ?? f.key}}\n\n{/${f.close ?? f.key}}`)}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded border cursor-pointer transition-colors font-mono',
                                group.color,
                                isUsed ? 'ring-1 ring-current' : 'hover:opacity-80',
                              )}
                            >
                              {'{#' + (f.open ?? f.key) + '}…{/' + (f.close ?? f.key) + '}'}
                            </button>
                          );
                        }
                        if (f.open && !f.isLoop) {
                          return (
                            <button
                              key={f.key}
                              onClick={() => insertAtCursor(`{${f.open}}\n\n{${f.close}}`)}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded border cursor-pointer transition-colors font-mono',
                                group.color,
                                'hover:opacity-80',
                              )}
                            >
                              {'{' + f.open + '}'}
                            </button>
                          );
                        }
                        if (f.isLiteral) {
                          return (
                            <button
                              key={f.key}
                              onClick={() => insertAtCursor(f.key)}
                              title={f.label}
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded border cursor-pointer transition-colors font-mono',
                                group.color,
                                'hover:opacity-80',
                              )}
                            >
                              {f.key}
                            </button>
                          );
                        }
                        return (
                          <button
                            key={f.key}
                            onClick={() => insertAtCursor(`{${f.key}}`)}
                            title={f.label + (f.loopOnly ? ' (solo dentro loop obiettivi)' : '')}
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded border cursor-pointer transition-colors font-mono',
                              group.color,
                              isUsed ? 'ring-1 ring-current font-bold' : 'hover:opacity-80',
                              f.loopOnly ? 'opacity-70' : '',
                            )}
                          >
                            {'{' + f.key + '}'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div className="mt-2 p-2 bg-slate-50 rounded-lg border">
                <p className="text-[10px] font-semibold text-slate-600 mb-1">Sintassi condizionali</p>
                <pre className="text-[9px] text-slate-500 leading-relaxed whitespace-pre-wrap">{
`{#isAD}testo solo se AD{/isAD}
{^isAD}testo se NON è AD{/isAD}
{#obiettivi}…{/obiettivi} = loop`
                }</pre>
              </div>
            </TabsContent>

            {/* MAPPING tab */}
            <TabsContent value="mapping" className="flex-1 overflow-y-auto p-3 mt-0">
              <p className="text-[11px] text-slate-400 mb-2">
                Mappa i placeholder del testo alle colonne del file Excel.
              </p>

              {/* Toolbar: carica Excel + Auto-map AI */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  ref={mapExcelInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleMapExcel(f); e.target.value = ''; }}
                />
                <Button
                  size="sm" variant="outline" className="h-7 text-[10px] px-2"
                  disabled={uploadingMapExcel}
                  onClick={() => mapExcelInputRef.current?.click()}
                >
                  {uploadingMapExcel ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                  {mapExcelPreview ? 'Cambia Excel' : 'Carica Excel'}
                </Button>
                <Button
                  size="sm" variant="outline" className="h-7 text-[10px] px-2"
                  disabled={!mapExcelPreview || aiMapping}
                  onClick={handleAiMap}
                  title={mapExcelPreview ? 'Mappa automaticamente con AI' : 'Carica prima un Excel'}
                >
                  {aiMapping ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Star className="w-3 h-3 mr-1" />}
                  Auto-map AI
                </Button>
              </div>
              {mapExcelPreview && (
                <p className="text-[10px] text-slate-400 mb-2">
                  {mapExcelPreview.headers.length} colonne lette — seleziona dai menu a tendina.
                </p>
              )}

              {mappableFields.map(field => {
                const isLoopField = ['idx','codice','indicatore','descrizione','target','peso','modalita_calcolo','tipo_obiettivo','rendicontatore','note'].includes(field);
                const currentMapping = fieldMappings[field] ?? '';
                const conf = mapExcelPreview?.suggestionConfidence?.[field];
                const headerOptions = mapExcelPreview?.headers.map(h => h.name) ?? [];
                // Se il mapping corrente non è tra le colonne lette, lo aggiungo per non perderlo.
                const options = currentMapping && !headerOptions.includes(currentMapping)
                  ? [currentMapping, ...headerOptions]
                  : headerOptions;
                const NONE = '__none__';
                return (
                  <div key={field} className="mb-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <code className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                        {'{' + field + '}'}
                      </code>
                      {isLoopField && <Badge variant="outline" className="text-[9px] py-0 h-4">loop</Badge>}
                      {conf !== undefined && currentMapping && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] py-0 h-4 border-0',
                            conf >= 0.8 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                          )}
                        >
                          {Math.round(conf * 100)}%
                        </Badge>
                      )}
                    </div>
                    {mapExcelPreview ? (
                      <Select
                        value={currentMapping || NONE}
                        onValueChange={v => {
                          setFieldMappings(prev => ({ ...prev, [field]: v === NONE ? '' : v }));
                          setDirty(true);
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="— non mappato —" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE} className="text-xs text-slate-400">— non mappato —</SelectItem>
                          {options.map(opt => (
                            <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={currentMapping}
                        onChange={e => {
                          setFieldMappings(prev => ({ ...prev, [field]: e.target.value }));
                          setDirty(true);
                        }}
                        placeholder="Nome colonna Excel esatto"
                        className="h-7 text-xs"
                      />
                    )}
                  </div>
                );
              })}

              {detectedFields.filter(f => Object.keys(calculatedFields).includes(f)).length > 0 && (
                <div className="mt-3 p-2 bg-purple-50 border border-purple-100 rounded">
                  <p className="text-[10px] font-semibold text-purple-700 mb-1">Campi calcolati (automatici)</p>
                  {detectedFields.filter(f => Object.keys(calculatedFields).includes(f)).map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <code className="text-[10px] font-mono text-purple-700">{'{' + f + '}'}</code>
                      <span className="text-[10px] text-purple-500">→ {calculatedFields[f]}()</span>
                    </div>
                  ))}
                </div>
              )}

              {detectedFields.filter(f => parameters.map(p => p.key).includes(f)).length > 0 && (
                <div className="mt-3 p-2 bg-green-50 border border-green-100 rounded">
                  <p className="text-[10px] font-semibold text-green-700 mb-1">Parametri documento</p>
                  {detectedFields.filter(f => parameters.map(p => p.key).includes(f)).map(f => (
                    <div key={f} className="text-[10px] text-green-600 font-mono">{'{' + f + '}'}</div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* PARAMETRI tab */}
            <TabsContent value="params" className="flex-1 overflow-y-auto p-3 mt-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-slate-400">
                  Valori richiesti al momento della generazione.
                </p>
                <Button
                  size="sm" variant="outline" className="h-6 text-[10px] px-2"
                  onClick={() => {
                    setParameters(prev => [...prev, { key: 'nuovo_campo', type: 'text', label: 'Nuovo campo', default: '', required: false }]);
                    setDirty(true);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Aggiungi
                </Button>
              </div>

              <div className="space-y-3">
                {parameters.map((p, i) => (
                  <div key={i} className="border rounded-lg p-2 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Input
                        value={p.key}
                        onChange={e => {
                          const next = [...parameters];
                          next[i] = { ...p, key: e.target.value };
                          setParameters(next); setDirty(true);
                        }}
                        className="h-6 text-[11px] font-mono bg-white w-36"
                        placeholder="chiave"
                      />
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={p.required}
                            onChange={e => {
                              const next = [...parameters];
                              next[i] = { ...p, required: e.target.checked };
                              setParameters(next); setDirty(true);
                            }}
                            className="w-3 h-3"
                          />
                          req
                        </label>
                        <button onClick={() => { setParameters(prev => prev.filter((_, j) => j !== i)); setDirty(true); }}
                          className="text-red-400 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <Input
                      value={p.label}
                      onChange={e => {
                        const next = [...parameters];
                        next[i] = { ...p, label: e.target.value };
                        setParameters(next); setDirty(true);
                      }}
                      className="h-6 text-[11px] bg-white"
                      placeholder="Etichetta"
                    />
                    <div className="flex gap-1">
                      <select
                        value={p.type}
                        onChange={e => {
                          const next = [...parameters];
                          next[i] = { ...p, type: e.target.value as TemplateParam['type'] };
                          setParameters(next); setDirty(true);
                        }}
                        className="h-6 text-[10px] border rounded px-1 bg-white flex-1"
                      >
                        <option value="text">testo</option>
                        <option value="date">data</option>
                        <option value="currency">valuta</option>
                      </select>
                      <Input
                        value={p.default}
                        onChange={e => {
                          const next = [...parameters];
                          next[i] = { ...p, default: e.target.value };
                          setParameters(next); setDirty(true);
                        }}
                        className="h-6 text-[11px] bg-white flex-1"
                        placeholder="Default"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ─── Beneficiary Check List ───────────────────────────────────────────────────

function BeneficiaryCheckList({
  names,
  subLabels,
  selectedIndices,
  onToggleIndex,
  onToggleAll,
  onSelectOnly,
}: {
  names: string[];
  subLabels?: string[];
  selectedIndices: Set<number> | null;
  onToggleIndex: (i: number) => void;
  onToggleAll: () => void;
  onSelectOnly?: (i: number) => void;
}) {
  const [search, setSearch] = useState('');
  const total = names.length;
  const selectedCount = selectedIndices === null ? total : selectedIndices.size;
  const allSelected = selectedIndices === null;

  const filtered = names
    .map((name, i) => ({ name, i, sub: subLabels?.[i] ?? '' }))
    .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca beneficiario…"
            className="w-full h-7 text-xs border border-slate-200 rounded-md px-2 pr-6 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          onClick={onToggleAll}
          className="text-[10px] text-slate-500 hover:text-slate-800 whitespace-nowrap shrink-0"
        >
          {allSelected ? 'Desel. tutti' : `Sel. tutti (${total})`}
        </button>
        <span className="text-[10px] text-slate-400 shrink-0">{selectedCount}/{total}</span>
      </div>
      <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
        {filtered.map(({ name, i, sub }) => {
          const checked = selectedIndices === null || selectedIndices.has(i);
          return (
            <label
              key={i}
              className={cn(
                'group flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors',
                !checked && 'opacity-40',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleIndex(i)}
                className="w-3.5 h-3.5 shrink-0 accent-slate-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{name || `#${i + 1}`}</p>
                {sub && <p className="text-[10px] text-slate-400 truncate">{sub}</p>}
              </div>
              {onSelectOnly && (
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); onSelectOnly(i); }}
                  className="opacity-0 group-hover:opacity-100 text-[9px] text-slate-400 hover:text-slate-700 shrink-0 transition-opacity px-1 py-0.5 rounded hover:bg-slate-200"
                >
                  solo
                </button>
              )}
            </label>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-2.5 py-3 text-[10px] text-slate-400 text-center">Nessun risultato</div>
        )}
      </div>
    </div>
  );
}

// ─── Generate View ────────────────────────────────────────────────────────────

function GenerateView({ category, onBack }: { category: 'mbo' | 'hr'; onBack: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: allTemplates = [] } = useQuery<DocTemplate[]>({ queryKey: ['/api/doc/templates'] });
  const { data: letterheads = [] } = useQuery<Letterhead[]>({ queryKey: ['/api/doc/letterheads'] });
  const { data: signers = [] } = useQuery<DocSigner[]>({ queryKey: ['/api/doc/signers'] });
  const { data: logos = [] } = useQuery<DocLogo[]>({ queryKey: ['/api/doc/logos'] });
  const { data: capabilities } = useQuery<{ pdfAvailable: boolean }>({ queryKey: ['/api/doc/capabilities'] });

  // Filter templates by category
  const templates = allTemplates.filter(t => (t.category ?? 'mbo') === category);

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  const [selectedSignerId, setSelectedSignerId] = useState('');
  const [selectedLogoId, setSelectedLogoId] = useState('');
  useEffect(() => {
    if (logos.length > 0 && !selectedLogoId) setSelectedLogoId(String(logos[0].id));
  }, [logos]);
  const [logoWidthCm, setLogoWidthCm] = useState(4);
  const [signatureWidthCm, setSignatureWidthCm] = useState(5);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('docx');
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fitToPage, setFitToPage] = useState(false);
  // HR defaults to DB, MBO defaults to excel
  const [dataSource, setDataSource] = useState<'excel' | 'db'>(category === 'hr' ? 'db' : 'excel');
  const [excelPreview, setExcelPreview] = useState<ExcelPreview | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ jobId: string; count: number; zipUrl: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number> | null>(null);
  const [excelNames, setExcelNames] = useState<string[]>([]);
  const [fetchingNames, setFetchingNames] = useState(false);

  const { data: dbBeneficiaries = [] } = useQuery<{ nome: string; qualifica: string; tipologia: string; premioMax: number; nObiettivi: number }[]>({
    queryKey: ['/api/doc/db-beneficiaries'],
    enabled: dataSource === 'db' && category === 'mbo',
  });

  const { data: dbEmployees = [] } = useQuery<{ nome: string; qualifica: string; tipologia: string; premioMax: number; nObiettivi: number }[]>({
    queryKey: ['/api/doc/db-employees'],
    queryFn: () => fetch('/api/doc/employees').then(r => r.json()),
    enabled: dataSource === 'db' && category === 'hr',
  });

  const dbData = category === 'hr' ? dbEmployees : dbBeneficiaries;

  const selectedTemplates = templates.filter(t => selectedTemplateIds.includes(t.id));
  const selectedTemplateId = selectedTemplateIds[0] ?? '';
  // Union of params across all selected templates, deduped by key
  const parsedParams: TemplateParam[] = useMemo(() => {
    const seen = new Set<string>();
    const result: TemplateParam[] = [];
    for (const tmpl of selectedTemplates) {
      const ps: TemplateParam[] = JSON.parse(tmpl.parameters ?? '[]');
      for (const p of ps) {
        if (!seen.has(p.key)) { seen.add(p.key); result.push(p); }
      }
    }
    return result;
  }, [selectedTemplateIds, templates]);

  // Auto-select default signer
  useEffect(() => {
    if (signers.length > 0 && !selectedSignerId) {
      const def = signers.find(s => s.isDefault === 1) ?? signers[0];
      setSelectedSignerId(def.id);
    }
  }, [signers]);

  // Auto-fill defaults when template selection changes
  useEffect(() => {
    if (selectedTemplates.length === 0) return;
    const defaults: Record<string, string> = {};
    for (const tmpl of selectedTemplates) {
      const defs: TemplateParam[] = JSON.parse(tmpl.parameters ?? '[]');
      for (const p of defs) {
        if (!(p.key in defaults)) {
          defaults[p.key] = p.key === 'data_documento' ? new Date().toLocaleDateString('it-IT') : (p.default ?? '');
        }
      }
    }
    setParams(defaults);
  }, [selectedTemplateIds]);

  useEffect(() => { setSelectedIndices(null); setExcelNames([]); }, [dataSource, selectedTemplateId]);
  useEffect(() => { setSelectedIndices(null); setExcelNames([]); }, [excelPreview?.tempPath]);

  useEffect(() => {
    if (dataSource !== 'excel' || !excelPreview || !selectedTemplateId) { setExcelNames([]); return; }
    setFetchingNames(true);
    fetch('/api/doc/jobs/preview-meta', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: selectedTemplateId, excelPath: excelPreview.tempPath }),
    })
      .then(r => r.json())
      .then(d => setExcelNames(d.names ?? []))
      .catch(() => setExcelNames([]))
      .finally(() => setFetchingNames(false));
  }, [dataSource, selectedTemplateId, excelPreview?.tempPath]);


  const totalBeneficiaries = dataSource === 'db' ? dbData.length : excelNames.length;
  const selectedCount = selectedIndices === null ? totalBeneficiaries : selectedIndices.size;

  function toggleIndex(i: number) {
    setSelectedIndices(prev => {
      if (prev === null) {
        const next = new Set<number>();
        for (let j = 0; j < totalBeneficiaries; j++) if (j !== i) next.add(j);
        return next;
      }
      const next = new Set<number>();
      prev.forEach(x => next.add(x));
      if (next.has(i)) next.delete(i);
      else { next.add(i); if (next.size === totalBeneficiaries) return null; }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIndices(prev => prev === null ? new Set<number>() : null);
  }

  function selectOnly(i: number) {
    setSelectedIndices(new Set<number>([i]));
  }

  async function handleExcel(file: File) {
    setUploadingExcel(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/doc/excel/preview', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExcelPreview(data);
      toast({ title: `${data.headers.length} colonne, dati caricati` });
    } catch (e) {
      toast({ title: 'Errore upload Excel', description: String(e), variant: 'destructive' });
    } finally {
      setUploadingExcel(false);
    }
  }

  async function handleInlineLogoUpload(file: File) {
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', file.name.replace(/\.(png|jpe?g)$/i, ''));
    try {
      const res = await fetch('/api/doc/logos', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const newLogo: DocLogo = await res.json();
      qc.invalidateQueries({ queryKey: ['/api/doc/logos'] });
      setSelectedLogoId(String(newLogo.id));
      toast({ title: 'Logo caricato' });
    } catch (e) {
      toast({ title: 'Errore upload logo', description: String(e), variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  }

  function buildPreviewSession(): PreviewSession | null {
    if (!selectedTemplateId) return null;
    const layoutProps = { pageOrientation, fitToPage, logoWidthCm, signatureWidthCm };
    if (dataSource === 'db') {
      return {
        templateId: selectedTemplateId,
        signerId: selectedSignerId || undefined,
        logoId: selectedLogoId || undefined,
        dataSource: 'db',
        params,
        ...layoutProps,
      };
    }
    if (!excelPreview) return null;
    return {
      templateId: selectedTemplateId,
      signerId: selectedSignerId || undefined,
      logoId: selectedLogoId || undefined,
      dataSource: 'excel',
      excelPath: excelPreview.tempPath,
      params,
      ...layoutProps,
    };
  }

  function openPreview() {
    if (!buildPreviewSession()) return;
    setPreviewOpen(true);
  }

  async function downloadPreview() {
    const session = buildPreviewSession();
    if (!session) return;
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/doc/jobs/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...session, index: 0 }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'preview.docx'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: 'Errore download', description: String(e), variant: 'destructive' });
    } finally {
      setLoadingPreview(false);
    }
  }

  async function generate() {
    if (selectedTemplateIds.length === 0) return;
    if (dataSource === 'excel' && !excelPreview) return;
    setGenerating(true);
    try {
      const templatePayload = selectedTemplateIds.length === 1
        ? { templateId: selectedTemplateIds[0] }
        : { templateIds: selectedTemplateIds };
      const res = await apiRequest('POST', '/api/doc/jobs/generate', {
        ...templatePayload,
        signerId: selectedSignerId || undefined,
        logoId: selectedLogoId || undefined,
        ...(dataSource === 'db' ? { dataSource: 'db' } : { excelPath: excelPreview!.tempPath }),
        params,
        outputFormat,
        pageOrientation,
        fitToPage,
        logoWidthCm,
        signatureWidthCm,
        ...(selectedIndices !== null ? (() => { const a: number[] = []; selectedIndices.forEach(x => a.push(x)); return { selectedIndices: a }; })() : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      qc.invalidateQueries({ queryKey: ['/api/doc/jobs'] });
      toast({ title: `${data.count} documenti generati` });
    } catch (e) {
      toast({ title: 'Errore generazione', description: String(e), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  const hasData = dataSource === 'db' ? dbData.length > 0 : !!excelPreview;
  const canGenerate = selectedTemplateIds.length > 0 && hasData && parsedParams.filter(p => p.required).every(p => params[p.key]?.trim()) && (selectedIndices === null ? totalBeneficiaries > 0 : selectedIndices.size > 0);

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Modelli</Button>
          <h2 className="text-lg font-semibold text-slate-900">Generazione completata</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="text-xl font-semibold">{result.count} lettere generate</p>
            <a href={result.zipUrl} download>
              <Button size="lg" className="gap-2"><Download className="w-4 h-4" /> Scarica ZIP</Button>
            </a>
            <Button variant="outline" onClick={() => { setResult(null); }}>Genera ancora</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Modelli</Button>
        <h2 className="text-lg font-semibold text-slate-900">Genera documenti</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: template + excel */}
        <div className="flex flex-col gap-4">
          {/* Template selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">1. Tipo di lettera</CardTitle>
                {selectedTemplateIds.length > 1 && (
                  <span className="text-xs text-violet-600 font-medium bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                    {selectedTemplateIds.length} selezionati → ZIP con cartelle
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {templates.map(t => {
                  const meta = LETTER_TYPES[t.letterType];
                  const Icon = meta?.icon ?? FileText;
                  const isSelected = selectedTemplateIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={cn(
                        'border rounded-lg p-3 cursor-pointer transition-colors flex items-center gap-3',
                        isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          setSelectedTemplateIds(prev =>
                            e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id)
                          );
                        }}
                        className="w-4 h-4 accent-slate-700 shrink-0"
                      />
                      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.letterType} · v{t.version}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </label>
                  );
                })}
              </div>
              {selectedTemplateIds.length > 1 && (
                <p className="text-[11px] text-slate-400 mt-2">
                  ZIP organizzato per dipendente: <code className="bg-slate-100 px-1 rounded">Nome_Cognome/Nome_Cognome_tipologia.docx</code>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Signer */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">2. Firmatario (opzionale)</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              {signers.length === 0 ? (
                <p className="text-xs text-slate-500">Nessun firmatario configurato. Gestisci i firmatari nella sezione qui sotto.</p>
              ) : (
                <select
                  value={selectedSignerId}
                  onChange={e => setSelectedSignerId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Senza firma</option>
                  {signers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.role}{s.isDefault ? ' ★' : ''}</option>
                  ))}
                </select>
              )}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 shrink-0">Larghezza firma</label>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number" min={1} max={16} step={0.5}
                    value={signatureWidthCm}
                    onChange={e => setSignatureWidthCm(Math.max(1, Math.min(16, Number(e.target.value))))}
                    className="w-20 h-7 border rounded px-2 text-sm text-right"
                  />
                  <span className="text-xs text-slate-400">cm</span>
                  <button onClick={() => setSignatureWidthCm(5)} className="text-[10px] text-slate-400 hover:text-slate-700 ml-1 underline">reset 5cm</button>
                </div>
              </div>
              <p className="text-xs text-slate-400">Placeholder <code className="bg-slate-100 px-1 rounded">[FIRMA]</code> nel template.</p>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4" /> 3. Logo aziendale (opzionale)</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <input
                ref={logoFileRef}
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleInlineLogoUpload(f); e.target.value = ''; }}
              />
              {logos.length === 0 ? (
                <div
                  className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-slate-400 transition-colors"
                  onClick={() => logoFileRef.current?.click()}
                >
                  {uploadingLogo ? (
                    <Loader2 className="w-5 h-5 mx-auto text-slate-400 animate-spin mb-1" />
                  ) : (
                    <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  )}
                  <p className="text-xs font-medium text-slate-600">Carica logo PNG/JPG</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Verrà inserito nel documento generato</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedLogoId}
                    onChange={e => setSelectedLogoId(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Senza logo</option>
                    {logos.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <Button
                    size="sm" variant="outline" className="shrink-0"
                    onClick={() => logoFileRef.current?.click()}
                    disabled={uploadingLogo}
                    title="Carica nuovo logo"
                  >
                    {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 shrink-0">Larghezza logo</label>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number" min={1} max={16} step={0.5}
                    value={logoWidthCm}
                    onChange={e => setLogoWidthCm(Math.max(1, Math.min(16, Number(e.target.value))))}
                    className="w-20 h-7 border rounded px-2 text-sm text-right"
                  />
                  <span className="text-xs text-slate-400">cm</span>
                  <button onClick={() => setLogoWidthCm(4)} className="text-[10px] text-slate-400 hover:text-slate-700 ml-1 underline">reset 4cm</button>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Per la Scheda Obiettivi il logo appare in basso a destra. Per altri template usa il placeholder <code className="bg-slate-100 px-1 rounded">[LOGO]</code>.
              </p>
            </CardContent>
          </Card>

          {/* Data source */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">4. Sorgente dati beneficiari</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setDataSource('excel')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-medium transition-colors',
                    dataSource === 'excel' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400',
                  )}
                >
                  <Upload className="w-3.5 h-3.5" /> File Excel
                </button>
                <button
                  onClick={() => setDataSource('db')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-medium transition-colors',
                    dataSource === 'db' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-400',
                  )}
                >
                  <Database className="w-3.5 h-3.5" /> Database piattaforma
                </button>
              </div>

              {/* Excel panel */}
              {dataSource === 'excel' && (
                excelPreview ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-emerald-800">{excelPreview.sheets[0]}</p>
                        <p className="text-xs text-emerald-600">{excelPreview.headers.length} colonne</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setExcelPreview(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    {fetchingNames ? (
                      <div className="flex items-center gap-2 py-1 text-slate-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-xs">Caricamento beneficiari…</span>
                      </div>
                    ) : excelNames.length > 0 ? (
                      <BeneficiaryCheckList
                        names={excelNames}
                        selectedIndices={selectedIndices}
                        onToggleIndex={toggleIndex}
                        onToggleAll={toggleAll}
                        onSelectOnly={selectOnly}
                      />
                    ) : !selectedTemplateId ? (
                      <p className="text-xs text-slate-400">Seleziona un tipo di lettera per vedere i beneficiari.</p>
                    ) : null}
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-500 transition-colors"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleExcel(f); }}
                  >
                    {uploadingExcel ? (
                      <Loader2 className="w-6 h-6 mx-auto text-slate-400 animate-spin mb-1" />
                    ) : (
                      <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                    )}
                    <p className="text-xs font-medium">.xlsx — foglio "Dettaglio Obiettivi"</p>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleExcel(f); }} />
                  </div>
                )
              )}

              {/* DB panel */}
              {dataSource === 'db' && (
                dbData.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700">
                      {category === 'hr'
                        ? 'Nessun dipendente attivo trovato nel database.'
                        : 'Nessun utente con obiettivi assegnati trovato nel database.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 p-2 bg-sky-50 border border-sky-200 rounded-lg">
                      <Database className="w-4 h-4 text-sky-600" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-sky-800">
                          {dbData.length} {category === 'hr' ? 'dipendenti' : 'beneficiari'} dal database
                        </p>
                        <p className="text-xs text-sky-600">Dati in tempo reale dalla piattaforma</p>
                      </div>
                    </div>
                    <BeneficiaryCheckList
                      names={dbData.map(b => b.nome)}
                      subLabels={dbData.map(b => {
                        if (category === 'hr') return b.qualifica;
                        return `${b.qualifica} · ${b.nObiettivi} ob.${b.premioMax > 0 ? ` · €${b.premioMax.toLocaleString('it-IT')}` : ''}`;
                      })}
                      selectedIndices={selectedIndices}
                      onToggleIndex={toggleIndex}
                      onToggleAll={toggleAll}
                      onSelectOnly={selectOnly}
                    />
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: parameters + format */}
        <div className="flex flex-col gap-4">
          {/* Output format */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileOutput className="w-4 h-4" /> Formato output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'docx', label: '.docx', desc: 'Word' },
                  { value: 'pdf', label: '.pdf', desc: 'PDF', needsLO: true },
                  { value: 'both', label: 'Entrambi', desc: '.docx + .pdf', needsLO: true },
                ] as { value: OutputFormat; label: string; desc: string; needsLO?: boolean }[]).map(opt => {
                  const unavailable = opt.needsLO && capabilities?.pdfAvailable === false;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => !unavailable && setOutputFormat(opt.value)}
                      className={cn(
                        'border rounded-lg p-2 text-center cursor-pointer transition-colors',
                        unavailable ? 'opacity-40 cursor-not-allowed' : 'hover:border-slate-400',
                        outputFormat === opt.value && !unavailable ? 'border-slate-900 bg-slate-50' : 'border-slate-200',
                      )}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-[10px] text-slate-500">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
              {capabilities?.pdfAvailable === false && (
                <p className="text-[10px] text-amber-600 mt-2">
                  LibreOffice non disponibile sul server — solo .docx abilitato.
                  Installa con: <code className="bg-amber-50 px-1">apt-get install libreoffice</code>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Page layout */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" /> Impostazioni pagina
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* Orientation */}
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Orientamento</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'portrait', label: 'Verticale', desc: 'A4 portrait' },
                    { value: 'landscape', label: 'Orizzontale', desc: 'A4 landscape' },
                  ] as { value: 'portrait' | 'landscape'; label: string; desc: string }[]).map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => setPageOrientation(opt.value)}
                      className={cn(
                        'border rounded-lg p-2 text-center cursor-pointer transition-colors',
                        pageOrientation === opt.value ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400',
                      )}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-[10px] text-slate-500">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Fit to page */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fitToPage}
                  onChange={e => setFitToPage(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-slate-700 shrink-0"
                />
                <div>
                  <p className="text-xs font-medium text-slate-700">Adatta alla pagina</p>
                  <p className="text-[10px] text-slate-400">Riduce i margini per comprimere il contenuto su meno pagine.</p>
                </div>
              </label>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="pb-3"><CardTitle className="text-sm">5. Parametri documento</CardTitle></CardHeader>
            <CardContent>
              {parsedParams.length === 0 ? (
                <p className="text-xs text-slate-400">Seleziona un tipo di lettera per vedere i parametri.</p>
              ) : (
                <div className="space-y-3">
                  {parsedParams.map(p => (
                    <div key={p.key}>
                      <Label className="text-xs font-medium">
                        {p.label} {p.required && <span className="text-red-500">*</span>}
                      </Label>
                      {p.type === 'date' ? (
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={params[p.key] ?? ''}
                            onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
                            placeholder="dd/mm/yyyy" className="h-8 text-sm"
                          />
                          <Button size="sm" variant="outline" className="h-8"
                            onClick={() => setParams(prev => ({ ...prev, [p.key]: new Date().toLocaleDateString('it-IT') }))}>
                            Oggi
                          </Button>
                        </div>
                      ) : (
                        <Input
                          value={params[p.key] ?? ''}
                          onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
                          placeholder={p.default} className="h-8 text-sm mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={openPreview}
                disabled={!selectedTemplateId || !hasData || loadingPreview}
                className="flex-1 gap-2"
              >
                {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Anteprima 1°
              </Button>
              <Button
                variant="outline"
                onClick={downloadPreview}
                disabled={!selectedTemplateId || !hasData || loadingPreview}
                className="gap-2 px-3"
                title="Scarica .docx anteprima"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={generate}
              disabled={!canGenerate || generating}
              size="lg"
              className="gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus2 className="w-4 h-4" />}
              {generating ? 'Generazione in corso…' : (() => {
                const nBen = selectedIndices !== null ? selectedIndices.size : totalBeneficiaries;
                const nTmpl = selectedTemplateIds.length;
                if (nTmpl > 1) return `Genera ${nTmpl} lettere × ${nBen} dipendenti → ZIP`;
                return selectedIndices !== null ? `Genera ${nBen} → ZIP` : 'Genera tutti → ZIP';
              })()}
            </Button>
          </div>

          {/* Preview modal */}
          <DocPreviewModal
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            session={previewOpen ? buildPreviewSession() : null}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Document Settings (Letterhead + Logo + Signers) ─────────────────────────

// ─── Doc Settings View ────────────────────────────────────────────────────────

function DocSettingsView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ['/api/doc/settings'],
    queryFn: () => fetch('/api/doc/settings').then(r => r.json()),
  });

  const [defaultFont, setDefaultFont] = useState('Calibri');

  useEffect(() => {
    if (settings?.doc_default_font) setDefaultFont(settings.doc_default_font);
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiRequest('PUT', '/api/doc/settings', data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/doc/settings'] });
      toast({ title: 'Impostazioni salvate' });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Documenti
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Impostazioni generali documenti</h2>
          <p className="text-sm text-slate-500 mt-0.5">Font predefinito, carta intestata, logo aziendale, firmatari</p>
        </div>
      </div>

      {/* Font predefinito */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> Font predefinito
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-slate-500">
            Applicato ai nuovi template e come fallback. Ogni template può sovrascrivere il font nell'editor.
          </p>
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Famiglia di font</Label>
              <Select value={defaultFont} onValueChange={setDefaultFont}>
                <SelectTrigger className="w-64" style={{ fontFamily: defaultFont }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_GROUPS.map(group => (
                    <div key={group.label}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-2 pb-1">{group.label}</p>
                      {group.fonts.map(f => (
                        <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                          <span style={{ fontFamily: f }}>{f}</span>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400" style={{ fontFamily: defaultFont }}>
                Anteprima: Il testo del documento apparirà così — 1234 ABCabc
              </p>
            </div>
            <Button
              onClick={() => saveSettingsMutation.mutate({ doc_default_font: defaultFont })}
              disabled={saveSettingsMutation.isPending || defaultFont === (settings?.doc_default_font ?? 'Calibri')}
              className="mb-5"
            >
              {saveSettingsMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Salva
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assets grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LogoManager />
      </div>

      {/* Signers full width */}
      <SignerManager />
    </div>
  );
}

// ─── Logo Manager ─────────────────────────────────────────────────────────────

function LogoManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { data: logos = [] } = useQuery<DocLogo[]>({ queryKey: ['/api/doc/logos'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/doc/logos/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/doc/logos'] }); },
  });

  async function handleSubmit() {
    if (!selectedFile) { toast({ title: 'Seleziona un file PNG/JPG', variant: 'destructive' }); return; }
    const name = newName.trim() || selectedFile.name.replace(/\.(png|jpe?g)$/i, '');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('name', name);
    try {
      const res = await fetch('/api/doc/logos', { method: 'POST', body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      qc.invalidateQueries({ queryKey: ['/api/doc/logos'] });
      setNewName('');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast({ title: 'Logo caricato' });
    } catch (e) {
      toast({ title: 'Errore upload', description: String(e), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Logo aziendale (PNG/JPG)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Step 1: seleziona file */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            selectedFile ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-400',
          )}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0] ?? null;
              setSelectedFile(f);
              if (f && !newName.trim()) setNewName(f.name.replace(/\.(png|jpe?g)$/i, ''));
            }}
          />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{selectedFile.name}</span>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setSelectedFile(null); setNewName(''); if (fileRef.current) fileRef.current.value = ''; }}
                className="text-slate-400 hover:text-slate-600 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400">
              <Upload className="w-5 h-5" />
              <span className="text-xs">Clicca per selezionare PNG/JPG</span>
            </div>
          )}
        </div>

        {/* Step 2: nome + carica (solo dopo selezione file) */}
        {selectedFile && (
          <div className="flex gap-2">
            <Input
              placeholder="Nome (es. Logo principale)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="flex-1 h-8 text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleSubmit} disabled={uploading}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Carica'}
            </Button>
          </div>
        )}

        <p className="text-xs text-slate-400">
          Il logo viene inserito automaticamente in alto a sinistra di ogni documento. Scala a max 6 cm di larghezza.
        </p>

        {logos.length > 0 && (
          <div className="divide-y">
            {logos.map(l => (
              <div key={l.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm font-medium">{l.name}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-red-500 h-7"
                  onClick={() => deleteMutation.mutate(l.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Signer Manager ──────────────────────────────────────────────────────────

function SignerManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const { data: signers = [] } = useQuery<DocSigner[]>({ queryKey: ['/api/doc/signers'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/doc/signers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/doc/signers'] }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => apiRequest('PUT', `/api/doc/signers/${id}/set-default`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/doc/signers'] }); toast({ title: 'Firmatario predefinito aggiornato' }); },
  });

  async function handleUpload(file: File) {
    if (!newName.trim() || !newRole.trim()) {
      toast({ title: 'Nome e ruolo obbligatori', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', newName);
    fd.append('role', newRole);
    fd.append('isDefault', signers.length === 0 ? 'true' : 'false');
    try {
      const res = await fetch('/api/doc/signers', { method: 'POST', body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      qc.invalidateQueries({ queryKey: ['/api/doc/signers'] });
      setNewName(''); setNewRole('');
      toast({ title: 'Firmatario aggiunto' });
    } catch (e) {
      toast({ title: 'Errore', description: String(e), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <PenLine className="w-4 h-4" /> Firmatari (firma PNG)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            placeholder="Nome (es. Mario Rossi)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Input
            placeholder="Ruolo (AD, Presidente…)"
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            className="w-36 h-8 text-sm"
          />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
            Carica PNG
          </Button>
          <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
        </div>
        {signers.length === 0 ? (
          <p className="text-xs text-slate-400">
            Carica un'immagine PNG della firma. Posiziona il placeholder{' '}
            <code className="bg-slate-100 px-1 rounded">[FIRMA]</code>{' '}
            nel template dove vuoi che appaia.
          </p>
        ) : (
          <div className="divide-y">
            {signers.map(s => (
              <div key={s.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1">
                    {s.name}
                    {s.isDefault === 1 && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  </p>
                  <p className="text-xs text-slate-400">{s.role}</p>
                </div>
                <div className="flex gap-1">
                  {s.isDefault !== 1 && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500"
                      onClick={() => setDefaultMutation.mutate(s.id)}>
                      Predefinito
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-500 h-7"
                    onClick={() => deleteMutation.mutate(s.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Doc Preview Modal ────────────────────────────────────────────────────────

function DocPreviewContent({
  blob,
  onRendered,
}: {
  blob: Blob;
  onRendered?: (contentWidth: number, pageHeight: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';
    setRendering(true);
    setRenderError(null);

    blob.arrayBuffer().then(buf => {
      renderAsync(buf, el, undefined, {
        className: 'docx-preview-container',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        useBase64URL: true,
        renderChanges: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      })
        .then(() => {
          // docx-preview creates: div.docx-preview-container-wrapper > section.docx-preview-container (one per docx section)
          // Since simple letters have one <w:sectPr>, we get ONE section with min-height = page height.
          // We inject absolutely-positioned page rulers at intervals of pageHeightPx.
          const sections = Array.from(
            el.querySelectorAll('section.docx-preview-container')
          ) as HTMLElement[];

          const firstSection = sections[0];
          if (!firstSection) {
            onRendered?.(el.scrollWidth, el.scrollHeight);
            return;
          }

          const contentWidth = firstSection.offsetWidth;

          // Measure one page height in px from the CSS min-height applied by the library
          const minHStr = firstSection.style.minHeight; // e.g. "1056pt" or "29.7cm"
          let pageHeightPx = 0;
          if (minHStr) {
            const probe = document.createElement('div');
            probe.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;height:${minHStr}`;
            document.body.appendChild(probe);
            pageHeightPx = probe.offsetHeight;
            document.body.removeChild(probe);
          }

          // Also ensure section is position:relative for ruler positioning (CSS handles this)

          if (pageHeightPx > 0) {
            const totalH = firstSection.scrollHeight;
            const pageCount = Math.ceil(totalH / pageHeightPx);
            for (let i = 1; i < pageCount; i++) {
              const ruler = document.createElement('div');
              ruler.className = 'docx-page-ruler';
              ruler.style.top = `${pageHeightPx * i}px`;
              const label = document.createElement('span');
              label.textContent = `Pagina ${i + 1}`;
              ruler.appendChild(label);
              firstSection.appendChild(ruler);
            }
          }

          onRendered?.(contentWidth, pageHeightPx || firstSection.scrollHeight);
        })
        .catch(err => setRenderError(String(err)))
        .finally(() => setRendering(false));
    });
  }, [blob]);

  return (
    <>
      {rendering && (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Rendering…</span>
        </div>
      )}
      {renderError && (
        <div className="flex items-center justify-center py-16 gap-2 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{renderError}</span>
        </div>
      )}
      <div ref={containerRef} className="docx-preview-wrapper" />
    </>
  );
}

function DocPreviewModal({
  open,
  onOpenChange,
  session: externalSession,
  onSessionReady,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  session: PreviewSession | null;
  onSessionReady?: (excelPath: string) => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [fetching, setFetching] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [session, setSession] = useState<PreviewSession | null>(externalSession);
  const [zoom, setZoom] = useState(100); // percent
  const [contentWidth, setContentWidth] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);

  function fitToWidth() {
    const area = scrollAreaRef.current;
    if (!area || !contentWidth) return;
    const available = area.clientWidth - 48;
    const pct = Math.round((available / contentWidth) * 100);
    setZoom(Math.max(20, Math.min(300, pct)));
  }

  function fitToPage() {
    const area = scrollAreaRef.current;
    if (!area || !pageHeight || !contentWidth) return;
    const availH = area.clientHeight - 48;
    const availW = area.clientWidth - 48;
    const byH = Math.round((availH / pageHeight) * 100);
    const byW = Math.round((availW / contentWidth) * 100);
    setZoom(Math.max(20, Math.min(300, Math.min(byH, byW))));
  }

  function changeZoom(delta: number) {
    setZoom(z => Math.max(20, Math.min(300, z + delta)));
  }

  // Sync external session
  useEffect(() => { setSession(externalSession); }, [externalSession]);

  // Ctrl+wheel zoom (non-passive so preventDefault works)
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom(z => Math.max(20, Math.min(300, z + (e.deltaY < 0 ? 10 : -10))));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [open]);

  // Reset index when session changes
  useEffect(() => {
    if (open && session) { setIndex(0); setBlob(null); setTotal(0); setNames([]); setZoom(100); setContentWidth(null); setPageHeight(null); }
  }, [open, session?.excelPath, session?.templateId]);

  // Load meta
  useEffect(() => {
    if (!open || !session) return;
    fetch('/api/doc/jobs/preview-meta', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: session.templateId, excelPath: session.excelPath, dataSource: session.dataSource }),
    })
      .then(r => r.json())
      .then(d => { setTotal(d.count ?? 0); setNames(d.names ?? []); })
      .catch(() => {});
  }, [open, session?.excelPath, session?.templateId, session?.dataSource]);

  // Fetch blob — AbortController cancels stale in-flight requests on re-run
  useEffect(() => {
    if (!open || !session) return;
    const ac = new AbortController();
    setFetching(true); setBlob(null);
    fetch('/api/doc/jobs/preview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...session, index }),
      signal: ac.signal,
    })
      .then(r => { if (!r.ok) throw new Error('Errore preview'); return r.blob(); })
      .then(b => { if (!ac.signal.aborted) setBlob(b); })
      .catch(e => { if (!ac.signal.aborted) toast({ title: 'Errore anteprima', description: String(e), variant: 'destructive' }); })
      .finally(() => { if (!ac.signal.aborted) setFetching(false); });
    return () => ac.abort();
  }, [open, session, index]);

  async function handleExcelFile(file: File) {
    setUploadingExcel(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/doc/excel/preview', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newSession: PreviewSession = {
        templateId: session?.templateId ?? '',
        excelPath: data.tempPath,
        signerId: session?.signerId,
        logoId: session?.logoId,
        params: session?.params ?? {},
      };
      setSession(newSession);
      onSessionReady?.(data.tempPath);
    } catch (e) {
      toast({ title: 'Errore upload Excel', description: String(e), variant: 'destructive' });
    } finally {
      setUploadingExcel(false);
    }
  }

  function download() {
    if (!blob) return;
    const fname = names[index] ? `${names[index].replace(/\s+/g, '_')}_preview.docx` : 'preview.docx';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fname; a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPdf() {
    if (!session || pdfBusy) return;
    setPdfBusy(true);
    try {
      const res = await fetch('/api/doc/jobs/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...session, index, format: 'pdf' }),
      });
      if (!res.ok) throw new Error('Errore generazione PDF');
      const b = await res.blob();
      const fname = names[index] ? `${names[index].replace(/\s+/g, '_')}_preview.pdf` : 'preview.pdf';
      const url = URL.createObjectURL(b);
      const a = document.createElement('a'); a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: 'Errore download PDF', description: String(e), variant: 'destructive' });
    } finally {
      setPdfBusy(false);
    }
  }

  const currentName = names[index] ?? `Beneficiario ${index + 1}`;
  const hasSession = !!(session?.excelPath || session?.dataSource === 'db');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-full h-[92vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-4 py-2.5 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-sm font-semibold">Anteprima documento</DialogTitle>
              {hasSession && total > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                    disabled={index === 0 || fetching} onClick={() => setIndex(i => i - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-slate-600 font-medium min-w-[80px] text-center">
                    {index + 1} / {total}
                  </span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                    disabled={index >= total - 1 || fetching} onClick={() => setIndex(i => i + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {hasSession && total > 0 && (
                <span className="text-xs text-slate-500 truncate max-w-[200px]">{currentName}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mr-8">
              {fetching && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              {/* Zoom controls */}
              {blob && (
                <div className="flex items-center gap-0.5 border border-slate-200 rounded-md">
                  <button onClick={() => changeZoom(-15)}
                    className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-l-md text-sm leading-none font-bold">−</button>
                  <span className="px-2 text-xs font-mono text-slate-600 min-w-[3.5rem] text-center select-none">{zoom}%</span>
                  <button onClick={() => changeZoom(15)}
                    className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-sm leading-none font-bold">+</button>
                  <button onClick={fitToWidth}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-l border-slate-200"
                    title="Adatta larghezza">
                    ↔
                  </button>
                  <button onClick={fitToPage}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-r-md border-l border-slate-200"
                    title="Pagina intera">
                    ↕
                  </button>
                </div>
              )}
              {hasSession && (
                <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs text-slate-500"
                  onClick={() => fileRef.current?.click()} disabled={uploadingExcel} title="Cambia file Excel">
                  {uploadingExcel ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Cambia Excel
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={download} disabled={!blob} className="gap-1 h-7 text-xs">
                <Download className="w-3 h-3" /> .docx
              </Button>
              <Button size="sm" variant="outline" onClick={downloadPdf} disabled={!blob || pdfBusy} className="gap-1 h-7 text-xs"
                title="Scarica scheda visualizzata in PDF">
                {pdfBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} .pdf
              </Button>
            </div>
          </div>
        </DialogHeader>

        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleExcelFile(f); e.target.value = ''; }} />

        {/* Body */}
        {!hasSession ? (
          /* Excel upload step */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-slate-500 transition-colors w-full max-w-sm"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleExcelFile(f); }}
            >
              {uploadingExcel
                ? <Loader2 className="w-8 h-8 mx-auto text-slate-400 animate-spin mb-2" />
                : <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              }
              <p className="text-sm font-medium text-slate-600">Carica il file Excel beneficiari</p>
              <p className="text-xs text-slate-400 mt-1">.xlsx — foglio "Dettaglio Obiettivi"</p>
            </div>
            <p className="text-xs text-slate-400">Serve il file Excel per generare l'anteprima con i dati reali.</p>
          </div>
        ) : (
          /* Document area + sidebar */
          <div className="flex flex-1 overflow-hidden">
            {total > 1 && (
              <div className="w-44 border-r border-slate-200 overflow-y-auto shrink-0 bg-slate-50">
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {total} beneficiari
                  </p>
                  {names.map((name, i) => (
                    <button key={i} onClick={() => setIndex(i)}
                      className={cn(
                        'w-full text-left text-xs px-2 py-1.5 rounded transition-colors mb-0.5 truncate',
                        i === index ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-200',
                      )}
                    >
                      {name || `#${i + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div
              ref={scrollAreaRef}
              className="flex-1 overflow-auto bg-slate-100 p-4"
            >
              {open && blob && !fetching && (
                <div style={{ zoom: zoom / 100 }}>
                  <DocPreviewContent
                    key={`${index}-${blob.size}`}
                    blob={blob}
                    onRendered={(w, h) => { setContentWidth(w); setPageHeight(h); }}
                  />
                </div>
              )}
              {fetching && (
                <div className="flex items-center justify-center h-full gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Caricamento…</span>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


