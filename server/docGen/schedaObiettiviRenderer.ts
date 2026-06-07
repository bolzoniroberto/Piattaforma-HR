import PizZip from 'pizzip';
import type { BeneficiaryRow } from './excelParser';
import { italianCurrencyFormat } from './italianNumberToWords';
import {
  MINIMAL_CONTENT_TYPES, MINIMAL_RELS, MINIMAL_DOC_RELS,
  MINIMAL_SETTINGS, MINIMAL_STYLES,
} from './ooxml';

// Landscape A4: w=16838, h=11906 twips
// Margins: top/bottom=720, left=1000, right=720
// Usable width ≈ 15118 twips

const COL_W = {
  num: 380,
  desc: 5200,
  target: 2800,
  tipo: 2800,
  peso: 620,
  premio: 1318,
  // total = 13118 twips — use auto width so Word fills the page
};

const HEADER_SHADE = 'D6DCE4';  // light blue-grey
const ALT_SHADE = 'F7F7F7';     // very light grey

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function rpr(bold = false, size = 18): string {
  return `<w:rPr>${bold ? '<w:b/><w:bCs/>' : ''}<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:lang w:val="it-IT"/></w:rPr>`;
}

function cellRun(text: string, bold = false, size = 18): string {
  return `<w:r>${rpr(bold, size)}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

function cellPpr(center = false, spacingAfter = 0): string {
  return `<w:pPr><w:jc w:val="${center ? 'center' : 'left'}"/><w:spacing w:after="${spacingAfter}" w:line="240" w:lineRule="auto"/></w:pPr>`;
}

function tcBorders(): string {
  return `<w:tcBorders>
    <w:top w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>
    <w:left w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>
    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>
    <w:right w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>
  </w:tcBorders>`;
}

interface CellOpts {
  w: number;
  bold?: boolean;
  size?: number;
  shade?: string;
  center?: boolean;
  lines?: string[];   // multiline content (each line = sub-para)
  vAlign?: 'center' | 'bottom';
}

function makeCell(primaryText: string, opts: CellOpts): string {
  const { w, bold = false, size = 18, shade, center = false, lines = [], vAlign } = opts;
  const fill = shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : '';
  const va = vAlign ? `<w:vAlign w:val="${vAlign}"/>` : '';
  const tcPr = `<w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${tcBorders()}${fill}${va}</w:tcPr>`;

  const mainPara = `<w:p>${cellPpr(center, lines.length > 0 ? 40 : 0)}${cellRun(primaryText, bold, size)}</w:p>`;
  const subParas = lines.map(l =>
    `<w:p>${cellPpr(false, 0)}<w:r>${rpr(false, Math.max(size - 2, 14))}<w:t xml:space="preserve">${esc(l)}</w:t></w:r></w:p>`
  ).join('');

  return `<w:tc>${tcPr}${mainPara}${subParas}</w:tc>`;
}

function headerRow(): string {
  const labels: [string, keyof typeof COL_W, boolean][] = [
    ['N°', 'num', true],
    ['Descrizione Obiettivo', 'desc', true],
    ['Target', 'target', true],
    ['Tipo Indicatore', 'tipo', true],
    ['Peso %', 'peso', true],
    ['Premio Max (€)', 'premio', true],
  ];
  const cells = labels.map(([lbl, colKey, bold]) =>
    makeCell(lbl, { w: COL_W[colKey], bold, shade: HEADER_SHADE, center: true, size: 18 })
  ).join('');
  return `<w:tr><w:trPr><w:tblHeader/></w:trPr>${cells}</w:tr>`;
}

function parsePeso(pesoStr: string): number {
  const m = String(pesoStr ?? '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function dataRow(obj: BeneficiaryRow['obiettivi'][0], premiMax: number, isOdd: boolean): string {
  const shade = isOdd ? ALT_SHADE : undefined;
  const pesoNum = parsePeso(obj.peso);
  const premioTarget = pesoNum > 0 ? Math.round(pesoNum / 100 * premiMax) : 0;
  const premioFmt = premioTarget > 0 ? italianCurrencyFormat(premioTarget) : '-';

  // Description: codice bold + indicatore, then descrizione if different
  const descLabel = obj.codice ? `${obj.codice} – ${obj.indicatore}` : obj.indicatore;
  const descSubs: string[] = [];
  if (obj.descrizione && obj.descrizione.trim() && obj.descrizione.trim() !== obj.indicatore.trim()) {
    descSubs.push(obj.descrizione.trim());
  }
  if (obj.rendicontatore && obj.rendicontatore.trim()) {
    descSubs.push(`[Fonte: ${obj.rendicontatore.trim()}]`);
  }

  const cells = [
    makeCell(String(obj.idx), { w: COL_W.num, center: true, shade, size: 18 }),
    makeCell(descLabel, { w: COL_W.desc, bold: true, shade, size: 18, lines: descSubs }),
    makeCell(obj.target, { w: COL_W.target, shade, size: 17 }),
    makeCell(obj.modalita_calcolo, { w: COL_W.tipo, shade, size: 17 }),
    makeCell(obj.peso, { w: COL_W.peso, center: true, shade, size: 18 }),
    makeCell(premioFmt, { w: COL_W.premio, center: true, shade, size: 18 }),
  ].join('');

  return `<w:tr>${cells}</w:tr>`;
}

function para(runs: string, opts: { size?: number; bold?: boolean; center?: boolean; spacingBefore?: number; spacingAfter?: number } = {}): string {
  const { size = 20, bold = false, center = false, spacingBefore = 0, spacingAfter = 80 } = opts;
  const jc = center ? 'center' : 'left';
  return `<w:p>
    <w:pPr><w:jc w:val="${jc}"/><w:spacing w:before="${spacingBefore}" w:after="${spacingAfter}" w:line="276" w:lineRule="auto"/></w:pPr>
    ${runs}
  </w:p>`;
}

function infoRow(label: string, value: string, size = 20): string {
  return `<w:r>${rpr(true, size)}<w:t xml:space="preserve">${esc(label)}</w:t></w:r><w:r>${rpr(false, size)}<w:t xml:space="preserve">${esc(value)}</w:t></w:r>`;
}

export function buildSchedaObiettiviDocx(
  beneficiary: BeneficiaryRow,
  params: Record<string, unknown>,
  font = 'Calibri',
): Buffer {
  const anno = String(params['anno_piano'] ?? '2026');
  const entryGateStr = String(params['entry_gate_fmt'] ?? params['entry_gate'] ?? '');
  const premiMax = Number(beneficiary.premio_max ?? 0);
  const premioMaxFmt = italianCurrencyFormat(premiMax);

  // ── Header section ──────────────────────────────────────────────────────────
  const titleXml = para(
    `<w:r>${rpr(true, 24)}<w:t>ALLEGATO – SCHEDA OBIETTIVI – INDICATORI PERFORMANCE ${esc(anno)}</w:t></w:r>`,
    { center: true, spacingAfter: 120, size: 24 }
  );

  const infoXml = para(
    [
      infoRow('Titolare: ', beneficiary.nome_beneficiario),
      `<w:r>${rpr(false, 20)}<w:t xml:space="preserve">   </w:t></w:r>`,
      infoRow('Area: ', beneficiary.qualifica),
      `<w:r>${rpr(false, 20)}<w:t xml:space="preserve">   </w:t></w:r>`,
      infoRow('Tipologia: ', beneficiary.tipologia),
      `<w:r>${rpr(false, 20)}<w:t xml:space="preserve">   </w:t></w:r>`,
      infoRow('Bonus target: ', `${premioMaxFmt} €`),
    ].join(''),
    { spacingAfter: 100 }
  );

  const prereqXml = para(
    `<w:r>${rpr(true, 18)}<w:t xml:space="preserve">PREREQUISITO</w:t></w:r><w:r>${rpr(false, 18)}<w:t xml:space="preserve"> – Condizione necessaria per la consuntivazione degli obiettivi è il raggiungimento di un EBITDA Adjusted, comprensivo di oneri e proventi straordinari, non inferiore a ${esc(entryGateStr)} Euro.</w:t></w:r>`,
    { spacingAfter: 120 }
  );

  // ── Objectives table ─────────────────────────────────────────────────────────
  const dataRows = beneficiary.obiettivi.map((obj, i) => dataRow(obj, premiMax, i % 2 === 1)).join('\n');

  const gridCols = Object.values(COL_W).map(w => `<w:gridCol w:w="${w}"/>`).join('');

  const tableXml = `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="0" w:type="auto"/>
      <w:tblLayout w:type="fixed"/>
      <w:tblLook w:val="04A0"/>
      <w:tblCellMar>
        <w:top w:w="80" w:type="dxa"/>
        <w:left w:w="120" w:type="dxa"/>
        <w:bottom w:w="80" w:type="dxa"/>
        <w:right w:w="120" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tblGrid>${gridCols}</w:tblGrid>
    ${headerRow()}
    ${dataRows}
  </w:tbl>`;

  // ── Notes section ────────────────────────────────────────────────────────────
  const notesXml = [
    para(`<w:r>${rpr(false, 16)}<w:t>NOTE – Il premio totale maturato è pari alla somma dei premi maturati per i singoli indicatori obiettivo.</w:t></w:r>`, { spacingBefore: 120, spacingAfter: 40 }),
    para(`<w:r>${rpr(false, 16)}<w:t>(*) Curva con interpolazione lineare da 75% (con 50% Premio target) a 100% (con 100% Premio target=premio max).</w:t></w:r>`, { spacingAfter: 40 }),
    para(`<w:r>${rpr(false, 16)}<w:t>(**) Curva con interpolazione lineare da 75% a 100% (Premio target=100%) e da 100% a 120% (Premio target=120%=premio max).</w:t></w:r>`, { spacingAfter: 0 }),
  ].join('\n');

  let docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  mc:Ignorable="w14 w15">
  <w:body>
    ${titleXml}
    ${infoXml}
    ${prereqXml}
    ${tableXml}
    ${notesXml}
    <w:sectPr>
      <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="1000"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  if (font && font !== 'Calibri') {
    docXml = docXml.replaceAll('Calibri', font);
  }

  const zip = new PizZip();
  zip.file('[Content_Types].xml', MINIMAL_CONTENT_TYPES);
  zip.file('_rels/.rels', MINIMAL_RELS);
  zip.file('word/document.xml', docXml);
  zip.file('word/_rels/document.xml.rels', MINIMAL_DOC_RELS);
  zip.file('word/settings.xml', MINIMAL_SETTINGS);
  zip.file('word/styles.xml', font && font !== 'Calibri' ? MINIMAL_STYLES.replaceAll('Calibri', font) : MINIMAL_STYLES);

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}
