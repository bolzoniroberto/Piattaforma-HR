import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Save, ArrowLeft, Edit } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    telefono: "",
    indirizzo: "",
    cap: "",
    citta: "",
    department: "",
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        telefono: user.telefono || "",
        indirizzo: user.indirizzo || "",
        cap: user.cap || "",
        citta: user.citta || "",
        department: user.department || "",
      });
    }
  }, [user]);

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profilo aggiornato" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile aggiornare il profilo",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      telefono: formData.telefono,
      indirizzo: formData.indirizzo,
      cap: formData.cap,
      citta: formData.citta,
    });
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        telefono: user.telefono || "",
        indirizzo: user.indirizzo || "",
        cap: user.cap || "",
        citta: user.citta || "",
        department: user.department || "",
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <span>Caricamento...</span>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="w-full">
          <main className="w-full space-y-6 flex flex-col pt-4" >
            <div className="max-w-2xl">

          {/* Main Profile Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informazioni Personali</CardTitle>
              <CardDescription>
                {isEditing ? "Modifica i tuoi dati personali" : "Visualizza e modifica i tuoi dati"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Nome</p>
                      <p className="font-semibold text-slate-900 border-b border-transparent py-1">{formData.firstName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Cognome</p>
                      <p className="font-semibold text-slate-900 border-b border-transparent py-1">{formData.lastName || "-"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Email</p>
                      <p className="font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md inline-block">{formData.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Dipartimento</p>
                      <p className="font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md inline-block">{formData.department || "-"}</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold mb-4 text-slate-900">Informazioni di Contatto</h3>
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Numero di Telefono</p>
                        <p className="font-semibold text-slate-900 py-1">{formData.telefono || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Indirizzo</p>
                        <p className="font-semibold text-slate-900 py-1">{formData.indirizzo || "-"}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">CAP</p>
                          <p className="font-semibold text-slate-900 py-1">{formData.cap || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">Città</p>
                          <p className="font-semibold text-slate-900 py-1">{formData.citta || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                      className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
                      size="lg"
                    >
                      <Edit className="h-4 w-4" />
                      Modifica Profilo
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                  {/* Etichetta stile nastro (Ribbon) per far capire che è in modifica */}
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-8 translate-x-1/4 translate-y-1/2 rotate-45 shadow-sm hidden sm:block">
                    Modifica in corso
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-indigo-900/70">Nome</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="bg-white border border-indigo-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-indigo-900/70">Cognome</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="bg-white border border-indigo-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email (Sola Lettura)</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-slate-100 text-slate-500 border-slate-200 opacity-80 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="department" className="text-xs font-bold uppercase tracking-wider text-slate-500">Dipartimento (Sola Lettura)</Label>
                      <Input
                        id="department"
                        name="department"
                        value={formData.department}
                        disabled
                        className="bg-slate-100 text-slate-500 border-slate-200 opacity-80 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="border-t border-indigo-100 pt-6 mt-4 relative z-10">
                    <h3 className="text-base font-bold mb-5 text-indigo-900">Informazioni di Contatto</h3>
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="telefono" className="text-xs font-bold uppercase tracking-wider text-indigo-900/70">Numero di Telefono</Label>
                        <Input
                          id="telefono"
                          name="telefono"
                          type="tel"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          className="bg-white border border-indigo-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="indirizzo" className="text-xs font-bold uppercase tracking-wider text-indigo-900/70">Indirizzo</Label>
                        <Textarea
                          id="indirizzo"
                          name="indirizzo"
                          value={formData.indirizzo}
                          onChange={handleInputChange}
                          className="bg-white border border-indigo-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-sm min-h-[80px]"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label htmlFor="cap" className="text-xs font-bold uppercase tracking-wider text-indigo-900/70">CAP</Label>
                          <Input
                            id="cap"
                            name="cap"
                            value={formData.cap}
                            onChange={handleInputChange}
                            className="bg-white border border-indigo-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="citta" className="text-xs font-bold uppercase tracking-wider text-indigo-900/70">Città</Label>
                          <Input
                            id="citta"
                            name="citta"
                            value={formData.citta}
                            onChange={handleInputChange}
                            className="bg-white border border-indigo-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-indigo-200 relative z-10">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                      size="lg"
                    >
                      <Save className="h-4 w-4" />
                      {updateProfileMutation.isPending ? "Salvataggio in corso..." : "Salva Modifiche"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => { e.preventDefault(); handleCancel(); }}
                      disabled={updateProfileMutation.isPending}
                      size="lg"
                      className="border-indigo-200 text-indigo-900 hover:bg-indigo-100"
                    >
                      Annulla
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informazioni di Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ruolo</p>
                  <p className="font-medium">{user.role === "admin" ? "Amministratore" : "Dipendente"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ID Utente</p>
                  <p className="font-mono text-xs break-all">{user.id}</p>
                </div>
                {user.codiceFiscale && (
                  <div>
                    <p className="text-muted-foreground">Codice Fiscale</p>
                    <p className="font-medium">{user.codiceFiscale}</p>
                  </div>
                )}
                {user.ral && (
                  <div>
                    <p className="text-muted-foreground">RAL</p>
                    <p className="font-medium">€ {parseFloat(user.ral.toString()).toLocaleString("it-IT")}</p>
                  </div>
                )}
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
