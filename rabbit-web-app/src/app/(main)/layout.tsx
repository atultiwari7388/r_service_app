import { NextUIProvider } from "@nextui-org/react";
import AuthContextProvider from "@/contexts/AuthContexts";
import { Toaster } from "react-hot-toast";
import MainLayoutClient from "@/components/MainLayoutClient";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthContextProvider>
      <Toaster />
      <NextUIProvider>
        <MainLayoutClient>{children}</MainLayoutClient>
      </NextUIProvider>
    </AuthContextProvider>
  );
}
