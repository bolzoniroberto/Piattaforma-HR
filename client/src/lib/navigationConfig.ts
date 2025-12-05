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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  title: string;
  url?: string; // If undefined, opens panel
  icon: LucideIcon;
  adminOnly: boolean;
  children?: NavItem[];
}

export const railNavigation: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    id: "anagrafica",
    title: "Gestione Anagrafiche",
    icon: Users,
    adminOnly: true,
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
    ],
  },
  {
    id: "mbo",
    title: "Gestione Obiettivi",
    icon: Target,
    adminOnly: true,
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
    title: "Organigramma",
    url: "/organigramma",
    icon: Network,
    adminOnly: false,
  },
];
