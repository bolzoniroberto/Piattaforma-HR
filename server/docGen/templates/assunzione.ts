export const assunzioneTemplate = {
  name: 'Lettera di Assunzione',
  letter_type: 'assunzione',
  category: 'hr',
  field_mappings: {
    nome_completo: 'Nome Completo',
    qualifica: 'Qualifica',
    job_title: 'Mansione',
    data_assunzione: 'Data Assunzione',
    sede: 'Sede',
    ccnl: 'CCNL',
    livello: 'Livello',
    indirizzo: 'Indirizzo',
    cap: 'CAP',
    citta: 'Città',
    codice_fiscale: 'Codice Fiscale',
  },
  calculated_fields: {
    titolo: 'titolo',
    saluto_formula: 'saluto_formula',
    data_lunga: 'data_lunga',
  },
  parameters: [
    { key: 'data_documento', type: 'date', label: 'Data documento', default: '', required: true },
    { key: 'citta_mittente', type: 'text', label: 'Città mittente', default: 'Milano', required: true },
    { key: 'firmatario', type: 'text', label: 'Firmatario', default: '', required: true },
    { key: 'ruolo_firmatario', type: 'text', label: 'Ruolo firmatario', default: 'Responsabile Risorse Umane', required: false },
    { key: 'data_inizio', type: 'date', label: 'Data inizio rapporto', default: '', required: true },
  ],
  body_content: `>>>{citta_mittente}, li {data_documento}


==={titolo}
==={nome_completo}
==={indirizzo}
==={cap}, {citta}


Gentile {saluto_formula},

siamo lieti di comunicarLe che, a partire dal **{data_inizio}**, Lei è assunta/o alle dipendenze della società con le seguenti condizioni:

**Mansione:** {job_title}
**Qualifica:** {qualifica}
**Livello contrattuale:** {livello} – {ccnl}
**Sede di lavoro:** {sede}
**Codice fiscale:** {codice_fiscale}

Il trattamento economico e normativo applicato è quello previsto dal Contratto Collettivo Nazionale di Lavoro di riferimento e dalle norme aziendali vigenti.

Prende atto e accetta le condizioni sopra indicate, dichiarando di aver ricevuto copia del presente documento.

Con i migliori saluti.

>>>{ruolo_firmatario}
>>>({firmatario})

[FIRMA]

**PER RICEVUTA E ACCETTAZIONE**
________________________
({nome_completo})`,
};
