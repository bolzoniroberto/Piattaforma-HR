import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Building2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { useQuery } from "@tanstack/react-query";
import { navSections, dashboardItem } from "@/lib/navigationConfig";

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
    user?.role === "admin" ||
    (user?.role === "manager" && (managerSettingData?.enabled ?? true));

  const getActiveSection = (loc: string) => {
    const section = navSections.find((s) =>
      s.children.some((c) => c.url === loc)
    );
    return section ? new Set([section.id]) : new Set<string>();
  };

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => getActiveSection(location)
  );

  useEffect(() => {
    const activeId = navSections.find((s) =>
      s.children.some((c) => c.url === location)
    )?.id;
    if (activeId) {
      setOpenSections((prev) => {
        if (prev.has(activeId)) return prev;
        const next = new Set(prev);
        next.add(activeId);
        return next;
      });
    }
  }, [location]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isDashboardActive = location === "/";

  return (
    <aside className="w-[240px] h-screen shrink-0 bg-slate-50 flex flex-col sticky top-0 shadow-[1px_0_0_rgba(0,0,0,0.06)]">
      {/* Brand */}
      <div className="h-14 flex items-center px-4 gap-3">
        <div className="w-7 h-7 rounded shrink-0 bg-slate-900 text-white flex items-center justify-center">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 text-sm leading-tight">Enterprise HR</span>
          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">
            Piattaforma Talent
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {/* Dashboard — fixed item */}
        <Link href="/">
          <div
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors text-[13px] mb-3",
              isDashboardActive
                ? "bg-slate-200/80 text-slate-900 font-medium"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/80"
            )}
          >
            <dashboardItem.icon className="w-4 h-4 shrink-0 opacity-70" />
            {dashboardItem.title}
          </div>
        </Link>

        {/* Process sections */}
        {navSections.map((section) => {
          // Module flag check
          if (section.moduleId) {
            const roleKey =
              user?.role === "admin"
                ? `${section.moduleId}_admin`
                : `${section.moduleId}_user`;
            if (!flags[roleKey as keyof typeof flags]) return null;
          }

          const visibleChildren = section.children.filter((child) => {
            if (child.adminOnly && user?.role !== "admin") return false;
            if (
              child.rendicontatoreOnly &&
              user?.role !== "admin" &&
              !(user as any)?.isRendicontatore
            )
              return false;
            if (child.managerOnly && !managerAssignmentEnabled) return false;
            return true;
          });

          if (visibleChildren.length === 0) return null;

          const isOpen = openSections.has(section.id);
          const hasActiveChild = visibleChildren.some((c) => location === c.url);

          return (
            <div key={section.id} className="mb-0.5">
              {/* Accordion header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-[13px] font-medium",
                  hasActiveChild
                    ? "text-slate-800"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/80"
                )}
              >
                <section.icon className="w-4 h-4 shrink-0 opacity-70" />
                <span className="flex-1 text-left">{section.title}</span>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-40" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
                )}
              </button>

              {/* Accordion content */}
              {isOpen && (
                <div className="mt-0.5 mb-1">
                  {visibleChildren.map((child) => {
                    const isActive = location === child.url;
                    return (
                      <Link key={child.id} href={child.url}>
                        <div
                          className={cn(
                            "flex items-center gap-2.5 pl-8 pr-3 py-1.5 rounded-md cursor-pointer transition-colors text-[13px]",
                            isActive
                              ? "bg-slate-200/80 text-slate-900 font-medium"
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/80"
                          )}
                        >
                          <child.icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          {child.title}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
