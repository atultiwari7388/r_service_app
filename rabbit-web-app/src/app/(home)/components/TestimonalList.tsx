"use client";

import React, { useState } from "react";
import Testimonial from "./Testimonal";

// Dummy data for testimonials
const testimonialsData = [
  {
    avatarUrl: "/testimonial-1.jpg",
    name: "Client Name 1",
    profession: "Profession 1",
    message:
      "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.",
  },
  {
    avatarUrl: "/testimonial-2.jpg",
    name: "Client Name 2",
    profession: "Profession 2",
    message:
      "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.",
  },
  {
    avatarUrl: "/testimonial-3.jpg",
    name: "Client Name 3",
    profession: "Profession 3",
    message:
      "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.",
  },
  {
    avatarUrl: "/testimonial-4.jpg",
    name: "Client Name 4",
    profession: "Profession 4",
    message:
      "Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.",
  },
];

// Testimonials list component
const TestimonialsList: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Handle left arrow click
  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonialsData.length - 1 : prevIndex - 1
    );
  };

  // Handle right arrow click
  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonialsData.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="text-center mb-8">
          <h6 className="text-primary text-uppercase">Testimonial</h6>
          <h1 className="mb-5">Our Clients Say!</h1>
        </div>

        {/* Testimonial carousel with left and right buttons */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="absolute top-1/2 left-0 transform -translate-y-1/2 p-3 bg-white text-primary border-2 border-primary rounded-full hover:bg-primary hover:text-white transition-all duration-300 shadow-lg"
          >
            <span className="text-3xl font-semibold">&#10094;</span>
          </button>

          {/* Testimonial Cards */}
          <div
            className="flex gap-8 transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {testimonialsData.map((testimonial, index) => (
              <div
                key={index}
                className="w-80 bg-white shadow-lg rounded-lg p-6"
              >
                <Testimonial
                  avatarUrl={testimonial.avatarUrl}
                  name={testimonial.name}
                  profession={testimonial.profession}
                  message={testimonial.message}
                />
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute top-1/2 right-0 transform -translate-y-1/2 p-3 bg-white text-primary border-2 border-primary rounded-full hover:bg-primary hover:text-white transition-all duration-300 shadow-lg"
          >
            <span className="text-3xl font-semibold">&#10095;</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsList;
