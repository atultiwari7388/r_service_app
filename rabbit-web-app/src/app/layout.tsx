import { NextUIProvider } from "@nextui-org/react";
import type { Metadata } from "next";
import "./globals.css";
import TopBar from "./../components/TopBar";
import NavBar from "./../components/Navbar";
import Footer from "./../components/Footer";
import AuthContextProvider from "@/contexts/AuthContexts";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Rabbit-Welcome to Rabbit Mechanic Services",
  description: "Created by Mylex infotech",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthContextProvider>
          <Toaster />
          <NextUIProvider>
            <TopBar />
            <NavBar />
            {children}
            <Footer />
          </NextUIProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
