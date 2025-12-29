// "use client";

// [...previous imports remain the same...]

// export default function RecordsPage() {
//   // Keep all existing state and other code the same until handleServiceSelect

//   const handleServiceSelect = (serviceId: string) => {
//     const newSelectedServices = new Set(selectedServices);

//     if (newSelectedServices.has(serviceId)) {
//       // Deselect the service
//       newSelectedServices.delete(serviceId);

//       // Clear subservices for this service
//       const newSubServices = { ...selectedSubServices };
//       delete newSubServices[serviceId];
//       setSelectedSubServices(newSubServices);
//     } else {
//       // Select the service
//       newSelectedServices.add(serviceId);

//       // Initialize subservices if service has them
//       const service = services.find(s => s.sId === serviceId);
//       if (service?.subServices) {
//         const subServiceNames = service.subServices
//           .flatMap(subService => subService.sName)
//           .filter(name => name.trim().length > 0);

//         if (subServiceNames.length > 0) {
//           // For "Steer Tires" and "DPF Clean", don't auto-select any subservices
//           if (service.sName !== "Steer Tires" && service.sName !== "DPF Clean") {
//             setSelectedSubServices(prev => ({
//               ...prev,
//               [serviceId]: subServiceNames
//             }));
//           } else {
//             // Initialize empty array for these special services
//             setSelectedSubServices(prev => ({
//               ...prev,
//               [serviceId]: []
//             }));
//           }
//         }
//       }
//     }

//     setSelectedServices(newSelectedServices);
//     updateServiceDefaultValues();
//   };

//   const handleSubserviceToggle = (serviceId: string, subName: string) => {
//     const service = services.find(s => s.sId === serviceId);

//     setSelectedSubServices(prev => {
//       const currentSubs = prev[serviceId] || [];
//       let newSubs: string[];

//       // Special handling for "Steer Tires" and "DPF Clean"
//       if (service?.sName === "Steer Tires" || service?.sName === "DPF Clean") {
//         newSubs = [subName]; // Only allow one selection
//       } else {
//         // For other services, toggle the selection
//         newSubs = currentSubs.includes(subName)
//           ? currentSubs.filter(name => name !== subName)
//           : [...currentSubs, subName];
//       }

//       return {
//         ...prev,
//         [serviceId]: newSubs
//       };
//     });
//   };

//   // Keep all other code the same until the services selection UI

//   {/* In the Dialog content, update the services selection UI */}
//   <div className="grid grid-cols-4 gap-3 mb-4">
//     {services
//       .filter(service =>
//         service.sName.toLowerCase().includes(serviceSearchText.toLowerCase()) &&
//         (!selectedVehicleData || service.vType === selectedVehicleData.vehicleType)
//       )
//       .map(service => (
//         <div key={service.sId} className="w-full">
//           <Chip
//             label={service.sName}
//             onClick={() => {
//               handleServiceSelect(service.sId);
//               setExpandedService(
//                 expandedService === service.sId ? null : service.sId
//               );
//             }}
//             sx={{
//               backgroundColor: selectedServices.has(service.sId)
//                 ? "#F96176"
//                 : "default",
//               color: selectedServices.has(service.sId)
//                 ? "white"
//                 : "inherit",
//               "&:hover": {
//                 backgroundColor: selectedServices.has(service.sId)
//                   ? "#F96176"
//                   : "#FFCDD2",
//               },
//             }}
//             variant={selectedServices.has(service.sId) ? "filled" : "outlined"}
//             className="mb-2 transition duration-300 hover:shadow-lg"
//           />

//           <Collapse
//             in={expandedService === service.sId && selectedServices.has(service.sId)}
//             timeout="auto"
//           >
//             {service.subServices && (
//               <div className="ml-4 mt-2">
//                 {service.subServices.map(subService =>
//                   subService.sName.map((name, idx) => (
//                     <Chip
//                       key={`${service.sId}-${name}-${idx}`}
//                       label={name}
//                       size="small"
//                       className={`m-1 transition duration-300 ${
//                         selectedSubServices[service.sId]?.includes(name)
//                           ? "bg-green-500 text-white"
//                           : "hover:bg-gray-200"
//                       }`}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleSubserviceToggle(service.sId, name);
//                       }}
//                     />
//                   ))
//                 )}
//               </div>
//             )}
//           </Collapse>
//         </div>
//       ))}
//   </div>

//   {/* Keep rest of the code the same */}

// [...rest of the code remains the same...]
