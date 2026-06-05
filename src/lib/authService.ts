// lib/authService.ts
import { RequestInit } from "next/dist/server/web/spec-extension/request";

import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  email: string;
  full_name: string;
  role: string;
  user_id: string;
}

type AuthRequestInit = RequestInit & {
  _retry?: boolean;
};

class AuthService {
  /* ===================== LOGIN ===================== */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/user/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    return response.json();
  }

  /* ===================== AUTH REQUEST ===================== */
  async makeAuthenticatedRequest(
    url: string,
    options: AuthRequestInit = {}
  ): Promise<Response> {
    const { token, logout } = useAuthStore.getState();

    if (!token) {
      logout();
      throw new Error("No authentication token");
    }

    const fetchOptions = options;
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
        Authorization: `Token ${token}`,
      },
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      logout();
      throw new Error("Session expired");
    }

    return response;
  }

  /* ===================== LOGOUT ===================== */
  logout(): void {
    useAuthStore.getState().logout(true);
  }
}

export const authService = new AuthService();
