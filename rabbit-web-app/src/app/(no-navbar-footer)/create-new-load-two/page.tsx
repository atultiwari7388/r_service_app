"use client";

import { useState, useRef, SetStateAction } from "react";

export default function CreateNewLoadTwo() {
  const [activeStep, setActiveStep] = useState("Basics");
  const [loadStatus, setLoadStatus] = useState("Draft");
  const [bookingAuthority, setBookingAuthority] = useState("Direct");
  const [loadType, setLoadType] = useState("FTL");
  const [equipment, setEquipment] = useState("Dry Van");
  const [trailerLength, setTrailerLength] = useState("53 ft");

  const steps = ["Basics", "Stops", "Pricing", "Assignment", "Docs"];

  // Create refs for each section
  const basicsRef = useRef<HTMLDivElement>(null);
  const stopsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const assignmentRef = useRef<HTMLDivElement>(null);
  const docsRef = useRef<HTMLDivElement>(null);

  // Function to scroll to section
  const scrollToSection = (section: SetStateAction<string>) => {
    setActiveStep(section);

    let refToScroll = null;
    switch (section) {
      case "Basics":
        refToScroll = basicsRef;
        break;
      case "Stops":
        refToScroll = stopsRef;
        break;
      case "Pricing":
        refToScroll = pricingRef;
        break;
      case "Assignment":
        refToScroll = assignmentRef;
        break;
      case "Docs":
        refToScroll = docsRef;
        break;
      default:
        refToScroll = basicsRef;
    }

    if (refToScroll && refToScroll.current) {
      refToScroll.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">
                Create New Load <span className="text-gray-500">• Draft</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Autosave enabled • Last saved just now
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Save Draft
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                Create & Post
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Load Outline */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-24">
              <h3 className="font-medium mb-3">Load Outline</h3>
              <div className="space-y-1">
                {steps.map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className={`w-full flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                      activeStep === item
                        ? "bg-red-50 border border-red-100"
                        : ""
                    }`}
                  >
                    <span
                      className={
                        activeStep === item ? "font-medium text-red-700" : ""
                      }
                    >
                      {item}
                    </span>
                    {item === "Basics" ||
                    item === "Stops" ||
                    item === "Pricing" ? (
                      <span className="text-xs px-3 py-1 border border-gray-300 rounded-full text-amber-700 bg-amber-50 border-amber-200">
                        Missing
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 border border-gray-300 rounded-full text-gray-500">
                        Optional
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Click on sections to navigate • Required fields marked with ⚠️
              </p>
            </div>
          </div>

          {/* Center Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Basics Section */}
            <section
              ref={basicsRef}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <h3 className="font-medium mb-4">Load Basics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Customer
                  </label>
                  <input
                    type="text"
                    placeholder="Search by Name, MC#, Phone..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Booking Authority
                  </label>
                  <select
                    value={bookingAuthority}
                    onChange={(e) => setBookingAuthority(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option>Direct</option>
                    <option>Broker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Type
                  </label>
                  <select
                    value={loadType}
                    onChange={(e) => setLoadType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option>FTL</option>
                    <option>LTL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Equipment
                  </label>
                  <select
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option>Dry Van</option>
                    <option>Reefer</option>
                    <option>Flatbed</option>
                    <option>Power Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Trailer Length
                  </label>
                  <select
                    value={trailerLength}
                    onChange={(e) => setTrailerLength(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option>53 ft</option>
                    <option>48 ft</option>
                    <option>40 ft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Total Weight (lbs)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 42000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Commodity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Auto Parts, Food, Electronics"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Declared Value (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="$"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <details className="mt-6 border-t border-gray-200 pt-4">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                  Advanced options
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Booking/Terminal Office
                    </label>
                    <input
                      type="text"
                      placeholder="Select..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Agency
                    </label>
                    <input
                      type="text"
                      placeholder="Select..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Sales Agent
                    </label>
                    <input
                      type="text"
                      placeholder="Select..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Brokerage Agent
                    </label>
                    <input
                      type="text"
                      placeholder="Select..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Customer Notes (optional)
                    </label>
                    <textarea
                      placeholder="Special instructions, requirements, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Dispatch Notes (optional)
                    </label>
                    <textarea
                      placeholder="Internal dispatch instructions"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[80px]"
                    />
                  </div>
                </div>
              </details>
            </section>

            {/* Stops Section */}
            <section
              ref={stopsRef}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <h3 className="font-medium mb-4">Stops Timeline</h3>
              <div className="space-y-4">
                {/* Pickup Stop */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <h4 className="font-bold">Stop 1 • Pickup</h4>
                      <p className="text-sm text-gray-500">
                        Address + schedule + references
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 border border-gray-300 rounded-full text-gray-500">
                      Live Load
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Shipper
                      </label>
                      <input
                        type="text"
                        placeholder="Select shipper..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        placeholder="Search address..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Date
                      </label>
                      <input
                        type="text"
                        placeholder="mm/dd/yyyy"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Start Time
                      </label>
                      <input
                        type="text"
                        placeholder="--:--"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        End Time
                      </label>
                      <input
                        type="text"
                        placeholder="--:--"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Appointment
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                    </div>
                  </div>
                  <details className="mt-4 pt-4 border-t border-gray-200">
                    <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                      Stop details
                    </summary>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          PO Number
                        </label>
                        <input
                          type="text"
                          placeholder="Purchase order"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Pickup #
                        </label>
                        <input
                          type="text"
                          placeholder="Pickup reference"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Seal #
                        </label>
                        <input
                          type="text"
                          placeholder="Seal number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 24"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Qty Type
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                          <option>Pallets</option>
                          <option>Cases</option>
                          <option>Pieces</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          Stop Weight (optional override)
                        </label>
                        <input
                          type="number"
                          placeholder="lbs"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm text-gray-500 mb-1">
                        Instructions
                      </label>
                      <textarea
                        placeholder="Call 30 mins before arrival, etc."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[60px]"
                      />
                    </div>
                  </details>
                </div>

                {/* Delivery Stop */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <h4 className="font-bold">Stop 2 • Delivery</h4>
                      <p className="text-sm text-gray-500">
                        Address + schedule + references
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 border border-gray-300 rounded-full text-gray-500">
                      Live Unload
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Consignee
                      </label>
                      <input
                        type="text"
                        placeholder="Select consignee..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        placeholder="Search address..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Date
                      </label>
                      <input
                        type="text"
                        placeholder="mm/dd/yyyy"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Start Time
                      </label>
                      <input
                        type="text"
                        placeholder="--:--"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        End Time
                      </label>
                      <input
                        type="text"
                        placeholder="--:--"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Appointment
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  + Add Stop
                </button>
                <p className="text-sm text-gray-500">
                  Miles/ETA can be auto-calculated after addresses are entered.
                </p>
              </div>
            </section>

            {/* Pricing Section */}
            <section
              ref={pricingRef}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <h3 className="font-medium mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Linehaul ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Fuel
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option>Included</option>
                    <option>Flat $</option>
                    <option>% of linehaul</option>
                    <option>$ per mile</option>
                  </select>
                </div>
              </div>
              <details className="mt-4 pt-4 border-t border-gray-200">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                  Accessorials
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Detention
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Layover
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      TONU
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Other
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </details>
            </section>

            {/* Assignment Section */}
            <section
              ref={assignmentRef}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <h3 className="font-medium mb-4">Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Select Carrier (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Select..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Select Driver (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="AI suggestions first..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Assigned Truck
                  </label>
                  <input
                    type="text"
                    placeholder="Select..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Assigned Trailer
                  </label>
                  <input
                    type="text"
                    placeholder="Select..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-500">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Notify Driver via App
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-500">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Enable GPS Tracking
                </label>
              </div>
            </section>

            {/* Documents Section */}
            <section
              ref={docsRef}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <h3 className="font-medium mb-4">Documents & Compliance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { title: "Rate Confirmation", subtitle: "Auto-generated" },
                  { title: "Bill of Lading (BOL)" },
                  { title: "Proof of Delivery (POD)" },
                  { title: "Damage Photos" },
                  { title: "Scale Ticket" },
                  { title: "Lumper" },
                ].map((doc, index) => (
                  <div
                    key={index}
                    className="border border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="text-gray-700">{doc.title}</div>
                    {doc.subtitle && (
                      <div className="text-xs text-gray-500 mt-1">
                        {doc.subtitle}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Load Status Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-24">
              <h3 className="font-medium mb-3">Load Status</h3>
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={loadStatus}
                  onChange={(e) => setLoadStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option>Draft</option>
                  <option>Posted</option>
                  <option>Assigned</option>
                  <option>In Transit</option>
                  <option>Delivered</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Status changes should be role-based.
              </p>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-[calc(24px+300px)]">
              <h3 className="font-medium mb-4">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-t border-dashed border-gray-300 pt-3">
                  <span className="text-sm text-gray-500">Total Revenue</span>
                  <strong className="text-lg">$0</strong>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-gray-300 pt-3">
                  <span className="text-sm text-gray-500">Carrier Pay</span>
                  <strong className="text-lg">$0</strong>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-gray-900">Profit</strong>
                      <div className="text-xs text-gray-500 mt-1">
                        Margin 0%
                      </div>
                    </div>
                    <strong className="text-lg">$0</strong>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Save Draft
                </button>
                <button className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Create & Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
