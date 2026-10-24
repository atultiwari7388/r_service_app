import { NextUIProvider } from "@nextui-org/react";
import AuthContextProvider from "@/contexts/AuthContexts";
import { Toaster } from "react-hot-toast";
import MainLayoutClient from "@/components/MainLayoutClient";
import GlobalActivityTracker from "@/components/GlobalActivityTracker";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthContextProvider>
      <Toaster />
      <GlobalActivityTracker />
      <NextUIProvider>
        <MainLayoutClient>{children}</MainLayoutClient>
      </NextUIProvider>
    </AuthContextProvider>
  );
}
