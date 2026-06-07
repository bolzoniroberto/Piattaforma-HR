import PizZip from 'pizzip';
import fs from 'fs';
import sizeOf from 'image-size';

const DRAWING_NS = [
  'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"',
  'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"',
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"',
].join(' ');

// 914400 EMU = 1 inch
function pxToEmu(px: number, dpi = 96): number {
  return Math.round((px / dpi) * 914400);
}

function buildInlineImageXml(relId: string, widthEmu: number, heightEmu: number): string {
  return `<w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${widthEmu}" cy="${heightEmu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1001" name="Firma"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="Firma"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

/**
 * Inserts a signature PNG into a .docx buffer.
 * Replaces the literal text [FIRMA] in the document body with an inline image.
 * If [FIRMA] is not found, appends the image at the end of the body.
 */
export function insertSignatureImage(docBuffer: Buffer, signatureImagePath: string): Buffer {
  const imgBuf = fs.readFileSync(signatureImagePath);

  // Get image dimensions (default 150x60 if detection fails)
  let widthPx = 150;
  let heightPx = 60;
  try {
    const dims = sizeOf(imgBuf);
    if (dims.width && dims.height) {
      widthPx = dims.width;
      heightPx = dims.height;
    }
  } catch {}

  // Scale to max 5cm wide (≈189px at 96dpi), preserving aspect ratio
  const maxWidthPx = 189;
  if (widthPx > maxWidthPx) {
    heightPx = Math.round((heightPx * maxWidthPx) / widthPx);
    widthPx = maxWidthPx;
  }

  const widthEmu = pxToEmu(widthPx);
  const heightEmu = pxToEmu(heightPx);

  const zip = new PizZip(docBuffer);

  // Add image file
  zip.file('word/media/signature.png', imgBuf);

  // Add relationship
  const relsPath = 'word/_rels/document.xml.rels';
  let relsXml = zip.file(relsPath)?.asText() ?? '';
  const relId = 'rIdSig1';
  if (!relsXml.includes(relId)) {
    const imageRel = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/signature.png"/>`;
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

  if (docXml.includes('[FIRMA]')) {
    // Find and replace the paragraph containing [FIRMA] using string search
    const idx = docXml.indexOf('[FIRMA]');
    const pStart = docXml.lastIndexOf('<w:p', idx);
    const pEnd = docXml.indexOf('</w:p>', idx) + '</w:p>'.length;
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
