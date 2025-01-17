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

//17 January 2025 21:56 updated code records code working perfeclty..

// "use client";

// import { useState, useEffect } from "react";
// import { db } from "@/lib/firebase";
// import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
// import {
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select,
//   TextField,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   Chip,
//   Card,
//   CardContent,
//   InputAdornment,
//   Collapse,
// } from "@mui/material";
// import toast from "react-hot-toast";
// import { VehicleTypes } from "@/types/types";
// import { useAuth } from "@/contexts/AuthContexts";
// import { GlobalToastError } from "@/utils/globalErrorToast";
// import { CiSearch } from "react-icons/ci";
// import { IoMdAdd } from "react-icons/io";

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
//   subServices?: Array<{ sName: string[] }>;
//   pName?: string[];
// }

// export default function RecordsPage() {
//   const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
//   const [services, setServices] = useState<ServiceData[]>([]);
//   // const [records, setRecords] = useState<ServiceRecord[]>([]);
//   const { user } = useAuth() || { user: null };

//   // Add Records Form State
//   const [selectedVehicle, setSelectedVehicle] = useState("");
//   const [selectedPackage, setSelectedPackage] = useState("");
//   const [selectedServices, setSelectedServices] = useState<Set<string>>(
//     new Set()
//   );
//   const [selectedSubServices, setSelectedSubServices] = useState<{
//     [key: string]: string[];
//   }>({});
//   const [serviceDefaultValues, setServiceDefaultValues] = useState<{
//     [key: string]: number;
//   }>({});
//   const [expandedService, setExpandedService] = useState<string | null>(null);
//   const [miles, setMiles] = useState("");
//   const [hours, setHours] = useState("");
//   const [date, setDate] = useState("");
//   const [workshopName, setWorkshopName] = useState("");
//   const [invoice, setInvoice] = useState("");
//   const [description, setDescription] = useState("");
//   const [showAddRecords, setShowAddRecords] = useState(false);
//   const [serviceSearchText, setServiceSearchText] = useState("");
//   const [packages, setPackages] = useState<string[]>([]);
//   const [selectedVehicleData, setSelectedVehicleData] =
//     useState<VehicleTypes | null>(null);

//   const fetchVehicles = async () => {
//     if (!user) return;
//     try {
//       const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
//       const vehiclesSnapshot = await getDocs(vehiclesRef);
//       const vehiclesList = vehiclesSnapshot.docs.map(
//         (doc) =>
//           ({
//             id: doc.id,
//             ...doc.data(),
//           } as VehicleTypes)
//       );
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
//         const servicesData = servicesDoc.data().data || [];
//         setServices(servicesData);

//         // Extract unique package names
//         const uniquePackages = new Set<string>();
//         servicesData.forEach((service: ServiceData) => {
//           if (service.pName) {
//             service.pName.forEach((pkg) => uniquePackages.add(pkg));
//           }
//         });
//         setPackages(Array.from(uniquePackages));
//       }
//     } catch (error) {
//       console.error("Error fetching services:", error);
//       toast.error("Failed to fetch services");
//     }
//   };

//   const updateServiceDefaultValues = () => {
//     if (selectedVehicle && selectedServices.size > 0 && selectedVehicleData) {
//       const newDefaultValues: { [key: string]: number } = {};

//       selectedServices.forEach((serviceId) => {
//         const selectedService = services.find((s) => s.sId === serviceId);
//         if (selectedService?.dValues) {
//           for (const dValue of selectedService.dValues) {
//             // Add null checks for dValue.brand and selectedVehicleData.engineNumber
//             if (
//               dValue?.brand &&
//               selectedVehicleData?.engineNumber &&
//               dValue.brand.toString().toUpperCase() ===
//                 selectedVehicleData.engineNumber.toString().toUpperCase()
//             ) {
//               // Add null check for dValue.value
//               if (dValue.value) {
//                 newDefaultValues[serviceId] =
//                   parseInt(dValue.value.toString().split(",")[0]) * 1000;
//                 break;
//               }
//             }
//           }
//         }
//       });

//       setServiceDefaultValues(newDefaultValues);
//     }
//   };

//   const handleServiceSelect = (serviceId: string) => {
//     const newSelectedServices = new Set(selectedServices);

//     if (newSelectedServices.has(serviceId)) {
//       // Deselect the service
//       newSelectedServices.delete(serviceId);

//       const newSubServices = { ...selectedSubServices };
//       delete newSubServices[serviceId];
//       setSelectedSubServices(newSubServices);
//     } else {
//       // Select the service
//       newSelectedServices.add(serviceId);

//       const service = services.find((s) => s.sId === serviceId);

//       if (service?.subServices) {
//         // Flatten and filter the sub-services to ensure valid entries
//         const subServiceNames = service.subServices
//           .flatMap((subService) => subService.sName)
//           .filter((name) => name.trim().length > 0); // Remove empty strings

//         if (subServiceNames.length > 0) {
//           setSelectedSubServices((prev) => ({
//             ...prev,
//             [serviceId]: subServiceNames, // Assign valid sub-services
//           }));
//         }
//       }
//     }

//     setSelectedServices(newSelectedServices);
//     updateServiceDefaultValues();
//   };

//   const handlePackageSelect = (packageName: string) => {
//     setSelectedPackage(packageName);
//     setSelectedServices(new Set());
//     setSelectedSubServices({});

//     const normalizedPackage = packageName.toLowerCase().trim();
//     services.forEach((service) => {
//       if (
//         service.pName?.some((p) => p.toLowerCase().trim() === normalizedPackage)
//       ) {
//         setSelectedServices((prev) => new Set([...prev, service.sId]));

//         if (service.subServices) {
//           // Flatten all sName arrays and filter out empty ones
//           const subServiceNames: string[] = service.subServices
//             .flatMap((subService) => subService.sName) // Flatten the arrays
//             .filter((name) => name.trim().length > 0); // Remove empty strings

//           // Update the state only if there are valid sub-service names
//           if (subServiceNames.length > 0) {
//             setSelectedSubServices((prev) => ({
//               ...prev,
//               [service.sId]: subServiceNames,
//             }));
//           }
//         }
//       }
//     });
//     updateServiceDefaultValues();
//   };

//   const handleSaveRecords = async () => {
//     try {
//       if (!user || !selectedVehicle) {
//         toast.error("Please select vehicle and services");
//         return;
//       }

//       const vehicleData = vehicles.find((v) => v.id === selectedVehicle);
//       if (!vehicleData) {
//         toast.error("Vehicle data not found");
//         return;
//       }

//       const currentMiles = Number(miles);

//       const servicesData = Array.from(selectedServices).map((serviceId) => {
//         const service = services.find((s) => s.sId === serviceId);
//         const defaultValue = serviceDefaultValues[serviceId] || 0;
//         const nextNotificationValue =
//           defaultValue === 0 ? 0 : currentMiles + defaultValue;

//         return {
//           serviceId,
//           serviceName: service?.sName || "",
//           defaultNotificationValue: defaultValue,
//           nextNotificationValue: nextNotificationValue,
//           subServices:
//             selectedSubServices[serviceId]?.map((subService, index) => ({
//               name: subService,
//               id: `${serviceId}_${subService.replace(/\s+/g, "_")}_${index}`, // Add index to make unique
//             })) || [],
//         };
//       });

//       const notificationData = servicesData.map((service) => ({
//         serviceName: service.serviceName,
//         nextNotificationValue: service.nextNotificationValue,
//         subServices: selectedSubServices[service.serviceId] || [],
//       }));

//       const recordData = {
//         userId: user.uid,
//         vehicleId: selectedVehicle,
//         vehicleDetails: {
//           ...vehicleData,
//           currentMiles: currentMiles.toString(),
//           nextNotificationMiles: notificationData,
//         },
//         services: servicesData,
//         currentMilesArray: [
//           {
//             miles: currentMiles,
//             date: new Date().toISOString(),
//           },
//         ],
//         miles: vehicleData.vehicleType === "Truck" ? currentMiles : 0,
//         hours: vehicleData.vehicleType === "Trailer" ? Number(hours) : 0,
//         totalMiles: currentMiles,
//         date: date || new Date().toISOString(),
//         workshopName,
//         invoice,
//         description,
//         createdAt: new Date().toISOString(),
//       };

//       const batch = {
//         newRecord: doc(collection(db, "Users", user.uid, "DataServices")),
//         globalRecord: doc(collection(db, "DataServicesRecords")),
//         vehicle: doc(db, "Users", user.uid, "Vehicles", selectedVehicle),
//       };

//       await Promise.all([
//         setDoc(batch.newRecord, recordData),
//         setDoc(batch.globalRecord, recordData),
//         setDoc(
//           batch.vehicle,
//           {
//             currentMiles: currentMiles.toString(),
//             currentMilesArray: [
//               {
//                 miles: currentMiles,
//                 date: new Date().toISOString(),
//               },
//             ],
//             nextNotificationMiles: notificationData,
//           },
//           { merge: true }
//         ),
//       ]);

//       toast.success("Record added successfully!");
//       resetForm();
//     } catch (error) {
//       console.error("Error saving record:", error);
//       toast.error("Failed to save record");
//     }
//   };

//   const resetForm = () => {
//     setSelectedVehicle("");
//     setSelectedPackage("");
//     setSelectedServices(new Set());
//     setSelectedSubServices({});
//     setServiceDefaultValues({});
//     setMiles("");
//     setHours("");
//     setDate("");
//     setWorkshopName("");
//     setInvoice("");
//     setDescription("");
//     setShowAddRecords(false);
//   };

//   useEffect(() => {
//     fetchVehicles();
//     fetchServices();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user]);

//   useEffect(() => {
//     updateServiceDefaultValues();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedVehicle, selectedServices]);

//   return (
//     <div className="p-4">
//       <Button
//         variant="contained"
//         startIcon={<IoMdAdd />}
//         onClick={() => setShowAddRecords(true)}
//         className="mb-4"
//       >
//         Add Record
//       </Button>

//       <Dialog
//         open={showAddRecords}
//         onClose={() => setShowAddRecords(false)}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>Add Service Record</DialogTitle>
//         <DialogContent>
//           <Card className="mt-4">
//             <CardContent>
//               <FormControl fullWidth className="mb-4">
//                 <InputLabel>Select Vehicle</InputLabel>
//                 <Select
//                   value={selectedVehicle}
//                   onChange={(e) => {
//                     const value = e.target.value;
//                     setSelectedVehicle(value);
//                     const vehicleData =
//                       vehicles.find((v) => v.id === value) || null;
//                     setSelectedVehicleData(vehicleData);
//                   }}
//                 >
//                   {vehicles.map((vehicle) => (
//                     <MenuItem key={Math.random()} value={vehicle.id}>
//                       {vehicle.vehicleNumber} ({vehicle.companyName})
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>

//               {selectedVehicle && (
//                 <FormControl fullWidth className="mb-4">
//                   <InputLabel>Select Package (Optional)</InputLabel>
//                   <Select
//                     value={selectedPackage}
//                     onChange={(e) => {
//                       e.preventDefault();
//                       handlePackageSelect(e.target.value);
//                     }}
//                   >
//                     {packages.map((pkg) => (
//                       <MenuItem key={pkg} value={pkg}>
//                         {pkg}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               )}

//               <div className="mb-4">
//                 <TextField
//                   fullWidth
//                   label="Search Services"
//                   value={serviceSearchText}
//                   onChange={(e) => setServiceSearchText(e.target.value)}
//                   InputProps={{
//                     endAdornment: (
//                       <InputAdornment position="end">
//                         <CiSearch />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//               </div>

//               <div className="flex flex-wrap gap-2 mb-4">
//                 {services
//                   .filter(
//                     (service) =>
//                       service.sName
//                         .toLowerCase()
//                         .includes(serviceSearchText.toLowerCase()) &&
//                       (!selectedVehicleData ||
//                         service.vType === selectedVehicleData.vehicleType)
//                   )
//                   .map((service) => (
//                     <div key={service.sId} className="w-full">
//                       <Chip
//                         label={service.sName}
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleServiceSelect(service.sId);
//                           setExpandedService(
//                             expandedService === service.sId ? null : service.sId
//                           );
//                         }}
//                         color={
//                           selectedServices.has(service.sId)
//                             ? "primary"
//                             : "default"
//                         }
//                         variant={
//                           selectedServices.has(service.sId)
//                             ? "filled"
//                             : "outlined"
//                         }
//                         className="mb-2"
//                       />
//                       <Collapse
//                         in={
//                           expandedService === service.sId &&
//                           selectedServices.has(service.sId)
//                         }
//                         timeout="auto"
//                       >
//                         {service.subServices && (
//                           <div className="ml-4 mt-2">
//                             {service.subServices.map((subService) =>
//                               subService.sName.map((name, idx) => (
//                                 <Chip
//                                   key={`${service.sId}-${name}-${idx}`}
//                                   label={name}
//                                   size="small"
//                                   className="m-1"
//                                 />
//                               ))
//                             )}
//                           </div>
//                         )}
//                       </Collapse>
//                     </div>
//                   ))}
//               </div>

//               {selectedVehicleData?.vehicleType === "Truck" && (
//                 <TextField
//                   fullWidth
//                   label="Miles"
//                   type="number"
//                   value={miles}
//                   onChange={(e) => setMiles(e.target.value)}
//                   className="mb-4"
//                 />
//               )}

//               {selectedVehicleData?.vehicleType === "Trailer" && (
//                 <>
//                   <TextField
//                     fullWidth
//                     label="Hours"
//                     type="number"
//                     value={hours}
//                     onChange={(e) => setHours(e.target.value)}
//                     className="mb-4"
//                   />
//                   <TextField
//                     fullWidth
//                     label="Date"
//                     type="date"
//                     value={date}
//                     onChange={(e) => setDate(e.target.value)}
//                     InputLabelProps={{ shrink: true }}
//                     className="mb-4"
//                   />
//                 </>
//               )}

//               <TextField
//                 fullWidth
//                 label="Workshop Name"
//                 value={workshopName}
//                 onChange={(e) => setWorkshopName(e.target.value)}
//                 className="mb-4"
//               />

//               <TextField
//                 fullWidth
//                 label="Invoice (Optional)"
//                 value={invoice}
//                 onChange={(e) => setInvoice(e.target.value)}
//                 className="mb-4"
//               />

//               <TextField
//                 fullWidth
//                 label="Description (Optional)"
//                 multiline
//                 rows={4}
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//               />
//             </CardContent>
//           </Card>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setShowAddRecords(false)}>Cancel</Button>
//           <Button
//             onClick={handleSaveRecords}
//             variant="contained"
//             color="primary"
//           >
//             Save Record
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   );
// }
