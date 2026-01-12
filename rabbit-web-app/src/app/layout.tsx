import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rabbit Mechanic Services | Truck and Vehicle Repair",
  description:
    "Rabbit Mechanic provides expert truck and vehicle repair services. Reliable, professional, and near you.",
  keywords:
    "truck repair, vehicle repair, mechanic, Rabbit Mechanic, truck repair service near me",
  openGraph: {
    title: "Rabbit Mechanic Services",
    description:
      "Expert truck and vehicle repair services. Reliable, fast, and professional.",
    url: "https://www.rabbitmechanic.com/",
    images: [
      {
        url: "https://www.rabbitmechanic.com/rabbit-mechanic-logo.png",
        width: 1200,
        height: 630,
        alt: "Rabbit Mechanic Services",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rabbit Mechanic Services",
    description: "Expert truck and vehicle repair services.",
    images: ["https://www.rabbitmechanic.com/rabbit-mechanic-logo.png"],
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
