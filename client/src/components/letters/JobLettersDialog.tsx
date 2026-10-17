import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Ban, Eye, Loader2, Send } from "lucide-react";
import { LetterStatusBadge, type LetterStatus } from "./LetterStatusBadge";

interface JobLetter {
  id: string;
  userName: string;
  status: LetterStatus;
  fileFormat: "pdf" | "docx";
  requiresSignature: boolean;
  dueDate: number | null;
  publishedAt: number | null;
  versionNote: string | null;
  version: number | null;
  replaces: { id: string; version: number; publishedAt: number | null } | null;
  replacedBy: { id: string; version: number; publishedAt: number | null } | null;
  /** Drafts only: the current letter that publishing with "replace" would supersede. */
  wouldReplace: { id: string; status: LetterStatus; publishedAt: number | null; version: number } | null;
}

const fmtDate = (unix: number | null) => unix ? new Date(unix * 1000).toLocaleDateString("it-IT") : "";

function VersionLine({ letter, replacePrevious }: { letter: JobLetter; replacePrevious: boolean }) {
  if (letter.status === "draft") {
    const prev = letter.wouldReplace;
    if (!prev) return null;
    if (!replacePrevious) {
      return <p className="text-[11px] text-amber-700">Ha già la v{prev.version} del {fmtDate(prev.publishedAt)}: senza sostituzione vedrà due lettere</p>;
    }
    return prev.status === "signed"
      ? <p className="text-[11px] text-amber-700">Nuova v{prev.version + 1}: la v{prev.version} è già firmata, resterà valida e collegata</p>
      : <p className="text-[11px] text-sky-700">Nuova v{prev.version + 1}: sostituirà la v{prev.version} del {fmtDate(prev.publishedAt)}</p>;
  }
  return (
    <>
      {letter.replaces && <p className="text-[11px] text-slate-500">v{letter.version} · sostituisce la v{letter.replaces.version} del {fmtDate(letter.replaces.publishedAt)}</p>}
      {letter.versionNote && <p className="text-[11px] text-slate-500 truncate">Motivo: {letter.versionNote}</p>}
      {letter.replacedBy && <p className="text-[11px] text-slate-500">Sostituita dalla v{letter.replacedBy.version} del {fmtDate(letter.replacedBy.publishedAt)}</p>}
    </>
  );
}

/** Admin view of the employee copies produced by a generation job: publish, revoke, preview. */
export function JobLettersDialog({ jobId, open, onOpenChange }: {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const queryKey = [`/api/doc/jobs/${jobId}/letters`];
  const { data: letters = [], isLoading } = useQuery<JobLetter[]>({ queryKey, enabled: open && !!jobId });

  const drafts = letters.filter(l => l.status === "draft");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [replacePrevious, setReplacePrevious] = useState(true);
  const [versionNote, setVersionNote] = useState("");
  const selectedReplacing = drafts.some(d => selected.has(d.id) && d.wouldReplace);

  // Select every draft by default whenever the list changes.
  useEffect(() => { setSelected(new Set(drafts.map(d => d.id))); }, [letters]);

  const publish = useMutation({
    mutationFn: () => apiRequest("POST", `/api/doc/jobs/${jobId}/publish`, {
      letterIds: Array.from(selected),
      requiresSignature,
      dueDate: requiresSignature && dueDate ? dueDate : null,
      replacePrevious,
      versionNote: replacePrevious && versionNote.trim() ? versionNote.trim() : undefined,
    }).then(r => r.json()),
    onSuccess: (d: { published: number; replaced: number; signedLinked: number }) => {
      qc.invalidateQueries({ queryKey });
      const details = [
        d.replaced ? `${d.replaced} versioni precedenti marcate come sostituite` : "",
        d.signedLinked ? `${d.signedLinked} sostituiscono lettere già firmate, che restano valide` : "",
      ].filter(Boolean).join(" · ");
      toast({ title: `${d.published} lettere pubblicate nell'area personale`, description: details || undefined });
      setVersionNote("");
    },
    onError: (e) => toast({ title: "Errore pubblicazione", description: String(e), variant: "destructive" }),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/doc/letters/${id}/revoke`),
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast({ title: "Lettera revocata" }); },
    onError: (e) => toast({ title: "Errore revoca", description: String(e), variant: "destructive" }),
  });

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const hasDocx = letters.some(l => l.fileFormat === "docx");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lettere nell'area personale</DialogTitle>
          <DialogDescription>
            Le lettere generate restano in bozza finché non le pubblichi: solo allora il dipendente le vede.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : letters.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            Nessuna lettera personale per questa generazione (nessun destinatario abbinato a un utente).
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {hasDocx && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                Alcune lettere sono in DOCX perché LibreOffice non è disponibile sul server: si possono consultare ma non firmare.
              </p>
            )}

            <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
              {letters.map(l => (
                <div key={l.id} className="flex items-center gap-3 px-3 py-2">
                  {l.status === "draft" ? (
                    <Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggle(l.id)} aria-label={`Seleziona ${l.userName}`} />
                  ) : <span className="w-4" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.userName}</p>
                    <VersionLine letter={l} replacePrevious={replacePrevious} />
                    {l.publishedAt && (
                      <p className="text-[11px] text-slate-400">
                        Pubblicata il {new Date(l.publishedAt * 1000).toLocaleDateString("it-IT")}
                        {l.requiresSignature && " · firma richiesta"}
                        {l.dueDate && ` · entro il ${new Date(l.dueDate * 1000).toLocaleDateString("it-IT")}`}
                      </p>
                    )}
                  </div>
                  <LetterStatusBadge status={l.status} />
                  <a href={`/api/doc/letters/${l.id}/file`} target="_blank" rel="noreferrer" title="Apri">
                    <Button size="icon" variant="ghost" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                  </a>
                  {(l.status === "published" || l.status === "viewed") && (
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7 text-red-600" title="Revoca"
                      disabled={revoke.isPending}
                      onClick={() => { if (confirm(`Revocare la lettera di ${l.userName}?`)) revoke.mutate(l.id); }}
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {drafts.length > 0 && (
              <div className="flex flex-col gap-3 border rounded-lg p-3 bg-slate-50">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={requiresSignature} onCheckedChange={v => setRequiresSignature(v === true)} />
                  Richiede la firma del dipendente
                </label>
                {requiresSignature && (
                  <div className="flex items-center gap-2 pl-6">
                    <Label htmlFor="due-date" className="text-xs text-slate-600">Scadenza firma</Label>
                    <Input id="due-date" type="date" className="h-8 w-44" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={replacePrevious} onCheckedChange={v => setReplacePrevious(v === true)} />
                  Pubblica come nuova versione delle lettere dello stesso modello già inviate
                </label>
                {replacePrevious && (
                  <p className="pl-6 -mt-2 text-[11px] text-slate-500">
                    La versione precedente resta visibile al dipendente come "Sostituita"; quelle già firmate restano valide.
                  </p>
                )}
                {replacePrevious && selectedReplacing && (
                  <div className="flex flex-col gap-1 pl-6">
                    <Label htmlFor="version-note" className="text-xs text-slate-600">Motivo della nuova versione (facoltativo, visibile al dipendente)</Label>
                    <Textarea
                      id="version-note" rows={2} maxLength={500} value={versionNote}
                      onChange={e => setVersionNote(e.target.value)}
                      placeholder="Es. corretto l'importo del bonus"
                      className="text-sm"
                    />
                  </div>
                )}
                <Button
                  className="self-end gap-2"
                  disabled={selected.size === 0 || publish.isPending}
                  onClick={() => publish.mutate()}
                >
                  {publish.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Pubblica {selected.size} {selected.size === 1 ? "lettera" : "lettere"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
