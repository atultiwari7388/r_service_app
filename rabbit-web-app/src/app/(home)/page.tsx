import ServiceComponent from "./components/ServiceComponent";
import AboutSection from "./components/AboutComp";
import BookingSection from "./components/BookService";
import TestimonialsList from "./components/TestimonalList";
import CustomCarousel from "./components/CustomCarosuel";

export const metadata = {
  title: "Home - Rabbit Mechanic",
  description:
    "Welcome to Rabbit Mechanic, your trusted partner for automotive services. Explore our services, book an appointment, and read testimonials from satisfied customers.",
  keywords:
    "Home, Rabbit Mechanic, Automotive Services, Car Repair, Truck Services, Customer Testimonials, Book Service",
  robots: "index, follow",
  openGraph: {
    title: "Home - Rabbit Mechanic",
    description:
      "Discover Rabbit Mechanic, your go-to destination for reliable automotive services. Book your service today!",
    url: "https://www.rabbitmechanic.com",
    image: "https://www.rabbitmechanic.com/images/home.jpg",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Home - Rabbit Mechanic",
    description:
      "Welcome to Rabbit Mechanic, your trusted partner for automotive services. Explore our services and book an appointment today!",
    image: "https://www.rabbitmechanic.com/images/home.jpg",
  },
};

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
