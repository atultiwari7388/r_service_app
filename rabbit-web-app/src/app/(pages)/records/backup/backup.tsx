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
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
// } from "@mui/material";
// import toast from "react-hot-toast";
// import { VehicleTypes } from "@/types/types";
// import { useAuth } from "@/contexts/AuthContexts";
// import { GlobalToastError } from "@/utils/globalErrorToast";
// import { WhatsappShareButton } from "react-share";
// import { WhatsappIcon } from "react-share";

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

// interface ServiceRecord {
//   vehicleDetails: {
//     vehicleNumber: string;
//     vehicleType: string;
//     companyName: string;
//     engineNumber: string;
//   };
//   serviceId: string;
//   date: string;
//   hours: number;
//   miles: number;
//   createdAt: string;
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

//   // New states for search and filter
//   const [records, setRecords] = useState<ServiceRecord[]>([]);
//   const [filterVehicle, setFilterVehicle] = useState("");
//   const [filterService, setFilterService] = useState("");
//   const [filterMiles, setFilterMiles] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   // Fetch records function
//   const fetchRecords = async () => {
//     if (!user) return;
//     try {
//       const recordsRef = collection(db, "Users", user.uid, "DataServices");
//       const recordsSnapshot = await getDocs(recordsRef);
//       const recordsList = recordsSnapshot.docs.map(
//         (doc) => doc.data() as ServiceRecord
//       );
//       setRecords(recordsList);
//     } catch (error) {
//       console.error("Error fetching records:", error);
//       GlobalToastError(error);
//     }
//   };

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
//     fetchRecords();
//   }, [user]);

//   // Filter records based on search criteria
//   const filteredRecords = records.filter((record) => {
//     const matchesVehicle =
//       !filterVehicle || record.vehicleDetails.vehicleNumber === filterVehicle;
//     const matchesService = !filterService || record.serviceId === filterService;
//     const matchesMiles = !filterMiles || record.miles >= Number(filterMiles);
//     const matchesDateRange =
//       !startDate ||
//       !endDate ||
//       (record.date >= startDate && record.date <= endDate);

//     return matchesVehicle && matchesService && matchesMiles && matchesDateRange;
//   });

//   const selectedVehicleData = vehicles.find((v) => v.id === selectedVehicle);
//   const selectedServiceData = services.find((s) => s.sId === selectedService);
//   const showMiles =
//     selectedVehicleData?.vehicleType === "Truck" &&
//     selectedServiceData?.vType === "Truck";
//   const showHoursAndDate =
//     selectedVehicleData?.vehicleType === "Trailer" &&
//     selectedServiceData?.vType === "Trailer";

//   // Generate share text for WhatsApp
//   const generateShareText = (record: ServiceRecord) => {
//     return `Vehicle: ${record.vehicleDetails.vehicleNumber}
// Type: ${record.vehicleDetails.vehicleType}
// Company: ${record.vehicleDetails.companyName}
// Engine: ${record.vehicleDetails.engineNumber}
// Service: ${services.find((s) => s.sId === record.serviceId)?.sName}
// ${record.date ? `Date: ${record.date}` : `Hours: ${record.hours}`}`;
//   };

//   return (
//     <section className="p-4">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">Records</h1>
//         <button
//           className="bg-[#F96176] text-white px-4 py-2 rounded-md"
//           onClick={() => setShowAddRecords(true)}
//         >
//           Add Records
//         </button>
//       </div>

//       {/* Search & Filter Section */}
//       <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
//         <h2 className="text-xl font-semibold">Search & Filter</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <FormControl fullWidth>
//             <InputLabel>Vehicle</InputLabel>
//             <Select
//               value={filterVehicle}
//               label="Vehicle"
//               onChange={(e) => setFilterVehicle(e.target.value)}
//             >
//               <MenuItem value="">All</MenuItem>
//               {vehicles.map((vehicle) => (
//                 <MenuItem key={vehicle.id} value={vehicle.vehicleNumber}>
//                   {vehicle.vehicleNumber}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           <FormControl fullWidth>
//             <InputLabel>Service</InputLabel>
//             <Select
//               value={filterService}
//               label="Service"
//               onChange={(e) => setFilterService(e.target.value)}
//             >
//               <MenuItem value="">All</MenuItem>
//               {services.map((service) => (
//                 <MenuItem key={service.sId} value={service.sId}>
//                   {service.sName}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           <TextField
//             fullWidth
//             label="Minimum Miles"
//             type="number"
//             value={filterMiles}
//             onChange={(e) => setFilterMiles(e.target.value)}
//           />

//           <div className="flex gap-2">
//             <TextField
//               type="date"
//               label="Start Date"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               InputLabelProps={{ shrink: true }}
//             />
//             <TextField
//               type="date"
//               label="End Date"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               InputLabelProps={{ shrink: true }}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Records Table */}
//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead>
//             <TableRow>
//               <TableCell>Vehicle Number</TableCell>
//               <TableCell>Type</TableCell>
//               <TableCell>Company</TableCell>
//               <TableCell>Engine</TableCell>
//               <TableCell>Service</TableCell>
//               <TableCell>Date/Hours</TableCell>
//               <TableCell>Miles</TableCell>
//               <TableCell>Share</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {filteredRecords.map((record, index) => (
//               <TableRow key={index}>
//                 <TableCell>{record.vehicleDetails.vehicleNumber}</TableCell>
//                 <TableCell>{record.vehicleDetails.vehicleType}</TableCell>
//                 <TableCell>{record.vehicleDetails.companyName}</TableCell>
//                 <TableCell>{record.vehicleDetails.engineNumber}</TableCell>
//                 <TableCell>
//                   {services.find((s) => s.sId === record.serviceId)?.sName}
//                 </TableCell>
//                 <TableCell>
//                   {record.date ? record.date : `${record.hours} hours`}
//                 </TableCell>
//                 <TableCell>{record.miles}</TableCell>
//                 <TableCell>
//                   <WhatsappShareButton
//                     url="https://example.com"
//                     title={generateShareText(record)}
//                   >
//                     <WhatsappIcon size={32} round />
//                   </WhatsappShareButton>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       {/* Add Records Form */}
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
