import { useAuth } from "@/hooks/useAuth";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  pageIcon?: any;
}

export default function AppLayout({ children, pageTitle }: AppLayoutProps) {
  const { user } = useAuth();
  
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

  return (
    <div className="flex min-h-screen bg-slate-50 w-full font-sans text-slate-900">
      <EnterpriseSidebar />

      <div className="flex-1 flex flex-col min-h-screen w-0 overflow-hidden">
        {/* Custom Top Header matching the screenshot */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center space-x-8 h-full">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 h-full flex items-center">
              {pageTitle || "Piattaforma Talent"}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-slate-500 hover:text-slate-900 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div 
              className="flex items-center gap-3 border-l border-slate-200 pl-6 cursor-pointer group"
              onClick={handleLogout}
              title="Esci"
            >
              <div className="flex flex-col text-right group-hover:opacity-80 transition-opacity">
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
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 overflow-y-auto w-full">
          <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
