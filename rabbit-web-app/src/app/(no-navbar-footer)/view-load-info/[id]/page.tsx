"use client";

import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  FileText,
  Clock,
  Calendar,
  Eye,
  Thermometer,
  Lock,
  ChevronDown,
  MessageSquare,
  Phone,
  MessageCircle,
  Plus,
  Mail,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { DocumentActionsDropdown } from "@/components/dropdown/DocumentActionDropdown";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { LoadData, Stop, LoadDocument } from "../../interface/loaddata";
import {
  PdfPrintWrapper,
  BolPdfTemplate,
  RateConfirmationPdfTemplate,
  LoadSheetPdfTemplate,
  DriverSheetPdfTemplate,
  ProofOfDeliveryPdfTemplate,
  InsuranceCertificatePdfTemplate,
} from "../../components/PdfTemplate";

// --- Interfaces for this component ---
interface CheckCallFormData {
  stop: string;
  location: string;
  city: string;
  state: string;
  temperature: string;
  source: string;
  driver: string;
  notes: string;
}

// --- Mock Data ---
const MOCK_LOAD_DATA: LoadData = {
  loadNumber: "203783",
  status: "Completed",
  isInvoiced: true,
  isLocked: true,
  customer: "Welcome Enterprises Inc.",
  primaryFees: "$3,400.00",
  feeType: "Flat Rate",
  tenderedMiles: "1,342 Miles",
  fuelSurcharge: "$0.00",
  targetRate: "$0.00",
  vanType: "Reefer",
  length: "53 ft",
  weight: "28,975.00",
  isHazmat: false,
  isTarpRequired: false,
  bookingAuthority: "Welcome Enterprises Brokerage Inc.",
  salesAgent: "System Admin",
  bookingTerminal: "Main Office - AR",
  commodity: "Pickets",
  declaredValue: "$10,000.00",
  agency: "Global Logistics",
  brokerageAgent: "Alex Morgan",
  revenue: "$3,450.00",
  profit: "$450.00",
  ratePerMile: "$2.57",
  flatRate: "$3,450.00",
  loadedMiles: "1,342.000",
  detentionTracked: "0.000",
  quantity: "2343 Pallets",
  loadType: "Full Truck Load",
  carrier: "S.S. Transport Inc.",
  truck: "TRK-9901",
  trailer: "TRL-5520",
  driver: "Steve Expiry",
  dispatcher: "Alex Morgan",
  bolNumber: "1495378",
  poNumbers: ["26420580", "26437650"],
  pickupDate: "11/15/2025",
  deliveryDate: "11/17/2025",
  temperature: "0.00°F",
  equipmentType: "Reefer - Continuous",
  pickupInstructions: "Check in at Guard Shack. PU/SO #: 143547, 143597",
  deliveryInstructions: "Live Unload. Driver must assist with tailgating.",
  customerContact: {
    name: "Alex Morgan",
    phone: "559-824-2380",
    email: "brokerage@westernert.com",
  },
  carrierContact: {
    name: "Satbir Rai",
    phone: "661-487-3531",
    email: "Ssbtransportinc661@yahoo.com",
  },
  driverContact: {
    name: "Steve Expiry",
    phone: "661-869-7165",
    email: "",
  },
};

const MOCK_STOPS: Stop[] = [
  {
    type: "PICKUP",
    number: 1,
    date: "01/17/2025",
    timeWindow: "09:00 AM - 09:00 PM",
    locationName: "FREEZE N STORE",
    address: "311 West Sunset Avenue",
    cityStateZip: "Springdale, AR 72764",
    contact: "Warehouse Manager",
    qty: "2343 Pallets",
    weight: "28,975 lbs",
    instructions: "Check in at Guard Shack. PU/SO #: 143547, 143597",
    puNumber: "1495378",
    miles: "0 Empty",
    status: "Completed",
    route: "Route A",
    temp: "0.00°F",
    appointmentRef: "PU-143547",
    bolNumber: "1495378",
    poNumbers: ["26420580", "26437650"],
  },
  {
    type: "DELIVERY",
    number: 2,
    date: "01/17/2025",
    timeWindow: "09:00 AM - 09:00 AM",
    locationName: "Sysco Food Service - Las Vegas",
    address: "6201 East Centennial Parkway",
    cityStateZip: "Las Vegas, NV 89115",
    contact: "John Doe",
    qty: "2343 Pallets",
    weight: "28,975 lbs",
    instructions: "Live Unload. Driver must assist with tailgating.",
    miles: "1,342 Loaded",
    status: "Completed",
    route: "Route A",
    temp: "0.00°F",
    appointmentRef: "CHK5551729519NOV25",
    bolNumber: "1495378",
    poNumbers: ["26420580", "26437650"],
  },
];

const MOCK_DOCUMENTS: LoadDocument[] = [
  {
    id: "1",
    name: "Rate Confirmation #203783",
    type: "Rate Confirmation",
    invoiceRequirement: true,
    expiryDate: "12/31/2025",
    daysRemaining: 345,
  },
  {
    id: "2",
    name: "Signed BOL",
    type: "Bill of Lading",
    invoiceRequirement: true,
    expiryDate: "-",
    daysRemaining: null,
  },
  {
    id: "3",
    name: "Lumper Receipt",
    type: "Receipt",
    invoiceRequirement: false,
    expiryDate: "-",
    daysRemaining: null,
  },
  {
    id: "4",
    name: "POD - Signed",
    type: "Proof of Delivery",
    invoiceRequirement: true,
    expiryDate: "-",
    daysRemaining: null,
  },
  {
    id: "5",
    name: "Carrier Insurance Cert",
    type: "Insurance",
    invoiceRequirement: true,
    expiryDate: "05/20/2025",
    daysRemaining: 120,
  },
];

const TABS = [
  { id: "load-info", label: "Load Information" },
  { id: "load-docs", label: "Load Docs" },
];

// --- Helper Components ---
const MetricItem = ({
  label,
  value,
  isCurrency = false,
}: {
  label: string;
  value: string;
  isCurrency?: boolean;
}) => (
  <div className="flex flex-col items-start px-4 first:pl-0 border-r border-gray-200 last:border-0 min-w-max">
    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">
      {label}
    </span>
    <span
      className={`text-sm font-bold ${
        isCurrency ? "text-[#22c55e]" : "text-gray-900"
      }`}
    >
      {value}
    </span>
  </div>
);

const FormLabel = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const InputField = ({
  value,
  disabled = false,
  type = "text",
  className = "",
  placeholder = "",
  onChange,
}: {
  value: string;
  disabled?: boolean;
  type?: string;
  className?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <input
    type={type}
    value={value}
    disabled={disabled}
    readOnly={disabled && !onChange}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow
      ${
        disabled
          ? "bg-gray-50 text-gray-600 border-gray-200"
          : "bg-white text-gray-900 border-gray-300"
      } ${className}`}
  />
);

const SelectField = ({
  value,
  options,
  disabled = false,
  onChange,
  placeholder = "Select",
}: {
  value: string;
  options: string[];
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
}) => (
  <div className="relative">
    <select
      value={value}
      disabled={disabled}
      onChange={onChange}
      className={`w-full px-3 py-2 text-sm border rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500
        ${
          disabled
            ? "bg-gray-50 text-gray-600 border-gray-200"
            : "bg-white text-gray-900 border-gray-300"
        }`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
      <ChevronDown className="w-4 h-4" />
    </div>
  </div>
);

const ToggleSwitch = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-2">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ease-in-out ${
        checked ? "bg-[#22c55e]" : "bg-gray-300"
      }`}
    >
      <div
        className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ease-in-out ${
          checked ? "translate-x-5" : ""
        }`}
      ></div>
    </button>
  </div>
);

// --- PDF Generation Function ---
const generatePdf = async (
  element: HTMLElement,
  filename: string
): Promise<void> => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    let heightLeft = imgHeight;
    let page = 0;

    // Add first page
    pdf.addImage(
      canvas,
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      "FAST"
    );
    heightLeft -= pdfHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = -pdfHeight * (page + 1);
      pdf.addPage();
      pdf.addImage(
        canvas,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );
      heightLeft -= pdfHeight;
      page++;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
};

// --- Document View Modal Component ---
interface DocumentViewModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  type:
    | "rate-confirmation"
    | "bol"
    | "load-sheet"
    | "driver-sheet"
    | "pod"
    | "insurance";
  loadData: LoadData;
}

const DocumentViewModal = ({
  title,
  isOpen,
  onClose,
  type,
  loadData,
}: DocumentViewModalProps) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrintPdf = async () => {
    if (!pdfRef.current || isGenerating) return;

    setIsGenerating(true);
    try {
      let filename = "";

      switch (type) {
        case "rate-confirmation":
          filename = `Rate_Confirmation_${loadData.loadNumber}.pdf`;
          break;
        case "bol":
          filename = `Bill_of_Lading_${loadData.loadNumber}.pdf`;
          break;
        case "load-sheet":
          filename = `Load_Sheet_${loadData.loadNumber}.pdf`;
          break;
        case "driver-sheet":
          filename = `Driver_Sheet_${loadData.loadNumber}.pdf`;
          break;
        case "pod":
          filename = `Proof_of_Delivery_${loadData.loadNumber}.pdf`;
          break;
        case "insurance":
          filename = `Insurance_Certificate_${loadData.loadNumber}.pdf`;
          break;
        default:
          filename = `Document_${loadData.loadNumber}.pdf`;
      }

      await generatePdf(pdfRef.current, filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const renderPdfTemplate = () => {
    switch (type) {
      case "rate-confirmation":
        return <RateConfirmationPdfTemplate loadData={loadData} />;
      case "bol":
        return <BolPdfTemplate loadData={loadData} />;
      case "load-sheet":
        return <LoadSheetPdfTemplate loadData={loadData} />;
      case "driver-sheet":
        return <DriverSheetPdfTemplate loadData={loadData} />;
      case "pod":
        return <ProofOfDeliveryPdfTemplate loadData={loadData} />;
      case "insurance":
        return <InsuranceCertificatePdfTemplate loadData={loadData} />;
      default:
        return <RateConfirmationPdfTemplate loadData={loadData} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium bg-[#F96176] text-white rounded-md hover:bg-[#F96176] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  Print/Download PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Hidden PDF element for generation */}
        <div className="absolute -left-[9999px]">
          <PdfPrintWrapper ref={pdfRef}>{renderPdfTemplate()}</PdfPrintWrapper>
        </div>

        {/* PDF Preview - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 bg-gray-100">
          <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto">
            {renderPdfTemplate()}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Check Call Modal Component ---
const CheckCallModal = ({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CheckCallFormData) => void;
}) => {
  const [formData, setFormData] = useState<CheckCallFormData>({
    stop: "",
    location: "",
    city: "",
    state: "",
    temperature: "",
    source: "",
    driver: "",
    notes: "",
  });

  const handleInputChange = (field: keyof CheckCallFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Send Check Calls</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <FormLabel>Stop *</FormLabel>
            <SelectField
              value={formData.stop}
              options={["Stop 1", "Stop 2", "Stop 3"]}
              placeholder="Select Stop"
              onChange={(e) => handleInputChange("stop", e.target.value)}
            />
          </div>

          <div>
            <FormLabel>Location *</FormLabel>
            <div className="flex gap-2">
              <InputField
                value={formData.location}
                placeholder="Enter location"
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
              <button
                type="button"
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors whitespace-nowrap"
              >
                Get Latest Location
              </button>
            </div>
          </div>

          <div>
            <FormLabel>City *</FormLabel>
            <InputField
              value={formData.city}
              placeholder="Enter city"
              onChange={(e) => handleInputChange("city", e.target.value)}
            />
          </div>

          <div>
            <FormLabel>State *</FormLabel>
            <SelectField
              value={formData.state}
              options={["CA", "NY", "TX", "FL", "IL", "AR"]}
              placeholder="Select"
              onChange={(e) => handleInputChange("state", e.target.value)}
            />
          </div>

          <div>
            <FormLabel>Source</FormLabel>
            <SelectField
              value={formData.source}
              options={["Driver", "Dispatcher", "Customer", "Carrier"]}
              placeholder="Select source"
              onChange={(e) => handleInputChange("source", e.target.value)}
            />
          </div>

          <div>
            <FormLabel>Driver</FormLabel>
            <SelectField
              value={formData.driver}
              options={["Swarn Singh", "Steve Expiry", "John Driver"]}
              placeholder="Select driver"
              onChange={(e) => handleInputChange("driver", e.target.value)}
            />
          </div>

          <div>
            <FormLabel>Notes</FormLabel>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow min-h-[80px]"
              placeholder="Enter notes"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <FormLabel>Temperature</FormLabel>
              <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Get Latest Temperature
              </button>
            </div>
            <InputField
              type="text"
              value={formData.temperature}
              placeholder="Enter temperature"
              onChange={(e) => handleInputChange("temperature", e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-[#F96176] text-white rounded-md hover:bg-[#F96176] transition-colors shadow-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Action Dropdown Component ---
interface ActionDropdownProps {
  type: "bol" | "load-sheet";
  onViewBol?: () => void;
  onViewConfirmation?: () => void;
  onSendERate?: () => void;
  onViewLoadSheet?: () => void;
  onViewSwarnSheet?: () => void;
  onViewLoadDriverSheet?: () => void;
}

const ActionDropdown = ({
  type,
  onViewBol,
  onViewConfirmation,
  onSendERate,
  onViewLoadSheet,
  onViewSwarnSheet,
  onViewLoadDriverSheet,
}: ActionDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isOpen) setIsHovered(false);
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1 px-2 py-3 bg-[#F96176] border border-[#F96176] rounded-md text-xs font-bold text-white hover:bg-[#F96176] hover:text-white hover:border-[#F96176] transition-all w-full shadow-sm group"
      >
        {type === "bol" ? (
          <>
            <Printer className="w-4 h-4" />
            BOL / Confg
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Load / Driver Sheet
          </>
        )}
        <ChevronDown className="w-3 h-3 transition-transform duration-200" />
      </button>

      {(isOpen || isHovered) && (
        <div
          className="absolute z-40 top-full left-0 mt-1 w-full min-w-[200px] bg-white rounded-md shadow-lg border border-gray-200 py-1 animate-in fade-in slide-in-from-top-2 duration-200"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsOpen(false);
          }}
        >
          {type === "bol" ? (
            <>
              <button
                onClick={() => {
                  onViewConfirmation?.();
                  setIsOpen(false);
                  setIsHovered(false);
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Confirmation
              </button>
              <button
                onClick={() => {
                  onViewBol?.();
                  setIsOpen(false);
                  setIsHovered(false);
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View BOL
              </button>
              <button
                onClick={() => {
                  onSendERate?.();
                  setIsOpen(false);
                  setIsHovered(false);
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send e-rate confirmation
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  onViewLoadSheet?.();
                  setIsOpen(false);
                  setIsHovered(false);
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Load Sheet
              </button>
              <button
                onClick={() => {
                  onViewSwarnSheet?.();
                  setIsOpen(false);
                  setIsHovered(false);
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Swarn Sheet
              </button>
              <button
                onClick={() => {
                  onViewLoadDriverSheet?.();
                  setIsOpen(false);
                  setIsHovered(false);
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View (Load/Driver Sheet)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Page Component ---
export default function LoadDetailsPage() {
  const [activeTab, setActiveTab] = useState("load-info");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showBolModal, setShowBolModal] = useState(false);
  const [showLoadSheetModal, setShowLoadSheetModal] = useState(false);
  const [showDriverSheetModal, setShowDriverSheetModal] = useState(false);
  const [showPodModal, setShowPodModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showCheckCallModal, setShowCheckCallModal] = useState(false);

  const handleSaveCheckCall = (data: CheckCallFormData) => {
    console.log("Check call data saved:", data);
    alert("Check call saved successfully!");
  };

  const handleViewDocument = (docType: string) => {
    switch (docType) {
      case "Rate Confirmation":
        setShowConfirmationModal(true);
        break;
      case "Bill of Lading":
        setShowBolModal(true);
        break;
      case "Proof of Delivery":
        setShowPodModal(true);
        break;
      case "Insurance":
        setShowInsuranceModal(true);
        break;
      case "Load Sheet":
        setShowLoadSheetModal(true);
        break;
      case "Driver Sheet":
        setShowDriverSheetModal(true);
        break;
      default:
        console.log(`Viewing document type: ${docType}`);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100/50 font-sans text-gray-900 pb-20">
        {/* --- TOP HEADER SECTION --- */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Title & Badges */}
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <Link href={"/truck-dispatch"}>
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </a>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">
                    Load #{MOCK_LOAD_DATA.loadNumber}
                  </h1>

                  {MOCK_LOAD_DATA.isInvoiced && (
                    <span className="px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] text-xs font-bold uppercase rounded-full border border-[#22c55e]/20 tracking-wide">
                      Invoiced
                    </span>
                  )}

                  {MOCK_LOAD_DATA.isLocked && (
                    <span
                      className="p-1 bg-gray-100 text-gray-500 rounded-md border border-gray-200"
                      title="Locked"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#F96176] text-white text-sm font-medium rounded-md hover:bg-[#F96176] transition shadow-sm">
                  BOL / POD <ChevronDown className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#F96176] text-white text-sm font-medium rounded-md hover:bg-[#F96176] transition shadow-sm">
                  Customer Confirmation <ChevronDown className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#F96176] text-white text-sm font-medium rounded-md hover:bg-[#F96176] transition shadow-sm">
                  Load Notes
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#F96176] text-white text-sm font-medium rounded-md hover:bg-[#F96176] transition shadow-sm">
                  Invoice <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* --- TAB NAVIGATION BAR --- */}
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-1">
            <div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 px-1
                    ${
                      activeTab === tab.id
                        ? "border-[#F96176] text-[#F96176]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* --- SUMMARY METRICS BAR --- */}
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <div className="flex overflow-x-auto pb-1 hide-scrollbar items-center">
              <MetricItem
                label="Revenue"
                value={MOCK_LOAD_DATA.revenue}
                isCurrency
              />
              <MetricItem
                label="Profit"
                value={MOCK_LOAD_DATA.profit}
                isCurrency
              />
              <MetricItem
                label="Rate"
                value={`${MOCK_LOAD_DATA.ratePerMile} per mile`}
              />
              <MetricItem
                label="Flat Rate"
                value={MOCK_LOAD_DATA.flatRate}
                isCurrency
              />
              <MetricItem
                label="Loaded Miles"
                value={MOCK_LOAD_DATA.loadedMiles}
              />
              <MetricItem
                label="Detention Tracked"
                value={MOCK_LOAD_DATA.detentionTracked}
              />
              <MetricItem label="Qty" value={MOCK_LOAD_DATA.quantity} />
              <MetricItem
                label="Weight"
                value={`${MOCK_LOAD_DATA.weight} lbs`}
              />
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {activeTab === "load-info" && (
            /* Two Column Grid for Load Info */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: LOAD DETAILS (60%) */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                      Load Details
                    </h2>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {/* Row 1 */}
                    <div>
                      <FormLabel>Load #</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.loadNumber} disabled />
                    </div>
                    <div>
                      <FormLabel>Load Status</FormLabel>
                      <SelectField
                        value={MOCK_LOAD_DATA.status}
                        options={[
                          "Pending",
                          "Dispatched",
                          "In Transit",
                          "Completed",
                        ]}
                      />
                    </div>
                    <div>
                      <FormLabel>Load Type</FormLabel>
                      <SelectField
                        value={MOCK_LOAD_DATA.loadType}
                        options={["Full Truck Load", "LTL", "Partial"]}
                      />
                    </div>

                    {/* Row 2 */}
                    <div className="md:col-span-2 xl:col-span-3">
                      <FormLabel required>Customer</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.customer} />
                    </div>

                    {/* Row 3 */}
                    <div>
                      <FormLabel>Primary Fees</FormLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 text-sm">
                          $
                        </span>
                        <InputField value="3400.00" className="pl-6" />
                      </div>
                    </div>
                    <div>
                      <FormLabel>Fee Type</FormLabel>
                      <SelectField
                        value={MOCK_LOAD_DATA.feeType}
                        options={["Flat Rate", "Per Mile"]}
                      />
                    </div>
                    <div>
                      <FormLabel>Tendered Miles</FormLabel>
                      <InputField
                        value={MOCK_LOAD_DATA.tenderedMiles}
                        disabled
                      />
                    </div>

                    {/* Row 4 */}
                    <div>
                      <FormLabel>Fuel Surcharge</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.fuelSurcharge} />
                    </div>
                    <div>
                      <FormLabel>Target Rate</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.targetRate} />
                    </div>
                    <div>
                      <FormLabel>Van Type</FormLabel>
                      <SelectField
                        value={MOCK_LOAD_DATA.vanType}
                        options={["Reefer", "Dry Van", "Flatbed"]}
                      />
                    </div>

                    {/* Row 5 */}
                    <div>
                      <FormLabel>Length</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.length} />
                    </div>
                    <div>
                      <FormLabel>Weight (Lbs)</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.weight} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <FormLabel>Options</FormLabel>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <ToggleSwitch
                            label="Hazmat"
                            checked={MOCK_LOAD_DATA.isHazmat}
                          />
                        </div>
                        <div className="flex-1">
                          <ToggleSwitch
                            label="Tarp"
                            checked={MOCK_LOAD_DATA.isTarpRequired}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 6 */}
                    <div className="md:col-span-2 xl:col-span-3">
                      <FormLabel>Booking Authority</FormLabel>
                      <InputField
                        value={MOCK_LOAD_DATA.bookingAuthority}
                        disabled
                      />
                    </div>

                    {/* Row 7 */}
                    <div>
                      <FormLabel>Sales Agent</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.salesAgent} disabled />
                    </div>
                    <div>
                      <FormLabel>Booking Terminal</FormLabel>
                      <InputField
                        value={MOCK_LOAD_DATA.bookingTerminal}
                        disabled
                      />
                    </div>
                    <div>
                      <FormLabel>Commodity</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.commodity} />
                    </div>

                    {/* Row 8 */}
                    <div>
                      <FormLabel>Declared Value</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.declaredValue} />
                    </div>
                    <div>
                      <FormLabel>Agency</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.agency} />
                    </div>
                    <div>
                      <FormLabel>Brokerage Agent</FormLabel>
                      <InputField value={MOCK_LOAD_DATA.brokerageAgent} />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: DISPATCH, ACTIONS, STOPS (40%) */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
                {/* Header: Shipper/Consignee */}
                <div className="flex items-center justify-between pb-1">
                  <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                    Shipper / Consignee
                  </h2>
                  <div className="flex gap-2">
                    <button className="p-1 rounded hover:bg-gray-200 border border-transparent hover:border-gray-300 transition-colors">
                      {/* <ChevronLeft className="w-5 h-5 text-gray-600" /> */}
                    </button>
                    <button className="p-1 rounded hover:bg-gray-200 border border-transparent hover:border-gray-300 transition-colors">
                      {/* <ChevronRight className="w-5 h-5 text-gray-600" /> */}
                    </button>
                  </div>
                </div>

                {/* Dispatch Info Section */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
                    Dispatch Info
                  </h3>
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase block mb-0.5">
                          Carrier
                        </span>
                        <span
                          className="font-bold text-[#F96176] block truncate text-xs sm:text-sm"
                          title={MOCK_LOAD_DATA.carrier}
                        >
                          {MOCK_LOAD_DATA.carrier}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase block mb-0.5">
                          Vehicle
                        </span>
                        <span className="font-bold text-gray-900 block truncate text-xs sm:text-sm">
                          {MOCK_LOAD_DATA.truck}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase block mb-0.5">
                          Trailer
                        </span>
                        <span className="font-bold text-gray-900 block truncate text-xs sm:text-sm">
                          {MOCK_LOAD_DATA.trailer}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase block mb-0.5">
                          Driver
                        </span>
                        <span className="font-bold text-gray-900 block truncate text-xs sm:text-sm mb-1">
                          {MOCK_LOAD_DATA.driver}
                        </span>
                        <div className="flex gap-1.5">
                          <button className="p-1 hover:bg-blue-50 rounded text-[#F96176]">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 hover:bg-green-50 rounded text-green-500">
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded text-gray-500">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <ActionDropdown
                    type="bol"
                    onViewConfirmation={() => setShowConfirmationModal(true)}
                    onViewBol={() => setShowBolModal(true)}
                    onSendERate={() => {
                      alert("Sending e-rate confirmation...");
                      // You could implement email functionality here
                    }}
                  />

                  <ActionDropdown
                    type="load-sheet"
                    onViewLoadSheet={() => setShowLoadSheetModal(true)}
                    onViewSwarnSheet={() => setShowLoadSheetModal(true)}
                    onViewLoadDriverSheet={() => setShowDriverSheetModal(true)}
                  />

                  <button
                    onClick={() => setShowCheckCallModal(true)}
                    className="flex items-center justify-center gap-2 px-2 py-3 bg-[#F96176] border border-[#F96176] rounded-md text-xs font-bold text-white hover:bg-[#F96176] hover:text-white hover:border-[#F96176] transition-all shadow-sm group"
                  >
                    <Clock className="w-4 h-4" />
                    Add Check Call
                  </button>
                </div>

                {/* Stops Info Section */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
                    Stops Info
                  </h3>
                  <div className="space-y-4">
                    {MOCK_STOPS.map((stop, index) => {
                      const isPickup = stop.type === "PICKUP";
                      const accentColor = isPickup
                        ? "border-l-[#22c55e]"
                        : "border-l-[#F96176]";
                      const headerBg = isPickup
                        ? "bg-green-50/40"
                        : "bg-[#F96176]/40";
                      const textColor = isPickup
                        ? "text-green-700"
                        : "text-[#F96176]";
                      const iconColor = isPickup
                        ? "text-green-600"
                        : "text-[#F96176]";

                      return (
                        <div
                          key={index}
                          className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden border-l-4 ${accentColor}`}
                        >
                          {/* Compact Header */}
                          <div
                            className={`px-4 py-2 border-b border-gray-100 ${headerBg} flex items-center justify-between`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border bg-white ${
                                  isPickup
                                    ? "text-green-700 border-green-200"
                                    : "text-[#F96176] border-[#F96176]"
                                }`}
                              >
                                {index + 1}
                              </span>
                              <span
                                className={`text-xs font-bold uppercase ${textColor}`}
                              >
                                {stop.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className={`w-3 h-3 ${iconColor}`} />
                              <span className="font-semibold">{stop.date}</span>
                              <span className="text-gray-300">|</span>
                              <span>{stop.timeWindow}</span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4 space-y-3">
                            {/* Location */}
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold text-gray-900">
                                  {stop.locationName}
                                </h4>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                  {stop.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {stop.address}, {stop.cityStateZip}
                              </p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs border-t border-gray-50 pt-2">
                              <div>
                                <span className="text-gray-400 block uppercase text-[9px]">
                                  Contact
                                </span>
                                <span className="font-medium text-gray-800">
                                  {stop.contact}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block uppercase text-[9px]">
                                  Ref #
                                </span>
                                <span className="font-medium text-gray-800">
                                  {stop.puNumber || stop.soNumber || "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 col-span-2 bg-gray-50 rounded p-1.5 border border-gray-100">
                                <span className="text-gray-500">
                                  Qty:{" "}
                                  <b className="text-gray-900">{stop.qty}</b>
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500">
                                  Wgt:{" "}
                                  <b className="text-gray-900">{stop.weight}</b>
                                </span>
                                {stop.temp && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-[#F96176] font-bold flex items-center gap-0.5">
                                      <Thermometer className="w-3 h-3" />{" "}
                                      {stop.temp}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Instructions */}
                            <div className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2">
                              {stop.instructions}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "load-docs" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Header with Buttons */}
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-end gap-3 bg-gray-50/50">
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#F96176] text-white text-sm font-medium rounded-md hover:bg-[#F96176] transition shadow-sm">
                  <Plus className="w-4 h-4" /> Create new document
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#F96176] text-[#F96176] text-sm font-medium rounded-md hover:bg-gray-50 transition shadow-sm">
                  <Download className="w-4 h-4" /> Download document
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#F96176] border border-[#F96176] text-white text-sm font-medium rounded-md hover:bg-[#F96176] transition shadow-sm">
                  <Mail className="w-4 h-4" /> Email document
                </button>
              </div>

              {/* Table */}
              <div className="relative overflow-x-auto overflow-y-visible">
                <table className="w-full text-left border-collapse overflow-visible">
                  <thead>
                    <tr className="bg-gray-100/70 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      <th className="px-6 py-4 w-[100px] text-center">
                        Actions
                      </th>
                      <th className="px-6 py-4 w-[80px] text-center">View</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Document Type</th>
                      <th className="px-6 py-4 text-center">
                        Invoice Requirement
                      </th>
                      <th className="px-6 py-4">Expiry Date</th>
                      <th className="px-6 py-4 text-right">Days Remaining</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white overflow-visible">
                    {MOCK_DOCUMENTS.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-gray-50/80 transition-colors group overflow-visible"
                      >
                        {/* ACTIONS */}
                        <td className="px-6 py-4 text-center relative overflow-visible">
                          <DocumentActionsDropdown loadDocument={doc} />
                        </td>

                        {/* VIEW */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewDocument(doc.type)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>

                        {/* NAME */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {doc.name}
                          </span>
                        </td>

                        {/* TYPE */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {doc.type}
                          </span>
                        </td>

                        {/* INVOICE */}
                        <td className="px-6 py-4 text-center">
                          {doc.invoiceRequirement ? (
                            <span className="inline-flex items-center justify-center p-1 bg-green-100 text-green-600 rounded-full">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* EXPIRY */}
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {doc.expiryDate ?? "-"}
                        </td>

                        {/* DAYS */}
                        <td className="px-6 py-4 text-right">
                          {doc.daysRemaining !== null ? (
                            <span
                              className={`text-sm font-bold ${
                                doc.daysRemaining < 30
                                  ? "text-red-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {doc.daysRemaining} Days
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* EMPTY STATE */}
                    {MOCK_DOCUMENTS.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="w-8 h-8 text-gray-300" />
                            <p>No documents found for this load.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Document View Modals */}
      <DocumentViewModal
        title="Rate Confirmation"
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        type="rate-confirmation"
        loadData={MOCK_LOAD_DATA}
      />

      <DocumentViewModal
        title="Bill of Lading"
        isOpen={showBolModal}
        onClose={() => setShowBolModal(false)}
        type="bol"
        loadData={MOCK_LOAD_DATA}
      />

      <DocumentViewModal
        title="Load Sheet"
        isOpen={showLoadSheetModal}
        onClose={() => setShowLoadSheetModal(false)}
        type="load-sheet"
        loadData={MOCK_LOAD_DATA}
      />

      <DocumentViewModal
        title="Driver Sheet"
        isOpen={showDriverSheetModal}
        onClose={() => setShowDriverSheetModal(false)}
        type="driver-sheet"
        loadData={MOCK_LOAD_DATA}
      />

      <DocumentViewModal
        title="Proof of Delivery"
        isOpen={showPodModal}
        onClose={() => setShowPodModal(false)}
        type="pod"
        loadData={MOCK_LOAD_DATA}
      />

      <DocumentViewModal
        title="Insurance Certificate"
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        type="insurance"
        loadData={MOCK_LOAD_DATA}
      />

      {/* Check Call Modal */}
      <CheckCallModal
        isOpen={showCheckCallModal}
        onClose={() => setShowCheckCallModal(false)}
        onSave={handleSaveCheckCall}
      />
    </>
  );
}
