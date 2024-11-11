// app/layout.tsx
import { NextUIProvider } from "@nextui-org/react";
import type { Metadata } from "next";
import "./globals.css";
import TopBar from "./../components/TopBar";
import NavBar from "./../components/Navbar";
import Footer from "./../components/Footer";

export const metadata: Metadata = {
  title: "Rabbit-Truck Repair Services",
  description: "Created by Mylex infotech",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <NextUIProvider>
          <TopBar />
          <NavBar />
          {children}
          <Footer />
        </NextUIProvider>
      </body>
    </html>
  );
}
