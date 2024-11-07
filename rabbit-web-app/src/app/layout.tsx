// app/layout.tsx

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
        <TopBar />
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
