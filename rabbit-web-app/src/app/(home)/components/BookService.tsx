import React from "react";

const BookingSection = () => {
  return (
    <div
      className="py-24"
      style={{
        backgroundImage: "linear-gradient(to right, #F96176, #58BB87)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="container mx-auto px-6 lg:px-24">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left Section (Text Content) */}
          <div className="lg:w-1/2 text-white space-y-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Certified & Award-Winning Truck Repair Services
            </h1>
            <p className="text-lg sm:text-xl text-gray-200">
              Eirmod sed tempor lorem ut dolores. Aliquyam sit sadipscing kasd
              ipsum. Dolor ea et dolore et at sea ea at dolor, justo ipsum duo
              rebum sea invidunt voluptua. Eos vero eos vero ea et dolore eirmod
              et. Dolores diam duo invidunt lorem. Elitr ut dolores magna sit.
              Sea dolore sanctus sed et.
            </p>
          </div>

          {/* Right Section (Booking Form) */}
          <div className="lg:w-1/2 bg-white rounded-xl shadow-lg p-8 sm:p-12 flex flex-col justify-center space-y-6">
            <h1 className="text-3xl font-semibold text-center text-gray-800">
              Book For A Service
            </h1>
            <form>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name Input */}
                <div className="col-span-1">
                  <input
                    type="text"
                    className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Your Name"
                  />
                </div>

                {/* Email Input */}
                <div className="col-span-1">
                  <input
                    type="email"
                    className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Your Email"
                  />
                </div>

                {/* Service Select */}
                <div className="col-span-1">
                  <select className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                    <option defaultValue={"Select A Service"}>
                      Select A Service
                    </option>
                    <option value="1">Service 1</option>
                    <option value="2">Service 2</option>
                    <option value="3">Service 3</option>
                  </select>
                </div>

                {/* Service Date */}
                <div className="col-span-1">
                  <input
                    type="text"
                    className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Service Date"
                  />
                </div>

                {/* Special Request Textarea */}
                <div className="col-span-1">
                  <textarea
                    className="w-full p-4 h-32 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Special Request"
                  ></textarea>
                </div>

                {/* Book Now Button */}
                <div className="col-span-1">
                  <button className="w-full bg-gradient-to-r from-[#F96176] to-[#58BB87] text-white py-3 px-6 rounded-lg hover:from-[#F96176] hover:to-[#58BB87] transition duration-300 ease-in-out transform hover:scale-105">
                    Book Now
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSection;
