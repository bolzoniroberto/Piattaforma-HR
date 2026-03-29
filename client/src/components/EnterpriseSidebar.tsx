import { Link, useLocation } from "wouter";
import {
  Building2,
  Settings,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { useQuery } from "@tanstack/react-query";
import { railNavigation } from "@/lib/navigationConfig";

const bottomItems = [
  { id: "settings", label: "Impostazioni Account", icon: Settings, href: "/profile" },
  { id: "support", label: "Supporto & FAQ", icon: HelpCircle, href: "/regulation/faq" },
];

export default function EnterpriseSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const flags = useFeatureFlags();

  const { data: managerSettingData } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/settings/manager-assignment"],
    enabled: user?.role === "manager",
    retry: false,
  });
  const managerAssignmentEnabled =
    user?.role === "admin" || (user?.role === "manager" && (managerSettingData?.enabled ?? true));

  return (
    <aside className="w-[260px] h-screen shrink-0 bg-slate-50 border-r border-sidebar-border flex flex-col sticky top-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-4 gap-3 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded shrink-0 bg-slate-900 text-white flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 leading-tight">Enterprise HR</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Piattaforma Talent</span>
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        {railNavigation.map((section) => {
          if (section.adminOnly && user?.role !== "admin") return null;
          if (section.moduleId) {
            const roleKey = user?.role === "admin"
              ? `${section.moduleId}_admin`
              : `${section.moduleId}_user`;
            if (!flags[roleKey as keyof typeof flags]) return null;
          }

          // Hide rendicontatoreOnly sections from non-admin, non-rendicontatore users
          if (section.rendicontatoreOnly && user?.role !== "admin" && !(user as any)?.isRendicontatore) return null;
          // Hide managerOnly sections based on role and feature flag
          if (section.managerOnly && !managerAssignmentEnabled) return null;

          return (
            <div key={section.id} className="space-y-1">
              <h4 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {section.title}
              </h4>
              {section.children?.map((child) => {
                if (child.adminOnly && user?.role !== "admin") return null;
                if (child.rendicontatoreOnly && user?.role !== "admin" && !(user as any)?.isRendicontatore) return null;
                if (child.managerOnly && !managerAssignmentEnabled) return null;
                const isActive = location === child.url;
                
                return (
                  <Link key={child.id} href={child.url || "#"}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-medium",
                        isActive
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                          : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                      )}
                    >
                      <child.icon className="w-5 h-5" />
                      {child.title}
                    </div>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 space-y-4 border-t border-sidebar-border">
        <div className="space-y-1">
          {bottomItems.map((item) => (
            <Link key={item.id} href={item.href}>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium text-slate-600 hover:bg-slate-200/50 hover:text-slate-900">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
