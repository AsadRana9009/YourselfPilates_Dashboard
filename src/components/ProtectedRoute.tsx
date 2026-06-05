// components/ProtectedRoute.tsx
"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallback = (
    <div className="flex justify-center items-center min-h-screen">
      Loading...
    </div>
  ),
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
