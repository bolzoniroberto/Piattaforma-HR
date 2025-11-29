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
import AdminAssignmentsBulkPage from "@/pages/AdminAssignmentsBulkPage";
import AdminClearAllAssignmentsPage from "@/pages/AdminClearAllAssignmentsPage";
import AdminReportingPage from "@/pages/AdminReportingPage";
import AdminDocumentsPage from "@/pages/AdminDocumentsPage";
import AdminSettingsPage from "@/pages/AdminSettingsPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

// Initialize demo mode BEFORE React render (at module load time)
// Only activate if ?demo=admin or ?demo=employee is explicitly passed
if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  const demoRole = params.get("demo");
  if (demoRole === "admin" || demoRole === "employee") {
    sessionStorage.setItem("demo_mode", "true");
    sessionStorage.setItem("demo_role", demoRole);
  }
}

function RootPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Caricamento...</p></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Reindirizzamento al login...</p></div>;
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
      <Route path="/admin/assignments-bulk" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminAssignmentsBulkPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/clear-assignments" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminClearAllAssignmentsPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/reporting" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminReportingPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/documents" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminDocumentsPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/settings" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminSettingsPage />
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
