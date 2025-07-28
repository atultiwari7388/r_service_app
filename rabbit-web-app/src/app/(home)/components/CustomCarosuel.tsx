"use client";

import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import Image from "next/image";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Slider data
const sliderData = [
  {
    imageSrc: "/boost_business.png",
    title: "Boost Your Business",
    description:
      "Join Rabbit Mechanic as a roadside service provider and unlock new income streams. Get connected with truckers in need of urgent repairs across the USA & Canada. Whether you're a solo mechanic or run a mobile service team, our platform helps you grow your customer base, increase visibility, and earn more.",
    buttonText: "Book Now",
    buttonLink: "#",
  },
  {
    imageSrc: "/effortless_manage.png",
    title: "Effortless Management",
    description:
      "Easily assign trucks to drivers, track who drove which vehicle and when, and maintain accurate records — all in one place. Rabbit Mechanic simplifies driver tracking, saving time and improving accountability for fleet owners.",
    buttonText: "Book Now",
    buttonLink: "#",
  },
  {
    imageSrc: "/automatic_alert.png",
    title: "Automatic Alerts",
    description:
      "Get Timely Notifications for oil changes, inspections, filter replacements, tire rotations, transmission service, and more.",
    buttonText: "Book Now",
    buttonLink: "#",
  },
  {
    imageSrc: "/more_truck.png",
    title: "More trucks! More Easy",
    description:
      "From tracking maintenance schedules to assigning drivers and monitoring service history, Rabbit Mechanic puts every detail at your fingertips. The intuitive dashboard lets you view, manage, and update information for all your vehicles in just a few clicks — whether you have 1 truck or 500.",
    buttonText: "Book Now",
    buttonLink: "#",
  },
];

const CustomCarousel = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 5000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="overflow-hidden w-full rounded-xl shadow-lg">
      <Slider {...settings}>
        {sliderData.map((slide, index) => (
          <div key={index}>
            <div
              className="flex flex-col md:flex-row gap-8 bg-white p-6 md:px-16 md:py-12 w-full items-center"
              style={{ height: "auto" }}
            >
              {/* Image */}
              <div className="w-full md:w-1/2 flex justify-center items-center p-4">
                <div className="relative w-full max-w-md aspect-square">
                  <Image
                    src={slide.imageSrc}
                    alt={slide.title}
                    fill
                    className="object-contain transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>

              {/* Content (Title, Description, Button) */}
              <div className="w-full md:w-1/2 text-gray-800 flex flex-col justify-center items-start px-4 md:px-8 space-y-6">
                <h2 className="text-3xl font-bold tracking-tight leading-tight mb-4 text-gray-900">
                  {slide.title}
                </h2>
                <p className="text-lg leading-relaxed mb-6 text-gray-700">
                  {slide.description}
                </p>
                {/* <a
                  href={slide.buttonLink}
                  className="bg-[#F96176] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-[#e05568] transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  {slide.buttonText}
                </a> */}
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default CustomCarousel;
