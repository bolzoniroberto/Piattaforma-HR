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
  UserCircle,
  Award,
  Calendar,
  BarChart3,
  ClipboardCheck,
  TrendingUp,
  UserCheck,
  Table2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  title: string;
  url?: string;
  icon: LucideIcon;
  adminOnly: boolean;
  /** Matches a key in FeatureFlags — if the flag is false, the whole section is hidden */
  moduleId?: string;
  children?: NavItem[];
}

export const railNavigation: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
    children: [
      {
        id: "dashboard-mbo",
        title: "Dashboard MBO",
        url: "/",
        icon: LayoutDashboard,
        adminOnly: false,
      },
      {
        id: "profilo",
        title: "Profilo",
        url: "/profilo",
        icon: UserCircle,
        adminOnly: false,
      },
    ],
  },
  {
    id: "anagrafica",
    title: "Gestione Anagrafiche",
    icon: Users,
    adminOnly: true,
    moduleId: "gestione_anagrafiche",
    children: [
      {
        id: "users",
        title: "Gestione Utenti",
        url: "/admin/users",
        icon: Users,
        adminOnly: true,
      },
      {
        id: "settings",
        title: "Impostazioni Strutture",
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
    ],
  },
  {
    id: "mbo",
    title: "Gestione MBO",
    icon: Target,
    adminOnly: true,
    moduleId: "gestione_mbo",
    children: [
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
        title: "Disassociazione Obiettivi",
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
    id: "valutazione",
    title: "Valutazione",
    icon: ClipboardCheck,
    adminOnly: false,
    moduleId: "performance_management",
    children: [
      {
        id: "self-assessment",
        title: "Autovalutazione",
        url: "/employee/self-assessment",
        icon: FileText,
        adminOnly: false,
      },
      {
        id: "peer-feedback",
        title: "Feedback 360°",
        url: "/employee/peer-feedback",
        icon: Users,
        adminOnly: false,
      },
      {
        id: "development-plan",
        title: "Piano di Sviluppo",
        url: "/employee/development-plan",
        icon: TrendingUp,
        adminOnly: false,
      },
    ],
  },
  {
    id: "gestione-team",
    title: "Valutazioni Performance",
    icon: UserCheck,
    adminOnly: false,
    moduleId: "performance_management",
    children: [
      {
        id: "team-evaluations",
        title: "Valutazioni Team",
        url: "/manager/team-evaluations",
        icon: Users,
        adminOnly: false,
      },
      {
        id: "team-development-plans",
        title: "Piani di Sviluppo",
        url: "/manager/development-plans",
        icon: TrendingUp,
        adminOnly: false,
      },
    ],
  },
  {
    id: "competenze",
    title: "Competenze",
    icon: Award,
    adminOnly: true,
    moduleId: "performance_management",
    children: [
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
        id: "competencies-analytics",
        title: "Analytics Competenze",
        url: "/admin/competencies-analytics",
        icon: BarChart3,
        adminOnly: true,
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: PieChart,
    adminOnly: true,
    children: [
      {
        id: "analytics-reports",
        title: "Analytics & Reports",
        url: "/admin/analytics",
        icon: PieChart,
        adminOnly: true,
      },
    ],
  },
  {
    id: "organigramma",
    title: "Gestione Organizzazione",
    icon: Network,
    adminOnly: false,
    moduleId: "gestione_organizzazione",
    children: [
      {
        id: "organigramma-view",
        title: "Organigramma",
        url: "/organigramma",
        icon: Network,
        adminOnly: false,
      },
      {
        id: "team",
        title: "Team",
        url: "/team",
        icon: Users,
        adminOnly: false,
      },
    ],
  },
];
