import PizZip from 'pizzip';
import fs from 'fs';
import sizeOf from 'image-size';
import { setJpegDpiForWidth, setPngDpiForWidth } from './imageUtils';

const DRAWING_NS = [
  'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"',
  'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"',
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"',
].join(' ');

/** Finds the start of the <w:p> paragraph tag containing position idx, skipping <w:pPr>, <w:pStyle>, etc. */
function findParagraphStart(xml: string, idx: number): number {
  let pos = idx;
  while (pos >= 0) {
    const candidate = xml.lastIndexOf('<w:p', pos);
    if (candidate === -1) return -1;
    const charAfter = xml[candidate + 4];
    if (charAfter === '>' || charAfter === ' ') return candidate;
    pos = candidate - 1;
  }
  return -1;
}

// 914400 EMU = 1 inch; 1 cm = 914400/2.54 EMU
const CM_TO_EMU = 914400 / 2.54;
// Max signature: 8 cm wide × 4 cm tall bounding box
const MAX_SIG_WIDTH_EMU  = Math.round(8  * CM_TO_EMU);
const MAX_SIG_HEIGHT_EMU = Math.round(4  * CM_TO_EMU);

function buildInlineImageXml(relId: string, widthEmu: number, heightEmu: number): string {
  // No <a:stretch> — LibreOffice misinterprets fillRect, expanding image to text-area width.
  return `<w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="0"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${widthEmu}" cy="${heightEmu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1001" name="Firma"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="Firma"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relId}"/><a:srcRect/></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

/**
 * Inserts a signature PNG into a .docx buffer.
 * Replaces the literal text [FIRMA] in the document body with an inline image.
 * If [FIRMA] is not found, appends the image at the end of the body.
 */
export function insertSignatureImage(docBuffer: Buffer, signatureImagePath: string, maxWidthCm = 5): Buffer {
  const imgBuf = fs.readFileSync(signatureImagePath);

  let widthPx = 150;
  let heightPx = 60;
  let imgDpi = 96;
  try {
    const dims = sizeOf(imgBuf);
    if (dims.width && dims.height) { widthPx = dims.width; heightPx = dims.height; }
    if ((dims as any).density) imgDpi = (dims as any).density;
  } catch {}

  // Convert to EMU using actual image DPI, then cap to bounding box preserving aspect ratio
  // Height cap = maxWidthCm / 2 (assume signature is roughly 2:1 wide)
  const capW = Math.round(maxWidthCm * CM_TO_EMU);
  const capH = Math.round((maxWidthCm / 2) * CM_TO_EMU);
  let wEmu = Math.round((widthPx  / imgDpi) * 914400);
  let hEmu = Math.round((heightPx / imgDpi) * 914400);
  const wScale = wEmu / capW;
  const hScale = hEmu / capH;
  if (wScale > 1 || hScale > 1) {
    const scale = Math.max(wScale, hScale);
    wEmu = Math.round(wEmu / scale);
    hEmu = Math.round(hEmu / scale);
  }

  const widthEmu  = wEmu;
  const heightEmu = hEmu;

  // Detect actual image format for correct media type
  const isJpeg = signatureImagePath.match(/\.(jpg|jpeg)$/i);
  const mediaExt  = isJpeg ? '.jpg' : '.png';
  const mediaType = isJpeg ? 'image/jpeg' : 'image/png';
  const mediaFile = `word/media/signature${mediaExt}`;

  const zip = new PizZip(docBuffer);

  // Inject DPI so LibreOffice renders at the correct physical width.
  // Target the FINAL (post-cap) width, not maxWidthCm — otherwise LibreOffice
  // forces every signature to maxWidthCm while Word honours wp:extent, so a
  // height-capped (tall) signature comes out too wide in the PDF only.
  const finalWidthCm = widthEmu / CM_TO_EMU;
  const patchedImgBuf = isJpeg
    ? setJpegDpiForWidth(imgBuf, widthPx, finalWidthCm)
    : setPngDpiForWidth(imgBuf, widthPx, finalWidthCm);

  zip.file(mediaFile, patchedImgBuf);

  // Declare correct content type. Extension MUST match the part filename
  // (we write signature.jpg, so declare "jpg" — declaring "jpeg" leaves the
  // .jpg part undeclared and Word shows a "repair unreadable content" prompt).
  const ctPath = '[Content_Types].xml';
  let ctXml = zip.file(ctPath)?.asText() ?? '';
  const ctExtension = isJpeg ? 'jpg' : 'png';
  if (ctXml && !ctXml.includes(`Extension="${ctExtension}"`)) {
    ctXml = ctXml.replace('</Types>', `<Default Extension="${ctExtension}" ContentType="${mediaType}"/></Types>`);
    zip.file(ctPath, ctXml);
  }

  // Add relationship
  const relsPath = 'word/_rels/document.xml.rels';
  let relsXml = zip.file(relsPath)?.asText() ?? '';
  const relId = 'rIdSig1';
  if (!relsXml.includes(relId)) {
    const imageRel = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/signature${mediaExt}"/>`;
    relsXml = relsXml.replace('</Relationships>', `${imageRel}</Relationships>`);
    zip.file(relsPath, relsXml);
  }

  // Build image paragraph XML
  const imgParagraph = buildInlineImageXml(relId, widthEmu, heightEmu);

  // Replace [FIRMA] placeholder or append before </w:body>
  let docXml = zip.file('word/document.xml')!.asText();

  // Ensure the document XML has the needed namespace declarations on root element
  if (!docXml.includes('xmlns:wp=')) {
    docXml = docXml.replace('<w:document', `<w:document ${DRAWING_NS}`);
  }

  const firmaFound = docXml.includes('[FIRMA]');
  console.log('[signatureInserter] [FIRMA] in XML:', firmaFound);
  if (!firmaFound) {
    // dump a snippet near end of body for debugging
    const bodyEnd = docXml.lastIndexOf('</w:body>');
    if (bodyEnd > 200) console.log('[signatureInserter] tail:', docXml.slice(bodyEnd - 200, bodyEnd).replace(/\s+/g, ' '));
  }

  if (firmaFound) {
    const idx = docXml.indexOf('[FIRMA]');
    const pStart = findParagraphStart(docXml, idx);
    const pEnd = docXml.indexOf('</w:p>', idx) + '</w:p>'.length;
    console.log('[signatureInserter] pStart:', pStart, 'pEnd:', pEnd);
    if (pStart !== -1 && pEnd > pStart) {
      docXml = docXml.slice(0, pStart) + imgParagraph + docXml.slice(pEnd);
    } else {
      docXml = docXml.replace('[FIRMA]', '');
      docXml = docXml.replace('</w:body>', `${imgParagraph}</w:body>`);
    }
  } else {
    docXml = docXml.replace('</w:body>', `${imgParagraph}</w:body>`);
  }

  zip.file('word/document.xml', docXml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/** Removes [FIRMA] placeholder text from the document without inserting an image. */
export function stripFirmaPlaceholder(docBuffer: Buffer): Buffer {
  const zip = new PizZip(docBuffer);
  let docXml = zip.file('word/document.xml')!.asText();
  if (docXml.includes('[FIRMA]')) {
    const idx = docXml.indexOf('[FIRMA]');
    const pStart = findParagraphStart(docXml, idx);
    const pEnd = docXml.indexOf('</w:p>', idx) + '</w:p>'.length;
    if (pStart !== -1 && pEnd > pStart) {
      docXml = docXml.slice(0, pStart) + docXml.slice(pEnd);
    } else {
      docXml = docXml.replace('[FIRMA]', '');
    }
    zip.file('word/document.xml', docXml);
  }
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}
