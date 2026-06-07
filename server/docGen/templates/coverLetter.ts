export const coverLetterTemplate = {
  name: 'Cover Letter',
  letter_type: 'cover_letter',
  version: 1,

  field_mappings: {
    nome_beneficiario: 'Beneficiario',
    qualifica: 'Area',
    tipologia: 'Tipologia Scheda',
    indirizzo: 'Indirizzo',
    cap: 'CAP',
    citta_residenza: 'Città',
    prov: 'Provincia',
  },

  calculated_fields: {
    titolo: 'titolo',
    saluto_formula: 'saluto_formula',
    isAD: 'isAD',
  },

  parameters: [
    { key: 'data_documento', type: 'date', label: 'Data documento', default: '', required: true },
    { key: 'citta', type: 'text', label: 'Città mittente', default: 'Milano', required: true },
    { key: 'anno_piano', type: 'text', label: 'Anno Piano MBO', default: '2026', required: true },
    { key: 'firmatario_default', type: 'text', label: 'Firmatario (AD)', default: 'Federico Silvestri', required: true },
    { key: 'firmatario_ad_label', type: 'text', label: 'Label firmatario AD', default: 'La Presidente', required: false },
  ],

  body_content: `>>>{citta}, li {data_documento}


==={titolo}
==={nome_beneficiario}
==={indirizzo}
==={cap}, {citta_residenza} ({prov})


Gentile {saluto_formula},

ho il piacere di comunicare la Sua partecipazione al Piano MBO per l'anno {anno_piano} in qualità di **{qualifica}**.

In allegato Le consegniamo il "Regolamento aziendale – MBO {anno_piano}" e la "Scheda Obiettivi" che preghiamo di volerci restituire al più presto, da Lei sottoscritti per visione, piena comprensione e accettazione a conferma della ricezione degli stessi e della Sua partecipazione al "Piano MBO {anno_piano}", pena la decadenza da qualsiasi diritto di partecipazione al Piano stesso.

Con i migliori saluti.

{#isAD}
>>>**{firmatario_ad_label}**
{/isAD}
{^isAD}
>>>L'Amministratore Delegato
>>>({firmatario_default})
{/isAD}

>>>**La Società**

**Allegati:**
- REGOLAMENTO AZIENDALE – PIANO MBO {anno_piano}
- SCHEDA OBIETTIVI


**PER RICEVUTA**
________________________
({nome_beneficiario})`,
};
