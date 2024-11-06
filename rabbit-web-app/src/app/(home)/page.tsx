import TopBar from "./../../components/TopBar";
import CustomCarousel from "./components/CustomCarosuel";
import NavBar from "../../components/Navbar";
import ServiceComponent from "./components/ServiceComponent";
import AboutSection from "./components/AboutComp";
import BookingSection from "./components/BookService";
import Footer from "./../../components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <NavBar />
      <main className="flex-grow">
        <CustomCarousel />
      </main>
      <ServiceComponent />
      <AboutSection />
      <BookingSection />
      <Footer />
    </div>
  );
}
