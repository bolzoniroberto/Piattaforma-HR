// Integration: javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Always fetch user from API (queryClient will add demo mode headers automatically)
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
