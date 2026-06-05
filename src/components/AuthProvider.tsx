// components/AuthProvider.tsx
"use client";

import React, { useEffect } from "react";

import { useAuthStore } from "@/stores/authStore";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token, setLoading]);

  // Sync auth state with cookies for middleware
  useEffect(() => {
    if (token) {
      document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    } else {
      document.cookie =
        "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, [token]);

  return <>{children}</>;
}
