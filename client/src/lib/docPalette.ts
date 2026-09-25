export interface PaletteField {
  key: string;
  label: string;
  calc?: boolean;
  isLiteral?: boolean;
  isLoop?: boolean;
  loopOnly?: boolean;
  isBlock?: boolean;
  open?: string;
  close?: string;
  counter?: string;
}

export interface PaletteGroup {
  id: string;
  label: string;
  color: string;
  isBlock?: boolean;
  fields: PaletteField[];
}

export const MBO_PALETTE_GROUPS: PaletteGroup[] = [
  {
    id: 'beneficiario', label: 'Beneficiario', color: 'bg-blue-100 text-blue-800 border-blue-200',
    fields: [
      { key: 'titolo', label: 'Titolo (Dottor/Dottoressa)', calc: true },
      { key: 'saluto_formula', label: 'Saluto (Dottore/Dottoressa)', calc: true },
      { key: 'nome_beneficiario', label: 'Nome completo' },
      { key: 'sesso', label: 'Sesso (M/F) — SSoT per titolo' },
      { key: 'qualifica', label: 'Qualifica / Area' },
      { key: 'tipologia', label: 'Tipologia scheda (AD, DIRS…)' },
      { key: 'premio_cifre', label: 'Premio in cifre (25.400)', calc: true },
      { key: 'premio_lettere', label: 'Premio in lettere', calc: true },
      { key: 'premio_max', label: 'Premio max (numero grezzo)' },
      { key: 'codice_fiscale', label: 'Codice fiscale' },
      { key: 'indirizzo', label: 'Indirizzo' },
      { key: 'cap', label: 'CAP' },
      { key: 'citta_residenza', label: 'Città residenza' },
      { key: 'prov', label: 'Provincia' },
      { key: 'direzione', label: 'Direzione' },
    ],
  },
  {
    id: 'documento', label: 'Parametri documento', color: 'bg-green-100 text-green-800 border-green-200',
    fields: [
      { key: 'citta', label: 'Città (es. Milano)' },
      { key: 'data_documento', label: 'Data documento' },
      { key: 'anno_piano', label: 'Anno piano MBO' },
      { key: 'anno_bilancio', label: 'Anno bilancio' },
      { key: 'mese_approvazione', label: 'Mese approvazione bilancio' },
      { key: 'entry_gate_fmt', label: 'Entry Gate formattato (es. 19.770.000)', calc: true },
      { key: 'firmatario_default', label: 'Nome firmatario AD' },
      { key: 'firmatario_ad_label', label: 'Label firmatario AD' },
      { key: '[FIRMA]', label: 'Immagine firma (PNG)', isLiteral: true },
    ],
  },
  {
    id: 'condizionali', label: 'Condizionali', color: 'bg-purple-100 text-purple-800 border-purple-200',
    isBlock: true,
    fields: [
      { key: 'isAD', label: 'Se è l\'AD', open: '#isAD', close: '/isAD', counter: '^isAD' },
      { key: 'notAD', label: 'Se NON è l\'AD', open: '^isAD', close: '/isAD' },
    ],
  },
  {
    id: 'obiettivi', label: 'Obiettivi (loop)', color: 'bg-amber-100 text-amber-800 border-amber-200',
    fields: [
      { key: 'obiettivi', label: 'Loop obiettivi', isLoop: true, open: '#obiettivi', close: '/obiettivi' },
      { key: 'idx', label: 'Numero obiettivo (1, 2, 3…)', loopOnly: true },
      { key: 'codice', label: 'Codice (A1, B2…)', loopOnly: true },
      { key: 'indicatore', label: 'Indicatore', loopOnly: true },
      { key: 'descrizione', label: 'Descrizione', loopOnly: true },
      { key: 'target', label: 'Target', loopOnly: true },
      { key: 'peso', label: 'Peso %', loopOnly: true },
      { key: 'modalita_calcolo', label: 'Modalità di calcolo', loopOnly: true },
      { key: 'tipo_obiettivo', label: 'Tipo obiettivo', loopOnly: true },
      { key: 'rendicontatore', label: 'Rendicontatore (fonte)', loopOnly: true },
      { key: 'note', label: 'Note', loopOnly: true },
    ],
  },
];

export const ALL_MBO_KEYS = new Set([
  ...MBO_PALETTE_GROUPS.flatMap(g => g.fields.map(f => f.key)),
  'obiettivi', 'qualifica_upper',
]);
