import Head from "next/head";
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
      <Head>
        <title>Your Page Title</title>
        <meta name="description" content="A short description of your site" />
        <meta name="keywords" content="keywords, related, to, your, site" />
      </Head>
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
