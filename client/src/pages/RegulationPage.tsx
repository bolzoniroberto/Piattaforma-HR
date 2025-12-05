import { useState, useMemo } from "react";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

export default function RegulationPage() {
  const { user } = useAuth();
  const { isRailOpen, activeSection, setActiveSection, isPanelOpen, setIsPanelOpen } = useRail();
  const [accepted, setAccepted] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
      setIsPanelOpen(false);
    } else {
      setActiveSection(sectionId);
      setIsPanelOpen(true);
    }
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
    setActiveSection(null);
  };

  const alreadyAccepted = useMemo(() => {
    return !!user?.mboRegulationAcceptedAt;
  }, [user?.mboRegulationAcceptedAt]);

  const acceptanceDate = useMemo(() => {
    if (!user?.mboRegulationAcceptedAt) return null;
    return new Date(user.mboRegulationAcceptedAt).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [user?.mboRegulationAcceptedAt]);

  const handleAccept = () => {
    setAccepted(true);
    console.log("Regulation accepted");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex gap-6 max-w-[1800px] mx-auto">
        <AppRail
          activeSection={activeSection}
          onSectionClick={handleSectionClick}
          isOpen={isRailOpen}
        />
        <AppPanel
          activeSection={activeSection}
          isOpen={isPanelOpen}
          onClose={handlePanelClose}
        />
        <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-3rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
          <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Torna al Dashboard
              </Button>
            </Link>
            <Button variant="outline" data-testid="button-download">
              <Download className="mr-2 h-4 w-4" />
              Scarica PDF
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Regolamento MBO 2025</CardTitle>
              <p className="text-sm text-muted-foreground">
                Linee guida e criteri di valutazione per il sistema Management by Objectives
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6 text-sm leading-relaxed">
                  <section>
                    <h2 className="text-lg font-semibold mb-3">1. Introduzione</h2>
                    <p className="text-foreground">
                      Il presente regolamento definisce le modalità di gestione del sistema MBO
                      (Management by Objectives) aziendale, con l'obiettivo di allineare le
                      performance individuali con gli obiettivi strategici dell'organizzazione.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-lg font-semibold mb-3">2. Ambito di Applicazione</h2>
                    <p className="text-foreground mb-3">
                      Il sistema MBO si applica a tutto il personale dipendente con inquadramento
                      pari o superiore al livello definito dalla direzione aziendale.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                      <li>Dirigenti e quadri</li>
                      <li>Impiegati con responsabilità di coordinamento</li>
                      <li>Specialisti e professional con obiettivi individuali</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-lg font-semibold mb-3">3. Tipologie di Obiettivi</h2>
                    <p className="text-foreground mb-3">
                      Gli obiettivi sono suddivisi in tre cluster principali:
                    </p>
                    
                    <div className="space-y-4 ml-4">
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">3.1 Obiettivi Strategici</h3>
                        <p className="text-foreground">
                          Obiettivi a lungo termine allineati con la visione e la missione
                          aziendale. Peso: 40% della valutazione complessiva.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-foreground mb-2">3.2 Obiettivi Operativi</h3>
                        <p className="text-foreground">
                          Obiettivi a breve-medio termine legati all'efficienza dei processi e
                          al raggiungimento di risultati quantitativi. Peso: 40% della valutazione.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-foreground mb-2">3.3 Obiettivi di Sviluppo</h3>
                        <p className="text-foreground">
                          Obiettivi orientati alla crescita professionale e allo sviluppo di
                          competenze. Peso: 20% della valutazione.
                        </p>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-lg font-semibold mb-3">4. Processo di Assegnazione</h2>
                    <p className="text-foreground mb-3">
                      Gli obiettivi vengono assegnati attraverso un processo strutturato:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-foreground ml-4">
                      <li>Definizione degli obiettivi strategici aziendali</li>
                      <li>Cascading degli obiettivi per area e funzione</li>
                      <li>Discussione e condivisione con il collaboratore</li>
                      <li>Formalizzazione e accettazione degli obiettivi</li>
                      <li>Monitoraggio periodico (trimestrale)</li>
                      <li>Valutazione finale e feedback</li>
                    </ol>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-lg font-semibold mb-3">5. Criteri di Valutazione</h2>
                    <p className="text-foreground mb-3">
                      La valutazione degli obiettivi si basa sui seguenti criteri:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                      <li><strong>Raggiungimento:</strong> Percentuale di completamento dell'obiettivo</li>
                      <li><strong>Qualità:</strong> Livello qualitativo dei risultati ottenuti</li>
                      <li><strong>Tempistica:</strong> Rispetto delle scadenze previste</li>
                      <li><strong>Autonomia:</strong> Grado di autonomia dimostrato</li>
                      <li><strong>Innovazione:</strong> Approcci innovativi adottati</li>
                    </ul>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-lg font-semibold mb-3">6. Sistema Premiante</h2>
                    <p className="text-foreground">
                      Il raggiungimento degli obiettivi è collegato al sistema di incentivazione
                      aziendale secondo le politiche definite dalla direzione HR. La valutazione
                      finale determina l'ammontare del premio variabile annuale.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-lg font-semibold mb-3">7. Modifiche agli Obiettivi</h2>
                    <p className="text-foreground">
                      Gli obiettivi possono essere modificati in corso d'anno solo in presenza di
                      cambiamenti significativi nel contesto organizzativo o di mercato, previa
                      approvazione della direzione.
                    </p>
                  </section>
                </div>
              </ScrollArea>

              <Separator className="my-6" />

              <div className="space-y-4">
                {alreadyAccepted ? (
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <label className="text-sm font-medium text-green-900 dark:text-green-100">
                        Hai già accettato il Regolamento MBO 2025
                      </label>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Accettato il {acceptanceDate}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-md">
                    <Checkbox
                      id="accept-regulation"
                      checked={accepted}
                      onCheckedChange={(checked) => checked && handleAccept()}
                      data-testid="checkbox-accept-regulation"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="accept-regulation"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Accetto il Regolamento MBO 2025
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Confermo di aver letto e compreso il regolamento MBO aziendale e mi impegno
                        a rispettarne le disposizioni.
                      </p>
                    </div>
                    {accepted && (
                      <CheckCircle className="h-5 w-5 text-chart-2 flex-shrink-0" />
                    )}
                  </div>
                )}

                {(accepted || alreadyAccepted) && (
                  <div className="flex justify-end">
                    <Link href="/">
                      <Button data-testid="button-continue">
                        Continua al Dashboard
                      </Button>
                    </Link>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
