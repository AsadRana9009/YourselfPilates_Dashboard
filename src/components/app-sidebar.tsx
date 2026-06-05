"use client";

import {
  IconCalendar,
  IconDashboard,
  IconListLetters,
  IconReport,
  IconShoppingCart,
  IconUsers,
  IconVideo,
} from "@tabler/icons-react";
// import { VideoIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/authStore";

import Logo from "../../public/logo.png"; // Adjust the path as necessary

const data = {
  user: {
    name: "ADMIN",
    email: "admin@yourselfpitaltes.com",
    avatar: Logo,
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: IconListLetters,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: IconCalendar,
    },
    {
      title: "Professors",
      url: "/teachers",
      icon: IconUsers,
    },
    {
      title: "Alunos",
      url: "/students",
      icon: IconUsers,
    },
    {
      title: "Videos",
      url: "/videos",
      icon: IconVideo,
    },
    {
      title: "Packs",
      url: "/packs",
      icon: IconCalendar,
    },
    {
      title: "Orders",
      url: "/order",
      icon: IconShoppingCart,
    },
  ],
  // navClouds: [
  //   {
  //     title: "Capture",
  //     icon: IconCamera,
  //     isActive: true,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Proposal",
  //     icon: IconFileDescription,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Prompts",
  //     icon: IconFileAi,
  //     url: "#",
  //     items: [
  //       {
  //         title: "Active Proposals",
  //         url: "#",
  //       },
  //       {
  //         title: "Archived",
  //         url: "#",
  //       },
  //     ],
  //   },
  // ],
  // navSecondary: [
  //   {
  //     title: "Settings",
  //     url: "#",
  //     icon: IconSettings,
  //   },
  //   {
  //     title: "Get Help",
  //     url: "#",
  //     icon: IconHelp,
  //   },
  //   {
  //     title: "Search",
  //     url: "#",
  //     icon: IconSearch,
  //   },
  // ],
  documents: [
    // {
    //   name: "Data Library",
    //   url: "#",
    //   icon: IconDatabase,
    // },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    // {
    //   name: "Word Assistant",
    //   url: "#",
    //   icon: IconFileWord,
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  // fallback if user is null
  const sidebarUser = user || { full_name: "User", email: "", avatar: Logo };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                {/* <IconInnerShadowTop className="!size-5" /> */}
                <Image src={Logo} alt="logo" width={30} />
                <span className="text-base font-semibold">
                  Yourself Pilates
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: sidebarUser.full_name,
            email: sidebarUser.email,
            // eslint-disable-next-line
            avatar: (sidebarUser as any).avatar || Logo,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
