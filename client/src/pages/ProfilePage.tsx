import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
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
      console.log("User data loaded:", user);
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
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("Profile update failed:", error);
        throw new Error(error.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Profilo aggiornato correttamente",
      });
      setIsEditing(false);
      // Invalidate auth user query to refresh data
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
    onError: (error: any) => {
      console.error("Update error:", error);
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
    <div className="flex flex-col h-screen bg-background">
      <AppHeader
        userName={`${user.firstName || ""} ${user.lastName || ""}`}
        userRole={user.role === "admin" ? "Amministratore" : "Dipendente"}
        showSidebarTrigger={true}
      />

      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="md3-headline-medium">Il Mio Profilo</h1>
                <p className="text-sm text-muted-foreground">Gestisci i tuoi dati personali e le tue informazioni di contatto</p>
              </div>
            </div>
          </div>

          {/* Main Profile Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informazioni Personali</CardTitle>
              <CardDescription>
                {isEditing ? "Modifica i tuoi dati personali" : "Visualizza e modifica i tuoi dati"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: First Name and Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">Nome</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Cognome</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-muted/50"
                    />
                  </div>
                </div>

                {/* Row 2: Email and Department (read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted/50 text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">Non è possibile modificare l'email</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">Dipartimento</Label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department}
                      disabled
                      className="bg-muted/50 text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">Informazione di sistema</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t pt-6" />

                {/* Contact Information Section */}
                <div>
                  <h3 className="text-base font-semibold mb-4">Informazioni di Contatto</h3>

                  {/* Row 3: Phone */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="telefono" className="text-sm font-medium">Numero di Telefono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="es. +39 123 456 7890"
                      className="bg-muted/50"
                    />
                  </div>

                  {/* Row 4: Address */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="indirizzo" className="text-sm font-medium">Indirizzo</Label>
                    <Textarea
                      id="indirizzo"
                      name="indirizzo"
                      value={formData.indirizzo}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="es. Via Roma 123"
                      className="bg-muted/50 min-h-[100px]"
                    />
                  </div>

                  {/* Row 5: CAP and City */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cap" className="text-sm font-medium">CAP</Label>
                      <Input
                        id="cap"
                        name="cap"
                        value={formData.cap}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="es. 20100"
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="citta" className="text-sm font-medium">Città</Label>
                      <Input
                        id="citta"
                        name="citta"
                        value={formData.citta}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="es. Milano"
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t">
                  {!isEditing ? (
                    <Button
                      type="button"
                      onClick={() => {
                        console.log("Edit button clicked");
                        setIsEditing(true);
                      }}
                      className="gap-2 bg-primary hover:bg-primary/90"
                      size="lg"
                    >
                      <Edit className="h-4 w-4" />
                      Modifica Profilo
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="gap-2"
                        size="lg"
                      >
                        <Save className="h-4 w-4" />
                        {updateProfileMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateProfileMutation.isPending}
                        size="lg"
                      >
                        Annulla
                      </Button>
                    </>
                  )}
                </div>
              </form>
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
  );
}
