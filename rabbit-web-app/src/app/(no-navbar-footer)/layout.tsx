import { NextUIProvider } from "@nextui-org/react";
import AuthContextProvider from "@/contexts/AuthContexts";
import { Toaster } from "react-hot-toast";

export default function CleanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthContextProvider>
      <Toaster />
      <NextUIProvider>{children}</NextUIProvider>
    </AuthContextProvider>
  );
}
