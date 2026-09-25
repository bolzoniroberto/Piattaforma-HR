import XLSX from 'xlsx';

export interface BeneficiaryRow {
  nome_beneficiario: string;
  qualifica: string;
  tipologia: string;
  premio_max: number;
  area: string;
  obiettivi: ObiettivRow[];
  [key: string]: unknown;
}

export interface ObiettivRow {
  codice: string;
  indicatore: string;
  descrizione: string;
  peso: string;
  modalita_calcolo: string;
  target: string;
  rendicontatore: string;
  note: string;
  tipo_obiettivo: string;
  idx: number;
}

export interface ExcelPreview {
  sheets: string[];
  headers: { col: string; idx: number; name: string }[];
  rows: Record<string, unknown>[];
  suggestedMappings: Record<string, string>;
  suggestionConfidence: Record<string, number>;
}

const HEADER_ROW_IDX = 1; // 0-indexed = row 2

// ─── Fuzzy auto-match ──────────────────────────────────────────────────────────

// Normalizza una stringa: lowercase, rimuove accenti, non-alfanumerici → spazio, collassa spazi.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // diacritici
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// Alias noti per ogni placeholder. Il nome canonico viene aggiunto in coda automaticamente.
const PLACEHOLDER_ALIASES: Record<string, string[]> = {
  nome_beneficiario: ['beneficiario', 'dipendente', 'nominativo', 'cognome nome', 'nome cognome', 'collaboratore', 'risorsa'],
  qualifica: ['area', 'ruolo', 'mansione', 'posizione', 'qualifica'],
  tipologia: ['tipologia scheda', 'tipo scheda', 'tipologia', 'categoria'],
  premio_max: ['premio max', 'premio massimo', 'premio max €', 'compenso massimo', 'importo massimo', 'bonus max', 'mbo max', 'premio'],
  direzione: ['direzione', 'dipartimento', 'funzione', 'business unit', 'bu'],
  indirizzo: ['indirizzo', 'via', 'residenza'],
  cap: ['cap', 'codice postale'],
  citta_residenza: ['citta residenza', 'citta', 'comune', 'localita'],
  prov: ['prov', 'provincia', 'pr'],
  genere: ['genere', 'sesso', 'm f'],
  tipo_obiettivo: ['tipo obiettivo', 'tipologia obiettivo', 'natura obiettivo'],
  codice: ['codice', 'cod', 'id obiettivo'],
  indicatore: ['indicatore', 'kpi', 'metrica'],
  descrizione: ['descrizione', 'obiettivo', 'descrizione obiettivo'],
  peso: ['peso', 'peso %', 'weight', 'incidenza'],
  modalita_calcolo: ['modalita di calcolo', 'modalita calcolo', 'formula', 'calcolo'],
  target: ['target', 'obiettivo target', 'valore atteso', 'soglia'],
  rendicontatore: ['rendicontatore fonte', 'rendicontatore', 'fonte', 'fonte dato', 'responsabile rendicontazione'],
  note: ['note', 'annotazioni', 'commenti'],
};

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function levenshteinRatio(a: string, b: string): number {
  if (!a && !b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function jaccard(a: string, b: string): number {
  const ta = Array.from(new Set(a.split(' ').filter(Boolean)));
  const tb = new Set(b.split(' ').filter(Boolean));
  if (!ta.length || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.length + tb.size - inter);
}

// Score [0..1] tra un header normalizzato e una stringa candidata normalizzata.
function similarity(headerNorm: string, candidateNorm: string): number {
  if (headerNorm === candidateNorm) return 1;
  return Math.max(jaccard(headerNorm, candidateNorm), levenshteinRatio(headerNorm, candidateNorm));
}

const MATCH_THRESHOLD = 0.6;

// Per ogni placeholder trova l'header Excel migliore sopra soglia, con confidence.
export function autoMatchMappings(
  headers: string[],
  placeholders: string[],
): Record<string, { header: string; confidence: number }> {
  const headerNorms = headers.map(h => ({ raw: h, norm: normalize(h) }));
  const out: Record<string, { header: string; confidence: number }> = {};

  for (const ph of placeholders) {
    const candidates = [...(PLACEHOLDER_ALIASES[ph] ?? []), ph.replace(/_/g, ' ')].map(normalize);
    let best: { header: string; confidence: number } | null = null;
    for (const h of headerNorms) {
      let score = 0;
      for (const c of candidates) {
        score = Math.max(score, similarity(h.norm, c));
        if (score === 1) break;
      }
      if (!best || score > best.confidence) best = { header: h.raw, confidence: score };
    }
    if (best && best.confidence >= MATCH_THRESHOLD) {
      out[ph] = { header: best.header, confidence: Math.round(best.confidence * 100) / 100 };
    }
  }
  return out;
}

// Placeholder noti per cui calcoliamo i suggerimenti in preview.
export const KNOWN_PLACEHOLDERS = Object.keys(PLACEHOLDER_ALIASES);

function findHeaderCol(ws: XLSX.WorkSheet, range: XLSX.Range, name: string): number {
  const lname = name.toLowerCase();
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: HEADER_ROW_IDX, c });
    const cell = ws[addr];
    if (cell && String(cell.v).toLowerCase().includes(lname)) return c;
  }
  return -1;
}

export function previewExcel(filePath: string): ExcelPreview {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.includes('Dettaglio Obiettivi')
    ? 'Dettaglio Obiettivi'
    : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');

  const headers: ExcelPreview['headers'] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: HEADER_ROW_IDX, c });
    const cell = ws[addr];
    if (cell) headers.push({ col: XLSX.utils.encode_col(c), idx: c, name: String(cell.v) });
  }

  const rows: Record<string, unknown>[] = [];
  for (let r = HEADER_ROW_IDX + 1; r <= Math.min(range.e.r, HEADER_ROW_IDX + 5); r++) {
    const row: Record<string, unknown> = {};
    for (const h of headers) {
      const addr = XLSX.utils.encode_cell({ r, c: h.idx });
      row[h.name] = ws[addr]?.v ?? null;
    }
    rows.push(row);
  }

  const matched = autoMatchMappings(headers.map(h => h.name), KNOWN_PLACEHOLDERS);
  const suggestedMappings: Record<string, string> = {};
  const suggestionConfidence: Record<string, number> = {};
  for (const [ph, { header: hName, confidence }] of Object.entries(matched)) {
    suggestedMappings[ph] = hName;
    suggestionConfidence[ph] = confidence;
  }

  return { sheets: wb.SheetNames, headers, rows, suggestedMappings, suggestionConfidence };
}

export function parseExcel(
  filePath: string,
  fieldMappings: Record<string, string>,
): BeneficiaryRow[] {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.includes('Dettaglio Obiettivi')
    ? 'Dettaglio Obiettivi'
    : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');

  // Build header→col index by name (header row = HEADER_ROW_IDX)
  const colByName: Record<string, number> = {};
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: HEADER_ROW_IDX, c });
    const cell = ws[addr];
    if (cell) colByName[String(cell.v)] = c;
  }

  function getCell(r: number, headerName: string): unknown {
    const c = colByName[headerName];
    if (c === undefined) return null;
    const addr = XLSX.utils.encode_cell({ r, c });
    return ws[addr]?.v ?? null;
  }

  function getMapped(r: number, placeholder: string): unknown {
    const headerName = fieldMappings[placeholder];
    if (!headerName) return null;
    return getCell(r, headerName);
  }

  // Group rows by beneficiary
  const grouped = new Map<string, { scalar: Record<string, unknown>; obiettivi: ObiettivRow[] }>();

  for (let r = HEADER_ROW_IDX + 1; r <= range.e.r; r++) {
    const benef = String(getMapped(r, 'nome_beneficiario') ?? '').trim();
    if (!benef) continue;

    // Normalize "Cognome Nome" → "Nome Cognome"
    const nameParts = benef.split(' ');
    const nomeNorm = nameParts.length >= 2
      ? nameParts.slice(1).join(' ') + ' ' + nameParts[0]
      : benef;

    if (!grouped.has(benef)) {
      grouped.set(benef, {
        scalar: {
          nome_beneficiario: nomeNorm,
          qualifica: String(getMapped(r, 'qualifica') ?? '').toUpperCase(),
          tipologia: String(getMapped(r, 'tipologia') ?? ''),
          premio_max: Number(getMapped(r, 'premio_max') ?? 0),
          area: String(getMapped(r, 'qualifica') ?? ''),
          direzione: String(getMapped(r, 'direzione') ?? getMapped(r, 'qualifica') ?? ''),
          indirizzo: String(getMapped(r, 'indirizzo') ?? ''),
          cap: String(getMapped(r, 'cap') ?? ''),
          citta_residenza: String(getMapped(r, 'citta_residenza') ?? ''),
          prov: String(getMapped(r, 'prov') ?? ''),
        },
        obiettivi: [],
      });
    }

    const entry = grouped.get(benef)!;
    entry.obiettivi.push({
      codice: String(getMapped(r, 'codice') ?? ''),
      indicatore: String(getMapped(r, 'indicatore') ?? ''),
      descrizione: String(getMapped(r, 'descrizione') ?? ''),
      peso: String(getMapped(r, 'peso') ?? ''),
      modalita_calcolo: String(getMapped(r, 'modalita_calcolo') ?? ''),
      target: String(getMapped(r, 'target') ?? ''),
      rendicontatore: String(getMapped(r, 'rendicontatore') ?? ''),
      note: String(getMapped(r, 'note') ?? ''),
      tipo_obiettivo: String(getMapped(r, 'tipo_obiettivo') ?? ''),
      idx: entry.obiettivi.length + 1,
    });
  }

  return Array.from(grouped.values()).map(({ scalar, obiettivi }) => ({
    ...(scalar as BeneficiaryRow),
    obiettivi,
  }));
}
