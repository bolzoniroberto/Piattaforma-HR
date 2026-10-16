import { italianNumberToWords, italianCurrencyFormat } from './italianNumberToWords';

export type CalculatedFieldFn = (row: Record<string, unknown>, params: Record<string, unknown>) => string;

function titolo(row: Record<string, unknown>): string {
  // SSoT: users.sesso (M/F). Fallback euristico solo se null.
  const sesso = String(row['sesso'] ?? '').toUpperCase();
  if (sesso === 'F') return 'Dottoressa';
  if (sesso === 'M') return 'Dottor';
  // Fallback euristico da primo nome (meno affidabile — impostare sesso in anagrafica)
  const nome = String(row['nome_beneficiario'] ?? row['nome'] ?? '').toLowerCase();
  const firstName = nome.split(' ')[0] ?? '';
  if (firstName.endsWith('a')) return 'Dottoressa';
  return 'Dottor';
}

export const calculatedFieldRegistry: Record<string, CalculatedFieldFn> = {
  data_oggi: () => new Date().toLocaleDateString('it-IT'),
  data_lunga: () => new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),

  titolo: (row) => titolo(row),

  saluto_formula: (row) => {
    const t = titolo(row);
    if (t === 'Dottoressa') return 'Dottoressa';
    return 'Dottore';
  },

  entry_gate_fmt: (_row, params) => {
    const n = Number(params['entry_gate'] ?? 0);
    return n ? italianCurrencyFormat(n) : '';  // value is already full number (e.g. 19770000)
  },

  premio_cifre: (row) => {
    const val = Number(row['premio_max'] ?? 0);
    return italianCurrencyFormat(val);
  },

  premio_lettere: (row) => {
    const val = Number(row['premio_max'] ?? 0);
    return italianNumberToWords(val);
  },

  qualifica: (row) => String(row['qualifica'] ?? row['area'] ?? '').toUpperCase(),

  isAD: (row) => {
    const tipologia = String(row['tipologia'] ?? '').toUpperCase();
    return tipologia === 'AD' ? 'true' : '';
  },
};

export function resolveCalculatedFields(
  row: Record<string, unknown>,
  params: Record<string, unknown>,
  fieldDefs: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [placeholder, fnName] of Object.entries(fieldDefs)) {
    const fn = calculatedFieldRegistry[fnName];
    if (fn) out[placeholder] = fn(row, params);
  }
  // Always resolve standard calculated fields
  for (const [key, fn] of Object.entries(calculatedFieldRegistry)) {
    if (!(key in out)) out[key] = fn(row, params);
  }
  return out;
}
