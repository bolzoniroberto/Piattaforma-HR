import {
  LayoutDashboard,
  Users,
  Target,
  PieChart,
  Settings,
  FileText,
  Trash2,
  CheckCircle,
  Network,
  Award,
  Calendar,
  BarChart3,
  ClipboardCheck,
  TrendingUp,
  Table2,
  ClipboardList,
  SlidersHorizontal,
  MessageSquare,
  Sparkles,
  FilePlus2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Visible only to admin OR users with isRendicontatore = true */
  rendicontatoreOnly?: boolean;
  /** Visible only to admin OR users with role = "manager" */
  managerOnly?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Matches a key in FeatureFlags — if false, whole section hidden */
  moduleId?: string;
  children: NavItem[];
}

export const dashboardItem: NavItem = {
  id: "dashboard",
  title: "Dashboard",
  url: "/",
  icon: LayoutDashboard,
};

export const navSections: NavSection[] = [
  {
    id: "mbo",
    title: "MBO",
    icon: Target,
    moduleId: "gestione_mbo",
    children: [
      {
        id: "rendiconta",
        title: "Rendiconta Obiettivi",
        url: "/rendiconta",
        icon: ClipboardList,
        rendicontatoreOnly: true,
      },
      {
        id: "manager-mbo-assign",
        title: "Assegna Obiettivi",
        url: "/manager/mbo-assign",
        icon: ClipboardList,
        managerOnly: true,
      },
      {
        id: "ai-assign",
        title: "Assegna con AI",
        url: "/ai/assegna",
        icon: Sparkles,
        managerOnly: true,
      },
      {
        id: "ai-eval",
        title: "Valuta Dipendente",
        url: "/ai/valuta",
        icon: Sparkles,
        managerOnly: true,
      },
      {
        id: "objectives",
        title: "Database Obiettivi",
        url: "/admin/objectives",
        icon: Target,
        adminOnly: true,
      },
      {
        id: "assignments",
        title: "Assegnazione Obiettivi",
        url: "/admin/assignments-bulk",
        icon: FileText,
        adminOnly: true,
      },
      {
        id: "clear-assignments",
        title: "Disassociazione",
        url: "/admin/clear-assignments",
        icon: Trash2,
        adminOnly: true,
      },
      {
        id: "reporting",
        title: "Rendicontazione",
        url: "/admin/reporting",
        icon: CheckCircle,
        adminOnly: true,
      },
      {
        id: "tabellone",
        title: "Tabellone MBO",
        url: "/admin/tabellone",
        icon: Table2,
        adminOnly: true,
      },
    ],
  },

  {
    id: "performance",
    title: "Performance",
    icon: ClipboardCheck,
    moduleId: "performance_management",
    children: [
      {
        id: "self-assessment",
        title: "Autovalutazione",
        url: "/employee/self-assessment",
        icon: FileText,
      },
      {
        id: "peer-feedback",
        title: "Feedback 360°",
        url: "/employee/peer-feedback",
        icon: Users,
      },
      {
        id: "development-plan",
        title: "Piano di Sviluppo",
        url: "/employee/development-plan",
        icon: TrendingUp,
      },
      {
        id: "interview",
        title: "Colloquio di Feedback",
        url: "/employee/interview",
        icon: MessageSquare,
      },
      {
        id: "team-evaluations",
        title: "Valutazioni Team",
        url: "/manager/team-evaluations",
        icon: Users,
        managerOnly: true,
      },
      {
        id: "team-development-plans",
        title: "Piani di Sviluppo Team",
        url: "/manager/development-plans",
        icon: TrendingUp,
        managerOnly: true,
      },
      {
        id: "manager-interviews",
        title: "Colloqui di Feedback",
        url: "/manager/interviews",
        icon: MessageSquare,
        managerOnly: true,
      },
      {
        id: "competencies-config",
        title: "Gestione Competenze",
        url: "/admin/competencies",
        icon: Award,
        adminOnly: true,
      },
      {
        id: "evaluation-cycles",
        title: "Cicli di Valutazione",
        url: "/admin/evaluation-cycles",
        icon: Calendar,
        adminOnly: true,
      },
      {
        id: "activities",
        title: "Attività Persone",
        url: "/admin/activities",
        icon: Table2,
        adminOnly: true,
      },
      {
        id: "calibration",
        title: "Calibrazione",
        url: "/admin/calibration",
        icon: SlidersHorizontal,
        adminOnly: true,
      },
      {
        id: "competencies-analytics",
        title: "Analytics Competenze",
        url: "/admin/competencies-analytics",
        icon: BarChart3,
        adminOnly: true,
      },
    ],
  },

  {
    id: "strumenti",
    title: "Strumenti",
    icon: FilePlus2,
    children: [
      {
        id: "doc-gen",
        title: "Documenti",
        url: "/admin/doc-gen",
        icon: FileText,
        adminOnly: true,
      },
    ],
  },

  {
    id: "impostazioni",
    title: "Impostazioni",
    icon: Settings,
    children: [
      {
        id: "users",
        title: "Gestione Utenti",
        url: "/admin/users",
        icon: Users,
        adminOnly: true,
      },
      {
        id: "organigramma-view",
        title: "Organigramma",
        url: "/organigramma",
        icon: Network,
        adminOnly: true,
      },
      {
        id: "team",
        title: "Team",
        url: "/team",
        icon: Users,
        adminOnly: true,
      },
      {
        id: "settings",
        title: "Impostazioni",
        url: "/admin/settings",
        icon: Settings,
        adminOnly: true,
      },
      {
        id: "custom-fields",
        title: "Campi Personalizzati",
        url: "/admin/custom-fields",
        icon: Settings,
        adminOnly: true,
      },
      {
        id: "analytics-reports",
        title: "Analytics & Reports",
        url: "/admin/analytics",
        icon: PieChart,
        adminOnly: true,
      },
    ],
  },
];
