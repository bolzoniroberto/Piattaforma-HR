import PizZip from 'pizzip';
import fs from 'fs';
import sizeOf from 'image-size';
import { setJpegDpiForWidth, setPngDpiForWidth } from './imageUtils';

// 1 inch = 914400 EMU; 1 cm = 914400/2.54 EMU
const CM_TO_EMU = 914400 / 2.54;

function cmToEmu(cm: number): number {
  return Math.round(cm * CM_TO_EMU);
}

// Max logo width: 6 cm absolute (DPI-independent)
const MAX_LOGO_WIDTH_EMU = cmToEmu(6);

function buildInlineLogoXml(relId: string, widthEmu: number, heightEmu: number, align: 'left' | 'right' = 'left'): string {
  // No <a:stretch> — LibreOffice misinterprets fillRect and may expand image to text-area width.
  // wp:extent + spPr/ext are the authoritative size; the blip fills exactly that box.
  return `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:after="120"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${widthEmu}" cy="${heightEmu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1002" name="Logo"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="Logo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relId}"/><a:srcRect/></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

/** Removes the paragraph containing [LOGO] text (backward compat with old templates). */
function removeLogoPlaceholder(docXml: string): string {
  if (!docXml.includes('[LOGO]')) return docXml;
  // Remove the entire <w:p>...</w:p> that contains [LOGO]
  return docXml.replace(/<w:p\b[^>]*>(?:(?!<\/w:p>)[\s\S])*?\[LOGO\][\s\S]*?<\/w:p>/g, '');
}

/**
 * Strips [LOGO] placeholder from a rendered docx when no logo image is configured.
 * Call this when logoImagePath is null/empty to avoid showing "[LOGO]" as text.
 */
export function stripLogoPlaceholder(docBuffer: Buffer): Buffer {
  const zip = new PizZip(docBuffer);
  const docFile = zip.file('word/document.xml');
  if (!docFile) return docBuffer;
  const xml = docFile.asText();
  if (!xml.includes('[LOGO]')) return docBuffer;
  zip.file('word/document.xml', removeLogoPlaceholder(xml));
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

interface LogoDims {
  widthEmu: number;
  heightEmu: number;
  patchedImgBuf: Buffer;
  ext: '.jpg' | '.png';
}

function prepareLogoAsset(logoImagePath: string, maxWidthCm: number): LogoDims {
  const imgBuf = fs.readFileSync(logoImagePath);

  let widthPx = 200;
  let heightPx = 80;
  let imgDpi = 96;
  try {
    const dims = sizeOf(imgBuf);
    if (dims.width && dims.height) { widthPx = dims.width; heightPx = dims.height; }
    if ((dims as any).density) imgDpi = (dims as any).density;
  } catch {}

  const naturalWidthEmu  = Math.round((widthPx  / imgDpi) * 914400);
  const naturalHeightEmu = Math.round((heightPx / imgDpi) * 914400);

  const capEmu = cmToEmu(maxWidthCm);
  let widthEmu  = naturalWidthEmu;
  let heightEmu = naturalHeightEmu;
  if (widthEmu > capEmu) {
    heightEmu = Math.round((heightEmu * capEmu) / widthEmu);
    widthEmu  = capEmu;
  }

  const ext: '.jpg' | '.png' = (logoImagePath.endsWith('.jpg') || logoImagePath.endsWith('.jpeg')) ? '.jpg' : '.png';
  const targetWidthCm = widthEmu / CM_TO_EMU;
  const patchedImgBuf = ext === '.jpg'
    ? setJpegDpiForWidth(imgBuf, widthPx, targetWidthCm)
    : setPngDpiForWidth(imgBuf, widthPx, targetWidthCm);

  return { widthEmu, heightEmu, patchedImgBuf, ext };
}

function injectLogoIntoZip(zip: PizZip, dims: LogoDims): string {
  const { patchedImgBuf, ext } = dims;
  const mediaFile = `word/media/logo${ext}`;
  zip.file(mediaFile, patchedImgBuf);

  const ctPath = '[Content_Types].xml';
  let ctXml = zip.file(ctPath)?.asText() ?? '';
  const ctExtension = ext === '.jpg' ? 'jpg' : 'png';
  const ctMediaType = ext === '.jpg' ? 'image/jpeg' : 'image/png';
  if (ctXml && !ctXml.includes(`Extension="${ctExtension}"`)) {
    ctXml = ctXml.replace('</Types>', `<Default Extension="${ctExtension}" ContentType="${ctMediaType}"/></Types>`);
    zip.file(ctPath, ctXml);
  }

  const relsPath = 'word/_rels/document.xml.rels';
  let relsXml = zip.file(relsPath)?.asText() ?? '';
  const relId = 'rIdLogo1';
  if (!relsXml.includes(relId)) {
    const imageRel = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo${ext}"/>`;
    relsXml = relsXml.replace('</Relationships>', `${imageRel}</Relationships>`);
    zip.file(relsPath, relsXml);
  }

  return relId;
}

/**
 * Inserts the company logo as the first paragraph of the document body (top-left).
 * Also removes any legacy [LOGO] placeholder text.
 */
export function insertLogoImage(docBuffer: Buffer, logoImagePath: string, maxWidthCm = 4): Buffer {
  const dims = prepareLogoAsset(logoImagePath, maxWidthCm);
  const zip = new PizZip(docBuffer);
  const relId = injectLogoIntoZip(zip, dims);

  const imgParagraph = buildInlineLogoXml(relId, dims.widthEmu, dims.heightEmu, 'left');

  let docXml = zip.file('word/document.xml')!.asText();
  docXml = removeLogoPlaceholder(docXml);
  docXml = docXml.replace(/(<w:body>)/, `$1${imgParagraph}`);

  zip.file('word/document.xml', docXml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/**
 * Inserts the company logo fixed at the bottom-right of every page via the footer.
 * Used for scheda_obiettivi. Footer becomes: [empty] [PAGE#, centered] [logo, right].
 * The document body is not modified — logo position never depends on content height.
 *
 * Layout: A4 landscape usable width = 15118 twips (page 16838 − left 1000 − right 720).
 * Tab stops: center at 7559, right at 15118.
 */
export function insertLogoImageBottomRight(docBuffer: Buffer, logoImagePath: string, maxWidthCm = 4): Buffer {
  const dims = prepareLogoAsset(logoImagePath, maxWidthCm);
  const zip = new PizZip(docBuffer);
  const { patchedImgBuf, ext } = dims;

  // ── 1. Add image to media ──────────────────────────────────────────────────
  const mediaFile = `word/media/logoFtr${ext}`;
  zip.file(mediaFile, patchedImgBuf);

  // ── 2. Content-type for image extension ───────────────────────────────────
  const ctPath = '[Content_Types].xml';
  let ctXml = zip.file(ctPath)?.asText() ?? '';
  const ctExtension = ext === '.jpg' ? 'jpg' : 'png';
  const ctMediaType = ext === '.jpg' ? 'image/jpeg' : 'image/png';
  if (ctXml && !ctXml.includes(`Extension="${ctExtension}"`)) {
    ctXml = ctXml.replace('</Types>', `<Default Extension="${ctExtension}" ContentType="${ctMediaType}"/></Types>`);
    zip.file(ctPath, ctXml);
  }

  // ── 3. footer1.xml.rels (logo relationship) ───────────────────────────────
  const ftrRelId = 'rIdLogoFtr';
  const ftrRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="${ftrRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logoFtr${ext}"/>
</Relationships>`;
  zip.file('word/_rels/footer1.xml.rels', ftrRelsXml);

  // ── 4. Build footer XML: one paragraph with center + right tab stops ──────
  const rpr = `<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>`;
  const logoXml = `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${dims.widthEmu}" cy="${dims.heightEmu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1003" name="LogoFtr"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="LogoFtr"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${ftrRelId}"/><a:srcRect/></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${dims.widthEmu}" cy="${dims.heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;

  const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:p>
    <w:pPr>
      <w:jc w:val="left"/>
      <w:spacing w:after="0"/>
      <w:tabs>
        <w:tab w:val="center" w:pos="7559"/>
        <w:tab w:val="right" w:pos="15118"/>
      </w:tabs>
    </w:pPr>
    <w:r>${rpr}<w:tab/></w:r>
    <w:r>${rpr}<w:fldChar w:fldCharType="begin"/></w:r>
    <w:r>${rpr}<w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
    <w:r>${rpr}<w:fldChar w:fldCharType="end"/></w:r>
    <w:r>${rpr}<w:tab/></w:r>
    <w:r>${rpr}${logoXml}</w:r>
  </w:p>
</w:ftr>`;

  zip.file('word/footer1.xml', footerXml);

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}
