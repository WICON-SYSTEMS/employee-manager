import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, logout, getCurrentUser } from "@/lib/auth";
import type { LoginData } from "@shared/schema";
import { useLocation } from "wouter";

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/v1/admin/auth/me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/v1/admin/auth/me"], data);
      setLocation("/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/v1/admin/auth/me"], null);
      queryClient.clear();
      setLocation("/login");
    },
  });

  return {
    user: user?.admin,
    isLoading,
    isAuthenticated: !!user?.admin,
    login: (data: LoginData) => loginMutation.mutate(data),
    logout: () => logoutMutation.mutate(),
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}
