import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Treenoops | Truck and Vehicle Repair",
  description:
    "Treenoops provides expert truck and vehicle repair services. Reliable, professional, and near you.",
  keywords:
    "truck repair, vehicle repair, mechanic, Treenoops, truck repair service near me",
  openGraph: {
    title: "Treenoops",
    description:
      "Expert truck and vehicle repair services. Reliable, fast, and professional.",
    url: "https://www.trenoops.com/",
    images: [
      {
        url: "https://www.trenoops.com/treenoops-logo.png",
        width: 1200,
        height: 630,
        alt: "Treenoops",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Treenoops",
    description: "Expert truck and vehicle repair services.",
    images: ["https://www.trenoops.com/treenoops-logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
