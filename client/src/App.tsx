import { Switch, Route } from "wouter";
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
import { ProtectedRoute } from "@/components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => (
        <ProtectedRoute>
          <EmployeeDashboard />
        </ProtectedRoute>
      )} />
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
