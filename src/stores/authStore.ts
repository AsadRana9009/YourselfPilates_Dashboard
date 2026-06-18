// store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  email: string;
  full_name: string;
  role: string;
  user_id: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // eslint-disable-next-line
  login: (data: {
    token: string;
    email: string;
    full_name: string;
    role: string;
    user_id: string;
  }) => void;

  logout: (_redirect?: boolean) => void;
  // eslint-disable-next-line
  setToken: (token: string) => void;
  // eslint-disable-next-line
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (data) => {
        const user = {
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          user_id: data.user_id,
        };

        set({
          user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: (redirect = true) => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        // Remove cookie
        document.cookie =
          "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        // Remove from localStorage if you persist there
        localStorage.removeItem("auth-storage");
        // Redirect if requested
        if (redirect) {
          window.location.href = "/login";
        }
      },

      setToken: (token) => {
        set({
          token,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
