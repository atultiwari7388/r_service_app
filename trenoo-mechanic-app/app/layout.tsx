import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trenoo Fleet & Trailer - Commercial Truck & Trailer Mechanic Portal",
  description:
    "Commercial fleet management, heavy-duty truck & trailer maintenance, 24/7 roadside assistance, DOT annual inspections, air brakes, reefer & emergency bay diagnostics.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

import AuthContextProvider from "@/contexts/AuthContexts";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#FAFAFC] text-gray-900 font-sans">
        <AuthContextProvider>
          <SidebarProvider>
            <Toaster position="top-center" />
            {children}
          </SidebarProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
