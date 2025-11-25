// Integration: javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Check if demo mode is active FIRST
  const demoMode = typeof window !== "undefined" && sessionStorage.getItem("demo_mode") === "true";
  const demoRole = typeof window !== "undefined" ? sessionStorage.getItem("demo_role") : null;

  // If demo mode is active, return demo user immediately without fetching
  if (demoMode && demoRole && (demoRole === "admin" || demoRole === "employee")) {
    const demoUser: User = {
      id: demoRole === "admin" ? "demo-admin-001" : "demo-employee-001",
      email: `${demoRole}@demo.local`,
      firstName: demoRole === "admin" ? "Admin" : "Dipendente",
      lastName: "Demo",
      profileImageUrl: undefined,
      role: demoRole,
      department: demoRole === "admin" ? "Management" : "IT Development",
      ral: undefined,
      mboPercentage: 25,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return {
      user: demoUser,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  // Otherwise fetch real user from API
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  if (error) {
    console.error("useAuth error:", error);
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
