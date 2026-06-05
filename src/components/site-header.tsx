"use client";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { ModeToggle } from "./mode-toggle";
// import { ThemeSelector } from "./theme-selector";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{path.replace(/^\//, "")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* <h1 className="text-base font-medium">Documents</h1> */}
        <div className="ml-auto flex items-center gap-2">
          {/* <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="#"
              rel="noopener noreferrer"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button> */}
          {/* <ThemeSelector /> */}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
