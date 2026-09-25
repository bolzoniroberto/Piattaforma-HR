// Converts letter body_content text to proper OOXML paragraphs for docxtemplater.
// Placeholders like {campo} are left intact inside <w:t> — docxtemplater fills them.

const FONT = 'Calibri';
const FONT_SIZE = 22;      // half-points → 11pt
const FONT_SIZE_TITLE = 24; // 12pt
const FONT_SIZE_SMALL = 20; // 10pt
const LINE_SPACING = 276;   // twips (auto, ≈1.15)
const SPACING_AFTER_NORMAL = 100;
const SPACING_AFTER_SECTION = 200;
const SPACING_AFTER_EMPTY = 80;

// Words at start of line that should be rendered bold
const BOLD_START_WORDS = [
  'Dichiara di conoscere',
  'Dichiara che con',
  'Dichiara di aver',
  'Dichiara',
  'Conferma',
  'Prende atto',
];

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rpr(bold = false, size = FONT_SIZE, italic = false): string {
  return [
    '<w:rPr>',
    bold ? '<w:b/><w:bCs/>' : '',
    italic ? '<w:i/><w:iCs/>' : '',
    `<w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>`,
    `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`,
    '<w:lang w:val="it-IT"/>',
    '</w:rPr>',
  ].join('');
}

function textRun(text: string, bold = false, size = FONT_SIZE, italic = false): string {
  if (!text) return '';
  return `<w:r>${rpr(bold, size, italic)}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

// Parse inline **bold** markers, *italic* markers
function parseInline(text: string, defaultSize = FONT_SIZE): string {
  // Split on **bold** and *italic* markers
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map(part => {
    if (part.startsWith('**') && part.endsWith('**')) return textRun(part.slice(2, -2), true, defaultSize);
    if (part.startsWith('*') && part.endsWith('*')) return textRun(part.slice(1, -1), false, defaultSize, true);
    return textRun(part, false, defaultSize);
  }).join('');
}

function ppr(opts: {
  align?: 'both' | 'center' | 'right' | 'left';
  indentLeft?: number;
  spacingAfter?: number;
  spacingBefore?: number;
  borderBox?: boolean;
  keepNext?: boolean;
} = {}): string {
  const jc = opts.align ?? 'both';
  const ind = opts.indentLeft ? `<w:ind w:left="${opts.indentLeft}"/>` : '';
  const sp = `<w:spacing w:after="${opts.spacingAfter ?? SPACING_AFTER_NORMAL}" w:before="${opts.spacingBefore ?? 0}" w:line="${LINE_SPACING}" w:lineRule="auto"/>`;
  const border = opts.borderBox ? `<w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="4" w:color="000000"/></w:pBdr>` : '';
  const kn = opts.keepNext ? '<w:keepNext/>' : '';
  return `<w:pPr>${kn}<w:jc w:val="${jc}"/>${ind}${sp}${border}</w:pPr>`;
}

function makeParagraph(inner: string, opts: Parameters<typeof ppr>[0] = {}): string {
  return `<w:p>${ppr(opts)}${inner}</w:p>`;
}

// ─── Line classifiers ──────────────────────────────────────────────────────────

function isDocxtemplaterTag(line: string): boolean {
  const t = line.trim();
  return /^\{[#/^@]/.test(t) && /\}$/.test(t);
}

function isTitle(line: string): boolean {
  const t = line.trim();
  // Quoted title: "SCHEDA OBIETTIVI" or similar short quoted strings
  return (t.startsWith('"') && t.endsWith('"') && t.length < 60);
}

function isSubtitle(line: string): boolean {
  const t = line.trim();
  return t.startsWith('Ai sensi del Regolamento') || t.startsWith('ALLEGATO - SCHEDA');
}

function isBullet(line: string): boolean {
  const t = line.trim();
  return t.startsWith('▪ ') || t.startsWith('- ');
}

function isSection(line: string): boolean {
  // All-caps short section headers
  const t = line.trim();
  return t.length > 3 && t.length < 80 && t === t.toUpperCase() && /[A-Z]/.test(t) && !t.includes('{');
}

function isH1(line: string): boolean {
  return /^# /.test(line);
}

function isH2(line: string): boolean {
  return /^## /.test(line);
}

function isH3(line: string): boolean {
  return /^### /.test(line);
}

function isRightAligned(line: string): boolean {
  return line.startsWith('>>>');
}

function isCentered(line: string): boolean {
  return line.startsWith('===');
}

function detectBoldStart(line: string): [string, string] | null {
  const t = line.trim();
  for (const word of BOLD_START_WORDS) {
    if (t.startsWith(word)) {
      const rest = t.slice(word.length);
      return [word, rest];
    }
  }
  return null;
}

// ─── Line → OOXML ─────────────────────────────────────────────────────────────

function lineToXml(line: string, lineIndex: number, lines: string[]): string {
  const trimmed = line.trim();

  // Empty line
  if (!trimmed) {
    return makeParagraph('', { spacingAfter: SPACING_AFTER_EMPTY });
  }

  // Docxtemplater tags stay bare (no formatting)
  if (isDocxtemplaterTag(trimmed)) {
    return `<w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:t>${esc(trimmed)}</w:t></w:r></w:p>`;
  }

  // Markdown headings
  if (isH3(line)) {
    const content = line.slice(4).trim();
    return makeParagraph(
      textRun(content, true, FONT_SIZE),
      { spacingAfter: SPACING_AFTER_NORMAL, spacingBefore: 80 }
    );
  }
  if (isH2(line)) {
    return makeParagraph(
      textRun(line.slice(3).trim(), true, FONT_SIZE),
      { align: 'center', spacingAfter: SPACING_AFTER_SECTION }
    );
  }
  if (isH1(line)) {
    return makeParagraph(
      textRun(line.slice(2).trim(), true, FONT_SIZE_TITLE),
      { align: 'center', spacingAfter: SPACING_AFTER_SECTION, spacingBefore: 100, borderBox: true }
    );
  }

  // >>> right-aligned (signature block)
  if (isRightAligned(line)) {
    const content = line.slice(3).trim();
    return makeParagraph(parseInline(content), { align: 'right', spacingAfter: SPACING_AFTER_NORMAL });
  }

  // === centered
  if (isCentered(line)) {
    const content = line.slice(3).trim();
    return makeParagraph(parseInline(content), { align: 'center', spacingAfter: SPACING_AFTER_NORMAL });
  }

  // Quoted title "SCHEDA OBIETTIVI"
  if (isTitle(trimmed)) {
    const content = trimmed.slice(1, -1);
    return makeParagraph(
      textRun(content, true, FONT_SIZE_TITLE),
      { align: 'center', spacingAfter: SPACING_AFTER_SECTION, spacingBefore: 100, borderBox: true }
    );
  }

  // ALLEGATO - SCHEDA OBIETTIVI line
  if (isSubtitle(trimmed)) {
    return makeParagraph(
      textRun(trimmed, true, FONT_SIZE),
      { align: 'center', spacingAfter: SPACING_AFTER_SECTION }
    );
  }

  // ALL CAPS section header (e.g. "DETTAGLIO INDICATORI:")
  if (isSection(trimmed) && trimmed.length > 5) {
    return makeParagraph(
      textRun(trimmed, true, FONT_SIZE),
      { spacingAfter: SPACING_AFTER_NORMAL, spacingBefore: 80 }
    );
  }

  // Bullet points
  if (isBullet(trimmed)) {
    const content = trimmed.slice(2);
    return makeParagraph(
      parseInline(content),
      { indentLeft: 360, spacingAfter: SPACING_AFTER_NORMAL }
    );
  }

  // Bold-start lines (Dichiara, Conferma, Prende atto)
  const boldStart = detectBoldStart(line);
  if (boldStart) {
    const [boldWord, rest] = boldStart;
    return makeParagraph(
      textRun(boldWord, true) + (rest ? parseInline(rest) : ''),
      { spacingAfter: SPACING_AFTER_NORMAL }
    );
  }

  // Default: normal justified paragraph
  return makeParagraph(
    parseInline(trimmed),
    { spacingAfter: SPACING_AFTER_NORMAL }
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function bodyContentToOoxml(bodyContent: string): string {
  const lines = bodyContent.split('\n');
  return lines.map((line, i) => lineToXml(line, i, lines)).join('\n');
}

export interface PageLayoutOptions {
  orientation?: 'portrait' | 'landscape';
  fitToPage?: boolean;
}

// Returns the full document.xml content
export function buildDocumentXml(bodyContent: string, font = 'Calibri', layout: PageLayoutOptions = {}, fontSizePt = 11): string {
  const { orientation = 'portrait', fitToPage = false } = layout;

  // A4 dimensions in twips
  const isLandscape = orientation === 'landscape';
  const pgW = isLandscape ? 16838 : 11906;
  const pgH = isLandscape ? 11906 : 16838;
  const orientAttr = isLandscape ? ' w:orient="landscape"' : '';

  // Tight margins when fitToPage, standard otherwise
  const marginTop    = fitToPage ? 567 : 1134;
  const marginRight  = fitToPage ? 567 : 1134;
  const marginBottom = fitToPage ? 567 : 1134;
  const marginLeft   = fitToPage ? 567 : 1701;

  const body = bodyContentToOoxml(bodyContent);
  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
${body}
    <w:sectPr>
      <w:footerReference w:type="default" r:id="rId3"/>
      <w:pgSz w:w="${pgW}" w:h="${pgH}"${orientAttr}/>
      <w:pgMar w:top="${marginTop}" w:right="${marginRight}" w:bottom="${marginBottom}" w:left="${marginLeft}" w:footer="709"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  if (font && font !== 'Calibri') {
    xml = xml.replaceAll('Calibri', font);
  }
  if (fontSizePt !== 11) {
    xml = applyFontSize(xml, fontSizePt);
  }
  return xml;
}

function applyFontSize(xml: string, fontSizePt: number): string {
  const hp = Math.round(fontSizePt * 2);
  return xml
    .replaceAll(`w:sz w:val="22"`, `w:sz w:val="${hp}"`)
    .replaceAll(`w:szCs w:val="22"`, `w:szCs w:val="${hp}"`)
    .replaceAll(`w:sz w:val="24"`, `w:sz w:val="${hp + 2}"`)
    .replaceAll(`w:szCs w:val="24"`, `w:szCs w:val="${hp + 2}"`)
    .replaceAll(`w:sz w:val="20"`, `w:sz w:val="${hp - 2}"`)
    .replaceAll(`w:szCs w:val="20"`, `w:szCs w:val="${hp - 2}"`);
}

export function buildMinimalStyles(font = 'Calibri', fontSizePt = 11): string {
  let s = MINIMAL_STYLES;
  if (font && font !== 'Calibri') s = s.replaceAll('Calibri', font);
  if (fontSizePt !== 11) s = applyFontSize(s, fontSizePt);
  return s;
}

export const MINIMAL_CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;

export const MINIMAL_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

export const MINIMAL_DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`;

export const MINIMAL_SETTINGS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="708"/>
</w:settings>`;

export const MINIMAL_FOOTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>
    <w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
    <w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
  </w:p>
</w:ftr>`;

export const MINIMAL_STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
          xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="it-IT" w:eastAsia="it-IT" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="100" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="both"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="22"/>
    </w:rPr>
  </w:style>
</w:styles>`;
