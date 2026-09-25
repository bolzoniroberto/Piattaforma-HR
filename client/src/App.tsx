import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RailProvider } from "@/contexts/RailContext";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext";
import { AiPanelProvider } from "@/contexts/AiPanelContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import LandingPage from "@/pages/LandingPage";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import ProfilePage from "@/pages/ProfilePage";
import ProfiloPage from "@/pages/ProfiloPage";
import TeamPage from "@/pages/TeamPage";
import RegulationPage, { RegulationPageActions } from "@/pages/RegulationPage";
import RegulationFAQPage, { RegulationFAQPageActions } from "@/pages/RegulationFAQPage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminObjectivesPage from "@/pages/AdminObjectivesPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminAssignmentsPage from "@/pages/AdminAssignmentsPage";
import AdminAssignmentsBulkPage from "@/pages/AdminAssignmentsBulkPage";
import AdminClearAllAssignmentsPage from "@/pages/AdminClearAllAssignmentsPage";
import AdminReportingPage from "@/pages/AdminReportingPage";
import AdminDocumentsPage from "@/pages/AdminDocumentsPage";
import AdminSettingsPage from "@/pages/AdminSettingsPage";
import AdminCustomFieldsPage from "@/pages/AdminCustomFieldsPage";
import AdminCompetenciesPage from "@/pages/AdminCompetenciesPage";
import AdminEvaluationCyclesPage from "@/pages/AdminEvaluationCyclesPage";
import EmployeeSelfAssessmentPage from "@/pages/EmployeeSelfAssessmentPage";
import EmployeePeerFeedbackPage from "@/pages/EmployeePeerFeedbackPage";
import EmployeeDevelopmentPlanPage from "@/pages/EmployeeDevelopmentPlanPage";
import ManagerTeamEvaluationsPage from "@/pages/ManagerTeamEvaluationsPage";
import ManagerEmployeeEvaluationPage from "@/pages/ManagerEmployeeEvaluationPage";
import ManagerDevelopmentPlansPage from "@/pages/ManagerDevelopmentPlansPage";
import RendicontatorePage from "@/pages/RendicontatorePage";
import RendicontaPublicPage from "@/pages/RendicontaPublicPage";
import ManagerMboAssignPage from "@/pages/ManagerMboAssignPage";
import AdminActivitiesPage from "@/pages/AdminActivitiesPage";
import AdminProfilePerformancePage from "@/pages/AdminProfilePerformancePage";
import EmployeeInterviewPage from "@/pages/EmployeeInterviewPage";
import ManagerInterviewsPage from "@/pages/ManagerInterviewsPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

// Pagine pesanti o poco frequenti: caricate on-demand (code-splitting)
// per ridurre il bundle iniziale. Vedi <Suspense> attorno al Router.
const AdminTabellonePage = lazy(() => import("@/pages/AdminTabellonePage"));
const AdminAnalyticsPage = lazy(() => import("@/pages/AdminAnalyticsPage"));
const AdminCompetenciesAnalyticsPage = lazy(() => import("@/pages/AdminCompetenciesAnalyticsPage"));
const AdminCalibrationPage = lazy(() => import("@/pages/AdminCalibrationPage"));
const AdminDocGenPage = lazy(() => import("@/pages/AdminDocGenPage"));
const AdminDocSettingsPage = lazy(() => import("@/pages/AdminDocSettingsPage"));
const AssessPage = lazy(() => import("@/pages/AssessPage"));
const OrgChartPage = lazy(() => import("@/pages/OrgChartPage"));
const AiAssignWizardPage = lazy(() => import("@/pages/AiAssignWizardPage"));
const AiEvalWizardPage = lazy(() => import("@/pages/AiEvalWizardPage"));

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
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Caricamento...</p></div>;
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <ProtectedRoute>
      <EmployeeDashboard />
    </ProtectedRoute>
  );
}

function RouteFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Caricamento...</p>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={RootPage} />
      <Route path="/regulation" component={() => (
        <ProtectedRoute pageTitle="MBO Regulation 2026" actions={<RegulationPageActions />}>
          <RegulationPage />
        </ProtectedRoute>
      )} />
      <Route path="/regulation/faq" component={() => (
        <ProtectedRoute pageTitle="Frequently Asked Questions" actions={<RegulationFAQPageActions />}>
          <RegulationFAQPage />
        </ProtectedRoute>
      )} />
      <Route path="/profile" component={() => (
        <ProtectedRoute>
          <ProfilePage />
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
      <Route path="/admin/tabellone" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminTabellonePage />
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
      <Route path="/admin/analytics" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminAnalyticsPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/custom-fields" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminCustomFieldsPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/competencies" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminCompetenciesPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/evaluation-cycles" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminEvaluationCyclesPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/competencies-analytics" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminCompetenciesAnalyticsPage />
        </ProtectedRoute>
      )} />
      <Route path="/employee/self-assessment" component={() => (
        <ProtectedRoute>
          <EmployeeSelfAssessmentPage />
        </ProtectedRoute>
      )} />
      <Route path="/employee/peer-feedback" component={() => (
        <ProtectedRoute>
          <EmployeePeerFeedbackPage />
        </ProtectedRoute>
      )} />
      <Route path="/employee/development-plan" component={() => (
        <ProtectedRoute>
          <EmployeeDevelopmentPlanPage />
        </ProtectedRoute>
      )} />
      <Route path="/manager/team-evaluations" component={() => (
        <ProtectedRoute>
          <ManagerTeamEvaluationsPage />
        </ProtectedRoute>
      )} />
      <Route path="/manager/team-evaluations/:userId/:cycleId" component={() => (
        <ProtectedRoute>
          <ManagerEmployeeEvaluationPage />
        </ProtectedRoute>
      )} />
      <Route path="/manager/development-plans" component={() => (
        <ProtectedRoute>
          <ManagerDevelopmentPlansPage />
        </ProtectedRoute>
      )} />
      <Route path="/organigramma" component={() => (
        <ProtectedRoute>
          <OrgChartPage />
        </ProtectedRoute>
      )} />
      <Route path="/profilo" component={() => (
        <ProtectedRoute>
          <ProfiloPage />
        </ProtectedRoute>
      )} />
      <Route path="/team" component={() => (
        <ProtectedRoute>
          <TeamPage />
        </ProtectedRoute>
      )} />
      <Route path="/rendiconta" component={() => (
        <ProtectedRoute>
          <RendicontatorePage />
        </ProtectedRoute>
      )} />
      <Route path="/r/:token" component={RendicontaPublicPage} />
      <Route path="/manager/mbo-assign" component={() => (
        <ProtectedRoute>
          <ManagerMboAssignPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/activities" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminActivitiesPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/calibration" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminCalibrationPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/profile-performance/:userId" component={() => (
        <ProtectedRoute requiredRole="admin">
          <AdminProfilePerformancePage />
        </ProtectedRoute>
      )} />
      <Route path="/employee/interview" component={() => (
        <ProtectedRoute>
          <EmployeeInterviewPage />
        </ProtectedRoute>
      )} />
      <Route path="/manager/interviews" component={() => (
        <ProtectedRoute>
          <ManagerInterviewsPage />
        </ProtectedRoute>
      )} />
      <Route path="/ai/assegna" component={() => (
        <ProtectedRoute>
          <AiAssignWizardPage />
        </ProtectedRoute>
      )} />
      <Route path="/ai/valuta" component={() => (
        <ProtectedRoute>
          <AiEvalWizardPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/doc-gen" component={() => (
        <ProtectedRoute>
          <AdminDocGenPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/doc-settings" component={() => (
        <ProtectedRoute>
          <AdminDocSettingsPage />
        </ProtectedRoute>
      )} />
      <Route path="/assess" component={() => (
        <ProtectedRoute>
          <AssessPage />
        </ProtectedRoute>
      )} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

const BASE_PATH = import.meta.env.VITE_BASE_PATH || "";

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AiPanelProvider>
            <RailProvider>
              <FeatureFlagsProvider>
                <Toaster />
                <WouterRouter base={BASE_PATH}><Router /></WouterRouter>
              </FeatureFlagsProvider>
            </RailProvider>
          </AiPanelProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
