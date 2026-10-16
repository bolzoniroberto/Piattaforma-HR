import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CustomFieldDef {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  placeholder?: string | null;
  helpText?: string | null;
  options?: string | null; // JSON string
  isActive: boolean;
  displayOrder?: number | null;
}

interface CustomFieldValue {
  fieldId: string;
  value: string | null;
}

interface Props {
  userId: string;
  userLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseOptions(raw?: string | null): { value: string; label: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

export default function UserCustomFieldsDialog({ userId, userLabel, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<Record<string, string>>({});

  const { data: defs = [], isLoading: defsLoading } = useQuery<CustomFieldDef[]>({
    queryKey: ["/api/custom-fields"],
    enabled: open,
  });

  const { data: values = [], isLoading: valsLoading } = useQuery<CustomFieldValue[]>({
    queryKey: [`/api/users/${userId}/custom-field-values`],
    enabled: open && !!userId,
  });

  // Solo definizioni attive, ordinate
  const activeDefs = useMemo(
    () =>
      defs
        .filter((d) => d.isActive)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [defs],
  );

  // Inizializza il draft dai valori correnti quando si apre
  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    for (const def of activeDefs) {
      const existing = values.find((v) => v.fieldId === def.id);
      initial[def.id] = existing?.value ?? "";
    }
    setDraft(initial);
  }, [open, activeDefs, values]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        values: Object.entries(draft).map(([fieldId, value]) => ({ fieldId, value })),
      };
      await apiRequest("POST", `/api/users/${userId}/custom-field-values/bulk`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/custom-field-values`] });
      toast({ title: "Campi salvati", description: "Valori personalizzati aggiornati." });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err?.message ?? "Salvataggio fallito", variant: "destructive" });
    },
  });

  const setVal = (fieldId: string, value: string) => setDraft((d) => ({ ...d, [fieldId]: value }));

  const loading = defsLoading || valsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campi personalizzati — {userLabel}</DialogTitle>
          <DialogDescription>
            Valori dei campi custom per questo utente. Disponibili nei template come{" "}
            <code>{"{cf_nome_campo}"}</code>.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6">Caricamento…</p>
        ) : activeDefs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">
            Nessun campo personalizzato definito. Creane in Impostazioni → Campi personalizzati.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            {activeDefs.map((def) => {
              const v = draft[def.id] ?? "";
              const opts = parseOptions(def.options);
              return (
                <div key={def.id} className="space-y-1.5">
                  <Label htmlFor={`cf-${def.id}`}>
                    {def.fieldLabel}{" "}
                    <code className="text-xs text-muted-foreground">cf_{def.fieldName}</code>
                  </Label>

                  {def.fieldType === "textarea" ? (
                    <textarea
                      id={`cf-${def.id}`}
                      className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder={def.placeholder ?? ""}
                      value={v}
                      onChange={(e) => setVal(def.id, e.target.value)}
                    />
                  ) : def.fieldType === "boolean" ? (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`cf-${def.id}`}
                        checked={v === "true"}
                        onCheckedChange={(c) => setVal(def.id, c ? "true" : "false")}
                      />
                      <span className="text-sm text-muted-foreground">Sì / No</span>
                    </div>
                  ) : def.fieldType === "select" ? (
                    <select
                      id={`cf-${def.id}`}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={v}
                      onChange={(e) => setVal(def.id, e.target.value)}
                    >
                      <option value="">—</option>
                      {opts.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={`cf-${def.id}`}
                      type={
                        def.fieldType === "number"
                          ? "number"
                          : def.fieldType === "date"
                            ? "date"
                            : def.fieldType === "email"
                              ? "email"
                              : def.fieldType === "url"
                                ? "url"
                                : "text"
                      }
                      placeholder={def.placeholder ?? ""}
                      value={v}
                      onChange={(e) => setVal(def.id, e.target.value)}
                    />
                  )}

                  {def.helpText && <p className="text-xs text-muted-foreground">{def.helpText}</p>}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || activeDefs.length === 0}
          >
            {saveMutation.isPending ? "Salvataggio…" : "Salva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
