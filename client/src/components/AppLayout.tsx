import { useAuth } from "@/hooks/useAuth";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import AiAgentPanel from "@/components/AiAgentPanel";
import { Bell, FileText, HelpCircle, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import React from "react";
import { useAiPanel } from "@/contexts/AiPanelContext";
import { Sparkles } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  pageIcon?: any;
  actions?: React.ReactNode;
}

export default function AppLayout({ children, actions }: AppLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const aiPanel = useAiPanel();
  
  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";
  const userRole = user?.role === "admin" ? "Amministratore" : (user?.role === "hr" ? "Risorse Umane" : "Dipendente");
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("demo_mode");
      sessionStorage.removeItem("demo_role");
    }
    window.location.href = "/api/logout";
  };

  const headerLinks = [
    { label: "Regolamento", href: "/regulation", icon: FileText },
    { label: "FAQ", href: "/regulation/faq", icon: HelpCircle },
    { label: "Profilo", href: "/profilo", icon: UserCircle },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 w-full font-sans text-slate-900">
      <EnterpriseSidebar />

      <div className="flex-1 flex flex-col min-h-screen w-0 overflow-hidden">
        {/* Top Header — slim utility bar */}
        <header className="h-12 bg-white/80 backdrop-blur border-b border-slate-100 flex items-center px-6 shrink-0 sticky top-0 z-30">
          {/* LEFT: secondary nav links */}
          <nav className="flex items-center gap-0.5">
            {headerLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}>
                    <link.icon className="w-3.5 h-3.5" />
                    {link.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Actions & User */}
          <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
            {actions && <div className="flex items-center gap-2 pr-1">{actions}</div>}

            <button
              onClick={() => aiPanel.open()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
              title="Assistente AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Assistente</span>
            </button>

            <button className="text-slate-400 hover:text-slate-700 transition-colors shrink-0" title="Notifiche">
              <Bell className="w-4 h-4" />
            </button>

            <div
              className="flex items-center gap-2.5 pl-2 ml-1 border-l border-slate-100 cursor-pointer group shrink-0"
              onClick={handleLogout}
              title="Esci"
            >
              <div className="flex-col text-right hidden sm:flex group-hover:opacity-80 transition-opacity">
                <span className="text-[13px] font-semibold leading-none">{userName || "Ospite"}</span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{userRole}</span>
              </div>
              <Avatar className="h-7 w-7 rounded-md border border-slate-200 group-hover:border-slate-400 transition-colors">
                <AvatarFallback className="bg-slate-900 text-white text-[10px] rounded-md">
                  {initials.substring(0,2) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto w-full">
          <div className="w-full max-w-[1500px] mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>

      <AiAgentPanel />
    </div>
  );
}
