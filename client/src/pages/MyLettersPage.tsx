import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { renderAsync } from "docx-preview";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { LetterStatusBadge, type LetterStatus } from "@/components/letters/LetterStatusBadge";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarClock, Download, FileText, History, Loader2, Mail, PenLine, ShieldCheck } from "lucide-react";
import { SignLetterDialog } from "@/components/letters/SignLetterDialog";

interface MyLetter {
  id: string;
  title: string;
  letterType: string;
  fileFormat: "pdf" | "docx";
  status: LetterStatus;
  requiresSignature: boolean;
  dueDate: number | null;
  publishedAt: number | null;
  viewedAt: number | null;
  signedAt: number | null;
  supersededAt: number | null;
  version: number;
  versionNote: string | null;
  replaces: { id: string; version: number; publishedAt: number | null; visible: boolean } | null;
  replacedBy: { id: string; version: number; publishedAt: number | null } | null;
  signature: { transactionId: string; signedAt: number; hasSignedFile: boolean } | null;
}

const isSignable = (l: MyLetter) => l.requiresSignature && (l.status === "published" || l.status === "viewed");

type Filter = "all" | "unread" | "to_sign" | "signed";

const FILTERS: { id: Filter; label: string; match: (l: MyLetter) => boolean }[] = [
  { id: "all", label: "Tutte", match: () => true },
  { id: "unread", label: "Da leggere", match: l => l.status === "published" },
  { id: "to_sign", label: "Da firmare", match: l => l.requiresSignature && l.status !== "signed" && l.status !== "superseded" },
  { id: "signed", label: "Firmate", match: l => l.status === "signed" },
];

const fmtDate = (unix: number | null) => unix ? new Date(unix * 1000).toLocaleDateString("it-IT") : "";

function fileUrl(id: string, download = false) {
  return `/api/me/letters/${id}/file${download ? "?download=1" : ""}`;
}

export default function MyLettersPage() {
  const qc = useQueryClient();
  const { data: letters = [], isLoading } = useQuery<MyLetter[]>({ queryKey: ["/api/me/letters"] });
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signOpen, setSignOpen] = useState(false);

  const visible = letters.filter(FILTERS.find(f => f.id === filter)!.match);
  const selected = letters.find(l => l.id === selectedId) ?? null;

  // Loading the file marks the letter as viewed server-side: refresh the badges.
  function handleViewed() {
    if (selected?.status === "published") qc.invalidateQueries({ queryKey: ["/api/me/letters"] });
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        context="Area personale"
        title="Le mie lettere"
        description="Le comunicazioni che l'HR ti ha inviato. Sono visibili solo a te."
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => {
          const count = letters.filter(f.match).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400",
              )}
            >
              {f.label}{f.id !== "all" && count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : letters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Mail className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">Non hai ancora ricevuto lettere</p>
            <p className="text-xs text-slate-500">Quando l'HR pubblicherà una comunicazione per te, la troverai qui.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-4">
          <div className="flex flex-col gap-2">
            {visible.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">Nessuna lettera in questa categoria.</p>
            )}
            {visible.map(l => (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={cn(
                  "text-left border rounded-lg p-3 bg-white transition-colors",
                  selectedId === l.id ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-400",
                  l.status === "superseded" && "bg-slate-50 opacity-70",
                )}
              >
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm truncate", l.status === "published" ? "font-semibold" : "font-medium")}>
                      {l.title}
                      {(l.version > 1 || l.replacedBy) && <span className="ml-1 text-xs font-normal text-slate-500">· v{l.version}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400">Ricevuta il {fmtDate(l.publishedAt)}</p>
                  </div>
                  <LetterStatusBadge status={l.status} />
                </div>
                {l.replaces && l.status !== "superseded" && (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-sky-700">
                    <History className="w-3 h-3" /> Nuova versione: sostituisce quella del {fmtDate(l.replaces.publishedAt)}
                  </p>
                )}
                {l.replacedBy && (
                  <p className="mt-2 text-[11px] text-slate-500">Sostituita dalla versione {l.replacedBy.version} del {fmtDate(l.replacedBy.publishedAt)}</p>
                )}
                {l.requiresSignature && l.status !== "signed" && l.status !== "superseded" && (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-700">
                    <PenLine className="w-3 h-3" /> Firma richiesta{l.dueDate ? ` entro il ${fmtDate(l.dueDate)}` : ""}
                  </p>
                )}
              </button>
            ))}
          </div>

          <Card className="min-h-[70vh]">
            {selected ? (
              <CardContent className="p-0 flex flex-col h-full">
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {selected.title}
                      {(selected.version > 1 || selected.replacedBy) && <span className="ml-1 font-normal text-slate-500">· versione {selected.version}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" /> Pubblicata il {fmtDate(selected.publishedAt)}
                      {selected.signedAt && ` · firmata il ${fmtDate(selected.signedAt)}`}
                    </p>
                  </div>
                  <a href={fileUrl(selected.id, true)}>
                    <Button size="sm" variant="outline" className="gap-1"><Download className="w-3.5 h-3.5" /> Scarica</Button>
                  </a>
                  {isSignable(selected) && selected.fileFormat === "pdf" && (
                    <Button
                      size="sm" className="gap-1"
                      disabled={!selected.viewedAt}
                      title={selected.viewedAt ? undefined : "Apri la lettera prima di firmarla"}
                      onClick={() => setSignOpen(true)}
                    >
                      <PenLine className="w-3.5 h-3.5" /> Firma
                    </Button>
                  )}
                </div>
                <VersionBanner letter={selected} onOpen={setSelectedId} />
                <SignatureBanner letter={selected} />
                {isSignable(selected) && (
                  <SignLetterDialog
                    letterId={selected.id} letterTitle={selected.title}
                    open={signOpen} onOpenChange={setSignOpen}
                  />
                )}
                <LetterViewer letter={selected} onLoaded={handleViewed} />
              </CardContent>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full gap-2 py-24 text-center">
                <FileText className="w-10 h-10 text-slate-300" />
                <p className="text-sm text-slate-500">Seleziona una lettera per leggerla</p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

/** Signature state of the open letter: completed, required, or not possible (DOCX). */
function SignatureBanner({ letter }: { letter: MyLetter }) {
  if (letter.signature) {
    return (
      <div className="flex items-center gap-2 border-b bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <p>
          Firmata da te il {new Date(letter.signature.signedAt * 1000).toLocaleString("it-IT")} con codice via email
          <span className="text-emerald-600"> · ID transazione {letter.signature.transactionId}</span>
        </p>
        {letter.signature.hasSignedFile && (
          <a href={`/api/me/letters/${letter.id}/file?original=1&download=1`} className="ml-auto shrink-0 underline">
            Scarica l'originale
          </a>
        )}
      </div>
    );
  }
  if (!isSignable(letter)) return null;
  if (letter.fileFormat !== "pdf") {
    return (
      <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-800">
        Questa lettera richiede la firma ma non è disponibile in PDF: contatta l'Ufficio HR.
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-800">
      <PenLine className="w-4 h-4 shrink-0" />
      <p>
        Questa lettera richiede la tua firma{letter.dueDate ? ` entro il ${fmtDate(letter.dueDate)}` : ""}.
        {letter.viewedAt ? " Dopo averla letta, usa il pulsante Firma." : " Il pulsante Firma si attiva dopo l'apertura."}
      </p>
    </div>
  );
}

/** Explains where a letter sits in its version chain and links to the neighbouring versions. */
function VersionBanner({ letter, onOpen }: { letter: MyLetter; onOpen: (id: string) => void }) {
  if (letter.status === "superseded") {
    return (
      <div className="flex items-center gap-3 border-b bg-amber-50 px-4 py-2 text-xs text-amber-800">
        <History className="w-4 h-4 shrink-0" />
        <p className="flex-1">
          Questa versione è stata sostituita{letter.supersededAt ? ` il ${fmtDate(letter.supersededAt)}` : ""} e non è più valida.
          La conservi solo per consultazione.
        </p>
        {letter.replacedBy && (
          <Button size="sm" variant="outline" className="h-7 gap-1 shrink-0" onClick={() => onOpen(letter.replacedBy!.id)}>
            Vai alla versione {letter.replacedBy.version} <ArrowRight className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }
  if (letter.replacedBy) {
    // Signed letters are never superseded, but a newer version may follow them.
    return (
      <div className="flex items-center gap-3 border-b bg-sky-50 px-4 py-2 text-xs text-sky-900">
        <History className="w-4 h-4 shrink-0" />
        <p className="flex-1">
          È disponibile una versione più recente (versione {letter.replacedBy.version} del {fmtDate(letter.replacedBy.publishedAt)}).
          Questa lettera firmata resta valida.
        </p>
        <Button size="sm" variant="outline" className="h-7 gap-1 shrink-0" onClick={() => onOpen(letter.replacedBy!.id)}>
          Vai alla versione {letter.replacedBy.version} <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    );
  }
  if (!letter.replaces) return null;
  return (
    <div className="flex items-start gap-3 border-b bg-sky-50 px-4 py-2 text-xs text-sky-900">
      <History className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p>
          Questa è la versione {letter.version} e sostituisce la versione {letter.replaces.version} del {fmtDate(letter.replaces.publishedAt)}.
        </p>
        {letter.versionNote && <p className="mt-1"><span className="font-semibold">Motivo dell'aggiornamento:</span> {letter.versionNote}</p>}
      </div>
      {letter.replaces.visible && (
        <Button size="sm" variant="ghost" className="h-7 shrink-0" onClick={() => onOpen(letter.replaces!.id)}>
          Vedi versione {letter.replaces.version}
        </Button>
      )}
    </div>
  );
}

function LetterViewer({ letter, onLoaded }: { letter: MyLetter; onLoaded: () => void }) {
  if (letter.fileFormat === "pdf") {
    return (
      <iframe
        key={letter.id} src={fileUrl(letter.id)} title={letter.title} onLoad={onLoaded}
        className="flex-1 w-full min-h-[70vh] rounded-b-lg"
      />
    );
  }
  return <DocxViewer key={letter.id} url={fileUrl(letter.id)} onLoaded={onLoaded} />;
}

function DocxViewer({ url, onLoaded }: { url: string; onLoaded: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(url, { credentials: "include" })
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .then(async blob => {
        if (cancelled || !ref.current) return;
        await renderAsync(blob, ref.current);
        onLoaded();
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [url]);

  if (error) return <p className="p-6 text-sm text-red-600">Impossibile visualizzare la lettera. Prova a scaricarla.</p>;
  return <div ref={ref} className="flex-1 overflow-auto bg-slate-100 p-4" />;
}
