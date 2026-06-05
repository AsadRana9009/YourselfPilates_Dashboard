import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
  };
}
