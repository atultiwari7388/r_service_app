import { NextUIProvider } from "@nextui-org/react";
import TopBar from "@/components/TopBar";
import NavBar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthContextProvider from "@/contexts/AuthContexts";
import { Toaster } from "react-hot-toast";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthContextProvider>
      <Toaster />
      <NextUIProvider>
        <TopBar />
        <NavBar />
        {children}
        <Footer />
      </NextUIProvider>
    </AuthContextProvider>
  );
}
