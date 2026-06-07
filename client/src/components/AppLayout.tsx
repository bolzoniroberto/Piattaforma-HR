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

export default function AppLayout({ children, pageTitle, actions }: AppLayoutProps) {
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
        {/* Custom Top Header matching the screenshot */}
        <header className="h-16 bg-white flex items-center px-8 shrink-0 sticky top-0 z-30 shadow-sm">
          {/* LEFT: Title Area */}
          <div className="flex-1 flex items-center min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">
              {pageTitle || "Piattaforma Talent"}
            </h1>
          </div>

          {/* CENTER: Navigation Links (Stable) */}
          <nav className="flex items-center gap-1 px-4">
            {headerLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    isActive 
                      ? "bg-slate-100 text-slate-900" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}>
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Actions & User */}
          <div className="flex-1 flex items-center justify-end gap-6 min-w-0">
            <div className="flex items-center gap-4">
              {actions && <div className="flex items-center gap-3 pr-4">{actions}</div>}
              
              <button 
                onClick={() => aiPanel.open()}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full ai-gradient text-white text-xs font-bold ai-glow hover:scale-105 transition-transform shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Assistant
              </button>

              <button className="text-slate-500 hover:text-slate-900 transition-colors shrink-0">
                <Bell className="w-5 h-5" />
              </button>
              
              <div 
                className="flex items-center gap-3 pl-4 cursor-pointer group shrink-0"
                onClick={handleLogout}
                title="Esci"
              >
                <div className="flex flex-col text-right group-hover:opacity-80 transition-opacity hidden sm:flex">
                  <span className="text-sm font-bold leading-none">{userName || "Ospite"}</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">{userRole}</span>
                </div>
                <Avatar className="h-9 w-9 rounded-md border border-slate-200 group-hover:border-slate-400 transition-colors">
                  <AvatarFallback className="bg-slate-900 text-white text-xs rounded-md">
                    {initials.substring(0,2) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 overflow-y-auto w-full">
          <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>

      <AiAgentPanel />
    </div>
  );
}
