"use client";

import { ReactNode } from "react";
import AuthContextProvider from "@/contexts/AuthContexts";
import { Toaster } from "react-hot-toast";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AuthContextProvider>
      <Toaster position="top-center" />
      {children}
    </AuthContextProvider>
  );
}
