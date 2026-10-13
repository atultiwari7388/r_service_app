import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trenoo Fleet & Trailer - Commercial Truck & Trailer Mechanic Portal",
  description:
    "Commercial fleet management, heavy-duty truck & trailer maintenance, 24/7 roadside assistance, DOT annual inspections, air brakes, reefer & emergency bay diagnostics.",
  icons: {
    icon: [
      { url: "/logo-new.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logo-new.png",
    apple: "/logo-new.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#FAFAFC] text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
