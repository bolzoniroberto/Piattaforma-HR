import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';
import { previewExcel, parseExcel, autoMatchMappings } from './docGen/excelParser';
import { generatePreview, generateAll, generateMultiTemplate, type OutputFormat } from './docGen/engine';
import { italianCurrencyFormat } from './docGen/italianNumberToWords';
import { assegnazioneMboTemplate } from './docGen/templates/assegnazioneMbo';
import { coverLetterTemplate } from './docGen/templates/coverLetter';
import { schedaObiettiviTemplate } from './docGen/templates/schedaObiettivi';
import { assunzioneTemplate } from './docGen/templates/assunzione';
import { cambioMansioneTemplate } from './docGen/templates/cambioMansione';
import { disciplinareTemplate } from './docGen/templates/disciplinare';
import { isLibreOfficeAvailable, convertDocxToPdf } from './docGen/pdfConverter';
import { getBeneficiariesFromDb, getDbBeneficiaryPreviews } from './docGen/dbBeneficiaries';
import { getEmployeesFromDb, getEmployeePreviews } from './docGen/employeeData';
import { getDataFieldGroups } from './docGen/dataFields';

const ALL_BUILTIN_TEMPLATES = [
  coverLetterTemplate, assegnazioneMboTemplate, schedaObiettiviTemplate,
  assunzioneTemplate, cambioMansioneTemplate, disciplinareTemplate,
];

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const LETTERHEADS_DIR = path.join(UPLOADS_DIR, 'letterheads');
const SIGNATURES_DIR = path.join(UPLOADS_DIR, 'signatures');
const LOGOS_DIR = path.join(UPLOADS_DIR, 'logos');
const EXCEL_DIR = path.join(UPLOADS_DIR, 'excel');
const JOBS_DIR = path.join(UPLOADS_DIR, 'jobs');

[LETTERHEADS_DIR, SIGNATURES_DIR, LOGOS_DIR, EXCEL_DIR, JOBS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// Cancella un file solo se risiede davvero dentro uploads/, prevenendo path
// traversal nel caso un path memorizzato in DB fosse manipolato.
function safeUnlink(filePath: string | null | undefined): void {
  if (!filePath) return;
  const resolved = path.resolve(filePath);
  if (resolved !== UPLOADS_DIR && !resolved.startsWith(UPLOADS_DIR + path.sep)) {
    console.warn(`[docGen] Rifiutata cancellazione fuori da uploads/: ${resolved}`);
    return;
  }
  if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
}

const letterheadUpload = multer({
  dest: LETTERHEADS_DIR,
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || file.originalname.endsWith('.docx');
    cb(null, ok);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

const signatureUpload = multer({
  dest: SIGNATURES_DIR,
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'image/png' || file.mimetype === 'image/jpeg'
      || file.originalname.endsWith('.png') || file.originalname.endsWith('.jpg')
      || file.originalname.endsWith('.jpeg');
    cb(null, ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const logoUpload = multer({
  dest: LOGOS_DIR,
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'image/png' || file.mimetype === 'image/jpeg'
      || file.originalname.endsWith('.png') || file.originalname.endsWith('.jpg')
      || file.originalname.endsWith('.jpeg');
    cb(null, ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const excelUpload = multer({
  dest: EXCEL_DIR,
  fileFilter: (_req, file, cb) => {
    const ok = file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls');
    cb(null, ok);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ─── DB Beneficiaries ────────────────────────────────────────────────────────

router.get('/db-beneficiaries', async (_req, res) => {
  try {
    const previews = await getDbBeneficiaryPreviews();
    res.json(previews);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── DB Employees (HR) ───────────────────────────────────────────────────────

router.get('/employees', async (_req, res) => {
  try {
    const previews = await getEmployeePreviews();
    res.json(previews);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Data Fields (palette) ───────────────────────────────────────────────────

router.get('/data-fields', async (req, res) => {
  try {
    const category = (req.query.category as string) ?? 'mbo';
    const groups = await getDataFieldGroups(category);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Capabilities ────────────────────────────────────────────────────────────

router.get('/capabilities', (_req, res) => {
  res.json({ pdfAvailable: isLibreOfficeAvailable() });
});

// ─── Doc Settings (global) ────────────────────────────────────────────────────

const DOC_SETTING_KEYS = [
  'doc_default_font',
  'doc_default_font_size',
  'param_citta',
  'param_anno_piano',
  'param_anno_bilancio',
  'param_mese_approvazione',
  'param_firmatario_default',
  'param_firmatario_ad_label',
] as const;

router.get('/settings', async (_req, res) => {
  const entries = await Promise.all(
    DOC_SETTING_KEYS.map(async k => [k, await storage.getAppSetting(k)])
  );
  res.json(Object.fromEntries(entries));
});

router.put('/settings', async (req, res) => {
  const updates = req.body as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    if (DOC_SETTING_KEYS.includes(key as any) && typeof value === 'string') {
      await storage.setAppSetting(key, value);
    }
  }
  res.json({ ok: true });
});

// ─── Global Field Mapping ─────────────────────────────────────────────────────

const VALID_MAPPING_CATEGORIES = ['mbo', 'hr'] as const;
type MappingCategory = typeof VALID_MAPPING_CATEGORIES[number];

// Carica il mapping globale { placeholder: dbField } per la categoria del template.
// Usato in generazione per risolvere placeholder liberi sui campi DB reali.
async function loadGlobalFieldMapping(category: string | null | undefined): Promise<Record<string, string>> {
  const cat: MappingCategory = VALID_MAPPING_CATEGORIES.includes(category as any) ? (category as MappingCategory) : 'mbo';
  try {
    const raw = await storage.getAppSetting(`doc_field_mapping_${cat}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Mapping identità sui campi DB scalari di una categoria: { campo: campo }.
// Rappresenta la struttura MBO/HR attuale (placeholder = nome campo DB).
async function buildIdentityMapping(category: MappingCategory): Promise<Record<string, string>> {
  const groups = await getDataFieldGroups(category);
  const map: Record<string, string> = {};
  for (const g of groups) {
    for (const f of g.fields) {
      if ((f as any).isLiteral || (f as any).isLoop) continue;
      map[f.key] = f.key;
    }
  }
  return map;
}

// Semina il mapping di default per ogni categoria SOLO se non esiste già.
// Idempotente: non sovrascrive mai mapping modificati dall'utente.
export async function seedDefaultFieldMappings(): Promise<void> {
  for (const cat of VALID_MAPPING_CATEGORIES) {
    const existing = await storage.getAppSetting(`doc_field_mapping_${cat}`);
    if (existing != null) continue; // già presente (anche {} salvato) → non toccare
    const identity = await buildIdentityMapping(cat);
    await storage.setAppSetting(`doc_field_mapping_${cat}`, JSON.stringify(identity));
    console.log(`[docGen] Seed mapping default '${cat}': ${Object.keys(identity).length} campi`);
  }
}

router.get('/field-mapping', async (req, res) => {
  try {
    const cat: MappingCategory = VALID_MAPPING_CATEGORIES.includes(req.query.category as any)
      ? (req.query.category as MappingCategory)
      : 'hr';
    const raw = await storage.getAppSetting(`doc_field_mapping_${cat}`);
    res.json(raw ? JSON.parse(raw) : {});
  } catch {
    res.json({});
  }
});

router.put('/field-mapping', async (req, res) => {
  const cat: MappingCategory = VALID_MAPPING_CATEGORIES.includes(req.query.category as any)
    ? (req.query.category as MappingCategory)
    : 'hr';
  const mapping = req.body;
  if (typeof mapping !== 'object' || mapping === null) {
    return res.status(400).json({ error: 'Invalid mapping object' });
  }
  await storage.setAppSetting(`doc_field_mapping_${cat}`, JSON.stringify(mapping));
  res.json({ ok: true });
});

// ─── Signers ──────────────────────────────────────────────────────────────────

router.get('/signers', async (_req, res) => {
  res.json(await storage.getDocSigners());
});

router.post('/signers', signatureUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File mancante' });
  const { name, role, isDefault } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'name e role obbligatori' });

  const ext = req.file.originalname.endsWith('.jpg') || req.file.originalname.endsWith('.jpeg') ? '.jpg' : '.png';
  const destPath = path.join(SIGNATURES_DIR, req.file.filename + ext);
  fs.renameSync(req.file.path, destPath);

  if (isDefault === 'true' || isDefault === '1') {
    await storage.setDefaultDocSigner('__none__');
  }

  const signer = await storage.createDocSigner({
    name,
    role,
    signatureImagePath: destPath,
    isDefault: (isDefault === 'true' || isDefault === '1') ? 1 : 0,
  });
  res.json(signer);
});

router.put('/signers/:id/set-default', async (req, res) => {
  const signer = await storage.getDocSigner(req.params.id);
  if (!signer) return res.status(404).json({ error: 'Non trovato' });
  await storage.setDefaultDocSigner(req.params.id);
  res.json({ ok: true });
});

router.delete('/signers/:id', async (req, res) => {
  const signer = await storage.getDocSigner(req.params.id);
  if (!signer) return res.status(404).json({ error: 'Non trovato' });
  safeUnlink(signer.signatureImagePath);
  await storage.deleteDocSigner(req.params.id);
  res.json({ ok: true });
});

// ─── Logos ───────────────────────────────────────────────────────────────────

router.get('/logos', async (_req, res) => {
  res.json(await storage.getDocLogos());
});

router.post('/logos', logoUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File mancante' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obbligatorio' });

  const ext = req.file.originalname.endsWith('.jpg') || req.file.originalname.endsWith('.jpeg') ? '.jpg' : '.png';
  const destPath = path.join(LOGOS_DIR, req.file.filename + ext);
  fs.renameSync(req.file.path, destPath);

  const logo = await storage.createDocLogo({ name, filePath: destPath });
  res.json(logo);
});

router.delete('/logos/:id', async (req, res) => {
  const logo = await storage.getDocLogo(req.params.id);
  if (!logo) return res.status(404).json({ error: 'Non trovato' });
  safeUnlink(logo.filePath);
  await storage.deleteDocLogo(req.params.id);
  res.json({ ok: true });
});

router.get('/logos/:id/image', async (req, res) => {
  const logo = await storage.getDocLogo(req.params.id);
  if (!logo) return res.status(404).json({ error: 'Non trovato' });

  const resolved = path.resolve(logo.filePath);
  if (!resolved.startsWith(LOGOS_DIR + path.sep)) {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'File non trovato' });

  const ext = path.extname(resolved).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  fs.createReadStream(resolved).pipe(res);
});

// ─── Letterheads ─────────────────────────────────────────────────────────────

router.get('/letterheads', async (_req, res) => {
  res.json(await storage.getDocLetterheads());
});

router.post('/letterheads', letterheadUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File mancante' });
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obbligatorio' });

  const destPath = path.join(LETTERHEADS_DIR, req.file.filename + '.docx');
  fs.renameSync(req.file.path, destPath);

  const lh = await storage.createDocLetterhead({
    name,
    description: description || null,
    filePath: destPath,
  });
  res.json(lh);
});

router.delete('/letterheads/:id', async (req, res) => {
  const lh = await storage.getDocLetterhead(req.params.id);
  if (!lh) return res.status(404).json({ error: 'Non trovato' });
  safeUnlink(lh.filePath);
  await storage.deleteDocLetterhead(req.params.id);
  res.json({ ok: true });
});

// ─── Templates ───────────────────────────────────────────────────────────────

router.get('/templates', async (_req, res) => {
  res.json(await storage.getDocTemplates());
});

router.get('/templates/:id', async (req, res) => {
  const t = await storage.getDocTemplate(req.params.id);
  if (!t) return res.status(404).json({ error: 'Non trovato' });
  res.json(t);
});

router.post('/templates', async (req, res) => {
  const { name, letter_type, body_content, field_mappings, calculated_fields, parameters, category } = req.body;
  if (!name || !letter_type) return res.status(400).json({ error: 'name e letter_type obbligatori' });
  const t = await storage.createDocTemplate({
    name,
    letterType: letter_type,
    category: category ?? 'hr',
    bodyContent: body_content ?? '',
    fieldMappings: typeof field_mappings === 'string' ? field_mappings : JSON.stringify(field_mappings ?? {}),
    calculatedFields: typeof calculated_fields === 'string' ? calculated_fields : JSON.stringify(calculated_fields ?? {}),
    parameters: typeof parameters === 'string' ? parameters : JSON.stringify(parameters ?? []),
  });
  res.json(t);
});

router.put('/templates/:id', async (req, res) => {
  const { name, body_content, field_mappings, calculated_fields, parameters, font_family, category } = req.body;
  const t = await storage.updateDocTemplate(req.params.id, {
    ...(name && { name }),
    ...(body_content !== undefined && { bodyContent: body_content }),
    ...(field_mappings !== undefined && { fieldMappings: typeof field_mappings === 'string' ? field_mappings : JSON.stringify(field_mappings) }),
    ...(calculated_fields !== undefined && { calculatedFields: typeof calculated_fields === 'string' ? calculated_fields : JSON.stringify(calculated_fields) }),
    ...(parameters !== undefined && { parameters: typeof parameters === 'string' ? parameters : JSON.stringify(parameters) }),
    ...(font_family !== undefined && { fontFamily: font_family }),
    ...(category !== undefined && { category }),
  });
  res.json(t);
});

router.post('/templates/:id/duplicate', async (req, res) => {
  res.json(await storage.duplicateDocTemplate(req.params.id));
});

router.delete('/templates/:id', async (req, res) => {
  await storage.deleteDocTemplate(req.params.id);
  res.json({ ok: true });
});

// ─── Excel Preview ────────────────────────────────────────────────────────────

router.post('/excel/preview', excelUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File mancante' });
  try {
    const preview = previewExcel(req.file.path);
    res.json({ ...preview, tempPath: req.file.path });
  } catch (err: unknown) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── AI Auto-map ──────────────────────────────────────────────────────────────

router.post('/excel/ai-map', async (req: Request, res: Response) => {
  const { headers, sampleRows, placeholders } = req.body as {
    headers?: string[];
    sampleRows?: Record<string, unknown>[];
    placeholders?: string[];
  };
  if (!Array.isArray(headers) || !headers.length) {
    return res.status(400).json({ error: 'headers obbligatori' });
  }
  if (!Array.isArray(placeholders) || !placeholders.length) {
    return res.status(400).json({ error: 'placeholders obbligatori' });
  }

  try {
    const userId = (req as any).user?.id;
    const { callAI } = await import('./aiService');

    // Pre-filtro deterministico: fuzzy come baseline da raffinare con l'AI.
    const fuzzy = autoMatchMappings(headers, placeholders);
    const fuzzyHint = Object.entries(fuzzy)
      .map(([ph, m]) => `  ${ph} ≈ "${m.header}" (conf ${m.confidence})`)
      .join('\n') || '  (nessuno)';

    const sample = (sampleRows ?? []).slice(0, 3);
    const prompt = [
      'Devi mappare i placeholder di un template documentale alle colonne di un file Excel.',
      '',
      'COLONNE EXCEL disponibili:',
      ...headers.map(h => `- "${h}"`),
      '',
      'RIGHE DI ESEMPIO (prime 3):',
      JSON.stringify(sample, null, 2),
      '',
      'PLACEHOLDER da mappare:',
      ...placeholders.map(p => `- ${p}`),
      '',
      'Suggerimenti fuzzy di partenza (puoi confermarli o correggerli):',
      fuzzyHint,
      '',
      'Restituisci un oggetto JSON { mappings: { <placeholder>: <nomeColonnaEsatto> } }.',
      'Usa SOLO nomi di colonna presenti nell\'elenco COLONNE EXCEL, copiati esattamente.',
      'Ometti i placeholder per cui nessuna colonna è pertinente.',
    ].join('\n');

    const schema = {
      type: 'object',
      properties: {
        mappings: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['mappings'],
    };

    const result = await callAI({
      userId: userId!,
      scope: 'docgen_map',
      prompt,
      systemInstruction:
        'Sei un esperto di data mapping. Associa ogni placeholder alla colonna Excel semanticamente più pertinente. ' +
        'Output rigorosamente JSON conforme allo schema, nomi colonna copiati esatti dall\'elenco fornito.',
      model: 'fast',
      responseSchema: schema,
    });

    const parsed = (result.parsed as { mappings?: Record<string, string> }) ?? {};
    const headerSet = new Set(headers);
    const mappings: Record<string, string> = {};
    for (const [ph, col] of Object.entries(parsed.mappings ?? {})) {
      if (placeholders.includes(ph) && typeof col === 'string' && headerSet.has(col)) {
        mappings[ph] = col;
      }
    }

    res.json({ mappings });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Job Preview ─────────────────────────────────────────────────────────────

router.post('/jobs/preview-meta', async (req: Request, res: Response) => {
  const { templateId, excelPath, dataSource } = req.body;
  if (!templateId) return res.status(400).json({ error: 'templateId obbligatorio' });
  const tmpl = await storage.getDocTemplate(templateId);
  if (!tmpl) return res.status(404).json({ error: 'Template non trovato' });

  let beneficiaries;
  if (dataSource === 'db') {
    beneficiaries = tmpl.category === 'hr' ? await getEmployeesFromDb() : await getBeneficiariesFromDb();
  } else {
    if (!excelPath) return res.status(400).json({ error: 'excelPath obbligatorio con sorgente Excel' });
    const fieldMappings = JSON.parse(tmpl.fieldMappings);
    beneficiaries = parseExcel(excelPath, fieldMappings);
  }
  res.json({ count: beneficiaries.length, names: beneficiaries.map(b => b.nome_beneficiario ?? '') });
});

router.post('/jobs/preview', async (req: Request, res: Response) => {
  const { templateId, letterheadId, signerId, logoId, excelPath, dataSource, params, index = 0, pageOrientation, fitToPage, logoWidthCm, signatureWidthCm, format } = req.body;
  if (!templateId) return res.status(400).json({ error: 'templateId obbligatorio' });

  const tmpl = await storage.getDocTemplate(templateId);
  if (!tmpl) return res.status(404).json({ error: 'Template non trovato' });

  const signer = signerId ? await storage.getDocSigner(signerId) : null;
  const logo = logoId ? await storage.getDocLogo(logoId) : null;
  const fieldMappings = JSON.parse(tmpl.fieldMappings);
  const calculatedFieldDefs = JSON.parse(tmpl.calculatedFields);
  const tmplDefaults = Object.fromEntries(
    (JSON.parse(tmpl.parameters ?? '[]') as { key: string; default?: string }[])
      .filter(p => p.default != null)
      .map(p => [p.key, p.default])
  );
  const mergedParams = { ...tmplDefaults, ...(params ?? {}) };
  const parameters = { ...mergedParams, entry_gate_fmt: formatEntryGate(mergedParams.entry_gate) };
  const globalFieldMapping = await loadGlobalFieldMapping(tmpl.category);

  let beneficiaries;
  if (dataSource === 'db') {
    beneficiaries = tmpl.category === 'hr' ? await getEmployeesFromDb() : await getBeneficiariesFromDb();
  } else {
    if (!excelPath) return res.status(400).json({ error: 'excelPath obbligatorio con sorgente Excel' });
    beneficiaries = parseExcel(excelPath, fieldMappings);
  }
  if (!beneficiaries.length) return res.status(400).json({ error: 'Nessun beneficiario trovato' });

  const safeIndex = Math.max(0, Math.min(Number(index), beneficiaries.length - 1));
  console.log('[preview] signerId:', signerId, '→ signer:', signer?.name, '→ imgPath:', signer?.signatureImagePath);

  const defaultFontSizeStr = await storage.getAppSetting('doc_default_font_size');
  const fontSizePt = defaultFontSizeStr ? Number(defaultFontSizeStr) : 11;

  try {
    const buf = generatePreview({
      bodyContent: tmpl.bodyContent,
      fieldMappings,
      calculatedFieldDefs,
      parameters,
      beneficiaries: [beneficiaries[safeIndex]],
      letterType: tmpl.letterType,
      signatureImagePath: signer?.signatureImagePath ?? null,
      logoImagePath: logo?.filePath ?? null,
      fontFamily: tmpl.fontFamily ?? 'Calibri',
      fontSizePt,
      globalFieldMapping,
      pageLayout: { orientation: pageOrientation ?? 'portrait', fitToPage: !!fitToPage },
      logoWidthCm: logoWidthCm ? Number(logoWidthCm) : undefined,
      signatureWidthCm: signatureWidthCm ? Number(signatureWidthCm) : undefined,
    });

    res.setHeader('X-Beneficiary-Count', String(beneficiaries.length));
    res.setHeader('X-Beneficiary-Index', String(safeIndex));

    if (format === 'pdf') {
      // Write the rendered docx to a temp file, convert to PDF, stream it back.
      const tmpDir = fs.mkdtempSync(path.join(JOBS_DIR, 'preview-'));
      const docxPath = path.join(tmpDir, 'preview.docx');
      try {
        fs.writeFileSync(docxPath, buf);
        const pdfPath = await convertDocxToPdf(docxPath);
        const pdfBuf = fs.readFileSync(pdfPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="preview.pdf"');
        res.send(pdfBuf);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
      return;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="preview.docx"');
    res.send(buf);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Generate All ─────────────────────────────────────────────────────────────

router.post('/jobs/generate', async (req: Request, res: Response) => {
  const { templateId, templateIds, letterheadId, signerId, logoId, excelPath, dataSource, params, outputFormat, selectedIndices, pageOrientation, fitToPage, logoWidthCm, signatureWidthCm } = req.body;
  const userId = (req as any).user?.id;

  // Normalise: accept either templateId (single) or templateIds (array)
  const ids: string[] = Array.isArray(templateIds) && templateIds.length > 0
    ? templateIds
    : templateId ? [templateId] : [];
  if (ids.length === 0) return res.status(400).json({ error: 'templateId obbligatorio' });

  const isMulti = ids.length > 1;

  // Load all templates
  const tmpls = await Promise.all(ids.map(id => storage.getDocTemplate(id)));
  if (tmpls.some(t => !t)) return res.status(404).json({ error: 'Uno o più template non trovati' });
  const validTmpls = tmpls as NonNullable<typeof tmpls[0]>[];

  const primaryTmpl = validTmpls[0];
  const signer = signerId ? await storage.getDocSigner(signerId) : null;
  const logo = logoId ? await storage.getDocLogo(logoId) : null;
  const allTmplDefaults = validTmpls.reduce((acc, t) => {
    for (const p of (JSON.parse(t.parameters ?? '[]') as { key: string; default?: string }[])) {
      if (p.default != null && !(p.key in acc)) acc[p.key] = p.default;
    }
    return acc;
  }, {} as Record<string, string>);
  const mergedParams = { ...allTmplDefaults, ...(params ?? {}) };
  const parameters = { ...mergedParams, entry_gate_fmt: formatEntryGate(mergedParams.entry_gate) };

  // Beneficiaries are derived from the first template's category/fieldMappings
  const firstFieldMappings = JSON.parse(primaryTmpl.fieldMappings);
  let beneficiaries;
  if (dataSource === 'db') {
    beneficiaries = primaryTmpl.category === 'hr' ? await getEmployeesFromDb() : await getBeneficiariesFromDb();
  } else {
    if (!excelPath) return res.status(400).json({ error: 'excelPath obbligatorio con sorgente Excel' });
    beneficiaries = parseExcel(excelPath, firstFieldMappings);
  }

  if (Array.isArray(selectedIndices) && selectedIndices.length > 0) {
    const idxSet = new Set<number>(selectedIndices.map(Number));
    beneficiaries = beneficiaries.filter((_, i) => idxSet.has(i));
  }

  const job = await storage.createDocJob({
    templateId: ids[0],
    letterheadId: null,
    excelPath: dataSource === 'db' ? '__db__' : (excelPath ?? ''),
    paramsSnapshot: JSON.stringify(params ?? {}),
    status: 'running',
    beneficiaryCount: beneficiaries.length,
    createdBy: userId ?? null,
  });

  const defaultFontSizeStr = await storage.getAppSetting('doc_default_font_size');
  const fontSizePt = defaultFontSizeStr ? Number(defaultFontSizeStr) : 11;

  const sharedLayout = { orientation: pageOrientation ?? 'portrait', fitToPage: !!fitToPage };

  try {
    let zipPath: string;
    let count: number;

    if (isMulti) {
      const templateEntries = await Promise.all(validTmpls.map(async tmpl => ({
        bodyContent: tmpl.bodyContent,
        fieldMappings: JSON.parse(tmpl.fieldMappings),
        calculatedFieldDefs: JSON.parse(tmpl.calculatedFields),
        letterType: tmpl.letterType,
        fontFamily: tmpl.fontFamily ?? 'Calibri',
        fontSizePt,
        globalFieldMapping: await loadGlobalFieldMapping(tmpl.category),
      })));

      ({ zipPath, count } = await generateMultiTemplate({
        templates: templateEntries,
        parameters,
        beneficiaries,
        outputDir: JOBS_DIR,
        signatureImagePath: signer?.signatureImagePath ?? null,
        logoImagePath: logo?.filePath ?? null,
        outputFormat: (outputFormat as OutputFormat) ?? 'docx',
        pageLayout: sharedLayout,
        logoWidthCm: logoWidthCm ? Number(logoWidthCm) : undefined,
        signatureWidthCm: signatureWidthCm ? Number(signatureWidthCm) : undefined,
      }));
    } else {
      const calculatedFieldDefs = JSON.parse(primaryTmpl.calculatedFields);
      const globalFieldMapping = await loadGlobalFieldMapping(primaryTmpl.category);

      ({ zipPath, count } = await generateAll({
        bodyContent: primaryTmpl.bodyContent,
        fieldMappings: firstFieldMappings,
        calculatedFieldDefs,
        parameters,
        beneficiaries,
        letterType: primaryTmpl.letterType,
        outputDir: JOBS_DIR,
        signatureImagePath: signer?.signatureImagePath ?? null,
        logoImagePath: logo?.filePath ?? null,
        outputFormat: (outputFormat as OutputFormat) ?? 'docx',
        fontFamily: primaryTmpl.fontFamily ?? 'Calibri',
        fontSizePt,
        globalFieldMapping,
        pageLayout: sharedLayout,
        logoWidthCm: logoWidthCm ? Number(logoWidthCm) : undefined,
        signatureWidthCm: signatureWidthCm ? Number(signatureWidthCm) : undefined,
      }));
    }

    await storage.updateDocJob(job.id, { status: 'done', outputZipPath: zipPath, beneficiaryCount: count });
    res.json({ jobId: job.id, count, zipUrl: `/api/doc/jobs/${job.id}/download` });
  } catch (err: unknown) {
    await storage.updateDocJob(job.id, { status: 'error' });
    res.status(500).json({ error: String(err) });
  }
});

router.get('/jobs', async (_req, res) => {
  res.json(await storage.getDocJobs());
});

router.get('/jobs/:id/download', async (req, res) => {
  const job = (await storage.getDocJobs()).find(j => j.id === req.params.id);
  if (!job || !job.outputZipPath) return res.status(404).json({ error: 'Non trovato' });
  if (!fs.existsSync(job.outputZipPath)) return res.status(410).json({ error: 'File non più disponibile' });
  res.download(job.outputZipPath, `lettere_mbo_${job.id}.zip`);
});

// ─── Seed default template ────────────────────────────────────────────────────

router.post('/templates/seed-default', async (_req, res) => {
  const existing = await storage.getDocTemplates();
  const existingTypes = new Set(existing.map(t => t.letterType));
  const created = [];

  for (const tmpl of ALL_BUILTIN_TEMPLATES) {
    if (!existingTypes.has(tmpl.letter_type)) {
      const t = await storage.createDocTemplate({
        name: tmpl.name,
        letterType: tmpl.letter_type,
        category: (tmpl as any).category ?? 'mbo',
        bodyContent: tmpl.body_content,
        fieldMappings: JSON.stringify(tmpl.field_mappings),
        calculatedFields: JSON.stringify(tmpl.calculated_fields),
        parameters: JSON.stringify(tmpl.parameters),
      });
      created.push(t);
    }
  }

  res.json({ ok: true, created: created.length, templates: created });
});

function formatEntryGate(val: unknown): string {
  const n = Number(val ?? 0);
  if (!n) return '';
  return italianCurrencyFormat(n);  // italianCurrencyFormat already adds thousand separators (IT)
}

export default router;
