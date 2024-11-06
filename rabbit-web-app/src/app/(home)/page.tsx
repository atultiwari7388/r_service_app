import TopBar from "./../../components/TopBar";
import CustomCarousel from "./components/CustomCarosuel";
import NavBar from "../../components/Navbar";
import ServiceComponent from "./components/ServiceComponent";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <NavBar />
      <main className="flex-grow">
        <CustomCarousel />
      </main>
      <ServiceComponent />
    </div>
  );
}
