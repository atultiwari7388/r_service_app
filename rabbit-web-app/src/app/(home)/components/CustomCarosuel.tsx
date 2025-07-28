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
      "Get Timely Notifications for  oil changes, inspections, filter replacements, tire rotations, transmission service, and more.",
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
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1, // One slide per view in tablets and below
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1, // One slide per view in mobile
          slidesToScroll: 1,
        },
      },
    ],
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="overflow-hidden w-full">
      <Slider {...settings}>
        {sliderData.map((slide, index) => (
          <div key={index}>
            <div
              className="flex flex-col md:flex-row gap-4 bg-white p-9 md:px-24 md:py-20 w-full items-center"
              style={{ height: "auto" }}
            >
              {/* Image */}
              <div className="w-full flex justify-center items-center h-full p-4 ">
                <Image
                  src={slide.imageSrc}
                  alt={slide.title}
                  layout="intrinsic"
                  width={300}
                  height={300}
                  objectFit="contain"
                  className="max-w-full h-auto border-red-400 rounded-lg bg-red-400"
                />
              </div>

              {/* Content (Title, Description, Button) */}
              <div className="w-full text-black flex flex-col justify-center items-start px-4 md:px-8 space-y-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-4 text-black">
                  {slide.title}
                </h2>
                <p className="text-base sm:text-lg leading-relaxed mb-6">
                  {slide.description}
                </p>
                {/* <a
                  href={slide.buttonLink}
                  className="bg-[#F96176] text-white px-6 py-3 rounded text-lg font-medium hover:bg-[#F96176] transition-transform transform hover:scale-105"
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
