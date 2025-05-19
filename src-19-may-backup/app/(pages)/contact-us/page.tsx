import ContactUsComp from "@/components/contactUs/ContactUsComp";

export const metadata = {
  title: "Contact Us - Rabbit Mechanic",
  description:
    "Get in touch with Rabbit Mechanic for inquiries, support, or feedback. We're here to help you with all your automotive service needs.",
  keywords:
    "Contact Us, Rabbit Mechanic, Automotive Services, Customer Support, Inquiries",
  robots: "index, follow",
  openGraph: {
    title: "Contact Us - Rabbit Mechanic",
    description:
      "Reach out to Rabbit Mechanic for any questions or support regarding our automotive services.",
    url: "https://www.rabbitmechanic.com/contact-us",
    image: "https://www.rabbitmechanic.com/images/contact-us.jpg",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us - Rabbit Mechanic",
    description:
      "Have questions? Contact Rabbit Mechanic for assistance with our automotive services.",
    image: "https://www.rabbitmechanic.com/images/contact-us.jpg",
  },
};

export default function ContactUsPage() {
  return <ContactUsComp />;
}
