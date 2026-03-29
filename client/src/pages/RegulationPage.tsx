import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ArrowLeft, CheckCircle, HelpCircle, FileText, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";

export function RegulationPageActions() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLocation("/regulation/faq")}
        className="gap-2 border-slate-200 text-slate-700 font-bold h-9 px-4"
      >
        <HelpCircle className="h-4 w-4" />
        FAQ & Guida
      </Button>
      <Button variant="default" size="sm" className="gap-2 bg-slate-900 font-bold h-9 px-5 shadow-sm hover:bg-slate-800" data-testid="button-download">
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
    </div>
  );
}

export default function RegulationPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);

  const { data: companyData } = useQuery<{ companyName: string }>({
    queryKey: ["/api/settings/company"],
  });
  const companyName = companyData?.companyName || "La Società";

  const alreadyAccepted = useMemo(() => !!user?.mboRegulationAcceptedAt, [user?.mboRegulationAcceptedAt]);

  const acceptanceDate = useMemo(() => {
    if (!user?.mboRegulationAcceptedAt) return null;
    return new Date(user.mboRegulationAcceptedAt * 1000).toLocaleDateString("it-IT", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }, [user?.mboRegulationAcceptedAt]);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/accept-mbo-regulation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Regolamento accettato", description: "La tua accettazione è stata registrata." });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile registrare l'accettazione.", variant: "destructive" });
    },
  });

  const handleAccept = () => {
    setAccepted(true);
    acceptMutation.mutate();
  };

  return (
    <div className="w-full space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* Main Content Area */}
          <Card className="xl:col-span-3 border-slate-100 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-extrabold text-slate-900">Testo Integrale</CardTitle>
                  <p className="text-sm text-slate-500 mt-1 font-medium italic">
                    {companyName} — Piano di incentivazione variabile annuale
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[700px] px-8 py-8">
                <div className="space-y-10 text-[15px] leading-relaxed max-w-4xl mx-auto">
                  {/* ... contents ... */}
                  <section>
                    <h2 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px] font-bold">1</Badge>
                      Ambito di Applicazione
                    </h2>
                    <p className="text-slate-600 mb-4">
                      Il presente regolamento disciplina il piano di incentivazione variabile annuale (MBO — Management By Objectives)
                      per l'anno 2026, applicabile al personale dirigente e quadro di {companyName}{" "}
                      identificato come beneficiario dalla Direzione Risorse Umane.
                    </p>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Categorie Beneficiarie</p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-slate-700">
                          <CheckCircle className="h-4 w-4 text-slate-400 mt-1" />
                          <span><strong>DIRS</strong>: Dirigenti con Responsabilità Strategiche, soggetti a overperformance limitata.</span>
                        </li>
                        <li className="flex items-start gap-3 text-slate-700">
                          <CheckCircle className="h-4 w-4 text-slate-400 mt-1" />
                          <span><strong>CEO</strong>: Regime speciale ammissibile ad overperformance.</span>
                        </li>
                        <li className="flex items-start gap-3 text-slate-700">
                          <CheckCircle className="h-4 w-4 text-slate-400 mt-1" />
                          <span><strong>Dirigenti/Quadri</strong>: Capped al 100% del bonus target.</span>
                        </li>
                      </ul>
                    </div>
                  </section>

                  <Separator className="opacity-50" />

                  <section>
                    <h2 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px] font-bold">2</Badge>
                      Struttura del Premio MBO
                    </h2>
                    <p className="text-slate-600 mb-6">
                      Il premio MBO è calcolato come percentuale della Retribuzione Annua Lorda (RAL) del beneficiario.
                    </p>
                    <div className="overflow-hidden border border-slate-100 rounded-xl shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Categoria</th>
                            <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">% RAL Indicativa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          <tr><td className="px-4 py-3 text-slate-700 font-bold">DIRS</td><td className="px-4 py-3 text-right text-slate-600 font-medium">30% – 50%</td></tr>
                          <tr><td className="px-4 py-3 text-slate-700 font-bold">CEO</td><td className="px-4 py-3 text-right text-slate-600 font-medium font-serif italic">Individuale</td></tr>
                          <tr><td className="px-4 py-3 text-slate-700 font-bold">Dirigenti</td><td className="px-4 py-3 text-right text-slate-600 font-medium">20% – 35%</td></tr>
                          <tr><td className="px-4 py-3 text-slate-700 font-bold">Quadri</td><td className="px-4 py-3 text-right text-slate-600 font-medium">10% – 20%</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <Separator className="opacity-50" />

                  <section>
                    <h2 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px] font-bold">3</Badge>
                      Meccanismo di Calcolo
                    </h2>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="shrink-0 w-1 flex bg-indigo-500 rounded-full" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 mb-1">Entry Gate Aziendale</p>
                          <p className="text-slate-600">Erogazione condizionata al raggiungimento dell'indicatore economico (EBITDA). Sotto il 95%, nessun bonus erogato.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="shrink-0 w-1 flex bg-slate-300 rounded-full" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 mb-1">Soglia per Obiettivo (Threshold)</p>
                          <p className="text-slate-600">Soglia minima 95% per ottenimento payout base (50%). Sotto la soglia, il payout è nullo.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-indigo-300 flex flex-col gap-2">
                         <div className="flex justify-between border-b border-white/10 pb-2">
                           <span className="text-white/40">CALCOLO</span>
                           <span className="text-white font-bold tracking-widest text-[10px]">MBO_CORE_V4</span>
                         </div>
                         <p>PREMIO_FINALE = (RAL * %_MBO) * Σ (PESO_i * PAYOUT_i)</p>
                      </div>
                    </div>
                  </section>

                  <Separator className="opacity-50" />

                  <section>
                    <h2 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px] font-bold">4</Badge>
                      Obiettivi ESG
                    </h2>
                    <p className="text-slate-600">
                      Coerentemente con gli impegni di sostenibilità aziendale, una quota fissa del <strong>20%</strong> è riservata a parametri Environmental, Social, e Governance.
                    </p>
                  </section>

                  <Separator className="opacity-50" />

                  <section>
                    <h2 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px] font-bold">5</Badge>
                      Overperformance
                    </h2>
                    <p className="text-slate-600 mb-4">
                      Il superamento del 100% del target non genera automaticamente un payout maggiore. Le soglie variano per categoria:
                    </p>
                    <ul className="space-y-2 text-slate-600 ml-4 list-disc list-outside">
                      <li><strong>DIRS</strong>: Overperformance fino al 120%, payout cappato al 108%.</li>
                      <li><strong>CEO</strong>: Payout massimo 116% del bonus target.</li>
                      <li><strong>Standard</strong>: Payout sbarrato al 100% senza eccezioni.</li>
                    </ul>
                  </section>

                  <Separator className="opacity-50" />

                  <section>
                    <h2 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px] font-bold">6</Badge>
                      Condizioni Speciali
                    </h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs font-bold text-slate-800 mb-1">Good/Bad Leaver</p>
                        <p className="text-slate-600">Le condizioni di uscita (pensionamento vs licenziamento) determinano il diritto al pro-rata del bonus annuale.</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs font-bold text-slate-800 mb-1">Malus & Claw-back</p>
                        <p className="text-slate-600">L'azienda può richiedere la restituzione di bonus erogati in caso di gravi irregolarità emerse entro 24 mesi.</p>
                      </div>
                    </div>
                  </section>

                  <Separator className="opacity-50" />

                  <section className="pb-8">
                    <h2 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px] font-bold">7</Badge>
                      Riservatezza e Foro
                    </h2>
                    <p className="text-slate-600 text-sm italic border-l-4 border-slate-200 pl-4">
                      Il contenuto del piano MBO è strettamente riservato. La violazione degli obblighi di segretezza può costituire grave inadempimento contrattuale. In caso di controversie il foro competente è quello di Milano.
                    </p>
                  </section>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Lateral Column (Status & Acceptance) */}
          <div className="xl:col-span-1 space-y-6 flex flex-col h-full sticky top-24">
            {/* Status Card */}
            <Card className={`border-2 transition-all shadow-md ${alreadyAccepted ? "border-emerald-100 bg-emerald-50/20" : "border-indigo-100 bg-indigo-50/20"}`}>
               <CardContent className="pt-8 text-center">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${alreadyAccepted ? "bg-emerald-100" : "bg-indigo-100"}`}>
                    {alreadyAccepted ? <CheckCircle className="h-8 w-8 text-emerald-600" /> : <Info className="h-8 w-8 text-indigo-600" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{alreadyAccepted ? "Documento Firmato" : "Firma Necessaria"}</h3>
                  <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed font-medium">
                    {alreadyAccepted 
                      ? `Hai accettato i termini del regolamento il giorno ${acceptanceDate}.`
                      : "Ti invitiamo a leggere attentamente il testo a fianco prima di confermare la tua accettazione."
                    }
                  </p>
               </CardContent>
            </Card>

            {/* Accept Action Card */}
            {!alreadyAccepted && (
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="pt-8">
                   <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl mb-6 border border-slate-100">
                      <Checkbox
                        id="accept-regulation"
                        checked={accepted}
                        onCheckedChange={(checked) => checked && handleAccept()}
                        className="mt-1"
                        data-testid="checkbox-accept-regulation"
                      />
                      <label htmlFor="accept-regulation" className="text-xs font-bold text-slate-900 cursor-pointer leading-relaxed">
                        Accetto formalmente il Regolamento MBO 2026 ed i relativi vincoli di riservatezza.
                      </label>
                   </div>
                   <Button 
                     disabled={!accepted || acceptMutation.isPending} 
                     className="w-full bg-slate-900 py-6 font-bold uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-30"
                     onClick={() => setLocation("/")}
                   >
                     {acceptMutation.isPending ? "Invio in corso..." : "Conferma e Continua"}
                   </Button>
                </CardContent>
              </Card>
            )}

            {alreadyAccepted && (
              <Button 
                variant="outline"
                className="w-full py-6 font-bold border-slate-200 text-slate-700 shadow-sm"
                onClick={() => setLocation("/")}
              >
                Torna al Dashboard
              </Button>
            )}

            {/* Help Card */}
            <div className="mt-auto p-6 bg-white border border-slate-100 rounded-2xl">
              <p className="text-xs font-bold text-slate-800 mb-2">Supporto Organizzativo</p>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Contatta la funzione HR per qualsiasi chiarimento interpretativo o supporto tecnico.</p>
              <Button variant="link" className="p-0 text-indigo-600 font-bold text-[10px] uppercase tracking-wider mt-4 h-auto">
                hr-helpdesk@piattaforma.com →
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
}
