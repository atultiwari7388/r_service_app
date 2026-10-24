import { NextUIProvider } from "@nextui-org/react";
import AuthContextProvider from "@/contexts/AuthContexts";
import { Toaster } from "react-hot-toast";
import GlobalActivityTracker from "@/components/GlobalActivityTracker";

export default function CleanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthContextProvider>
      <Toaster />
      <GlobalActivityTracker />
      <NextUIProvider>{children}</NextUIProvider>
    </AuthContextProvider>
  );
}
