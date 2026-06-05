"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/stores/authStore";

export default function LogoutPage() {
  const { logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Perform logout without immediate redirect
    logout(false);

    // Optional: Redirect to login after a short delay
    const timer = setTimeout(() => {
      router.push("/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [logout, router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-[#004481]">Logging out...</h1>
        <p className="text-muted-foreground">
          Redirecting you to the login page.
        </p>
        <div className="w-8 h-8 border-4 border-[#004481] border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
