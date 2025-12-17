import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import AppRail from "@/components/AppRail";
import AppPanel from "@/components/AppPanel";
import { useRail } from "@/contexts/RailContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Target,
  Calendar,
  CreditCard,
  UserCircle,
  Edit,
  Save,
  X,
  Settings,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CustomFieldDefinition, CustomFieldValue } from "@shared/schema";
import CustomFieldInput from "@/components/CustomFieldInput";

export default function ProfiloPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { activeSection, setActiveSection } = useRail();
  const [isEditingCustomFields, setIsEditingCustomFields] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Fetch custom field definitions
  const { data: customFields = [] } = useQuery<CustomFieldDefinition[]>({
    queryKey: ["/api/custom-fields"],
    enabled: !!user,
  });

  // Fetch user's custom field values
  const { data: userCustomFieldValues = [] } = useQuery<Array<CustomFieldValue & { field: CustomFieldDefinition }>>({
    queryKey: [`/api/users/${user?.id}/custom-field-values`],
    enabled: !!user,
    onSuccess: (data) => {
      const values: Record<string, string> = {};
      data.forEach((item) => {
        values[item.fieldId] = item.value || "";
      });
      setCustomFieldValues(values);
    },
  });

  // Update custom field values
  const updateCustomFieldsMutation = useMutation({
    mutationFn: async (values: Array<{ fieldId: string; value: string }>) => {
      return apiRequest("POST", `/api/users/${user?.id}/custom-field-values/bulk`, { values });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/custom-field-values`] });
      toast({
        title: "Dati salvati",
        description: "I tuoi dati personalizzati sono stati aggiornati",
      });
      setIsEditingCustomFields(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    },
  });

  const handleSaveCustomFields = () => {
    const values = Object.entries(customFieldValues).map(([fieldId, value]) => ({
      fieldId,
      value,
    }));
    updateCustomFieldsMutation.mutate(values);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    const values: Record<string, string> = {};
    userCustomFieldValues.forEach((item) => {
      values[item.fieldId] = item.value || "";
    });
    setCustomFieldValues(values);
    setIsEditingCustomFields(false);
  };

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Utente non trovato</p>
      </div>
    );
  }

  const formatCurrency = (value: string | number | null | undefined) => {
    if (!value) return "Non disponibile";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(numValue);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Non disponibile";
    return new Date(date).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <AppHeader
        userName={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
        userRole={user.role === "admin" ? "Amministratore" : "Dipendente"}
        notificationCount={0}
        showSidebarTrigger={true}
        pageTitle="Profilo"
        pageIcon={UserCircle}
        pageDescription="I tuoi dati personali e anagrafici"
      />

      <div className="min-h-[calc(100vh-4rem)] bg-background pl-2 pr-6 py-6">
        <div className="flex gap-6 max-w-[1800px] mx-auto">
          {/* SIDEBAR CONTAINER - Fixed 312px width, always reserved */}
          <div className="w-[312px] shrink-0 flex gap-3">
            <AppRail
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
            />
            <AppPanel
              activeSection={activeSection}
              className="transition-opacity duration-200"
            />
          </div>

          {/* MAIN CONTENT - flex-1, never resizes, NO margin transitions */}
          <main className="flex-1 bg-card rounded-2xl p-8 min-h-[calc(100vh-7rem)]" style={{ boxShadow: 'var(--shadow-2)' }}>
            <div className="max-w-4xl mx-auto space-y-6">

              {/* Informazioni Personali */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Informazioni Personali
                  </CardTitle>
                  <CardDescription>
                    Dati anagrafici e informazioni di base
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Nome</p>
                      <p className="text-base">{user.firstName || "Non disponibile"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Cognome</p>
                      <p className="text-base">{user.lastName || "Non disponibile"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Codice Fiscale
                      </p>
                      <p className="text-base font-mono">{user.codiceFiscale || "Non disponibile"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Stato</p>
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "Attivo" : "Non Attivo"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contatti */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Contatti
                  </CardTitle>
                  <CardDescription>
                    Informazioni di contatto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </p>
                      <p className="text-base">{user.email || "Non disponibile"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefono
                      </p>
                      <p className="text-base">{user.telefono || "Non disponibile"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Indirizzo
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3 space-y-1">
                        <p className="text-xs text-muted-foreground">Via</p>
                        <p className="text-base">{user.indirizzo || "Non disponibile"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">CAP</p>
                        <p className="text-base">{user.cap || "Non disponibile"}</p>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <p className="text-xs text-muted-foreground">Città</p>
                        <p className="text-base">{user.citta || "Non disponibile"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informazioni Organizzative */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Informazioni Organizzative
                  </CardTitle>
                  <CardDescription>
                    Posizione e struttura aziendale
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Ruolo</p>
                      <Badge variant="outline">
                        {user.role === "admin" ? "Amministratore" : "Dipendente"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Dipartimento</p>
                      <p className="text-base">{user.department || "Non disponibile"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Centro di Costo (CDC)</p>
                      <p className="text-base font-mono">{user.cdc || "Non disponibile"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Responsabile</p>
                      <p className="text-base">{user.managerId || "Non disponibile"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informazioni Economiche e MBO */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Informazioni Economiche
                  </CardTitle>
                  <CardDescription>
                    Dati retributivi e MBO
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        RAL (Retribuzione Annua Lorda)
                      </p>
                      <p className="text-base font-semibold">{formatCurrency(user.ral)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Percentuale MBO
                      </p>
                      <p className="text-base font-semibold">
                        {user.mboPercentage ? `${user.mboPercentage}%` : "Non disponibile"}
                      </p>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Regolamento MBO Accettato
                      </p>
                      <p className="text-base">
                        {user.mboRegulationAcceptedAt
                          ? formatDate(user.mboRegulationAcceptedAt)
                          : "Non ancora accettato"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Fields Section */}
              {customFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5 text-primary" />
                          Informazioni Aggiuntive
                        </CardTitle>
                        <CardDescription>
                          Dati personalizzati del profilo
                        </CardDescription>
                      </div>
                      {!isEditingCustomFields ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingCustomFields(true)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Modifica
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Annulla
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleSaveCustomFields}
                            disabled={updateCustomFieldsMutation.isPending}
                            className="gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Salva
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {customFields
                        .filter((field) => field.isActive)
                        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                        .map((field) => (
                          <div key={field.id}>
                            {isEditingCustomFields ? (
                              <CustomFieldInput
                                field={field}
                                value={customFieldValues[field.id] || ""}
                                onChange={(value) =>
                                  setCustomFieldValues((prev) => ({ ...prev, [field.id]: value }))
                                }
                              />
                            ) : (
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">{field.fieldLabel}</p>
                                <p className="text-base">
                                  {customFieldValues[field.id] || "Non disponibile"}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Date Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Informazioni di Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Data Creazione</p>
                      <p className="text-base">{formatDate(user.createdAt)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Ultimo Aggiornamento</p>
                      <p className="text-base">{formatDate(user.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}
