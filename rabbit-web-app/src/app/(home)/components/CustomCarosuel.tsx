"use client";

import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import Image from "next/image";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Slider data
const sliderData = [
  {
    imageSrc: "/truck-image-2.jpg",
    title: "Premium Truck Services",
    description:
      "Fast, reliable, and quality truck servicing with a personal touch.",
    buttonText: "Get Started",
    buttonLink: "#",
  },
  {
    imageSrc: "/truck-image-3.jpg",
    title: "24/7 Roadside Assistance",
    description:
      "We're always ready to assist you, day or night, wherever you are.",
    buttonText: "Learn More",
    buttonLink: "#",
  },
  {
    imageSrc: "/truck-image-4.jpg",
    title: "Affordable Truck Repairs",
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
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="overflow-hidden w-full">
      <Slider {...settings}>
        {sliderData.map((slide, index) => (
          <div key={index}>
            <div className="flex md:flex-row flex-col gap-4 bg-[#f8f8f8] p-5 md:px-24 md:py-20 w-full">
              {/* Image on the left */}
              <div className="w-full lg:w-1/2 h-full overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={slide.imageSrc}
                  alt={slide.title}
                  layout="responsive"
                  width={800}
                  height={600}
                  objectFit="cover"
                  className="w-full h-full"
                />
              </div>

              {/* Content on the right */}
              <div className="w-full lg:w-1/2 text-black flex flex-col justify-center items-start pl-8 space-y-6">
                <h2 className="text-4xl font-bold tracking-tight leading-tight mb-4 text-black">
                  {slide.title}
                </h2>
                <p className="text-lg leading-relaxed mb-6">
                  {slide.description}
                </p>
                <a
                  href={slide.buttonLink}
                  className="bg-[#F96176] text-white px-8 py-4 rounded text-lg font-medium hover:bg-[#F96176] transition-transform transform hover:scale-105"
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
