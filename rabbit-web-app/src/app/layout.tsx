import { NextUIProvider } from "@nextui-org/react";
import type { Metadata } from "next";
import "./globals.css";
import TopBar from "./../components/TopBar";
import NavBar from "./../components/Navbar";
import Footer from "./../components/Footer";
import AuthContextProvider from "@/contexts/AuthContexts";
import { Toaster } from "react-hot-toast";

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
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Rabbit Mechanic Services",
              description:
                "Expert truck and vehicle repair services. Reliable, fast, and professional.",
              url: "https://www.rabbitmechanic.com/",
              telephone: "+1202 555 088",
              address: {
                "@type": "PostalAddress",
                streetAddress: "New York, NY 10001, USA",
                addressLocality: "New York",
                addressRegion: "NY",
                postalCode: "10001",
              },
              openingHours: "Mo-Fr 08:00-18:00",
              sameAs: ["https://www.facebook.com/rabbitmechanic"],
            }),
          }}
        />
      </head>
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
