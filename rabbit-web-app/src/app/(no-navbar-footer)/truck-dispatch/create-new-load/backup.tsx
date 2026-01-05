// /* eslint-disable @next/next/no-img-element */
// "use client";

// import React, { useState, useEffect, ChangeEvent, useRef } from "react";
// import {
//   Truck,
//   User,
//   Package,
//   DollarSign,
//   FileText,
//   MessageSquare,
//   Plus,
//   Trash2,
//   Save,
//   X,
//   Search,
//   UploadCloud,
//   ChevronDown,
//   LucideIcon,
//   Eye,
//   FileImage,
//   MapPin,
//   Target,
//   Fuel,
//   Scale,
//   Shield,
// } from "lucide-react";

// // --- Type Definitions ---

// interface Stop {
//   id: number;
//   // Basic Info
//   company: string;
//   customerLoadRefConf: string;

//   // Location & Timing
//   locationNotes: string;
//   date: string;
//   timeStart: string;
//   timeEnd: string;
//   stopType: string; // For "Stop pickup" or "Stop delivery"
//   hasAppointment: boolean;

//   // Load Details
//   totalQty: string;
//   qtyType: string;
//   totalWeight: string;
//   commodity: string;
//   length: string; // in inches
//   width: string; // in inches
//   height: string; // in inches
//   pickup: string;
//   shipmentBol: string;
//   poNumber: string;

//   // Reefer & Equipment (Pickup only)
//   reeferMode: string;
//   routeName: string;
//   instructions: string;
//   seal: string;
//   container: string;
//   chassis: string;
//   customerTrailer: string;
//   pro: string;
//   reeferFuelLevel: string;

//   // Split Load
//   splitLoad: string;
//   yardLocation: string;

//   // Original fields kept for compatibility
//   contactPerson: string;
//   phone: string;
//   address: string;
//   type: "FCFS" | "Appt" | "Window";
//   pickupNumber: string;
//   loadNumber: string;
//   notes: string;
// }

// interface DocumentFile {
//   id: string;
//   name: string;
//   type: "rate-confirmation" | "bol" | "pod" | "damage-photos";
//   file?: File;
//   previewUrl?: string;
//   size?: number;
// }

// interface FormData {
//   // 1. Customer & Load Header
//   customerSearch: string;
//   customerName: string;
//   primaryFees: number;
//   feeType: string;
//   tenderedMiles: string;
//   fuelSrcType: string;
//   fuelSrc: string;
//   targetRate: number;
//   vanType: string;
//   length: string;
//   weight: string;
//   bookingAuthority: string;
//   commodity: string;
//   type: string;
//   declaredValue: string;
//   salesAgent: string;
//   bookingTerminalOffice: string;
//   agency: string;
//   brokerageAgent: string;
//   customerLoadNotes: string;
//   dispatchNotes: string;

//   // 2. Pickups (Array)
//   pickups: Stop[];

//   // 3. Deliveries (Array)
//   deliveries: Stop[];

//   // 4. Equipment
//   driverId: string;
//   secondDriverId: string;
//   truckId: string;
//   trailerId: string;
//   trailerType: string;
//   dispatcherId: string;
//   carrierId: string;

//   // 5. Rates
//   lineHaul: number;
//   fuelSurcharge: number;
//   detention: number;
//   layover: number;
//   tonu: number;
//   accessorials: number;
//   totalCustomerRate: number;
//   totalCarrierPay: number;

//   // 6. Automation
//   autoSendDriver: boolean;
//   autoTrack: boolean;
//   autoInvoice: boolean;

//   // 7. Internal Notes
//   internalNotes: string;

//   // 8. Status
//   status: string;

//   // 9. Documents
//   documents: DocumentFile[];
// }

// interface Option {
//   value: string;
//   label: string;
// }

// interface Calculations {
//   totalRevenue: number;
//   estimatedProfit: number;
//   margin: number;
// }

// interface SectionHeaderProps {
//   icon: LucideIcon;
//   title: string;
//   colorClass?: string;
// }

// const SectionHeader: React.FC<SectionHeaderProps> = ({
//   icon: Icon,
//   title,
//   colorClass = "text-blue-600",
// }) => (
//   <div className="flex items-center gap-2 border-b pb-2 mb-4 mt-2">
//     <Icon className={`w-5 h-5 ${colorClass}`} />
//     <h3 className="text-lg font-bold text-gray-800">{title}</h3>
//   </div>
// );

// interface InputGroupProps {
//   label: string;
//   name: string;
//   type?: string;
//   value: string | number;
//   onChange: (e: ChangeEvent<HTMLInputElement>) => void;
//   placeholder?: string;
//   required?: boolean;
//   className?: string;
//   disabled?: boolean;
//   icon?: LucideIcon;
// }

// const InputGroup: React.FC<InputGroupProps> = ({
//   label,
//   name,
//   type = "text",
//   value,
//   onChange,
//   placeholder,
//   required = false,
//   className = "",
//   disabled = false,
//   icon: Icon,
// }) => (
//   <div className={`flex flex-col ${className}`}>
//     <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//       {label} {required && <span className="text-red-500">*</span>}
//     </label>
//     <div className="relative">
//       {Icon && (
//         <Icon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
//       )}
//       <input
//         type={type}
//         name={name}
//         value={value}
//         onChange={onChange}
//         placeholder={placeholder}
//         disabled={disabled}
//         className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
//           disabled ? "bg-gray-50 cursor-not-allowed" : ""
//         } ${Icon ? "pl-9" : ""}`}
//       />
//     </div>
//   </div>
// );

// interface SelectGroupProps {
//   label: string;
//   name: string;
//   value: string;
//   onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
//   options: Option[];
//   className?: string;
// }

// const SelectGroup: React.FC<SelectGroupProps> = ({
//   label,
//   name,
//   value,
//   onChange,
//   options,
//   className = "",
// }) => (
//   <div className={`flex flex-col ${className}`}>
//     <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//       {label}
//     </label>
//     <div className="relative">
//       <select
//         name={name}
//         value={value}
//         onChange={onChange}
//         className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
//       >
//         <option value="">Select...</option>
//         {options.map((opt) => (
//           <option key={opt.value} value={opt.value}>
//             {opt.label}
//           </option>
//         ))}
//       </select>
//       <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
//     </div>
//   </div>
// );

// interface TextAreaGroupProps {
//   label: string;
//   name: string;
//   value: string;
//   onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
//   placeholder?: string;
//   rows?: number;
//   className?: string;
// }

// const TextAreaGroup: React.FC<TextAreaGroupProps> = ({
//   label,
//   name,
//   value,
//   onChange,
//   placeholder,
//   rows = 3,
//   className = "",
// }) => (
//   <div className={`flex flex-col ${className}`}>
//     <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//       {label}
//     </label>
//     <textarea
//       name={name}
//       value={value}
//       onChange={onChange}
//       placeholder={placeholder}
//       rows={rows}
//       className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
//     />
//   </div>
// );

// interface CheckboxGroupProps {
//   label: string;
//   name: string;
//   checked: boolean;
//   onChange: (e: ChangeEvent<HTMLInputElement>) => void;
// }

// const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
//   label,
//   name,
//   checked,
//   onChange,
// }) => (
//   <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
//     <input
//       type="checkbox"
//       name={name}
//       checked={checked}
//       onChange={onChange}
//       className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
//       id={name}
//     />
//     <label
//       htmlFor={name}
//       className="text-sm text-gray-700 select-none cursor-pointer"
//     >
//       {label}
//     </label>
//   </div>
// );

// interface FileUploadBoxProps {
//   label: string;
//   type:
//     | "rate-confirmation"
//     | "bol"
//     | "pod"
//     | "damage-photos"
//     | "scale-ticket"
//     | "lumper";
//   documents: DocumentFile[];
//   onFileUpload: (type: string, file: File) => void;
//   onFileRemove: (id: string) => void;
//   onViewPreview: (previewUrl: string) => void;
// }

// const FileUploadBox: React.FC<FileUploadBoxProps> = ({
//   label,
//   type,
//   documents,
//   onFileUpload,
//   onFileRemove,
//   onViewPreview,
// }) => {
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [isDragging, setIsDragging] = useState(false);

//   const handleFileSelect = () => {
//     fileInputRef.current?.click();
//   };

//   const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       onFileUpload(type, file);
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };

//   const handleDragLeave = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);

//     const file = e.dataTransfer.files?.[0];
//     if (
//       file &&
//       (file.type.startsWith("image/") || file.type === "application/pdf")
//     ) {
//       onFileUpload(type, file);
//     }
//   };

//   const typeDocuments = documents.filter((doc) => doc.type === type);
//   const hasFiles = typeDocuments.length > 0;

//   return (
//     <div className="relative">
//       <div
//         className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer group h-full min-h-[120px] flex flex-col justify-center ${
//           isDragging
//             ? "border-blue-500 bg-blue-50"
//             : "border-gray-300 hover:bg-blue-50 hover:border-blue-300"
//         }`}
//         onClick={handleFileSelect}
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onDrop={handleDrop}
//       >
//         <UploadCloud
//           className={`w-6 h-6 mx-auto mb-2 ${
//             isDragging
//               ? "text-blue-500"
//               : "text-gray-400 group-hover:text-blue-500"
//           }`}
//         />
//         <p className="text-xs font-medium text-gray-600 leading-tight line-clamp-2">
//           {label}
//         </p>
//         <p className="text-[10px] text-gray-400 mt-1">Drag & drop or click</p>

//         <input
//           type="file"
//           ref={fileInputRef}
//           onChange={handleFileChange}
//           className="hidden"
//           accept="image/*,.pdf,.doc,.docx"
//         />
//       </div>

//       {/* Uploaded Files Preview - Only show for current box */}
//       {/* {hasFiles && (
//         <div className="mt-2 space-y-1">
//           {typeDocuments.slice(0, 1).map((doc) => (
//             <div
//               key={doc.id}
//               className="flex items-center justify-between p-1.5 bg-gray-50 rounded border border-gray-200"
//             >
//               <div className="flex items-center gap-1.5 flex-1 min-w-0">
//                 <FileImage className="w-3 h-3 text-gray-400 flex-shrink-0" />
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[10px] font-medium text-gray-700 truncate">
//                     {doc.name}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-0.5">
//                 {doc.previewUrl && (
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       onViewPreview(doc.previewUrl!);
//                     }}
//                     className="p-0.5 hover:bg-gray-200 rounded"
//                     title="View Preview"
//                   >
//                     <Eye className="w-3 h-3 text-gray-600" />
//                   </button>
//                 )}
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     onFileRemove(doc.id);
//                   }}
//                   className="p-0.5 hover:bg-red-100 hover:text-red-600 rounded"
//                   title="Remove File"
//                 >
//                   <Trash2 className="w-3 h-3" />
//                 </button>
//               </div>
//             </div>
//           ))}
//           {typeDocuments.length > 1 && (
//             <p className="text-[10px] text-gray-500 text-center">
//               +{typeDocuments.length - 1} more
//             </p>
//           )}
//         </div>
//       )} */}
//     </div>
//   );
// };

// interface StatusBadgeProps {
//   status: string;
// }

// const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
//   const styles: Record<string, string> = {
//     Draft: "bg-gray-100 text-gray-600",
//     Posted: "bg-blue-100 text-blue-700",
//     Assigned: "bg-purple-100 text-purple-700",
//     "In Transit": "bg-yellow-100 text-yellow-800",
//     Delivered: "bg-green-100 text-green-700",
//     Completed: "bg-emerald-100 text-emerald-800",
//     Cancelled: "bg-red-100 text-red-700",
//   };

//   return (
//     <span
//       className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
//         styles[status] || styles["Draft"]
//       }`}
//     >
//       {status}
//     </span>
//   );
// };

// // --- Image Preview Modal Component ---
// interface ImagePreviewModalProps {
//   imageUrl: string;
//   onClose: () => void;
// }

// const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
//   imageUrl,
//   onClose,
// }) => {
//   useEffect(() => {
//     const handleEscape = (e: KeyboardEvent) => {
//       if (e.key === "Escape") onClose();
//     };
//     document.addEventListener("keydown", handleEscape);
//     return () => document.removeEventListener("keydown", handleEscape);
//   }, [onClose]);

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
//       <div className="relative max-w-4xl max-h-[90vh] w-full">
//         <button
//           onClick={onClose}
//           className="absolute -top-10 right-0 text-white hover:text-gray-300 p-2"
//         >
//           <X className="w-6 h-6" />
//         </button>
//         <div className="bg-white rounded-lg overflow-hidden">
//           <img
//             src={imageUrl}
//             alt="Preview"
//             className="w-full h-auto max-h-[80vh] object-contain"
//           />
//           <div className="p-4 bg-white border-t">
//             <button
//               onClick={onClose}
//               className="w-full py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
//             >
//               Close Preview
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- Main Component ---

// export default function CreateNewLoadPage() {
//   // --- State Management ---
//   const [isCancelled, setIsCancelled] = useState(false);
//   const [previewImage, setPreviewImage] = useState<string | null>(null);
//   const [formData, setFormData] = useState<FormData>({
//     // 1. Customer & Load Header
//     customerSearch: "",
//     customerName: "",
//     primaryFees: 0,
//     feeType: "Line Haul",
//     tenderedMiles: "",
//     fuelSrcType: "Included",
//     fuelSrc: "",
//     targetRate: 0,
//     vanType: "Dry Van",
//     length: "53",
//     weight: "",
//     bookingAuthority: "Direct",
//     commodity: "",
//     type: "FTL",
//     declaredValue: "",
//     salesAgent: "",
//     bookingTerminalOffice: "",
//     agency: "",
//     brokerageAgent: "",
//     customerLoadNotes: "",
//     dispatchNotes: "",

//     // 2. Pickups (Array)
//     pickups: [
//       {
//         id: 1,
//         company: "",
//         customerLoadRefConf: "",
//         locationNotes: "",
//         date: "",
//         timeStart: "",
//         timeEnd: "",
//         stopType: "live-load",
//         hasAppointment: false,
//         totalQty: "",
//         qtyType: "pallets",
//         totalWeight: "",
//         commodity: "",
//         length: "",
//         width: "",
//         height: "",
//         pickup: "",
//         shipmentBol: "",
//         poNumber: "",
//         reeferMode: "",
//         routeName: "",
//         instructions: "",
//         seal: "",
//         container: "",
//         chassis: "",
//         customerTrailer: "",
//         pro: "",
//         reeferFuelLevel: "",
//         splitLoad: "",
//         yardLocation: "",
//         contactPerson: "",
//         phone: "",
//         address: "",
//         type: "FCFS",
//         pickupNumber: "",
//         loadNumber: "",
//         notes: "",
//       },
//     ],

//     // 3. Deliveries (Array)
//     deliveries: [
//       {
//         id: 1,
//         company: "",
//         customerLoadRefConf: "",
//         locationNotes: "",
//         date: "",
//         timeStart: "",
//         timeEnd: "",
//         stopType: "live-load",
//         hasAppointment: false,
//         totalQty: "",
//         qtyType: "pallets",
//         totalWeight: "",
//         commodity: "",
//         length: "",
//         width: "",
//         height: "",
//         pickup: "",
//         shipmentBol: "",
//         poNumber: "",
//         reeferMode: "",
//         routeName: "",
//         instructions: "",
//         seal: "",
//         container: "",
//         chassis: "",
//         customerTrailer: "",
//         pro: "",
//         reeferFuelLevel: "",
//         splitLoad: "",
//         yardLocation: "",
//         contactPerson: "",
//         phone: "",
//         address: "",
//         type: "FCFS",
//         pickupNumber: "",
//         loadNumber: "",
//         notes: "",
//       },
//     ],

//     // 4. Equipment
//     driverId: "",
//     secondDriverId: "",
//     truckId: "",
//     trailerId: "",
//     trailerType: "Dry Van",
//     dispatcherId: "DISP-001",
//     carrierId: "",

//     // 5. Rates
//     lineHaul: 0,
//     fuelSurcharge: 0,
//     detention: 0,
//     layover: 0,
//     tonu: 0,
//     accessorials: 0,
//     totalCustomerRate: 0,
//     totalCarrierPay: 0,

//     // 6. Automation
//     autoSendDriver: false,
//     autoTrack: true,
//     autoInvoice: false,

//     // 7. Internal Notes
//     internalNotes: "",

//     // 8. Status
//     status: "Draft",

//     // 9. Documents
//     documents: [],
//   });

//   const [calculations, setCalculations] = useState<Calculations>({
//     totalRevenue: 0,
//     estimatedProfit: 0,
//     margin: 0,
//   });

//   // Options for dropdowns
//   const feeTypeOptions: Option[] = [
//     { value: "Line Haul", label: "Line Haul" },
//     { value: "Flat Rate", label: "Flat Rate" },
//     { value: "Per Mile", label: "Per Mile" },
//     { value: "Hourly", label: "Hourly" },
//     { value: "Lump Sum", label: "Lump Sum" },
//   ];

//   const fuelSrcTypeOptions: Option[] = [
//     { value: "Included", label: "Included" },
//     { value: "Separate", label: "Separate" },
//     { value: "Customer Pays", label: "Customer Pays" },
//     { value: "Carrier Pays", label: "Carrier Pays" },
//   ];

//   const vanTypeOptions: Option[] = [
//     { value: "Dry Van", label: "Dry Van" },
//     { value: "Reefer", label: "Reefer" },
//     { value: "Flatbed", label: "Flatbed" },
//     { value: "Step Deck", label: "Step Deck" },
//     { value: "Double Drop", label: "Double Drop" },
//     { value: "Lowboy", label: "Lowboy" },
//     { value: "Conestoga", label: "Conestoga" },
//     { value: "Power Only", label: "Power Only" },
//   ];

//   const lengthOptions: Option[] = [
//     { value: "48", label: "48 ft" },
//     { value: "53", label: "53 ft" },
//     { value: "28", label: "28 ft" },
//     { value: "26", label: "26 ft" },
//     { value: "20", label: "20 ft" },
//     { value: "40", label: "40 ft" },
//   ];

//   const bookingAuthorityOptions: Option[] = [
//     { value: "Direct", label: "Direct" },
//     { value: "Broker", label: "Broker" },
//     { value: "Online Board", label: "Online Board" },
//     { value: "TMS", label: "TMS" },
//     { value: "Email", label: "Email" },
//     { value: "Phone", label: "Phone" },
//   ];

//   const typeOptions: Option[] = [
//     { value: "FTL", label: "FTL" },
//     { value: "LTL", label: "LTL" },
//     { value: "Partial", label: "Partial" },
//     { value: "Team", label: "Team" },
//     { value: "Expedited", label: "Expedited" },
//     { value: "Hazmat", label: "Hazmat" },
//   ];

//   const salesAgentOptions: Option[] = [
//     { value: "john.doe@company.com", label: "John Doe" },
//     { value: "jane.smith@company.com", label: "Jane Smith" },
//     { value: "mike.jones@company.com", label: "Mike Jones" },
//     { value: "sarah.wilson@company.com", label: "Sarah Wilson" },
//   ];

//   const officeOptions: Option[] = [
//     { value: "main", label: "Main Terminal" },
//     { value: "east", label: "East Coast Office" },
//     { value: "west", label: "West Coast Office" },
//     { value: "south", label: "Southern Terminal" },
//     { value: "midwest", label: "Midwest Hub" },
//   ];

//   const agencyOptions: Option[] = [
//     { value: "internal", label: "Internal" },
//     { value: "partner-1", label: "Logistics Partner Inc." },
//     { value: "partner-2", label: "Global Transport Agency" },
//     { value: "partner-3", label: "Freight Solutions LLC" },
//   ];

//   const brokerageAgentOptions: Option[] = [
//     { value: "agent-1", label: "David Chen" },
//     { value: "agent-2", label: "Lisa Rodriguez" },
//     { value: "agent-3", label: "Robert Kim" },
//     { value: "agent-4", label: "Emily Watson" },
//   ];

//   const shipperOptions: Option[] = [
//     { value: "shipper-1", label: "ABC Manufacturing" },
//     { value: "shipper-2", label: "XYZ Logistics" },
//     { value: "shipper-3", label: "Global Goods Inc." },
//     { value: "shipper-4", label: "Quality Products LLC" },
//     { value: "shipper-5", label: "National Distributors" },
//   ];

//   const consigneeOptions: Option[] = [
//     { value: "consignee-1", label: "Retail Chain Corp" },
//     { value: "consignee-2", label: "Distribution Center #5" },
//     { value: "consignee-3", label: "Warehouse Services Inc." },
//     { value: "consignee-4", label: "Final Destination LLC" },
//   ];

//   const stopTypeOptions: Option[] = [
//     { value: "live-load", label: "Live Load" },
//     { value: "drop-hook", label: "Drop & Hook" },
//     { value: "drop-only", label: "Drop Only" },
//     { value: "pickup-only", label: "Pickup Only" },
//     { value: "cross-dock", label: "Cross Dock" },
//   ];

//   const qtyTypeOptions: Option[] = [
//     { value: "pallets", label: "Pallets" },
//     { value: "cartons", label: "Cartons" },
//     { value: "pieces", label: "Pieces" },
//     { value: "bundles", label: "Bundles" },
//     { value: "drums", label: "Drums" },
//     { value: "units", label: "Units" },
//   ];

//   const reeferModeOptions: Option[] = [
//     { value: "continuous", label: "Continuous Run" },
//     { value: "start-stop", label: "Start/Stop" },
//     { value: "monitor-only", label: "Monitor Only" },
//     { value: "off", label: "Off (No Power)" },
//     { value: "pre-cool", label: "Pre-Cool" },
//   ];

//   const yardLocationOptions: Option[] = [
//     { value: "dock-1", label: "Dock 1 - Main" },
//     { value: "dock-2", label: "Dock 2 - Receiving" },
//     { value: "dock-3", label: "Dock 3 - Shipping" },
//     { value: "dock-4", label: "Dock 4 - Loading" },
//     { value: "yard-a", label: "Yard A" },
//     { value: "yard-b", label: "Yard B" },
//     { value: "lot-1", label: "Parking Lot 1" },
//     { value: "lot-2", label: "Parking Lot 2" },
//   ];

//   // --- Handlers ---

//   const handleInputChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value, type } = e.target;

//     if (type === "checkbox") {
//       const checked = (e.target as HTMLInputElement).checked;
//       setFormData((prev) => ({
//         ...prev,
//         [name]: checked,
//       }));
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }
//   };

//   const handleStopChange = (
//     section: "pickups" | "deliveries",
//     id: number,
//     field: keyof Stop,
//     value: string | boolean
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       [section]: prev[section].map((item) =>
//         item.id === id ? { ...item, [field]: value } : item
//       ),
//     }));
//   };

//   const addStop = (section: "pickups" | "deliveries") => {
//     const newId =
//       formData[section].length > 0
//         ? Math.max(...formData[section].map((i) => i.id)) + 1
//         : 1;

//     const newStop: Stop = {
//       id: newId,
//       company: "",
//       customerLoadRefConf: "",
//       locationNotes: "",
//       date: "",
//       timeStart: "",
//       timeEnd: "",
//       stopType: "live-load",
//       hasAppointment: false,
//       totalQty: "",
//       qtyType: "pallets",
//       totalWeight: "",
//       commodity: "",
//       length: "",
//       width: "",
//       height: "",
//       pickup: "",
//       shipmentBol: "",
//       poNumber: "",
//       reeferMode: "",
//       routeName: "",
//       instructions: "",
//       seal: "",
//       container: "",
//       chassis: "",
//       customerTrailer: "",
//       pro: "",
//       reeferFuelLevel: "",
//       splitLoad: "",
//       yardLocation: "",
//       contactPerson: "",
//       phone: "",
//       address: "",
//       type: "FCFS",
//       pickupNumber: "",
//       loadNumber: "",
//       notes: "",
//     };

//     setFormData((prev) => ({
//       ...prev,
//       [section]: [...prev[section], newStop],
//     }));

//     // Scroll to the new stop after a small delay to allow DOM update
//     setTimeout(() => {
//       const stopElement = document.getElementById(`${section}-${newId}`);
//       if (stopElement) {
//         stopElement.scrollIntoView({ behavior: "smooth", block: "center" });
//       }
//     }, 100);
//   };

//   const removeStop = (section: "pickups" | "deliveries", id: number) => {
//     if (formData[section].length === 1) return; // Prevent deleting last stop
//     setFormData((prev) => ({
//       ...prev,
//       [section]: prev[section].filter((item) => item.id !== id),
//     }));
//   };

//   const handleFileUpload = (type: string, file: File) => {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const newDoc: DocumentFile = {
//         id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//         name: file.name,
//         type: type as DocumentFile["type"],
//         file: file,
//         previewUrl: e.target?.result as string,
//         size: file.size,
//       };

//       setFormData((prev) => ({
//         ...prev,
//         documents: [...prev.documents, newDoc],
//       }));
//     };

//     if (file.type.startsWith("image/")) {
//       reader.readAsDataURL(file);
//     } else {
//       // For PDF and other non-image files
//       const newDoc: DocumentFile = {
//         id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//         name: file.name,
//         type: type as DocumentFile["type"],
//         file: file,
//         size: file.size,
//       };

//       setFormData((prev) => ({
//         ...prev,
//         documents: [...prev.documents, newDoc],
//       }));
//     }
//   };

//   const handleFileRemove = (id: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       documents: prev.documents.filter((doc) => doc.id !== id),
//     }));
//   };

//   const handleCancel = () => {
//     setIsCancelled(true);
//   };

//   const handleViewPreview = (previewUrl: string) => {
//     setPreviewImage(previewUrl);
//   };

//   const handleClosePreview = () => {
//     setPreviewImage(null);
//   };

//   // --- Effects ---

//   // Auto-calculate Totals & Profit
//   useEffect(() => {
//     const revenue =
//       Number(formData.lineHaul) +
//       Number(formData.fuelSurcharge) +
//       Number(formData.detention) +
//       Number(formData.layover) +
//       Number(formData.tonu) +
//       Number(formData.accessorials);

//     const cost = Number(formData.totalCarrierPay);
//     const profit = revenue - cost;
//     const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

//     setCalculations({
//       totalRevenue: revenue,
//       estimatedProfit: profit,
//       margin: Number(margin),
//     });

//     setFormData((prev) => ({ ...prev, totalCustomerRate: revenue }));
//   }, [
//     formData.lineHaul,
//     formData.fuelSurcharge,
//     formData.detention,
//     formData.layover,
//     formData.tonu,
//     formData.accessorials,
//     formData.totalCarrierPay,
//   ]);

//   useEffect(() => {
//     return () => {
//       formData.documents.forEach((doc) => {
//         if (doc.previewUrl && doc.previewUrl.startsWith("blob:")) {
//           URL.revokeObjectURL(doc.previewUrl);
//         }
//       });
//     };
//   }, [formData.documents]);

//   if (isCancelled) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
//           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <X className="w-8 h-8 text-red-600" />
//           </div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-2">
//             Load Creation Cancelled
//           </h2>
//           <p className="text-gray-600 mb-6">
//             The new load creation has been cancelled. No data was saved.
//           </p>
//           <button
//             onClick={() => setIsCancelled(false)}
//             className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
//           >
//             Start New Load
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       {previewImage && (
//         <ImagePreviewModal
//           imageUrl={previewImage}
//           onClose={handleClosePreview}
//         />
//       )}

//       <div className="min-h-screen bg-gray-50 pb-20 font-sans">
//         <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
//           <div className="max-w-full mx-auto px-10 py-4">
//             <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
//               <div className="flex-1">
//                 <div className="flex flex-col sm:flex-row sm:items-center gap-3">
//                   <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
//                     Create New Load
//                   </h1>
//                   <span className="hidden sm:inline text-gray-400">|</span>
//                   <div className="text-sm text-gray-500 font-mono">
//                     ID: TLO-2025-DRAFT
//                   </div>
//                 </div>
//                 <p className="text-xs text-gray-500 mt-1">
//                   Fill in the details below to dispatch a new shipment.
//                 </p>
//               </div>

//               <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
//                 <button
//                   onClick={handleCancel}
//                   className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 font-medium text-sm"
//                 >
//                   <X className="w-4 h-4" /> Cancel
//                 </button>
//                 <button className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 flex items-center justify-center gap-2 font-medium text-sm">
//                   <Save className="w-4 h-4" /> Save Draft
//                 </button>
//                 <button className="px-4 py-2 bg-[#F96176] text-white rounded-md hover:bg-[#F96176] shadow-md flex items-center justify-center gap-2 font-bold text-sm">
//                   <Package className="w-4 h-4" /> Create & Post
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="max-w-auto mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
//           <div className="lg:col-span-10 space-y-6">
//             {/* SECTION 1: Customer & Load Header */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
//               <SectionHeader
//                 icon={User}
//                 title="Customer & Load Information"
//                 colorClass="text-blue-600"
//               />

//               {/* First Row: Search Customer, Primary Fees, Fee Type */}
//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
//                 {/* Search Customer */}
//                 <div className="flex flex-col">
//                   <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                     Search Customer
//                   </label>
//                   <div className="relative">
//                     <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
//                     <input
//                       type="text"
//                       name="customerSearch"
//                       value={formData.customerSearch}
//                       onChange={handleInputChange}
//                       placeholder="Search by Name, MC#, Phone, or Reference..."
//                       className="w-full pl-9 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>

//                 {/* Primary Fees */}
//                 <InputGroup
//                   label="Primary Fees ($)"
//                   name="primaryFees"
//                   type="number"
//                   value={formData.primaryFees}
//                   onChange={handleInputChange}
//                   placeholder="0.00"
//                   icon={DollarSign}
//                 />

//                 {/* Fee Type */}
//                 <SelectGroup
//                   label="Fee Type"
//                   name="feeType"
//                   value={formData.feeType}
//                   onChange={handleInputChange}
//                   options={feeTypeOptions}
//                 />
//               </div>

//               {/* Second Row: Tendered Miles, Fuel Src Type, Fuel Source */}
//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
//                 <InputGroup
//                   label="Tendered Miles"
//                   name="tenderedMiles"
//                   value={formData.tenderedMiles}
//                   onChange={handleInputChange}
//                   placeholder="Enter miles"
//                   icon={MapPin}
//                 />

//                 <SelectGroup
//                   label="Fuel Src Type"
//                   name="fuelSrcType"
//                   value={formData.fuelSrcType}
//                   onChange={handleInputChange}
//                   options={fuelSrcTypeOptions}
//                 />

//                 <InputGroup
//                   label="Fuel Source"
//                   name="fuelSrc"
//                   value={formData.fuelSrc}
//                   onChange={handleInputChange}
//                   placeholder="Fuel source details"
//                   icon={Fuel}
//                 />
//               </div>

//               {/* Third Row: Target Rate, Van Type, Length */}
//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
//                 {/* <InputGroup
//                   label="Target Rate ($)"
//                   name="targetRate"
//                   type="number"
//                   value={formData.targetRate}
//                   onChange={handleInputChange}
//                   placeholder="Target rate"
//                   icon={Target}
//                 /> */}

//                 <SelectGroup
//                   label="Van Type"
//                   name="vanType"
//                   value={formData.vanType}
//                   onChange={handleInputChange}
//                   options={vanTypeOptions}
//                 />

//                 <SelectGroup
//                   label="Length"
//                   name="length"
//                   value={formData.length}
//                   onChange={handleInputChange}
//                   options={lengthOptions}
//                 />
//               </div>

//               {/* Fourth Row: Weight, Booking Authority, Commodity */}
//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
//                 <InputGroup
//                   label="Weight (lbs)"
//                   name="weight"
//                   value={formData.weight}
//                   onChange={handleInputChange}
//                   placeholder="Enter weight"
//                   icon={Scale}
//                 />

//                 <SelectGroup
//                   label="Booking Authority"
//                   name="bookingAuthority"
//                   value={formData.bookingAuthority}
//                   onChange={handleInputChange}
//                   options={bookingAuthorityOptions}
//                 />

//                 <InputGroup
//                   label="Commodity"
//                   name="commodity"
//                   value={formData.commodity}
//                   onChange={handleInputChange}
//                   placeholder="e.g., Electronics, Food, etc."
//                 />
//               </div>

//               {/* Fifth Row: Type, Declared Value, Sales Agent */}
//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
//                 <SelectGroup
//                   label="Type"
//                   name="type"
//                   value={formData.type}
//                   onChange={handleInputChange}
//                   options={typeOptions}
//                 />

//                 <InputGroup
//                   label="Declared Value ($)"
//                   name="declaredValue"
//                   value={formData.declaredValue}
//                   onChange={handleInputChange}
//                   placeholder="Value of goods"
//                   icon={Shield}
//                 />

//                 <SelectGroup
//                   label="Sales Agent"
//                   name="salesAgent"
//                   value={formData.salesAgent}
//                   onChange={handleInputChange}
//                   options={salesAgentOptions}
//                 />
//               </div>

//               {/* Sixth Row: Booking/Terminal Office, Agency, Brokerage Agent */}
//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
//                 <SelectGroup
//                   label="Booking/Terminal Office"
//                   name="bookingTerminalOffice"
//                   value={formData.bookingTerminalOffice}
//                   onChange={handleInputChange}
//                   options={officeOptions}
//                 />

//                 <SelectGroup
//                   label="Agency"
//                   name="agency"
//                   value={formData.agency}
//                   onChange={handleInputChange}
//                   options={agencyOptions}
//                 />

//                 <SelectGroup
//                   label="Brokerage Agent"
//                   name="brokerageAgent"
//                   value={formData.brokerageAgent}
//                   onChange={handleInputChange}
//                   options={brokerageAgentOptions}
//                 />
//               </div>

//               {/* Two text areas at bottom (2 columns on larger screens) */}
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//                 <TextAreaGroup
//                   label="Customer Load Notes"
//                   name="customerLoadNotes"
//                   value={formData.customerLoadNotes}
//                   onChange={handleInputChange}
//                   placeholder="Special instructions, requirements, etc."
//                   rows={1}
//                 />
//                 <TextAreaGroup
//                   label="Dispatch Notes"
//                   name="dispatchNotes"
//                   value={formData.dispatchNotes}
//                   onChange={handleInputChange}
//                   placeholder="Internal dispatch instructions"
//                   rows={1}
//                 />
//               </div>
//             </div>
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Pickups */}
//               <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-4 sm:p-6">
//                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
//                   <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
//                     <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
//                       A
//                     </div>
//                     Pickups
//                   </h3>
//                   <button
//                     onClick={() => addStop("pickups")}
//                     className="text-xs bg-green-50 text-green-600 px-3 py-2 rounded hover:bg-green-100 font-medium flex items-center justify-center gap-1 w-full sm:w-auto"
//                   >
//                     <Plus className="w-3 h-3" /> Add Pickup
//                   </button>
//                 </div>

//                 {formData.pickups.map((stop, index) => (
//                   <div
//                     key={stop.id}
//                     id={`pickups-${stop.id}`}
//                     className="mb-6 pb-6 border-b border-dashed last:border-0 last:mb-0 last:pb-0 relative"
//                   >
//                     <div className="flex items-center justify-between mb-4 pb-2 border-b">
//                       <h4 className="text-base font-semibold text-gray-700 flex items-center gap-2">
//                         {index > 0 && (
//                           <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
//                             {String.fromCharCode(65 + index)}
//                           </div>
//                         )}
//                         {index > 0 && `Pickup ${index + 1}`}
//                       </h4>

//                       {index > 0 && (
//                         <button
//                           onClick={() => removeStop("pickups", stop.id)}
//                           className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 font-medium flex items-center gap-1"
//                         >
//                           <Trash2 className="w-3 h-3" /> Delete Pickup
//                         </button>
//                       )}
//                     </div>

//                     <div className="space-y-4">
//                       <SelectGroup
//                         label="Shipper"
//                         value={stop.company}
//                         onChange={(e) =>
//                           handleStopChange(
//                             "pickups",
//                             stop.id,
//                             "company",
//                             e.target.value
//                           )
//                         }
//                         options={shipperOptions}
//                         name={""}
//                       />

//                       <InputGroup
//                         label="Customer Load/Ref/Conf"
//                         value={stop.customerLoadRefConf}
//                         onChange={(e) =>
//                           handleStopChange(
//                             "pickups",
//                             stop.id,
//                             "customerLoadRefConf",
//                             e.target.value
//                           )
//                         }
//                         placeholder="Customer reference number"
//                         name={""}
//                       />

//                       <div className="mt-4">
//                         <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
//                           <MapPin className="w-4 h-4" />
//                           Location Notes:
//                         </h4>
//                       </div>

//                       {/* Date, Time, Appt - MODIFIED */}
//                       <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end mb-4">
//                         <InputGroup
//                           label="Date"
//                           type="date"
//                           value={stop.date}
//                           onChange={(e) =>
//                             handleStopChange(
//                               "pickups",
//                               stop.id,
//                               "date",
//                               e.target.value
//                             )
//                           }
//                           name={""}
//                         />

//                         {stop.hasAppointment ? (
//                           <InputGroup
//                             label="Pick Time"
//                             type="time"
//                             value={stop.timeStart}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "timeStart",
//                                 e.target.value
//                               )
//                             }
//                             name={""}
//                             className="sm:col-span-2"
//                           />
//                         ) : (
//                           <>
//                             <InputGroup
//                               label="Start Time"
//                               type="time"
//                               value={stop.timeStart}
//                               onChange={(e) =>
//                                 handleStopChange(
//                                   "pickups",
//                                   stop.id,
//                                   "timeStart",
//                                   e.target.value
//                                 )
//                               }
//                               name={""}
//                             />
//                             <InputGroup
//                               label="End Time"
//                               type="time"
//                               value={stop.timeEnd}
//                               onChange={(e) =>
//                                 handleStopChange(
//                                   "pickups",
//                                   stop.id,
//                                   "timeEnd",
//                                   e.target.value
//                                 )
//                               }
//                               name={""}
//                             />
//                           </>
//                         )}

//                         <div className="flex items-center gap-2 h-[42px] border border-transparent">
//                           <input
//                             type="checkbox"
//                             checked={stop.hasAppointment}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "hasAppointment",
//                                 e.target.checked
//                               )
//                             }
//                             className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
//                             id={`appt-${stop.id}`}
//                           />
//                           <label
//                             htmlFor={`appt-${stop.id}`}
//                             className="text-sm font-bold text-gray-700 select-none cursor-pointer"
//                           >
//                             Appt
//                           </label>
//                         </div>
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <SelectGroup
//                           label="Stop Pickup"
//                           value={stop.stopType}
//                           onChange={(e) =>
//                             handleStopChange(
//                               "pickups",
//                               stop.id,
//                               "stopType",
//                               e.target.value
//                             )
//                           }
//                           options={stopTypeOptions}
//                           name={""}
//                         />
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Total Qty
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.totalQty}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "totalQty",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Quantity"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>

//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Qty Type
//                           </label>
//                           <select
//                             value={stop.qtyType}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "qtyType",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
//                           >
//                             <option value="">Select...</option>
//                             {qtyTypeOptions.map((opt) => (
//                               <option key={opt.value} value={opt.value}>
//                                 {opt.label}
//                               </option>
//                             ))}
//                           </select>
//                         </div>

//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Total Weight (lbs)
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.totalWeight}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "totalWeight",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Weight"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Commodity
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.commodity}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "commodity",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Type of goods"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>

//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Pickup #
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.pickup}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "pickup",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Pickup number"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>

//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             PO Number
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.poNumber}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "poNumber",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Purchase order"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Reefer Mode
//                           </label>
//                           <select
//                             value={stop.reeferMode}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "reeferMode",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
//                           >
//                             <option value="">Select...</option>
//                             {reeferModeOptions.map((opt) => (
//                               <option key={opt.value} value={opt.value}>
//                                 {opt.label}
//                               </option>
//                             ))}
//                           </select>
//                         </div>

//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Instructions
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.instructions}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "instructions",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Special instructions"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>

//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Seal #
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.seal}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "pickups",
//                                 stop.id,
//                                 "seal",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Seal number"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>
//                       </div>

//                       <div className="mt-4 pt-4 border-t">
//                         <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
//                           <Package className="w-4 h-4" />
//                           Split Load
//                         </h4>
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <SelectGroup
//                           label="Yard Location"
//                           value={stop.yardLocation}
//                           onChange={(e) =>
//                             handleStopChange(
//                               "pickups",
//                               stop.id,
//                               "yardLocation",
//                               e.target.value
//                             )
//                           }
//                           options={yardLocationOptions}
//                           name={""}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Deliveries */}
//               <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500 p-4 sm:p-6">
//                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
//                   <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
//                     <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
//                       Z
//                     </div>
//                     Deliveries
//                   </h3>
//                   <button
//                     onClick={() => addStop("deliveries")}
//                     className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 font-medium flex items-center justify-center gap-1 w-full sm:w-auto"
//                   >
//                     <Plus className="w-3 h-3" /> Add Delivery
//                   </button>
//                 </div>

//                 {formData.deliveries.map((stop, index) => (
//                   <div
//                     key={stop.id}
//                     id={`deliveries-${stop.id}`}
//                     className="mb-6 pb-6 border-b border-dashed last:border-0 last:mb-0 last:pb-0 relative"
//                   >
//                     <div className="flex items-center justify-between mb-4 pb-2 border-b">
//                       <h4 className="text-base font-semibold text-gray-700 flex items-center gap-2">
//                         {index > 0 && (
//                           <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
//                             {String.fromCharCode(65 + index)}
//                           </div>
//                         )}
//                         {index > 0 && `Delivery ${index + 1}`}
//                       </h4>

//                       {index > 0 && (
//                         <button
//                           onClick={() => removeStop("deliveries", stop.id)}
//                           className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 font-medium flex items-center gap-1"
//                         >
//                           <Trash2 className="w-3 h-3" /> Delete Delivery
//                         </button>
//                       )}
//                     </div>
//                     <div className="space-y-4">
//                       <SelectGroup
//                         label="Consignee"
//                         value={stop.company}
//                         onChange={(e) =>
//                           handleStopChange(
//                             "deliveries",
//                             stop.id,
//                             "company",
//                             e.target.value
//                           )
//                         }
//                         options={consigneeOptions}
//                         name={""}
//                       />

//                       <InputGroup
//                         label="Customer Load/Ref/Conf"
//                         value={stop.customerLoadRefConf}
//                         onChange={(e) =>
//                           handleStopChange(
//                             "deliveries",
//                             stop.id,
//                             "customerLoadRefConf",
//                             e.target.value
//                           )
//                         }
//                         placeholder="Customer reference number"
//                         name={""}
//                       />

//                       <div className="mt-4">
//                         <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
//                           <MapPin className="w-4 h-4" />
//                           Location Notes:
//                         </h4>
//                       </div>

//                       {/* Date, Time, Appt - MODIFIED */}
//                       <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end mb-4">
//                         <InputGroup
//                           label="Date"
//                           type="date"
//                           value={stop.date}
//                           onChange={(e) =>
//                             handleStopChange(
//                               "deliveries",
//                               stop.id,
//                               "date",
//                               e.target.value
//                             )
//                           }
//                           name={""}
//                         />

//                         {stop.hasAppointment ? (
//                           <InputGroup
//                             label="Pick Time"
//                             type="time"
//                             value={stop.timeStart}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "deliveries",
//                                 stop.id,
//                                 "timeStart",
//                                 e.target.value
//                               )
//                             }
//                             name={""}
//                             className="sm:col-span-2"
//                           />
//                         ) : (
//                           <>
//                             <InputGroup
//                               label="Start Time"
//                               type="time"
//                               value={stop.timeStart}
//                               onChange={(e) =>
//                                 handleStopChange(
//                                   "deliveries",
//                                   stop.id,
//                                   "timeStart",
//                                   e.target.value
//                                 )
//                               }
//                               name={""}
//                             />
//                             <InputGroup
//                               label="End Time"
//                               type="time"
//                               value={stop.timeEnd}
//                               onChange={(e) =>
//                                 handleStopChange(
//                                   "deliveries",
//                                   stop.id,
//                                   "timeEnd",
//                                   e.target.value
//                                 )
//                               }
//                               name={""}
//                             />
//                           </>
//                         )}

//                         <div className="flex items-center gap-2 h-[42px] border border-transparent">
//                           <input
//                             type="checkbox"
//                             checked={stop.hasAppointment}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "deliveries",
//                                 stop.id,
//                                 "hasAppointment",
//                                 e.target.checked
//                               )
//                             }
//                             className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
//                             id={`del-appt-${stop.id}`}
//                           />
//                           <label
//                             htmlFor={`del-appt-${stop.id}`}
//                             className="text-sm font-bold text-gray-700 select-none cursor-pointer"
//                           >
//                             Appt
//                           </label>
//                         </div>
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <SelectGroup
//                           label="Stop Delivery"
//                           value={stop.stopType}
//                           onChange={(e) =>
//                             handleStopChange(
//                               "deliveries",
//                               stop.id,
//                               "stopType",
//                               e.target.value
//                             )
//                           }
//                           options={stopTypeOptions}
//                           name={""}
//                         />
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Total Qty
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.totalQty}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "deliveries",
//                                 stop.id,
//                                 "totalQty",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Quantity"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>

//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Qty Type
//                           </label>
//                           <select
//                             value={stop.qtyType}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "deliveries",
//                                 stop.id,
//                                 "qtyType",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
//                           >
//                             <option value="">Select...</option>
//                             {qtyTypeOptions.map((opt) => (
//                               <option key={opt.value} value={opt.value}>
//                                 {opt.label}
//                               </option>
//                             ))}
//                           </select>
//                         </div>

//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Total Weight (lbs)
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.totalWeight}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "deliveries",
//                                 stop.id,
//                                 "totalWeight",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Weight"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Commodity
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.commodity}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "deliveries",
//                                 stop.id,
//                                 "commodity",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Type of goods"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>

//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             Delivery Instruction
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.pickup}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "deliveries",
//                                 stop.id,
//                                 "pickup",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Delivery instruction"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>

//                         <div className="flex flex-col">
//                           <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                             PO Number
//                           </label>
//                           <input
//                             type="text"
//                             value={stop.poNumber}
//                             onChange={(e) =>
//                               handleStopChange(
//                                 "deliveries",
//                                 stop.id,
//                                 "poNumber",
//                                 e.target.value
//                               )
//                             }
//                             placeholder="Purchase order"
//                             className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                           />
//                         </div>
//                       </div>

//                       <div className="mt-4 pt-4 border-t">
//                         <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
//                           <Package className="w-4 h-4" />
//                           Split Load
//                         </h4>
//                       </div>

//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <SelectGroup
//                           label="Yard Location"
//                           value={stop.yardLocation}
//                           onChange={(e) =>
//                             handleStopChange(
//                               "deliveries",
//                               stop.id,
//                               "yardLocation",
//                               e.target.value
//                             )
//                           }
//                           options={yardLocationOptions}
//                           name={""}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* SECTION 4: Equipment & Driver - Keep as before */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
//               <SectionHeader
//                 icon={Truck}
//                 title="Equipment & Driver Assignment"
//                 colorClass="text-orange-600"
//               />
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <SelectGroup
//                   label="Select Carrier"
//                   name="carrierId"
//                   value={formData.carrierId}
//                   onChange={handleInputChange}
//                   options={[
//                     { value: "CAR-101", label: "3 Arrows INC." },
//                     { value: "CAR-102", label: "7 Days Carrier" },
//                     { value: "CAR-103", label: "A & D Trucklines" },
//                   ]}
//                 />
//                 <SelectGroup
//                   label="Select Driver"
//                   name="driverId"
//                   value={formData.driverId}
//                   onChange={handleInputChange}
//                   options={[
//                     { value: "DRV-101", label: "Delmo (Available)" },
//                     { value: "DRV-102", label: "Jimmy (In Transit)" },
//                     { value: "DRV-103", label: "Rahul (Available)" },
//                   ]}
//                 />
//                 <SelectGroup
//                   label="Assigned Truck"
//                   name="truckId"
//                   value={formData.truckId}
//                   onChange={handleInputChange}
//                   options={[
//                     { value: "TRK-001", label: "FREIGHTLINER (A01DET)" },
//                     { value: "TRK-002", label: "INTERNATIONAL (A04INT)" },
//                     { value: "TRK-003", label: "ISUZU MOTORS (A07ISU)" },
//                     { value: "TRK-004", label: "KENWORTH (A08MAX)" },
//                     { value: "TRK-005", label: "MACK (A11CUM)" },
//                   ]}
//                 />
//                 <SelectGroup
//                   label="Assigned Trailer"
//                   name="trailerId"
//                   value={formData.trailerId}
//                   onChange={handleInputChange}
//                   options={[
//                     { value: "TRL-5501", label: "HYUNDAI (SMR2233)" },
//                     { value: "TRL-9902", label: "DRY VAN (BXXZDFF566)" },
//                   ]}
//                 />
//                 <InputGroup
//                   label="Co-Driver (Team)"
//                   name="secondDriverId"
//                   value={formData.secondDriverId}
//                   onChange={handleInputChange}
//                   placeholder="Optional"
//                   className="sm:col-span-2 lg:col-span-1"
//                 />
//                 <InputGroup
//                   label="Dispatcher"
//                   name="dispatcherId"
//                   value={formData.dispatcherId}
//                   onChange={handleInputChange}
//                   disabled
//                   className="sm:col-span-2 lg:col-span-1"
//                 />
//               </div>
//               <div className="mt-4 flex flex-col sm:flex-row gap-3">
//                 <CheckboxGroup
//                   label="Notify Driver via App"
//                   name="autoSendDriver"
//                   checked={formData.autoSendDriver}
//                   onChange={handleInputChange}
//                 />
//                 <CheckboxGroup
//                   label="Enable GPS Tracking"
//                   name="autoTrack"
//                   checked={formData.autoTrack}
//                   onChange={handleInputChange}
//                 />
//               </div>
//             </div>

//             {/* SECTION 5: Documents */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
//               <SectionHeader
//                 icon={FileText}
//                 title="Documents & Compliance"
//                 colorClass="text-gray-600"
//               />
//               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
//                 <FileUploadBox
//                   label="Rate Confirmation"
//                   type="rate-confirmation"
//                   documents={formData.documents}
//                   onFileUpload={handleFileUpload}
//                   onFileRemove={handleFileRemove}
//                   onViewPreview={handleViewPreview}
//                 />
//                 <FileUploadBox
//                   label="Bill of Lading (BOL)"
//                   type="bol"
//                   documents={formData.documents}
//                   onFileUpload={handleFileUpload}
//                   onFileRemove={handleFileRemove}
//                   onViewPreview={handleViewPreview}
//                 />
//                 <FileUploadBox
//                   label="Proof of Delivery (POD)"
//                   type="pod"
//                   documents={formData.documents}
//                   onFileUpload={handleFileUpload}
//                   onFileRemove={handleFileRemove}
//                   onViewPreview={handleViewPreview}
//                 />
//                 <FileUploadBox
//                   label="Damage Photos"
//                   type="damage-photos"
//                   documents={formData.documents}
//                   onFileUpload={handleFileUpload}
//                   onFileRemove={handleFileRemove}
//                   onViewPreview={handleViewPreview}
//                 />
//                 <FileUploadBox
//                   label="Scale Ticket"
//                   type="scale-ticket"
//                   documents={formData.documents}
//                   onFileUpload={handleFileUpload}
//                   onFileRemove={handleFileRemove}
//                   onViewPreview={handleViewPreview}
//                 />
//                 <FileUploadBox
//                   label="Lumper"
//                   type="lumper"
//                   documents={formData.documents}
//                   onFileUpload={handleFileUpload}
//                   onFileRemove={handleFileRemove}
//                   onViewPreview={handleViewPreview}
//                 />
//               </div>

//               {formData.documents.length > 0 && (
//                 <div className="mt-6 pt-4 border-t">
//                   <div className="flex items-center justify-between mb-3">
//                     <h4 className="text-sm font-semibold text-gray-700">
//                       Uploaded Documents
//                     </h4>
//                     <span className="text-xs text-gray-500">
//                       {formData.documents.length} file(s)
//                     </span>
//                   </div>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                     {formData.documents.slice(0, 4).map((doc) => (
//                       <div
//                         key={doc.id}
//                         className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200"
//                       >
//                         <FileImage className="w-5 h-5 text-gray-400" />
//                         <div className="flex-1 min-w-0">
//                           <p className="text-sm font-medium text-gray-700 truncate">
//                             {doc.name}
//                           </p>
//                           <p className="text-xs text-gray-500 capitalize">
//                             {doc.type.replace("-", " ")}
//                           </p>
//                         </div>
//                         <div className="flex items-center gap-1">
//                           {doc.previewUrl && (
//                             <button
//                               onClick={() => handleViewPreview(doc.previewUrl!)}
//                               className="p-1 hover:bg-gray-200 rounded"
//                               title="View Preview"
//                             >
//                               <Eye className="w-4 h-4 text-gray-600" />
//                             </button>
//                           )}
//                           <button
//                             onClick={() => handleFileRemove(doc.id)}
//                             className="p-1 hover:bg-red-100 hover:text-red-600 rounded"
//                             title="Remove File"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* RIGHT COLUMN (Financials & Status) */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* SECTION 6: Status */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
//               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
//                 <h3 className="font-bold text-gray-700">Load Status</h3>
//                 <StatusBadge status={formData.status} />
//               </div>
//               <div className="space-y-3 relative">
//                 <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200"></div>
//                 {["Draft", "Posted", "Assigned", "In Transit", "Delivered"].map(
//                   (step) => (
//                     <div
//                       key={step}
//                       className="flex items-center gap-3 relative z-10"
//                     >
//                       <div
//                         className={`w-4 h-4 rounded-full border-2 ${
//                           step === formData.status
//                             ? "bg-[#F96176] border-[#F96176]"
//                             : "bg-white border-gray-300"
//                         }`}
//                       ></div>
//                       <span
//                         className={`text-sm ${
//                           step === formData.status
//                             ? "font-bold text-[#F96176]"
//                             : "text-gray-500"
//                         }`}
//                       >
//                         {step}
//                       </span>
//                     </div>
//                   )
//                 )}
//               </div>

//               <div className="mt-6 pt-4 border-t">
//                 <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
//                   Change Status
//                 </label>
//                 <select
//                   className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 bg-gray-50"
//                   name="status"
//                   value={formData.status}
//                   onChange={handleInputChange}
//                 >
//                   <option value="Draft">Draft</option>
//                   <option value="Posted">Posted (Open)</option>
//                   <option value="Assigned">Assigned</option>
//                   <option value="In Transit">In Transit</option>
//                   <option value="Delivered">Delivered</option>
//                   <option value="Cancelled">Cancelled</option>
//                 </select>
//               </div>
//             </div>

//             {/* SECTION 7: Rates & Financials */}
//             <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
//               <div className="bg-gray-900 px-4 sm:px-6 py-4 border-b border-gray-800">
//                 <div className="flex items-center gap-2 text-white">
//                   <DollarSign className="w-5 h-5 text-green-400" />
//                   <h3 className="text-lg font-bold">Financials</h3>
//                 </div>
//               </div>

//               <div className="p-4 sm:p-6 space-y-4">
//                 <InputGroup
//                   label="Line Haul Rate ($)"
//                   name="lineHaul"
//                   type="number"
//                   value={formData.lineHaul}
//                   onChange={handleInputChange}
//                 />
//                 <InputGroup
//                   label="Fuel Surcharge ($)"
//                   name="fuelSurcharge"
//                   type="number"
//                   value={formData.fuelSurcharge}
//                   onChange={handleInputChange}
//                 />

//                 <div className="grid grid-cols-2 gap-3">
//                   <InputGroup
//                     label="Detention"
//                     name="detention"
//                     type="number"
//                     value={formData.detention}
//                     onChange={handleInputChange}
//                   />
//                   <InputGroup
//                     label="Layover"
//                     name="layover"
//                     type="number"
//                     value={formData.layover}
//                     onChange={handleInputChange}
//                   />
//                   <InputGroup
//                     label="TONU"
//                     name="tonu"
//                     type="number"
//                     value={formData.tonu}
//                     onChange={function (): void {
//                       throw new Error("Function not implemented.");
//                     }}
//                   />
//                 </div>

//                 <div className="border-t border-dashed my-4"></div>

//                 <div className="bg-gray-50 p-4 rounded-lg space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-600">Total Revenue:</span>
//                     <span className="font-bold text-gray-900">
//                       ${calculations.totalRevenue.toFixed(2)}
//                     </span>
//                   </div>

//                   <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
//                     <span className="text-gray-600">Carrier Pay:</span>
//                     <input
//                       type="number"
//                       name="totalCarrierPay"
//                       value={formData.totalCarrierPay}
//                       onChange={handleInputChange}
//                       className="w-24 text-right rounded border-gray-300 text-sm p-1"
//                       placeholder="0.00"
//                     />
//                   </div>

//                   <div
//                     className={`flex justify-between text-sm font-bold pt-2 ${
//                       calculations.estimatedProfit >= 0
//                         ? "text-green-600"
//                         : "text-red-600"
//                     }`}
//                   >
//                     <span>Profit ({calculations.margin}%):</span>
//                     <span>${calculations.estimatedProfit.toFixed(2)}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* SECTION 8: Internal Notes */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
//               <SectionHeader
//                 icon={MessageSquare}
//                 title="Internal Notes"
//                 colorClass="text-yellow-600"
//               />
//               <div className="space-y-3">
//                 <div>
//                   <label className="text-xs font-semibold text-gray-500 uppercase">
//                     Internal Notes
//                   </label>
//                   <textarea
//                     name="internalNotes"
//                     value={formData.internalNotes}
//                     onChange={handleInputChange}
//                     className="w-full border rounded-md p-2 text-sm h-20 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="Private notes..."
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
