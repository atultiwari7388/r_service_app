  // <div className="lg:w-1/2 bg-white rounded-xl shadow-lg p-8 sm:p-12 flex flex-col justify-center space-y-6">
  //           <h1 className="text-3xl font-semibold text-center text-gray-800">
  //             Find Mechanic
  //           </h1>
  //           <form>
  //             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
  //               {/* Vehicle Select */}
  //               <div className="col-span-1 flex gap-2">
  //                 <select
  //                   onChange={handleVehicleChange}
  //                   className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
  //                 >
  //                   <option value="">Select A Vehicle</option>
  //                   {vehicles.map((vehicle, index) => (
  //                     <option key={index} value={vehicle.vehicleNumber}>
  //                       {vehicle.vehicleNumber}({vehicle.companyName})
  //                     </option>
  //                   ))}
  //                 </select>

  //                 <button
  //                   className="btn bg-[#F96176] text-white text-2xl text-center rounded-md hover:bg-[#eb929e] tooltip mt-1"
  //                   title="Add Vehicle"
  //                   onClick={(e) => {
  //                     e.preventDefault(); // Prevent default behavior
  //                     setShowPopup(true); // Open the popup
  //                   }}
  //                 >
  //                   +
  //                 </button>

  //                 {/* Reusable Popup Component */}
  //                 <PopupModal
  //                   isOpen={showPopup}
  //                   onClose={() => setShowPopup(false)}
  //                   title="Select Option"
  //                   options={[
  //                     {
  //                       label: "Add Vehicle",
  //                       onClick: () => handleRedirect({ path: "/add-vehicle" }),
  //                     },
  //                     {
  //                       label: "Import Vehicle",
  //                       onClick: () =>
  //                         handleRedirect({ path: "/import-vehicle" }),
  //                       bgColor: "blue",
  //                     },
  //                   ]}
  //                 />
  //               </div>

  //               {/* Service Select */}
  //               <div className="col-span-1">
  //                 <select
  //                   onChange={handleServiceChange}
  //                   className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
  //                 >
  //                   <option value="">Select A Service</option>
  //                   {services
  //                     .slice()
  //                     .sort((a, b) => a.title.localeCompare(b.title))
  //                     .map((service, index) => (
  //                       <option key={index} value={service.title}>
  //                         {service.title}
  //                       </option>
  //                     ))}
  //                 </select>
  //               </div>
  //               {/* Select Location */}
  //               <div className="col-span-1 flex gap-2">
  //                 <select
  //                   onChange={handleLocationChange}
  //                   className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
  //                 >
  //                   <option value="">Select Your Location</option>
  //                   {location.map((location, index) => (
  //                     <option key={index} value={location.address}>
  //                       {location.address}
  //                     </option>
  //                   ))}
  //                 </select>
  //                 <Link href="/add-location">
  //                   <button
  //                     className="btn bg-[#F96176] text-white text-2xl text-center rounded-md hover:bg-[#eb929e] tooltip mt-1"
  //                     title="Add Vehicle"
  //                   >
  //                     +
  //                   </button>
  //                 </Link>
  //               </div>

  //               {/* Select Image */}
  //               <div className="col-span-1">
  //                 <input
  //                   type="file"
  //                   className="file-input w-full max-w-xs rounded-lg
  //            bg-[#F96176]/20 text-[#F96176] border border-[#F96176]
  //            file:bg-[#F96176] file:text-white file:border-0
  //            file:rounded-lg file:mr-2 file:font-medium
  //            hover:file:bg-[#F96176]/90
  //            focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]
  //            transition-all"
  //                   accept="image/*"
  //                   onChange={(e) => {
  //                     if (e.target.files && e.target.files[0]) {
  //                       setSelectedImage(e.target.files[0]);
  //                     }
  //                   }}
  //                   required={selectedServiceData?.image_type === 1}
  //                 />
  //                 {selectedServiceData?.image_type === 1 && (
  //                   <p className="text-red-500 text-sm mt-1">
  //                     * Image upload is mandatory for this service
  //                   </p>
  //                 )}
  //               </div>

  //               {/* Special Request Textarea */}
  //               <div className="col-span-1">
  //                 <textarea
  //                   className="w-full p-4 h-22 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
  //                   placeholder="Description"
  //                   value={description}
  //                   onChange={(e) => setDescription(e.target.value)}
  //                 ></textarea>
  //               </div>
  //               {/* Book Now Button */}
  //               <div className="col-span-1">
  //                 <button
  //                   className="w-full bg-[#F96176] text-white py-3 px-6 rounded-lg hover:from-[#F96176] hover:to-[#58BB87] transition duration-300 ease-in-out transform hover:scale-105 mt-5"
  //                   onClick={handleFindMechanicClick}
  //                 >
  //                   Find Mechanic
  //                 </button>
  //               </div>
  //             </div>
  //           </form>
  //         </div>
        
        