import ContactUsComp from "@/components/contactUs/ContactUsComp";

export const metadata = {
  title: "Contact Us - TrenOops ",
  description:
    "Get in touch with TrenOops  for inquiries, support, or feedback. We're here to help you with all your automotive service needs.",
  keywords:
    "Contact Us, TrenOops , Automotive Services, Customer Support, Inquiries",
  robots: "index, follow",
  openGraph: {
    title: "Contact Us - TrenOops ",
    description:
      "Reach out to TrenOops  for any questions or support regarding our automotive services.",
    url: "https://www.TrenOopsmechanic.com/contact-us",
    image: "https://www.TrenOopsmechanic.com/images/contact-us.jpg",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us - TrenOops Mechanic",
    description:
      "Have questions? Contact TrenOops Mechanic for assistance with our automotive services.",
    image: "https://www.TrenOopsmechanic.com/images/contact-us.jpg",
  },
};

export default function ContactUsPage() {
  return <ContactUsComp />;
}
