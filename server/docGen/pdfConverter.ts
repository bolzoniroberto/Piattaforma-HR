import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import { DOMParser } from '@xmldom/xmldom';

const CM_TO_EMU = 914400 / 2.54;
const TWP_TO_PT = 1 / 20; // twips → points

// ─── OOXML → HTML converter ───────────────────────────────────────────────────
// Reads word/document.xml directly so formatting matches the DOCX/preview exactly.

function attr(el: AnyNode, ns: string, name: string): string {
  return el.getAttribute(`${ns}:${name}`) ?? el.getAttribute(name) ?? '';
}

type AnyNode = any; // @xmldom/xmldom types differ from lib.dom — use any internally

function childElements(node: AnyNode): AnyNode[] {
  const out: AnyNode[] = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const c = node.childNodes[i];
    if (c.nodeType === 1) out.push(c);
  }
  return out;
}

function findChild(node: AnyNode, localName: string): AnyNode | null {
  for (let i = 0; i < node.childNodes.length; i++) {
    const c = node.childNodes[i];
    if (c.nodeType === 1 && (c.localName === localName || c.nodeName === `w:${localName}`)) return c;
  }
  return null;
}

function findChildren(node: AnyNode, localName: string): AnyNode[] {
  const out: AnyNode[] = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const c = node.childNodes[i];
    if (c.nodeType === 1 && (c.localName === localName || c.nodeName === `w:${localName}`)) out.push(c);
  }
  return out;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface ImgInfo { wCm: number; hCm: number; base64: string; mime: string }

function extractImages(zip: InstanceType<typeof PizZip>, docXml: string): ImgInfo[] {
  // Walk wp:inline extents + blip embeds in order
  const images: ImgInfo[] = [];
  const relsXml = zip.file('word/_rels/document.xml.rels')?.asText() ?? '';

  // Parse rels: relId → target
  const relMap: Record<string, string> = {};
  const relRe = /Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let relM: RegExpExecArray | null;
  while ((relM = relRe.exec(relsXml)) !== null) {
    relMap[relM[1]] = relM[2];
  }

  // Match each inline drawing: find extent cx/cy and blip embed id together
  const drawRe = /<wp:inline[\s\S]*?<\/wp:inline>/g;
  let drawMatch: RegExpExecArray | null;
  while ((drawMatch = drawRe.exec(docXml)) !== null) {
    const block = drawMatch[0];
    const extM = block.match(/cx="(\d+)"[^>]*cy="(\d+)"/);
    const embedM = block.match(/r:embed="([^"]+)"/);
    if (!extM || !embedM) continue;
    const wCm = Number(extM[1]) / CM_TO_EMU;
    const hCm = Number(extM[2]) / CM_TO_EMU;
    const target = relMap[embedM[1]];
    if (!target) continue;
    const mediaPath = 'word/' + target;
    const mediaBuf = (zip.file(mediaPath) as any)?.asNodeBuffer?.() ?? zip.file(mediaPath)?.asBinary?.();
    if (!mediaBuf) continue;
    const buf = typeof mediaBuf === 'string'
      ? Buffer.from(mediaBuf, 'binary')
      : mediaBuf as Buffer;
    const mime = target.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 'image/png';
    images.push({ wCm, hCm, base64: buf.toString('base64'), mime });
  }
  return images;
}

function convertRunsToHtml(runs: AnyNode[]): string {
  let html = '';
  for (const r of runs) {
    const rName = r.localName ?? r.nodeName.split(':').pop();

    // line break
    if (rName === 'br') { html += '<br>'; continue; }
    // bookmarkStart / bookmarkEnd / proofErr / rPrChange — skip
    if (!['r', 'hyperlink', 'ins', 'del', 'smartTag'].includes(rName ?? '')) continue;

    // drawings handled at paragraph level — skip runs containing only a drawing
    if (findChildren(r, 'drawing').length > 0) continue;

    // for w:r: extract rPr + text
    const rPr = findChild(r, 'rPr');
    const bold = rPr ? findChild(rPr, 'b') !== null : false;
    const italic = rPr ? findChild(rPr, 'i') !== null : false;
    const szEl = rPr ? (findChild(rPr, 'sz') ?? findChild(rPr, 'szCs')) : null;
    const szHp = szEl ? Number(attr(szEl as Element, 'w', 'val') || '22') : 22;
    const fontSizePt = szHp / 2;

    // collect text nodes (w:t, w:delText)
    let text = '';
    for (const t of findChildren(r, 't')) {
      text += t.textContent ?? '';
    }
    // w:br inside run
    const brs = findChildren(r, 'br');

    if (!text && brs.length === 0) continue;

    let span = esc(text);
    if (fontSizePt !== 11) span = `<span style="font-size:${fontSizePt}pt">${span}</span>`;
    if (italic) span = `<em>${span}</em>`;
    if (bold) span = `<strong>${span}</strong>`;
    html += span;
    if (brs.length) html += '<br>'.repeat(brs.length);
  }
  return html;
}

function convertParaToHtml(p: AnyNode, imgIter: { idx: number; list: ImgInfo[] }): string {
  // Drawings can be direct children OR nested inside w:r — collect all.
  const directDrawings = findChildren(p, 'drawing');
  const runDrawings: AnyNode[] = [];
  for (const r of findChildren(p, 'r')) {
    for (const d of findChildren(r, 'drawing')) runDrawings.push(d);
  }
  const allDrawings = [...directDrawings, ...runDrawings];

  if (allDrawings.length) {
    const imgHtml = allDrawings.map(() => {
      const img = imgIter.list[imgIter.idx++];
      if (!img) return '';
      return `<img src="data:${img.mime};base64,${img.base64}" style="width:${img.wCm.toFixed(3)}cm;height:${img.hCm.toFixed(3)}cm;display:block;">`;
    }).join('');
    return `<p style="margin:0">${imgHtml}</p>`;
  }

  // Paragraph properties
  const pPr = findChild(p, 'pPr');
  const jcEl = pPr ? findChild(pPr, 'jc') : null;
  const jc = jcEl ? (attr(jcEl, 'w', 'val') || 'left') : 'left';
  const align = jc === 'both' ? 'justify' : jc === 'center' ? 'center' : jc === 'right' ? 'right' : 'left';

  const spEl = pPr ? findChild(pPr, 'spacing') : null;
  const spAfterTwp = spEl ? Number(attr(spEl, 'w', 'after') || '0') : 0;
  const spBeforeTwp = spEl ? Number(attr(spEl, 'w', 'before') || '0') : 0;
  const marginBottom = (spAfterTwp * TWP_TO_PT).toFixed(1);
  const marginTop = (spBeforeTwp * TWP_TO_PT).toFixed(1);

  // Line height: w:line in 240ths of a line (lineRule="auto") → CSS multiplier
  const lineVal = spEl ? Number(attr(spEl, 'w', 'line') || '0') : 0;
  const lineRule = spEl ? (attr(spEl, 'w', 'lineRule') || 'auto') : 'auto';
  const lineHeight = (lineVal > 0 && lineRule === 'auto')
    ? (lineVal / 240).toFixed(3)
    : '1.15'; // default matches our LINE_SPACING=276

  const indEl = pPr ? findChild(pPr, 'ind') : null;
  const indLeftTwp = indEl ? Number(attr(indEl, 'w', 'left') || '0') : 0;
  const paddingLeft = (indLeftTwp * TWP_TO_PT).toFixed(1);

  // Border box
  const hasBorder = pPr ? findChild(pPr, 'pBdr') !== null : false;
  const borderStyle = hasBorder ? 'border-top:1px solid #000;border-bottom:1px solid #000;padding:3pt 0;' : '';

  const style = [
    `text-align:${align}`,
    `line-height:${lineHeight}`,
    `margin-bottom:${marginBottom}pt`,
    marginTop !== '0.0' ? `margin-top:${marginTop}pt` : '',
    paddingLeft !== '0.0' ? `padding-left:${paddingLeft}pt` : '',
    borderStyle,
  ].filter(Boolean).join(';');

  // Collect runs (skip pPr, bookmarks, etc.)
  const runs = childElements(p).filter(el => {
    const n = el.localName ?? el.nodeName.split(':').pop();
    return n !== 'pPr' && n !== 'bookmarkStart' && n !== 'bookmarkEnd' && n !== 'proofErr';
  });

  const inner = convertRunsToHtml(runs);

  // Empty paragraph → non-breaking space so line has height
  const content = inner || '&nbsp;';
  return `<p style="${style}">${content}</p>`;
}

function convertTableToHtml(tbl: AnyNode, imgIter: { idx: number; list: ImgInfo[] }): string {
  let html = '<table style="border-collapse:collapse;width:100%;margin:4pt 0;">';
  for (const tr of findChildren(tbl, 'tr')) {
    html += '<tr>';
    for (const tc of findChildren(tr, 'tc')) {
      const tcPr = findChild(tc, 'tcPr');
      // shade
      const shdEl = tcPr ? findChild(tcPr, 'shd') : null;
      const fill = shdEl ? (attr(shdEl, 'w', 'fill') || '') : '';
      const bg = fill && fill !== 'auto' ? `background:#${fill};` : '';
      // vAlign
      const vAlignEl = tcPr ? findChild(tcPr, 'vAlign') : null;
      const vAlign = vAlignEl ? (attr(vAlignEl, 'w', 'val') || 'top') : 'top';
      // gridSpan
      const spanEl = tcPr ? findChild(tcPr, 'gridSpan') : null;
      const colspan = spanEl ? Number(attr(spanEl, 'w', 'val') || '1') : 1;
      const colspanAttr = colspan > 1 ? ` colspan="${colspan}"` : '';

      const paras = findChildren(tc, 'p').map(p => convertParaToHtml(p, imgIter)).join('');
      html += `<td${colspanAttr} style="border:1px solid #bbb;padding:3pt 5pt;vertical-align:${vAlign};${bg}">${paras}</td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
}

function docxToHtml(docxPath: string): string {
  const zip = new PizZip(fs.readFileSync(docxPath));
  const docXml = zip.file('word/document.xml')?.asText() ?? '';

  // Page layout from sectPr
  const sectM = docXml.match(/<w:pgSz\b[^>]*w:orient="landscape"/);
  const isLandscape = !!sectM;
  const pgSize = isLandscape ? 'A4 landscape' : 'A4';

  // margins (twips): use doc margins or defaults
  const pgMarM = docXml.match(/<w:pgMar\b([^/]*)\/?>/);
  let marginTopCm = 2, marginBottomCm = 2, marginLeftCm = 2.5, marginRightCm = 2.5;
  if (pgMarM) {
    const mStr = pgMarM[1];
    const getTwp = (key: string) => { const m = mStr.match(new RegExp(`w:${key}="(\\d+)"`)); return m ? Number(m[1]) : null; };
    const toIn = (twp: number) => twp / 1440 * 2.54;
    const t = getTwp('top'), b = getTwp('bottom'), l = getTwp('left'), r = getTwp('right');
    if (t) marginTopCm = toIn(t);
    if (b) marginBottomCm = toIn(b);
    if (l) marginLeftCm = toIn(l);
    if (r) marginRightCm = toIn(r);
  }

  const images = extractImages(zip, docXml);
  const imgIter = { idx: 0, list: images };

  // Parse document body
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXml, 'text/xml');
  const bodyEl = xmlDoc.getElementsByTagNameNS('*', 'body')[0]
    ?? xmlDoc.getElementsByTagName('w:body')[0];

  let bodyHtml = '';
  if (bodyEl) {
    for (const child of childElements(bodyEl)) {
      const n = child.localName ?? child.nodeName.split(':').pop();
      if (n === 'p') {
        bodyHtml += convertParaToHtml(child, imgIter);
      } else if (n === 'tbl') {
        bodyHtml += convertTableToHtml(child, imgIter);
      } else if (n === 'sectPr') {
        // skip
      }
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: ${pgSize};
    margin: ${marginTopCm.toFixed(2)}cm ${marginRightCm.toFixed(2)}cm ${marginBottomCm.toFixed(2)}cm ${marginLeftCm.toFixed(2)}cm;
  }
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #000; margin: 0; }
  p { margin: 0; }
  table { border-collapse: collapse; }
  img { display: block; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

// ─── LibreOffice detection ─────────────────────────────────────────────────────

function findLibreOffice(): string | null {
  for (const bin of ['libreoffice', 'soffice']) {
    try {
      const p = execSync(`which ${bin} 2>/dev/null`).toString().trim();
      if (p) return p;
    } catch {}
  }
  for (const p of [
    '/usr/bin/libreoffice',
    '/usr/bin/soffice',
    '/opt/libreoffice/program/soffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    '/Applications/LibreOffice 7.app/Contents/MacOS/soffice',
  ]) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function hasPlaywright(): boolean {
  return fs.existsSync(path.join(process.cwd(), 'node_modules', 'playwright'));
}

export function isLibreOfficeAvailable(): boolean {
  return findLibreOffice() !== null || hasPlaywright();
}

async function convertViaPlaywright(docxPath: string): Promise<string> {
  let chromium: typeof import('playwright')['chromium'];
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error('Playwright non disponibile. Esegui: npm run install-browsers');
  }

  const html = docxToHtml(docxPath);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdfPath = docxPath.replace(/\.docx$/i, '.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="font-size:9pt;font-family:Calibri,Arial,sans-serif;width:100%;text-align:center;color:#555;padding-bottom:4mm;"><span class="pageNumber"></span></div>',
    });
    return pdfPath;
  } finally {
    await browser.close();
  }
}

/**
 * Converts a .docx to PDF.
 * Uses LibreOffice if available, otherwise falls back to direct OOXML→HTML→Playwright.
 */
export async function convertDocxToPdf(docxPath: string): Promise<string> {
  const lo = findLibreOffice();

  if (lo) {
    const outDir = path.dirname(docxPath);
    execSync(`${lo} --headless --convert-to pdf --outdir "${outDir}" "${docxPath}"`, {
      timeout: 30000,
      stdio: 'pipe',
    });
    const pdfPath = docxPath.replace(/\.docx$/i, '.pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Conversione PDF fallita: file non trovato in ${pdfPath}`);
    }
    return pdfPath;
  }

  return convertViaPlaywright(docxPath);
}
