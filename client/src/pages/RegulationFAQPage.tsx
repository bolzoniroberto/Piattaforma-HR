import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, HelpCircle, MessageCircle, Info, ArrowLeft, AlertTriangle, Star } from "lucide-react";

export function RegulationFAQPageActions() {
  const [, setLocation] = useLocation();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLocation("/regulation")}
      className="gap-2 border-slate-200 text-slate-700 font-bold h-9 px-4"
    >
      <ArrowLeft className="h-4 w-4" />
      Testo Regolamento
    </Button>
  );
}

type Importance = "critical" | "high" | "standard";

interface FaqItem {
  q: string;
  a: string;
  important?: boolean;
}

interface FaqSection {
  category: string;
  importance: Importance;
  items: FaqItem[];
}

const FAQ_ITEMS: FaqSection[] = [
  {
    category: "Entry Gate",
    importance: "critical",
    items: [
      {
        q: "Cos'è l'Entry Gate?",
        a: "L'Entry Gate è un indicatore aziendale (es. EBITDA, fatturato, margine operativo) che deve essere raggiunto affinché venga erogato qualsiasi bonus MBO. Se il valore consuntivo non raggiunge la soglia definita (tipicamente il 95% del target), nessun bonus viene erogato, indipendentemente dal raggiungimento dei singoli obiettivi.",
        important: true,
      },
      {
        q: "Cosa succede se l'Entry Gate non viene superato?",
        a: "Se l'Entry Gate non è superato, il bonus MBO non viene erogato a nessun beneficiario. È una condizione necessaria (ma non sufficiente) per l'erogazione. Questo principio tutela l'azienda in situazioni di difficoltà economica.",
        important: true,
      },
      {
        q: "L'Entry Gate si applica a tutti allo stesso modo?",
        a: "Sì, l'Entry Gate è un requisito aziendale trasversale. Si applica a tutti i beneficiari del piano MBO, indipendentemente dalla categoria (DIRS, CEO, dirigenti, quadri).",
      },
    ],
  },
  {
    category: "Principi Generali",
    importance: "high",
    items: [
      {
        q: "Cos'è il sistema MBO?",
        a: "Il Management By Objectives (MBO) è un sistema incentivante che lega parte della retribuzione variabile al raggiungimento di obiettivi predefiniti. Gli obiettivi vengono concordati all'inizio del periodo di riferimento e verificati a consuntivo.",
        important: true,
      },
      {
        q: "Chi è coinvolto nel piano MBO?",
        a: "Il piano MBO coinvolge i dipendenti identificati come beneficiari: Dirigenti con Responsabilità Strategiche (DIRS), il CEO, altri dirigenti e quadri selezionati. La percentuale MBO sul RAL varia a seconda della categoria di appartenenza.",
      },
      {
        q: "Quando viene pagato il bonus MBO?",
        a: "Il bonus viene liquidato dopo l'approvazione del bilancio annuale da parte del Consiglio di Amministrazione, solitamente entro il primo semestre dell'anno successivo. Il pagamento è soggetto al superamento dell'Entry Gate aziendale.",
      },
    ],
  },
  {
    category: "Obiettivi e Calcolo",
    importance: "high",
    items: [
      {
        q: "Come viene calcolato il bonus finale?",
        a: "Il bonus finale si calcola: RAL × percentuale MBO × (somma pesata dei payout degli obiettivi). Ogni obiettivo contribuisce in proporzione al suo peso (es. 20%, 30%). Il totale dei pesi deve essere pari al 100%. Il risultato è poi soggetto all'Entry Gate aziendale.",
        important: true,
      },
      {
        q: "Cosa succede se raggiungo solo parzialmente un obiettivo?",
        a: "Ogni obiettivo ha una soglia (threshold) al di sotto della quale il contributo è pari a zero. Al raggiungimento della soglia, si ottiene tipicamente il 50% del payout dell'obiettivo. Tra la soglia e il 100% del target, il payout viene interpolato linearmente.",
      },
      {
        q: "Posso superare il 100% degli obiettivi?",
        a: "Dipende dalla categoria di appartenenza. I DIRS possono raggiungere fino al 120% della performance con payout massimo pari al 108% del bonus target. Il CEO può arrivare fino al 116%. Per tutti gli altri beneficiari, il payout è cappato al 100% anche in caso di risultati superiori al target.",
      },
      {
        q: "Gli obiettivi ESG sono obbligatori?",
        a: "Sì, il regolamento prevede che una quota degli obiettivi, generalmente il 20%, sia dedicata a obiettivi ESG (Environmental, Social, Governance). Questi obiettivi hanno lo stesso meccanismo di calcolo degli altri ma afferiscono a cluster specifici di sostenibilità.",
      },
    ],
  },
  {
    category: "Tipi di Beneficiario",
    importance: "standard",
    items: [
      {
        q: "Cosa significa DIRS?",
        a: "DIRS sta per Dirigenti con Responsabilità Strategiche. Si tratta di dirigenti che ricoprono posizioni chiave nell'organizzazione e che sono soggetti a regole specifiche nel piano MBO, tra cui la possibilità di overperformance.",
      },
      {
        q: "Quali sono le differenze tra DIRS, CEO e dirigenti standard?",
        a: "Le differenze principali riguardano la percentuale MBO sul RAL e le regole di overperformance:\n• CEO: può raggiungere fino al 116% del bonus base in caso di risultati eccezionali.\n• DIRS: possono raggiungere fino al 120% della performance, con un payout massimo pari al 108% del bonus target.\n• Dirigenti/Quadri standard: il payout è cappato al 100% del bonus target, senza possibilità di overperformance.",
      },
    ],
  },
  {
    category: "Situazioni Speciali",
    importance: "standard",
    items: [
      {
        q: "Cosa succede se entro in azienda a metà anno?",
        a: "Il regolamento prevede un meccanismo di pro-rata per i nuovi ingressi: il bonus viene calcolato proporzionalmente ai mesi lavorati nell'anno di riferimento. Tuttavia, il regolamento lascia discrezionalità nella gestione, pertanto il coefficiente applicato viene valutato caso per caso dall'azienda.",
      },
      {
        q: "Cosa sono il Good Leaver e il Bad Leaver?",
        a: "Il 'Good Leaver' è chi lascia l'azienda in modo consensuale (pensionamento, accordo, dimissioni concordate). In questo caso può avere diritto a una quota pro-rata del bonus maturato fino alla data di uscita. Il 'Bad Leaver' è chi lascia per giusta causa o viene licenziato per motivi disciplinari gravi: in tal caso decade ogni diritto al bonus.",
      },
      {
        q: "Cosa sono Malus e Claw-back?",
        a: "Il Malus è una riduzione del bonus prima del pagamento, applicata in caso di eventi negativi significativi. Il Claw-back consente all'azienda di richiedere la restituzione del bonus già pagato se entro un certo periodo (tipicamente 2 anni) emergono gravi irregolarità o comportamenti che lo avrebbero precluso.",
      },
    ],
  },
  {
    category: "Riservatezza e Norme",
    importance: "standard",
    items: [
      {
        q: "Il regolamento MBO è riservato?",
        a: "Sì. Il contenuto del piano MBO (obiettivi, target, pesi, retribuzione variabile) è strettamente riservato. I beneficiari si impegnano a non divulgare queste informazioni a terzi. La violazione dell'obbligo di riservatezza può costituire grave inadempimento contrattuale.",
      },
      {
        q: "Quale foro è competente in caso di controversie?",
        a: "In caso di controversie relative al piano MBO, il foro competente è quello di Milano, salvo diversa indicazione nel contratto individuale del beneficiario.",
      },
    ],
  },
];

function CriticalSection({ section }: { section: FaqSection }) {
  return (
    <div className="bg-[#111827] text-white rounded-xl overflow-hidden relative col-span-full">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
              {section.category}
            </span>
          </div>
          <div className="border border-white/20 px-2 py-1 text-[9px] uppercase tracking-widest font-bold rounded">
            CONDIZIONE NECESSARIA
          </div>
        </div>

        {/* Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {section.items.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-5 flex flex-col gap-3 ${
                item.important
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              <div className="flex items-start gap-2">
                {item.important && (
                  <Star className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" fill="currentColor" />
                )}
                <p className="text-sm font-bold text-white leading-snug">{item.q}</p>
              </div>
              <p className="text-xs text-white/60 leading-relaxed font-medium whitespace-pre-line">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HighSection({ section }: { section: FaqSection }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm relative">
      {/* Accent bar */}
      <div className="h-1 w-full bg-slate-800 absolute top-0 left-0" />
      <div className="p-6 pt-7">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-slate-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              {section.category}
            </p>
          </div>
          <div className="ml-auto bg-blue-50 text-blue-800 px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded">
            PRIORITÀ ALTA
          </div>
        </div>

        <Accordion type="multiple" className="space-y-2">
          {section.items.map((item, idx) => (
            <AccordionItem
              key={idx}
              value={`${section.category}-${idx}`}
              className={`border rounded-lg px-4 transition-colors data-[state=open]:shadow-sm ${
                item.important
                  ? "border-slate-200 bg-slate-50/50 data-[state=open]:bg-white data-[state=open]:border-slate-300"
                  : "border-slate-100 bg-slate-50/20 data-[state=open]:bg-white data-[state=open]:border-slate-200"
              }`}
            >
              <AccordionTrigger className="text-left text-sm font-bold text-slate-900 hover:no-underline py-4 leading-tight">
                <span className="flex items-center gap-2 flex-1 pr-4">
                  {item.important && (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-800 shrink-0" />
                  )}
                  {item.q}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 pb-5 leading-relaxed font-medium">
                <div className="pl-1 border-l-2 border-slate-300 ml-1 whitespace-pre-line">
                  {item.a}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

function StandardSection({ section }: { section: FaqSection }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition-all">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-50 pb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <HelpCircle className="h-4 w-4 text-slate-500" />
          </div>
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {section.category}
          </h2>
        </div>

        <Accordion type="multiple" className="space-y-2">
          {section.items.map((item, idx) => (
            <AccordionItem
              key={idx}
              value={`${section.category}-${idx}`}
              className="border border-slate-100 rounded-lg px-4 bg-slate-50/20 hover:bg-slate-50 transition-colors data-[state=open]:bg-white data-[state=open]:border-slate-200"
            >
              <AccordionTrigger className="text-left text-sm font-semibold text-slate-700 hover:no-underline py-3.5 leading-tight">
                <span className="flex-1 pr-4">{item.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-500 pb-4 leading-relaxed whitespace-pre-line">
                <div className="pl-1 border-l-2 border-slate-100 ml-1">
                  {item.a}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

export default function RegulationFAQPage() {
  const criticalSections = FAQ_ITEMS.filter((s) => s.importance === "critical");
  const highSections = FAQ_ITEMS.filter((s) => s.importance === "high");
  const standardSections = FAQ_ITEMS.filter((s) => s.importance === "standard");

  return (
    <div className="w-full space-y-6">
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#111827]" />
          Fondamentale
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-800" />
          Alta priorità
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          Informativo
        </span>
      </div>

      {/* Critical — full width dark */}
      <div className="grid grid-cols-1 gap-6">
        {criticalSections.map((s) => (
          <CriticalSection key={s.category} section={s} />
        ))}
      </div>

      {/* High priority — 2 col */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {highSections.map((s) => (
          <HighSection key={s.category} section={s} />
        ))}
      </div>

      {/* Standard — 2 col */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {standardSections.map((s) => (
          <StandardSection key={s.category} section={s} />
        ))}
      </div>

      {/* Footer callout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold">Hai ancora dei dubbi?</p>
              <p className="text-white/60 text-sm">Il team HR è a disposizione per chiarimenti personalizzati sul tuo piano MBO.</p>
            </div>
          </div>
          <Button className="bg-white text-slate-900 hover:bg-white/90 font-bold shrink-0">
            Contatta HR Support
          </Button>
        </div>

        <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold text-xs uppercase tracking-wider">
            <Info className="h-4 w-4" />
            Informazione Importante
          </div>
          <p className="text-[11px] text-amber-900/70 leading-relaxed font-medium">
            In caso di discrepanze tra queste FAQ e il regolamento ufficiale MBO 2026,
            prevale esclusivamente il testo del regolamento firmato.
          </p>
        </div>
      </div>
    </div>
  );
}
