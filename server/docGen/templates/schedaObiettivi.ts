export const schedaObiettiviTemplate = {
  name: 'Scheda Obiettivi',
  letter_type: 'scheda_obiettivi',
  version: 1,

  field_mappings: {
    nome_beneficiario: 'Beneficiario',
    qualifica: 'Area',
    tipologia: 'Tipologia Scheda',
    premio_max: 'Premio Max (€)',
    direzione: 'Responsabile (Manager)',
    codice: 'Codice',
    indicatore: 'Indicatore',
    descrizione: 'Descrizione',
    peso: 'Peso',
    modalita_calcolo: 'Modalità di calcolo',
    target: 'Target',
    rendicontatore: 'Rendicontatore (Fonte)',
    note: 'Note',
    tipo_obiettivo: 'Tipo obiettivo',
  },

  calculated_fields: {
    premio_cifre: 'premio_cifre',
    entry_gate_fmt: 'entry_gate_fmt_calc',
  },

  parameters: [
    { key: 'anno_piano', type: 'text', label: 'Anno Piano MBO', default: '2026', required: true },
    { key: 'entry_gate', type: 'currency', label: 'Entry Gate EBITDA (€)', default: '19770000', required: true },
  ],

  body_content: `===ALLEGATO - SCHEDA OBIETTIVI - INDICATORI PERFORMANCE {anno_piano}

**Direzione:** {direzione}
**Area:** {qualifica}
**Titolare:** {nome_beneficiario}
**Bonus target [Euro]:** {premio_cifre} €

**PREREQUISITO** - Condizione necessaria per la consuntivazione degli obiettivi è il raggiungimento di un EBITDA, comprensivo di oneri e proventi straordinari, non inferiore a **{entry_gate_fmt}** Euro.

DETTAGLIO INDICATORI:

{#obiettivi}
**{idx}. {indicatore}**
▪ Tipo: {tipo_obiettivo}
▪ Target: {target}
▪ Modalità: {modalita_calcolo}
▪ Peso: {peso}
▪ Rendicontatore: {rendicontatore}
▪ Note: {note}

{/obiettivi}

NOTE - Il premio totale maturato è pari alla somma dei premi maturati per i singoli indicatori obiettivo.
(*) Curva con interpolazione lineare da 75% (con 50% Premio target) a 100% (con 100% Premio target=premio max).
(**) Curva con interpolazione lineare da 75% (con 50% Premio target) a 100% (con 100% Premio target) e da 100% a 120% (con 120% Premio target=premio max).`,
};
