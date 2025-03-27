import React from "react";
import Image from "next/image";
import { FaAward, FaCheckCircle, FaUsers } from "react-icons/fa"; // Importing icons

const AboutSection = () => {
  return (
    <div className="py-5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Image Section */}
          <div
            className="lg:w-1/3 pt-4 relative"
            style={{ minHeight: "450px" }} // Increased the height
          >
            <Image
              className="absolute top-0 left-0 w-full h-full object-cover"
              src="/about.jpg"
              alt="About"
              layout="intrinsic"
              width={450}
              height={450}
              objectFit="cover"
            />

            <div
              className="absolute top-0 right-0 mt-n4 mr-n4 py-4 px-5"
              style={{ background: "rgba(0, 0, 0, .08)" }}
            >
              <h1 className="text-white text-4xl mb-0">
                15 <span className="text-xl">Years</span>
              </h1>
              <h4 className="text-white">Experience</h4>
            </div>
          </div>

          <div className="lg:w-2/3 mt-6">
            {" "}
            {/* Added margin-top for spacing */}
            <h6 className="text-[#F96176] text-2xl text-uppercase font-bold text-center">
              About Us
            </h6>
            <h1 className="mb-4 text-3xl">
              <span className="text-[#F96176] font-bold">
                Rabbit Mechanic Service
              </span>{" "}
              Is The Best Place For Your Auto Care
            </h1>
            <p className="mb-4 text-lg">
              Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu
              diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet
              lorem sit clita duo justo magna dolore erat amet.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-3 pb-3">
              {/* Point 1: Professional & Expert */}
              <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="bg-white text-white text-4xl p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <FaCheckCircle className="text-[#F96176] " />
                </div>
                <h6 className="text-xl font-semibold text-black text-center mt-4">
                  Professional & Expert
                </h6>
                <p className="text-gray-600 text-center mt-2">
                  Diam dolor diam ipsum sit amet diam et eos. Professional auto
                  care experts.
                </p>
              </div>

              {/* Point 2: Quality Assurance */}
              <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="bg-white text-white text-4xl p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <FaAward className="text-[#F96176] " />
                </div>
                <h6 className="text-xl font-semibold text-black text-center mt-4">
                  Quality Assurance
                </h6>
                <p className="text-gray-600 text-center mt-2">
                  Ensuring top-notch quality in every service with certified
                  professionals.
                </p>
              </div>

              {/* Point 3: Award-Winning Workers */}
              <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="bg-white text-white text-4xl p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <FaUsers className="text-[#F96176]" />
                </div>
                <h6 className="text-xl font-semibold text-black text-center mt-4">
                  Award-Winning Workers
                </h6>
                <p className="text-gray-600 text-center mt-2">
                  Recognized for excellence and skill, our workers have won
                  multiple awards.
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <a
                href="#"
                className="bg-[#F96176] text-white py-3 px-5 inline-block mt-4 hover:bg-opacity-80 rounded transition-all duration-300"
              >
                Read More
                <i className="fa fa-arrow-right ml-3"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
