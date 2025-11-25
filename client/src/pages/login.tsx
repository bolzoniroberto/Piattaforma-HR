import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">MBO System</CardTitle>
          <CardDescription>
            Sistema di Gestione Obiettivi Aziendali
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Accedi con il tuo account Replit per gestire i tuoi obiettivi MBO
            </p>
            <p className="text-xs text-muted-foreground border-t pt-3">
              Sistema aziendale per il monitoraggio e la valutazione della performance
            </p>
          </div>

          <Button 
            onClick={handleLogin}
            size="lg"
            className="w-full"
            data-testid="button-login"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Accedi con Replit
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            <p>Accedendo accetti i termini di servizio</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
