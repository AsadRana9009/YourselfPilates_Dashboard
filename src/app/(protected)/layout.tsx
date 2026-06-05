import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Welcome | Yourself Pilates",
  description: "Yourself Pilates | Dashboard",
};

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side authentication check
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;

  if (!authToken) {
    redirect("/login");
  }

  return (
    <>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
