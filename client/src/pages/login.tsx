import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
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
        body: new URLSearchParams({
          email,
          password,
        }),
      });

      if (response.ok) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/");
        window.location.reload(); // Reload to update auth state
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">MBO System</CardTitle>
          <CardDescription>
            Corporate Objectives Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter any password (dev mode)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Quick Login (Dev)</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Available demo users:
            </p>
            <Button
              onClick={() => quickLogin("employee@example.com")}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              type="button"
            >
              <span className="font-semibold mr-2">Employee:</span>
              <span className="text-muted-foreground">employee@example.com</span>
            </Button>
            <Button
              onClick={() => quickLogin("admin@example.com")}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              type="button"
            >
              <span className="font-semibold mr-2">Admin:</span>
              <span className="text-muted-foreground">admin@example.com</span>
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p className="mb-2">💡 In development mode, any password works</p>
            <p>By logging in, you accept the terms of service</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
