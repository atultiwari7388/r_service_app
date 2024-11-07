"use client";

import dynamic from "next/dynamic";
import ServiceComponent from "./components/ServiceComponent";
import AboutSection from "./components/AboutComp";
import BookingSection from "./components/BookService";
import TestimonialsList from "./components/TestimonalList";

const CustomCarousel = dynamic(() => import("./components/CustomCarosuel"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <BookingSection />
      </main>
      <ServiceComponent />
      <AboutSection />
      <TestimonialsList />
      <CustomCarousel />
    </div>
  );
}
