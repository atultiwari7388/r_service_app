"use client";

import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import Image from "next/image";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Slider data
const sliderData = [
  {
    imageSrc: "/slider_1_n.png",
    title: "Premium Truck Services",
    description:
      "Fast, reliable, and quality truck servicing with a personal touch.",
    buttonText: "Get Started",
    buttonLink: "#",
  },
  {
    imageSrc: "/slider_2_n.png",
    title: "24/7 Roadside Assistance",
    description:
      "We're always ready to assist you, day or night, wherever you are.",
    buttonText: "Learn More",
    buttonLink: "#",
  },
  {
    imageSrc: "/slider_3_n.png",
    title: "Affordable Truck Repairs",
    description:
      "High-quality repairs that won't break the bank. Get back on the road quickly!",
    buttonText: "Get a Quote",
    buttonLink: "#",
  },
  {
    imageSrc: "/slider_4_n.png",
    title: "Truck Tire Repairs",
    description:
      "High-quality repairs that won't break the bank. Get back on the road quickly!",
    buttonText: "Get a Quote",
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
              className="flex flex-col md:flex-row gap-4 bg-[#a6e2c2] p-9 md:px-24 md:py-20 w-full items-center"
              style={{ height: "auto" }}
            >
              {/* Image */}
              <div className="w-full flex justify-center items-center h-full p-4">
                <Image
                  src={slide.imageSrc}
                  alt={slide.title}
                  layout="intrinsic"
                  width={300} // Adjusted for mobile view
                  height={300} // Adjusted for mobile view
                  objectFit="contain"
                  className="max-w-full h-auto"
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
                <a
                  href={slide.buttonLink}
                  className="bg-[#F96176] text-white px-6 py-3 rounded text-lg font-medium hover:bg-[#F96176] transition-transform transform hover:scale-105"
                >
                  {slide.buttonText}
                </a>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default CustomCarousel;
