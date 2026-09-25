import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import type { BeneficiaryRow } from './excelParser';
import { resolveCalculatedFields } from './calculatedFields';
import {
  buildDocumentXml,
  buildMinimalStyles,
  MINIMAL_CONTENT_TYPES,
  MINIMAL_RELS,
  MINIMAL_DOC_RELS,
  MINIMAL_SETTINGS,
  MINIMAL_FOOTER,
  type PageLayoutOptions,
} from './ooxml';
import { buildSchedaObiettiviDocx } from './schedaObiettiviRenderer';
import { insertSignatureImage, stripFirmaPlaceholder } from './signatureInserter';
import { insertLogoImage, insertLogoImageBottomRight, stripLogoPlaceholder } from './logoInserter';
import { convertDocxToPdf } from './pdfConverter';

export type OutputFormat = 'docx' | 'pdf' | 'both';

export interface TemplateEntry {
  bodyContent: string;
  fieldMappings: Record<string, string>;
  calculatedFieldDefs: Record<string, string>;
  letterType: string;
  fontFamily?: string;
  fontSizePt?: number;
  globalFieldMapping?: Record<string, string>;
}

export interface MultiGenerateOptions {
  templates: TemplateEntry[];
  parameters: Record<string, unknown>;
  beneficiaries: BeneficiaryRow[];
  outputDir: string;
  signatureImagePath?: string | null;
  logoImagePath?: string | null;
  outputFormat?: OutputFormat;
  pageLayout?: PageLayoutOptions;
  logoWidthCm?: number;
  signatureWidthCm?: number;
}

export interface GenerateOptions {
  bodyContent: string;
  fieldMappings: Record<string, string>;
  calculatedFieldDefs: Record<string, string>;
  parameters: Record<string, unknown>;
  beneficiaries: BeneficiaryRow[];
  letterType: string;
  outputDir: string;
  signatureImagePath?: string | null;
  logoImagePath?: string | null;
  outputFormat?: OutputFormat;
  fontFamily?: string;
  fontSizePt?: number;
  globalFieldMapping?: Record<string, string>;
  pageLayout?: PageLayoutOptions;
  logoWidthCm?: number;
  signatureWidthCm?: number;
}

function buildDictionary(
  row: BeneficiaryRow,
  params: Record<string, unknown>,
  calculatedFieldDefs: Record<string, string>,
  globalFieldMapping?: Record<string, string>,
): Record<string, unknown> {
  const calculated = resolveCalculatedFields(row as unknown as Record<string, unknown>, params, calculatedFieldDefs);
  const base: Record<string, unknown> = { ...params, ...row, ...calculated };
  // Apply global field mapping: { placeholder_key: db_field_key }
  if (globalFieldMapping) {
    for (const [placeholder, dbField] of Object.entries(globalFieldMapping)) {
      if (!(placeholder in base) && dbField in base) {
        base[placeholder] = base[dbField];
      }
    }
  }
  return base;
}

function createFormattedDocx(bodyContent: string, font = 'Calibri', layout: PageLayoutOptions = {}, fontSizePt = 11): Buffer {
  const docXml = buildDocumentXml(bodyContent, font, layout, fontSizePt);
  const zip = new PizZip();
  zip.file('[Content_Types].xml', MINIMAL_CONTENT_TYPES);
  zip.file('_rels/.rels', MINIMAL_RELS);
  zip.file('word/document.xml', docXml);
  zip.file('word/_rels/document.xml.rels', MINIMAL_DOC_RELS);
  zip.file('word/settings.xml', MINIMAL_SETTINGS);
  zip.file('word/styles.xml', buildMinimalStyles(font, fontSizePt));
  zip.file('word/footer1.xml', MINIMAL_FOOTER);
  return zip.generate({ type: 'nodebuffer' });
}

function renderPlainTemplate(templateBuf: Buffer, data: Record<string, unknown>): Buffer {
  const zip = new PizZip(templateBuf);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: false, nullGetter: () => '' });
  doc.render(data);
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

function renderDocx(
  bodyContent: string,
  data: Record<string, unknown>,
  letterType?: string,
  signatureImagePath?: string | null,
  font = 'Calibri',
  logoImagePath?: string | null,
  layout: PageLayoutOptions = {},
  logoWidthCm?: number,
  signatureWidthCm?: number,
  fontSizePt = 11,
): Buffer {
  if (letterType === 'scheda_obiettivi') {
    const row = data as unknown as BeneficiaryRow & { obiettivi: BeneficiaryRow['obiettivi'] };
    let buf = buildSchedaObiettiviDocx(row, data as Record<string, unknown>, font);
    if (logoImagePath && fs.existsSync(logoImagePath)) {
      buf = insertLogoImageBottomRight(buf, logoImagePath, logoWidthCm);
    }
    return buf;
  }

  let buf = renderPlainTemplate(createFormattedDocx(bodyContent, font, layout, fontSizePt), data);

  if (logoImagePath && fs.existsSync(logoImagePath)) {
    buf = insertLogoImage(buf, logoImagePath, logoWidthCm);
  } else {
    buf = stripLogoPlaceholder(buf);
  }

  if (signatureImagePath && fs.existsSync(signatureImagePath)) {
    buf = insertSignatureImage(buf, signatureImagePath, signatureWidthCm);
  } else {
    buf = stripFirmaPlaceholder(buf);
  }

  return buf;
}

export function generatePreview(opts: Omit<GenerateOptions, 'outputDir'>): Buffer {
  const row = opts.beneficiaries[0];
  if (!row) throw new Error('Nessun beneficiario');
  const dict = buildDictionary(row, opts.parameters, opts.calculatedFieldDefs, opts.globalFieldMapping);
  return renderDocx(opts.bodyContent, dict, opts.letterType, opts.signatureImagePath, opts.fontFamily ?? 'Calibri', opts.logoImagePath, opts.pageLayout ?? {}, opts.logoWidthCm, opts.signatureWidthCm, opts.fontSizePt ?? 11);
}

export async function generateAll(opts: GenerateOptions): Promise<{ zipPath: string; count: number }> {
  const jobId = Date.now().toString();
  const jobDir = path.join(opts.outputDir, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const format = opts.outputFormat ?? 'docx';

  for (const row of opts.beneficiaries) {
    const dict = buildDictionary(row, opts.parameters, opts.calculatedFieldDefs, opts.globalFieldMapping);
    const buf = renderDocx(opts.bodyContent, dict, opts.letterType, opts.signatureImagePath, opts.fontFamily ?? 'Calibri', opts.logoImagePath, opts.pageLayout ?? {}, opts.logoWidthCm, opts.signatureWidthCm, opts.fontSizePt ?? 11);
    const safeName = row.nome_beneficiario.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').replace(/\s+/g, '_');
    const baseName = `${safeName}_${opts.letterType}`;

    if (format === 'docx' || format === 'both') {
      const docxPath = path.join(jobDir, `${baseName}.docx`);
      fs.writeFileSync(docxPath, buf);
      if (format === 'both') {
        try { await convertDocxToPdf(docxPath); } catch (e) {
          console.warn(`PDF conversion skipped for ${baseName}: ${e}`);
        }
      }
    } else if (format === 'pdf') {
      const docxPath = path.join(jobDir, `${baseName}.docx`);
      fs.writeFileSync(docxPath, buf);
      await convertDocxToPdf(docxPath);
      fs.unlinkSync(docxPath);
    }
  }

  const zipPath = path.join(opts.outputDir, `${jobId}.zip`);
  zipDirectory(jobDir, zipPath);
  fs.rmSync(jobDir, { recursive: true, force: true });

  return { zipPath, count: opts.beneficiaries.length };
}

export async function generateMultiTemplate(opts: MultiGenerateOptions): Promise<{ zipPath: string; count: number }> {
  const jobId = Date.now().toString();
  const jobDir = path.join(opts.outputDir, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const format = opts.outputFormat ?? 'docx';

  for (const row of opts.beneficiaries) {
    const safeName = row.nome_beneficiario.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').replace(/\s+/g, '_');
    const personDir = path.join(jobDir, safeName);
    fs.mkdirSync(personDir, { recursive: true });

    for (const tmpl of opts.templates) {
      const dict = buildDictionary(row, opts.parameters, tmpl.calculatedFieldDefs, tmpl.globalFieldMapping);
      const buf = renderDocx(tmpl.bodyContent, dict, tmpl.letterType, opts.signatureImagePath, tmpl.fontFamily ?? 'Calibri', opts.logoImagePath, opts.pageLayout ?? {}, opts.logoWidthCm, opts.signatureWidthCm, tmpl.fontSizePt ?? 11);
      const baseName = `${safeName}_${tmpl.letterType}`;

      if (format === 'docx' || format === 'both') {
        const docxPath = path.join(personDir, `${baseName}.docx`);
        fs.writeFileSync(docxPath, buf);
        if (format === 'both') {
          try { await convertDocxToPdf(docxPath); } catch (e) {
            console.warn(`PDF conversion skipped for ${baseName}: ${e}`);
          }
        }
      } else if (format === 'pdf') {
        const docxPath = path.join(personDir, `${baseName}.docx`);
        fs.writeFileSync(docxPath, buf);
        await convertDocxToPdf(docxPath);
        fs.unlinkSync(docxPath);
      }
    }
  }

  const zipPath = path.join(opts.outputDir, `${jobId}.zip`);
  zipDirectoryRecursive(jobDir, zipPath);
  fs.rmSync(jobDir, { recursive: true, force: true });

  return { zipPath, count: opts.beneficiaries.length };
}

function zipDirectory(sourceDir: string, outPath: string): void {
  const zip = new PizZip();
  for (const file of fs.readdirSync(sourceDir)) {
    const filePath = path.join(sourceDir, file);
    const content = fs.readFileSync(filePath);
    zip.file(file, content);
  }
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outPath, buf);
}

function zipDirectoryRecursive(sourceDir: string, outPath: string): void {
  const zip = new PizZip();
  function addDir(dir: string, prefix: string) {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const zipEntry = prefix ? `${prefix}/${entry}` : entry;
      if (fs.statSync(fullPath).isDirectory()) {
        addDir(fullPath, zipEntry);
      } else {
        zip.file(zipEntry, fs.readFileSync(fullPath));
      }
    }
  }
  addDir(sourceDir, '');
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outPath, buf);
}
