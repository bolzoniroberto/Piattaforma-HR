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
}

const HEADER_ROW_IDX = 1; // 0-indexed = row 2

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

  const suggestedMappings: Record<string, string> = {
    nome_beneficiario: 'Beneficiario',
    qualifica: 'Area',
    tipologia: 'Tipologia Scheda',
    premio_max: 'Premio Max (€)',
    tipo_obiettivo: 'Tipo obiettivo',
    codice: 'Codice',
    indicatore: 'Indicatore',
    descrizione: 'Descrizione',
    peso: 'Peso',
    modalita_calcolo: 'Modalità di calcolo',
    target: 'Target',
    rendicontatore: 'Rendicontatore (Fonte)',
    note: 'Note',
  };

  return { sheets: wb.SheetNames, headers, rows, suggestedMappings };
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
