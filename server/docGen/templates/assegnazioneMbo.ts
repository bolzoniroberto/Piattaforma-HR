export const assegnazioneMboTemplate = {
  name: 'Lettera di Assegnazione MBO',
  letter_type: 'assegnazione_mbo',
  version: 1,

  field_mappings: {
    nome_beneficiario: 'Beneficiario',
    qualifica: 'Area',
    tipologia: 'Tipologia Scheda',
    premio_max: 'Premio Max (€)',
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
    titolo: 'titolo',
    premio_cifre: 'premio_cifre',
    premio_lettere: 'premio_lettere',
    qualifica_upper: 'qualifica',
    isAD: 'isAD',
  },

  parameters: [
    { key: 'data_documento', type: 'date', label: 'Data documento', default: '', required: true },
    { key: 'citta', type: 'text', label: 'Città', default: 'Milano', required: true },
    { key: 'anno_piano', type: 'text', label: 'Anno Piano MBO', default: '2026', required: true },
    { key: 'anno_bilancio', type: 'text', label: 'Anno Bilancio', default: '2026', required: true },
    { key: 'mese_approvazione', type: 'text', label: 'Mese approvazione bilancio', default: 'marzo 2027', required: true },
    { key: 'entry_gate', type: 'currency', label: "Entry Gate EBITDA (€)", default: '19770000', required: true },
    { key: 'firmatario_default', type: 'text', label: 'Firmatario (AD)', default: 'Federico Silvestri', required: true },
    { key: 'firmatario_ad_label', type: 'text', label: 'Label firmatario AD', default: 'La Presidente', required: false },
  ],

  body_content: `"SCHEDA OBIETTIVI"
Ai sensi del Regolamento "Piano MBO {anno_piano}" del Gruppo 24 ORE"

Gentile {titolo} {nome_beneficiario} (il "Beneficiario"),

codice fiscale {codice_fiscale}, in qualità di {qualifica}, con la sottoscrizione della presente Scheda Obiettivi Lei:

Dichiara di aver ricevuto, preso visione e ben compreso il "Regolamento del Piano MBO {anno_piano}" (il "Regolamento") del Gruppo 24 ORE (il "Gruppo") e di cui questa lettera di partecipazione (la "Scheda Obiettivi") costituisce parte integrante e sostanziale.

Dichiara che con la sottoscrizione della presente Scheda Obiettivi, il Regolamento si intende qui integralmente richiamato (anche nelle definizioni convenzionali di termini ed espressioni) e accettato, impegnandosi a rispettarne tutte le condizioni ed i termini.

Dichiara di conoscere aver letto e ben compreso, nonché accettare

▪ le finalità perseguite dal piano per il {anno_piano} (il "Piano MBO" o "Piano MBO {anno_piano}") volto ad incentivare il raggiungimento degli obiettivi annuali fissati da Il Sole 24 Ore S.p.A. (la "Società" o il "Sole 24 Ore") e, in linea con il piano industriale per l'anno di riferimento, a premiare, a seconda della figura beneficiaria, le performance annuali del Gruppo 24 ORE, della Società e/o della funzione di appartenenza. In particolare, il Piano MBO {anno_piano} mira a consolidare una condivisione strategica tra la Società e i Key People della medesima, in una prospettiva di sempre maggiore coinvolgimento, consapevolezza e coordinamento, oltre, naturalmente, che di incentivazione e fidelizzazione;

▪ che il Piano MBO ha durata annuale e termina con l'approvazione del Bilancio di esercizio {anno_piano} (il "Termine Piano"). Il Piano MBO prevede unicamente erogazioni monetarie (cash);

▪ che il valore massimo del Bonus Target individuato a favore del Beneficiario e connesso alla posizione di "{qualifica}" è pari a {premio_cifre} ({premio_lettere}) euro lordi;

▪ che la possibilità di erogazione del Bonus Target sia inter alia (i) funzione del superamento degli obiettivi fissati a livello di Società ("Entry Gate"); (ii) del raggiungimento del 100% Obiettivi Individuali (gli "Obiettivi Individuali") assegnati tramite la presente Scheda Obiettivi e (iii) della sussistenza di un rapporto di lavoro (il "Rapporto") per tale intendendosi ogni rapporto di amministrazione, di lavoro, di collaborazione ovvero di consulenza, tra la Società ovvero una Società del Gruppo 24 ORE e il Beneficiario (le "Condizioni di Eligibilità"). Il Bonus Target si riferisce all'anno solare corrispondente all'esercizio di riferimento del MBO, fatti salvi attribuzione pro-quota e pro-rata temporis come infra individuati;

▪ che nel caso di raggiungimento parziale degli Obiettivi Individuali, specificatamente indicati nell'allegata Scheda Obiettivi – Indicatori di performance {anno_piano}, – fatte salve le ulteriori condizioni precedentemente richiamate – il sistema premiante non potrà essere attivato per risultati inferiori al 75% degli stessi (la "Soglia"). Per risultati tra 75% e 100% il sistema premiante potrà essere attivato pro-quota, per interpolazione lineare;

▪ che la Società si riserva di attivare nei confronti dei Beneficiari le iniziative volte a ridurre fino ad azzerare l'assegnazione del Premio ("Correzioni ex post" o "Clausole di Malus" e/o "Clausole di Claw-back") nei casi e per le ragioni determinate ai sensi del Regolamento. Le Correzioni ex-post operano sulla componente variabile della remunerazione in maturazione, ovvero su ogni erogazione connessa al raggiungimento in tutto o parte degli Obiettivi individuati dal Regolamento (il "Premio"). Più in specifico, le Clausole di Malus intervengono sulla componente del Premio non ancora erogata, mentre le Clausole di Claw-back prevedono alle circostanze di cui al Regolamento, la possibilità per la Società di chiedere al Beneficiario, che vi è obbligato, la restituzione del Premio nella misura già erogata e anche ove sia già entrato nelle disponibilità finanziarie del Beneficiario medesimo;

▪ che gli importi maturati non sono di per sé utili ai fini del calcolo di alcun istituto legale e contrattuale, diretto e indiretto, compreso il Trattamento di Fine Rapporto;

▪ che (i) nessuna disposizione del richiamato Regolamento attribuisce al Beneficiario alcun diritto od aspettativa alla prosecuzione del Rapporto ovvero a limitare, ridurre o pregiudicare in alcun modo il diritto della Società – salvo quanto diversamente previsto nella contrattazione individuale – di cessare il Rapporto con il Beneficiario o di modificarne la retribuzione ovvero qualsiasi altra condizione, e (ii) l'approvazione del Piano MBO e del Regolamento, non conferisce al Beneficiario alcun diritto od aspettativa in merito all'assegnazione di ulteriori assegnazioni ai sensi di piani di incentivazione che dovessero essere approvati negli anni successivi;

▪ che a seguito dell'approvazione del Bilancio {anno_bilancio} gli eventuali premi maturati (il "Bonus Maturato"), quale raggiungimento in tutto o in parte degli Obiettivi Individuali e previo superamento degli Entry Gate individuati, potranno essere erogati a favore dei Beneficiari, fatta salva la sussistenza delle Condizioni di Eligibilità;

▪ che la mancata adesione alla Scheda Obiettivi nei termini definiti ed entro 20 giorni lavorativi dalla data di consegna comporterà la decadenza da qualsiasi diritto di partecipazione al Piano MBO {anno_piano}, nonché di essere informato e di accettare che, qualora questa Scheda Obiettivi risultasse incompleta in quanto non debitamente compilata o sottoscritta in tutte le sue parti, la stessa sarà priva di efficacia anche ai sensi dell'art. 1326, 4° comma, Codice Civile.

Conferma in particolare di aver letto e ben compreso e accettare i termini del Regolamento e – inter alia – relativamente a (i) definizione, modalità di assegnazione ed erogazione del sistema premiante MBO {anno_piano}; (ii) individuazione dei Beneficiari; (iii) Entry Gate; (iv) Obiettivi Individuali; (v) Condizioni di Eligibilità; (iv) Cambio di mansione/posizione; (v) Clausole di Malus e Claw Back; (vi) Ruolo del Consiglio di Amministrazione.

Prende atto dei termini e delle modalità di partecipazione di seguito richiamati, rimandando per la disciplina integrale al Regolamento:

▪ L'Entry Gate, al mancato superamento del quale non potrà essere attivato il sistema premiante connesso al Piano MBO {anno_piano}, è rappresentato da un livello di EBITDA (Earning Before Interests, Taxes, Depreciation and Amortization) di Gruppo, comprensivo di oneri e proventi straordinari, non inferiore al valore di {entry_gate_fmt} Eu;

▪ il Bonus Target o il "Massimale" che potrà essere erogato a favore del sottoscritto Beneficiario – fatta salva la verificazione delle condizioni complessivamente richiamate dal Regolamento – è pari a {premio_cifre} ({premio_lettere}) euro lordi;

▪ gli Obiettivi Individuali, aventi natura quali-quantitativa, sono individuati per l'anno {anno_piano} nell'allegata Scheda Obiettivi – Indicatori di performance {anno_piano};

▪ la Data di Assegnazione equivale alla data posta in calce alla presente Scheda Obiettivi;

▪ le Condizioni di Eligibilità dovranno essere verificate alla data di materiale erogazione del Bonus Maturato;

▪ il Termine del Piano MBO è individuato con l'approvazione del Bilancio dell'esercizio {anno_piano} da parte dell'Assemblea dei Soci;

▪ il Bonus Maturato verrà erogato entro il mese successivo all'approvazione del Bilancio dell'esercizio da parte dell'Assemblea dei Soci, fatta salva la verificazione delle Condizioni di Eligibilità previste dal Regolamento;

▪ Nei casi di cambio di mansione/posizione si intendono qui richiamate le previsioni di cui all'articolo 5 del Regolamento.

Tutto ciò premesso, Le confermiamo l'adesione al Piano MBO {anno_piano}, nonché l'individuazione del Bonus Target in {premio_cifre} ({premio_lettere}) euro lordi.

Per ricevuta di questa Scheda Obiettivi e conferma della partecipazione Piano MBO {anno_piano} nonché accettazione irrevocabile quale condizione essenziale delle condizioni previste, La preghiamo di volerci restituire copia firmata di accettazione della presente Scheda Obiettivi, e relativa Scheda Obiettivi – Indicatori di performance {anno_piano}, unitamente all'allegato Regolamento.

>>{citta}, li {data_documento}

{#isAD}
>>>{firmatario_ad_label}
{/isAD}
{^isAD}
>>>L'Amministratore Delegato
>>>({firmatario_default})
{/isAD}

>>>**La Società**


Il Beneficiario **{nome_beneficiario}** dichiara espressamente di aver ricevuto e di approvare specificamente per iscritto e integralmente la Scheda Obiettivi e conferma la partecipazione al **"Piano MBO {anno_piano}"**.

{citta}, li ____________________

>>>{nome_beneficiario}
>>>_____________________________
>>>**Il Beneficiario**`,
};
