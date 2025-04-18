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
//   // Table,
//   // TableBody,
//   // TableCell,
//   // TableContainer,
//   // TableHead,
//   // TableRow,
//   // Paper,
//   // IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   Chip,
//   Card,
//   CardContent,
//   // OutlinedInput,
//   InputAdornment,
// } from "@mui/material";
// import toast from "react-hot-toast";
// import { VehicleTypes } from "@/types/types";
// import { useAuth } from "@/contexts/AuthContexts";
// import { GlobalToastError } from "@/utils/globalErrorToast";
// // import { WhatsappShareButton, WhatsappIcon } from "react-share";
// import { CiSearch } from "react-icons/ci";
// // import { MdFilterList } from "react-icons/md";
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

// interface ServiceRecord {
//   vehicleDetails: {
//     vehicleNumber: string;
//     vehicleType: string;
//     companyName: string;
//     engineNumber: string;
//     currentMiles?: string;
//     nextNotificationMiles?: Array<{
//       serviceName: string;
//       nextNotificationValue: number;
//       subServices: string[];
//     }>;
//   };
//   services: Array<{
//     serviceId: string;
//     serviceName: string;
//     defaultNotificationValue: number;
//     nextNotificationValue: number;
//     subServices: Array<{ name: string; id: string }>;
//   }>;
//   date: string;
//   hours: number;
//   miles: number;
//   totalMiles: number;
//   createdAt: string;
//   workshopName: string;
//   invoice?: string;
//   description?: string;
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

//   // Search and Filter State
//   // const [showSearchFilter, setShowSearchFilter] = useState(false);
//   // const [filterVehicle, setFilterVehicle] = useState("");
//   // const [filterService, setFilterService] = useState("");
//   // const [filterMiles, setFilterMiles] = useState("");
//   // const [startDate, setStartDate] = useState("");
//   // const [endDate, setEndDate] = useState("");
//   // const [vehicleSearchText, setVehicleSearchText] = useState("");
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
//         key={Math.random()}
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
//                     setSelectedVehicle(e.target.value);
//                     setSelectedVehicleData(
//                       vehicles.find((v) => v.id === e.target.value) || null
//                     );
//                   }}
//                 >
//                   {vehicles.map((vehicle) => (
//                     <MenuItem key={vehicle.id} value={vehicle.id}>
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
//                     onChange={(e) => handlePackageSelect(e.target.value)}
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
//                     <div key={service.sId}>
//                       <Chip
//                         label={service.sName}
//                         onClick={() => handleServiceSelect(service.sId)}
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
//                       />
//                       {selectedServices.has(service.sId) &&
//                         service.subServices && (
//                           <div className="ml-4 mt-2">
//                             {service.subServices.map((subService, index) => (
//                               <Chip
//                                 key={`${service.sId}_${subService.sName}_${index}`}
//                                 label={subService.sName}
//                                 size="small"
//                                 className="m-1"
//                               />
//                             ))}
//                           </div>
//                         )}
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

// ("use client");

// import { useState, useEffect } from "react";
// import { db } from "@/lib/firebase";
// import {
//   arrayUnion,
//   collection,
//   doc,
//   getDoc,
//   setDoc,
//   getDocs,
//   updateDoc,
//   onSnapshot,
//   query,
// } from "firebase/firestore";
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

// interface ServiceRecord {
//   vehicleDetails: {
//     vehicleNumber: string;
//     vehicleType: string;
//     companyName: string;
//     engineNumber: string;
//     currentMiles?: string;
//     nextNotificationMiles?: Array<{
//       serviceName: string;
//       nextNotificationValue: number;
//       subServices: string[];
//     }>;
//   };
//   services: Array<{
//     serviceId: string;
//     serviceName: string;
//     defaultNotificationValue: number;
//     nextNotificationValue: number;
//     subServices: Array<{ name: string; id: string }>;
//   }>;
//   date: string;
//   hours: number;
//   miles: number;
//   totalMiles: number;
//   createdAt: string;
//   workshopName: string;
//   invoice?: string;
//   description?: string;
// }

// interface RecordData extends ServiceRecord {
//   id: string;
//   vehicle: string;
// }

// export default function RecordsPage() {
//   const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
//   const [services, setServices] = useState<ServiceData[]>([]);
//   const [records, setRecords] = useState<ServiceRecord[]>([]);
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

//   // Add Miles Form State
//   const [showAddMiles, setShowAddMiles] = useState(false);
//   const [todayMiles, setTodayMiles] = useState("");
//   const [selectedVehicleType, setSelectedVehicleType] = useState("");

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

//   const handleAddMiles = async () => {
//     if (!selectedVehicle || !todayMiles || !user?.uid) {
//       toast.error("Please select a vehicle and enter miles/hours.");
//       return;
//     }

//     const vehicleData = vehicles.find((v) => v.id === selectedVehicle);
//     if (!vehicleData) {
//       toast.error("Vehicle data not found.");
//       return;
//     }

//     try {
//       const vehicleRef = doc(
//         db,
//         "Users",
//         user.uid,
//         "Vehicles",
//         selectedVehicle
//       );
//       const vehicleDoc = await getDoc(vehicleRef);

//       if (!vehicleDoc.exists()) {
//         toast.error("Vehicle data not found.");
//         return;
//       }

//       const currentReadingField =
//         selectedVehicleType === "Truck" ? "currentMiles" : "hoursReading";
//       const currentReadingArrayField =
//         selectedVehicleType === "Truck"
//           ? "currentMilesArray"
//           : "hoursReadingArray";

//       const currentReading = parseInt(
//         vehicleDoc.data()[currentReadingField] || "0"
//       );
//       const enteredValue = parseInt(todayMiles);

//       if (enteredValue < currentReading) {
//         toast.error(
//           `${
//             selectedVehicleType === "Truck" ? "Miles" : "Hours"
//           } cannot be less than the current value.`
//         );
//         return;
//       }

//       await updateDoc(vehicleRef, {
//         [currentReadingField]: enteredValue,
//         [currentReadingArrayField]: arrayUnion({
//           [selectedVehicleType === "Truck" ? "miles" : "hours"]: enteredValue,
//           date: new Date().toISOString(),
//         }),
//       });

//       toast.success(
//         `${
//           selectedVehicleType === "Truck" ? "Miles" : "Hours"
//         } updated successfully!`
//       );
//       setTodayMiles("");
//       setShowAddMiles(false);
//     } catch (error) {
//       console.error("Error updating miles/hours:", error);
//       toast.error("Failed to save miles/hours.");
//     }
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

//   const handleVehicleSelect = async (value: string) => {
//     setSelectedVehicle(value);
//     if (!user?.uid) return;
//     const vehicleDoc = await getDoc(
//       doc(db, "Users", user.uid, "Vehicles", value)
//     );
//     if (vehicleDoc.exists()) {
//       setSelectedVehicleType(vehicleDoc.data().vehicleType);
//     } else {
//       toast.error("Vehicle data not found.");
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
//     if (!user?.uid) return;

//     const recordsQuery = query(
//       collection(db, "Users", user.uid, "DataServices")
//     );

//     const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
//       const recordsData: RecordData[] = snapshot.docs.map((doc) => {
//         const data = doc.data() as ServiceRecord;
//         return {
//           ...data,
//           id: doc.id,
//           vehicle: data.vehicleDetails.companyName,
//         };
//       });

//       setRecords(recordsData);
//       console.log(`Fetched ${recordsData.length} records`);
//     });

//     return () => unsubscribe();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user]);

//   useEffect(() => {
//     updateServiceDefaultValues();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedVehicle, selectedServices]);

//   return (
//     <div className="flex items-center p-6 bg-gray-100  gap-8">
//       <Button
//         variant="contained"
//         startIcon={<IoMdAdd />}
//         onClick={() => setShowAddRecords(true)}
//         className="mb-6 bg-[#F96176] hover:bg-[#F96176] text-white transition duration-300"
//       >
//         Add Record
//       </Button>

//       <Button
//         variant="contained"
//         onClick={() => setShowAddMiles(true)}
//         className="mb-6 bg-[#58BB87] hover:bg-[#58BB87] text-white transition duration-300"
//       >
//         Add Miles/Hours
//       </Button>

//       <Dialog
//         open={showAddMiles}
//         onClose={() => setShowAddMiles(false)}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle className="bg-[#58BB87] text-white">
//           Add Miles/Hours
//         </DialogTitle>
//         <DialogContent>
//           <Card className="mt-4 shadow-lg rounded-lg">
//             <CardContent>
//               <FormControl fullWidth className="mb-4">
//                 <InputLabel>Select Vehicle</InputLabel>
//                 <Select
//                   value={selectedVehicle}
//                   onChange={(e) => handleVehicleSelect(e.target.value)}
//                   className="rounded-lg"
//                 >
//                   {vehicles.map((vehicle) => (
//                     <MenuItem key={vehicle.id} value={vehicle.id}>
//                       {vehicle.vehicleNumber} ({vehicle.companyName})
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>

//               {selectedVehicleType && (
//                 <TextField
//                   fullWidth
//                   label={
//                     selectedVehicleType === "Truck"
//                       ? "Enter Miles"
//                       : "Enter Hours"
//                   }
//                   type="number"
//                   value={todayMiles}
//                   onChange={(e) => setTodayMiles(e.target.value)}
//                   className="mb-4 rounded-lg"
//                 />
//               )}
//             </CardContent>
//           </Card>
//         </DialogContent>
//         <DialogActions>
//           <Button
//             onClick={() => setShowAddMiles(false)}
//             className="text-gray-600 hover:text-gray-800"
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleAddMiles}
//             variant="contained"
//             color="primary"
//             className="bg-[#58BB87] hover:bg-[#58BB87] transition duration-300"
//           >
//             Save {selectedVehicleType === "Truck" ? "Miles" : "Hours"}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Add Record Dialog */}
//       <Dialog
//         open={showAddRecords}
//         onClose={() => setShowAddRecords(false)}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle className="bg-[#F96176] text-white">
//           Add Service Record
//         </DialogTitle>
//         <DialogContent>
//           <Card className="mt-4 shadow-lg rounded-lg">
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
//                   className="rounded-lg"
//                 >
//                   {vehicles.map((vehicle) => (
//                     <MenuItem key={vehicle.id} value={vehicle.id}>
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
//                     className="rounded-lg"
//                   >
//                     {packages.map((pkg) => (
//                       <MenuItem key={pkg} value={pkg}>
//                         {pkg.toUpperCase()}
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
//                   className="rounded-lg"
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
//                         sx={{
//                           backgroundColor: selectedServices.has(service.sId)
//                             ? "#F96176"
//                             : "default",
//                           color: selectedServices.has(service.sId)
//                             ? "white"
//                             : "inherit",
//                           "&:hover": {
//                             backgroundColor: selectedServices.has(service.sId)
//                               ? "#F96176"
//                               : "#FFCDD2", // Optional hover color
//                           },
//                         }}
//                         variant={
//                           selectedServices.has(service.sId)
//                             ? "filled"
//                             : "outlined"
//                         }
//                         className="mb-2 transition duration-300 hover:shadow-lg"
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
//                                   className="m-1 transition duration-300 hover:bg-gray-200"
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
//                   className="mb-4 rounded-lg"
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
//                     className="mb-4 rounded-lg"
//                   />
//                   <TextField
//                     fullWidth
//                     label="Date"
//                     type="date"
//                     value={date}
//                     onChange={(e) => setDate(e.target.value)}
//                     InputLabelProps={{ shrink: true }}
//                     className="mb-4 rounded-lg"
//                   />
//                 </>
//               )}

//               <TextField
//                 fullWidth
//                 label="Workshop Name"
//                 value={workshopName}
//                 onChange={(e) => setWorkshopName(e.target.value)}
//                 className="mb-4 rounded-lg"
//               />
//               <TextField
//                 fullWidth
//                 label="Invoice (Optional)"
//                 value={invoice}
//                 onChange={(e) => setInvoice(e.target.value)}
//                 className="mb-4 rounded-lg"
//               />
//               <TextField
//                 fullWidth
//                 label="Description (Optional)"
//                 multiline
//                 rows={4}
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//                 className="rounded-lg"
//               />
//             </CardContent>
//           </Card>
//         </DialogContent>
//         <DialogActions>
//           <Button
//             onClick={() => setShowAddRecords(false)}
//             className="text-gray-600 hover:text-gray-800"
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleSaveRecords}
//             variant="contained"
//             color="primary"
//             className="bg-[#F96176] hover:bg-[#F96176] transition duration-300"
//           >
//             Save Record
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   );
// }
