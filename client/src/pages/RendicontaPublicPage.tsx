import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle, AlertCircle, Loader2, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DictionaryPublic {
  id: string;
  title: string;
  description?: string;
  objectiveType: string;
  targetValue?: number | null;
  dataSource?: string | null;
  actualValue?: number | null;
  qualitativeResult?: string | null;
  reportedAt?: number | null;
}

export default function RendicontaPublicPage() {
  const { token } = useParams<{ token: string }>();
  const [actualValue, setActualValue] = useState("");
  const [qualitativeResult, setQualitativeResult] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: dictionary, isLoading, isError } = useQuery<DictionaryPublic>({
    queryKey: [`/api/r/${token}`],
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = { notes };
      if (dictionary?.objectiveType === "numeric") {
        payload.actualValue = parseFloat(actualValue);
      } else {
        payload.qualitativeResult = qualitativeResult;
      }
      const res = await apiRequest("POST", `/api/r/${token}`, payload);
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
  });

  const isValid = dictionary?.objectiveType === "numeric"
    ? actualValue !== "" && !isNaN(parseFloat(actualValue))
    : qualitativeResult !== "";

  // ─── States ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-slate-500 text-sm">Caricamento in corso...</p>
        </div>
      </PageShell>
    );
  }

  if (isError || !dictionary) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Link non valido o scaduto</h2>
          <p className="text-slate-500 text-sm max-w-xs">
            Questo link di rendicontazione non è valido o è scaduto (i link sono validi 30 giorni).
            Contatta l'amministratore per ricevere un nuovo link.
          </p>
        </div>
      </PageShell>
    );
  }

  if (submitted) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Rendicontazione inviata</h2>
          <p className="text-slate-500 text-sm max-w-xs">
            Il dato consuntivo è stato registrato con successo. Grazie per la collaborazione.
          </p>
        </div>
      </PageShell>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Objective info */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
            {dictionary.objectiveType === "numeric" ? "Obiettivo quantitativo" : "Obiettivo qualitativo"}
          </p>
          <h2 className="text-lg font-bold text-slate-900">{dictionary.title}</h2>
          {dictionary.description && (
            <p className="text-sm text-slate-500">{dictionary.description}</p>
          )}
          <div className="flex flex-wrap gap-4 pt-1">
            {dictionary.targetValue != null && (
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Target: </span>{dictionary.targetValue}
              </div>
            )}
            {dictionary.dataSource && (
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Fonte: </span>{dictionary.dataSource}
              </div>
            )}
          </div>
          {dictionary.reportedAt && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1 mt-1">
              Già rendicontato il {new Date(dictionary.reportedAt * 1000).toLocaleDateString("it-IT")} — puoi aggiornare il valore.
            </p>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          {dictionary.objectiveType === "numeric" ? (
            <div className="space-y-2">
              <Label htmlFor="actual-value">Valore Consuntivo *</Label>
              <Input
                id="actual-value"
                type="number"
                step="any"
                value={actualValue}
                onChange={(e) => setActualValue(e.target.value)}
                placeholder={dictionary.targetValue != null ? `Target: ${dictionary.targetValue}` : "Inserisci il valore"}
                className="text-lg"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="qualitative-result">Risultato *</Label>
              <Select value={qualitativeResult} onValueChange={setQualitativeResult}>
                <SelectTrigger id="qualitative-result">
                  <SelectValue placeholder="Seleziona il risultato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reached">Raggiunto</SelectItem>
                  <SelectItem value="partial">Parzialmente raggiunto</SelectItem>
                  <SelectItem value="not_reached">Non raggiunto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Note (opzionale)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Aggiungi eventuali note o commenti..."
              rows={3}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => submitMutation.mutate()}
            disabled={!isValid || submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Invio in corso...</>
            ) : (
              "Invia Rendicontazione"
            )}
          </Button>

          {submitMutation.isError && (
            <p className="text-sm text-red-500 text-center">
              Si è verificato un errore. Riprova o contatta l'amministratore.
            </p>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ─── Wrapper standalone ───────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow">
            <Target className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-lg leading-none">TalentHub</div>
            <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Rendicontazione MBO</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
