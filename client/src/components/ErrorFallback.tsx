import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo?: any;
  onReset?: () => void;
}

export default function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const handleReload = () => {
    window.location.href = '/';
  };

  const handleRefresh = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Si è verificato un errore</CardTitle>
              <CardDescription>
                L'applicazione ha riscontrato un errore imprevisto
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription className="font-mono text-sm">
              {error?.message || 'Errore sconosciuto'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Ci scusiamo per l'inconveniente. Puoi provare a:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Ricaricare la pagina corrente</li>
              <li>Tornare alla homepage</li>
              <li>Contattare il supporto se il problema persiste</li>
            </ul>
          </div>

          {/* Dettagli tecnici (solo in development) */}
          {import.meta.env.DEV && errorInfo && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Dettagli tecnici (solo in development)
              </summary>
              <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto max-h-64">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button onClick={handleRefresh} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Ricarica Pagina
          </Button>
          <Button onClick={handleReload} variant="outline" className="flex-1">
            <Home className="h-4 w-4 mr-2" />
            Torna alla Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
