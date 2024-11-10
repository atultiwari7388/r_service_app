"use client";

import React from "react";
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
  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="text-center mb-8">
          <h6 className="text-primary text-uppercase">Testimonial</h6>
          <h1 className="mb-5">Our Clients Say!</h1>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsData.map((testimonial, index) => (
            <div
              key={index}
              className="w-full bg-white shadow-lg rounded-lg p-6 flex flex-col items-center"
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
      </div>
    </div>
  );
};

export default TestimonialsList;
