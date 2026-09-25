import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import {
  FileText, ImageIcon, PenLine, Upload, Loader2, Trash2, Star, X, UserCheck,
  ArrowLeftRight, Plus, GripVertical, ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocLogo { id: string; name: string; filePath: string; uploadedAt: number }
interface DocSigner { id: string; name: string; role: string; signatureImagePath: string; isDefault: number; uploadedAt: number }

interface FieldDef { key: string; label: string; isLiteral?: boolean; isLoop?: boolean }
interface FieldGroup { id: string; label: string; color: string; fields: FieldDef[] }

// ─── Font groups ──────────────────────────────────────────────────────────────

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

// ─── Global param definitions (esclusi firmatario AD — gestiti in sezione dedicata) ──

const GLOBAL_PARAMS: { key: string; label: string; placeholder: string; hint?: string }[] = [
  { key: 'param_citta', label: 'Città mittente', placeholder: 'es. Milano' },
  { key: 'param_anno_piano', label: 'Anno piano MBO', placeholder: `es. ${new Date().getFullYear()}` },
  { key: 'param_anno_bilancio', label: 'Anno bilancio', placeholder: `es. ${new Date().getFullYear() - 1}` },
  { key: 'param_mese_approvazione', label: 'Mese approvazione bilancio', placeholder: 'es. marzo' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDocSettingsPage() {
  return (
    <div className="w-full space-y-6">
      <PageHeader
        context="DOCUMENTI"
        title="Impostazioni documenti"
        description="Parametri globali, font predefinito, logo aziendale e firmatari."
      />
      <div className="flex flex-col gap-6 max-w-4xl">
        <GlobalParamsSection />
        <AdSignerSection />
        <FontSection />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LogoManager />
        </div>
        <OtherSignersSection />
        <FieldMappingSection />
      </div>
    </div>
  );
}

// ─── Global Params Section ────────────────────────────────────────────────────

function GlobalParamsSection() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ['/api/doc/settings'],
    queryFn: () => fetch('/api/doc/settings', { credentials: 'include' }).then(r => r.json()),
  });

  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!settings) return;
    const init: Record<string, string> = {};
    for (const p of GLOBAL_PARAMS) init[p.key] = settings[p.key] ?? '';
    setValues(init);
    setDirty(false);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiRequest('PUT', '/api/doc/settings', data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/doc/settings'] });
      setDirty(false);
      toast({ title: 'Parametri salvati' });
    },
  });

  function set(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" /> Parametri globali documento
        </CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">
          Valori predefiniti usati in tutte le lettere. Ogni template può sovrascriverli nella sezione Parametri dell'editor.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GLOBAL_PARAMS.map(p => (
            <div key={p.key} className="flex flex-col gap-1">
              <Label className="text-xs font-medium">{p.label}</Label>
              <Input
                value={values[p.key] ?? ''}
                onChange={e => set(p.key, e.target.value)}
                placeholder={p.placeholder}
                className="h-8 text-sm"
              />
              {p.hint && <p className="text-[11px] text-slate-400">{p.hint}</p>}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => saveMutation.mutate(values)}
            disabled={saveMutation.isPending || !dirty}
            size="sm"
          >
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Salva parametri
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AD Signer Section ────────────────────────────────────────────────────────

function AdSignerSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [savingParams, setSavingParams] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ['/api/doc/settings'],
    queryFn: () => fetch('/api/doc/settings', { credentials: 'include' }).then(r => r.json()),
  });

  const { data: signers = [] } = useQuery<DocSigner[]>({ queryKey: ['/api/doc/signers'] });

  const [nomeFirmatario, setNomeFirmatario] = useState('');
  const [labelFirmatario, setLabelFirmatario] = useState('');
  const [paramsDirty, setParamsDirty] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setNomeFirmatario(settings.param_firmatario_default ?? '');
    setLabelFirmatario(settings.param_firmatario_ad_label ?? '');
    setParamsDirty(false);
  }, [settings]);

  const adSigner = signers.find(s => s.isDefault === 1) ?? signers[0] ?? null;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/doc/signers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/doc/signers'] });
      toast({ title: 'Firma rimossa' });
    },
  });

  async function handleSaveParams() {
    setSavingParams(true);
    try {
      await apiRequest('PUT', '/api/doc/settings', {
        param_firmatario_default: nomeFirmatario,
        param_firmatario_ad_label: labelFirmatario,
      });
      qc.invalidateQueries({ queryKey: ['/api/doc/settings'] });
      setParamsDirty(false);
      toast({ title: 'Dati firmatario AD salvati' });
    } catch (e) {
      toast({ title: 'Errore salvataggio', description: String(e), variant: 'destructive' });
    } finally {
      setSavingParams(false);
    }
  }

  async function handleUploadSignature(file: File) {
    const name = nomeFirmatario.trim() || 'Firmatario AD';
    const role = labelFirmatario.trim() || 'Amministratore Delegato';
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', name);
    fd.append('role', role);
    fd.append('isDefault', 'true');
    try {
      const res = await fetch('/api/doc/signers', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      qc.invalidateQueries({ queryKey: ['/api/doc/signers'] });
      toast({ title: 'Firma AD caricata' });
    } catch (e) {
      toast({ title: 'Errore upload firma', description: String(e), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Firmatario AD
        </CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">
          Configura il nome, la qualifica e la firma dell'Amministratore Delegato. Usati nei placeholder{' '}
          <code className="bg-slate-100 px-1 rounded text-[10px]">{'{firmatario_default}'}</code>{', '}
          <code className="bg-slate-100 px-1 rounded text-[10px]">{'{firmatario_ad_label}'}</code>{' e '}
          <code className="bg-slate-100 px-1 rounded text-[10px]">[FIRMA]</code>.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Text params */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium">Nome completo AD</Label>
            <Input
              value={nomeFirmatario}
              onChange={e => { setNomeFirmatario(e.target.value); setParamsDirty(true); }}
              placeholder="es. Mario Rossi"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium">Qualifica / Label</Label>
            <Input
              value={labelFirmatario}
              onChange={e => { setLabelFirmatario(e.target.value); setParamsDirty(true); }}
              placeholder="es. Amministratore Delegato"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSaveParams}
            disabled={savingParams || !paramsDirty}
          >
            {savingParams ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Salva dati AD
          </Button>
        </div>

        {/* Signature upload */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-slate-700">Immagine firma (PNG/JPG)</p>

          {adSigner ? (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <PenLine className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium flex items-center gap-1">
                    {adSigner.name}
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  </p>
                  <p className="text-xs text-slate-400">{adSigner.role}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline" className="h-7 text-xs gap-1"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Sostituisci
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-7 text-red-500"
                  onClick={() => deleteMutation.mutate(adSigner.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center cursor-pointer hover:border-slate-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 mx-auto text-slate-400 animate-spin mb-1" />
              ) : (
                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              )}
              <p className="text-xs font-medium text-slate-600">Carica immagine firma PNG/JPG</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Usata nel placeholder <code className="bg-slate-100 px-1 rounded">[FIRMA]</code> del template
              </p>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadSignature(f); e.target.value = ''; }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Font Section ─────────────────────────────────────────────────────────────

const FONT_SIZES = ['9', '10', '10.5', '11', '11.5', '12', '14'] as const;

function FontSection() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ['/api/doc/settings'],
    queryFn: () => fetch('/api/doc/settings', { credentials: 'include' }).then(r => r.json()),
  });

  const [defaultFont, setDefaultFont] = useState('Calibri');
  const [defaultFontSize, setDefaultFontSize] = useState('11');

  useEffect(() => {
    if (!settings) return;
    if (settings.doc_default_font) setDefaultFont(settings.doc_default_font);
    if (settings.doc_default_font_size) setDefaultFontSize(settings.doc_default_font_size);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiRequest('PUT', '/api/doc/settings', data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/doc/settings'] });
      toast({ title: 'Impostazioni font salvate' });
    },
  });

  const isDirty =
    defaultFont !== (settings?.doc_default_font ?? 'Calibri') ||
    defaultFontSize !== (settings?.doc_default_font_size ?? '11');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" /> Font predefinito
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          Applicato a tutti i documenti generati. Ogni template può sovrascrivere il font nell'editor.
        </p>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Famiglia di font</Label>
            <Select value={defaultFont} onValueChange={setDefaultFont}>
              <SelectTrigger className="w-56" style={{ fontFamily: defaultFont }}>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Dimensione (pt)</Label>
            <Select value={defaultFontSize} onValueChange={setDefaultFontSize}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map(s => (
                  <SelectItem key={s} value={s}>{s} pt</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => saveMutation.mutate({ doc_default_font: defaultFont, doc_default_font_size: defaultFontSize })}
            disabled={saveMutation.isPending || !isDirty}
            className="mb-0.5"
            size="sm"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            Salva
          </Button>
        </div>
        <p className="text-[11px] text-slate-400" style={{ fontFamily: defaultFont, fontSize: `${defaultFontSize}pt` }}>
          Anteprima: Il testo del documento apparirà così — 1234 ABCabc
        </p>
      </CardContent>
    </Card>
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
      const res = await fetch('/api/doc/logos', { method: 'POST', body: fd, credentials: 'include' });
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

// ─── Other Signers Section ────────────────────────────────────────────────────

function OtherSignersSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const { data: signers = [] } = useQuery<DocSigner[]>({ queryKey: ['/api/doc/signers'] });

  const otherSigners = signers.filter(s => s.isDefault !== 1);

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
    fd.append('isDefault', 'false');
    try {
      const res = await fetch('/api/doc/signers', { method: 'POST', body: fd, credentials: 'include' });
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
          <PenLine className="w-4 h-4" /> Altri firmatari
        </CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">Firmatari aggiuntivi selezionabili al momento della generazione.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            placeholder="Nome (es. Luigi Bianchi)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Input
            placeholder="Ruolo (Presidente…)"
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

        {otherSigners.length === 0 ? (
          <p className="text-xs text-slate-400">
            Nessun firmatario aggiuntivo. Usa il form sopra per aggiungerne.
          </p>
        ) : (
          <div className="divide-y">
            {otherSigners.map(s => (
              <div key={s.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.role}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500"
                    onClick={() => setDefaultMutation.mutate(s.id)}>
                    Imposta AD
                  </Button>
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

// ─── Field Mapping Section ────────────────────────────────────────────────────
//
// Modello: i placeholder della lettera sono LIBERI (l'utente li chiama come vuole).
// Ogni placeholder è una "scatola" a cui si trascina UN campo del database.
// In generazione il placeholder viene risolto col valore del campo DB associato.

interface MappingRow {
  id: string;
  placeholder: string;
  dbField: string | null;
  dbFieldLabel: string | null;
  dbFieldColor: string | null;
}

type MappingCategory = 'mbo' | 'hr';

// Panel that manages one category's mapping (MBO or HR).
// Pannello destro = veri campi DB della categoria (API /data-fields), SSoT.
function MappingPanel({ category }: { category: MappingCategory }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const apiUrl = `/api/doc/field-mapping?category=${category}`;
  const dbFieldsUrl = `/api/doc/data-fields?category=${category}`;

  // Veri campi del database per questa categoria
  const { data: dbGroups = [] } = useQuery<FieldGroup[]>({
    queryKey: [dbFieldsUrl],
    queryFn: () => fetch(dbFieldsUrl, { credentials: 'include' }).then(r => r.json()),
  });

  const { data: savedMapping } = useQuery<Record<string, string>>({
    queryKey: [apiUrl],
    queryFn: () => fetch(apiUrl, { credentials: 'include' }).then(r => r.json()),
  });

  const [rows, setRows] = useState<MappingRow[]>([]);
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [dragField, setDragField] = useState<{ key: string; label: string; color: string } | null>(null);
  const [dragOverRow, setDragOverRow] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Espandi i primi 3 gruppi una volta caricati
  useEffect(() => {
    if (dbGroups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(dbGroups.slice(0, 3).map(g => g.id)));
    }
  }, [dbGroups, expandedGroups.size]);

  const fieldMeta = useCallback((key: string) => {
    for (const g of dbGroups) {
      const f = g.fields.find(f => f.key === key);
      if (f) return { label: f.label, color: g.color };
    }
    return { label: key, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }, [dbGroups]);

  // Carica SOLO il mapping salvato. Nessun pre-load: si parte vuoti.
  useEffect(() => {
    if (savedMapping === undefined) return;
    if (initialized) return;
    setInitialized(true);
    setRows(Object.entries(savedMapping).map(([placeholder, dbField]) => {
      const meta = fieldMeta(dbField);
      return { id: crypto.randomUUID(), placeholder, dbField, dbFieldLabel: meta.label, dbFieldColor: meta.color };
    }));
    setDirty(false);
  }, [savedMapping, initialized, fieldMeta]);

  const saveMutation = useMutation({
    mutationFn: (mapping: Record<string, string>) =>
      apiRequest('PUT', `/api/doc/field-mapping?category=${category}`, mapping).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [apiUrl] });
      setDirty(false);
      toast({ title: 'Mappatura salvata' });
    },
    onError: (e) => toast({ title: 'Errore salvataggio', description: String(e), variant: 'destructive' }),
  });

  function handleSave() {
    const mapping: Record<string, string> = {};
    for (const row of rows) {
      const key = row.placeholder.trim().replace(/^\{|\}$/g, '');
      if (key && row.dbField) mapping[key] = row.dbField;
    }
    saveMutation.mutate(mapping);
  }

  function addRow() {
    const key = newPlaceholder.trim().replace(/^\{|\}$/g, '');
    if (!key) return;
    if (rows.some(r => r.placeholder === key)) {
      toast({ title: 'Placeholder già presente', variant: 'destructive' });
      return;
    }
    setRows(prev => [...prev, { id: crypto.randomUUID(), placeholder: key, dbField: null, dbFieldLabel: null, dbFieldColor: null }]);
    setNewPlaceholder('');
    setDirty(true);
  }

  function removeRow(id: string) { setRows(prev => prev.filter(r => r.id !== id)); setDirty(true); }

  function clearBinding(id: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, dbField: null, dbFieldLabel: null, dbFieldColor: null } : r));
    setDirty(true);
  }

  function bindField(rowId: string, key: string, label: string, color: string) {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, dbField: key, dbFieldLabel: label, dbFieldColor: color } : r));
    setDragOverRow(null);
    setDragField(null);
    setDirty(true);
  }

  function toggleGroup(id: string) {
    setExpandedGroups(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  return (
    <div className="flex gap-4 items-start">
      {/* Left: placeholder rows (liberi) */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Placeholder lettera</p>

        {/* Add row — in cima: si crea prima il placeholder */}
        <div className="flex gap-2">
          <Input
            value={newPlaceholder}
            onChange={e => setNewPlaceholder(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRow()}
            placeholder="Nome libero, es. nome_dipendente"
            className="h-8 text-xs font-mono flex-1"
          />
          <Button size="sm" variant="outline" onClick={addRow} className="gap-1 shrink-0">
            <Plus className="w-3 h-3" /> Crea placeholder
          </Button>
        </div>

        {rows.length === 0 && (
          <p className="text-xs text-slate-400 italic mt-1">
            Nessun placeholder. Crea un nome libero qui sopra, poi trascina un campo DB sulla sua riga.
          </p>
        )}

        {rows.map(row => (
          <div
            key={row.id}
            onDragOver={e => { e.preventDefault(); setDragOverRow(row.id); }}
            onDragLeave={() => setDragOverRow(null)}
            onDrop={e => { e.preventDefault(); if (dragField) bindField(row.id, dragField.key, dragField.label, dragField.color); }}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
              dragOverRow === row.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white',
            )}
          >
            <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 shrink-0">
              {'{' + row.placeholder + '}'}
            </code>
            <ArrowLeftRight className="w-3 h-3 text-slate-300 shrink-0" />
            <div className="flex-1 min-w-0">
              {row.dbField ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', row.dbFieldColor ?? '')}>
                    {row.dbFieldLabel}
                  </span>
                  <code className="text-[10px] text-slate-400 font-mono">{row.dbField}</code>
                </div>
              ) : (
                <span className="text-[11px] text-slate-300 italic">
                  {dragOverRow === row.id ? 'Rilascia il campo DB qui' : 'Trascina un campo DB →'}
                </span>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              {row.dbField && (
                <button onClick={() => clearBinding(row.id)} className="text-slate-300 hover:text-slate-500" title="Rimuovi associazione">
                  <X className="w-3 h-3" />
                </button>
              )}
              <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-red-500" title="Elimina placeholder">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-2">
          <Button
            size="sm" variant="ghost"
            className="text-xs text-slate-400 hover:text-red-600"
            onClick={() => { setRows([]); setDirty(true); }}
            disabled={rows.length === 0}
          >
            Svuota tutto
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || !dirty}>
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Salva mappatura
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-slate-100 shrink-0 mx-1" />

      {/* Right: campi DB reali (trascinabili) */}
      <div className="w-64 shrink-0 flex flex-col gap-1">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Campi database</p>
        {dbGroups.map(group => (
          <div key={group.id} className="flex flex-col">
            <button
              className="flex items-center gap-1.5 text-left py-1 px-1 rounded hover:bg-slate-50 transition-colors"
              onClick={() => toggleGroup(group.id)}
            >
              {expandedGroups.has(group.id)
                ? <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                : <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              }
              <span className="text-xs font-medium text-slate-600">{group.label}</span>
            </button>
            {expandedGroups.has(group.id) && (
              <div className="flex flex-wrap gap-1 pl-5 pb-2">
                {group.fields.filter(f => !f.isLiteral).map(field => (
                  <div
                    key={field.key}
                    draggable
                    onDragStart={() => setDragField({ key: field.key, label: field.label, color: group.color })}
                    onDragEnd={() => setDragField(null)}
                    title={field.key}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full border font-medium cursor-grab active:cursor-grabbing select-none transition-opacity',
                      group.color,
                      dragField?.key === field.key ? 'opacity-50' : 'hover:opacity-80',
                    )}
                  >
                    {field.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {dbGroups.length === 0 && (
          <p className="text-xs text-slate-400 italic">Caricamento campi DB…</p>
        )}
      </div>
    </div>
  );
}

function FieldMappingSection() {
  const [activeCategory, setActiveCategory] = useState<MappingCategory>('mbo');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4" /> Mappatura placeholder lettera → campi database
        </CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">
          Crea i placeholder che vuoi usare nelle lettere (nome libero), poi trascina su ciascuno il campo
          del database da cui prendere il valore. In generazione ogni <code className="bg-slate-100 px-1 rounded text-[10px]">{'{placeholder}'}</code> viene
          sostituito col valore del campo DB associato.
        </p>
      </CardHeader>
      <CardContent>
        {/* Tab switcher */}
        <div className="flex gap-1 mb-4 border-b border-slate-100">
          {([['mbo', 'Lettere MBO'], ['hr', 'Lettere HR / Dipendenti']] as const).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px',
                activeCategory === cat
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* key forza il remount per ripartire pulito al cambio tab */}
        <MappingPanel key={activeCategory} category={activeCategory} />
      </CardContent>
    </Card>
  );
}
