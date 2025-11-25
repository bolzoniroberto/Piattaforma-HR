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

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={EmployeeDashboard} />
      <Route path="/regulation" component={RegulationPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/objectives" component={AdminObjectivesPage} />
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
