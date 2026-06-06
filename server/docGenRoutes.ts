import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';
import { previewExcel, parseExcel } from './docGen/excelParser';
import { generatePreview, generateAll, type OutputFormat } from './docGen/engine';
import { italianCurrencyFormat } from './docGen/italianNumberToWords';
import { assegnazioneMboTemplate } from './docGen/templates/assegnazioneMbo';
import { coverLetterTemplate } from './docGen/templates/coverLetter';
import { schedaObiettiviTemplate } from './docGen/templates/schedaObiettivi';
import { assunzioneTemplate } from './docGen/templates/assunzione';
import { cambioMansioneTemplate } from './docGen/templates/cambioMansione';
import { disciplinareTemplate } from './docGen/templates/disciplinare';
import { isLibreOfficeAvailable } from './docGen/pdfConverter';
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
const EXCEL_DIR = path.join(UPLOADS_DIR, 'excel');
const JOBS_DIR = path.join(UPLOADS_DIR, 'jobs');

[LETTERHEADS_DIR, SIGNATURES_DIR, EXCEL_DIR, JOBS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

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
  if (fs.existsSync(signer.signatureImagePath)) fs.unlinkSync(signer.signatureImagePath);
  await storage.deleteDocSigner(req.params.id);
  res.json({ ok: true });
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
  if (fs.existsSync(lh.filePath)) fs.unlinkSync(lh.filePath);
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
  const { templateId, letterheadId, signerId, excelPath, dataSource, params, index = 0 } = req.body;
  if (!templateId) return res.status(400).json({ error: 'templateId obbligatorio' });

  const tmpl = await storage.getDocTemplate(templateId);
  if (!tmpl) return res.status(404).json({ error: 'Template non trovato' });

  const lh = letterheadId ? await storage.getDocLetterhead(letterheadId) : null;
  const signer = signerId ? await storage.getDocSigner(signerId) : null;
  const fieldMappings = JSON.parse(tmpl.fieldMappings);
  const calculatedFieldDefs = JSON.parse(tmpl.calculatedFields);
  const parameters = { ...(params ?? {}), entry_gate_fmt: formatEntryGate(params?.entry_gate) };

  let beneficiaries;
  if (dataSource === 'db') {
    beneficiaries = tmpl.category === 'hr' ? await getEmployeesFromDb() : await getBeneficiariesFromDb();
  } else {
    if (!excelPath) return res.status(400).json({ error: 'excelPath obbligatorio con sorgente Excel' });
    beneficiaries = parseExcel(excelPath, fieldMappings);
  }
  if (!beneficiaries.length) return res.status(400).json({ error: 'Nessun beneficiario trovato' });

  const safeIndex = Math.max(0, Math.min(Number(index), beneficiaries.length - 1));

  try {
    const buf = generatePreview({
      letterheadPath: lh?.filePath ?? null,
      bodyContent: tmpl.bodyContent,
      fieldMappings,
      calculatedFieldDefs,
      parameters,
      beneficiaries: [beneficiaries[safeIndex]],
      letterType: tmpl.letterType,
      signatureImagePath: signer?.signatureImagePath ?? null,
      fontFamily: tmpl.fontFamily ?? 'Calibri',
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="preview.docx"');
    res.setHeader('X-Beneficiary-Count', String(beneficiaries.length));
    res.setHeader('X-Beneficiary-Index', String(safeIndex));
    res.send(buf);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Generate All ─────────────────────────────────────────────────────────────

router.post('/jobs/generate', async (req: Request, res: Response) => {
  const { templateId, letterheadId, signerId, excelPath, dataSource, params, outputFormat, selectedIndices } = req.body;
  const userId = (req as any).user?.id;
  if (!templateId) return res.status(400).json({ error: 'templateId obbligatorio' });

  const tmpl = await storage.getDocTemplate(templateId);
  if (!tmpl) return res.status(404).json({ error: 'Template non trovato' });

  const lh = letterheadId ? await storage.getDocLetterhead(letterheadId) : null;
  const signer = signerId ? await storage.getDocSigner(signerId) : null;
  const fieldMappings = JSON.parse(tmpl.fieldMappings);
  const calculatedFieldDefs = JSON.parse(tmpl.calculatedFields);
  const parameters = { ...(params ?? {}), entry_gate_fmt: formatEntryGate(params?.entry_gate) };

  let beneficiaries;
  if (dataSource === 'db') {
    beneficiaries = tmpl.category === 'hr' ? await getEmployeesFromDb() : await getBeneficiariesFromDb();
  } else {
    if (!excelPath) return res.status(400).json({ error: 'excelPath obbligatorio con sorgente Excel' });
    beneficiaries = parseExcel(excelPath, fieldMappings);
  }

  if (Array.isArray(selectedIndices) && selectedIndices.length > 0) {
    const idxSet = new Set<number>(selectedIndices.map(Number));
    beneficiaries = beneficiaries.filter((_, i) => idxSet.has(i));
  }

  const job = await storage.createDocJob({
    templateId,
    letterheadId: letterheadId ?? null,
    excelPath: dataSource === 'db' ? '__db__' : (excelPath ?? ''),
    paramsSnapshot: JSON.stringify(params ?? {}),
    status: 'running',
    beneficiaryCount: beneficiaries.length,
    createdBy: userId ?? null,
  });

  try {
    const { zipPath, count } = generateAll({
      letterheadPath: lh?.filePath ?? null,
      bodyContent: tmpl.bodyContent,
      fieldMappings,
      calculatedFieldDefs,
      parameters,
      beneficiaries,
      letterType: tmpl.letterType,
      outputDir: JOBS_DIR,
      signatureImagePath: signer?.signatureImagePath ?? null,
      outputFormat: (outputFormat as OutputFormat) ?? 'docx',
      fontFamily: tmpl.fontFamily ?? 'Calibri',
    });

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
