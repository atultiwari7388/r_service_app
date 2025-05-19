"use client";

import { ReactNode } from "react";
import AuthContextProvider from "@/contexts/AuthContexts";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
