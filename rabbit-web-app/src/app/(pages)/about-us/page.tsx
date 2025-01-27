import AboutUsComponent from "@/components/aboutUs/AboutUsCom";

export const metadata = {
  title: "About Us - Rabbit Mechanic",
  description:
    "Discover Rabbit Mechanic, a leader in automotive services, providing reliable and cost-effective solutions across the USA.",
  keywords:
    "About Us, Rabbit Mechanic, Automotive Services, Truck & Trailer Care, Car Servicing",
  robots: "index, follow",
  openGraph: {
    title: "About Us - Rabbit Mechanic",
    description:
      "Learn about Rabbit Mechanic's mission, values, and the dedicated team behind our automotive services.",
    url: "https://www.rabbitmechanic.com/about-us",
    image: "https://www.rabbitmechanic.com/images/about-us.jpg",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us - Rabbit Mechanic",
    description:
      "Discover Rabbit Mechanic, a leader in automotive services, providing reliable and cost-effective solutions across the USA.",
    image: "https://www.rabbitmechanic.com/images/about-us.jpg",
  },
};

const AboutUs: React.FC = () => {
  return <AboutUsComponent />;
};
export default AboutUs;
