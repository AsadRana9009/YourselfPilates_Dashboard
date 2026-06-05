import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Yourself Pilates | Login",
  description: "Yourself Pilates - Login Page",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}
