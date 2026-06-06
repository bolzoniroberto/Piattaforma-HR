import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { renderAsync } from "docx-preview";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Letterhead { id: string; name: string; description?: string; filePath: string; uploadedAt: number }
interface DocSigner { id: string; name: string; role: string; signatureImagePath: string; isDefault: number; uploadedAt: number }
type OutputFormat = 'docx' | 'pdf' | 'both';
interface PreviewSession {
  templateId: string;
  letterheadId?: string;
  signerId?: string;
  excelPath?: string;
  dataSource?: 'excel' | 'db';
  params: Record<string, string>;
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
interface ExcelPreview {
  sheets: string[]; headers: { col: string; idx: number; name: string }[];
  rows: Record<string, unknown>[]; suggestedMappings: Record<string, string>;
  tempPath: string;
}

// ─── Known fields palette ─────────────────────────────────────────────────────

const PALETTE_GROUPS = [
  {
    id: 'beneficiario', label: 'Beneficiario', color: 'bg-blue-100 text-blue-800 border-blue-200',
    fields: [
      { key: 'titolo', label: 'Titolo (Dottor/Dottoressa)', calc: true },
      { key: 'saluto_formula', label: 'Saluto (Dottore/Dottoressa)', calc: true },
      { key: 'nome_beneficiario', label: 'Nome completo' },
      { key: 'qualifica', label: 'Qualifica / Area' },
      { key: 'tipologia', label: 'Tipologia scheda (AD, DIRS…)' },
      { key: 'premio_cifre', label: 'Premio in cifre (25.400)', calc: true },
      { key: 'premio_lettere', label: 'Premio in lettere', calc: true },
      { key: 'premio_max', label: 'Premio max (numero grezzo)' },
      { key: 'codice_fiscale', label: 'Codice fiscale' },
      { key: 'indirizzo', label: 'Indirizzo' },
      { key: 'cap', label: 'CAP' },
      { key: 'citta_residenza', label: 'Città residenza' },
      { key: 'prov', label: 'Provincia' },
      { key: 'direzione', label: 'Direzione' },
    ],
  },
  {
    id: 'documento', label: 'Parametri documento', color: 'bg-green-100 text-green-800 border-green-200',
    fields: [
      { key: 'citta', label: 'Città (es. Milano)' },
      { key: 'data_documento', label: 'Data documento' },
      { key: 'anno_piano', label: 'Anno piano MBO' },
      { key: 'anno_bilancio', label: 'Anno bilancio' },
      { key: 'mese_approvazione', label: 'Mese approvazione bilancio' },
      { key: 'entry_gate_fmt', label: 'Entry Gate formattato (es. 19.770.000)', calc: true },
      { key: 'firmatario_default', label: 'Nome firmatario AD' },
      { key: 'firmatario_ad_label', label: 'Label firmatario AD' },
      { key: '[FIRMA]', label: 'Immagine firma (PNG)', isLiteral: true },
    ],
  },
  {
    id: 'condizionali', label: 'Condizionali', color: 'bg-purple-100 text-purple-800 border-purple-200',
    isBlock: true,
    fields: [
      { key: 'isAD', label: 'Se è l\'AD', open: '#isAD', close: '/isAD', counter: '^isAD' },
      { key: 'notAD', label: 'Se NON è l\'AD', open: '^isAD', close: '/isAD' },
    ],
  },
  {
    id: 'obiettivi', label: 'Obiettivi (loop)', color: 'bg-amber-100 text-amber-800 border-amber-200',
    fields: [
      { key: 'obiettivi', label: 'Loop obiettivi', isLoop: true, open: '#obiettivi', close: '/obiettivi' },
      { key: 'idx', label: 'Numero obiettivo (1, 2, 3…)', loopOnly: true },
      { key: 'codice', label: 'Codice (A1, B2…)', loopOnly: true },
      { key: 'indicatore', label: 'Indicatore', loopOnly: true },
      { key: 'descrizione', label: 'Descrizione', loopOnly: true },
      { key: 'target', label: 'Target', loopOnly: true },
      { key: 'peso', label: 'Peso %', loopOnly: true },
      { key: 'modalita_calcolo', label: 'Modalità di calcolo', loopOnly: true },
      { key: 'tipo_obiettivo', label: 'Tipo obiettivo', loopOnly: true },
      { key: 'rendicontatore', label: 'Rendicontatore (fonte)', loopOnly: true },
      { key: 'note', label: 'Note', loopOnly: true },
    ],
  },
];

const ALL_KNOWN_KEYS = new Set([
  ...PALETTE_GROUPS.flatMap(g => g.fields.map(f => f.key)),
  'obiettivi', 'qualifica_upper',
]);

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
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Documenti</h2>
          <p className="mt-1 text-sm text-slate-500">Gestisci e modifica i modelli di lettera</p>
        </div>
        <Button onClick={onGenerate} className="gap-2">
          <FilePlus2 className="w-4 h-4" /> Genera documenti
        </Button>
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

      {/* Letterheads */}
      <LetterheadManager />

      {/* Signers */}
      <SignerManager />

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
      setDirty(false);
      toast({ title: 'Template salvato' });
    } catch (e) {
      toast({ title: 'Errore salvataggio', description: String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const meta = LETTER_TYPES[template.letterType] ?? { label: template.name, icon: FileText, color: 'bg-slate-50' };
  const Icon = meta.icon;

  const editorPreviewSession: PreviewSession | null = previewExcelPath
    ? { templateId: template.id, excelPath: previewExcelPath, params: {} }
    : null;

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
        <div className="flex items-center gap-1">
          <input
            list="font-list"
            value={fontFamily}
            onChange={e => { setFontFamily(e.target.value); setDirty(true); }}
            className="h-8 text-sm border border-slate-200 rounded-md px-2 w-40 focus:outline-none focus:ring-1 focus:ring-slate-400"
            placeholder="Font (es. Calibri)"
            style={{ fontFamily }}
          />
          <datalist id="font-list">
            {['Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Garamond', 'Helvetica', 'Verdana', 'Trebuchet MS', 'Century Gothic', 'Palatino Linotype', 'Book Antiqua', 'Cambria'].map(f => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => setPreviewOpen(true)}
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
              <p className="text-[11px] text-slate-400 mb-3">
                Mappa i placeholder del testo alle colonne del file Excel.
              </p>

              {detectedFields.filter(f =>
                !Object.keys(calculatedFields).includes(f) &&
                !parameters.map(p => p.key).includes(f) &&
                f !== 'obiettivi'
              ).map(field => {
                const isLoopField = ['idx','codice','indicatore','descrizione','target','peso','modalita_calcolo','tipo_obiettivo','rendicontatore','note'].includes(field);
                const currentMapping = fieldMappings[field] ?? '';
                return (
                  <div key={field} className="mb-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <code className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                        {'{' + field + '}'}
                      </code>
                      {isLoopField && <Badge variant="outline" className="text-[9px] py-0 h-4">loop</Badge>}
                    </div>
                    <Input
                      value={currentMapping}
                      onChange={e => {
                        setFieldMappings(prev => ({ ...prev, [field]: e.target.value }));
                        setDirty(true);
                      }}
                      placeholder="Nome colonna Excel esatto"
                      className="h-7 text-xs"
                    />
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
}: {
  names: string[];
  subLabels?: string[];
  selectedIndices: Set<number> | null;
  onToggleIndex: (i: number) => void;
  onToggleAll: () => void;
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
                'flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors',
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
  const { data: capabilities } = useQuery<{ pdfAvailable: boolean }>({ queryKey: ['/api/doc/capabilities'] });

  // Filter templates by category
  const templates = allTemplates.filter(t => (t.category ?? 'mbo') === category);

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedLetterheadId, setSelectedLetterheadId] = useState('');
  const [selectedSignerId, setSelectedSignerId] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('docx');
  // HR defaults to DB, MBO defaults to excel
  const [dataSource, setDataSource] = useState<'excel' | 'db'>(category === 'hr' ? 'db' : 'excel');
  const [excelPreview, setExcelPreview] = useState<ExcelPreview | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [uploadingExcel, setUploadingExcel] = useState(false);
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

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const parsedParams: TemplateParam[] = selectedTemplate ? JSON.parse(selectedTemplate.parameters) : [];

  // Auto-select default signer
  useEffect(() => {
    if (signers.length > 0 && !selectedSignerId) {
      const def = signers.find(s => s.isDefault === 1) ?? signers[0];
      setSelectedSignerId(def.id);
    }
  }, [signers]);

  // Auto-fill defaults when template changes
  useEffect(() => {
    if (!selectedTemplate) return;
    const defs: TemplateParam[] = JSON.parse(selectedTemplate.parameters);
    const defaults: Record<string, string> = {};
    for (const p of defs) {
      defaults[p.key] = p.key === 'data_documento' ? new Date().toLocaleDateString('it-IT') : (p.default ?? '');
    }
    setParams(defaults);
  }, [selectedTemplateId]);

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

  function buildPreviewSession(): PreviewSession | null {
    if (!selectedTemplateId) return null;
    if (dataSource === 'db') {
      return {
        templateId: selectedTemplateId,
        letterheadId: selectedLetterheadId || undefined,
        signerId: selectedSignerId || undefined,
        dataSource: 'db',
        params,
      };
    }
    if (!excelPreview) return null;
    return {
      templateId: selectedTemplateId,
      letterheadId: selectedLetterheadId || undefined,
      signerId: selectedSignerId || undefined,
      dataSource: 'excel',
      excelPath: excelPreview.tempPath,
      params,
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
    if (!selectedTemplateId) return;
    if (dataSource === 'excel' && !excelPreview) return;
    setGenerating(true);
    try {
      const res = await apiRequest('POST', '/api/doc/jobs/generate', {
        templateId: selectedTemplateId,
        letterheadId: selectedLetterheadId || undefined,
        signerId: selectedSignerId || undefined,
        ...(dataSource === 'db' ? { dataSource: 'db' } : { excelPath: excelPreview!.tempPath }),
        params,
        outputFormat,
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
  const canGenerate = selectedTemplateId && hasData && parsedParams.filter(p => p.required).every(p => params[p.key]?.trim()) && (selectedIndices === null ? totalBeneficiaries > 0 : selectedIndices.size > 0);

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Modelli</Button>
          <h2 className="text-2xl font-bold text-slate-900">Generazione completata</h2>
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
        <h2 className="text-2xl font-bold text-slate-900">Genera documenti</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: template + excel */}
        <div className="flex flex-col gap-4">
          {/* Template selection */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">1. Tipo di lettera</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {templates.map(t => {
                  const meta = LETTER_TYPES[t.letterType];
                  const Icon = meta?.icon ?? FileText;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={cn(
                        'border rounded-lg p-3 cursor-pointer transition-colors flex items-center gap-3',
                        selectedTemplateId === t.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400',
                      )}
                    >
                      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.letterType} · v{t.version}</p>
                      </div>
                      {selectedTemplateId === t.id && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Letterhead */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">2. Carta intestata (opzionale)</CardTitle></CardHeader>
            <CardContent>
              {letterheads.length === 0 ? (
                <p className="text-xs text-slate-500">Nessuna carta intestata. Verranno generati documenti senza header/footer.</p>
              ) : (
                <select
                  value={selectedLetterheadId}
                  onChange={e => setSelectedLetterheadId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Senza carta intestata</option>
                  {letterheads.map(lh => <option key={lh.id} value={lh.id}>{lh.name}</option>)}
                </select>
              )}
            </CardContent>
          </Card>

          {/* Signer */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">3. Firmatario (opzionale)</CardTitle></CardHeader>
            <CardContent>
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
              <p className="text-xs text-slate-400 mt-1">La firma viene inserita dove posizioni il placeholder <code className="bg-slate-100 px-1 rounded">[FIRMA]</code> nel template.</p>
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
              {generating ? 'Generazione in corso…' : selectedIndices !== null ? `Genera ${selectedIndices.size} → ZIP` : 'Genera tutti → ZIP'}
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

function DocPreviewContent({ blob }: { blob: Blob }) {
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
      <div ref={containerRef} className="docx-preview-wrapper mx-auto" />
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
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [fetching, setFetching] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [session, setSession] = useState<PreviewSession | null>(externalSession);

  // Sync external session
  useEffect(() => { setSession(externalSession); }, [externalSession]);

  // Reset index when session changes
  useEffect(() => {
    if (open && session) { setIndex(0); setBlob(null); setTotal(0); setNames([]); }
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

  // Fetch blob
  useEffect(() => {
    if (!open || !session) return;
    setFetching(true); setBlob(null);
    fetch('/api/doc/jobs/preview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...session, index }),
    })
      .then(r => { if (!r.ok) throw new Error('Errore preview'); return r.blob(); })
      .then(b => setBlob(b))
      .catch(e => toast({ title: 'Errore anteprima', description: String(e), variant: 'destructive' }))
      .finally(() => setFetching(false));
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
            <div className="flex items-center gap-2">
              {fetching && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
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
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              {open && blob && !fetching && <DocPreviewContent key={`${index}-${blob.size}`} blob={blob} />}
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

// ─── Letterhead Manager ───────────────────────────────────────────────────────

function LetterheadManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState('');
  const { data: letterheads = [] } = useQuery<Letterhead[]>({ queryKey: ['/api/doc/letterheads'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/doc/letterheads/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/doc/letterheads'] }); },
  });

  async function handleUpload(file: File) {
    if (!newName.trim()) { toast({ title: 'Inserisci nome', variant: 'destructive' }); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file); fd.append('name', newName);
    try {
      const res = await fetch('/api/doc/letterheads', { method: 'POST', body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      qc.invalidateQueries({ queryKey: ['/api/doc/letterheads'] });
      setNewName('');
      toast({ title: 'Carta intestata caricata' });
    } catch (e) {
      toast({ title: 'Errore', description: String(e), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Carte intestate (.docx)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            placeholder="Nome carta intestata"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
            Carica .docx
          </Button>
          <input ref={fileRef} type="file" accept=".docx" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        </div>
        {letterheads.length === 0 ? (
          <p className="text-xs text-slate-400">
            Carica un file .docx con header e footer aziendali.
            Il corpo del documento deve contenere il segnaposto <code className="bg-slate-100 px-1 rounded">{'{{BODY}}'}</code>.
          </p>
        ) : (
          <div className="divide-y">
            {letterheads.map(lh => (
              <div key={lh.id} className="py-2 flex items-center justify-between">
                <p className="text-sm font-medium">{lh.name}</p>
                <Button size="sm" variant="ghost" className="text-red-500 h-7"
                  onClick={() => deleteMutation.mutate(lh.id)}>
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
