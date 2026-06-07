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
} from './ooxml';
import { buildSchedaObiettiviDocx } from './schedaObiettiviRenderer';
import { insertSignatureImage } from './signatureInserter';
import { convertDocxToPdf } from './pdfConverter';

export type OutputFormat = 'docx' | 'pdf' | 'both';

export interface GenerateOptions {
  letterheadPath: string | null;
  bodyContent: string;
  fieldMappings: Record<string, string>;
  calculatedFieldDefs: Record<string, string>;
  parameters: Record<string, unknown>;
  beneficiaries: BeneficiaryRow[];
  letterType: string;
  outputDir: string;
  signatureImagePath?: string | null;
  outputFormat?: OutputFormat;
  fontFamily?: string;
}

function buildDictionary(
  row: BeneficiaryRow,
  params: Record<string, unknown>,
  calculatedFieldDefs: Record<string, string>,
): Record<string, unknown> {
  const calculated = resolveCalculatedFields(row as unknown as Record<string, unknown>, params, calculatedFieldDefs);
  return { ...params, ...row, ...calculated };
}

function createFormattedDocx(bodyContent: string, font = 'Calibri'): Buffer {
  const docXml = buildDocumentXml(bodyContent, font);
  const zip = new PizZip();
  zip.file('[Content_Types].xml', MINIMAL_CONTENT_TYPES);
  zip.file('_rels/.rels', MINIMAL_RELS);
  zip.file('word/document.xml', docXml);
  zip.file('word/_rels/document.xml.rels', MINIMAL_DOC_RELS);
  zip.file('word/settings.xml', MINIMAL_SETTINGS);
  zip.file('word/styles.xml', buildMinimalStyles(font));
  return zip.generate({ type: 'nodebuffer' });
}

function renderDocx(
  letterheadPath: string | null,
  bodyContent: string,
  data: Record<string, unknown>,
  letterType?: string,
  signatureImagePath?: string | null,
  font = 'Calibri',
): Buffer {
  // Scheda obiettivi: dedicated table renderer (landscape, no docxtemplater loop needed)
  if (letterType === 'scheda_obiettivi') {
    const row = data as unknown as BeneficiaryRow & { obiettivi: BeneficiaryRow['obiettivi'] };
    return buildSchedaObiettiviDocx(row, data as Record<string, unknown>, font);
  }

  let templateBuf: Buffer;

  if (letterheadPath && fs.existsSync(letterheadPath)) {
    templateBuf = fs.readFileSync(letterheadPath);
  } else {
    templateBuf = createFormattedDocx(bodyContent, font);
  }

  const zip = new PizZip(templateBuf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: false,
    nullGetter: () => '',
  });

  doc.render(data);
  let buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

  if (signatureImagePath && fs.existsSync(signatureImagePath)) {
    buf = insertSignatureImage(buf, signatureImagePath);
  }

  return buf;
}

export function generatePreview(opts: Omit<GenerateOptions, 'outputDir'>): Buffer {
  const row = opts.beneficiaries[0];
  if (!row) throw new Error('Nessun beneficiario');
  const dict = buildDictionary(row, opts.parameters, opts.calculatedFieldDefs);
  return renderDocx(opts.letterheadPath, opts.bodyContent, dict, opts.letterType, opts.signatureImagePath, opts.fontFamily ?? 'Calibri');
}

export function generateAll(opts: GenerateOptions): { zipPath: string; count: number } {
  const jobId = Date.now().toString();
  const jobDir = path.join(opts.outputDir, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const format = opts.outputFormat ?? 'docx';

  for (const row of opts.beneficiaries) {
    const dict = buildDictionary(row, opts.parameters, opts.calculatedFieldDefs);
    const buf = renderDocx(opts.letterheadPath, opts.bodyContent, dict, opts.letterType, opts.signatureImagePath, opts.fontFamily ?? 'Calibri');
    const safeName = row.nome_beneficiario.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').replace(/\s+/g, '_');
    const baseName = `${safeName}_${opts.letterType}`;

    if (format === 'docx' || format === 'both') {
      const docxPath = path.join(jobDir, `${baseName}.docx`);
      fs.writeFileSync(docxPath, buf);
      if (format === 'both') {
        try { convertDocxToPdf(docxPath); } catch {}
      }
    } else if (format === 'pdf') {
      const docxPath = path.join(jobDir, `${baseName}.docx`);
      fs.writeFileSync(docxPath, buf);
      convertDocxToPdf(docxPath);
      fs.unlinkSync(docxPath);
    }
  }

  const zipPath = path.join(opts.outputDir, `${jobId}.zip`);
  zipDirectory(jobDir, zipPath);
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
