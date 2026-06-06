export const cambioMansioneTemplate = {
  name: 'Lettera di Cambio Mansione',
  letter_type: 'cambio_mansione',
  category: 'hr',
  field_mappings: {
    nome_completo: 'Nome Completo',
    qualifica: 'Qualifica attuale',
    job_title: 'Nuova Mansione',
    sede: 'Sede',
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
    { key: 'data_decorrenza', type: 'date', label: 'Data decorrenza variazione', default: '', required: true },
    { key: 'nuova_qualifica', type: 'text', label: 'Nuova qualifica/livello', default: '', required: false },
  ],
  body_content: `>>>{citta_mittente}, li {data_documento}


==={titolo}
==={nome_completo}
==={indirizzo}
==={cap}, {citta}


Gentile {saluto_formula},

con la presente La informiamo che, a decorrere dal **{data_decorrenza}**, la Sua posizione lavorativa subirà la seguente variazione:

**Nuova mansione:** {job_title}
**Qualifica:** {nuova_qualifica}
**Sede:** {sede}

La presente comunicazione costituisce parte integrante del Suo contratto di lavoro. La invitiamo a sottoscrivere per presa visione e accettazione.

Con i migliori saluti.

>>>{ruolo_firmatario}
>>>({firmatario})

[FIRMA]

**PER RICEVUTA E ACCETTAZIONE**
________________________
({nome_completo})`,
};
