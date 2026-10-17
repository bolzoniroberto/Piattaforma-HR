import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

export interface SealData {
  letterTitle: string;
  signerName: string;
  signerTaxCode: string | null;
  otpSentTo: string;
  signedAt: number; // unix seconds
  ip: string | null;
  userAgent: string | null;
  originalSha256: string;
  transactionId: string;
  declaration: string;
}

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;
const GREY = rgb(0.4, 0.42, 0.47);
const DARK = rgb(0.12, 0.16, 0.23);

/** Standard PDF fonts only cover WinAnsi: strip accents from anything else instead of failing. */
function winAnsi(text: string): string {
  return Array.from(text).map(ch => {
    if (ch.charCodeAt(0) <= 0xff) return ch;
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return base.length === 1 && base.charCodeAt(0) <= 0xff ? base : '?';
  }).join('');
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of winAnsi(text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      // Very long tokens (hashes, user agents) are split by character.
      const pieces = font.widthOfTextAtSize(word, size) > maxWidth ? word.match(/.{1,48}/g) ?? [word] : [word];
      for (const piece of pieces) {
        const candidate = line ? `${line} ${piece}` : piece;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
        else { if (line) lines.push(line); line = piece; }
      }
    }
    lines.push(line);
  }
  return lines;
}

export function formatRomeDateTime(unix: number): string {
  return new Date(unix * 1000).toLocaleString('it-IT', {
    timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
  });
}

function stampFooter(page: PDFPage, font: PDFFont, text: string) {
  const size = 7;
  const { width } = page.getSize();
  const safe = winAnsi(text);
  const textWidth = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, { x: Math.max(12, (width - textWidth) / 2), y: 12, size, font, color: GREY });
}

/**
 * Returns a new PDF: the original pages, each with a small signature footer,
 * followed by an attestation page with the evidence of the signature.
 */
export async function sealPdf(original: Buffer, d: SealData): Promise<Buffer> {
  const pdf = await PDFDocument.load(original, { updateMetadata: false });
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const when = formatRomeDateTime(d.signedAt);

  const footer = `Firmato elettronicamente da ${d.signerName} il ${when} - ID transazione ${d.transactionId}`;
  for (const page of pdf.getPages()) stampFooter(page, regular, footer);

  const page = pdf.addPage(A4);
  const maxWidth = A4[0] - MARGIN * 2;
  let y = A4[1] - MARGIN;

  const write = (text: string, font: PDFFont, size: number, color = DARK, gapAfter = 4) => {
    for (const line of wrap(text, font, size, maxWidth)) {
      page.drawText(line, { x: MARGIN, y, size, font, color });
      y -= size + 4;
    }
    y -= gapAfter;
  };

  write('Attestato di firma elettronica semplice', bold, 16, DARK, 6);
  write('Questa pagina è stata aggiunta automaticamente dalla piattaforma al momento della firma e ne riporta le evidenze.', regular, 9, GREY, 14);

  const rows: [string, string][] = [
    ['Documento', d.letterTitle],
    ['Firmatario', d.signerName],
    ...(d.signerTaxCode ? [['Codice fiscale', d.signerTaxCode] as [string, string]] : []),
    ['Data e ora della firma', when],
    ['Metodo', 'Codice monouso (OTP) inviato via email'],
    ['Codice inviato a', d.otpSentTo],
    ['Indirizzo IP', d.ip ?? 'non disponibile'],
    ['Browser', d.userAgent ?? 'non disponibile'],
    ['Impronta SHA-256 del documento firmato (pagine precedenti a questa, prima dell\'apposizione della firma)', d.originalSha256],
    ['ID transazione', d.transactionId],
  ];
  for (const [label, value] of rows) {
    write(label, bold, 9, GREY, 0);
    write(value, regular, 10, DARK, 8);
  }

  y -= 6;
  write('Dichiarazione accettata dal firmatario', bold, 9, GREY, 0);
  write(`"${d.declaration}"`, regular, 10, DARK, 14);
  write(
    'Per verificare l\'integrità del documento originale, calcolarne l\'impronta SHA-256 e confrontarla con quella riportata sopra. ' +
    'Le evidenze della firma sono conservate anche negli archivi della piattaforma con lo stesso ID transazione.',
    regular, 8, GREY,
  );

  pdf.setTitle(`${d.letterTitle} (firmata)`);
  pdf.setSubject('Documento sottoscritto con firma elettronica semplice');
  pdf.setKeywords([`transaction:${d.transactionId}`, `sha256:${d.originalSha256}`]);
  pdf.setProducer('TalentHub');
  pdf.setModificationDate(new Date(d.signedAt * 1000));

  return Buffer.from(await pdf.save());
}
