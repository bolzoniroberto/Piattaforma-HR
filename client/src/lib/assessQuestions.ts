// Auto-generated from AIskillTest v2.3.0
// Source: https://github.com/gloutchov/AIskillTest

export type QuestionType = 'likert' | 'scenario' | 'knowledge' | 'multi' | 'text' | 'choice';
export type DimensionType = 'literacy' | 'fluency' | 'mindset';
export type SubDimension = 'literacy' | 'technical' | 'delegation' | 'description' | 'discernment' | 'diligence' | 'mindset' | 'agents';

export interface AssessOption {
  score: number;
  title: string;
  text: string;
}

export interface RubricCriterion {
  label: string;
  points: number;
  keywords: string[];
}

export interface AssessRubric {
  criteria: RubricCriterion[];
  redFlags: RubricCriterion[];
}

export interface AssessQuestion {
  id: string;
  sourceId?: string;
  formId?: string;
  section: string;
  dimension: DimensionType;
  sub?: SubDimension;
  type: QuestionType;
  text: string;
  hint?: string;
  options?: AssessOption[];
  feedback?: string;
  rubric?: AssessRubric;
  trap?: boolean;
  minSelected?: number;
  minChars?: number;
  proceedChars?: number;
}

export interface LikertOption {
  value: number;
  score: number;
  title: string;
  text: string;
}

export const LIKERT_OPTIONS: LikertOption[] = [
  {
    "value": 1,
    "score": 1,
    "title": "Non riconosco questo comportamento nel mio modo di lavorare",
    "text": "Non saprei applicarlo senza guida oppure non lo considero parte del mio approccio."
  },
  {
    "value": 2,
    "score": 2,
    "title": "Lo riconosco soprattutto quando seguo un supporto esterno",
    "text": "Riesco a procedere usando esempi, template o indicazioni già predisposte."
  },
  {
    "value": 3,
    "score": 3,
    "title": "Lo applico autonomamente nei casi ordinari",
    "text": "Riesco a farlo, ma il metodo non è sempre stabile, esplicito o trasferibile."
  },
  {
    "value": 4,
    "score": 4,
    "title": "Fa parte del mio metodo di lavoro",
    "text": "Lo applico con criteri, controlli e passaggi ripetibili."
  },
  {
    "value": 5,
    "score": 5,
    "title": "Lo traduco in una pratica riutilizzabile e condivisibile",
    "text": "Ne valuto gli esiti, definisco standard e so supportare altre persone nell’applicazione."
  }
];

export const BASE_QUESTIONS: AssessQuestion[] = [
  {
    "id": "L1",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "likert",
    "text": "So spiegare in parole semplici come un modello linguistico genera una risposta e perché può sbagliare.",
    "hint": "Non serve una spiegazione tecnica da ricercatore: conta la capacità di capire il principio e i limiti generali."
  },
  {
    "id": "L2",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "likert",
    "text": "Distinguo tra dati di addestramento, contesto della conversazione, documenti caricati, memoria e fonti esterne.",
    "hint": "Questa distinzione è importante perché influenza affidabilità, aggiornamento e verificabilità dell’output."
  },
  {
    "id": "L3",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "likert",
    "text": "Conosco il concetto di allucinazione e uso controlli prima di assumere che un output sia corretto.",
    "hint": "Una risposta plausibile non è automaticamente una risposta verificata."
  },
  {
    "id": "L4",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "likert",
    "text": "Capisco quando servono ricerca web, RAG, basi documentali o fonti aziendali rispetto alla sola chat con un modello.",
    "hint": "La domanda misura se sai scegliere il modo corretto di dare contesto allo strumento."
  },
  {
    "id": "L5",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "likert",
    "text": "Conosco le implicazioni base di privacy, proprietà intellettuale e dati riservati nell’uso di strumenti AI.",
    "hint": "Conta la consapevolezza del rischio, anche se non sei una figura legale o compliance."
  },
  {
    "id": "L6",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "scenario",
    "text": "Devi preparare una sintesi su un tema normativo che potrebbe essere cambiato negli ultimi mesi. Quale comportamento scegli?",
    "hint": "Scenario situazionale: scegli l’approccio più vicino a ciò che faresti davvero.",
    "options": [
      {
        "score": 1,
        "title": "Uso il primo output del chatbot",
        "text": "Se il testo è scritto bene, lo considero sufficiente."
      },
      {
        "score": 2,
        "title": "Chiedo al chatbot di essere sicuro",
        "text": "Mi affido alla sua conferma senza controlli esterni."
      },
      {
        "score": 3,
        "title": "Chiedo una sintesi e controllo qualche punto",
        "text": "Verifico solo le parti che mi sembrano dubbie."
      },
      {
        "score": 4,
        "title": "Uso fonti aggiornate e poi chiedo una sintesi",
        "text": "Parto da fonti affidabili, controllo date e riferimenti."
      },
      {
        "score": 5,
        "title": "Creo un flusso con fonti, citazioni e verifica",
        "text": "Separando ricerca, sintesi, controllo e revisione finale."
      }
    ],
    "feedback": "Per temi aggiornabili o ad alto impatto, la competenza non è solo generare il testo: è governare fonti, data di aggiornamento e verifica."
  },
  {
    "id": "L7",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "scenario",
    "text": "Hai un set di documenti aziendali da interrogare con l’AI. Cosa valuti prima di iniziare?",
    "hint": "La risposta più matura combina utilità, accesso ai dati, sicurezza e tracciabilità.",
    "options": [
      {
        "score": 1,
        "title": "Carico tutto nello strumento più comodo",
        "text": "L’importante è ottenere rapidamente una risposta."
      },
      {
        "score": 2,
        "title": "Carico solo i documenti più piccoli",
        "text": "Mi preoccupo soprattutto del limite tecnico di caricamento."
      },
      {
        "score": 3,
        "title": "Tolgo qualche dato sensibile",
        "text": "Anonimizzo in parte, ma senza verificare policy o strumento."
      },
      {
        "score": 4,
        "title": "Verifico policy, accessi e finalità",
        "text": "Uso strumenti approvati e documento il perimetro dei dati."
      },
      {
        "score": 5,
        "title": "Progetto un flusso controllato",
        "text": "Con dati minimizzati, fonti citabili, logica RAG o repository autorizzato."
      }
    ],
    "feedback": "La conoscenza AI include il perimetro di dati e governance, non solo la qualità della risposta prodotta."
  },
  {
    "id": "T1",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Nel contesto di un LLM, che cos’è un token?",
    "hint": "Scegli la definizione tecnicamente più corretta. Le alternative sono presentate in ordine casuale.",
    "options": [
      {
        "score": 2,
        "title": "È sempre una parola completa",
        "text": "Ogni parola corrisponde esattamente a un token, indipendentemente dalla lingua e dalla punteggiatura."
      },
      {
        "score": 5,
        "title": "È un’unità prodotta dal tokenizer",
        "text": "Può corrispondere a una parola, a una parte di parola, a un segno di punteggiatura o ad altri frammenti di testo."
      },
      {
        "score": 1,
        "title": "È un parametro interno della rete",
        "text": "Indica uno dei valori numerici appresi durante l’addestramento."
      },
      {
        "score": 2,
        "title": "È sempre un singolo carattere",
        "text": "Ogni lettera, spazio o simbolo viene trattato necessariamente come un token separato."
      }
    ],
    "feedback": "Un token è l’unità discreta con cui il testo viene rappresentato dal tokenizer. Non coincide necessariamente con una parola o con un singolo carattere."
  },
  {
    "id": "T2",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Come viene normalmente generata una risposta da un LLM autoregressivo?",
    "hint": "La domanda riguarda il meccanismo generale di generazione, non l’interfaccia del chatbot.",
    "options": [
      {
        "score": 1,
        "title": "Consulta automaticamente il web per ogni frase",
        "text": "Cerca la risposta più aggiornata e poi la riscrive."
      },
      {
        "score": 5,
        "title": "Stima il token successivo e ripete il processo",
        "text": "Calcola una distribuzione di probabilità sui possibili token successivi, ne seleziona uno e continua usando anche quanto appena generato."
      },
      {
        "score": 2,
        "title": "Recupera una frase già memorizzata",
        "text": "Trova nel dataset di addestramento la frase più simile e la restituisce quasi invariata."
      },
      {
        "score": 1,
        "title": "Compone l’intera risposta in un solo passaggio",
        "text": "Prima comprende completamente la domanda, poi scrive tutto il testo simultaneamente."
      }
    ],
    "feedback": "Un LLM autoregressivo genera la risposta un token alla volta, condizionando ogni passaggio sul contesto disponibile e sui token già prodotti."
  },
  {
    "id": "T3",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Qual è la differenza essenziale tra addestramento e inferenza?",
    "hint": "Pensa a ciò che accade ai parametri del modello nelle due fasi.",
    "options": [
      {
        "score": 1,
        "title": "Durante entrambe le fasi i parametri cambiano continuamente",
        "text": "Ogni conversazione riscrive automaticamente il modello di base."
      },
      {
        "score": 5,
        "title": "L’addestramento modifica i parametri; l’inferenza li usa",
        "text": "Durante l’addestramento i parametri vengono ottimizzati sui dati; durante l’uso ordinario il modello applica i parametri appresi al contesto ricevuto."
      },
      {
        "score": 1,
        "title": "L’inferenza serve a verificare la verità delle risposte",
        "text": "È la fase in cui il sistema confronta automaticamente ogni affermazione con fonti attendibili."
      },
      {
        "score": 2,
        "title": "L’addestramento riguarda solo la velocità",
        "text": "Serve principalmente a rendere il modello più rapido, mentre l’inferenza gli insegna nuovi concetti."
      }
    ],
    "feedback": "Nell’addestramento si ottimizzano i parametri del modello; nell’inferenza quei parametri vengono usati per calcolare una previsione o generare un output."
  },
  {
    "id": "T4",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Quando fornisci un documento a un LLM durante una normale sessione, quale affermazione è più corretta in generale?",
    "hint": "La gestione concreta dei dati dipende sempre dal servizio e dalle sue policy, ma il principio tecnico resta distinguibile.",
    "options": [
      {
        "score": 1,
        "title": "Il documento entra automaticamente nei pesi del modello",
        "text": "Il modello viene riaddestrato in tempo reale e conserverà stabilmente quelle informazioni."
      },
      {
        "score": 5,
        "title": "Il documento viene usato come input o contesto della sessione",
        "text": "Di norma non riaddestra da solo il modello di base; conservazione e uso dei dati dipendono però dalle condizioni del servizio."
      },
      {
        "score": 1,
        "title": "Il documento non lascia mai il dispositivo",
        "text": "Qualunque strumento AI elabora sempre il file soltanto in locale."
      },
      {
        "score": 2,
        "title": "Il documento diventa una fonte verificata",
        "text": "Una volta caricato, ogni sua affermazione viene considerata automaticamente corretta dal sistema."
      }
    ],
    "feedback": "Contesto della sessione, conservazione del servizio e addestramento del modello sono concetti diversi. Le policy del fornitore vanno comunque verificate."
  },
  {
    "id": "T5",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Che cosa indica la finestra di contesto di un LLM?",
    "hint": "Considera prompt, conversazione, documenti e output generato.",
    "options": [
      {
        "score": 2,
        "title": "La quantità totale di dati usata per addestrare il modello",
        "text": "Misura la dimensione del dataset storico da cui il modello ha appreso."
      },
      {
        "score": 1,
        "title": "Una memoria permanente di tutte le conversazioni",
        "text": "Tutto ciò che è stato detto in passato resta sempre disponibile al modello."
      },
      {
        "score": 5,
        "title": "La capacità di token gestibile in una singola elaborazione",
        "text": "Comprende il contesto fornito e lo spazio necessario all’output; ciò che eccede può essere escluso, troncato o gestito con altre strategie."
      },
      {
        "score": 1,
        "title": "Il numero massimo di utenti simultanei",
        "text": "Indica quante persone possono interrogare il modello nello stesso momento."
      }
    ],
    "feedback": "La finestra di contesto è un limite di capacità espresso in token per l’elaborazione corrente, non una memoria illimitata o permanente."
  },
  {
    "id": "T6",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Quale descrizione rappresenta meglio una rete neurale artificiale?",
    "hint": "La domanda richiede un’intuizione corretta, non una definizione matematica completa.",
    "options": [
      {
        "score": 2,
        "title": "È una copia digitale fedele del cervello umano",
        "text": "Riproduce neuroni biologici e coscienza con lo stesso funzionamento del cervello."
      },
      {
        "score": 5,
        "title": "È un insieme di trasformazioni numeriche con parametri appresi",
        "text": "Nodi e strati combinano input attraverso pesi e funzioni, adattati durante l’addestramento per riconoscere relazioni nei dati."
      },
      {
        "score": 1,
        "title": "È un archivio ordinato di frasi e risposte",
        "text": "Conserva testi completi e li recupera quando riconosce una domanda simile."
      },
      {
        "score": 2,
        "title": "È un programma composto soltanto da regole esplicite",
        "text": "Ogni risposta deriva da istruzioni if/then scritte manualmente dagli sviluppatori."
      }
    ],
    "feedback": "Una rete neurale è un modello parametrico composto da trasformazioni numeriche organizzate in strati. L’analogia biologica è solo parziale."
  },
  {
    "id": "T7",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Nel Transformer, a che cosa serve in termini generali il meccanismo di attention?",
    "hint": "Non confondere l’attention matematica con attenzione, intenzione o coscienza umana.",
    "options": [
      {
        "score": 1,
        "title": "Verifica automaticamente l’affidabilità delle fonti",
        "text": "Attribuisce più peso alle fonti vere e scarta quelle non attendibili."
      },
      {
        "score": 5,
        "title": "Pesa le relazioni tra le rappresentazioni dei token",
        "text": "Permette al modello di combinare informazioni del contesto attribuendo rilevanza diversa alle varie posizioni."
      },
      {
        "score": 1,
        "title": "Conferisce al modello consapevolezza del significato",
        "text": "Trasforma il calcolo statistico in comprensione cosciente del testo."
      },
      {
        "score": 2,
        "title": "Conta soltanto la frequenza delle parole",
        "text": "Sceglie i termini più ripetuti e costruisce la risposta attorno a essi."
      }
    ],
    "feedback": "L’attention calcola pesi tra rappresentazioni del contesto. È un meccanismo matematico e non implica coscienza né controllo della verità."
  },
  {
    "id": "T8",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Cos’è un’allucinazione di un LLM?",
    "hint": "Scegli la definizione più corretta.",
    "options": [
      {
        "score": 5,
        "title": "Un contenuto plausibile ma falso, inventato o non supportato",
        "text": "Il modello produce un’affermazione linguisticamente convincente che non è fondata su informazioni affidabili o sul contesto disponibile."
      },
      {
        "score": 2,
        "title": "Qualunque risposta creativa o originale",
        "text": "Creatività e allucinazione non coincidono: un contenuto creativo può essere coerente con la richiesta."
      },
      {
        "score": 1,
        "title": "Un blocco tecnico che interrompe il programma",
        "text": "Il termine non indica un crash o un arresto dell’applicazione."
      },
      {
        "score": 1,
        "title": "Una menzogna intenzionale del modello",
        "text": "L’LLM non sceglie consapevolmente di ingannare né possiede intenzioni umane."
      }
    ],
    "feedback": "Un’allucinazione è un output plausibile ma falso, inventato o non adeguatamente supportato. La fluidità del testo non costituisce una verifica fattuale."
  },
  {
    "id": "T9",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Che cosa descrive meglio un sistema RAG?",
    "hint": "RAG significa Retrieval-Augmented Generation.",
    "options": [
      {
        "score": 1,
        "title": "Riaddestra il modello a ogni domanda",
        "text": "I documenti recuperati modificano immediatamente e permanentemente i pesi del modello."
      },
      {
        "score": 5,
        "title": "Recupera contenuti esterni e li aggiunge al contesto",
        "text": "Il modello genera usando anche i documenti selezionati; qualità del recupero, citazioni e verifica restano essenziali."
      },
      {
        "score": 2,
        "title": "Rende automaticamente vera ogni risposta",
        "text": "La presenza di documenti elimina errori, interpretazioni scorrette e allucinazioni."
      },
      {
        "score": 1,
        "title": "È un metodo per rendere casuale la generazione",
        "text": "Aumenta la varietà delle parole scelte dal modello."
      }
    ],
    "feedback": "Il RAG integra recupero documentale e generazione. Non equivale a riaddestramento e non sostituisce la valutazione della qualità delle fonti e dell’output."
  },
  {
    "id": "T10",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "L’intelligenza artificiale esisteva già prima degli LLM moderni?",
    "hint": "La domanda distingue la storia dell’AI dalla recente diffusione dei chatbot generativi.",
    "options": [
      {
        "score": 1,
        "title": "No, gli LLM hanno creato il primo vero campo dell’AI",
        "text": "Prima dei chatbot generativi esistevano soltanto normali programmi informatici."
      },
      {
        "score": 5,
        "title": "Sì, da molti decenni esistono diversi approcci all’AI",
        "text": "AI simbolica, sistemi esperti, ricerca, machine learning e reti neurali precedono gli LLM moderni."
      },
      {
        "score": 1,
        "title": "Sì, ma soltanto nella robotica industriale",
        "text": "Prima degli LLM l’AI riguardava esclusivamente macchine fisiche e automazione."
      },
      {
        "score": 1,
        "title": "No, l’AI nasce con il Transformer nel 2017",
        "text": "L’architettura Transformer coincide con l’origine storica dell’intera disciplina."
      }
    ],
    "feedback": "Il termine artificial intelligence risale agli anni Cinquanta e gli LLM sono una fase recente di una storia molto più lunga e articolata."
  },
  {
    "id": "T11",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Come affronti una possibile allucinazione in un output destinato al lavoro?",
    "hint": "Scegli il comportamento che applicheresti davvero.",
    "options": [
      {
        "score": 5,
        "title": "Verifico le affermazioni critiche con fonti affidabili e revisione umana",
        "text": "Controllo dati, date, citazioni e passaggi ad alto impatto; segnalo ciò che resta incerto e calibro la revisione sul rischio."
      },
      {
        "score": 3,
        "title": "Chiedo le fonti e controllo soltanto alcuni punti",
        "text": "È un controllo parziale: utile, ma può lasciare passare errori nelle parti non campionate."
      },
      {
        "score": 2,
        "title": "Chiedo al modello: “Sei sicuro?”",
        "text": "La risposta del medesimo modello non è una verifica indipendente e può ribadire lo stesso errore."
      },
      {
        "score": 1,
        "title": "Gli ordino di non inventare e uso il risultato",
        "text": "L’istruzione può orientare il comportamento, ma non rende l’output automaticamente vero."
      },
      {
        "score": 1,
        "title": "Mi fido se il testo è preciso e ben scritto",
        "text": "Forma, sicurezza apparente e precisione numerica non dimostrano correttezza."
      }
    ],
    "feedback": "Una possibile allucinazione si affronta con verifica indipendente, tracciabilità delle fonti e revisione proporzionata all’impatto, non con una semplice richiesta di conferma."
  },
  {
    "id": "T12",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Cos’è un embedding?",
    "hint": "Scegli la definizione tecnica generale più corretta.",
    "options": [
      {
        "score": 5,
        "title": "Una rappresentazione numerica che colloca contenuti simili in posizioni vicine",
        "text": "Testi o altri oggetti vengono trasformati in vettori utilizzabili per similarità, ricerca semantica, clustering e recupero."
      },
      {
        "score": 2,
        "title": "Un riassunto completo del testo originale",
        "text": "Un embedding non conserva il contenuto come una normale sintesi leggibile."
      },
      {
        "score": 1,
        "title": "Una copia cifrata del documento",
        "text": "La rappresentazione vettoriale non equivale a cifratura o anonimizzazione."
      },
      {
        "score": 1,
        "title": "Il prompt permanente memorizzato nel modello",
        "text": "Gli embedding non sono istruzioni né modificano automaticamente i pesi del modello."
      }
    ],
    "feedback": "Un embedding è una rappresentazione vettoriale appresa. È utile per confrontare la vicinanza tra contenuti, ma non è una garanzia di verità né una tecnica di cifratura."
  },
  {
    "id": "TR_CITE",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "trap": true,
    "text": "Un LLM fornisce titolo, autore, anno, DOI e link di una fonte. Che cosa puoi concludere?",
    "hint": "Scegli ciò che considereresti sufficiente prima di usare la citazione.",
    "options": [
      {
        "score": 5,
        "title": "Nulla sulla sua esistenza finché non verifico la fonte fuori dal modello",
        "text": "Anche riferimenti completi e formalmente credibili possono essere inventati, errati o riferiti a un contenuto diverso."
      },
      {
        "score": 2,
        "title": "Il DOI rende la fonte quasi certamente reale",
        "text": "Anche un identificatore dall’aspetto corretto può essere inesistente o non corrispondere al titolo indicato."
      },
      {
        "score": 2,
        "title": "Il link è sufficiente se il dominio sembra autorevole",
        "text": "Un URL plausibile non dimostra che la pagina esista o sostenga l’affermazione citata."
      },
      {
        "score": 1,
        "title": "La precisione bibliografica dimostra che il modello ha consultato la fonte",
        "text": "Il modello può generare dettagli coerenti senza aver recuperato o verificato il documento."
      }
    ],
    "feedback": "Una citazione completa non è prova di esistenza o pertinenza. Occorre aprire la fonte, verificarne identità, contenuto, data e corrispondenza con l’affermazione."
  },
  {
    "id": "F_DE_1",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "likert",
    "text": "Prima di usare l’AI, scelgo quali parti del lavoro delegare e quali devono restare sotto controllo umano.",
    "hint": "Delegare bene significa anche decidere cosa non delegare."
  },
  {
    "id": "F_DE_2",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "likert",
    "text": "Scompongo attività complesse in passaggi affidabili da affidare, verificare o far rielaborare all’AI.",
    "hint": "La scomposizione del lavoro riduce errori invisibili e rende il risultato più controllabile."
  },
  {
    "id": "F_DE_3",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "scenario",
    "text": "Ti chiedono di preparare in due ore una bozza di piano operativo per un nuovo progetto. Come usi l’AI?",
    "hint": "La domanda misura la capacità di delegare in modo strategico, non semplicemente veloce.",
    "options": [
      {
        "score": 1,
        "title": "Le chiedo di scrivere tutto il piano",
        "text": "Poi lo invio quasi senza modifiche."
      },
      {
        "score": 2,
        "title": "Le chiedo una bozza generale",
        "text": "Ritocco stile e formattazione."
      },
      {
        "score": 3,
        "title": "Le chiedo una struttura e qualche idea",
        "text": "Integro con la mia esperienza."
      },
      {
        "score": 4,
        "title": "Divido il lavoro in fasi",
        "text": "Brief, rischi, stakeholder, milestone, assunzioni, poi verifico."
      },
      {
        "score": 5,
        "title": "Uso l’AI come co-analista controllato",
        "text": "Genero alternative, criteri di scelta, rischi e checklist di validazione."
      }
    ],
    "feedback": "Una delega matura specifica confini, passaggi, criteri di qualità e responsabilità finale."
  },
  {
    "id": "F_DS_1",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "likert",
    "text": "Formulo richieste includendo obiettivo, contesto, vincoli, pubblico, formato atteso e criteri di qualità.",
    "hint": "La qualità della descrizione condiziona direttamente la qualità del lavoro delegato."
  },
  {
    "id": "F_DS_2",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "likert",
    "text": "Itero con l’AI: faccio domande di chiarimento, fornisco esempi, correggo assunzioni e restringo il perimetro.",
    "hint": "La competenza non si esaurisce nel primo prompt."
  },
  {
    "id": "F_DS_3",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "scenario",
    "text": "L’AI produce una risposta generica e poco utile. Qual è la tua reazione più probabile?",
    "hint": "La risposta migliore non è cambiare subito strumento, ma migliorare la descrizione del lavoro.",
    "options": [
      {
        "score": 1,
        "title": "Concludo che lo strumento non serve",
        "text": "Abbandono il tentativo."
      },
      {
        "score": 2,
        "title": "Ripeto la stessa domanda",
        "text": "Sperando in una risposta migliore."
      },
      {
        "score": 3,
        "title": "Aggiungo qualche dettaglio",
        "text": "Specifico meglio il risultato desiderato."
      },
      {
        "score": 4,
        "title": "Riscrivo il brief",
        "text": "Aggiungo contesto, vincoli, esempi, pubblico e formato."
      },
      {
        "score": 5,
        "title": "Imposto una mini-procedura",
        "text": "Chiedo domande preliminari, criteri, bozza, revisione e autoverifica."
      }
    ],
    "feedback": "La Description matura trasforma una richiesta generica in un incarico verificabile."
  },
  {
    "id": "TR_PROMPT",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "scenario",
    "trap": true,
    "text": "Quale affermazione sulla lunghezza di un prompt è più corretta?",
    "hint": "Valuta il principio, non la preferenza personale.",
    "options": [
      {
        "score": 5,
        "title": "La lunghezza da sola non misura la qualità del prompt",
        "text": "Conta che obiettivo, contesto, vincoli e criteri siano pertinenti; un prompt può essere breve o lungo in funzione del compito."
      },
      {
        "score": 1,
        "title": "Un prompt più lungo produce sempre una risposta migliore",
        "text": "Dettagli inutili, contraddittori o ridondanti possono peggiorare il compito invece di chiarirlo."
      },
      {
        "score": 2,
        "title": "Un prompt breve è sempre più efficace perché lascia libertà al modello",
        "text": "In alcuni casi la brevità basta, ma nei compiti complessi può lasciare troppe assunzioni implicite."
      },
      {
        "score": 2,
        "title": "La qualità si riconosce quando il prompt supera circa cento parole",
        "text": "Non esiste una soglia universale di parole che trasformi una richiesta in un buon prompt."
      }
    ],
    "feedback": "La qualità di un prompt dipende dall’adeguatezza delle informazioni e dalla verificabilità del compito, non da una lunghezza prestabilita."
  },
  {
    "id": "F_DI_1",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "likert",
    "text": "Valuto l’output con criteri specifici prima di usarlo in un documento, in una decisione o in una comunicazione.",
    "hint": "Il discernimento è la capacità di separare ciò che è utile da ciò che va corretto o scartato."
  },
  {
    "id": "F_DI_2",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "likert",
    "text": "Verifico affermazioni, numeri, citazioni o decisioni ad alto impatto con fonti o controlli indipendenti.",
    "hint": "La verifica è proporzionata al rischio e all’impatto del contenuto."
  },
  {
    "id": "F_DI_3",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "scenario",
    "text": "L’AI propone un dato numerico molto preciso ma senza fonte. Cosa fai?",
    "hint": "La domanda misura la reazione davanti a un output plausibile ma non verificato.",
    "options": [
      {
        "score": 1,
        "title": "Lo uso perché è molto preciso",
        "text": "La precisione apparente mi basta."
      },
      {
        "score": 2,
        "title": "Chiedo all’AI se è corretto",
        "text": "Mi accontento della conferma."
      },
      {
        "score": 3,
        "title": "Lo uso con una nota di cautela",
        "text": "Segnalo che potrebbe essere da verificare."
      },
      {
        "score": 4,
        "title": "Cerco una fonte indipendente",
        "text": "Uso il dato solo dopo controllo."
      },
      {
        "score": 5,
        "title": "Tratto il dato come ipotesi",
        "text": "Chiedo fonte, metodo, range, alternative e verifico su sorgenti affidabili."
      }
    ],
    "feedback": "Un numero preciso può essere più pericoloso di un’affermazione vaga se non è tracciabile."
  },
  {
    "id": "TR_SURE",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "scenario",
    "trap": true,
    "text": "L’AI fornisce un dato dubbio. Scrivi “Sei sicuro?” e il modello lo conferma con grande sicurezza. Come consideri questa conferma?",
    "hint": "Scegli il valore probatorio che attribuiresti alla seconda risposta.",
    "options": [
      {
        "score": 5,
        "title": "Non è una verifica indipendente: controllo il dato su una fonte esterna",
        "text": "Il modello può ripetere, riformulare o rafforzare lo stesso errore; la conferma interna non sostituisce un controllo separato."
      },
      {
        "score": 2,
        "title": "È un segnale utile, quindi uso il dato con una nota di cautela",
        "text": "La cautela è preferibile all’accettazione cieca, ma il dato resta non verificato."
      },
      {
        "score": 1,
        "title": "La seconda risposta rende il dato abbastanza affidabile",
        "text": "Ripetere la domanda allo stesso sistema non crea una nuova evidenza."
      },
      {
        "score": 1,
        "title": "La sicurezza del linguaggio indica che il modello ha ricontrollato",
        "text": "Il tono sicuro non dimostra l’accesso a fonti né l’esecuzione di una verifica fattuale."
      }
    ],
    "feedback": "“Sei sicuro?” può stimolare una revisione, ma non produce una prova indipendente. Per un dato rilevante servono fonti o controlli esterni."
  },
  {
    "id": "F_DG_1",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "likert",
    "text": "Mi assumo la responsabilità finale di ciò che produco con l’AI, anche quando il contributo dello strumento è ampio.",
    "hint": "La responsabilità non viene trasferita al modello."
  },
  {
    "id": "F_DG_2",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "likert",
    "text": "Segnalo o documento l’uso dell’AI quando è rilevante per trasparenza, audit, compliance o fiducia del destinatario.",
    "hint": "La trasparenza dipende dal contesto: non è sempre identica, ma va governata."
  },
  {
    "id": "F_DG_3",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "scenario",
    "text": "Un collega ti chiede di caricare in un chatbot non approvato un file con informazioni interne. Cosa fai?",
    "hint": "La Diligence misura uso responsabile, non solo prudenza generica.",
    "options": [
      {
        "score": 1,
        "title": "Lo carico se serve a lavorare più rapidamente",
        "text": "La produttività viene prima."
      },
      {
        "score": 2,
        "title": "Lo carico eliminando il titolo",
        "text": "Faccio una minimizzazione molto parziale."
      },
      {
        "score": 3,
        "title": "Estraggo solo alcune parti",
        "text": "Riduco il rischio, ma senza verificare il perimetro autorizzato."
      },
      {
        "score": 4,
        "title": "Controllo policy e strumento",
        "text": "Uso solo ambienti approvati o dati adeguatamente anonimizzati."
      },
      {
        "score": 5,
        "title": "Propongo un’alternativa governata",
        "text": "Creo un flusso sicuro: dati minimi, accessi, tracciabilità e revisione."
      }
    ],
    "feedback": "La produttività ottenuta con l’AI non compensa un uso non governato di dati interni o sensibili."
  },
  {
    "id": "M1",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "likert",
    "text": "Considero l’AI un amplificatore che richiede giudizio umano, non un sostituto automatico del pensiero.",
    "hint": "La maturità non coincide né con entusiasmo cieco né con rifiuto automatico."
  },
  {
    "id": "M2",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "likert",
    "text": "Mi sento a mio agio a sperimentare con l’AI su attività a basso rischio e con obiettivi chiari.",
    "hint": "La disponibilità alla sperimentazione controllata è un indicatore importante di adozione."
  },
  {
    "id": "M3",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "likert",
    "text": "Quando un output è errato, cerco di capire se il problema dipende da prompt, contesto, dati o limiti dello strumento.",
    "hint": "Questo distingue la frustrazione dalla capacità di migliorare il processo."
  },
  {
    "id": "M4",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "likert",
    "text": "Sono disponibile a cambiare il mio workflow se l’AI dimostra valore misurabile e controllabile.",
    "hint": "La domanda misura apertura al cambiamento, non obbedienza al cambiamento."
  },
  {
    "id": "M5",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "likert",
    "text": "Mantengo una fiducia calibrata: non accetto gli output senza controllo, ma non scarto lo strumento al primo errore.",
    "hint": "La fiducia calibrata è un equilibrio operativo."
  },
  {
    "id": "M6",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "likert",
    "text": "Sono disposto a condividere pratiche, esempi e cautele con i colleghi per migliorare l’uso dell’AI nel team.",
    "hint": "Il mindset individuale influisce anche sulla diffusione organizzativa."
  },
  {
    "id": "M7",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "likert",
    "text": "Mi aggiorno con regolarità sulle possibilità, sui limiti e sui rischi degli strumenti AI.",
    "hint": "La GenAI cambia rapidamente: la competenza va mantenuta."
  },
  {
    "id": "M8",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "scenario",
    "text": "Un collega dice: “L’AI sbaglia, quindi è inutile”. Come rispondi operativamente?",
    "hint": "La risposta più matura riconosce il limite, ma propone un uso controllato.",
    "options": [
      {
        "score": 1,
        "title": "Concordo e la evito",
        "text": "Se sbaglia, non vale il rischio."
      },
      {
        "score": 2,
        "title": "Dico che bisogna fidarsi di più",
        "text": "Il problema è solo resistenza al cambiamento."
      },
      {
        "score": 3,
        "title": "Propongo di usarla solo per testi semplici",
        "text": "Limito il campo ma senza metodo."
      },
      {
        "score": 4,
        "title": "Propongo casi a basso rischio",
        "text": "Con criteri di verifica e confronto dei risultati."
      },
      {
        "score": 5,
        "title": "Propongo una prova guidata",
        "text": "Scelgo task, metriche, limiti, dati ammessi e revisione finale."
      }
    ],
    "feedback": "Un mindset maturo non nega gli errori: li incorpora nel processo di lavoro."
  },
  {
    "id": "M9",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "scenario",
    "text": "Il management introduce strumenti AI ma non chiarisce bene obiettivi, regole e casi d’uso. Qual è il comportamento più utile?",
    "hint": "La risposta migliore unisce proattività, richiesta di regole e sperimentazione misurata.",
    "options": [
      {
        "score": 1,
        "title": "Aspetto istruzioni complete",
        "text": "Senza chiarezza non faccio nulla."
      },
      {
        "score": 2,
        "title": "Uso lo strumento come voglio",
        "text": "La pratica chiarirà tutto."
      },
      {
        "score": 3,
        "title": "Sperimento in modo informale",
        "text": "Resto su attività personali o poco critiche."
      },
      {
        "score": 4,
        "title": "Chiedo perimetro e propongo casi d’uso",
        "text": "Porto esempi concreti e criteri di rischio."
      },
      {
        "score": 5,
        "title": "Creo una proposta di adozione controllata",
        "text": "Mappa use case, policy, metriche, formazione e responsabilità."
      }
    ],
    "feedback": "In assenza di chiarezza, la competenza consiste nel costruire perimetro e metodo, non solo nel provare strumenti."
  },
  {
    "id": "P_L_1",
    "section": "Practical Lab",
    "dimension": "literacy",
    "type": "multi",
    "text": "L’AI ti restituisce una risposta su una norma potenzialmente aggiornata, ma senza link né data. Seleziona le azioni che faresti prima di usare il contenuto.",
    "hint": "Seleziona tutte le azioni operative che applicheresti davvero. Le scelte rischiose abbassano il punteggio.",
    "minSelected": 2,
    "options": [
      {
        "score": 2,
        "title": "Cerco una fonte primaria o istituzionale",
        "text": "Verifico il contenuto su ente, autorità, gazzetta, standard o fonte ufficiale pertinente."
      },
      {
        "score": 2,
        "title": "Controllo data, versione e campo di applicazione",
        "text": "Verifico se l’informazione è aggiornata e se vale davvero per il mio caso."
      },
      {
        "score": 1,
        "title": "Distinguo spiegazione generale e informazione aggiornata",
        "text": "Uso l’AI per capire il tema, ma non come fonte finale sulla data o sull’obbligo."
      },
      {
        "score": 1,
        "title": "Riporto fonti e incertezza residua",
        "text": "Nel documento finale distinguo ciò che è verificato da ciò che richiede conferma."
      },
      {
        "score": -2,
        "title": "Chiedo all’AI se è sicura",
        "text": "Considero sufficiente la conferma del modello senza cercare una fonte esterna."
      },
      {
        "score": -2,
        "title": "Copio il testo se è coerente",
        "text": "Se il ragionamento sembra logico, lo uso senza altre verifiche."
      },
      {
        "score": -1,
        "title": "Controllo solo se qualcosa suona strano",
        "text": "Mi affido alla plausibilità percepita come primo criterio di qualità."
      }
    ],
    "feedback": "Nei contenuti aggiornabili la competenza pratica si vede dalla gestione di fonte, data, versione e campo di applicazione, non dalla sicurezza dichiarata."
  },
  {
    "id": "P_DE_1",
    "section": "Practical Lab",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "multi",
    "text": "Devi analizzare 25 pagine di documentazione per preparare una raccomandazione. Seleziona quali parti affideresti all’AI e quali useresti solo come supporto.",
    "hint": "La domanda valuta la delega operativa: cosa fai fare allo strumento e cosa resta responsabilità umana.",
    "minSelected": 3,
    "options": [
      {
        "score": 2,
        "title": "Estrarre temi, requisiti e rischi da verificare",
        "text": "Uso l’AI per produrre una prima mappa controllabile del materiale."
      },
      {
        "score": 2,
        "title": "Creare una matrice alternative/criteri",
        "text": "Chiedo una struttura di confronto, poi controllo criteri e pesi."
      },
      {
        "score": 1,
        "title": "Preparare domande per gli stakeholder",
        "text": "Uso l’AI per evidenziare ambiguità e punti da chiarire."
      },
      {
        "score": 1,
        "title": "Produrre una checklist di revisione umana",
        "text": "Mi faccio aiutare a non dimenticare verifiche importanti."
      },
      {
        "score": -2,
        "title": "Far decidere all’AI la raccomandazione finale",
        "text": "Trasferisco allo strumento la decisione conclusiva."
      },
      {
        "score": -2,
        "title": "Inviare il risultato senza revisione",
        "text": "Uso direttamente il testo generato come raccomandazione ufficiale."
      },
      {
        "score": -1,
        "title": "Chiedere un unico riassunto senza riferimenti",
        "text": "Rendo più veloce la lettura, ma perdo tracciabilità e controllo."
      }
    ],
    "feedback": "Una delega solida usa l’AI per accelerare analisi, alternative e controlli, ma non le trasferisce la decisione finale."
  },
  {
    "id": "P_DS_1",
    "section": "Practical Lab",
    "dimension": "fluency",
    "sub": "description",
    "type": "text",
    "text": "Scrivi il prompt che useresti per chiedere all’AI di trasformare appunti disordinati di una riunione in un action plan utilizzabile. Gli appunti potrebbero essere incompleti: non vuoi che lo strumento inventi decisioni o responsabilità.",
    "hint": "Scrivi esattamente il prompt che useresti nella situazione reale, anche se molto breve.",
    "minChars": 120,
    "proceedChars": 1,
    "rubric": {
      "criteria": [
        {
          "label": "Obiettivo e deliverable",
          "points": 1,
          "keywords": [
            "obiettivo",
            "scopo",
            "action plan",
            "piano d'azione",
            "piano azione",
            "deliverable",
            "azioni"
          ]
        },
        {
          "label": "Contesto e input",
          "points": 1,
          "keywords": [
            "appunti",
            "riunione",
            "meeting",
            "note",
            "contesto",
            "verbale"
          ]
        },
        {
          "label": "Vincolo: non inventare",
          "points": 1,
          "keywords": [
            "non invent",
            "non aggiungere",
            "non dedurre",
            "se manca",
            "informazione mancante",
            "assunzioni"
          ]
        },
        {
          "label": "Formato atteso",
          "points": 1,
          "keywords": [
            "tabella",
            "formato",
            "colonne",
            "responsabile",
            "scadenza",
            "priorita",
            "priorità",
            "owner"
          ]
        },
        {
          "label": "Ambiguità e chiarimenti",
          "points": 1,
          "keywords": [
            "chiarimenti",
            "domande",
            "ambig",
            "dubbi",
            "incomplet",
            "segnala"
          ]
        },
        {
          "label": "Controllo qualità",
          "points": 1,
          "keywords": [
            "verifica",
            "controlla",
            "coerenza",
            "checklist",
            "rischi",
            "incongruen"
          ]
        }
      ],
      "redFlags": [
        {
          "label": "delega cieca",
          "points": 1,
          "keywords": [
            "fai tu",
            "decidi tu",
            "senza farmi domande",
            "definitivo",
            "perfetto"
          ]
        },
        {
          "label": "assenza di verifica",
          "points": 1,
          "keywords": [
            "non serve verificare",
            "senza verificare",
            "non controllare"
          ]
        }
      ]
    },
    "feedback": "Un prompt pratico deve rendere verificabile il lavoro: obiettivo, input, vincoli, formato, gestione delle informazioni mancanti e controllo finale."
  },
  {
    "id": "P_DS_2",
    "section": "Practical Lab",
    "dimension": "fluency",
    "sub": "description",
    "type": "choice",
    "text": "Quale prompt useresti per ottenere una risposta realmente utilizzabile su un problema aziendale complesso?",
    "hint": "Scegli il prompt che imposta meglio contesto, vincoli, output, criteri e interazione.",
    "options": [
      {
        "score": 1,
        "title": "Dimmi cosa fare su questo problema",
        "text": "Richiesta molto aperta, senza contesto né criteri."
      },
      {
        "score": 2,
        "title": "Scrivi un piano completo e convincente",
        "text": "Chiede un output finale, ma non definisce dati, vincoli o controlli."
      },
      {
        "score": 5,
        "title": "Prima fammi 5 domande, poi proponi 3 opzioni con rischi",
        "text": "Contesto, vincoli, criteri, assunzioni esplicite, formato tabellare e punti da verificare."
      },
      {
        "score": 3,
        "title": "Dammi 10 idee e poi scelgo io",
        "text": "Utile per divergere, ma debole su qualità, rischi e verifica."
      },
      {
        "score": 2,
        "title": "Rispondi in modo breve e operativo",
        "text": "Il formato è chiaro, ma mancano contesto, criteri e assunzioni."
      }
    ],
    "feedback": "La Description efficace non è solo chiarezza linguistica: è progettazione del compito e del controllo."
  },
  {
    "id": "P_DI_1",
    "section": "Practical Lab",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "text",
    "text": "Un output AI contiene questa frase: “Secondo il report 2026 di Global Manufacturing Observatory, il 72,4% delle aziende manifatturiere europee usa agenti AI in produzione”. Non c’è link. Scrivi i controlli che esegui prima di inserirla in una presentazione.",
    "hint": "Scrivi i controlli che eseguiresti davvero, anche in forma molto sintetica.",
    "minChars": 120,
    "proceedChars": 1,
    "rubric": {
      "criteria": [
        {
          "label": "Esistenza della fonte",
          "points": 1,
          "keywords": [
            "esistenza",
            "fonte",
            "report",
            "link",
            "pubblicazione",
            "autore"
          ]
        },
        {
          "label": "Affidabilità della fonte",
          "points": 1,
          "keywords": [
            "affidabil",
            "autorevole",
            "istituz",
            "ente",
            "metodologia",
            "campione"
          ]
        },
        {
          "label": "Data e versione",
          "points": 1,
          "keywords": [
            "data",
            "versione",
            "2026",
            "aggiorn",
            "pubblicato"
          ]
        },
        {
          "label": "Confronto indipendente",
          "points": 1,
          "keywords": [
            "confront",
            "fonte indipendente",
            "altre fonti",
            "cross-check",
            "verifica incrociata"
          ]
        },
        {
          "label": "Uso prudente del dato",
          "points": 1,
          "keywords": [
            "non verificato",
            "ipotesi",
            "rimuovo",
            "non lo uso",
            "cautela",
            "range"
          ]
        },
        {
          "label": "Citazione o tracciabilità",
          "points": 1,
          "keywords": [
            "cit",
            "riferimento",
            "url",
            "nota",
            "slide",
            "tracci"
          ]
        }
      ],
      "redFlags": [
        {
          "label": "precisione scambiata per qualità",
          "points": 1,
          "keywords": [
            "preciso quindi",
            "sembra preciso",
            "lo uso cosi",
            "lo uso così"
          ]
        },
        {
          "label": "conferma autoreferenziale",
          "points": 1,
          "keywords": [
            "chiedo all'ai",
            "chiedo alla ai",
            "chiedo al modello se"
          ]
        }
      ]
    },
    "feedback": "Il discernimento pratico emerge quando un dato plausibile e preciso viene trattato come ipotesi finché non è tracciabile."
  },
  {
    "id": "P_DG_1",
    "section": "Practical Lab",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "multi",
    "text": "Hai un documento interno con nomi cliente, prezzi riservati e note commerciali. Cosa fai prima di usarlo con uno strumento AI?",
    "hint": "Seleziona le azioni concrete che applicheresti. Alcune scelte sembrano rapide ma sono deboli sul piano della governance.",
    "minSelected": 3,
    "options": [
      {
        "score": 2,
        "title": "Verifico policy e strumenti approvati",
        "text": "Controllo se lo strumento è autorizzato per quel tipo di dato."
      },
      {
        "score": 2,
        "title": "Minimizzo o anonimizzo il contenuto",
        "text": "Uso solo ciò che serve e rimuovo elementi identificativi non necessari."
      },
      {
        "score": 1,
        "title": "Valuto finalità, accessi e conservazione",
        "text": "Mi chiedo chi può accedere ai dati e cosa resta nello strumento."
      },
      {
        "score": 1,
        "title": "Cerco un’alternativa governata",
        "text": "Uso ambiente aziendale, repository autorizzato, RAG controllato o dati sintetici."
      },
      {
        "score": 1,
        "title": "Documento assunzioni e perimetro",
        "text": "Tengo traccia di che cosa ho usato e perché."
      },
      {
        "score": -2,
        "title": "Lo carico così com’è",
        "text": "Il documento è interno, ma mi serve solo per lavorare più velocemente."
      },
      {
        "score": -2,
        "title": "Uso un account personale",
        "text": "Evito attriti organizzativi usando lo strumento che conosco meglio."
      },
      {
        "score": -1,
        "title": "Tolgo solo il nome del file",
        "text": "Intervento cosmetico che non riduce davvero il contenuto riservato."
      }
    ],
    "feedback": "La Diligence pratica riguarda perimetro dei dati, strumenti autorizzati, minimizzazione, tracciabilità e responsabilità."
  },
  {
    "id": "P_M_1",
    "section": "Practical Lab",
    "dimension": "mindset",
    "type": "multi",
    "text": "Un primo tentativo con l’AI produce un output mediocre. Seleziona cosa fai per migliorare il processo.",
    "hint": "La risposta misura fiducia calibrata e capacità di apprendimento operativo, non ottimismo generico.",
    "minSelected": 3,
    "options": [
      {
        "score": 2,
        "title": "Riformulo il brief",
        "text": "Aggiungo contesto, vincoli, destinatario, formato e criteri di qualità."
      },
      {
        "score": 1,
        "title": "Fornisco un esempio di output atteso",
        "text": "Rendo più chiaro lo standard desiderato."
      },
      {
        "score": 1,
        "title": "Chiedo assunzioni e domande preliminari",
        "text": "Faccio emergere ciò che manca prima di produrre la risposta finale."
      },
      {
        "score": 1,
        "title": "Scompongo il task",
        "text": "Divido ricerca, sintesi, revisione e controllo invece di chiedere tutto insieme."
      },
      {
        "score": 1,
        "title": "Confronto l’output con criteri espliciti",
        "text": "Valuto cosa funziona, cosa manca e cosa va rifatto."
      },
      {
        "score": -2,
        "title": "Ripeto la stessa richiesta",
        "text": "Spero che il modello produca casualmente una risposta migliore."
      },
      {
        "score": -2,
        "title": "Accetto il risultato perché ho poco tempo",
        "text": "Uso un output mediocre senza correggere il processo."
      },
      {
        "score": -1,
        "title": "Scarto definitivamente l’AI",
        "text": "Interpreto un singolo output debole come prova che lo strumento non serve."
      }
    ],
    "feedback": "Un mindset maturo si vede dalla capacità di modificare processo, prompt e criteri dopo un risultato debole."
  },
  {
    "id": "L8",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "likert",
    "text": "So distinguere tra un output utile come bozza e un contenuto abbastanza verificato da essere usato in un documento di lavoro.",
    "hint": "La domanda misura la differenza tra utilità operativa e affidabilità finale."
  },
  {
    "id": "L9",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "likert",
    "text": "Quando uso strumenti AI, considero il rischio che istruzioni, file o esempi nel prompt possano influenzare impropriamente la risposta.",
    "hint": "Conta la consapevolezza di contesto, prompt injection e qualità degli input."
  },
  {
    "id": "L10",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "likert",
    "text": "So spiegare perché un modello può produrre risposte diverse a richieste simili e perché questo non equivale automaticamente a errore.",
    "hint": "Valuta la comprensione della natura probabilistica e contestuale della generazione."
  },
  {
    "id": "L11",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "scenario",
    "text": "Un output AI cita un documento interno che non ricordi di aver caricato. Cosa fai?",
    "hint": "Scegli il comportamento più robusto rispetto a fonti, memoria e contesto.",
    "options": [
      {
        "score": 1,
        "title": "Uso la citazione se sembra coerente",
        "text": "Assumo che il modello abbia accesso al documento."
      },
      {
        "score": 2,
        "title": "Chiedo al modello dove l'ha trovata",
        "text": "Mi affido alla spiegazione del modello senza verifica esterna."
      },
      {
        "score": 3,
        "title": "Controllo se il documento è nella conversazione",
        "text": "Verifico il contesto immediato, ma non tutto il perimetro."
      },
      {
        "score": 4,
        "title": "Verifico contesto, file caricati e impostazioni",
        "text": "Controllo da dove può arrivare l'informazione e se è autorizzata."
      },
      {
        "score": 5,
        "title": "Tratto la citazione come non verificata finché non è tracciabile",
        "text": "Ricerco la fonte reale, documento l'incertezza e non la uso finché non è confermata."
      }
    ],
    "feedback": "Una citazione prodotta dall'AI va trattata come ipotesi finché non è riconducibile a una fonte accessibile e autorizzata."
  },
  {
    "id": "L12",
    "section": "Literacy",
    "dimension": "literacy",
    "type": "scenario",
    "text": "Devi usare l'AI per preparare una risposta a un cliente su dati aziendali non pubblici. Qual è il primo controllo?",
    "hint": "La risposta migliore mette prima perimetro dati e strumento, poi produttività.",
    "options": [
      {
        "score": 1,
        "title": "Scrivo subito la risposta con lo strumento più rapido",
        "text": "Privilegio velocità e qualità apparente."
      },
      {
        "score": 2,
        "title": "Tolgo il nome del cliente e procedo",
        "text": "Riduco poco il rischio e non verifico il contesto."
      },
      {
        "score": 3,
        "title": "Uso solo dati aggregati",
        "text": "Riduce il rischio, ma non basta senza policy e strumento adeguato."
      },
      {
        "score": 4,
        "title": "Verifico classificazione dati e strumenti approvati",
        "text": "Controllo se posso usare quei contenuti in quel servizio."
      },
      {
        "score": 5,
        "title": "Definisco un flusso minimizzato e tracciabile",
        "text": "Uso solo dati necessari, ambiente autorizzato, revisione umana e note su fonti e limiti."
      }
    ],
    "feedback": "La literacy include sapere che la qualità dell'output non compensa un perimetro dati non governato."
  },
  {
    "id": "F_DE_4",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "likert",
    "text": "Prima di usare l'AI, chiarisco quale decisione resta mia e quale parte può essere solo supportata dallo strumento.",
    "hint": "La delega matura mantiene responsabilità e controllo umano."
  },
  {
    "id": "F_DE_5",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "likert",
    "text": "So separare attività esplorative, analitiche, creative e decisionali quando progetto un workflow con l'AI.",
    "hint": "Non tutti i passaggi hanno lo stesso livello di delegabilità."
  },
  {
    "id": "F_DE_6",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "likert",
    "text": "Quando affido un compito all'AI, definisco criteri di accettazione prima di guardare l'output.",
    "hint": "La qualità va progettata prima, non solo giudicata dopo."
  },
  {
    "id": "F_DE_7",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "likert",
    "text": "Uso l'AI per generare alternative, ma confronto io rischi, vincoli e conseguenze della scelta finale.",
    "hint": "Generare opzioni non equivale a delegare la scelta."
  },
  {
    "id": "F_DE_8",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "likert",
    "text": "Riconosco quando un'attività richiede accesso a contesto, relazioni o responsabilità che l'AI non possiede.",
    "hint": "Alcuni compiti sembrano testuali, ma dipendono da responsabilità organizzative."
  },
  {
    "id": "F_DE_9",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "likert",
    "text": "Scompongo task complessi in passaggi brevi, verificabili e correggibili invece di chiedere un risultato finale in un solo prompt.",
    "hint": "La delega efficace riduce opacità e aumenta controllo."
  },
  {
    "id": "F_DE_10",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "likert",
    "text": "Decido consapevolmente quando non usare l'AI perché il costo di verifica supererebbe il beneficio.",
    "hint": "La competenza include anche non delegare."
  },
  {
    "id": "F_DE_11",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "scenario",
    "text": "Devi scrivere una raccomandazione su una scelta strategica con dati incompleti. Che cosa deleghi all'AI?",
    "hint": "La scelta migliore usa l'AI come supporto strutturato, non come decisore.",
    "options": [
      {
        "score": 1,
        "title": "La decisione finale",
        "text": "Chiedo quale opzione scegliere e la seguo."
      },
      {
        "score": 2,
        "title": "Un testo convincente",
        "text": "Mi interessa soprattutto presentare bene la raccomandazione."
      },
      {
        "score": 3,
        "title": "Una lista di pro e contro",
        "text": "Utile, ma ancora poco governata."
      },
      {
        "score": 4,
        "title": "Una matrice con assunzioni e dati mancanti",
        "text": "Uso l'AI per strutturare il ragionamento e vedere i vuoti."
      },
      {
        "score": 5,
        "title": "Alternative, rischi, domande e criteri di verifica",
        "text": "Mantengo la decisione umana e uso l'AI per aumentare qualità del processo."
      }
    ],
    "feedback": "Nelle decisioni strategiche la delega riguarda struttura, alternative e controlli, non responsabilità finale."
  },
  {
    "id": "F_DE_12",
    "section": "Fluency · Delegation",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "scenario",
    "text": "Un task è urgente, ripetitivo e basato su dati già verificati. Come usi l'AI?",
    "hint": "La risposta migliore bilancia automazione e controllo leggero.",
    "options": [
      {
        "score": 1,
        "title": "Non la uso mai su task urgenti",
        "text": "Evito lo strumento anche quando il rischio è basso."
      },
      {
        "score": 2,
        "title": "Le affido tutto senza revisione",
        "text": "L'urgenza elimina i controlli."
      },
      {
        "score": 3,
        "title": "La uso per una bozza e controllo a campione",
        "text": "Approccio utile ma poco esplicito."
      },
      {
        "score": 4,
        "title": "Definisco template, input e controllo finale",
        "text": "Uso l'AI dove accelera e verifico l'aderenza."
      },
      {
        "score": 5,
        "title": "Creo un micro-workflow riutilizzabile",
        "text": "Input standard, criteri, eccezioni e revisione proporzionata al rischio."
      }
    ],
    "feedback": "La delega operativa matura è proporzionata: più automazione quando dati, criteri e rischio sono sotto controllo."
  },
  {
    "id": "F_DS_4",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "likert",
    "text": "Nei prompt includo destinatario, obiettivo, vincoli e livello di dettaglio atteso.",
    "hint": "La descrizione efficace riduce ambiguità sul risultato."
  },
  {
    "id": "F_DS_5",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "likert",
    "text": "Quando non ho abbastanza informazioni, chiedo all'AI di farmi domande prima di produrre l'output.",
    "hint": "Far emergere le lacune è spesso meglio che forzare una risposta."
  },
  {
    "id": "F_DS_6",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "likert",
    "text": "Specifico il formato dell'output quando mi serve confrontare, copiare o riusare il risultato.",
    "hint": "Formato e struttura sono parte del brief, non dettagli estetici."
  },
  {
    "id": "F_DS_7",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "likert",
    "text": "Uso esempi di output buono e output debole per chiarire lo standard richiesto.",
    "hint": "Gli esempi aiutano il modello a capire criteri impliciti."
  },
  {
    "id": "F_DS_8",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "likert",
    "text": "Rendo esplicite le assunzioni che l'AI può fare e quelle che deve segnalare come incerte.",
    "hint": "Le assunzioni non dichiarate sono una fonte frequente di output fragili."
  },
  {
    "id": "F_DS_9",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "likert",
    "text": "Quando il primo output non è buono, modifico il brief in modo mirato invece di ripetere la stessa richiesta.",
    "hint": "Iterare non significa solo chiedere di riprovare."
  },
  {
    "id": "F_DS_10",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "scenario",
    "text": "Vuoi una sintesi per il CEO e una per il team tecnico. Come imposti la richiesta?",
    "hint": "La risposta migliore differenzia destinatario, livello e formato.",
    "options": [
      {
        "score": 1,
        "title": "Chiedo una sintesi unica",
        "text": "Un solo output dovrebbe andare bene per tutti."
      },
      {
        "score": 2,
        "title": "Chiedo due versioni più o meno lunghe",
        "text": "La lunghezza non basta a cambiare utilità."
      },
      {
        "score": 3,
        "title": "Indico i due destinatari",
        "text": "Buon inizio, ma mancano criteri e formato."
      },
      {
        "score": 4,
        "title": "Definisco obiettivo, tono e dettagli per ciascuno",
        "text": "Adatto contenuto e formato ai due usi."
      },
      {
        "score": 5,
        "title": "Chiedo due output con criteri, rischi e domande aperte",
        "text": "Differenzio destinatario, decisioni da supportare, dettaglio tecnico e incertezze."
      }
    ],
    "feedback": "La Description efficace progetta l'output per il destinatario e per la decisione da supportare."
  },
  {
    "id": "F_DS_11",
    "section": "Fluency · Description",
    "dimension": "fluency",
    "sub": "description",
    "type": "scenario",
    "text": "Un prompt produce risposte troppo generiche. Qual è la modifica più utile?",
    "hint": "Cerca la modifica che aumenta contesto e verificabilità.",
    "options": [
      {
        "score": 1,
        "title": "Scrivere: sii più preciso",
        "text": "Richiesta generica per risolvere genericità."
      },
      {
        "score": 2,
        "title": "Chiedere una risposta più lunga",
        "text": "Più testo non significa più qualità."
      },
      {
        "score": 3,
        "title": "Aggiungere qualche dettaglio di contesto",
        "text": "Migliora, ma può restare non verificabile."
      },
      {
        "score": 4,
        "title": "Aggiungere contesto, criteri e formato",
        "text": "Orienta l'output verso l'uso reale."
      },
      {
        "score": 5,
        "title": "Aggiungere esempi, vincoli, criteri e richiesta di chiarimenti",
        "text": "Trasforma il prompt in un brief controllabile."
      }
    ],
    "feedback": "Un output generico si corregge progettando meglio il compito, non solo chiedendo più precisione."
  },
  {
    "id": "F_DI_4",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "likert",
    "text": "Valuto se un output AI risponde davvero alla domanda o se è solo plausibile e ben scritto.",
    "hint": "La forma può mascherare lacune di contenuto."
  },
  {
    "id": "F_DI_5",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "likert",
    "text": "Controllo citazioni, numeri e nomi propri prima di riusarli in contesti professionali.",
    "hint": "I dettagli precisi sono spesso quelli che richiedono più verifica."
  },
  {
    "id": "F_DI_6",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "likert",
    "text": "Confronto più alternative generate dall'AI invece di accettare automaticamente la prima risposta.",
    "hint": "Il confronto aiuta a vedere omissioni e bias."
  },
  {
    "id": "F_DI_7",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "likert",
    "text": "So riconoscere quando un output è fuori perimetro rispetto ai dati forniti o alle fonti disponibili.",
    "hint": "Un modello può riempire i vuoti con contenuti plausibili."
  },
  {
    "id": "F_DI_8",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "likert",
    "text": "Uso criteri espliciti per decidere se accettare, correggere, rigenerare o scartare un output.",
    "hint": "La revisione matura ha soglie e criteri."
  },
  {
    "id": "F_DI_9",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "likert",
    "text": "Distinguo tra errore fattuale, incompletezza, tono inadatto e ragionamento debole quando valuto una risposta.",
    "hint": "Problemi diversi richiedono correzioni diverse."
  },
  {
    "id": "F_DI_10",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "scenario",
    "text": "L'AI propone tre insight da un file di vendita, ma non mostra passaggi o righe usate. Che cosa fai?",
    "hint": "La risposta migliore cerca tracciabilità prima dell'uso.",
    "options": [
      {
        "score": 1,
        "title": "Uso gli insight perché sembrano utili",
        "text": "Valuto l'utilità apparente."
      },
      {
        "score": 2,
        "title": "Chiedo di essere più convincente",
        "text": "Migliora la forma, non la verifica."
      },
      {
        "score": 3,
        "title": "Controllo solo l'insight più importante",
        "text": "Riduce il rischio ma lascia buchi."
      },
      {
        "score": 4,
        "title": "Chiedo evidenze e controllo righe/campi",
        "text": "Cerco tracciabilità e coerenza con i dati."
      },
      {
        "score": 5,
        "title": "Ricostruisco metodo, evidenze e limiti",
        "text": "Verifico campione, calcoli, outlier e alternative prima di usare gli insight."
      }
    ],
    "feedback": "Il Discernment richiede tracciabilità: insight senza evidenze sono ipotesi da verificare."
  },
  {
    "id": "F_DI_11",
    "section": "Fluency · Discernment",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "scenario",
    "text": "Una risposta AI è molto allineata alla tua opinione iniziale. Qual è il rischio principale?",
    "hint": "La maturità critica include controllare anche ciò che ci piace.",
    "options": [
      {
        "score": 1,
        "title": "Nessun rischio, conferma che avevo ragione",
        "text": "Confondi accordo e qualità."
      },
      {
        "score": 2,
        "title": "Solo il rischio che sia scritta male",
        "text": "La forma è un problema secondario."
      },
      {
        "score": 3,
        "title": "Potrebbe mancare qualche dettaglio",
        "text": "Riconosci un rischio ma non il bias principale."
      },
      {
        "score": 4,
        "title": "Potrebbe amplificare il mio bias",
        "text": "Controllo alternative e controargomenti."
      },
      {
        "score": 5,
        "title": "Chiedo controprove, alternative e condizioni di falsificazione",
        "text": "Uso l'AI per testare l'ipotesi, non solo per confermarla."
      }
    ],
    "feedback": "Un output convincente perché conferma le nostre ipotesi richiede più, non meno, discernimento."
  },
  {
    "id": "F_DG_4",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "likert",
    "text": "Prima di usare dati con l'AI, verifico se appartengono a categorie riservate, personali o regolamentate.",
    "hint": "La responsabilità parte dalla classificazione del dato."
  },
  {
    "id": "F_DG_5",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "likert",
    "text": "Evito di usare account personali o strumenti non approvati per trattare informazioni aziendali.",
    "hint": "La comodità dello strumento non basta a renderlo appropriato."
  },
  {
    "id": "F_DG_6",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "likert",
    "text": "Quando l'AI contribuisce in modo sostanziale a un contenuto, valuto se dichiararlo al destinatario.",
    "hint": "La trasparenza dipende da contesto, aspettative e impatto."
  },
  {
    "id": "F_DG_7",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "likert",
    "text": "Mantengo traccia delle fonti e dei passaggi usati quando il risultato AI può influenzare decisioni o documenti importanti.",
    "hint": "Tracciabilità e auditabilità sono parte dell'uso responsabile."
  },
  {
    "id": "F_DG_8",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "likert",
    "text": "Uso dati sintetici, minimizzati o anonimizzati quando il dato reale non è necessario al compito.",
    "hint": "Il dato migliore da proteggere è quello che non viene condiviso."
  },
  {
    "id": "F_DG_9",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "likert",
    "text": "Riconosco quando un output AI può avere impatti reputazionali, legali o discriminatori e richiede revisione aggiuntiva.",
    "hint": "Il livello di controllo deve crescere con il rischio."
  },
  {
    "id": "F_DG_10",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "likert",
    "text": "Non uso l'AI per aggirare policy, controlli o responsabilità del mio ruolo.",
    "hint": "La Diligence è anche rispetto del perimetro organizzativo."
  },
  {
    "id": "F_DG_11",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "scenario",
    "text": "Un output AI contiene una valutazione severa su una persona del team. Come procedi?",
    "hint": "La risposta migliore evita uso improprio e cerca evidenze.",
    "options": [
      {
        "score": 1,
        "title": "La inoltro perché è scritta bene",
        "text": "Trasferisco un giudizio non verificato."
      },
      {
        "score": 2,
        "title": "La ammorbidisco e la uso",
        "text": "Miglioro il tono ma non il metodo."
      },
      {
        "score": 3,
        "title": "La uso solo come spunto privato",
        "text": "Riduce il danno ma resta poco governato."
      },
      {
        "score": 4,
        "title": "Verifico dati, contesto e policy HR",
        "text": "Non uso giudizi personali senza perimetro ed evidenze."
      },
      {
        "score": 5,
        "title": "Separare fatti, ipotesi e responsabilità umana",
        "text": "Uso eventualmente l'AI per strutturare evidenze, non per formulare giudizi automatici."
      }
    ],
    "feedback": "Le valutazioni sulle persone richiedono massima cautela, evidenze e responsabilità umana."
  },
  {
    "id": "F_DG_12",
    "section": "Fluency · Diligence",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "scenario",
    "text": "Per risparmiare tempo, un fornitore propone di caricare i tuoi file su un tool AI esterno. Che cosa chiedi prima?",
    "hint": "La risposta più matura guarda a dati, contratto e controllo.",
    "options": [
      {
        "score": 1,
        "title": "Solo se il tool è veloce",
        "text": "Valuto il beneficio operativo."
      },
      {
        "score": 2,
        "title": "Una promessa informale di riservatezza",
        "text": "Non basta per governare il rischio."
      },
      {
        "score": 3,
        "title": "Uno screenshot delle impostazioni privacy",
        "text": "È un controllo parziale."
      },
      {
        "score": 4,
        "title": "Contratto, data processing e policy dello strumento",
        "text": "Verifico base, ruoli, conservazione e uso dei dati."
      },
      {
        "score": 5,
        "title": "Perimetro completo: dati, accessi, retention, training e audit",
        "text": "Valuto se il flusso è autorizzabile e quali alternative usare."
      }
    ],
    "feedback": "La Diligence include anche la catena dei fornitori e il controllo delle condizioni d'uso."
  },
  {
    "id": "M10",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "likert",
    "text": "Accetto di misurare l'efficacia dell'AI con evidenze, non solo con entusiasmo o fastidio personale.",
    "hint": "Il mindset maturo è sperimentale e misurabile."
  },
  {
    "id": "M11",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "likert",
    "text": "Quando un collega usa bene l'AI, cerco di capire il metodo invece di limitarmi al risultato finale.",
    "hint": "La competenza cresce osservando pratiche ripetibili."
  },
  {
    "id": "M12",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "scenario",
    "text": "Il tuo team è diviso tra entusiasmo e scetticismo sull'AI. Quale contributo porti?",
    "hint": "La risposta migliore costruisce apprendimento condiviso e regole pratiche.",
    "options": [
      {
        "score": 1,
        "title": "Mi schiero e basta",
        "text": "Rendo il confronto più polarizzato."
      },
      {
        "score": 2,
        "title": "Propongo di aspettare",
        "text": "Evito il conflitto ma non genero apprendimento."
      },
      {
        "score": 3,
        "title": "Raccolgo esempi interessanti",
        "text": "Utile, ma ancora informale."
      },
      {
        "score": 4,
        "title": "Propongo casi pilota con criteri",
        "text": "Creo uno spazio misurabile e governato."
      },
      {
        "score": 5,
        "title": "Facilito una pratica comune",
        "text": "Definisco use case, limiti, metriche, condivisione e retrospettiva."
      }
    ],
    "feedback": "Il mindset utile al team trasforma opinioni divergenti in esperimenti governati e apprendimento comune."
  },
  {
    "id": "P_L_2",
    "section": "Practical Lab",
    "dimension": "literacy",
    "type": "multi",
    "text": "Devi usare un documento generato da AI in un contesto esterno. Quali controlli fai prima della consegna?",
    "hint": "Seleziona le azioni che rendono il contenuto tracciabile e difendibile.",
    "minSelected": 3,
    "options": [
      {
        "score": 2,
        "title": "Verifico dati, date e nomi propri",
        "text": "Controllo gli elementi più esposti a errore."
      },
      {
        "score": 2,
        "title": "Controllo fonti e citazioni",
        "text": "Rendo tracciabile ciò che viene affermato."
      },
      {
        "score": 1,
        "title": "Rivedo tono e destinatario",
        "text": "Adatto il testo all'uso reale."
      },
      {
        "score": 1,
        "title": "Segnalo incertezze residue",
        "text": "Non trasformo ipotesi in certezze."
      },
      {
        "score": -2,
        "title": "Controllo solo grammatica e stile",
        "text": "La forma non garantisce correttezza."
      },
      {
        "score": -2,
        "title": "Uso il testo perché è convincente",
        "text": "La persuasività non sostituisce verifica."
      }
    ],
    "feedback": "Il controllo pratico prima della consegna riguarda accuratezza, fonti, contesto e incertezze."
  },
  {
    "id": "P_DE_2",
    "section": "Practical Lab",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "choice",
    "text": "Quale passaggio NON delegheresti interamente all'AI in un processo di selezione fornitori?",
    "hint": "Scegli il confine più importante della responsabilità.",
    "options": [
      {
        "score": 2,
        "title": "Riassumere schede tecniche",
        "text": "Può essere un supporto utile se verificato."
      },
      {
        "score": 3,
        "title": "Estrarre requisiti ricorrenti",
        "text": "Delegabile con controllo."
      },
      {
        "score": 5,
        "title": "Decidere il fornitore vincente",
        "text": "La decisione richiede responsabilità, contesto e verifica umana."
      },
      {
        "score": 2,
        "title": "Preparare una tabella comparativa",
        "text": "Utile se i dati sono tracciabili."
      },
      {
        "score": 3,
        "title": "Generare domande di chiarimento",
        "text": "Buon uso come supporto."
      }
    ],
    "feedback": "L'AI può supportare confronto e analisi, ma non deve assorbire la responsabilità della scelta."
  },
  {
    "id": "P_DS_3",
    "section": "Practical Lab",
    "dimension": "fluency",
    "sub": "description",
    "type": "text",
    "text": "Scrivi un prompt per chiedere all'AI di revisionare una proposta commerciale senza cambiare promesse, prezzi o condizioni contrattuali.",
    "hint": "Scrivi il prompt che useresti davvero, includendo vincoli e formato dell'output.",
    "minChars": 100,
    "proceedChars": 1,
    "rubric": {
      "criteria": [
        {
          "label": "Obiettivo",
          "points": 1,
          "keywords": [
            "revision",
            "migliora",
            "proposta",
            "commerciale"
          ]
        },
        {
          "label": "Vincoli sostanziali",
          "points": 1,
          "keywords": [
            "non cambiare",
            "non modificare",
            "prezzi",
            "condizioni",
            "promesse"
          ]
        },
        {
          "label": "Formato",
          "points": 1,
          "keywords": [
            "tabella",
            "commenti",
            "prima",
            "dopo",
            "motivazione"
          ]
        },
        {
          "label": "Controllo",
          "points": 1,
          "keywords": [
            "segnala",
            "dubbi",
            "rischi",
            "verifica"
          ]
        },
        {
          "label": "Destinatario",
          "points": 1,
          "keywords": [
            "cliente",
            "destinatario",
            "tono",
            "stile"
          ]
        }
      ],
      "redFlags": [
        {
          "label": "delega sostanziale",
          "points": 1,
          "keywords": [
            "riscrivi liberamente",
            "migliora le condizioni",
            "rendila più vantaggiosa"
          ]
        }
      ]
    },
    "feedback": "Un buon prompt di revisione distingue forma e sostanza: migliora chiarezza senza alterare impegni."
  },
  {
    "id": "P_DI_2",
    "section": "Practical Lab",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "choice",
    "text": "L'AI produce una tabella comparativa ma una riga sembra troppo favorevole alla tua ipotesi. Quale controllo è prioritario?",
    "hint": "Scegli il controllo che riduce il rischio di conferma.",
    "options": [
      {
        "score": 1,
        "title": "Lasciarla così perché conferma l'ipotesi",
        "text": "Accetti il bias."
      },
      {
        "score": 2,
        "title": "Rendere la riga più prudente nel tono",
        "text": "Correggi forma, non contenuto."
      },
      {
        "score": 3,
        "title": "Chiedere una seconda tabella",
        "text": "Può aiutare ma resta autoreferenziale."
      },
      {
        "score": 4,
        "title": "Verificare dati sorgente e criteri di confronto",
        "text": "Controlli base e metodologia."
      },
      {
        "score": 5,
        "title": "Cercare controevidenze e rieseguire il confronto",
        "text": "Metti alla prova l'ipotesi con criteri espliciti."
      }
    ],
    "feedback": "Il discernimento pratico richiede di verificare soprattutto ciò che appare comodo o confermativo."
  },
  {
    "id": "P_DG_2",
    "section": "Practical Lab",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "multi",
    "text": "Stai preparando un prompt con dati di clienti. Quali interventi riducono davvero il rischio?",
    "hint": "Seleziona le azioni concrete di minimizzazione e governance.",
    "minSelected": 3,
    "options": [
      {
        "score": 2,
        "title": "Uso solo campi necessari al task",
        "text": "Minimizzazione del dato."
      },
      {
        "score": 2,
        "title": "Sostituisco identificativi con placeholder",
        "text": "Riduce esposizione diretta."
      },
      {
        "score": 1,
        "title": "Uso uno strumento approvato",
        "text": "Allinea il processo alla policy."
      },
      {
        "score": 1,
        "title": "Documentare finalità e perimetro",
        "text": "Rende il trattamento spiegabile."
      },
      {
        "score": -2,
        "title": "Cambio solo i nomi dei file",
        "text": "Non protegge il contenuto."
      },
      {
        "score": -2,
        "title": "Uso un account personale per fare prima",
        "text": "Aumenta il rischio di controllo e conservazione."
      }
    ],
    "feedback": "La riduzione del rischio nasce da minimizzazione, anonimizzazione, strumenti approvati e tracciabilità."
  },
  {
    "id": "T13",
    "section": "Fondamenti tecnici LLM",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Quale affermazione descrive meglio il fine-tuning di un modello?",
    "hint": "Distingui fine-tuning, prompt e recupero documentale.",
    "options": [
      {
        "score": 1,
        "title": "È scrivere un prompt più lungo",
        "text": "Il prompt non modifica i parametri del modello."
      },
      {
        "score": 5,
        "title": "È un addestramento aggiuntivo su dati specifici",
        "text": "Adatta il modello a un dominio o comportamento modificando parametri o componenti addestrabili."
      },
      {
        "score": 2,
        "title": "È caricare documenti nel contesto",
        "text": "Questo riguarda input o RAG, non necessariamente fine-tuning."
      },
      {
        "score": 1,
        "title": "È verificare manualmente le risposte",
        "text": "La verifica è revisione, non addestramento."
      }
    ],
    "feedback": "Il fine-tuning è un processo di adattamento tramite addestramento ulteriore; non coincide con prompt engineering o RAG."
  },
  {
    "id": "M13",
    "section": "Mindset",
    "dimension": "mindset",
    "type": "likert",
    "text": "Sono disposto a mettere in discussione sia il mio scetticismo sia il mio entusiasmo quando i risultati dell'AI non li confermano.",
    "hint": "Il mindset maturo resta ancorato a evidenze e apprendimento."
  },
  {
    "id": "P_M_2",
    "section": "Practical Lab",
    "dimension": "mindset",
    "type": "choice",
    "text": "Dopo un mese di sperimentazione AI, i risultati sono disomogenei. Qual è il passo più utile?",
    "hint": "Scegli l'azione che trasforma esperienza sparsa in apprendimento.",
    "options": [
      {
        "score": 1,
        "title": "Interrompere tutto",
        "text": "I risultati non uniformi vengono letti come fallimento definitivo."
      },
      {
        "score": 2,
        "title": "Continuare senza cambiare metodo",
        "text": "Si accumulano tentativi ma non apprendimento."
      },
      {
        "score": 3,
        "title": "Usare solo i casi riusciti",
        "text": "Utile, ma rischia di ignorare condizioni e limiti."
      },
      {
        "score": 4,
        "title": "Raccogliere pattern di successo e fallimento",
        "text": "Si inizia a capire quando l'AI funziona."
      },
      {
        "score": 5,
        "title": "Definire playbook, metriche e casi esclusi",
        "text": "Si trasforma la sperimentazione in metodo operativo condivisibile."
      }
    ],
    "feedback": "Un buon mindset non cerca successo uniforme immediato: costruisce criteri, playbook e limiti d'uso."
  },
  {
    "id": "AG1",
    "section": "AI Agents",
    "dimension": "literacy",
    "type": "likert",
    "text": "Distinguo tra chatbot, automazione tradizionale, RAG e agente AI che può pianificare passi e usare strumenti.",
    "hint": "Conta capire quando l’AI risponde, quando recupera informazioni e quando può eseguire azioni."
  },
  {
    "id": "AG2",
    "section": "AI Agents",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Quale caratteristica distingue meglio un agente AI da una normale chat con un LLM?",
    "hint": "Scegli la descrizione più operativa.",
    "options": [
      {
        "score": 1,
        "title": "Risponde sempre con testi più lunghi",
        "text": "La lunghezza dell’output non definisce un agente."
      },
      {
        "score": 5,
        "title": "Può usare strumenti e gestire passi verso un obiettivo",
        "text": "Un agente combina modello, istruzioni, stato, strumenti e criteri di avanzamento."
      },
      {
        "score": 2,
        "title": "Ha sempre accesso a tutto il web",
        "text": "L’accesso a strumenti o fonti dipende dalla configurazione."
      },
      {
        "score": 1,
        "title": "È necessariamente autonomo senza supervisione",
        "text": "Molti agenti richiedono approvazioni umane e limiti stretti."
      }
    ],
    "feedback": "Un agente non è solo una risposta testuale: è un sistema che può orchestrare passaggi, strumenti e stato sotto vincoli definiti."
  },
  {
    "id": "AG3",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "scenario",
    "text": "Un team propone un agente per gestire automaticamente richieste clienti complesse. Qual è il primo controllo di progettazione?",
    "hint": "Valuta se il task è davvero delegabile a un agente.",
    "options": [
      {
        "score": 1,
        "title": "Attivarlo subito sui casi reali",
        "text": "Si salta la definizione di perimetro e rischio."
      },
      {
        "score": 2,
        "title": "Dargli un prompt molto dettagliato",
        "text": "Il prompt aiuta, ma non basta per governare azioni e dati."
      },
      {
        "score": 3,
        "title": "Far partire solo i casi più frequenti",
        "text": "Riduce la complessità, ma non chiarisce limiti e responsabilità."
      },
      {
        "score": 4,
        "title": "Mappare task, dati, strumenti e casi esclusi",
        "text": "Crea una base controllabile per decidere il livello di automazione."
      },
      {
        "score": 5,
        "title": "Definire perimetro, approvazioni, metriche, log e fallback",
        "text": "Stabilisce cosa l’agente può fare, quando fermarsi e quando escalare."
      }
    ],
    "feedback": "La delega agentica richiede confini, strumenti, dati, criteri di successo, fallback e responsabilità prima dell’automazione."
  },
  {
    "id": "AG4",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "multi",
    "text": "Vuoi usare un agente che legge ticket e aggiorna il CRM. Quali vincoli imposti prima di abilitarlo?",
    "hint": "Seleziona controlli su dati, azioni e tracciabilità.",
    "minSelected": 3,
    "options": [
      {
        "score": 2,
        "title": "Permessi minimi sugli strumenti",
        "text": "L’agente deve poter fare solo ciò che serve."
      },
      {
        "score": 2,
        "title": "Approvazione umana per modifiche sensibili",
        "text": "Le azioni ad alto impatto restano supervisionate."
      },
      {
        "score": 1,
        "title": "Log delle letture e delle modifiche",
        "text": "La tracciabilità rende auditabile il comportamento."
      },
      {
        "score": 1,
        "title": "Regole di stop ed escalation",
        "text": "L’agente deve fermarsi davanti a casi ambigui o rischiosi."
      },
      {
        "score": 1,
        "title": "Test su dati rappresentativi ma controllati",
        "text": "Prima si prova il flusso in condizioni sicure."
      },
      {
        "score": -2,
        "title": "Accesso completo per evitare blocchi",
        "text": "Aumenta il rischio e rende meno controllabile l’agente."
      },
      {
        "score": -2,
        "title": "Nessun log per proteggere la velocità",
        "text": "La velocità non giustifica l’assenza di audit."
      }
    ],
    "feedback": "Un agente operativo richiede permessi minimi, approvazioni, log, stop condition e test controllati."
  },
  {
    "id": "AG5",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "description",
    "type": "likert",
    "text": "Quando progetto un agente, definisco obiettivo, strumenti disponibili, vincoli, output intermedi e condizioni di arresto.",
    "hint": "Un brief agentico deve descrivere processo e controlli, non solo risultato finale."
  },
  {
    "id": "AG6",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "scenario",
    "text": "Un agente può inviare email ai clienti. Quale configurazione è più prudente all’avvio?",
    "hint": "Considera impatto esterno e possibilità di recupero.",
    "options": [
      {
        "score": 1,
        "title": "Invio automatico di tutte le email",
        "text": "Espone subito clienti e organizzazione a errori non filtrati."
      },
      {
        "score": 2,
        "title": "Invio automatico se il testo è sicuro nel tono",
        "text": "Il tono non misura correttezza o opportunità."
      },
      {
        "score": 3,
        "title": "Bozze automatiche e controllo a campione",
        "text": "Riduce il rischio ma può lasciare passare casi critici."
      },
      {
        "score": 4,
        "title": "Bozze con approvazione per destinatari esterni",
        "text": "Mantiene controllo umano sulle comunicazioni a impatto."
      },
      {
        "score": 5,
        "title": "Bozze, checklist, soglie di rischio e blocco dei casi incerti",
        "text": "Combina efficienza, verifica e fallback."
      }
    ],
    "feedback": "Le azioni esterne richiedono livelli di autonomia progressivi e approvazioni proporzionate al rischio."
  },
  {
    "id": "AG7",
    "section": "AI Agents",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Che cosa significa, in pratica, dare strumenti a un agente AI?",
    "hint": "Pensa a ciò che il sistema può fare oltre generare testo.",
    "options": [
      {
        "score": 1,
        "title": "Aumentare automaticamente la sua intelligenza generale",
        "text": "Gli strumenti ampliano le azioni possibili, non garantiscono giudizio migliore."
      },
      {
        "score": 5,
        "title": "Consentirgli di chiamare funzioni o servizi entro permessi definiti",
        "text": "Può cercare, leggere, scrivere o attivare procedure se autorizzato."
      },
      {
        "score": 2,
        "title": "Renderlo capace di verificare sempre ogni risposta",
        "text": "La verifica dipende da strumenti, fonti e criteri impostati."
      },
      {
        "score": 1,
        "title": "Eliminare la necessità di istruzioni",
        "text": "Più strumenti richiedono istruzioni e limiti più chiari."
      }
    ],
    "feedback": "Tool use significa collegare l’agente a funzioni o servizi governati da permessi, input, output e controlli."
  },
  {
    "id": "AG8",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "scenario",
    "text": "Un agente continua a riprovare lo stesso passaggio e consuma tempo senza migliorare il risultato. Che cosa fai?",
    "hint": "Valuta loop, criteri di stop e osservabilità.",
    "options": [
      {
        "score": 1,
        "title": "Lo lascio continuare",
        "text": "Il loop può consumare risorse e amplificare errori."
      },
      {
        "score": 2,
        "title": "Gli chiedo di impegnarsi di più",
        "text": "Non cambia criteri o informazioni disponibili."
      },
      {
        "score": 3,
        "title": "Riavvio la sessione",
        "text": "Può sbloccare il caso ma non risolve la causa."
      },
      {
        "score": 4,
        "title": "Analizzo log e passaggi falliti",
        "text": "Capisco dove mancano dati, strumenti o criteri."
      },
      {
        "score": 5,
        "title": "Applico stop condition, diagnosi e fallback umano",
        "text": "Interrompo il loop e trasformo l’errore in regola operativa."
      }
    ],
    "feedback": "Gli agenti richiedono osservabilità e criteri di arresto: non basta aspettare che il processo migliori da solo."
  },
  {
    "id": "AG9",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "multi",
    "text": "Quali informazioni dovrebbero essere tracciate per rendere auditabile un agente?",
    "hint": "Seleziona ciò che consente di ricostruire decisioni e azioni.",
    "minSelected": 3,
    "options": [
      {
        "score": 2,
        "title": "Input ricevuti e fonti consultate",
        "text": "Servono per capire il contesto usato."
      },
      {
        "score": 2,
        "title": "Strumenti chiamati e parametri usati",
        "text": "Rende verificabili le azioni operative."
      },
      {
        "score": 1,
        "title": "Output intermedi e motivazioni",
        "text": "Aiuta a diagnosticare errori e assunzioni."
      },
      {
        "score": 1,
        "title": "Approvazioni umane e override",
        "text": "Mostra dove la responsabilità è stata esercitata."
      },
      {
        "score": 1,
        "title": "Errori, blocchi e fallback",
        "text": "Permette miglioramento e gestione del rischio."
      },
      {
        "score": -2,
        "title": "Solo il risultato finale",
        "text": "Non basta per ricostruire il comportamento."
      },
      {
        "score": -1,
        "title": "Niente log per evitare complessità",
        "text": "Riduce controllo e accountability."
      }
    ],
    "feedback": "Un agente auditabile conserva tracce di input, strumenti, output intermedi, approvazioni, errori e fallback."
  },
  {
    "id": "AG10",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "description",
    "type": "text",
    "text": "Scrivi il prompt/brief che useresti per configurare un agente che analizza ticket di assistenza e propone aggiornamenti a una knowledge base, senza pubblicare modifiche non approvate.",
    "hint": "Includi obiettivo, strumenti, limiti, approvazioni e formato degli output.",
    "minChars": 120,
    "proceedChars": 1,
    "rubric": {
      "criteria": [
        {
          "label": "Obiettivo e ambito",
          "points": 1,
          "keywords": [
            "obiettivo",
            "ambito",
            "ticket",
            "knowledge base",
            "kb"
          ]
        },
        {
          "label": "Strumenti e fonti",
          "points": 1,
          "keywords": [
            "strumenti",
            "fonti",
            "ticket",
            "base conoscenza",
            "knowledge"
          ]
        },
        {
          "label": "Limiti di azione",
          "points": 1,
          "keywords": [
            "non pubblicare",
            "non modificare",
            "solo proposta",
            "permessi",
            "limiti"
          ]
        },
        {
          "label": "Approvazione umana",
          "points": 1,
          "keywords": [
            "approvazione",
            "revisione",
            "umano",
            "validazione"
          ]
        },
        {
          "label": "Formato output",
          "points": 1,
          "keywords": [
            "formato",
            "tabella",
            "diff",
            "proposta",
            "priorita",
            "priorità"
          ]
        },
        {
          "label": "Controlli e stop",
          "points": 1,
          "keywords": [
            "controll",
            "log",
            "stop",
            "escalation",
            "incert"
          ]
        }
      ],
      "redFlags": [
        {
          "label": "pubblicazione automatica",
          "points": 1,
          "keywords": [
            "pubblica direttamente",
            "modifica automaticamente",
            "senza approvazione"
          ]
        },
        {
          "label": "delega cieca",
          "points": 1,
          "keywords": [
            "decidi tu",
            "fai tutto",
            "senza log"
          ]
        }
      ]
    },
    "feedback": "Un brief agentico deve governare strumenti, limiti, output intermedi, approvazioni e condizioni di stop."
  },
  {
    "id": "AG11",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "scenario",
    "text": "Un agente può approvare rimborsi sotto una certa soglia. Quale controllo è più importante?",
    "hint": "Considera impatto economico, abuso e casi limite.",
    "options": [
      {
        "score": 1,
        "title": "Lasciarlo approvare tutti i casi sotto soglia",
        "text": "La soglia economica da sola non copre frodi o eccezioni."
      },
      {
        "score": 2,
        "title": "Chiedere una spiegazione dopo l’approvazione",
        "text": "La tracciabilità ex post non previene errori critici."
      },
      {
        "score": 3,
        "title": "Controllare solo i rimborsi più alti",
        "text": "Riduce il rischio economico ma ignora pattern anomali."
      },
      {
        "score": 4,
        "title": "Usare regole, campionamento e blocco anomalie",
        "text": "Combina automazione e controllo."
      },
      {
        "score": 5,
        "title": "Soglie, segnali antifrode, approvazioni e audit periodico",
        "text": "Governa autonomia, eccezioni e responsabilità."
      }
    ],
    "feedback": "L’autonomia agentica su azioni economiche richiede soglie, eccezioni, audit e approvazioni proporzionate."
  },
  {
    "id": "AG12",
    "section": "AI Agents",
    "dimension": "literacy",
    "sub": "technical",
    "type": "knowledge",
    "text": "Perché memoria e stato sono delicati in un agente AI?",
    "hint": "Pensa a continuità operativa e propagazione degli errori.",
    "options": [
      {
        "score": 1,
        "title": "Perché rendono impossibili gli errori",
        "text": "Memoria e stato possono anche conservare assunzioni sbagliate."
      },
      {
        "score": 5,
        "title": "Perché influenzano azioni successive e vanno governati",
        "text": "Stato, memoria e contesto possono propagare decisioni o dati errati."
      },
      {
        "score": 2,
        "title": "Perché sostituiscono i log",
        "text": "Memoria operativa e log di audit sono concetti diversi."
      },
      {
        "score": 1,
        "title": "Perché eliminano la necessità di permessi",
        "text": "I permessi restano necessari anche con memoria persistente."
      }
    ],
    "feedback": "Lo stato di un agente influenza passaggi successivi: va reso visibile, limitato e correggibile."
  },
  {
    "id": "AG13",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "discernment",
    "type": "choice",
    "text": "Quale metrica è più utile per valutare un agente operativo, oltre al risultato finale?",
    "hint": "Scegli una metrica che faccia emergere qualità del processo.",
    "options": [
      {
        "score": 1,
        "title": "Numero di parole generate",
        "text": "Non misura qualità né controllo."
      },
      {
        "score": 2,
        "title": "Velocità media senza distinzione dei casi",
        "text": "La velocità va letta insieme a errori, escalation e rischio."
      },
      {
        "score": 3,
        "title": "Gradimento soggettivo degli utenti",
        "text": "Utile, ma insufficiente da solo."
      },
      {
        "score": 4,
        "title": "Tasso di successo con errori ed escalation",
        "text": "Misura risultato e necessità di intervento."
      },
      {
        "score": 5,
        "title": "Successo, errori, tool call, escalation, rollback e impatto",
        "text": "Osserva l’intero workflow agentico."
      }
    ],
    "feedback": "Un agente va valutato sui passaggi: azioni, errori, escalation, rollback e impatto, non solo sull’output finale."
  },
  {
    "id": "AG14",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "delegation",
    "type": "likert",
    "text": "So scomporre un processo in passaggi che un agente può eseguire, passaggi da approvare e passaggi da lasciare alla persona.",
    "hint": "La competenza agentica include disegnare autonomia progressiva e punti di controllo."
  },
  {
    "id": "AG15",
    "section": "AI Agents",
    "dimension": "fluency",
    "sub": "diligence",
    "type": "multi",
    "text": "Prima di collegare un agente a sistemi aziendali, quali controlli fai su credenziali e accessi?",
    "hint": "Seleziona le pratiche che riducono il rischio operativo.",
    "minSelected": 3,
    "options": [
      {
        "score": 2,
        "title": "Account o token dedicati e revocabili",
        "text": "Consentono controllo e disattivazione rapida."
      },
      {
        "score": 2,
        "title": "Permessi minimi per singolo strumento",
        "text": "Limita l’impatto di errori o abuso."
      },
      {
        "score": 1,
        "title": "Segreti non inseriti nel prompt",
        "text": "Le credenziali vanno gestite fuori dal testo libero."
      },
      {
        "score": 1,
        "title": "Monitoraggio e alert sulle azioni",
        "text": "Aiuta a rilevare comportamenti anomali."
      },
      {
        "score": 1,
        "title": "Procedura di revoca e rollback",
        "text": "Serve per reagire rapidamente."
      },
      {
        "score": -2,
        "title": "Usare le credenziali personali dell’utente",
        "text": "Mescola responsabilità e aumenta l’esposizione."
      },
      {
        "score": -2,
        "title": "Dare accesso amministratore per semplicità",
        "text": "Viola il principio del minimo privilegio."
      }
    ],
    "feedback": "Credenziali e accessi degli agenti devono essere dedicati, limitati, monitorati e revocabili."
  }
];

export const FORM_IDS = ['A', 'B', 'C'] as const;
export type FormId = typeof FORM_IDS[number];

export const FORM_OVERRIDES: Record<string, Record<string, Partial<AssessQuestion>>> = {
  "B": {
    "L1": {
      "text": "Quando qualcuno mi chiede come funziona un LLM, riesco a descrivere il principio di previsione dei token e i motivi per cui una risposta può essere plausibile ma errata.",
      "hint": "Valuta ciò che sapresti spiegare senza consultare materiale esterno."
    },
    "L2": {
      "text": "Quando uso una chat AI, distinguo ciò che il modello ha appreso in addestramento da ciò che riceve nel prompt, nei file allegati o tramite strumenti esterni.",
      "hint": "Considera il tuo comportamento nelle normali sessioni di lavoro."
    },
    "L3": {
      "text": "Riconosco i segnali che rendono un output AI da verificare, anche quando il testo è fluido, dettagliato e sicuro nel tono.",
      "hint": "Pensa a dati, citazioni, nomi, date e affermazioni non tracciabili."
    },
    "L4": {
      "text": "So decidere quando una normale conversazione con un LLM non basta e occorrono ricerca aggiornata, documenti controllati o recupero da una base conoscitiva.",
      "hint": "Valuta la capacità di scegliere l’architettura informativa adatta al compito."
    },
    "L5": {
      "text": "Prima di inserire informazioni in uno strumento AI, valuto classificazione dei dati, condizioni d’uso, autorizzazioni e possibili vincoli di proprietà intellettuale.",
      "hint": "Non è richiesta competenza legale specialistica, ma consapevolezza operativa."
    },
    "L6": {
      "text": "Devi preparare una nota su uno standard tecnico che potrebbe essere stato revisionato di recente. Come procedi?",
      "hint": "Scegli il comportamento più vicino a quello che adotteresti davvero.",
      "options": [
        {
          "score": 2,
          "title": "Chiedo al modello la versione più recente",
          "text": "Mi affido alla data indicata nella risposta."
        },
        {
          "score": 4,
          "title": "Recupero la versione ufficiale e poi uso l’AI",
          "text": "Fornisco il testo aggiornato e controllo i riferimenti."
        },
        {
          "score": 1,
          "title": "Uso una sintesi già pronta trovata in chat",
          "text": "La forma professionale mi sembra sufficiente."
        },
        {
          "score": 5,
          "title": "Separo reperimento, confronto e sintesi",
          "text": "Verifico ente, revisione, ambito, differenze e citazioni prima dell’uso."
        },
        {
          "score": 3,
          "title": "Genero una bozza e verifico i passaggi principali",
          "text": "Controllo alcuni requisiti, ma non costruisco una tracciabilità completa."
        }
      ],
      "feedback": "Su contenuti soggetti a revisione, la qualità dipende dalla fonte ufficiale, dalla versione e dal campo di applicazione."
    },
    "L7": {
      "text": "Vuoi usare l’AI per analizzare ticket di assistenza che includono nomi, indirizzi e dettagli contrattuali. Qual è la prima impostazione corretta?",
      "hint": "Considera insieme utilità, minimizzazione, autorizzazione e tracciabilità.",
      "options": [
        {
          "score": 3,
          "title": "Rimuovo i nomi più evidenti e inizio",
          "text": "Riduco alcuni identificativi senza verificare l’intero flusso."
        },
        {
          "score": 1,
          "title": "Carico il dataset nello strumento che uso di solito",
          "text": "Il valore dell’analisi giustifica il caricamento."
        },
        {
          "score": 5,
          "title": "Definisco un flusso autorizzato e minimizzato",
          "text": "Stabilisco finalità, dati necessari, ambiente approvato, accessi e controlli."
        },
        {
          "score": 2,
          "title": "Uso solo i ticket meno recenti",
          "text": "L’età dei dati mi sembra sufficiente a ridurre il rischio."
        },
        {
          "score": 4,
          "title": "Verifico policy e preparo un campione anonimizzato",
          "text": "Uso uno strumento ammesso e controllo che il contenuto sia realmente necessario."
        }
      ],
      "feedback": "Il trattamento di dati operativi richiede un perimetro autorizzato; eliminare pochi identificativi non basta necessariamente."
    },
    "T1": {
      "text": "La parola “automazione” viene sempre trattata da ogni LLM come un unico token?",
      "hint": "Scegli l’affermazione tecnicamente più corretta.",
      "options": [
        {
          "score": 1,
          "title": "Sì, ogni parola corrisponde sempre a un token",
          "text": "La tokenizzazione non segue necessariamente i confini delle parole."
        },
        {
          "score": 5,
          "title": "No, può essere suddivisa diversamente dal tokenizer",
          "text": "Token diversi possono rappresentare parole intere, parti di parola, spazi o punteggiatura."
        },
        {
          "score": 2,
          "title": "No, perché ogni lettera è sempre un token",
          "text": "Alcuni sistemi possono usare frammenti molto piccoli, ma non esiste questa regola generale."
        },
        {
          "score": 3,
          "title": "Dipende solo dalla lingua usata nel prompt",
          "text": "La lingua incide, ma conta anche il tokenizer specifico del modello."
        }
      ],
      "feedback": "Un token è un’unità definita dal tokenizer; non coincide sempre con una parola e può variare tra modelli."
    },
    "T2": {
      "text": "Dopo aver generato un token della risposta, che cosa fa normalmente un LLM autoregressivo?",
      "hint": "La domanda riguarda il ciclo di generazione.",
      "options": [
        {
          "score": 5,
          "title": "Aggiunge il token al contesto e stima il successivo",
          "text": "La sequenza viene costruita passo dopo passo fino alla condizione di arresto."
        },
        {
          "score": 1,
          "title": "Consulta automaticamente una fonte esterna",
          "text": "La generazione di base non implica una ricerca sul web o in un database."
        },
        {
          "score": 2,
          "title": "Riscrive tutti i pesi del modello",
          "text": "I pesi non vengono normalmente aggiornati durante la singola risposta."
        },
        {
          "score": 3,
          "title": "Completa internamente l’intero testo e poi lo mostra",
          "text": "L’output è in genere prodotto in modo sequenziale, anche se l’interfaccia può visualizzarlo a blocchi."
        }
      ],
      "feedback": "La generazione autoregressiva usa la sequenza disponibile per stimare il token successivo e ripete il processo."
    },
    "T3": {
      "text": "In quale fase vengono normalmente modificati i pesi di un modello linguistico?",
      "hint": "Distingui apprendimento del modello e uso del modello.",
      "options": [
        {
          "score": 5,
          "title": "Durante addestramento o successive procedure di adattamento",
          "text": "L’ottimizzazione aggiorna i parametri sulla base dei dati e dell’obiettivo."
        },
        {
          "score": 1,
          "title": "Ogni volta che un utente invia un prompt",
          "text": "La normale inferenza non comporta automaticamente un aggiornamento dei pesi."
        },
        {
          "score": 2,
          "title": "Solo quando il modello produce una risposta sbagliata",
          "text": "L’errore della singola chat non attiva di per sé un nuovo addestramento."
        },
        {
          "score": 3,
          "title": "Quando si allega un documento alla conversazione",
          "text": "Il documento può entrare nel contesto senza modificare stabilmente il modello."
        }
      ],
      "feedback": "L’addestramento modifica i parametri; l’inferenza usa i parametri già disponibili per produrre un output."
    },
    "T4": {
      "text": "Carichi un manuale in una normale chat e chiedi una sintesi. Che cosa accade in generale?",
      "hint": "Considera il comportamento tipico, salvo funzioni esplicite del servizio.",
      "options": [
        {
          "score": 5,
          "title": "Il contenuto viene usato come contesto della sessione",
          "text": "Non significa automaticamente che i pesi del modello vengano aggiornati con quel manuale."
        },
        {
          "score": 1,
          "title": "Il manuale entra immediatamente nell’addestramento globale",
          "text": "L’uso in chat e l’addestramento sono processi distinti."
        },
        {
          "score": 2,
          "title": "Il modello memorizza permanentemente ogni pagina per tutti gli utenti",
          "text": "Non è la conseguenza generale di un allegato."
        },
        {
          "score": 3,
          "title": "Il file sostituisce temporaneamente i dati di addestramento",
          "text": "Il file aggiunge contesto, non rimpiazza il modello preesistente."
        }
      ],
      "feedback": "Un allegato può essere elaborato nel contesto; trattamento, conservazione e uso ulteriore dipendono dal servizio e dalle sue impostazioni."
    },
    "T5": {
      "text": "Una conversazione molto lunga supera la finestra di contesto del modello. Quale conseguenza è plausibile?",
      "hint": "La finestra di contesto è una capacità limitata.",
      "options": [
        {
          "score": 5,
          "title": "Parte del contenuto meno recente può non essere più disponibile al modello",
          "text": "Il sistema può troncare, riassumere o gestire diversamente i messaggi oltre il limite."
        },
        {
          "score": 1,
          "title": "Il modello espande automaticamente la propria memoria permanente",
          "text": "Il limite di contesto non crea nuova memoria stabile."
        },
        {
          "score": 2,
          "title": "La risposta diventa necessariamente più accurata",
          "text": "Più testo non implica più qualità e può introdurre rumore."
        },
        {
          "score": 3,
          "title": "Vengono cancellati i pesi appresi in addestramento",
          "text": "La finestra riguarda l’input elaborabile, non i parametri del modello."
        }
      ],
      "feedback": "La finestra di contesto limita la quantità di token che il modello può considerare nello stesso ciclo di elaborazione."
    },
    "T6": {
      "text": "Quale affermazione descrive meglio ciò che una rete neurale apprende?",
      "hint": "Scegli la descrizione generale, non una metafora letterale.",
      "options": [
        {
          "score": 5,
          "title": "Regola molti parametri per rappresentare pattern nei dati",
          "text": "I pesi vengono ottimizzati per ridurre un errore rispetto a un obiettivo."
        },
        {
          "score": 1,
          "title": "Archivia un elenco completo di risposte corrette",
          "text": "Una rete non è semplicemente un database di frasi precompilate."
        },
        {
          "score": 2,
          "title": "Segue soltanto regole scritte manualmente per ogni caso",
          "text": "Le regole possono far parte di altri sistemi, ma non descrivono l’apprendimento neurale in generale."
        },
        {
          "score": 3,
          "title": "Replica il cervello umano in modo biologicamente fedele",
          "text": "Il nome è ispirato alla biologia, ma il modello è una costruzione matematica semplificata."
        }
      ],
      "feedback": "Una rete neurale è un modello parametrico che apprende regolarità attraverso l’ottimizzazione dei pesi."
    },
    "T7": {
      "text": "Perché il meccanismo di attention è utile nell’elaborazione di una frase?",
      "hint": "Pensa alle relazioni tra elementi della sequenza.",
      "options": [
        {
          "score": 5,
          "title": "Permette di pesare quali token sono più rilevanti tra loro",
          "text": "Il modello costruisce rappresentazioni dipendenti dal contesto."
        },
        {
          "score": 1,
          "title": "Controlla se ogni affermazione è vera su Internet",
          "text": "L’attention non è un motore di verifica fattuale."
        },
        {
          "score": 2,
          "title": "Conserva per sempre tutte le conversazioni",
          "text": "Non è un meccanismo di memoria permanente."
        },
        {
          "score": 3,
          "title": "Trasforma automaticamente il testo in una regola aziendale",
          "text": "Organizza relazioni nel contesto, non determina la validità organizzativa."
        }
      ],
      "feedback": "L’attention calcola relazioni tra posizioni della sequenza e aiuta a interpretare un token in funzione del contesto."
    },
    "T8": {
      "text": "Il modello cita un articolo con titolo plausibile, rivista credibile e autore inesistente. Come si classifica questo output?",
      "hint": "La forma dettagliata non determina la veridicità.",
      "options": [
        {
          "score": 5,
          "title": "È un’allucinazione fattuale",
          "text": "Il modello ha prodotto un’informazione plausibile ma non corrispondente a una fonte reale."
        },
        {
          "score": 1,
          "title": "È una citazione valida perché contiene tutti i campi",
          "text": "Completezza formale e autenticità sono cose diverse."
        },
        {
          "score": 2,
          "title": "È un semplice errore di formattazione",
          "text": "Il problema riguarda l’esistenza della fonte, non il formato."
        },
        {
          "score": 3,
          "title": "È una previsione statistica e quindi va considerata vera",
          "text": "La natura probabilistica non conferisce validità fattuale."
        }
      ],
      "feedback": "Un’allucinazione può assumere una forma molto credibile; occorre verificare l’esistenza e il contenuto della fonte."
    },
    "T9": {
      "text": "Un assistente aziendale cerca prima passaggi pertinenti in procedure approvate e poi li fornisce all’LLM per rispondere. Quale tecnica sta usando?",
      "hint": "Individua il meccanismo principale.",
      "options": [
        {
          "score": 5,
          "title": "Retrieval-Augmented Generation",
          "text": "Il recupero di contenuti precede e supporta la generazione."
        },
        {
          "score": 1,
          "title": "Addestramento completo del modello a ogni domanda",
          "text": "La ricerca non richiede di riaddestrare i pesi per ogni richiesta."
        },
        {
          "score": 2,
          "title": "Solo prompting senza fonti",
          "text": "Qui è presente un recupero esplicito da una base documentale."
        },
        {
          "score": 3,
          "title": "Compressione lossless dei documenti",
          "text": "L’obiettivo non è comprimere i file, ma recuperare passaggi rilevanti."
        }
      ],
      "feedback": "Nel RAG, documenti o passaggi vengono recuperati e inseriti nel contesto; la risposta resta comunque da valutare."
    },
    "T10": {
      "text": "Sistemi esperti, ricerca simbolica e machine learning esistevano prima della diffusione degli LLM?",
      "hint": "La domanda riguarda la storia dell’AI.",
      "options": [
        {
          "score": 5,
          "title": "Sì, sono filoni precedenti agli LLM moderni",
          "text": "L’intelligenza artificiale comprende decenni di approcci differenti."
        },
        {
          "score": 1,
          "title": "No, l’AI è nata con i chatbot generativi",
          "text": "Gli LLM sono una fase recente di una storia molto più lunga."
        },
        {
          "score": 2,
          "title": "Esisteva solo la statistica, non l’AI",
          "text": "Molti sistemi erano già esplicitamente studiati e descritti come AI."
        },
        {
          "score": 3,
          "title": "Esistevano solo robot industriali senza software intelligente",
          "text": "La ricerca AI includeva già ragionamento, apprendimento e rappresentazione della conoscenza."
        }
      ],
      "feedback": "Gli LLM non coincidono con l’intero campo dell’AI; sono una famiglia recente di modelli."
    },
    "T11": {
      "text": "Una risposta AI contiene tre date e due riferimenti che influenzano una decisione. Qual è il controllo più solido?",
      "hint": "Valuta il processo, non la sola richiesta al modello.",
      "options": [
        {
          "score": 5,
          "title": "Verifico ogni elemento critico su fonti affidabili e tracciabili",
          "text": "Mantengo evidenza delle fonti e segnalo ciò che resta incerto."
        },
        {
          "score": 1,
          "title": "Chiedo al modello di ricontrollarsi",
          "text": "Una seconda formulazione dello stesso sistema non è una verifica indipendente."
        },
        {
          "score": 2,
          "title": "Accetto i riferimenti se il testo è coerente",
          "text": "Coerenza narrativa e correttezza fattuale non coincidono."
        },
        {
          "score": 3,
          "title": "Elimino solo i dettagli che sembrano strani",
          "text": "La plausibilità personale non è un criterio sufficiente."
        }
      ],
      "feedback": "La verifica deve essere proporzionata all’impatto e appoggiarsi a fonti o controlli indipendenti."
    },
    "T12": {
      "text": "In una ricerca semantica, a che cosa serve un embedding?",
      "hint": "Pensa a come testi diversi vengono confrontati per significato.",
      "options": [
        {
          "score": 5,
          "title": "Rappresenta il contenuto come vettore confrontabile",
          "text": "La vicinanza tra vettori può aiutare a recuperare elementi semanticamente simili."
        },
        {
          "score": 1,
          "title": "Certifica che il testo sia vero",
          "text": "La somiglianza semantica non è una prova fattuale."
        },
        {
          "score": 2,
          "title": "Converte sempre il testo in una frase più corta",
          "text": "Un embedding non è un riassunto leggibile."
        },
        {
          "score": 3,
          "title": "Cifra il documento rendendolo sicuro",
          "text": "Una rappresentazione vettoriale non equivale a una misura di sicurezza."
        }
      ],
      "feedback": "Gli embedding sono rappresentazioni numeriche utili, tra l’altro, per similarità e recupero semantico."
    },
    "TR_CITE": {
      "text": "Un LLM indica con sicurezza il numero esatto di una clausola contrattuale e ne riporta il testo tra virgolette. Che cosa dimostra questo dettaglio?",
      "hint": "Attribuisci al dettaglio il suo reale valore probatorio.",
      "options": [
        {
          "score": 5,
          "title": "Nulla sulla correttezza finché non confronto il contratto originale",
          "text": "Numero e citazione possono essere generati in modo plausibile ma errato."
        },
        {
          "score": 1,
          "title": "La clausola è certamente presente perché è numerata",
          "text": "La precisione formale non prova l’esistenza."
        },
        {
          "score": 2,
          "title": "Il modello ha accesso al contratto anche se non gliel’ho fornito",
          "text": "Non si può dedurre l’accesso a una fonte dal tono della risposta."
        },
        {
          "score": 3,
          "title": "La citazione è abbastanza affidabile se sembra scritta in stile legale",
          "text": "Lo stile non sostituisce la verifica sul documento."
        }
      ],
      "feedback": "Un riferimento estremamente specifico può aumentare la credibilità percepita senza aumentare l’evidenza."
    },
    "AG1": {
      "text": "Riconosco quando un flusso richiede solo una chat, quando basta un'automazione e quando serve un agente con strumenti, stato e criteri di controllo.",
      "hint": "Valuta se distingui risposta testuale, recupero di informazioni e azione governata."
    },
    "AG2": {
      "text": "Un agente deve completare un compito con più passaggi e possibili eccezioni. Che cosa lo rende diverso da un prompt singolo?",
      "hint": "Scegli la caratteristica più legata al funzionamento operativo.",
      "options": [
        {
          "score": 2,
          "title": "Produce testi più creativi",
          "text": "La creatività non definisce un agente."
        },
        {
          "score": 5,
          "title": "Mantiene stato, usa strumenti e avanza verso un obiettivo",
          "text": "Il workflow agentico combina istruzioni, contesto, tool e regole di avanzamento."
        },
        {
          "score": 1,
          "title": "Non ha bisogno di istruzioni",
          "text": "Più autonomia richiede istruzioni e limiti più chiari."
        },
        {
          "score": 2,
          "title": "Conosce sempre informazioni aggiornate",
          "text": "L'aggiornamento dipende dagli strumenti e dalle fonti disponibili."
        }
      ],
      "feedback": "Un agente è utile quando deve orchestrare passaggi e strumenti sotto vincoli espliciti, non quando serve soltanto una risposta più lunga."
    },
    "AG3": {
      "text": "Vuoi introdurre un agente che smista richieste dei fornitori e propone risposte operative. Qual è il primo passo più solido?",
      "hint": "Valuta delegabilità, dati e responsabilità.",
      "options": [
        {
          "score": 1,
          "title": "Lasciarlo rispondere direttamente ai fornitori",
          "text": "Si trasferisce impatto esterno senza controllo."
        },
        {
          "score": 2,
          "title": "Scrivere un prompt molto dettagliato",
          "text": "Il prompt non basta se mancano strumenti, log e limiti."
        },
        {
          "score": 3,
          "title": "Usarlo solo sulle richieste più semplici",
          "text": "Riduce il rischio ma non definisce il modello operativo."
        },
        {
          "score": 4,
          "title": "Mappare tipologie, dati, sistemi e casi esclusi",
          "text": "Costruisce il perimetro prima dell'autonomia."
        },
        {
          "score": 5,
          "title": "Definire permessi, approvazioni, metriche, log e fallback",
          "text": "Stabilisce autonomia progressiva e controllo umano."
        }
      ],
      "feedback": "La progettazione di un agente parte da perimetro, strumenti, autorizzazioni, criteri di stop e responsabilità."
    },
    "AG4": {
      "text": "Vuoi collegare un agente a fatture e sistema ERP per proporre aggiornamenti anagrafici. Quali vincoli imponi?",
      "hint": "Seleziona controlli su accessi, dati e modifiche.",
      "minSelected": 3,
      "options": [
        {
          "score": 2,
          "title": "Accesso in sola lettura dove possibile",
          "text": "Riduce l'impatto degli errori."
        },
        {
          "score": 2,
          "title": "Approvazione umana prima di scrivere nell'ERP",
          "text": "Le modifiche sui sistemi core restano controllate."
        },
        {
          "score": 1,
          "title": "Log di documenti letti, campi proposti e motivazione",
          "text": "Rende ricostruibile il comportamento."
        },
        {
          "score": 1,
          "title": "Regole di blocco per dati ambigui o incoerenti",
          "text": "Evita aggiornamenti su casi non affidabili."
        },
        {
          "score": 1,
          "title": "Test su ambiente o campione controllato",
          "text": "Permette di osservare errori prima della produzione."
        },
        {
          "score": -2,
          "title": "Permessi amministrativi per semplificare",
          "text": "Aumenta inutilmente il rischio operativo."
        },
        {
          "score": -2,
          "title": "Aggiornamenti automatici senza log",
          "text": "Elimina tracciabilità e controllo."
        }
      ],
      "feedback": "Un agente collegato a sistemi gestionali richiede minimo privilegio, approvazioni, log, stop condition e test controllati."
    },
    "F_DE_1": {
      "text": "Prima di coinvolgere l’AI, esplicito quali decisioni restano mie e quali passaggi possono essere automatizzati, proposti o soltanto supportati.",
      "hint": "Considera attività ricorrenti e decisioni ad impatto."
    },
    "F_DE_2": {
      "text": "Quando il lavoro è complesso, organizzo l’interazione in passaggi con input, output intermedi e punti di controllo.",
      "hint": "Valuta la stabilità del tuo metodo, non un singolo caso riuscito."
    },
    "F_DE_3": {
      "text": "Devi confrontare tre offerte di fornitori e formulare una raccomandazione. Come distribuisci il lavoro tra te e l’AI?",
      "hint": "Scegli il comportamento che adotteresti in pratica.",
      "options": [
        {
          "score": 3,
          "title": "Faccio estrarre prezzi e caratteristiche, poi scelgo",
          "text": "Uso il modello per una prima lettura ma non definisco criteri espliciti."
        },
        {
          "score": 5,
          "title": "Definisco criteri, faccio estrarre evidenze e controllo la matrice",
          "text": "L’AI supporta confronto e alternative; la raccomandazione resta motivata e revisionata."
        },
        {
          "score": 1,
          "title": "Carico le offerte e chiedo quale fornitore scegliere",
          "text": "Trasferisco la decisione finale senza un processo controllato."
        },
        {
          "score": 4,
          "title": "Chiedo una matrice comparativa con riferimenti alle offerte",
          "text": "Verifico dati, lacune e pesi prima di concludere."
        },
        {
          "score": 2,
          "title": "Chiedo tre riassunti e scelgo quello che sembra migliore",
          "text": "La sintesi aiuta, ma non rende confrontabili criteri e rischi."
        }
      ],
      "feedback": "Delegare bene significa separare estrazione, analisi, proposta e decisione, mantenendo evidenze e responsabilità."
    },
    "F_DS_1": {
      "text": "Nei prompt di lavoro definisco cosa deve essere prodotto, per chi, con quali informazioni, entro quali vincoli e secondo quali criteri di accettazione.",
      "hint": "Pensa alle richieste che usi realmente."
    },
    "F_DS_2": {
      "text": "Quando mancano dati, invito l’AI a porre domande o a rendere esplicite le assunzioni prima di produrre un risultato finale.",
      "hint": "Valuta come gestisci le ambiguità."
    },
    "F_DS_3": {
      "text": "L’AI risponde correttamente ma il risultato non è utilizzabile dal destinatario. Che cosa fai?",
      "hint": "Considera il modo in cui correggeresti l’incarico.",
      "options": [
        {
          "score": 4,
          "title": "Aggiungo destinatario, formato, priorità e criteri",
          "text": "Rendo esplicite le condizioni di utilizzo dell’output."
        },
        {
          "score": 1,
          "title": "Chiedo la stessa cosa a un altro chatbot",
          "text": "Cambio strumento senza diagnosticare il problema."
        },
        {
          "score": 5,
          "title": "Riformulo il brief e imposto una revisione per criteri",
          "text": "Chiedo chiarimenti iniziali, bozza, verifica e versione finale."
        },
        {
          "score": 2,
          "title": "Chiedo di essere più professionale",
          "text": "Intervengo soprattutto sul tono, non sulla struttura del compito."
        },
        {
          "score": 3,
          "title": "Fornisco un esempio del formato desiderato",
          "text": "Miglioro il riferimento, ma potrei lasciare impliciti vincoli e controlli."
        }
      ],
      "feedback": "Un output può essere corretto ma non adatto: la descrizione deve includere contesto d’uso e criteri di accettazione."
    },
    "TR_PROMPT": {
      "text": "Aggiungere “Agisci come il massimo esperto mondiale” rende automaticamente un prompt più affidabile?",
      "hint": "Valuta l’effetto reale della formula.",
      "options": [
        {
          "score": 5,
          "title": "No, il ruolo può orientare stile o prospettiva ma non sostituisce dati, vincoli e verifica",
          "text": "La qualità dipende dalla progettazione del compito e dal controllo dell’output."
        },
        {
          "score": 1,
          "title": "Sì, obbliga il modello ad accedere a conoscenze più accurate",
          "text": "La formula non conferisce nuove fonti né capacità di verifica."
        },
        {
          "score": 2,
          "title": "Sì, purché la frase sia scritta all’inizio",
          "text": "La posizione non trasforma il ruolo in una garanzia fattuale."
        },
        {
          "score": 3,
          "title": "È sufficiente per compiti semplici e complessi",
          "text": "Può essere un’indicazione utile, ma non definisce da sola il lavoro."
        }
      ],
      "feedback": "Il role prompting può influenzare il comportamento, ma non è una scorciatoia per accuratezza, completezza o responsabilità."
    },
    "F_DI_1": {
      "text": "Prima di riutilizzare un output, lo confronto con requisiti, fonti o esempi attesi invece di giudicarlo soltanto dalla scorrevolezza.",
      "hint": "Pensa ai controlli che esegui davvero."
    },
    "F_DI_2": {
      "text": "Quando due output AI propongono conclusioni diverse, cerco le assunzioni e le evidenze che spiegano la divergenza.",
      "hint": "Valuta la capacità di investigare, non solo di scegliere."
    },
    "F_DI_3": {
      "text": "L’AI produce un grafico con una tendenza convincente, ma non indica origine né trattamento dei dati. Come reagisci?",
      "hint": "Scegli la procedura più vicina al tuo comportamento.",
      "options": [
        {
          "score": 5,
          "title": "Richiedo dati, definizioni e metodo e ricostruisco il grafico",
          "text": "Tratto la visualizzazione come non verificata finché non è riproducibile."
        },
        {
          "score": 2,
          "title": "Lo uso dichiarando che è indicativo",
          "text": "La cautela nel testo non risolve l’assenza di dati."
        },
        {
          "score": 1,
          "title": "Lo uso perché la tendenza è plausibile",
          "text": "La plausibilità visiva non prova il risultato."
        },
        {
          "score": 4,
          "title": "Cerco il dataset e controllo aggregazioni e scala",
          "text": "Verifico che il grafico rappresenti correttamente la fonte."
        },
        {
          "score": 3,
          "title": "Chiedo al modello di aggiungere una fonte",
          "text": "È un passo utile, ma la fonte proposta va comunque controllata."
        }
      ],
      "feedback": "Una visualizzazione richiede tracciabilità di dati, definizioni, trasformazioni e scala."
    },
    "TR_SURE": {
      "text": "Due chatbot diversi forniscono la stessa risposta non citata. Questa concordanza rende il dato verificato?",
      "hint": "Considera l’indipendenza delle evidenze.",
      "options": [
        {
          "score": 5,
          "title": "No, possono condividere dati, pattern o errori; serve una fonte indipendente",
          "text": "La concordanza tra modelli è un indizio, non una verifica."
        },
        {
          "score": 1,
          "title": "Sì, due risposte uguali equivalgono a due fonti",
          "text": "I modelli non sono necessariamente fonti indipendenti."
        },
        {
          "score": 2,
          "title": "Sì, se entrambi usano un tono sicuro",
          "text": "Il tono non misura accuratezza né indipendenza."
        },
        {
          "score": 3,
          "title": "È sufficiente per un documento interno",
          "text": "Il livello di diffusione non elimina il bisogno di controllo quando il dato conta."
        }
      ],
      "feedback": "Confrontare modelli può far emergere differenze, ma una concordanza non sostituisce una fonte tracciabile."
    },
    "F_DG_1": {
      "text": "Quando uso output AI in un’attività rilevante, conservo abbastanza informazioni da ricostruire input, fonti, revisioni e decisione finale.",
      "hint": "Considera tracciabilità e responsabilità."
    },
    "F_DG_2": {
      "text": "Adatto il livello di trasparenza sull’uso dell’AI al rischio, alle regole applicabili e alle aspettative del destinatario.",
      "hint": "La trasparenza è una scelta contestuale da governare."
    },
    "F_DG_3": {
      "text": "Ricevi la trascrizione di una riunione con informazioni personali e strategiche e ti propongono di riassumerla su un servizio AI pubblico. Cosa fai?",
      "hint": "Valuta dati, autorizzazione e alternative operative.",
      "options": [
        {
          "score": 5,
          "title": "Definisco dati necessari e uso un ambiente autorizzato",
          "text": "Minimizzo, controllo accessi, conservazione e revisione del risultato."
        },
        {
          "score": 1,
          "title": "La carico perché la riunione è già avvenuta",
          "text": "Il fatto che i dati esistano non autorizza un nuovo trattamento."
        },
        {
          "score": 3,
          "title": "Elimino i nomi e uso il servizio",
          "text": "Riduce un rischio ma può lasciare contenuti identificabili o riservati."
        },
        {
          "score": 4,
          "title": "Verifico policy e preparo una versione realmente anonimizzata",
          "text": "Procedo solo se strumento e contenuto rientrano nel perimetro ammesso."
        },
        {
          "score": 2,
          "title": "Uso il mio account personale per non bloccare il lavoro",
          "text": "Sposta il trattamento fuori dai controlli organizzativi."
        }
      ],
      "feedback": "Trascrizioni e note possono contenere dati sensibili o strategici; serve un flusso autorizzato e minimizzato."
    },
    "M1": {
      "text": "Uso l’AI come supporto da dirigere e revisionare, senza attribuirle automaticamente autorità o intenzionalità.",
      "hint": "Valuta la tua impostazione abituale."
    },
    "M2": {
      "text": "Sono disposto a provare un nuovo uso dell’AI quando posso limitarne l’impatto, definire un criterio di successo e confrontare il risultato.",
      "hint": "Pensa a sperimentazioni concrete."
    },
    "M3": {
      "text": "Dopo un risultato insoddisfacente, analizzo il processo prima di concludere che lo strumento o il caso d’uso siano inutili.",
      "hint": "Considera come reagisci al primo fallimento."
    },
    "M4": {
      "text": "Accetto di modificare ruoli e passaggi di un processo se l’uso dell’AI produce benefici misurabili senza aumentare rischi non gestiti.",
      "hint": "Valuta apertura e condizioni del cambiamento."
    },
    "M5": {
      "text": "Riesco a mantenere contemporaneamente interesse per le opportunità e attenzione critica verso limiti ed effetti collaterali.",
      "hint": "Evita di pensare solo a entusiasmo o scetticismo."
    },
    "M6": {
      "text": "Quando scopro una pratica AI utile, condivido anche limiti, casi in cui non funziona e controlli necessari.",
      "hint": "La condivisione matura comprende le cautele."
    },
    "M7": {
      "text": "Rivedo periodicamente le mie conoscenze sull’AI invece di basarmi soltanto su ciò che ho imparato al primo utilizzo.",
      "hint": "Considera l’aggiornamento effettivo."
    },
    "M8": {
      "text": "Un collega afferma: “Tra poco l’AI farà tutto, quindi non vale la pena migliorare i processi”. Come rispondi?",
      "hint": "Scegli una reazione operativa.",
      "options": [
        {
          "score": 2,
          "title": "Concordo e aspetto strumenti più maturi",
          "text": "Rimando ogni miglioramento a un futuro incerto."
        },
        {
          "score": 5,
          "title": "Separo capacità reali, limiti e impatti sul processo",
          "text": "Propongo test misurati, ruoli chiari e revisione delle attività."
        },
        {
          "score": 1,
          "title": "Dico che l’AI sostituirà comunque chi non la usa",
          "text": "Uso una previsione come leva, senza progettare il lavoro."
        },
        {
          "score": 4,
          "title": "Propongo di analizzare task e colli di bottiglia",
          "text": "Individuo dove l’AI può supportare e dove serve ancora responsabilità umana."
        },
        {
          "score": 3,
          "title": "Suggerisco di usare più chatbot",
          "text": "Aumento l’uso senza collegarlo al miglioramento del processo."
        }
      ],
      "feedback": "Un mindset maturo evita sia fatalismo sia immobilismo e traduce le capacità attuali in esperimenti governati."
    },
    "M9": {
      "text": "Nel team diversi colleghi usano strumenti AI in modo autonomo, ma non esistono pratiche condivise. Quale iniziativa prendi?",
      "hint": "Valuta equilibrio tra apprendimento e governo.",
      "options": [
        {
          "score": 4,
          "title": "Raccolgo casi d’uso, rischi e risultati",
          "text": "Creo una base per definire priorità e regole."
        },
        {
          "score": 1,
          "title": "Chiedo di vietare tutto finché non c’è una policy perfetta",
          "text": "Riduce il rischio immediato ma blocca anche la comprensione del fenomeno."
        },
        {
          "score": 5,
          "title": "Propongo un inventario e un pilota governato",
          "text": "Definisco strumenti ammessi, dati, metriche, responsabilità e condivisione."
        },
        {
          "score": 2,
          "title": "Lascio che ogni persona scelga il proprio metodo",
          "text": "La varietà resta senza controllo o apprendimento comune."
        },
        {
          "score": 3,
          "title": "Creo un canale per scambiarsi prompt",
          "text": "È utile, ma non copre dati, qualità, rischi e misurazione."
        }
      ],
      "feedback": "La diffusione informale può essere trasformata in apprendimento organizzativo tramite perimetro, metriche e pratiche condivise."
    },
    "P_L_1": {
      "text": "Un assistente AI riassume i requisiti di una certificazione e cita una pagina web non datata. Seleziona ciò che faresti prima di usare il riepilogo in una procedura.",
      "hint": "Seleziona le azioni che applicheresti realmente.",
      "options": [
        {
          "score": 2,
          "title": "Apro la fonte ufficiale dell’ente certificatore",
          "text": "Controllo testo, data, revisione e documenti collegati."
        },
        {
          "score": 2,
          "title": "Confronto ogni requisito operativo con il documento vigente",
          "text": "Verifico che il riepilogo non ometta condizioni o eccezioni."
        },
        {
          "score": 1,
          "title": "Registro riferimenti e data di consultazione",
          "text": "Rendo tracciabile la verifica effettuata."
        },
        {
          "score": 1,
          "title": "Segnalo i punti che richiedono interpretazione esperta",
          "text": "Distinguo il testo della fonte dalla sua applicazione al caso."
        },
        {
          "score": -2,
          "title": "Uso il riepilogo perché include un link",
          "text": "La presenza di un URL non dimostra che la pagina sia vigente o pertinente."
        },
        {
          "score": -2,
          "title": "Chiedo al modello di confermare che non ci siano errori",
          "text": "La conferma interna non sostituisce il confronto con il documento."
        },
        {
          "score": -1,
          "title": "Verifico soltanto il requisito che sembra più importante",
          "text": "Rischio di lasciare omissioni negli altri punti."
        }
      ],
      "feedback": "Una sintesi normativa o certificativa va ricondotta alla fonte vigente e al suo campo di applicazione."
    },
    "P_DE_1": {
      "text": "Devi preparare una valutazione preliminare di cinque idee di miglioramento processo. Seleziona gli usi che affideresti all’AI come supporto.",
      "hint": "Scegli ciò che faresti davvero; le opzioni trasferiscono livelli diversi di responsabilità.",
      "options": [
        {
          "score": 2,
          "title": "Organizzare le idee secondo criteri dichiarati",
          "text": "Uso una matrice da controllare e correggere."
        },
        {
          "score": 2,
          "title": "Evidenziare assunzioni, dipendenze e rischi",
          "text": "Faccio emergere punti da verificare con persone e dati."
        },
        {
          "score": 1,
          "title": "Proporre domande per i responsabili del processo",
          "text": "Uso l’AI per preparare l’indagine."
        },
        {
          "score": 1,
          "title": "Generare scenari alternativi da confrontare",
          "text": "Amplio le opzioni senza delegare la decisione."
        },
        {
          "score": -2,
          "title": "Assegnare autonomamente la priorità finale",
          "text": "Lascio al modello una decisione che dipende da obiettivi e vincoli organizzativi."
        },
        {
          "score": -2,
          "title": "Scrivere la valutazione definitiva senza revisione",
          "text": "Trasformo un supporto preliminare in esito ufficiale."
        },
        {
          "score": -1,
          "title": "Scartare le idee che il modello giudica deboli",
          "text": "Uso una valutazione non verificata come filtro finale."
        }
      ],
      "feedback": "L’AI può strutturare, interrogare e ampliare l’analisi; priorità e decisioni richiedono criteri, evidenze e responsabilità umana."
    },
    "P_DS_1": {
      "text": "Scrivi il prompt che useresti per chiedere all’AI di progettare una dashboard di analisi dati partendo da un export CSV con campi non documentati e alcune righe mancanti. Non vuoi che inventi KPI, valori o interpretazioni.",
      "hint": "Scrivi il prompt che useresti davvero per ottenere una dashboard controllabile.",
      "rubric": {
        "criteria": [
          {
            "label": "Obiettivo della dashboard",
            "points": 1,
            "keywords": [
              "dashboard",
              "analisi",
              "obiettivo",
              "decisione",
              "monitor"
            ]
          },
          {
            "label": "Dataset e campi",
            "points": 1,
            "keywords": [
              "csv",
              "dati",
              "campi",
              "colonne",
              "righe"
            ]
          },
          {
            "label": "Non inventare KPI o valori",
            "points": 1,
            "keywords": [
              "non invent",
              "non assum",
              "non calcolare se manca",
              "kpi",
              "valori"
            ]
          },
          {
            "label": "Visualizzazioni e formato",
            "points": 1,
            "keywords": [
              "grafici",
              "visualizzazioni",
              "layout",
              "tabella",
              "formato"
            ]
          },
          {
            "label": "Lacune e chiarimenti",
            "points": 1,
            "keywords": [
              "mancant",
              "incomplet",
              "ambig",
              "chiariment",
              "domande",
              "segnala"
            ]
          },
          {
            "label": "Verifica finale",
            "points": 1,
            "keywords": [
              "verifica",
              "controll",
              "qualita",
              "qualità",
              "revision",
              "check"
            ]
          }
        ],
        "redFlags": [
          {
            "label": "delega cieca",
            "points": 1,
            "keywords": [
              "decidi tu",
              "scegli tu i kpi",
              "senza domande",
              "versione definitiva"
            ]
          },
          {
            "label": "dati inventati",
            "points": 1,
            "keywords": [
              "inventa dati",
              "stima liberamente",
              "riempi i valori"
            ]
          }
        ]
      },
      "feedback": "Il prompt dovrebbe definire obiettivo, dati disponibili, KPI ammessi, visualizzazioni, gestione delle lacune e controlli sulla qualità del dataset."
    },
    "P_DS_2": {
      "text": "Quale richiesta useresti per ottenere una prima analisi affidabile di un ritardo ricorrente in un processo?",
      "hint": "Scegli il prompt che organizza meglio dati, domande e risultato.",
      "options": [
        {
          "score": 2,
          "title": "Elenca tutte le possibili cause del ritardo",
          "text": "Produce idee, ma senza usare il contesto reale né discriminare tra ipotesi."
        },
        {
          "score": 5,
          "title": "Prima chiedimi dati e vincoli; poi formula ipotesi con evidenze mancanti e piano di verifica",
          "text": "Separa informazioni disponibili, assunzioni, analisi e controlli."
        },
        {
          "score": 1,
          "title": "Trova la causa principale e dimmi come eliminarla",
          "text": "Presuppone che il modello possa diagnosticare senza dati."
        },
        {
          "score": 3,
          "title": "Crea un diagramma causa-effetto sul problema",
          "text": "Fornisce una struttura utile, ma può restare generica senza domande e verifica."
        },
        {
          "score": 2,
          "title": "Rispondi come un consulente Lean esperto",
          "text": "Il ruolo orienta il linguaggio, ma non definisce input e criteri."
        }
      ],
      "feedback": "Per un problema complesso, un buon prompt fa emergere dati mancanti, distingue ipotesi da evidenze e prevede una verifica."
    },
    "P_DI_1": {
      "text": "Un risultato di deep search cita tre fonti per sostenere che “la GenAI riduce del 35% i tempi di onboarding”. Una fonte non è accessibile e due sembrano riprendere lo stesso comunicato. Scrivi i controlli che faresti prima di usare la conclusione.",
      "hint": "Indica i controlli reali su fonti, indipendenza e pertinenza.",
      "rubric": {
        "criteria": [
          {
            "label": "Accessibilità delle fonti",
            "points": 1,
            "keywords": [
              "fonte",
              "link",
              "accessibile",
              "aprire",
              "pubblicazione"
            ]
          },
          {
            "label": "Fonte primaria",
            "points": 1,
            "keywords": [
              "primaria",
              "originale",
              "studio",
              "report",
              "autore"
            ]
          },
          {
            "label": "Data e contesto",
            "points": 1,
            "keywords": [
              "data",
              "versione",
              "contesto",
              "settore",
              "onboarding"
            ]
          },
          {
            "label": "Indipendenza delle fonti",
            "points": 1,
            "keywords": [
              "indipendent",
              "stesso comunicato",
              "riprendono",
              "cross",
              "confront"
            ]
          },
          {
            "label": "Pertinenza dell’affermazione",
            "points": 1,
            "keywords": [
              "35",
              "metrica",
              "campione",
              "definiz",
              "supporta"
            ]
          },
          {
            "label": "Uso prudente e citazione",
            "points": 1,
            "keywords": [
              "non uso",
              "rimuovo",
              "cautela",
              "cit",
              "nota",
              "tracci"
            ]
          }
        ],
        "redFlags": [
          {
            "label": "fiducia nella precisione",
            "points": 1,
            "keywords": [
              "35% quindi",
              "dato preciso",
              "sembra credibile"
            ]
          },
          {
            "label": "conferma del modello",
            "points": 1,
            "keywords": [
              "chiedo all'ai",
              "chiedo al modello se",
              "sei sicuro"
            ]
          }
        ]
      },
      "feedback": "Il deep search non elimina la verifica: bisogna controllare accessibilità, fonte primaria, indipendenza, pertinenza e limiti della conclusione."
    },
    "P_DG_1": {
      "text": "Devi usare l’AI per classificare commenti dei dipendenti raccolti in un’indagine interna. Seleziona le azioni preliminari che adotteresti.",
      "hint": "Considera dati personali, finalità e qualità del processo.",
      "options": [
        {
          "score": 2,
          "title": "Verifico base autorizzativa, finalità e strumento ammesso",
          "text": "Chiarisco perché e dove i dati possono essere elaborati."
        },
        {
          "score": 2,
          "title": "Rimuovo identificativi e dettagli non necessari",
          "text": "Minimizzo il contenuto prima dell’elaborazione."
        },
        {
          "score": 1,
          "title": "Valuto il rischio di re-identificazione",
          "text": "Anche commenti anonimi possono contenere riferimenti riconoscibili."
        },
        {
          "score": 1,
          "title": "Definisco controllo umano e criteri di classificazione",
          "text": "Evito di usare etichette generate come decisioni automatiche."
        },
        {
          "score": 1,
          "title": "Documento limiti e qualità del campione",
          "text": "Rendo esplicite le condizioni dell’analisi."
        },
        {
          "score": -2,
          "title": "Carico il file completo su un servizio gratuito",
          "text": "Privilegio la comodità senza controllare il trattamento."
        },
        {
          "score": -2,
          "title": "Uso i risultati per valutare singoli dipendenti",
          "text": "Cambio finalità e aumento l’impatto senza garanzie."
        },
        {
          "score": -1,
          "title": "Tolgo solo la colonna con il nome",
          "text": "I testi liberi possono restare identificabili."
        }
      ],
      "feedback": "I commenti liberi richiedono minimizzazione, controllo della finalità, prevenzione della re-identificazione e revisione umana."
    },
    "P_M_1": {
      "text": "Un piccolo pilota AI non produce il risparmio di tempo atteso. Seleziona le azioni che prenderesti prima di abbandonarlo o scalarlo.",
      "hint": "La domanda osserva come impari da un esito debole.",
      "options": [
        {
          "score": 2,
          "title": "Rivedo la metrica e il punto di partenza",
          "text": "Controllo se il beneficio è stato misurato in modo appropriato."
        },
        {
          "score": 1,
          "title": "Analizzo quali passaggi hanno creato rilavorazioni",
          "text": "Distinguo tempo risparmiato e tempo speso in correzioni."
        },
        {
          "score": 1,
          "title": "Raccolgo feedback dagli utilizzatori",
          "text": "Cerco problemi di usabilità, competenza o integrazione."
        },
        {
          "score": 1,
          "title": "Modifico task, prompt o dati e ripeto un test limitato",
          "text": "Uso l’esito per formulare un nuovo esperimento."
        },
        {
          "score": 1,
          "title": "Confronto il flusso con e senza AI",
          "text": "Isolo il contributo dello strumento."
        },
        {
          "score": -2,
          "title": "Dichiaro il pilota riuscito perché l’AI è strategica",
          "text": "Sostituisco l’evidenza con una convinzione."
        },
        {
          "score": -2,
          "title": "Estendo subito l’uso per ottenere più dati",
          "text": "Aumento scala e rischio prima di capire il problema."
        },
        {
          "score": -1,
          "title": "Concludo che nessun caso d’uso AI può funzionare",
          "text": "Generalizzo da un singolo esperimento."
        }
      ],
      "feedback": "Un mindset sperimentale usa metriche, analisi delle rilavorazioni e iterazioni controllate per decidere."
    }
  },
  "C": {
    "L1": {
      "text": "Riesco a chiarire perché un LLM non “conosce” una risposta nello stesso senso di una persona, pur potendo produrre testi molto convincenti.",
      "hint": "Valuta la comprensione che sapresti esprimere con parole tue."
    },
    "L2": {
      "text": "Quando una risposta richiama messaggi precedenti, file o memoria del servizio, so distinguere queste informazioni dai parametri appresi dal modello.",
      "hint": "Pensa a ciò che avviene nelle sessioni che usi abitualmente."
    },
    "L3": {
      "text": "So che sicurezza del tono, precisione numerica e presenza di riferimenti non bastano a dimostrare che un output AI sia corretto.",
      "hint": "Considera come valuti la credibilità apparente."
    },
    "L4": {
      "text": "Scelgo consapevolmente tra modello senza strumenti, ricerca web, interrogazione di documenti e sistemi collegati a dati aziendali.",
      "hint": "Valuta se colleghi il compito alla fonte informativa necessaria."
    },
    "L5": {
      "text": "Prima di riutilizzare testi, immagini, codice o dati generati con l’AI, considero origine degli input, diritti, riservatezza e regole del contesto.",
      "hint": "Pensa alle verifiche di base che compi prima della pubblicazione o condivisione."
    },
    "L6": {
      "text": "Devi descrivere le funzionalità e i limiti di una piattaforma software che viene aggiornata frequentemente. Quale approccio scegli?",
      "hint": "Scegli ciò che faresti nel lavoro reale.",
      "options": [
        {
          "score": 1,
          "title": "Chiedo al modello una panoramica completa e la pubblico",
          "text": "Assumo che la conoscenza del modello sia aggiornata."
        },
        {
          "score": 3,
          "title": "Genero una bozza e controllo le funzioni che uso personalmente",
          "text": "Verifico una parte del contenuto, ma non l’intero perimetro."
        },
        {
          "score": 5,
          "title": "Parto dalla documentazione corrente e traccio versione e data",
          "text": "Uso l’AI per organizzare il materiale, distinguendo fatti, limiti e punti da testare."
        },
        {
          "score": 2,
          "title": "Chiedo al modello di indicare la sua data di aggiornamento",
          "text": "La risposta del modello non prova la copertura della specifica piattaforma."
        },
        {
          "score": 4,
          "title": "Confronto release note e documentazione ufficiale",
          "text": "Controllo le affermazioni prima di trasformarle in una sintesi."
        }
      ],
      "feedback": "Per prodotti in evoluzione servono documentazione corrente, versione, data e verifica delle funzionalità dichiarate."
    },
    "L7": {
      "text": "Vuoi interrogare con l’AI un archivio di contratti e corrispondenza commerciale. Che cosa definisci prima del caricamento?",
      "hint": "Considera perimetro informativo e responsabilità.",
      "options": [
        {
          "score": 5,
          "title": "Finalità, documenti necessari, autorizzazioni, accessi e modalità di recupero",
          "text": "Progetto il flusso perché le risposte siano controllabili e i dati minimizzati."
        },
        {
          "score": 2,
          "title": "La dimensione massima dei file",
          "text": "È un vincolo tecnico, ma non risolve governance e riservatezza."
        },
        {
          "score": 4,
          "title": "Strumento approvato e criterio di selezione dei documenti",
          "text": "Limito il corpus e verifico chi può accedere."
        },
        {
          "score": 1,
          "title": "Niente: i documenti sono già dell’azienda",
          "text": "La titolarità interna non rende qualsiasi trattamento automaticamente appropriato."
        },
        {
          "score": 3,
          "title": "Rimuovo firme e loghi",
          "text": "Intervengo su elementi visibili, ma potrei lasciare dati personali e condizioni riservate."
        }
      ],
      "feedback": "Un archivio contrattuale richiede selezione, autorizzazione, controlli di accesso, tracciabilità e risposte collegate alle fonti."
    },
    "T1": {
      "text": "Quale elemento può essere un token per un modello linguistico?",
      "hint": "Scegli la risposta più generale.",
      "options": [
        {
          "score": 5,
          "title": "Una parola, una parte di parola, un segno o altro frammento definito dal tokenizer",
          "text": "L’unità dipende dal sistema di tokenizzazione."
        },
        {
          "score": 1,
          "title": "Soltanto una parola completa del dizionario",
          "text": "Molti tokenizer suddividono le parole in parti."
        },
        {
          "score": 2,
          "title": "Sempre un singolo carattere Unicode",
          "text": "Non è una regola generale."
        },
        {
          "score": 3,
          "title": "Un intero paragrafo semanticamente completo",
          "text": "Alcuni sistemi usano unità diverse, ma non è la descrizione tipica dei token degli LLM."
        }
      ],
      "feedback": "I token sono unità discrete prodotte dal tokenizer e non hanno una corrispondenza fissa con parole o caratteri."
    },
    "T2": {
      "text": "Un LLM scrive normalmente la risposta intera in un’unica operazione?",
      "hint": "Considera il meccanismo autoregressivo.",
      "options": [
        {
          "score": 5,
          "title": "No, stima progressivamente token successivi condizionati dalla sequenza disponibile",
          "text": "La risposta viene costruita in passi successivi."
        },
        {
          "score": 1,
          "title": "Sì, recupera un testo completo già archiviato",
          "text": "Il modello non funziona in generale come una raccolta di risposte preconfezionate."
        },
        {
          "score": 2,
          "title": "Sì, esegue prima una ricerca web obbligatoria",
          "text": "La generazione non richiede necessariamente uno strumento esterno."
        },
        {
          "score": 3,
          "title": "No, ma sceglie casualmente parole indipendenti tra loro",
          "text": "Le probabilità dipendono dal contesto precedente."
        }
      ],
      "feedback": "La generazione procede token dopo token; il contesto influenza la distribuzione delle possibilità successive."
    },
    "T3": {
      "text": "Quale attività è un esempio di inferenza e non di addestramento?",
      "hint": "Distingui uso del modello e modifica dei parametri.",
      "options": [
        {
          "score": 5,
          "title": "Inviare un prompt a un modello già addestrato e ottenere una risposta",
          "text": "Il modello applica i parametri esistenti al nuovo input."
        },
        {
          "score": 1,
          "title": "Ottimizzare i pesi su un grande corpus",
          "text": "Questo è addestramento."
        },
        {
          "score": 2,
          "title": "Eseguire fine-tuning su esempi aziendali",
          "text": "È una forma di adattamento dei parametri."
        },
        {
          "score": 3,
          "title": "Calcolare gradienti per ridurre la funzione di perdita",
          "text": "È parte del processo di apprendimento."
        }
      ],
      "feedback": "L’inferenza produce output usando parametri già appresi; training e fine-tuning li modificano."
    },
    "T4": {
      "text": "Inizi una nuova conversazione e il modello non ricorda un file usato nella sessione precedente. Qual è la spiegazione generale più corretta?",
      "hint": "Distingui contesto, memoria del prodotto e addestramento.",
      "options": [
        {
          "score": 5,
          "title": "Il file apparteneva al contesto precedente e non è automaticamente nei pesi o nella nuova sessione",
          "text": "Eventuali funzioni di memoria dipendono dal prodotto e dalle impostazioni."
        },
        {
          "score": 1,
          "title": "Il modello ha cancellato parte del proprio addestramento",
          "text": "Il file della chat non coincide con i parametri del modello."
        },
        {
          "score": 2,
          "title": "Il file non conteneva abbastanza token per essere ricordato",
          "text": "La persistenza non dipende semplicemente dalla lunghezza."
        },
        {
          "score": 3,
          "title": "Il modello ricorda tutto ma sceglie di non mostrarlo",
          "text": "Non si può assumere una memoria nascosta permanente."
        }
      ],
      "feedback": "Il contesto di una sessione è distinto da memoria opzionale del servizio e da addestramento del modello."
    },
    "T5": {
      "text": "Che cosa concorre normalmente a occupare la finestra di contesto?",
      "hint": "Considera tutto ciò che il modello deve elaborare nello stesso scambio.",
      "options": [
        {
          "score": 5,
          "title": "Istruzioni, messaggi, documenti inseriti e token della risposta",
          "text": "Il budget complessivo è condiviso tra input e output secondo il sistema."
        },
        {
          "score": 1,
          "title": "Soltanto l’ultimo messaggio dell’utente",
          "text": "La finestra può includere più elementi della conversazione."
        },
        {
          "score": 2,
          "title": "Solo i documenti allegati, non il prompt",
          "text": "Anche istruzioni e messaggi consumano token."
        },
        {
          "score": 3,
          "title": "Tutti i dati di addestramento del modello",
          "text": "I dati di training non vengono inseriti integralmente nel contesto."
        }
      ],
      "feedback": "La finestra di contesto è il budget di token disponibile per gli elementi elaborati nella richiesta e, a seconda del sistema, nella risposta."
    },
    "T6": {
      "text": "Che cosa sono i “pesi” di una rete neurale?",
      "hint": "Scegli la descrizione matematica generale.",
      "options": [
        {
          "score": 5,
          "title": "Parametri numerici che modulano le trasformazioni tra rappresentazioni",
          "text": "Vengono regolati durante l’apprendimento."
        },
        {
          "score": 1,
          "title": "Documenti testuali conservati integralmente dentro ogni neurone",
          "text": "I pesi non sono file leggibili archiviati nodo per nodo."
        },
        {
          "score": 2,
          "title": "Regole etiche predefinite e immutabili",
          "text": "Le regole di comportamento possono derivare da più componenti, ma non definiscono i pesi."
        },
        {
          "score": 3,
          "title": "Misure della quantità fisica dell’hardware",
          "text": "Il termine non indica il peso materiale dei server."
        }
      ],
      "feedback": "I pesi sono valori numerici appresi che determinano come gli input vengono trasformati attraverso la rete."
    },
    "T7": {
      "text": "Quale compito NON viene svolto automaticamente dal meccanismo di attention?",
      "hint": "Distingui relazione nel contesto e accesso al mondo esterno.",
      "options": [
        {
          "score": 5,
          "title": "Verificare su fonti esterne che una frase sia vera",
          "text": "L’attention opera sulle rappresentazioni disponibili, non garantisce fact-checking."
        },
        {
          "score": 1,
          "title": "Mettere in relazione parole lontane nella sequenza",
          "text": "È uno degli usi centrali dell’attention."
        },
        {
          "score": 2,
          "title": "Attribuire pesi diversi agli elementi del contesto",
          "text": "È parte del meccanismo."
        },
        {
          "score": 3,
          "title": "Costruire rappresentazioni contestuali dei token",
          "text": "È una conseguenza del calcolo delle relazioni."
        }
      ],
      "feedback": "L’attention collega elementi del contesto; non aggiunge da sola fonti, verifica o conoscenza aggiornata."
    },
    "T8": {
      "text": "Quale esempio rappresenta meglio un’allucinazione?",
      "hint": "Scegli il caso in cui il sistema produce contenuto non supportato.",
      "options": [
        {
          "score": 5,
          "title": "Inventare una decisione contenuta in un verbale che in realtà non la riporta",
          "text": "Il modello aggiunge un fatto plausibile ma assente dalla fonte."
        },
        {
          "score": 1,
          "title": "Riassumere correttamente un paragrafo con parole diverse",
          "text": "È una normale parafrasi."
        },
        {
          "score": 2,
          "title": "Rifiutare una richiesta perché mancano dati",
          "text": "È un comportamento prudente, non un’allucinazione."
        },
        {
          "score": 3,
          "title": "Commettere un refuso evidente",
          "text": "Un refuso può essere un errore, ma non descrive specificamente la fabbricazione plausibile di contenuto."
        }
      ],
      "feedback": "Un’allucinazione è un contenuto generato come se fosse supportato, pur essendo falso, inventato o non presente nelle fonti."
    },
    "T9": {
      "text": "Quale limite resta presente anche in un sistema RAG ben progettato?",
      "hint": "Il recupero di fonti riduce alcuni rischi, ma non li annulla.",
      "options": [
        {
          "score": 5,
          "title": "Può recuperare passaggi non pertinenti o interpretarli male",
          "text": "Qualità del corpus, ricerca, contesto e generazione vanno comunque valutati."
        },
        {
          "score": 1,
          "title": "Non può mai citare documenti",
          "text": "Un sistema RAG può essere progettato per mostrare citazioni."
        },
        {
          "score": 2,
          "title": "Deve modificare i pesi del modello a ogni ricerca",
          "text": "Il recupero può avvenire senza fine-tuning."
        },
        {
          "score": 3,
          "title": "Funziona soltanto con pagine web pubbliche",
          "text": "Può usare anche archivi privati e basi documentali autorizzate."
        }
      ],
      "feedback": "Il RAG migliora l’accesso a fonti, ma non rende automaticamente corretti recupero, interpretazione e risposta."
    },
    "T10": {
      "text": "Quale sequenza storica è più corretta?",
      "hint": "La domanda non richiede date precise.",
      "options": [
        {
          "score": 5,
          "title": "AI simbolica e sistemi esperti precedono l’attuale diffusione del deep learning e degli LLM",
          "text": "Il campo ha attraversato approcci e cicli differenti."
        },
        {
          "score": 1,
          "title": "Prima gli LLM, poi i sistemi esperti",
          "text": "L’ordine storico è opposto."
        },
        {
          "score": 2,
          "title": "L’AI nasce dopo il 2020",
          "text": "Il termine e la ricerca risalgono a molti decenni prima."
        },
        {
          "score": 3,
          "title": "Machine learning e AI sono apparsi soltanto con i chatbot",
          "text": "Apprendimento automatico e altre tecniche hanno una storia precedente."
        }
      ],
      "feedback": "Gli LLM sono una tappa recente; l’AI comprende tradizioni simboliche, statistiche, neurali e ibride."
    },
    "T11": {
      "text": "Abbassare la temperatura del modello elimina il rischio di allucinazioni?",
      "hint": "Valuta ciò che cambia e ciò che resta da verificare.",
      "options": [
        {
          "score": 5,
          "title": "No, può rendere l’output più deterministico ma non garantisce correttezza",
          "text": "Servono comunque fonti, controlli e gestione dell’incertezza."
        },
        {
          "score": 1,
          "title": "Sì, a temperatura zero ogni fatto è vero",
          "text": "Determinismo e verità non coincidono."
        },
        {
          "score": 2,
          "title": "Sì, perché il modello consulta automaticamente più fonti",
          "text": "La temperatura non attiva una ricerca."
        },
        {
          "score": 3,
          "title": "Riduce sempre il rischio a un livello trascurabile",
          "text": "L’effetto dipende dal compito e non sostituisce la verifica."
        }
      ],
      "feedback": "Parametri di generazione influenzano varietà e determinismo, non trasformano il modello in una fonte garantita."
    },
    "T12": {
      "text": "Due documenti hanno embedding molto vicini. Che cosa puoi inferire con maggiore prudenza?",
      "hint": "Attribuisci alla vicinanza vettoriale il significato corretto.",
      "options": [
        {
          "score": 5,
          "title": "Sono probabilmente simili secondo la rappresentazione del modello",
          "text": "La vicinanza può indicare affinità semantica, non identità o verità."
        },
        {
          "score": 1,
          "title": "Contengono necessariamente gli stessi fatti corretti",
          "text": "Similarità e accuratezza sono dimensioni diverse."
        },
        {
          "score": 2,
          "title": "Provengono dalla stessa fonte",
          "text": "La rappresentazione non certifica la provenienza."
        },
        {
          "score": 3,
          "title": "Uno è una copia esatta dell’altro",
          "text": "Documenti diversi possono risultare semanticamente vicini."
        }
      ],
      "feedback": "Gli embedding supportano confronti di similarità, ma il loro significato dipende dal modello e non certifica origine o correttezza."
    },
    "TR_CITE": {
      "text": "Verifichi che il DOI citato dall’AI esista davvero, ma l’articolo non sostiene l’affermazione riportata. La citazione può essere usata come prova?",
      "hint": "Distingui esistenza della fonte e supporto alla specifica affermazione.",
      "options": [
        {
          "score": 5,
          "title": "No, devo verificare che il contenuto sostenga davvero la frase",
          "text": "Una fonte reale può essere citata in modo improprio o fuori contesto."
        },
        {
          "score": 1,
          "title": "Sì, l’esistenza del DOI rende corretta la citazione",
          "text": "La risoluzione del riferimento non prova il nesso con l’affermazione."
        },
        {
          "score": 2,
          "title": "Sì, purché autore e anno coincidano",
          "text": "I metadati non sostituiscono la lettura del contenuto pertinente."
        },
        {
          "score": 3,
          "title": "Posso usarla indicando che la fonte è stata trovata",
          "text": "La nota non corregge un riferimento che non supporta la tesi."
        }
      ],
      "feedback": "La verifica di una citazione comprende autenticità, pertinenza e corrispondenza tra fonte e affermazione."
    },
    "AG1": {
      "text": "So distinguere un assistente che risponde, un sistema RAG che recupera fonti e un agente che può scegliere passi, usare tool e mantenere stato.",
      "hint": "Considera architettura, autonomia e controllo, non il nome commerciale dello strumento."
    },
    "AG2": {
      "text": "Quale descrizione rappresenta meglio un workflow agentico?",
      "hint": "Scegli l'opzione più completa sul piano operativo.",
      "options": [
        {
          "score": 1,
          "title": "Una chat con un tono più deciso",
          "text": "Il tono non cambia la natura del sistema."
        },
        {
          "score": 5,
          "title": "Un ciclo di pianificazione, tool use, osservazione e controllo",
          "text": "L'agente avanza usando strumenti, stato e criteri definiti."
        },
        {
          "score": 2,
          "title": "Un modello sempre connesso al web",
          "text": "La connessione a fonti esterne è solo un possibile strumento."
        },
        {
          "score": 1,
          "title": "Un sistema che decide sempre senza persone",
          "text": "Gli agenti possono e spesso devono includere approvazioni umane."
        }
      ],
      "feedback": "Il workflow agentico non è una chat più potente: è un processo governato che collega modello, strumenti, stato e supervisione."
    },
    "AG3": {
      "text": "Un agente dovrebbe preparare report di avanzamento progetto e aprire task quando rileva blocchi. Da dove parti?",
      "hint": "Valuta dati, azioni e punti di approvazione.",
      "options": [
        {
          "score": 2,
          "title": "Gli chiedo report completi ogni giorno",
          "text": "Produco output, ma non governo azioni e fonti."
        },
        {
          "score": 1,
          "title": "Gli permetto di creare task liberamente",
          "text": "Apre azioni operative senza criteri."
        },
        {
          "score": 3,
          "title": "Lo limito ai progetti meno critici",
          "text": "Riduce l'impatto ma resta poco progettato."
        },
        {
          "score": 4,
          "title": "Definisco fonti, segnali di blocco e revisori",
          "text": "Collega input, criteri e controllo umano."
        },
        {
          "score": 5,
          "title": "Disegno workflow con soglie, bozze, approvazioni, log e rollback",
          "text": "Rende l'autonomia progressiva e verificabile."
        }
      ],
      "feedback": "Gli agenti che aprono task o modificano workflow devono avere soglie, approvazioni, osservabilità e modalità di recupero."
    },
    "AG4": {
      "text": "Vuoi usare un agente per leggere ticket HR e proporre aggiornamenti alla knowledge base interna. Quali controlli imposti?",
      "hint": "Seleziona le misure che proteggono dati, responsabilità e qualità.",
      "minSelected": 3,
      "options": [
        {
          "score": 2,
          "title": "Minimizzazione e mascheramento dei dati personali",
          "text": "Riduce l'esposizione dei contenuti sensibili."
        },
        {
          "score": 2,
          "title": "Solo proposte, con pubblicazione approvata",
          "text": "L'agente non modifica contenuti ufficiali da solo."
        },
        {
          "score": 1,
          "title": "Registro di fonti, ticket e modifiche suggerite",
          "text": "Rende verificabile la proposta."
        },
        {
          "score": 1,
          "title": "Escalation su casi personali o disciplinari",
          "text": "I casi delicati restano fuori dall'automazione."
        },
        {
          "score": 1,
          "title": "Controllo periodico di errori e bias",
          "text": "Misura qualità e impatto nel tempo."
        },
        {
          "score": -2,
          "title": "Accesso completo ai fascicoli personali",
          "text": "Espone dati non necessari al compito."
        },
        {
          "score": -2,
          "title": "Pubblicazione automatica delle modifiche",
          "text": "Trasforma suggerimenti in contenuti ufficiali senza revisione."
        }
      ],
      "feedback": "Un agente su dati HR richiede minimizzazione, approvazione, tracciabilità, escalation e controllo degli effetti."
    },
    "F_DE_1": {
      "text": "Classifico le attività AI in base a ciò che può essere suggerito, eseguito, verificato o deciso, definendo il livello di supervisione necessario.",
      "hint": "Valuta se questa distinzione è parte del tuo metodo."
    },
    "F_DE_2": {
      "text": "Per compiti articolati, evito la richiesta unica e progetto una sequenza in cui ogni risultato intermedio può essere controllato.",
      "hint": "Pensa a come imposti realmente il lavoro."
    },
    "F_DE_3": {
      "text": "Devi preparare un percorso formativo interno partendo da bisogni raccolti in interviste. Come usi l’AI?",
      "hint": "Scegli la ripartizione di responsabilità più vicina al tuo comportamento.",
      "options": [
        {
          "score": 2,
          "title": "Chiedo un corso completo sul tema",
          "text": "Ottengo una struttura generica senza collegarla sistematicamente ai bisogni."
        },
        {
          "score": 4,
          "title": "Faccio codificare i temi e proporre moduli",
          "text": "Controllo citazioni dalle interviste e adatto la struttura."
        },
        {
          "score": 5,
          "title": "Definisco obiettivi, faccio analizzare evidenze e confronto alternative",
          "text": "Verifico bisogni, priorità, contenuti, valutazione e responsabilità finale."
        },
        {
          "score": 1,
          "title": "Lascio che il modello scelga competenze e durata",
          "text": "Delego decisioni che dipendono dal contesto organizzativo."
        },
        {
          "score": 3,
          "title": "Uso l’AI per riassumere le interviste",
          "text": "Accelero la lettura, ma non progetto ancora criteri e controlli."
        }
      ],
      "feedback": "La delega efficace usa l’AI per organizzare evidenze e generare alternative, mantenendo obiettivi e decisioni sotto controllo umano."
    },
    "F_DS_1": {
      "text": "Quando incarico l’AI di produrre un deliverable, specifico input disponibili, risultato atteso, esclusioni e modalità con cui controllerò la qualità.",
      "hint": "Considera la completezza abituale delle tue richieste."
    },
    "F_DS_2": {
      "text": "Uso esempi positivi o negativi quando servono a chiarire uno standard che sarebbe difficile descrivere soltanto a parole.",
      "hint": "Valuta l’uso concreto degli esempi."
    },
    "F_DS_3": {
      "text": "L’AI interpreta in modo diverso un termine aziendale ambiguo e costruisce la risposta sull’assunzione sbagliata. Come intervieni?",
      "hint": "Scegli il modo in cui correggeresti il processo.",
      "options": [
        {
          "score": 1,
          "title": "Correggo soltanto la frase finale",
          "text": "L’assunzione può continuare a influenzare il resto dell’output."
        },
        {
          "score": 5,
          "title": "Definisco il termine, esplicito il contesto e chiedo di elencare le assunzioni",
          "text": "Rendo l’ambiguità controllabile prima di rigenerare."
        },
        {
          "score": 3,
          "title": "Aggiungo un glossario al prompt",
          "text": "È utile, ma potrei non chiedere una verifica dell’interpretazione."
        },
        {
          "score": 2,
          "title": "Scrivo il termine in maiuscolo",
          "text": "L’enfasi grafica non chiarisce il significato."
        },
        {
          "score": 4,
          "title": "Fornisco esempi e chiedo conferma del perimetro",
          "text": "Allineo il modello prima della risposta finale."
        }
      ],
      "feedback": "Le ambiguità vanno risolte esplicitando definizioni, esempi e assunzioni, non soltanto correggendo l’output."
    },
    "TR_PROMPT": {
      "text": "Scrivere un prompt in maiuscolo o aggiungere “È IMPORTANTISSIMO” aumenta automaticamente l’accuratezza fattuale?",
      "hint": "Valuta la differenza tra enfasi e qualità dell’incarico.",
      "options": [
        {
          "score": 5,
          "title": "No, può enfatizzare un’istruzione ma non aggiunge fonti né controlli",
          "text": "Accuratezza e verificabilità dipendono da contesto, dati e processo di revisione."
        },
        {
          "score": 1,
          "title": "Sì, il modello assegna più capacità computazionale alle frasi in maiuscolo",
          "text": "L’enfasi non crea una garanzia tecnica di questo tipo."
        },
        {
          "score": 2,
          "title": "Sì, purché venga aggiunto anche un punto esclamativo",
          "text": "La punteggiatura non sostituisce la progettazione del compito."
        },
        {
          "score": 3,
          "title": "È sufficiente quando la risposta deve essere breve",
          "text": "Anche una risposta breve può richiedere dati e criteri."
        }
      ],
      "feedback": "L’enfasi può influire sull’aderenza a un’istruzione, ma non rende vero un contenuto né sostituisce una verifica."
    },
    "F_DI_1": {
      "text": "Distinguo tra qualità della forma e qualità dell’evidenza quando valuto una risposta generata.",
      "hint": "Pensa a testi persuasivi ma non tracciabili."
    },
    "F_DI_2": {
      "text": "Per attività importanti, provo a falsificare la conclusione dell’AI cercando eccezioni, controesempi o dati contrari.",
      "hint": "Valuta se sottoponi l’output a un controllo critico."
    },
    "F_DI_3": {
      "text": "L’AI sostiene che una variazione di processo ha causato un miglioramento, basandosi su due indicatori che si muovono insieme. Cosa fai?",
      "hint": "Considera la differenza tra correlazione e causa.",
      "options": [
        {
          "score": 3,
          "title": "Chiedo al modello di spiegare meglio il nesso",
          "text": "Ottengo un ragionamento, ma non nuove evidenze."
        },
        {
          "score": 5,
          "title": "Tratto la causalità come ipotesi e cerco disegno, dati e fattori alternativi",
          "text": "Verifico periodo, gruppi di confronto e possibili confondenti."
        },
        {
          "score": 1,
          "title": "Accetto la conclusione perché gli indicatori coincidono",
          "text": "La correlazione temporale non dimostra causalità."
        },
        {
          "score": 4,
          "title": "Controllo serie, definizioni e cambiamenti concomitanti",
          "text": "Cerco elementi che sostengano o indeboliscano l’attribuzione."
        },
        {
          "score": 2,
          "title": "Riformulo la frase come “potrebbe aver causato” e la uso",
          "text": "La cautela linguistica non sostituisce l’analisi."
        }
      ],
      "feedback": "Le conclusioni causali richiedono evidenze e un disegno adeguato; la sola correlazione non basta."
    },
    "TR_SURE": {
      "text": "Il modello attribuisce alla propria risposta una “confidenza del 98%”. Come interpreti quel numero?",
      "hint": "Valuta se la percentuale è una misura calibrata.",
      "options": [
        {
          "score": 5,
          "title": "Non la tratto come probabilità affidabile senza un metodo di calibrazione verificato",
          "text": "Il modello può generare una percentuale plausibile senza misurare realmente la propria accuratezza."
        },
        {
          "score": 1,
          "title": "Significa che soltanto il 2% della risposta può essere sbagliato",
          "text": "La percentuale non si traduce automaticamente in questa garanzia."
        },
        {
          "score": 2,
          "title": "È attendibile perché il modello conosce i propri limiti interni",
          "text": "Una dichiarazione testuale non è necessariamente una stima calibrata."
        },
        {
          "score": 3,
          "title": "La uso come indicatore sufficiente per contenuti a basso impatto",
          "text": "Può sembrare utile, ma resta priva di valore noto senza validazione."
        }
      ],
      "feedback": "Le autostime numeriche generate dal modello non vanno confuse con probabilità calibrate o evidenze di correttezza."
    },
    "F_DG_1": {
      "text": "Prima di distribuire un contenuto prodotto con l’AI, verifico chi ne assume la responsabilità, quali controlli sono stati svolti e quali limiti devono essere dichiarati.",
      "hint": "Considera l’intero passaggio fino al destinatario."
    },
    "F_DG_2": {
      "text": "Evito di usare l’AI per aggirare controlli, autorizzazioni o separazioni di ruolo previste dal processo.",
      "hint": "Valuta la disciplina operativa oltre la qualità del testo."
    },
    "F_DG_3": {
      "text": "Per rispettare una scadenza, ti propongono di elaborare dati aziendali con un account AI personale non sottoposto ai controlli dell’organizzazione. Cosa fai?",
      "hint": "Scegli la risposta che adotteresti sotto pressione.",
      "options": [
        {
          "score": 4,
          "title": "Cerco uno strumento approvato o una versione anonimizzata",
          "text": "Mantengo il lavoro nel perimetro consentito."
        },
        {
          "score": 1,
          "title": "Uso l’account personale e cancello poi la chat",
          "text": "La cancellazione successiva non rende autorizzato il trattamento."
        },
        {
          "score": 5,
          "title": "Rinegozio modalità o scadenza e propongo un flusso governato",
          "text": "Rendo esplicito il vincolo e preservo dati, accessi e tracciabilità."
        },
        {
          "score": 2,
          "title": "Uso l’account personale soltanto per pochi minuti",
          "text": "La durata non risolve il problema di governance."
        },
        {
          "score": 3,
          "title": "Trascrivo manualmente solo i passaggi principali",
          "text": "Riduce il volume, ma non verifica se i dati residui siano ammessi."
        }
      ],
      "feedback": "La pressione temporale non cambia il perimetro autorizzativo; occorre trovare un’alternativa governata o modificare il piano."
    },
    "M1": {
      "text": "Non interpreto l’output AI come un giudizio autonomo: lo considero il risultato di un sistema da contestualizzare e controllare.",
      "hint": "Valuta il tuo atteggiamento spontaneo."
    },
    "M2": {
      "text": "Preferisco piccoli esperimenti con rischio e metriche definiti rispetto a discussioni astratte sull’utilità generale dell’AI.",
      "hint": "Pensa a come trasformi curiosità in prova."
    },
    "M3": {
      "text": "Quando l’AI fallisce, distinguo tra limite intrinseco, configurazione inadeguata e problema del processo prima di decidere come procedere.",
      "hint": "Considera la diagnosi effettiva degli insuccessi."
    },
    "M4": {
      "text": "Sono disposto a rinunciare a un uso dell’AI quando i controlli necessari annullano il beneficio o il rischio resta sproporzionato.",
      "hint": "L’apertura comprende anche la capacità di non usare lo strumento."
    },
    "M5": {
      "text": "Riesco a cambiare opinione sull’AI quando emergono risultati misurati, positivi o negativi, invece di difendere una posizione iniziale.",
      "hint": "Valuta la flessibilità basata su evidenze."
    },
    "M6": {
      "text": "Nel confronto con i colleghi separo esperienze aneddotiche, risultati osservati e condizioni necessarie per replicarli.",
      "hint": "Considera la qualità della condivisione."
    },
    "M7": {
      "text": "Dedico tempo a comprendere modifiche rilevanti di strumenti e policy che possono cambiare il modo sicuro o efficace di usarli.",
      "hint": "Pensa alla continuità dell’apprendimento."
    },
    "M8": {
      "text": "Un collega mostra un risultato sorprendente e conclude: “Con l’AI non serve più alcuna revisione”. Come reagisci?",
      "hint": "Scegli una risposta operativa e proporzionata.",
      "options": [
        {
          "score": 1,
          "title": "Concordo perché il risultato è convincente",
          "text": "Generalizzo da un singolo caso."
        },
        {
          "score": 5,
          "title": "Chiedo di replicare il caso con criteri, errori e condizioni dichiarate",
          "text": "Valuto robustezza, limiti e livello di supervisione necessario."
        },
        {
          "score": 3,
          "title": "Propongo di usare l’AI solo per quel compito",
          "text": "Limito la generalizzazione, ma non analizzo il motivo del successo."
        },
        {
          "score": 4,
          "title": "Confronto output con baseline e revisione umana",
          "text": "Misuro beneficio e difetti prima di modificare il processo."
        },
        {
          "score": 2,
          "title": "Dico che l’AI sbaglia sempre e quindi il risultato non conta",
          "text": "Rifiuto l’evidenza senza valutarla."
        }
      ],
      "feedback": "Un risultato positivo va replicato e confrontato; non dimostra che la supervisione sia superflua."
    },
    "M9": {
      "text": "Un progetto AI pilota ha prodotto risultati contrastanti e opinioni molto polarizzate. Quale passo proponi?",
      "hint": "Valuta come gestiresti evidenze incomplete e conflitto.",
      "options": [
        {
          "score": 5,
          "title": "Analizzo casi, metriche, errori e condizioni e decido il seguito per segmento",
          "text": "Distinguo dove funziona, dove no e quali modifiche servono."
        },
        {
          "score": 1,
          "title": "Scelgo la posizione del dirigente più favorevole",
          "text": "Sostituisco l’analisi con l’autorità."
        },
        {
          "score": 2,
          "title": "Interrompo tutto per evitare discussioni",
          "text": "Elimino il conflitto senza apprendere dal pilota."
        },
        {
          "score": 4,
          "title": "Facilito una review con dati e criteri condivisi",
          "text": "Rendo confrontabili le osservazioni e definisco un nuovo test se necessario."
        },
        {
          "score": 3,
          "title": "Estendo il pilota a più persone",
          "text": "Aumento i dati, ma senza prima chiarire metriche e problemi."
        }
      ],
      "feedback": "Risultati misti richiedono segmentazione, criteri comuni e decisioni basate su evidenze, non una media delle opinioni."
    },
    "P_L_1": {
      "text": "L’AI descrive le caratteristiche di un componente e riporta valori tecnici senza datasheet. Seleziona ciò che faresti prima di approvarne l’uso in un progetto.",
      "hint": "Scegli le azioni che adotteresti realmente.",
      "options": [
        {
          "score": 2,
          "title": "Recupero il datasheet del produttore e la revisione corretta",
          "text": "Verifico valori, condizioni di prova e note applicative."
        },
        {
          "score": 2,
          "title": "Confronto codice esatto, package e varianti",
          "text": "Evito di trasferire dati da un modello simile ma diverso."
        },
        {
          "score": 1,
          "title": "Controllo limiti assoluti e condizioni operative",
          "text": "Distinguo valori tipici, massimi e condizioni di utilizzo."
        },
        {
          "score": 1,
          "title": "Registro la fonte nella documentazione di progetto",
          "text": "Rendo il dato tracciabile per revisioni successive."
        },
        {
          "score": -2,
          "title": "Uso i valori perché il modello ha indicato molte cifre decimali",
          "text": "La precisione apparente non certifica il componente."
        },
        {
          "score": -2,
          "title": "Chiedo al modello se i dati provengono dal datasheet",
          "text": "La dichiarazione del modello non sostituisce il documento."
        },
        {
          "score": -1,
          "title": "Verifico solo il parametro che mi interessa di più",
          "text": "Potrei ignorare condizioni o limiti critici."
        }
      ],
      "feedback": "I dati tecnici vanno verificati sul documento corretto, includendo variante, revisione e condizioni di misura."
    },
    "P_DE_1": {
      "text": "Devi preparare una comunicazione di cambiamento organizzativo a partire da decisioni approvate e commenti degli stakeholder. Seleziona gli usi appropriati dell’AI.",
      "hint": "Distingui preparazione del testo e responsabilità sul messaggio.",
      "options": [
        {
          "score": 2,
          "title": "Organizzare i punti approvati per destinatario",
          "text": "Uso l’AI per strutturare contenuti già validati."
        },
        {
          "score": 2,
          "title": "Generare versioni con tono e livello di dettaglio diversi",
          "text": "Confronto alternative mantenendo invariati i fatti."
        },
        {
          "score": 1,
          "title": "Evidenziare possibili domande o incomprensioni",
          "text": "Preparo una revisione con gli stakeholder."
        },
        {
          "score": 1,
          "title": "Controllare coerenza tra messaggi e decisioni fornite",
          "text": "Uso una checklist prima della pubblicazione."
        },
        {
          "score": -2,
          "title": "Inventare motivazioni più persuasive",
          "text": "Aggiungo contenuti non approvati."
        },
        {
          "score": -2,
          "title": "Inviare automaticamente la versione scelta dal modello",
          "text": "Delego pubblicazione e responsabilità finale."
        },
        {
          "score": -1,
          "title": "Far eliminare tutte le osservazioni critiche",
          "text": "Trasformo la revisione in manipolazione del feedback."
        }
      ],
      "feedback": "L’AI può supportare struttura e varianti, ma non deve alterare decisioni, inventare motivazioni o sostituire l’approvazione."
    },
    "P_DS_1": {
      "text": "Scrivi il prompt che useresti per creare una bozza di documento decisionale partendo da un brief, alcune note sparse e allegati parziali. Vuoi distinguere fatti, ipotesi, decisioni già prese e punti da confermare.",
      "hint": "Scrivi il prompt che useresti davvero per ottenere un documento revisionabile.",
      "rubric": {
        "criteria": [
          {
            "label": "Obiettivo e documento",
            "points": 1,
            "keywords": [
              "documento",
              "bozza",
              "decision",
              "obiettivo",
              "pubblico",
              "destinatari"
            ]
          },
          {
            "label": "Input disponibile",
            "points": 1,
            "keywords": [
              "note",
              "brief",
              "allegati",
              "materiale",
              "fonti"
            ]
          },
          {
            "label": "Distinzione fatti e ipotesi",
            "points": 1,
            "keywords": [
              "fatti",
              "ipotesi",
              "incert",
              "decisioni",
              "non invent",
              "da confermare"
            ]
          },
          {
            "label": "Formato e struttura",
            "points": 1,
            "keywords": [
              "formato",
              "struttura",
              "sezioni",
              "executive summary",
              "tabella"
            ]
          },
          {
            "label": "Chiarimenti e lacune",
            "points": 1,
            "keywords": [
              "domande",
              "chiariment",
              "manc",
              "ambig",
              "assunzioni"
            ]
          },
          {
            "label": "Revisione",
            "points": 1,
            "keywords": [
              "verifica",
              "controll",
              "revision",
              "coeren",
              "approv"
            ]
          }
        ],
        "redFlags": [
          {
            "label": "certezza artificiale",
            "points": 1,
            "keywords": [
              "rendilo certo",
              "presenta come fatto",
              "non mostrare dubbi",
              "inventa"
            ]
          },
          {
            "label": "pubblicazione automatica",
            "points": 1,
            "keywords": [
              "pubblica direttamente",
              "invia senza revisione",
              "versione definitiva"
            ]
          }
        ]
      },
      "feedback": "Il prompt dovrebbe produrre un documento utile ma revisionabile, distinguendo input disponibili, fatti, ipotesi, decisioni e punti da confermare."
    },
    "P_DS_2": {
      "text": "Quale prompt useresti per confrontare possibili soluzioni a un problema tecnico con informazioni ancora incomplete?",
      "hint": "Scegli la richiesta che rende espliciti dati mancanti e criteri.",
      "options": [
        {
          "score": 3,
          "title": "Proponi cinque soluzioni innovative",
          "text": "Amplia lo spazio delle idee, ma non struttura la valutazione."
        },
        {
          "score": 1,
          "title": "Scegli la soluzione migliore in assoluto",
          "text": "Presuppone un criterio universale e dati completi."
        },
        {
          "score": 5,
          "title": "Elenca ciò che manca, fammi domande e poi confronta opzioni rispetto a criteri e rischi dichiarati",
          "text": "Organizza incertezza, alternative e verifica."
        },
        {
          "score": 2,
          "title": "Agisci come un ingegnere senior e risolvi il problema",
          "text": "Il ruolo non sostituisce dati, vincoli e criteri."
        },
        {
          "score": 2,
          "title": "Dammi una risposta breve con pro e contro",
          "text": "Il formato è utile, ma lascia implicite assunzioni e informazioni mancanti."
        }
      ],
      "feedback": "Quando i dati sono incompleti, la qualità del prompt dipende soprattutto dalla gestione esplicita di lacune, assunzioni e criteri."
    },
    "P_DI_1": {
      "text": "L’AI genera una mini-dashboard e conclude: “le vendite sono cresciute del 18% grazie alla nuova campagna”, ma non mostra query, filtri, periodo di confronto né dati esclusi. Scrivi i controlli che faresti prima di presentare la dashboard.",
      "hint": "Indica il processo reale di verifica su dati, metriche e interpretazione.",
      "rubric": {
        "criteria": [
          {
            "label": "Origine dati e query",
            "points": 1,
            "keywords": [
              "dati",
              "query",
              "origine",
              "fonte",
              "dataset"
            ]
          },
          {
            "label": "Filtri e perimetro",
            "points": 1,
            "keywords": [
              "filtri",
              "perimetro",
              "esclusi",
              "segmenti",
              "campione"
            ]
          },
          {
            "label": "Definizione della metrica",
            "points": 1,
            "keywords": [
              "vendite",
              "definiz",
              "misura",
              "18",
              "metrica"
            ]
          },
          {
            "label": "Periodo e baseline",
            "points": 1,
            "keywords": [
              "periodo",
              "confronto",
              "baseline",
              "prima",
              "dopo"
            ]
          },
          {
            "label": "Causalità e fattori alternativi",
            "points": 1,
            "keywords": [
              "causa",
              "correl",
              "fattori",
              "selezione",
              "confond"
            ]
          },
          {
            "label": "Uso prudente",
            "points": 1,
            "keywords": [
              "non uso",
              "rimuovo",
              "cautela",
              "cit",
              "nota",
              "verifica"
            ]
          }
        ],
        "redFlags": [
          {
            "label": "accettazione del numero",
            "points": 1,
            "keywords": [
              "18% è preciso",
              "sembra realistico",
              "lo inserisco"
            ]
          },
          {
            "label": "autoconferma",
            "points": 1,
            "keywords": [
              "chiedo all'ai",
              "sei sicuro",
              "conferma al modello"
            ]
          }
        ]
      },
      "feedback": "Una dashboard va verificata su origine dati, query, filtri, metrica, periodo di confronto e nesso causale prima di presentarla."
    },
    "P_DG_1": {
      "text": "Vuoi usare l’AI per analizzare bozze di brevetto e documenti di sviluppo non ancora pubblici. Seleziona le precauzioni preliminari.",
      "hint": "Considera riservatezza, proprietà intellettuale e ambiente tecnico.",
      "options": [
        {
          "score": 2,
          "title": "Verifico strumenti autorizzati e condizioni contrattuali",
          "text": "Controllo trattamento, conservazione e uso dei contenuti."
        },
        {
          "score": 2,
          "title": "Limito il materiale alle parti strettamente necessarie",
          "text": "Ridimensiono l’esposizione informativa."
        },
        {
          "score": 1,
          "title": "Coinvolgo le funzioni competenti per il perimetro IP",
          "text": "Chiarisco vincoli di segretezza e divulgazione."
        },
        {
          "score": 1,
          "title": "Valuto un ambiente isolato o un modello approvato",
          "text": "Scelgo un’architettura adeguata alla sensibilità."
        },
        {
          "score": 1,
          "title": "Registro documenti, finalità e revisioni",
          "text": "Mantengo tracciabilità dell’uso."
        },
        {
          "score": -2,
          "title": "Uso un servizio pubblico ma senza inserire il titolo del progetto",
          "text": "I contenuti restano potenzialmente riservati."
        },
        {
          "score": -2,
          "title": "Carico tutto per ottenere un’analisi più completa",
          "text": "Massimizzo l’esposizione invece di minimizzarla."
        },
        {
          "score": -1,
          "title": "Sostituisco soltanto i nomi degli inventori",
          "text": "Il contenuto tecnico può rimanere identificabile e confidenziale."
        }
      ],
      "feedback": "Materiale brevettuale e di sviluppo richiede un controllo rigoroso di strumento, condizioni d’uso, minimizzazione e segretezza."
    },
    "P_M_1": {
      "text": "Una demo AI ha impressionato il management, ma non è stata provata su dati reali né confrontata con il processo attuale. Seleziona i passi successivi più utili.",
      "hint": "La domanda osserva come trasformi entusiasmo in apprendimento.",
      "options": [
        {
          "score": 2,
          "title": "Definisco una baseline del processo attuale",
          "text": "Stabilisco tempi, qualità, errori e costi da confrontare."
        },
        {
          "score": 1,
          "title": "Preparo un campione rappresentativo e controllato",
          "text": "Evito di valutare soltanto casi favorevoli."
        },
        {
          "score": 1,
          "title": "Stabilisco criteri di successo e di arresto",
          "text": "Rendo la decisione meno dipendente dall’entusiasmo."
        },
        {
          "score": 1,
          "title": "Testo errori, eccezioni e necessità di revisione",
          "text": "Misuro anche il lavoro nascosto."
        },
        {
          "score": 1,
          "title": "Coinvolgo utenti e responsabili del rischio",
          "text": "Valuto adozione, impatto e governance."
        },
        {
          "score": -2,
          "title": "Annuncio subito l’estensione a tutta l’azienda",
          "text": "Trasformo una dimostrazione in decisione senza prova."
        },
        {
          "score": -2,
          "title": "Scelgo solo esempi in cui la demo funziona bene",
          "text": "Costruisco una valutazione distorta."
        },
        {
          "score": -1,
          "title": "Respingo la demo perché non usa dati reali",
          "text": "Individuo un limite corretto, ma rinuncio a progettare un test adeguato."
        }
      ],
      "feedback": "Una demo è un’ipotesi: servono baseline, campione, criteri, eccezioni e valutazione del lavoro di revisione."
    }
  }
};

export const COMPLETE_QUESTION_IDS = [
  'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'TR_CITE',
  'AG1', 'AG2', 'AG3', 'AG4',
  'F_DE_1', 'F_DE_2', 'F_DE_3',
  'F_DS_1', 'F_DS_2', 'F_DS_3', 'TR_PROMPT',
  'F_DI_1', 'F_DI_2', 'F_DI_3', 'TR_SURE',
  'F_DG_1', 'F_DG_2', 'F_DG_3',
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7',
  'P_L_1', 'P_DE_1', 'P_DS_1', 'P_DS_2', 'P_DI_1', 'P_DG_1', 'P_M_1',
];

export type TestModeType = 'complete' | 'topic';

export interface TestMode {
  id: string;
  label: string;
  shortLabel: string;
  type: TestModeType;
  section: string | null;
  questionLimit: number;
  description: string;
  outputNote: string;
}

export const TEST_MODES: TestMode[] = [
  { id: 'complete', label: 'Test completo', shortLabel: 'Completo', type: 'complete', section: null, questionLimit: 50, description: 'Tutte le 50 domande: Literacy, fondamenti tecnici, AI Agents, Fluency 4D, Mindset e prove pratiche.', outputNote: 'Profilo completo con indice AI Skill, quadrante Literacy x Fluency e radar competenze.' },
  { id: 'literacy', label: 'Literacy', shortLabel: 'Literacy', type: 'topic', section: 'Literacy', questionLimit: 10, description: 'Comprensione di funzionamento, limiti, dati, fonti, privacy e affidabilità.', outputNote: 'Report tematico sulla Literacy, senza profilo globale.' },
  { id: 'technical', label: 'Fondamenti tecnici LLM', shortLabel: 'Tecnica', type: 'topic', section: 'Fondamenti tecnici LLM', questionLimit: 10, description: 'Token, contesto, inferenza, reti neurali, Transformer, allucinazioni, RAG, embedding e citazioni.', outputNote: 'Report tematico sui fondamenti tecnici, senza profilo globale.' },
  { id: 'agents', label: 'AI Agents', shortLabel: 'Agents', type: 'topic', section: 'AI Agents', questionLimit: 10, description: 'Agenti AI, strumenti, permessi, memoria, controllo umano, log e workflow operativo.', outputNote: 'Report tematico sugli AI Agents, senza profilo globale.' },
  { id: 'delegation', label: 'Fluency - Delegation', shortLabel: 'Delegation', type: 'topic', section: 'Fluency · Delegation', questionLimit: 10, description: 'Scelta dei task delegabili, scomposizione del lavoro e responsabilità umana.', outputNote: 'Report tematico sulla Delegation, senza profilo globale.' },
  { id: 'description', label: 'Fluency - Description', shortLabel: 'Description', type: 'topic', section: 'Fluency · Description', questionLimit: 10, description: 'Qualità del brief: obiettivi, vincoli, contesto, formato e criteri di qualità.', outputNote: 'Report tematico sulla Description, senza profilo globale.' },
  { id: 'discernment', label: 'Fluency - Discernment', shortLabel: 'Discernment', type: 'topic', section: 'Fluency · Discernment', questionLimit: 10, description: "Valutazione critica di output, dati, fonti, utilità e rischi prima dell'uso.", outputNote: 'Report tematico sul Discernment, senza profilo globale.' },
  { id: 'diligence', label: 'Fluency - Diligence', shortLabel: 'Diligence', type: 'topic', section: 'Fluency · Diligence', questionLimit: 10, description: 'Uso responsabile, trasparente e proporzionato della GenAI nel lavoro reale.', outputNote: 'Report tematico sulla Diligence, senza profilo globale.' },
  { id: 'mindset', label: 'Mindset', shortLabel: 'Mindset', type: 'topic', section: 'Mindset', questionLimit: 10, description: 'Attitudine, fiducia calibrata, sperimentazione e disponibilità a cambiare workflow.', outputNote: 'Report tematico sul Mindset, senza profilo globale.' },
  { id: 'practical', label: 'Practical Lab', shortLabel: 'Practical Lab', type: 'topic', section: 'Practical Lab', questionLimit: 10, description: 'Mini-prove operative, prompt, checklist e controlli applicati a casi concreti.', outputNote: 'Report tematico sulle prove pratiche, senza profilo globale.' },
];

export function buildQuestionForm(formId: FormId): AssessQuestion[] {
  const overrides = FORM_OVERRIDES[formId] || {};
  return BASE_QUESTIONS.map(baseQ => {
    const override = overrides[baseQ.id] || {};
    const merged: AssessQuestion = {
      ...JSON.parse(JSON.stringify(baseQ)),
      ...JSON.parse(JSON.stringify(override)),
      sourceId: baseQ.id,
      formId,
      id: `${formId}_${baseQ.id}`,
    };
    return merged;
  });
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function selectQuestionsForMode(allQuestions: AssessQuestion[], mode: TestMode): AssessQuestion[] {
  if (mode.type === 'complete') {
    return COMPLETE_QUESTION_IDS.map(id => allQuestions.find(q => q.sourceId === id || q.id === id)).filter(Boolean) as AssessQuestion[];
  }
  const pool = allQuestions.filter(q => q.section === mode.section);
  return pool.slice(0, mode.questionLimit);
}
