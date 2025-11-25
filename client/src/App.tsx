import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import RegulationPage from "@/pages/RegulationPage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminObjectivesPage from "@/pages/AdminObjectivesPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminAssignmentsPage from "@/pages/AdminAssignmentsPage";
import AdminDocumentsPage from "@/pages/AdminDocumentsPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

function RootPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    
    // Redirect admins to admin dashboard
    if (user?.role === "admin") {
      navigate("/admin");
    }
  }, [user, isLoading, navigate]);

  if (isLoading || (user?.role === "admin")) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Caricamento...</p></div>;
  }

  return (
    <ProtectedRoute>
      <EmployeeDashboard />
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={RootPage} />
      <Route path="/regulation" component={() => (
        <ProtectedRoute>
          <RegulationPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      )} />
      <Route path="/admin/objectives" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminObjectivesPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/users" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminUsersPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/assignments/:userId" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminAssignmentsPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/documents" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminDocumentsPage />
        </ProtectedRoute>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
