// "use client";

// import React, { useState } from "react";
// import {
//   X,
//   Save,
//   Printer,
//   Eye,
//   Copy,
//   Check,
//   ChevronDown,
//   Building,
//   FileText,
//   User,
//   FileSpreadsheet,
//   StickyNote,
//   DollarSign,
//   Package,
//   Phone,
//   CreditCard,
//   Shield,
//   Truck,
//   Banknote,
//   FileSignature,
//   Network,
// } from "lucide-react";

// // Tab type definition
// type CarrierTab =
//   | "details"
//   | "documents"
//   | "external"
//   | "notes"
//   | "ratecard"
//   | "accessorial";

// // Form Data Interface
// interface CarrierFormData {
//   // Existing fields
//   serviceType: string;
//   authorityType: string;
//   loadStopTenancyName: string;
//   carrierName: string;
//   contactPerson: string;
//   mcNumber: string;
//   dotNumber: string;
//   fedTaxId: string;
//   scacCode: string;
//   customCarrierId: string;
//   mcpid: string;
//   rmisid: string;
//   highwayId: string;
//   partner: string;
//   registration: string;
//   dbaName: string;
//   ltlConnectAccountId: string;
//   project44AccountNumber: string;
//   status: "Active" | "Inactive" | "Pending" | "Frozen";
//   track1099: boolean;
//   noaReq: boolean;
//   enableTriumphPaySync: boolean;
//   quickPay: boolean;

//   // Contact section
//   address: string;
//   addressLine2: string;
//   city: string;
//   state: string;
//   zipCode: string;
//   phone: string;
//   fax: string;
//   email: string;
//   website: string;
//   contactNotes: string;

//   // Carrier Settlement
//   paymentNetTerm: string;
//   carrierPayPerMile: string;
//   carrierPayEmptyMile: string;
//   detentionRate: string;
//   detentionPercentage: string;
//   layoverRate: string;
//   layoverPercentage: string;
//   otherFlat: string;
//   otherPercentage: string;
//   hourlyRate: string;
//   overTimeRate: string;
//   perStopPay: string;
//   afterStop: string;
//   invoice: string;
//   fuelSurcharge: string;
//   salesTax: string;
//   payMethod: string;

//   // Insurance fields interface
//   primaryInsuranceCompany: string;
//   primaryInsurancePhone: string;
//   primaryInsuranceAgent: string;
//   primaryInsuranceAgentPhone: string;
//   primaryInsuranceEmail: string;
//   primaryInsurancePolicy: string;
//   primaryInsuranceExpiration: string;
//   primaryInsuranceLimit: string;
//   primaryInsuranceCity: string;
//   primaryInsuranceState: string;
//   primaryInsuranceZipCode: string;
//   primaryInsuranceFax: string;
//   primaryInsuranceDeductible: string;
//   primaryInsuranceNotes: string;

//   cargoInsuranceCompany: string;
//   cargoInsurancePhone: string;
//   cargoInsuranceAgent: string;
//   cargoInsuranceAgentPhone: string;
//   cargoInsuranceEmail: string;
//   cargoInsurancePolicy: string;
//   cargoInsuranceExpiration: string;
//   cargoInsuranceLimit: string;
//   cargoInsuranceCity: string;
//   cargoInsuranceState: string;
//   cargoInsuranceZipCode: string;
//   cargoInsuranceFax: string;
//   cargoInsuranceDeductible: string;
//   cargoInsuranceNotes: string;

//   generalInsuranceCompany: string;
//   generalInsurancePhone: string;
//   generalInsuranceAgent: string;
//   generalInsuranceAgentPhone: string;
//   generalInsuranceEmail: string;
//   generalInsurancePolicy: string;
//   generalInsuranceExpiration: string;
//   generalInsuranceLimit: string;
//   generalInsuranceCity: string;
//   generalInsuranceState: string;
//   generalInsuranceZipCode: string;
//   generalInsuranceFax: string;
//   generalInsuranceDeductible: string;
//   generalInsuranceNotes: string;

//   // Factory Payable To
//   factoryPayableSameAsCarrier: boolean;
//   factoryPayableName: string;
//   factoryPayableAddress: string;
//   factoryPayableCity: string;
//   factoryPayableState: string;
//   factoryPayableCountry: string;
//   factoryPayableZipCode: string;
//   factoryPayablePhone: string;
//   factoryPayableFax: string;
//   factoryPayableEmail: string;
//   factoryPayableWebsite: string;
//   factoryPayableContactPerson: string;

//   // Remit Details
//   remitSameAsCarrier: boolean;
//   remitName: string;
//   remitAddress: string;
//   remitCity: string;
//   remitState: string;
//   remitCountry: string;
//   remitZipCode: string;
//   remitPhone: string;
//   remitFax: string;
//   remitEmail: string;
//   remitWebsite: string;
//   remitContactPerson: string;

//   // Dispatch Details
//   dispatchContactName: string;
//   dispatchEmail: string;
//   dispatchPhone1: string;
//   dispatchPhone2: string;
//   dispatchPhone3: string;

//   // Modes
//   modeLTL: boolean;
//   modePartial: boolean;
//   modeTruckLoad: boolean;
//   modeRail: boolean;
//   modeIntermodal: boolean;
//   modeAir: boolean;
//   modeExpedite: boolean;
//   modeOcean: boolean;

//   // Remit Bank Info
//   bankRoutingNumber: string;
//   bankAccountNumber: string;
//   bankAccountName: string;
//   bankName: string;
//   bankAddress: string;
//   bankPhone: string;
//   bankFax: string;
//   bankAccountType: string;

//   // Agreement
//   signatureDate: string;
//   signaturePerson: string;
//   signaturePersonTitle: string;
//   signaturePersonUsername: string;
//   signaturePersonPhoneNumber: string;
//   agreementIsActive: boolean;

//   // Netsuite
//   netsuiteSubsidiaryName: string;
// }

// // Props Interfaces
// interface EditCarrierDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   carrierId?: string;
//   carrierData?: CarrierFormData | null;
// }

// interface CarrierDetailsTabProps {
//   formData: CarrierFormData;
//   onInputChange: (
//     field: keyof CarrierFormData,
//     value: string | boolean
//   ) => void;
//   serviceTypeOptions: string[];
//   authorityTypeOptions: string[];
//   partnerOptions: string[];
//   paymentNetTermOptions: string[];
//   payMethodOptions: string[];
//   bankAccountTypeOptions: string[];
//   countryOptions: string[];
// }

// interface InsuranceSectionProps {
//   title: string;
//   icon: React.ReactNode;
//   expanded: boolean;
//   onToggle: () => void;
//   formData: CarrierFormData;
//   onInputChange: (
//     field: keyof CarrierFormData,
//     value: string | boolean
//   ) => void;
//   prefix: InsurancePrefix;
// }

// type InsurancePrefix =
//   | "primaryInsurance"
//   | "cargoInsurance"
//   | "generalInsurance";

// interface AddressFormSectionProps {
//   formData: CarrierFormData;
//   onInputChange: (
//     field: keyof CarrierFormData,
//     value: string | boolean
//   ) => void;
//   prefix: AddressPrefix;
//   countryOptions: string[];
// }

// type AddressPrefix = "factoryPayable" | "remit";

// interface ModeToggleProps {
//   label: string;
//   checked: boolean;
//   onChange: (checked: boolean) => void;
// }

// interface Tab {
//   id: CarrierTab;
//   label: string;
//   icon: React.ReactNode;
// }

// // Expanded sections state interface
// interface ExpandedSections {
//   type: boolean;
//   carrierDetails: boolean;
//   status: boolean;
//   contact: boolean;
//   carrierSettlement: boolean;
//   primaryLiability: boolean;
//   cargoInsurance: boolean;
//   generalLiability: boolean;
//   factoryPayable: boolean;
//   remitDetails: boolean;
//   dispatchDetails: boolean;
//   modes: boolean;
//   remitBankInfo: boolean;
//   agreement: boolean;
//   netsuite: boolean;
// }

// export default function EditCarrierDialog({
//   isOpen,
//   onClose,
//   carrierId,
//   carrierData,
// }: EditCarrierDialogProps) {
//   const [activeTab, setActiveTab] = useState<CarrierTab>("details");
//   const [formData, setFormData] = useState<CarrierFormData>({
//     serviceType: "",
//     authorityType: "",
//     loadStopTenancyName: "",
//     carrierName: "",
//     contactPerson: "",
//     mcNumber: "",
//     dotNumber: "",
//     fedTaxId: "",
//     scacCode: "",
//     customCarrierId: "",
//     mcpid: "",
//     rmisid: "",
//     highwayId: "",
//     partner: "",
//     registration: "",
//     dbaName: "",
//     ltlConnectAccountId: "",
//     project44AccountNumber: "",
//     status: "Active",
//     track1099: true,
//     noaReq: false,
//     enableTriumphPaySync: false,
//     quickPay: false,
//     address: "",
//     addressLine2: "",
//     city: "",
//     state: "",
//     zipCode: "",
//     phone: "",
//     fax: "",
//     email: "",
//     website: "",
//     contactNotes: "",
//     paymentNetTerm: "NET30",
//     carrierPayPerMile: "",
//     carrierPayEmptyMile: "",
//     detentionRate: "",
//     detentionPercentage: "",
//     layoverRate: "",
//     layoverPercentage: "",
//     otherFlat: "",
//     otherPercentage: "",
//     hourlyRate: "",
//     overTimeRate: "",
//     perStopPay: "",
//     afterStop: "",
//     invoice: "",
//     fuelSurcharge: "",
//     salesTax: "",
//     payMethod: "ACH",
//     primaryInsuranceCompany: "",
//     primaryInsurancePhone: "",
//     primaryInsuranceAgent: "",
//     primaryInsuranceAgentPhone: "",
//     primaryInsuranceEmail: "",
//     primaryInsurancePolicy: "",
//     primaryInsuranceExpiration: "",
//     primaryInsuranceLimit: "",
//     primaryInsuranceCity: "",
//     primaryInsuranceState: "",
//     primaryInsuranceZipCode: "",
//     primaryInsuranceFax: "",
//     primaryInsuranceDeductible: "",
//     primaryInsuranceNotes: "",
//     cargoInsuranceCompany: "",
//     cargoInsurancePhone: "",
//     cargoInsuranceAgent: "",
//     cargoInsuranceAgentPhone: "",
//     cargoInsuranceEmail: "",
//     cargoInsurancePolicy: "",
//     cargoInsuranceExpiration: "",
//     cargoInsuranceLimit: "",
//     cargoInsuranceCity: "",
//     cargoInsuranceState: "",
//     cargoInsuranceZipCode: "",
//     cargoInsuranceFax: "",
//     cargoInsuranceDeductible: "",
//     cargoInsuranceNotes: "",
//     generalInsuranceCompany: "",
//     generalInsurancePhone: "",
//     generalInsuranceAgent: "",
//     generalInsuranceAgentPhone: "",
//     generalInsuranceEmail: "",
//     generalInsurancePolicy: "",
//     generalInsuranceExpiration: "",
//     generalInsuranceLimit: "",
//     generalInsuranceCity: "",
//     generalInsuranceState: "",
//     generalInsuranceZipCode: "",
//     generalInsuranceFax: "",
//     generalInsuranceDeductible: "",
//     generalInsuranceNotes: "",
//     factoryPayableSameAsCarrier: true,
//     factoryPayableName: "",
//     factoryPayableAddress: "",
//     factoryPayableCity: "",
//     factoryPayableState: "",
//     factoryPayableCountry: "USA",
//     factoryPayableZipCode: "",
//     factoryPayablePhone: "",
//     factoryPayableFax: "",
//     factoryPayableEmail: "",
//     factoryPayableWebsite: "",
//     factoryPayableContactPerson: "",
//     remitSameAsCarrier: true,
//     remitName: "",
//     remitAddress: "",
//     remitCity: "",
//     remitState: "",
//     remitCountry: "USA",
//     remitZipCode: "",
//     remitPhone: "",
//     remitFax: "",
//     remitEmail: "",
//     remitWebsite: "",
//     remitContactPerson: "",
//     dispatchContactName: "",
//     dispatchEmail: "",
//     dispatchPhone1: "",
//     dispatchPhone2: "",
//     dispatchPhone3: "",
//     modeLTL: true,
//     modePartial: false,
//     modeTruckLoad: true,
//     modeRail: false,
//     modeIntermodal: false,
//     modeAir: false,
//     modeExpedite: false,
//     modeOcean: false,
//     bankRoutingNumber: "",
//     bankAccountNumber: "",
//     bankAccountName: "",
//     bankName: "",
//     bankAddress: "",
//     bankPhone: "",
//     bankFax: "",
//     bankAccountType: "Checking",
//     signatureDate: "",
//     signaturePerson: "",
//     signaturePersonTitle: "",
//     signaturePersonUsername: "",
//     signaturePersonPhoneNumber: "",
//     agreementIsActive: true,
//     netsuiteSubsidiaryName: "",
//   });

//   const tabs: Tab[] = [
//     {
//       id: "details",
//       label: "Carrier Details",
//       icon: <Building className="w-4 h-4" />,
//     },
//     {
//       id: "documents",
//       label: "Documents",
//       icon: <FileText className="w-4 h-4" />,
//     },
//     {
//       id: "external",
//       label: "External Carrier Representative",
//       icon: <User className="w-4 h-4" />,
//     },
//     { id: "notes", label: "Notes", icon: <StickyNote className="w-4 h-4" /> },
//     {
//       id: "ratecard",
//       label: "Rate Card Lane Level",
//       icon: <FileSpreadsheet className="w-4 h-4" />,
//     },
//     {
//       id: "accessorial",
//       label: "Accessorial",
//       icon: <Package className="w-4 h-4" />,
//     },
//   ];

//   const serviceTypeOptions = [
//     "Truckload",
//     "LTL",
//     "Intermodal",
//     "Flatbed",
//     "Reefer",
//     "Dry Van",
//     "Specialized",
//   ];
//   const authorityTypeOptions = [
//     "Common Carrier",
//     "Contract Carrier",
//     "Broker",
//     "Freight Forwarder",
//   ];
//   const partnerOptions = [
//     "RMIS",
//     "Transcore",
//     "McLeod",
//     "TMW",
//     "AscendTMS",
//     "Other",
//   ];
//   const paymentNetTermOptions = [
//     "NET15",
//     "NET30",
//     "NET45",
//     "NET60",
//     "Due on Receipt",
//   ];
//   const payMethodOptions = [
//     "ACH",
//     "Check",
//     "Wire Transfer",
//     "Credit Card",
//     "QuickPay",
//   ];
//   const bankAccountTypeOptions = ["Checking", "Savings", "Money Market"];
//   const countryOptions = ["USA", "Canada", "Mexico"];

//   const handleInputChange = (
//     field: keyof CarrierFormData,
//     value: string | boolean
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     console.log("Form submitted:", formData);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200">
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900">
//               Edit carrier #{carrierId || "148510"}
//             </h2>
//             <p className="text-gray-600 mt-1">
//               Update carrier information and settings
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
//               <Printer className="w-5 h-5" />
//             </button>
//             <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
//               <Copy className="w-5 h-5" />
//             </button>
//             <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
//               <Eye className="w-5 h-5" />
//             </button>
//             <button
//               onClick={onClose}
//               className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* Tabs Navigation */}
//         <div className="border-b border-gray-200">
//           <div className="flex overflow-x-auto px-6">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
//                   activeTab === tab.id
//                     ? "border-[#F96176] text-[#F96176]"
//                     : "border-transparent text-gray-600 hover:text-gray-900"
//                 }`}
//               >
//                 {tab.icon}
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Content Area */}
//         <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
//           <form onSubmit={handleSubmit}>
//             {activeTab === "details" && (
//               <CarrierDetailsTab
//                 formData={formData}
//                 onInputChange={handleInputChange}
//                 serviceTypeOptions={serviceTypeOptions}
//                 authorityTypeOptions={authorityTypeOptions}
//                 partnerOptions={partnerOptions}
//                 paymentNetTermOptions={paymentNetTermOptions}
//                 payMethodOptions={payMethodOptions}
//                 bankAccountTypeOptions={bankAccountTypeOptions}
//                 countryOptions={countryOptions}
//               />
//             )}
//             {activeTab === "documents" && <DocumentsTab />}
//             {activeTab === "external" && <ExternalRepresentativeTab />}
//             {activeTab === "notes" && <NotesTab />}
//             {activeTab === "ratecard" && <RateCardTab />}
//             {activeTab === "accessorial" && <AccessorialTab />}
//           </form>
//         </div>

//         {/* Footer */}
//         <div className="border-t border-gray-200 p-6 bg-gray-50">
//           <div className="flex justify-end gap-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               onClick={handleSubmit}
//               className="px-5 py-2.5 bg-[#F96176] text-white rounded-md hover:bg-[#F96176]/90 text-sm font-medium flex items-center gap-2"
//             >
//               <Save className="w-4 h-4" />
//               Save Changes
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Updated CarrierDetailsTab component with all sections
// function CarrierDetailsTab({
//   formData,
//   onInputChange,
//   serviceTypeOptions,
//   authorityTypeOptions,
//   partnerOptions,
//   paymentNetTermOptions,
//   payMethodOptions,
//   bankAccountTypeOptions,
//   countryOptions,
// }: CarrierDetailsTabProps) {
//   const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
//     type: true,
//     carrierDetails: true,
//     status: true,
//     contact: true,
//     carrierSettlement: true,
//     primaryLiability: true,
//     cargoInsurance: true,
//     generalLiability: true,
//     factoryPayable: true,
//     remitDetails: true,
//     dispatchDetails: true,
//     modes: true,
//     remitBankInfo: true,
//     agreement: true,
//     netsuite: true,
//   });

//   const toggleSection = (section: keyof ExpandedSections) => {
//     setExpandedSections((prev) => ({
//       ...prev,
//       [section]: !prev[section],
//     }));
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Type Section */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("type")}
//         >
//           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//             <Network className="w-4 h-4" />
//             Type
//           </h3>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform ${
//               expandedSections.type ? "rotate-180" : ""
//             }`}
//           />
//         </div>

//         {expandedSections.type && (
//           <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Service Type *
//               </label>
//               <div className="relative">
//                 <select
//                   value={formData.serviceType}
//                   onChange={(e) => onInputChange("serviceType", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
//                 >
//                   <option value="">Select Service Type</option>
//                   {serviceTypeOptions.map((option: string) => (
//                     <option key={option} value={option}>
//                       {option}
//                     </option>
//                   ))}
//                 </select>
//                 <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Authority Type *
//               </label>
//               <div className="relative">
//                 <select
//                   value={formData.authorityType}
//                   onChange={(e) =>
//                     onInputChange("authorityType", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
//                 >
//                   <option value="">Select Authority Type</option>
//                   {authorityTypeOptions.map((option: string) => (
//                     <option key={option} value={option}>
//                       {option}
//                     </option>
//                   ))}
//                 </select>
//                 <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 LoadStop Tenancy name
//               </label>
//               <input
//                 type="text"
//                 value={formData.loadStopTenancyName}
//                 onChange={(e) =>
//                   onInputChange("loadStopTenancyName", e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Enter tenancy name"
//               />
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Carrier Details Section */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("carrierDetails")}
//         >
//           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//             <Building className="w-4 h-4" />
//             Carrier Details
//           </h3>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform ${
//               expandedSections.carrierDetails ? "rotate-180" : ""
//             }`}
//           />
//         </div>

//         {expandedSections.carrierDetails && (
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Name *
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.carrierName}
//                   onChange={(e) => onInputChange("carrierName", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter carrier name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Contact person
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.contactPerson}
//                   onChange={(e) =>
//                     onInputChange("contactPerson", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter contact person"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   MC
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.mcNumber}
//                   onChange={(e) => onInputChange("mcNumber", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter MC number"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   DOT
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.dotNumber}
//                   onChange={(e) => onInputChange("dotNumber", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter DOT number"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Fed tax id
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.fedTaxId}
//                   onChange={(e) => onInputChange("fedTaxId", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter federal tax ID"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   SCAC Code
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.scacCode}
//                   onChange={(e) => onInputChange("scacCode", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter SCAC code"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Custom Carrier Id
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.customCarrierId}
//                   onChange={(e) =>
//                     onInputChange("customCarrierId", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter custom ID"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   MCPID
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.mcpid}
//                   onChange={(e) => onInputChange("mcpid", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter MCPID"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   RMISID
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.rmisid}
//                   onChange={(e) => onInputChange("rmisid", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter RMISID"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   HighwayId
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.highwayId}
//                   onChange={(e) => onInputChange("highwayId", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter Highway ID"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Partner
//                 </label>
//                 <div className="relative">
//                   <select
//                     value={formData.partner}
//                     onChange={(e) => onInputChange("partner", e.target.value)}
//                     className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
//                   >
//                     <option value="">Select Partner</option>
//                     {partnerOptions.map((option: string) => (
//                       <option key={option} value={option}>
//                         {option}
//                       </option>
//                     ))}
//                   </select>
//                   <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Registration
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.registration}
//                   onChange={(e) =>
//                     onInputChange("registration", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter registration"
//                 />
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   DBA Name
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.dbaName}
//                   onChange={(e) => onInputChange("dbaName", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter DBA name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   LTL Connect Account Id
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.ltlConnectAccountId}
//                   onChange={(e) =>
//                     onInputChange("ltlConnectAccountId", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter LTL Connect ID"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Project 44 account number
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.project44AccountNumber}
//                   onChange={(e) =>
//                     onInputChange("project44AccountNumber", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter Project 44 account"
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Status Section */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("status")}
//         >
//           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//             <Check className="w-4 h-4" />
//             Status
//           </h3>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform ${
//               expandedSections.status ? "rotate-180" : ""
//             }`}
//           />
//         </div>

//         {expandedSections.status && (
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Status
//                 </label>
//                 <div className="relative">
//                   <select
//                     value={formData.status}
//                     onChange={(e) => onInputChange("status", e.target.value)}
//                     className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
//                   >
//                     <option value="Active">Active</option>
//                     <option value="Inactive">Inactive</option>
//                     <option value="Pending">Pending</option>
//                     <option value="Frozen">Frozen</option>
//                   </select>
//                   <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//                 </div>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Track 1099
//                   </label>
//                   <p className="text-xs text-gray-500">Enable 1099 tracking</p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() =>
//                     onInputChange("track1099", !formData.track1099)
//                   }
//                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                     formData.track1099 ? "bg-green-500" : "bg-gray-300"
//                   }`}
//                 >
//                   <span
//                     className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                       formData.track1099 ? "translate-x-6" : "translate-x-1"
//                     }`}
//                   />
//                 </button>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     NOA Req?
//                   </label>
//                   <p className="text-xs text-gray-500">
//                     Notice of Assignment required
//                   </p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => onInputChange("noaReq", !formData.noaReq)}
//                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                     formData.noaReq ? "bg-blue-500" : "bg-gray-300"
//                   }`}
//                 >
//                   <span
//                     className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                       formData.noaReq ? "translate-x-6" : "translate-x-1"
//                     }`}
//                   />
//                 </button>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Enable TriumphPay Sync
//                   </label>
//                   <p className="text-xs text-gray-500">Sync with TriumphPay</p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() =>
//                     onInputChange(
//                       "enableTriumphPaySync",
//                       !formData.enableTriumphPaySync
//                     )
//                   }
//                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                     formData.enableTriumphPaySync
//                       ? "bg-purple-500"
//                       : "bg-gray-300"
//                   }`}
//                 >
//                   <span
//                     className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                       formData.enableTriumphPaySync
//                         ? "translate-x-6"
//                         : "translate-x-1"
//                     }`}
//                   />
//                 </button>
//               </div>
//             </div>

//             <div className="mt-6">
//               <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Quick Pay
//                   </label>
//                   <p className="text-xs text-gray-500">
//                     Enable quick pay for this carrier
//                   </p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => onInputChange("quickPay", !formData.quickPay)}
//                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                     formData.quickPay ? "bg-[#F96176]" : "bg-gray-300"
//                   }`}
//                 >
//                   <span
//                     className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                       formData.quickPay ? "translate-x-6" : "translate-x-1"
//                     }`}
//                   />
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Contact Section */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("contact")}
//         >
//           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//             <Phone className="w-4 h-4" />
//             Contact
//           </h3>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform ${
//               expandedSections.contact ? "rotate-180" : ""
//             }`}
//           />
//         </div>

//         {expandedSections.contact && (
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Address
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.address}
//                   onChange={(e) => onInputChange("address", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter address"
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Add line 2 (optional)
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.addressLine2}
//                   onChange={(e) =>
//                     onInputChange("addressLine2", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Additional address line"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   City
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.city}
//                   onChange={(e) => onInputChange("city", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter city"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   State
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.state}
//                   onChange={(e) => onInputChange("state", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter state"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Zip Code
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.zipCode}
//                   onChange={(e) => onInputChange("zipCode", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter zip code"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Phone
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.phone}
//                   onChange={(e) => onInputChange("phone", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter phone number"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Fax
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.fax}
//                   onChange={(e) => onInputChange("fax", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter fax number"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Email
//                 </label>
//                 <input
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => onInputChange("email", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter email"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Website
//                 </label>
//                 <input
//                   type="url"
//                   value={formData.website}
//                   onChange={(e) => onInputChange("website", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter website URL"
//                 />
//               </div>

//               <div className="md:col-span-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Notes
//                 </label>
//                 <textarea
//                   value={formData.contactNotes}
//                   onChange={(e) =>
//                     onInputChange("contactNotes", e.target.value)
//                   }
//                   rows={3}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter contact notes"
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Carrier Settlement Section */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("carrierSettlement")}
//         >
//           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//             <DollarSign className="w-4 h-4" />
//             Carrier Settlement
//           </h3>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform ${
//               expandedSections.carrierSettlement ? "rotate-180" : ""
//             }`}
//           />
//         </div>

//         {expandedSections.carrierSettlement && (
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Payment Net Term
//                 </label>
//                 <select
//                   value={formData.paymentNetTerm}
//                   onChange={(e) =>
//                     onInputChange("paymentNetTerm", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   {paymentNetTermOptions.map((option) => (
//                     <option key={option} value={option}>
//                       {option}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Pay per Mile
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.carrierPayPerMile}
//                   onChange={(e) =>
//                     onInputChange("carrierPayPerMile", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Pay Empty Mile
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.carrierPayEmptyMile}
//                   onChange={(e) =>
//                     onInputChange("carrierPayEmptyMile", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Detention Rate
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.detentionRate}
//                   onChange={(e) =>
//                     onInputChange("detentionRate", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Detention Percentage
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.detentionPercentage}
//                   onChange={(e) =>
//                     onInputChange("detentionPercentage", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0%"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Layover Rate
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.layoverRate}
//                   onChange={(e) => onInputChange("layoverRate", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Layover Percentage
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.layoverPercentage}
//                   onChange={(e) =>
//                     onInputChange("layoverPercentage", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0%"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Other Flat
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.otherFlat}
//                   onChange={(e) => onInputChange("otherFlat", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Other Percentage
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.otherPercentage}
//                   onChange={(e) =>
//                     onInputChange("otherPercentage", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0%"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Hourly Rate
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.hourlyRate}
//                   onChange={(e) => onInputChange("hourlyRate", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Over Time Rate
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.overTimeRate}
//                   onChange={(e) =>
//                     onInputChange("overTimeRate", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Per Stop Pay
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.perStopPay}
//                   onChange={(e) => onInputChange("perStopPay", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   After Stop
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.afterStop}
//                   onChange={(e) => onInputChange("afterStop", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Invoice
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.invoice}
//                   onChange={(e) => onInputChange("invoice", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Invoice details"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Fuel Surcharge
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.fuelSurcharge}
//                   onChange={(e) =>
//                     onInputChange("fuelSurcharge", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Sales Tax
//                 </label>
//                 <input
//                   type="number"
//                   value={formData.salesTax}
//                   onChange={(e) => onInputChange("salesTax", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="0.00"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Pay Method
//                 </label>
//                 <select
//                   value={formData.payMethod}
//                   onChange={(e) => onInputChange("payMethod", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   {payMethodOptions.map((option) => (
//                     <option key={option} value={option}>
//                       {option}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Insurance Sections (Primary, Cargo, General) */}
//       <InsuranceSection
//         title="Primary Liability"
//         icon={<Shield className="w-4 h-4" />}
//         expanded={expandedSections.primaryLiability}
//         onToggle={() => toggleSection("primaryLiability")}
//         formData={formData}
//         onInputChange={onInputChange}
//         prefix="primaryInsurance"
//       />

//       <InsuranceSection
//         title="Cargo Insurance"
//         icon={<Package className="w-4 h-4" />}
//         expanded={expandedSections.cargoInsurance}
//         onToggle={() => toggleSection("cargoInsurance")}
//         formData={formData}
//         onInputChange={onInputChange}
//         prefix="cargoInsurance"
//       />

//       <InsuranceSection
//         title="General Liability"
//         icon={<Shield className="w-4 h-4" />}
//         expanded={expandedSections.generalLiability}
//         onToggle={() => toggleSection("generalLiability")}
//         formData={formData}
//         onInputChange={onInputChange}
//         prefix="generalInsurance"
//       />

//       {/* Factory Payable To */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("factoryPayable")}
//         >
//           <div className="flex items-center gap-2">
//             <Building className="w-4 h-4" />
//             <h3 className="font-semibold text-gray-900">Factory Payable To</h3>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 id="factoryPayableSame"
//                 checked={formData.factoryPayableSameAsCarrier}
//                 onChange={(e) =>
//                   onInputChange("factoryPayableSameAsCarrier", e.target.checked)
//                 }
//                 className="w-4 h-4 text-[#F96176] rounded focus:ring-[#F96176]"
//               />
//               <label
//                 htmlFor="factoryPayableSame"
//                 className="text-sm text-gray-700"
//               >
//                 Same as carrier address
//               </label>
//             </div>
//             <ChevronDown
//               className={`w-5 h-5 text-gray-500 transition-transform ${
//                 expandedSections.factoryPayable ? "rotate-180" : ""
//               }`}
//             />
//           </div>
//         </div>

//         {expandedSections.factoryPayable &&
//           !formData.factoryPayableSameAsCarrier && (
//             <div className="p-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 <AddressFormSection
//                   formData={formData}
//                   onInputChange={onInputChange}
//                   prefix="factoryPayable"
//                   countryOptions={countryOptions}
//                 />
//               </div>
//             </div>
//           )}
//       </div>

//       {/* Remit Details */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("remitDetails")}
//         >
//           <div className="flex items-center gap-2">
//             <CreditCard className="w-4 h-4" />
//             <h3 className="font-semibold text-gray-900">Remit Details</h3>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 id="remitSame"
//                 checked={formData.remitSameAsCarrier}
//                 onChange={(e) =>
//                   onInputChange("remitSameAsCarrier", e.target.checked)
//                 }
//                 className="w-4 h-4 text-[#F96176] rounded focus:ring-[#F96176]"
//               />
//               <label htmlFor="remitSame" className="text-sm text-gray-700">
//                 Same as carrier address
//               </label>
//             </div>
//             <ChevronDown
//               className={`w-5 h-5 text-gray-500 transition-transform ${
//                 expandedSections.remitDetails ? "rotate-180" : ""
//               }`}
//             />
//           </div>
//         </div>

//         {expandedSections.remitDetails && !formData.remitSameAsCarrier && (
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               <AddressFormSection
//                 formData={formData}
//                 onInputChange={onInputChange}
//                 prefix="remit"
//                 countryOptions={countryOptions}
//               />
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Dispatch Details */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("dispatchDetails")}
//         >
//           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//             <Truck className="w-4 h-4" />
//             Dispatch Details
//           </h3>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform ${
//               expandedSections.dispatchDetails ? "rotate-180" : ""
//             }`}
//           />
//         </div>

//         {expandedSections.dispatchDetails && (
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Dispatch Contact Name
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.dispatchContactName}
//                   onChange={(e) =>
//                     onInputChange("dispatchContactName", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Contact name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Dispatch Email
//                 </label>
//                 <input
//                   type="email"
//                   value={formData.dispatchEmail}
//                   onChange={(e) =>
//                     onInputChange("dispatchEmail", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="email@example.com"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Dispatch Phone 1
//                 </label>
//                 <input
//                   type="tel"
//                   value={formData.dispatchPhone1}
//                   onChange={(e) =>
//                     onInputChange("dispatchPhone1", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="(555) 123-4567"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Dispatch Phone 2
//                 </label>
//                 <input
//                   type="tel"
//                   value={formData.dispatchPhone2}
//                   onChange={(e) =>
//                     onInputChange("dispatchPhone2", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="(555) 123-4568"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Dispatch Phone 3
//                 </label>
//                 <input
//                   type="tel"
//                   value={formData.dispatchPhone3}
//                   onChange={(e) =>
//                     onInputChange("dispatchPhone3", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="(555) 123-4569"
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modes Section */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("modes")}
//         >
//           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//             <Truck className="w-4 h-4" />
//             Modes
//           </h3>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform ${
//               expandedSections.modes ? "rotate-180" : ""
//             }`}
//           />
//         </div>

//         {expandedSections.modes && (
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//               <ModeToggle
//                 label="Less than Truck Load"
//                 checked={formData.modeLTL}
//                 onChange={(checked) => onInputChange("modeLTL", checked)}
//               />
//               <ModeToggle
//                 label="Partial"
//                 checked={formData.modePartial}
//                 onChange={(checked) => onInputChange("modePartial", checked)}
//               />
//               <ModeToggle
//                 label="Truck Load"
//                 checked={formData.modeTruckLoad}
//                 onChange={(checked) => onInputChange("modeTruckLoad", checked)}
//               />
//               <ModeToggle
//                 label="Rail"
//                 checked={formData.modeRail}
//                 onChange={(checked) => onInputChange("modeRail", checked)}
//               />
//               <ModeToggle
//                 label="Intermodal"
//                 checked={formData.modeIntermodal}
//                 onChange={(checked) => onInputChange("modeIntermodal", checked)}
//               />
//               <ModeToggle
//                 label="Air"
//                 checked={formData.modeAir}
//                 onChange={(checked) => onInputChange("modeAir", checked)}
//               />
//               <ModeToggle
//                 label="Expedite"
//                 checked={formData.modeExpedite}
//                 onChange={(checked) => onInputChange("modeExpedite", checked)}
//               />
//               <ModeToggle
//                 label="Ocean"
//                 checked={formData.modeOcean}
//                 onChange={(checked) => onInputChange("modeOcean", checked)}
//               />
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Remit Bank Info */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("remitBankInfo")}
//         >
//           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//             <Banknote className="w-4 h-4" />
//             Remit Bank Info
//           </h3>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform ${
//               expandedSections.remitBankInfo ? "rotate-180" : ""
//             }`}
//           />
//         </div>

//         {expandedSections.remitBankInfo && (
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Bank Routing Number
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.bankRoutingNumber}
//                   onChange={(e) =>
//                     onInputChange("bankRoutingNumber", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="123456789"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Bank Account Number
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.bankAccountNumber}
//                   onChange={(e) =>
//                     onInputChange("bankAccountNumber", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Account number"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Bank Account Name
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.bankAccountName}
//                   onChange={(e) =>
//                     onInputChange("bankAccountName", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Account holder name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Bank Name
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.bankName}
//                   onChange={(e) => onInputChange("bankName", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Bank name"
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Bank Address
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.bankAddress}
//                   onChange={(e) => onInputChange("bankAddress", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Bank address"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Bank Phone
//                 </label>
//                 <input
//                   type="tel"
//                   value={formData.bankPhone}
//                   onChange={(e) => onInputChange("bankPhone", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="(555) 123-4567"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Bank Fax
//                 </label>
//                 <input
//                   type="tel"
//                   value={formData.bankFax}
//                   onChange={(e) => onInputChange("bankFax", e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="(555) 123-4568"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Carrier Bank Account Type
//                 </label>
//                 <select
//                   value={formData.bankAccountType}
//                   onChange={(e) =>
//                     onInputChange("bankAccountType", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   {bankAccountTypeOptions.map((option) => (
//                     <option key={option} value={option}>
//                       {option}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Agreement */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("agreement")}
//         >
//           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//             <FileSignature className="w-4 h-4" />
//             Agreement
//           </h3>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform ${
//               expandedSections.agreement ? "rotate-180" : ""
//             }`}
//           />
//         </div>

//         {expandedSections.agreement && (
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Signature Date
//                 </label>
//                 <input
//                   type="date"
//                   value={formData.signatureDate}
//                   onChange={(e) =>
//                     onInputChange("signatureDate", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Signature Person
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.signaturePerson}
//                   onChange={(e) =>
//                     onInputChange("signaturePerson", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Full name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Signature Person Title
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.signaturePersonTitle}
//                   onChange={(e) =>
//                     onInputChange("signaturePersonTitle", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Title/Position"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Signature Person Username
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.signaturePersonUsername}
//                   onChange={(e) =>
//                     onInputChange("signaturePersonUsername", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Username"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Signature Person Phone Number
//                 </label>
//                 <input
//                   type="tel"
//                   value={formData.signaturePersonPhoneNumber}
//                   onChange={(e) =>
//                     onInputChange("signaturePersonPhoneNumber", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="(555) 123-4567"
//                 />
//               </div>
//             </div>

//             <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Is Active
//                 </label>
//                 <p className="text-xs text-gray-500">Activate the agreement</p>
//               </div>
//               <button
//                 type="button"
//                 onClick={() =>
//                   onInputChange(
//                     "agreementIsActive",
//                     !formData.agreementIsActive
//                   )
//                 }
//                 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                   formData.agreementIsActive ? "bg-green-500" : "bg-gray-300"
//                 }`}
//               >
//                 <span
//                   className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                     formData.agreementIsActive
//                       ? "translate-x-6"
//                       : "translate-x-1"
//                   }`}
//                 />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Netsuite Section */}
//       <div className="border border-gray-200 rounded-lg">
//         <div
//           className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//           onClick={() => toggleSection("netsuite")}
//         >
//           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//             <Network className="w-4 h-4" />
//             Netsuite
//           </h3>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform ${
//               expandedSections.netsuite ? "rotate-180" : ""
//             }`}
//           />
//         </div>

//         {expandedSections.netsuite && (
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Netsuite Subsidiary Name
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.netsuiteSubsidiaryName}
//                   onChange={(e) =>
//                     onInputChange("netsuiteSubsidiaryName", e.target.value)
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter Netsuite subsidiary name"
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // Helper Components

// function InsuranceSection({
//   title,
//   icon,
//   expanded,
//   onToggle,
//   formData,
//   onInputChange,
//   prefix,
// }: InsuranceSectionProps) {
//   const getFieldName = (field: string): keyof CarrierFormData => {
//     return `${prefix}${
//       field.charAt(0).toUpperCase() + field.slice(1)
//     }` as keyof CarrierFormData;
//   };

//   return (
//     <div className="border border-gray-200 rounded-lg">
//       <div
//         className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
//         onClick={onToggle}
//       >
//         <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//           {icon}
//           {title}
//         </h3>
//         <ChevronDown
//           className={`w-5 h-5 text-gray-500 transition-transform ${
//             expanded ? "rotate-180" : ""
//           }`}
//         />
//       </div>

//       {expanded && (
//         <div className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Company
//               </label>
//               <input
//                 type="text"
//                 value={formData[getFieldName("Company")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("Company"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Insurance company"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Phone
//               </label>
//               <input
//                 type="tel"
//                 value={formData[getFieldName("Phone")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("Phone"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="(555) 123-4567"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Agent
//               </label>
//               <input
//                 type="text"
//                 value={formData[getFieldName("Agent")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("Agent"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Agent name"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Agent Phone
//               </label>
//               <input
//                 type="tel"
//                 value={formData[getFieldName("AgentPhone")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("AgentPhone"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="(555) 123-4567"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 value={formData[getFieldName("Email")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("Email"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="email@example.com"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Policy #
//               </label>
//               <input
//                 type="text"
//                 value={formData[getFieldName("Policy")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("Policy"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Policy number"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Expiration
//               </label>
//               <input
//                 type="date"
//                 value={formData[getFieldName("Expiration")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("Expiration"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Limit
//               </label>
//               <input
//                 type="text"
//                 value={formData[getFieldName("Limit")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("Limit"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Coverage limit"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 City
//               </label>
//               <input
//                 type="text"
//                 value={formData[getFieldName("City")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("City"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="City"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 State
//               </label>
//               <input
//                 type="text"
//                 value={formData[getFieldName("State")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("State"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="State"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Zip Code
//               </label>
//               <input
//                 type="text"
//                 value={formData[getFieldName("ZipCode")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("ZipCode"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Zip code"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Fax
//               </label>
//               <input
//                 type="tel"
//                 value={formData[getFieldName("Fax")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("Fax"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Fax number"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Deductible
//               </label>
//               <input
//                 type="text"
//                 value={formData[getFieldName("Deductible")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("Deductible"), e.target.value)
//                 }
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Deductible amount"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Notes
//               </label>
//               <textarea
//                 value={formData[getFieldName("Notes")] as string}
//                 onChange={(e) =>
//                   onInputChange(getFieldName("Notes"), e.target.value)
//                 }
//                 rows={3}
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Insurance notes"
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function AddressFormSection({
//   formData,
//   onInputChange,
//   prefix,
//   countryOptions,
// }: AddressFormSectionProps) {
//   const getFieldName = (field: string): keyof CarrierFormData => {
//     return `${prefix}${
//       field.charAt(0).toUpperCase() + field.slice(1)
//     }` as keyof CarrierFormData;
//   };

//   return (
//     <>
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Name
//         </label>
//         <input
//           type="text"
//           value={formData[getFieldName("Name")] as string}
//           onChange={(e) => onInputChange(getFieldName("Name"), e.target.value)}
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="Name"
//         />
//       </div>

//       <div className="md:col-span-2">
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Address
//         </label>
//         <input
//           type="text"
//           value={formData[getFieldName("Address")] as string}
//           onChange={(e) =>
//             onInputChange(getFieldName("Address"), e.target.value)
//           }
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="Address"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           City
//         </label>
//         <input
//           type="text"
//           value={formData[getFieldName("City")] as string}
//           onChange={(e) => onInputChange(getFieldName("City"), e.target.value)}
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="City"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           State
//         </label>
//         <input
//           type="text"
//           value={formData[getFieldName("State")] as string}
//           onChange={(e) => onInputChange(getFieldName("State"), e.target.value)}
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="State"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Country
//         </label>
//         <select
//           value={formData[getFieldName("Country")] as string}
//           onChange={(e) =>
//             onInputChange(getFieldName("Country"), e.target.value)
//           }
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//         >
//           {countryOptions.map((option) => (
//             <option key={option} value={option}>
//               {option}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Zip Code
//         </label>
//         <input
//           type="text"
//           value={formData[getFieldName("ZipCode")] as string}
//           onChange={(e) =>
//             onInputChange(getFieldName("ZipCode"), e.target.value)
//           }
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="Zip code"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Phone
//         </label>
//         <input
//           type="tel"
//           value={formData[getFieldName("Phone")] as string}
//           onChange={(e) => onInputChange(getFieldName("Phone"), e.target.value)}
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="Phone number"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Fax
//         </label>
//         <input
//           type="tel"
//           value={formData[getFieldName("Fax")] as string}
//           onChange={(e) => onInputChange(getFieldName("Fax"), e.target.value)}
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="Fax number"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Email
//         </label>
//         <input
//           type="email"
//           value={formData[getFieldName("Email")] as string}
//           onChange={(e) => onInputChange(getFieldName("Email"), e.target.value)}
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="Email address"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Website
//         </label>
//         <input
//           type="url"
//           value={formData[getFieldName("Website")] as string}
//           onChange={(e) =>
//             onInputChange(getFieldName("Website"), e.target.value)
//           }
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="Website URL"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Contact Person
//         </label>
//         <input
//           type="text"
//           value={formData[getFieldName("ContactPerson")] as string}
//           onChange={(e) =>
//             onInputChange(getFieldName("ContactPerson"), e.target.value)
//           }
//           className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="Contact person"
//         />
//       </div>
//     </>
//   );
// }

// function ModeToggle({ label, checked, onChange }: ModeToggleProps) {
//   return (
//     <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
//       <span className="text-sm font-medium text-gray-700">{label}</span>
//       <button
//         type="button"
//         onClick={() => onChange(!checked)}
//         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//           checked ? "bg-[#F96176]" : "bg-gray-300"
//         }`}
//       >
//         <span
//           className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//             checked ? "translate-x-6" : "translate-x-1"
//           }`}
//         />
//       </button>
//     </div>
//   );
// }

// // Placeholder components for other tabs
// function DocumentsTab() {
//   return <div className="p-6">Documents Content</div>;
// }

// function ExternalRepresentativeTab() {
//   return <div className="p-6">External Rep Content</div>;
// }

// function NotesTab() {
//   const [notes, setNotes] = useState("");
//   return (
//     <div className="p-6">
//       <textarea
//         value={notes}
//         onChange={(e) => setNotes(e.target.value)}
//         rows={10}
//         className="w-full border rounded-md p-3"
//         placeholder="Add notes..."
//       />
//     </div>
//   );
// }

// function RateCardTab() {
//   return <div className="p-6">Rate Card Content</div>;
// }

// function AccessorialTab() {
//   return <div className="p-6">Accessorial Content</div>;
// }
