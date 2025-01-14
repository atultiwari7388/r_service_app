// "use client";

// import { useState, useEffect } from "react";
// import { auth, db } from "@/lib/firebase";
// import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
// import {
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select,
//   TextField,
// } from "@mui/material";
// import toast from "react-hot-toast";
// import { VehicleTypes } from "@/types/types";
// import { useAuth } from "@/contexts/AuthContexts";
// import { GlobalToastError } from "@/utils/globalErrorToast";

// interface Vehicle {
//   brand: string;
//   type: string;
//   value: string;
// }

// interface ServiceData {
//   sId: string;
//   sName: string;
//   vType: string;
//   dValues: Vehicle[];
// }

// export default function RecordsPage() {
//   const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
//   const [services, setServices] = useState<ServiceData[]>([]);
//   const [selectedVehicle, setSelectedVehicle] = useState("");
//   const [selectedService, setSelectedService] = useState("");
//   const [miles, setMiles] = useState("");
//   const [hours, setHours] = useState("");
//   const [date, setDate] = useState("");
//   const [workshopName, setWorkshopName] = useState("");
//   const [showAddRecords, setShowAddRecords] = useState(false);
//   const { user } = useAuth() || { user: null };

//   const fetchVehicles = async () => {
//     if (!user) return;
//     try {
//       const vehiclesRef = collection(db, "Users", user?.uid, "Vehicles");
//       const vehiclesSnapshot = await getDocs(vehiclesRef);

//       const vehiclesList = vehiclesSnapshot.docs.map((doc) => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           companyName: data.companyName,
//           createdAt: data.createdAt,
//           currentReading: data.currentReading,
//           dot: data.dot,
//           engineNumber: data.engineNumber,
//           iccms: data.iccms,
//           isSet: data.isSet,
//           licensePlate: data.licensePlate,
//           vehicleNumber: data.vehicleNumber || "",
//           vin: data.vin || null,
//           year: data.year,
//           vehicleType: data.vehicleType,
//         } as VehicleTypes;
//       });
//       console.log("Vehicles List", vehiclesList);
//       setVehicles(vehiclesList);
//     } catch (error) {
//       console.error("Error fetching vehicles:", error);
//       GlobalToastError(error);
//     }
//   };

//   const fetchServices = async () => {
//     try {
//       const servicesDoc = await getDoc(doc(db, "metadata", "servicesData"));
//       if (servicesDoc.exists()) {
//         setServices(servicesDoc.data().data || []);
//       }
//     } catch (error) {
//       console.error("Error fetching services:", error);
//       toast.error("Failed to fetch services");
//     }
//   };

//   const handleSaveRecords = async () => {
//     try {
//       const user = auth.currentUser;
//       if (!user) {
//         toast.error("Please login first");
//         return;
//       }

//       const selectedVehicleData = vehicles.find(
//         (v) => v.id === selectedVehicle
//       );
//       const selectedServiceData = services.find(
//         (s) => s.sId === selectedService
//       );

//       const dataServicesUserRef = collection(
//         db,
//         "Users",
//         user?.uid,
//         "DataServices"
//       );
//       const dataServicesRef = collection(db, "DataServicesRecords");
//       const newRecordRef = doc(dataServicesUserRef);
//       const globalRecordRef = doc(dataServicesRef);

//       const recordData = {
//         userId: user?.uid,
//         vehicleId: selectedVehicle,
//         serviceId: selectedService,
//         vehicleDetails: {
//           companyName: selectedVehicleData?.companyName,
//           createdAt: selectedVehicleData?.createdAt,
//           currentReading: selectedVehicleData?.currentReading,
//           dot: selectedVehicleData?.dot,
//           engineNumber: selectedVehicleData?.engineNumber,
//           iccms: selectedVehicleData?.iccms,
//           isSet: selectedVehicleData?.isSet,
//           licensePlate: selectedVehicleData?.licensePlate,
//           vehicleNumber: selectedVehicleData?.vehicleNumber,
//           vin: selectedVehicleData?.vin,
//           year: selectedVehicleData?.year,
//           vehicleType: selectedVehicleData?.vehicleType,
//         },
//         miles:
//           selectedVehicleData?.vehicleType === "Truck" &&
//           selectedServiceData?.vType === "Truck"
//             ? Number(miles)
//             : Number(0),
//         hours:
//           selectedVehicleData?.vehicleType === "Trailer" &&
//           selectedServiceData?.vType === "Trailer"
//             ? Number(hours)
//             : Number(0),
//         date:
//           selectedVehicleData?.vehicleType === "Trailer" &&
//           selectedServiceData?.vType === "Trailer"
//             ? date
//             : "",
//         workshopName,
//         createdAt: new Date().toISOString(),
//       };

//       // Save to user's subcollection
//       await setDoc(newRecordRef, recordData);

//       // Save to global DataServices collection
//       await setDoc(globalRecordRef, recordData);

//       toast.success("Record added successfully!");
//       resetForm();
//     } catch (error) {
//       console.error("Error saving record:", error);
//       toast.error("Failed to save record");
//     }
//   };

//   const resetForm = () => {
//     setSelectedVehicle("");
//     setSelectedService("");
//     setMiles("");
//     setHours("");
//     setDate("");
//     setWorkshopName("");
//     setShowAddRecords(false);
//   };

//   useEffect(() => {
//     fetchVehicles();
//     fetchServices();
//   }, [user]);

//   const selectedVehicleData = vehicles.find((v) => v.id === selectedVehicle);
//   const selectedServiceData = services.find((s) => s.sId === selectedService);
//   const showMiles =
//     selectedVehicleData?.vehicleType === "Truck" &&
//     selectedServiceData?.vType === "Truck";
//   const showHoursAndDate =
//     selectedVehicleData?.vehicleType === "Trailer" &&
//     selectedServiceData?.vType === "Trailer";

//   return (
//     <section className="p-4">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">Records</h1>
//         <div className="flex gap-4">
//           <button
//             className="bg-[#F96176] text-white px-4 py-2 rounded-md"
//             onClick={() => setShowAddRecords(true)}
//           >
//             Add Records
//           </button>
//         </div>
//       </div>

//       {showAddRecords && (
//         <div className="space-y-4 bg-white p-6 rounded-lg shadow">
//           <h2 className="text-xl font-semibold mb-4">Add Service Record</h2>
//           <FormControl fullWidth>
//             <InputLabel>Select Vehicle</InputLabel>
//             <Select
//               value={selectedVehicle}
//               label="Select Vehicle"
//               onChange={(e) => setSelectedVehicle(e.target.value)}
//             >
//               {vehicles.map((vehicle) => (
//                 <MenuItem key={vehicle.id} value={vehicle.id}>
//                   {vehicle.companyName}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           <FormControl fullWidth>
//             <InputLabel>Select Service</InputLabel>
//             <Select
//               value={selectedService}
//               label="Select Service"
//               onChange={(e) => setSelectedService(e.target.value)}
//             >
//               {services.map((service, index) => (
//                 <MenuItem
//                   key={`service-${service.sId}-${index}`}
//                   value={service.sId}
//                 >
//                   {service.sName}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           {showMiles && (
//             <TextField
//               fullWidth
//               label="Miles"
//               type="number"
//               value={miles}
//               onChange={(e) => setMiles(e.target.value)}
//             />
//           )}

//           {showHoursAndDate && (
//             <>
//               <TextField
//                 fullWidth
//                 label="Hours"
//                 type="number"
//                 value={hours}
//                 onChange={(e) => setHours(e.target.value)}
//               />

//               <TextField
//                 fullWidth
//                 label="Date"
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 InputLabelProps={{ shrink: true }}
//               />
//             </>
//           )}

//           <TextField
//             fullWidth
//             label="Workshop Name (Optional)"
//             value={workshopName}
//             onChange={(e) => setWorkshopName(e.target.value)}
//           />

//           <button
//             className="w-full bg-[#F96176] text-white px-4 py-2 rounded-md"
//             onClick={handleSaveRecords}
//           >
//             Save Record
//           </button>
//         </div>
//       )}
//     </section>
//   );
// }
