import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, ArrowLeft, LogIn } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ email, password }),
      });

      if (response.ok) {
        navigate("/");
        window.location.reload();
      } else {
        toast({
          title: "Accesso negato",
          description: "Email o password non validi",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("any");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Navbar */}
      <nav className="h-16 flex items-center px-6 border-b border-white/5">
        <Link href="/">
          <a className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Target className="h-4 w-4 text-slate-900" />
            </div>
            <span className="font-bold text-white text-lg">TalentHub</span>
          </a>
        </Link>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Back link */}
          <Link href="/">
            <a className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8">
              <ArrowLeft className="h-3.5 w-3.5" />
              Torna alla home
            </a>
          </Link>

          <h1 className="text-3xl font-bold text-white mb-1">Bentornato</h1>
          <p className="text-slate-400 mb-8">Accedi alla tua piattaforma HR</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@azienda.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 h-11"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-11 gap-2"
              disabled={isLoading}
            >
              <LogIn className="h-4 w-4" />
              {isLoading ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>

          {/* Dev quick login */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-xs text-slate-500 mb-3 text-center">Accesso rapido (modalità sviluppo)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin("employee@example.com")}
                type="button"
                className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left"
              >
                <span className="block text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">Dipendente</span>
                employee@example.com
              </button>
              <button
                onClick={() => quickLogin("admin@example.com")}
                type="button"
                className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left"
              >
                <span className="block text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">Admin</span>
                admin@example.com
              </button>
              <button
                onClick={() => quickLogin("ceo@azienda.it")}
                type="button"
                className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left"
              >
                <span className="block text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">Manager</span>
                ceo@azienda.it
              </button>
              <button
                onClick={() => quickLogin("hr@azienda.it")}
                type="button"
                className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left"
              >
                <span className="block text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">HR</span>
                hr@azienda.it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
