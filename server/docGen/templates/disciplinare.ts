export const disciplinareTemplate = {
  name: 'Lettera Disciplinare',
  letter_type: 'disciplinare',
  category: 'hr',
  field_mappings: {
    nome_completo: 'Nome Completo',
    qualifica: 'Qualifica',
    codice_fiscale: 'Codice Fiscale',
    indirizzo: 'Indirizzo',
    cap: 'CAP',
    citta: 'Città',
  },
  calculated_fields: {
    titolo: 'titolo',
    saluto_formula: 'saluto_formula',
  },
  parameters: [
    { key: 'data_documento', type: 'date', label: 'Data documento', default: '', required: true },
    { key: 'citta_mittente', type: 'text', label: 'Città mittente', default: 'Milano', required: true },
    { key: 'firmatario', type: 'text', label: 'Firmatario', default: '', required: true },
    { key: 'ruolo_firmatario', type: 'text', label: 'Ruolo firmatario', default: 'Responsabile Risorse Umane', required: false },
    { key: 'data_contestazione', type: 'date', label: 'Data dei fatti contestati', default: '', required: true },
    { key: 'descrizione_fatti', type: 'text', label: 'Descrizione dei fatti', default: '', required: true },
    { key: 'sanzione', type: 'text', label: 'Sanzione applicata', default: 'richiamo scritto', required: true },
  ],
  body_content: `>>>{citta_mittente}, li {data_documento}


==={titolo}
==={nome_completo}
==={indirizzo}
==={cap}, {citta}


Oggetto: Provvedimento disciplinare

Gentile {saluto_formula},

con la presente Le contestiamo il seguente comportamento tenuto in data **{data_contestazione}**:

{descrizione_fatti}

Tale comportamento risulta in contrasto con le norme disciplinari aziendali e con le disposizioni del CCNL applicato al Suo rapporto di lavoro.

Alla luce di quanto sopra esposto, Le comunichiamo l'irrogazione della seguente sanzione disciplinare: **{sanzione}**.

Ai sensi dell'art. 7 dello Statuto dei Lavoratori, Lei ha il diritto di presentare le Sue giustificazioni entro 5 giorni dalla ricezione della presente.

Con i migliori saluti.

>>>{ruolo_firmatario}
>>>({firmatario})

[FIRMA]`,
};
