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
  Table2,
  ClipboardList,
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
