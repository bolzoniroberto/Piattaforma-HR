// Integration: javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  // Fetch user from API, returning null on 401 to prevent crashes
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  if (error) {
    console.error("useAuth error:", error);
  }

  return {
    user: user ?? undefined,
    isLoading,
    isAuthenticated: !!user,
  };
}
