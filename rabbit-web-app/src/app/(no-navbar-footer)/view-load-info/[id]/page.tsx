"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
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
  Search,
  Filter,
} from "lucide-react";
import { DocumentActionsDropdown } from "@/components/dropdown/DocumentActionDropdown";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { sendLoadCompletionEmail } from "@/utils/sendLoadCompletionEmail";
import toast from "react-hot-toast";

import { LoadData, Stop, LoadDocument } from "../../interface/loaddata";
import {
  PdfPrintWrapper,
  BolPdfTemplate,
  RateConfirmationPdfTemplate,
  LoadSheetPdfTemplate,
  DriverSheetPdfTemplate,
  ProofOfDeliveryPdfTemplate,
  InsuranceCertificatePdfTemplate,
  ViewLoadInfoPdfTemplate,
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

interface DispatchStopRecord {
  company?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  date?: string;
  timeStart?: string;
  timeEnd?: string;
  stopType?: string;
  hasAppointment?: boolean;
  totalQty?: string;
  qtyType?: string;
  totalWeight?: string;
  commodity?: string;
  length?: string;
  width?: string;
  height?: string;
  instructions?: string;
  pickup?: string;
  pickupNumber?: string;
  loadNumber?: string;
  locationNotes?: string;
  notes?: string;
  customerLoadRefConf?: string;
  shipmentBol?: string;
  poNumber?: string;
  reeferMode?: string;
  routeName?: string;
  seal?: string;
  container?: string;
  chassis?: string;
  customerTrailer?: string;
  pro?: string;
  reeferFuelLevel?: string;
  splitLoad?: string;
  yardLocation?: string;
}

interface DispatchDocumentRecord {
  id: string;
  name?: string;
  type?: string;
  size?: number;
  url?: string;
  mimeType?: string;
  source?: "uploaded" | "generated";
  storagePath?: string;
  createdAt?: { seconds?: number };
  uploadedByRole?: string;
  uploadedById?: string;
  uploadedByName?: string;
}

interface DispatchLoadRecord {
  loadNumber?: string;
  status?: string;
  customerSearch?: string;
  customerName?: string;
  bookingOffice?: string;
  primaryFees?: number;
  feeType?: string;
  tenderedMiles?: string;
  fuelSrcType?: string;
  fuelSrc?: string;
  fuelSurcharge?: number;
  targetRate?: number;
  vanType?: string;
  length?: string;
  weight?: string;
  bookingAuthority?: string;
  salesAgent?: string;
  bookingTerminalOffice?: string;
  commodity?: string;
  declaredValue?: string;
  agency?: string;
  brokerageAgent?: string;
  customerLoadNotes?: string;
  internalNotes?: string;
  type?: string;
  lineHaul?: number;
  detention?: number;
  layover?: number;
  tonu?: number;
  accessorials?: number;
  totalCustomerRate?: number;
  totalCarrierPay?: number;
  assignmentType?: "carrier" | "driver" | "";
  carrierId?: string;
  truckId?: string;
  trailerId?: string;
  trailerType?: string;
  driverId?: string;
  secondDriverId?: string;
  driverName?: string;
  dispatcherId?: string;
  temperature?: string;
  dispatchNotes?: string;
  autoSendDriver?: boolean;
  autoTrack?: boolean;
  autoInvoice?: boolean;
  yardLocation?: string;
  pickups?: DispatchStopRecord[];
  deliveries?: DispatchStopRecord[];
  documents?: DispatchDocumentRecord[];
  updatedAt?: { seconds?: number };
  effectiveUserId?: string;
  currentUserId?: string;
}

interface UserProfileRecord {
  isOwner?: boolean;
  createdBy?: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  email?: string;
  phoneNumber?: string;
  userName?: string;
}

interface CarrierSettingsRecord {
  companyName?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  email?: string;
  phoneNumber?: string;
  contactPerson?: string;
  primaryContact?: string;
  mcNumber?: string;
  dotNumber?: string;
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
  { id: "uploaded-docs", label: "Uploaded Docs" },
];

const GENERATED_DOCUMENTS: LoadDocument[] = [
  {
    id: "generated-rate-confirmation",
    name: "Rate Confirmation",
    type: "Rate Confirmation",
    invoiceRequirement: true,
    expiryDate: "-",
    daysRemaining: null,
    source: "generated",
  },
  {
    id: "generated-bol",
    name: "Bill of Lading",
    type: "Bill of Lading",
    invoiceRequirement: true,
    expiryDate: "-",
    daysRemaining: null,
    source: "generated",
  },
  {
    id: "generated-load-sheet",
    name: "Load Sheet",
    type: "Load Sheet",
    invoiceRequirement: false,
    expiryDate: "-",
    daysRemaining: null,
    source: "generated",
  },
  {
    id: "generated-driver-sheet",
    name: "Driver Sheet",
    type: "Driver Sheet",
    invoiceRequirement: false,
    expiryDate: "-",
    daysRemaining: null,
    source: "generated",
  },
  {
    id: "generated-pod",
    name: "Proof of Delivery",
    type: "Proof of Delivery",
    invoiceRequirement: true,
    expiryDate: "-",
    daysRemaining: null,
    source: "generated",
  },
  {
    id: "generated-load-info",
    name: "View Load Info",
    type: "View Load Info",
    invoiceRequirement: false,
    expiryDate: "-",
    daysRemaining: null,
    source: "generated",
  },
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
    readOnly={!onChange || disabled}
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
      disabled={disabled || !onChange}
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

const DetailCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
        {title}
      </h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const DetailItem = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | number | boolean | null;
  className?: string;
}) => {
  const resolved =
    typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : typeof value === "number"
      ? value.toString()
      : (value || "").toString().trim() || "-";

  return (
    <div className={className}>
      <FormLabel>{label}</FormLabel>
      <div className="min-h-[42px] rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap break-words">
        {resolved}
      </div>
    </div>
  );
};

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

const printElementContent = (element: HTMLElement, title: string) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const printDocument =
    iframe.contentDocument || iframe.contentWindow?.document;

  if (!printDocument || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    throw new Error("Unable to prepare print preview");
  }

  printDocument.open();
  printDocument.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          body { margin: 0; padding: 24px; background: #ffffff; }
          @page { size: A4; margin: 12mm; }
        </style>
      </head>
      <body>${element.innerHTML}</body>
    </html>
  `);
  printDocument.close();

  const cleanup = () => {
    window.setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    cleanup();
  };

  window.setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    cleanup();
  }, 350);
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
    | "insurance"
    | "view-load-info";
  loadData: LoadData;
  autoAction?: "print" | "download" | null;
  onAutoActionComplete?: () => void;
}

const DocumentViewModal = ({
  title,
  isOpen,
  onClose,
  type,
  loadData,
  autoAction = null,
  onAutoActionComplete,
}: DocumentViewModalProps) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const filename = useMemo(() => {
    switch (type) {
      case "rate-confirmation":
        return `Rate_Confirmation_${loadData.loadNumber}.pdf`;
      case "bol":
        return `Bill_of_Lading_${loadData.loadNumber}.pdf`;
      case "load-sheet":
        return `Load_Sheet_${loadData.loadNumber}.pdf`;
      case "driver-sheet":
        return `Driver_Sheet_${loadData.loadNumber}.pdf`;
      case "pod":
        return `Proof_of_Delivery_${loadData.loadNumber}.pdf`;
      case "insurance":
        return `Insurance_Certificate_${loadData.loadNumber}.pdf`;
      case "view-load-info":
        return `Load_Information_${loadData.loadNumber}.pdf`;
      default:
        return `Document_${loadData.loadNumber}.pdf`;
    }
  }, [loadData.loadNumber, type]);

  const handleDownloadPdf = React.useCallback(async () => {
    if (!pdfRef.current || isGenerating) return;

    setIsGenerating(true);
    try {
      await generatePdf(pdfRef.current, filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [filename, isGenerating]);

  const handleBrowserPrint = React.useCallback(() => {
    if (!previewRef.current || isGenerating) return;

    setIsGenerating(true);
    try {
      printElementContent(previewRef.current, filename.replace(".pdf", ""));
    } catch (error) {
      console.error("Error printing document:", error);
      alert("Failed to open print preview. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [filename, isGenerating]);

  useEffect(() => {
    if (!isOpen || !autoAction) return;

    const timer = window.setTimeout(async () => {
      if (autoAction === "download") {
        await handleDownloadPdf();
      } else {
        handleBrowserPrint();
      }
      onAutoActionComplete?.();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [
    autoAction,
    handleBrowserPrint,
    handleDownloadPdf,
    isOpen,
    onAutoActionComplete,
  ]);

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
      case "view-load-info":
        return <ViewLoadInfoPdfTemplate loadData={loadData} />;
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
              onClick={handleBrowserPrint}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium bg-[#F96176] text-white rounded-md hover:bg-[#F96176] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating && autoAction === "print" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  Print
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating && autoAction === "download" ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
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
          <div
            ref={previewRef}
            className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto"
          >
            {renderPdfTemplate()}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Check Call Modal Component ---
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Send Check Calls</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {/* Stop */}
            <div>
              <FormLabel>Stop *</FormLabel>
              <SelectField
                value={formData.stop}
                options={["Stop 1", "Stop 2", "Stop 3"]}
                placeholder="Select Stop"
                onChange={(e) => handleInputChange("stop", e.target.value)}
              />
            </div>

            {/* Location */}
            <div>
              <FormLabel>Location *</FormLabel>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <InputField
                    value={formData.location}
                    placeholder="Enter location"
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                  />
                </div>
                <button
                  type="button"
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  Get Latest Location
                </button>
              </div>
            </div>

            {/* City & State Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Source & Driver Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Notes */}
            <div>
              <FormLabel>Notes</FormLabel>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow min-h-[80px] resize-vertical"
                placeholder="Enter notes"
              />
            </div>

            {/* Temperature */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                <FormLabel>Temperature</FormLabel>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap self-end sm:self-auto"
                >
                  Get Latest Temperature
                </button>
              </div>
              <InputField
                type="text"
                value={formData.temperature}
                placeholder="Enter temperature"
                onChange={(e) =>
                  handleInputChange("temperature", e.target.value)
                }
              />
            </div>

            {/* Buttons - Fixed at bottom on mobile */}
            <div className="pt-4 pb-4 sm:pb-0 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100 sticky bottom-0 bg-white sm:static">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-[#F96176] text-white rounded-md hover:bg-[#F96176] transition-colors shadow-sm w-full sm:w-auto"
              >
                Save
              </button>
            </div>
          </form>
        </div>
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
  uploadedBolDocument?: LoadDocument;
  uploadedPodDocument?: LoadDocument;
  onViewUploadedDocument?: (document: LoadDocument) => void;
}

const ActionDropdown = ({
  type,
  onViewBol,
  onViewConfirmation,
  onSendERate,
  onViewLoadSheet,
  onViewSwarnSheet,
  onViewLoadDriverSheet,
  uploadedBolDocument,
  uploadedPodDocument,
  onViewUploadedDocument,
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
              {uploadedBolDocument && (
                <button
                  onClick={() => {
                    onViewUploadedDocument?.(uploadedBolDocument);
                    setIsOpen(false);
                    setIsHovered(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Uploaded BOL
                </button>
              )}
              {uploadedPodDocument && (
                <button
                  onClick={() => {
                    onViewUploadedDocument?.(uploadedPodDocument);
                    setIsOpen(false);
                    setIsHovered(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Uploaded POD
                </button>
              )}
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
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const loadDocId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const requestedAction = searchParams.get("action");
  const [activeTab, setActiveTab] = useState("load-info");
  const [previewUploadedDoc, setPreviewUploadedDoc] =
    useState<DispatchDocumentRecord | null>(null);
  const [uploadedCategoryFilter, setUploadedCategoryFilter] =
    useState<string>("all");
  const [uploadedSearchQuery, setUploadedSearchQuery] = useState<string>("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showBolModal, setShowBolModal] = useState(false);
  const [showLoadSheetModal, setShowLoadSheetModal] = useState(false);
  const [showDriverSheetModal, setShowDriverSheetModal] = useState(false);
  const [showPodModal, setShowPodModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showCheckCallModal, setShowCheckCallModal] = useState(false);
  const [showLoadInfoModal, setShowLoadInfoModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dbLoad, setDbLoad] = useState<DispatchLoadRecord | null>(null);
  const [driverLabel, setDriverLabel] = useState("-");
  const [secondDriverLabel, setSecondDriverLabel] = useState("-");
  const [truckLabel, setTruckLabel] = useState("-");
  const [trailerLabel, setTrailerLabel] = useState("-");
  const [ownerProfile, setOwnerProfile] = useState<UserProfileRecord | null>(
    null
  );
  const [carrierProfile, setCarrierProfile] =
    useState<CarrierSettingsRecord | null>(null);
  const [driverProfile, setDriverProfile] = useState<UserProfileRecord | null>(
    null
  );
  const [autoAction, setAutoAction] = useState<"print" | "download" | null>(
    null
  );
  const handleAutoActionComplete = React.useCallback(() => {
    setAutoAction(null);
  }, []);

  useEffect(() => {
    const fetchLoad = async () => {
      if (!loadDocId) return;
      try {
        const loadSnap = await getDoc(doc(db, "dispatch_loads", loadDocId));
        if (!loadSnap.exists()) {
          setDbLoad(null);
          return;
        }

        const data = loadSnap.data() as DispatchLoadRecord;
        setDbLoad(data);

        const ownerUserId = data.effectiveUserId || data.currentUserId || "";
        if (ownerUserId) {
          const ownerSnap = await getDoc(doc(db, "Users", ownerUserId));
          if (ownerSnap.exists()) {
            setOwnerProfile(ownerSnap.data() as UserProfileRecord);
          }
        }

        if (data.driverId) {
          const driverSnap = await getDoc(doc(db, "Users", data.driverId));
          if (driverSnap.exists()) {
            const driverData = driverSnap.data() as UserProfileRecord;
            setDriverProfile(driverData);
            setDriverLabel(
              (driverData.userName || driverData.email || data.driverId).trim()
            );
          } else {
            setDriverLabel(data.driverId);
          }

          if (data.truckId) {
            let truckSnap = data.driverId
              ? await getDoc(
                  doc(db, "Users", data.driverId, "Vehicles", data.truckId)
                )
              : null;
            if (!truckSnap || !truckSnap.exists()) {
              const fallbackOwnerId =
                data.effectiveUserId || data.currentUserId;
              if (fallbackOwnerId) {
                truckSnap = await getDoc(
                  doc(db, "Users", fallbackOwnerId, "Vehicles", data.truckId)
                );
              }
            }
            if (truckSnap && truckSnap.exists()) {
              const truckData = truckSnap.data() as {
                vehicleNumber?: string;
                companyName?: string;
                myCompany?: string;
              };
              const vehicleNumber = (truckData.vehicleNumber || "").trim();
              const companyName = (truckData.companyName || "").trim();
              const myCompany = (truckData.myCompany || "").trim();
              setTruckLabel(
                vehicleNumber && companyName
                  ? `${vehicleNumber} (${companyName})${
                      myCompany ? ` (${myCompany})` : ""
                    }`
                  : vehicleNumber || companyName || data.truckId
              );
            } else {
              setTruckLabel(data.truckId);
            }
          } else {
            setTruckLabel("-");
          }

          if (data.trailerId) {
            let trailerSnap = data.driverId
              ? await getDoc(
                  doc(db, "Users", data.driverId, "Vehicles", data.trailerId)
                )
              : null;
            if (!trailerSnap || !trailerSnap.exists()) {
              const fallbackOwnerId =
                data.effectiveUserId || data.currentUserId;
              if (fallbackOwnerId) {
                trailerSnap = await getDoc(
                  doc(db, "Users", fallbackOwnerId, "Vehicles", data.trailerId)
                );
              }
            }
            if (trailerSnap && trailerSnap.exists()) {
              const trailerData = trailerSnap.data() as {
                vehicleNumber?: string;
                companyName?: string;
                myCompany?: string;
              };
              const vehicleNumber = (trailerData.vehicleNumber || "").trim();
              const companyName = (trailerData.companyName || "").trim();
              const myCompany = (trailerData.myCompany || "").trim();
              setTrailerLabel(
                vehicleNumber && companyName
                  ? `${vehicleNumber} (${companyName})${
                      myCompany ? ` (${myCompany})` : ""
                    }`
                  : vehicleNumber || companyName || data.trailerId
              );
            } else {
              setTrailerLabel(data.trailerId);
            }
          } else {
            setTrailerLabel("-");
          }
        } else {
          setDriverLabel("-");
          setTruckLabel(data.truckId || "-");
          setTrailerLabel(data.trailerId || "-");
        }

        if (data.secondDriverId) {
          const secondDriverSnap = await getDoc(
            doc(db, "Users", data.secondDriverId)
          );
          if (secondDriverSnap.exists()) {
            const secondDriverData =
              secondDriverSnap.data() as UserProfileRecord;
            setSecondDriverLabel(
              (
                secondDriverData.userName ||
                secondDriverData.email ||
                data.secondDriverId
              ).trim()
            );
          } else {
            setSecondDriverLabel(data.secondDriverId);
          }
        } else {
          setSecondDriverLabel("-");
        }

        if (data.carrierId) {
          const carrierSnap = await getDoc(
            doc(db, "settings_carriers", data.carrierId)
          );
          if (carrierSnap.exists()) {
            setCarrierProfile(carrierSnap.data() as CarrierSettingsRecord);
          } else {
            const fallbackCarrierSnap = await getDocs(
              query(
                collection(db, "settings_carriers"),
                where("companyName", "==", data.carrierId)
              )
            );

            if (!fallbackCarrierSnap.empty) {
              setCarrierProfile(
                fallbackCarrierSnap.docs[0].data() as CarrierSettingsRecord
              );
            } else {
              setCarrierProfile(null);
            }
          }
        } else {
          setCarrierProfile(null);
        }
      } catch (error) {
        GlobalToastError(error);
        setDbLoad(null);
        setOwnerProfile(null);
        setCarrierProfile(null);
        setDriverProfile(null);
        setSecondDriverLabel("-");
      }
    };

    fetchLoad();
  }, [loadDocId]);

  const loadData = useMemo<LoadData>(() => {
    if (!dbLoad) return MOCK_LOAD_DATA;

    const revenue =
      Number(dbLoad.totalCustomerRate || 0) ||
      Number(dbLoad.lineHaul || 0) +
        Number(dbLoad.fuelSurcharge || 0) +
        Number(dbLoad.detention || 0) +
        Number(dbLoad.layover || 0) +
        Number(dbLoad.tonu || 0) +
        Number(dbLoad.accessorials || 0);
    const carrierPay = Number(dbLoad.totalCarrierPay || 0);
    const profit = revenue - carrierPay;
    const miles = Number(dbLoad.tenderedMiles || 0);
    const ratePerMile = miles > 0 ? revenue / miles : 0;
    const firstPickup = dbLoad.pickups?.[0];
    const firstDelivery = dbLoad.deliveries?.[0];
    const fallbackWeight =
      dbLoad.weight ||
      firstPickup?.totalWeight ||
      firstDelivery?.totalWeight ||
      "-";
    const fallbackCommodity =
      dbLoad.commodity ||
      firstPickup?.commodity ||
      firstDelivery?.commodity ||
      "-";

    const brokerAddressLine2 = [
      ownerProfile?.city,
      ownerProfile?.state,
      ownerProfile?.country,
    ]
      .filter(Boolean)
      .join(", ");
    const carrierCompany =
      carrierProfile?.companyName ||
      carrierProfile?.name ||
      dbLoad.carrierId ||
      "-";
    const carrierAddressLine2 = [
      carrierProfile?.city,
      carrierProfile?.state,
      carrierProfile?.country,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      loadNumber: dbLoad.loadNumber || loadDocId || "-",
      status: dbLoad.status || "Draft",
      isInvoiced: false,
      isLocked: false,
      customer: dbLoad.customerSearch || dbLoad.customerName || "-",
      primaryFees: `$${Number(dbLoad.primaryFees || 0).toFixed(2)}`,
      feeType: dbLoad.feeType || "-",
      tenderedMiles: dbLoad.tenderedMiles
        ? `${dbLoad.tenderedMiles} Miles`
        : "-",
      fuelSurcharge: `$${Number(dbLoad.fuelSurcharge || 0).toFixed(2)}`,
      targetRate: `$${Number(dbLoad.targetRate || 0).toFixed(2)}`,
      vanType: dbLoad.vanType || "-",
      length: dbLoad.length ? `${dbLoad.length} ft` : "-",
      weight: fallbackWeight,
      isHazmat: false,
      isTarpRequired: false,
      bookingAuthority: dbLoad.bookingAuthority || "-",
      salesAgent: dbLoad.salesAgent || "-",
      bookingTerminal: dbLoad.bookingTerminalOffice || "-",
      commodity: fallbackCommodity,
      declaredValue: dbLoad.declaredValue || "-",
      agency: dbLoad.agency || "-",
      brokerageAgent: dbLoad.brokerageAgent || "-",
      revenue: `$${revenue.toFixed(2)}`,
      profit: `$${profit.toFixed(2)}`,
      ratePerMile: `$${ratePerMile.toFixed(2)}`,
      flatRate: `$${revenue.toFixed(2)}`,
      loadedMiles: dbLoad.tenderedMiles || "-",
      detentionTracked: `${Number(dbLoad.detention || 0).toFixed(2)}`,
      quantity:
        firstPickup?.totalQty && firstPickup?.qtyType
          ? `${firstPickup.totalQty} ${firstPickup.qtyType}`
          : "-",
      loadType: dbLoad.type || "-",
      carrier: carrierCompany,
      truck: truckLabel,
      trailer: trailerLabel,
      driver: driverLabel,
      dispatcher: dbLoad.dispatcherId || "-",
      bolNumber: firstPickup?.shipmentBol || "",
      poNumbers: [firstPickup?.poNumber, firstDelivery?.poNumber].filter(
        (item): item is string => Boolean(item)
      ),
      pickupDate: firstPickup?.date || "-",
      deliveryDate: firstDelivery?.date || "-",
      temperature: dbLoad.temperature || "",
      equipmentType: dbLoad.vanType || "-",
      pickupInstructions: firstPickup?.instructions || "-",
      deliveryInstructions: firstDelivery?.instructions || "-",
      customerContact: { name: "-", phone: "-", email: "" },
      brokerInfo: {
        companyName: ownerProfile?.companyName || "Brokerage Company",
        addressLine1: ownerProfile?.address || "",
        addressLine2: brokerAddressLine2,
        email: ownerProfile?.email || "",
        phone: ownerProfile?.phoneNumber || "",
      },
      carrierContact: {
        name:
          carrierProfile?.primaryContact ||
          carrierProfile?.contactPerson ||
          "-",
        phone: carrierProfile?.phoneNumber || "",
        email: carrierProfile?.email || "",
        company: carrierCompany,
        addressLine1: carrierProfile?.address || "",
        addressLine2: carrierAddressLine2,
        mcNumber: carrierProfile?.mcNumber || "",
        dotNumber: carrierProfile?.dotNumber || "",
      },
      driverContact: {
        name: driverProfile?.userName || driverLabel || "-",
        phone: driverProfile?.phoneNumber || "",
        email: driverProfile?.email || "",
      },
      dispatchNotes: dbLoad.dispatchNotes || "",
      customerLoadNotes: dbLoad.customerLoadNotes || "",
    };
  }, [
    carrierProfile,
    dbLoad,
    driverLabel,
    driverProfile,
    ownerProfile,
    truckLabel,
    trailerLabel,
    loadDocId,
  ]);

  const stops = useMemo<Stop[]>(() => {
    if (!dbLoad) return MOCK_STOPS;
    const mappedPickups = (dbLoad.pickups || []).map((stop, index) => ({
      type: "PICKUP" as const,
      number: index + 1,
      date: stop.date || "-",
      timeWindow:
        stop.timeStart || stop.timeEnd
          ? `${stop.timeStart || "-"} - ${stop.timeEnd || "-"}`
          : "-",
      locationName: stop.company || "-",
      address: stop.address || "-",
      cityStateZip: stop.locationNotes || "-",
      contact: stop.contactPerson || stop.phone || "-",
      qty:
        stop.totalQty && stop.qtyType
          ? `${stop.totalQty} ${stop.qtyType}`
          : "-",
      weight: stop.totalWeight ? `${stop.totalWeight} lbs` : "-",
      instructions: stop.instructions || dbLoad.dispatchNotes || "-",
      puNumber: stop.pickup || stop.customerLoadRefConf || "-",
      miles: "0 Empty",
      status: dbLoad.status || "Draft",
      route: stop.routeName || "-",
      temp: dbLoad.temperature || "",
      appointmentRef: stop.customerLoadRefConf || "-",
      bolNumber: stop.shipmentBol || "",
      poNumbers: stop.poNumber ? [stop.poNumber] : [],
    }));
    const mappedDeliveries = (dbLoad.deliveries || []).map((stop, index) => ({
      type: "DELIVERY" as const,
      number: mappedPickups.length + index + 1,
      date: stop.date || "-",
      timeWindow:
        stop.timeStart || stop.timeEnd
          ? `${stop.timeStart || "-"} - ${stop.timeEnd || "-"}`
          : "-",
      locationName: stop.company || "-",
      address: stop.address || "-",
      cityStateZip: stop.locationNotes || "-",
      contact: stop.contactPerson || stop.phone || "-",
      qty:
        stop.totalQty && stop.qtyType
          ? `${stop.totalQty} ${stop.qtyType}`
          : "-",
      weight: stop.totalWeight ? `${stop.totalWeight} lbs` : "-",
      instructions: stop.instructions || dbLoad.dispatchNotes || "-",
      soNumber: stop.pickup || stop.customerLoadRefConf || "-",
      miles: "Loaded",
      status: dbLoad.status || "Draft",
      route: stop.routeName || "-",
      temp: dbLoad.temperature || "",
      appointmentRef: stop.customerLoadRefConf || "-",
      bolNumber: stop.shipmentBol || "",
      poNumbers: stop.poNumber ? [stop.poNumber] : [],
    }));
    return [...mappedPickups, ...mappedDeliveries];
  }, [dbLoad]);

  const loadDataWithStops = useMemo<LoadData>(
    () => ({
      ...loadData,
      stops,
    }),
    [loadData, stops]
  );

  useEffect(() => {
    if (!dbLoad || !loadDocId) return;

    if (requestedAction === "print" || requestedAction === "download") {
      setAutoAction(requestedAction);
      setShowLoadInfoModal(true);
    }
  }, [dbLoad, loadDocId, requestedAction]);

  const documents = useMemo<LoadDocument[]>(() => {
    if (!dbLoad) return MOCK_DOCUMENTS;
    const formatType = (type?: string) => {
      if (!type) return "Document";
      return type
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    const uploadedDocuments = (dbLoad.documents || []).map((item) => ({
      id: item.id,
      name: item.name || `${formatType(item.type)} ${item.id}`,
      type: formatType(item.type),
      invoiceRequirement: false,
      expiryDate: "-",
      daysRemaining: null,
      url: item.url,
      source: item.source || "uploaded",
      fileType: item.mimeType,
      storagePath: item.storagePath,
      uploadedAt: item.createdAt?.seconds
        ? new Date(item.createdAt.seconds * 1000).toLocaleString()
        : undefined,
      documentKey: item.type,
    }));

    return [...GENERATED_DOCUMENTS, ...uploadedDocuments];
  }, [dbLoad]);

  const handleSaveCheckCall = (data: CheckCallFormData) => {
    console.log("Check call data saved:", data);
    alert("Check call saved successfully!");
  };

  const handleViewDocument = (document: LoadDocument) => {
    if (document.url) {
      window.open(document.url, "_blank", "noopener,noreferrer");
      return;
    }

    switch (document.type) {
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
      case "View Load Info":
        setShowLoadInfoModal(true);
        break;
      default:
        console.log(`Viewing document type: ${document.type}`);
    }
  };

  const handleDownloadDocument = (document: LoadDocument) => {
    if (document.url) {
      const link = window.document.createElement("a");
      link.href = document.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = document.name;
      link.click();
      return;
    }

    handleViewDocument(document);
  };

  const latestUploadedBol = useMemo(
    () =>
      [...documents]
        .reverse()
        .find((item) => item.documentKey === "bill-of-lading" && item.url),
    [documents]
  );

  const latestUploadedPod = useMemo(
    () =>
      [...documents]
        .reverse()
        .find((item) => item.documentKey === "proof-of-delivery" && item.url),
    [documents]
  );

  const uploadedDocumentsList = useMemo<DispatchDocumentRecord[]>(() => {
    if (!dbLoad?.documents) return [];
    return dbLoad.documents;
  }, [dbLoad?.documents]);

  const filteredUploadedDocs = useMemo(() => {
    let list = uploadedDocumentsList;
    if (uploadedCategoryFilter !== "all") {
      list = list.filter((doc) => {
        const typeKey = (doc.type || "").toLowerCase().trim();
        const filterKey = uploadedCategoryFilter.toLowerCase().trim();
        return (
          typeKey === filterKey ||
          typeKey.replace(/-/g, "") === filterKey.replace(/-/g, "") ||
          (filterKey === "bol" &&
            (typeKey === "bill-of-lading" || typeKey === "bol")) ||
          (filterKey === "pod" &&
            (typeKey === "proof-of-delivery" || typeKey === "pod")) ||
          (filterKey === "lumper" &&
            (typeKey === "lumper-receipt" || typeKey === "lumper")) ||
          (filterKey === "damage-photos" &&
            (typeKey === "damage-photo" || typeKey === "damage-photos")) ||
          (filterKey === "rate-confirmation" &&
            (typeKey === "rate-confirmation" || typeKey === "rate-conf"))
        );
      });
    }
    if (uploadedSearchQuery.trim()) {
      const q = uploadedSearchQuery.toLowerCase().trim();
      list = list.filter((doc) => {
        const name = (doc.name || "").toLowerCase();
        const type = (doc.type || "").toLowerCase();
        const uploader = (
          doc.uploadedByName ||
          doc.uploadedByRole ||
          ""
        ).toLowerCase();
        return name.includes(q) || type.includes(q) || uploader.includes(q);
      });
    }
    return list;
  }, [uploadedDocumentsList, uploadedCategoryFilter, uploadedSearchQuery]);

  const formatDocFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getDocTypeCategoryBadge = (type?: string) => {
    const normalized = (type || "").toLowerCase().replace(/[\s_]+/g, "-");
    switch (normalized) {
      case "bol":
      case "bill-of-lading":
        return {
          label: "Bill of Lading",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "pod":
      case "proof-of-delivery":
        return {
          label: "Proof of Delivery",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "damage-photos":
      case "damage-photo":
        return {
          label: "Damage Photos",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "scale-ticket":
        return {
          label: "Scale Ticket",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "lumper":
      case "lumper-receipt":
        return {
          label: "Lumper Receipt",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "rate-confirmation":
        return {
          label: "Rate Confirmation",
          bg: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "insurance":
      case "insurance-cert":
        return {
          label: "Insurance",
          bg: "bg-teal-50 text-teal-700 border-teal-200",
        };
      default:
        return {
          label: type
            ? type
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
            : "Other Document",
          bg: "bg-gray-100 text-gray-700 border-gray-200",
        };
    }
  };

  const isImageDocument = (docItem: DispatchDocumentRecord) => {
    const mime = (docItem.mimeType || "").toLowerCase();
    const name = (docItem.name || "").toLowerCase();
    const url = (docItem.url || "").toLowerCase();
    return (
      mime.includes("image") ||
      mime === "jpg" ||
      mime === "jpeg" ||
      mime === "png" ||
      mime === "webp" ||
      mime === "gif" ||
      /\.(jpg|jpeg|png|webp|gif|bmp)(\?.*)?$/i.test(name) ||
      /\.(jpg|jpeg|png|webp|gif|bmp)(\?.*)?$/i.test(url)
    );
  };

  const isPdfDocument = (docItem: DispatchDocumentRecord) => {
    const mime = (docItem.mimeType || "").toLowerCase();
    const name = (docItem.name || "").toLowerCase();
    const url = (docItem.url || "").toLowerCase();
    return (
      mime.includes("pdf") ||
      mime === "pdf" ||
      name.endsWith(".pdf") ||
      url.includes(".pdf")
    );
  };

  const handleDownloadUploadedDoc = (docItem: DispatchDocumentRecord) => {
    if (!docItem.url) return;
    const link = window.document.createElement("a");
    link.href = docItem.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = docItem.name || "document";
    link.click();
  };

  const formatCurrency = (value?: number | string) =>
    `$${Number(value || 0).toFixed(2)}`;

  const loadStatusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            loadData.status,
            "Draft",
            "Posted",
            "Assigned",
            "Pending",
            "Dispatched",
            "In Transit",
            "Delivered",
            "Completed",
            "Completed Toun",
          ].filter(Boolean)
        )
      ),
    [loadData.status]
  );

  const loadTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            loadData.loadType,
            "FTL",
            "LTL",
            "Partial",
            "Full Truck Load",
          ].filter(Boolean)
        )
      ),
    [loadData.loadType]
  );

  const allStops = useMemo(
    () => [
      ...(dbLoad?.pickups?.map((stop, index) => ({
        ...stop,
        stopCategory: "Pickup",
        stopNumber: index + 1,
      })) || []),
      ...(dbLoad?.deliveries?.map((stop, index) => ({
        ...stop,
        stopCategory: "Delivery",
        stopNumber: index + 1,
      })) || []),
    ],
    [dbLoad]
  );

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendCompletionPacket = async () => {
    setIsSendingEmail(true);
    const toastId = toast.loading(
      "Sending shipment documents to driver & consignee..."
    );
    try {
      const res = await sendLoadCompletionEmail({
        loadId: loadDocId,
        loadData: dbLoad,
        showToast: false,
      });
      if (res.success) {
        toast.success(
          `Documents emailed successfully to: ${res.recipients?.join(", ")} ✉️`,
          { id: toastId, duration: 5000 }
        );
      } else {
        toast.error(res.error || "Failed to send documents email", {
          id: toastId,
          duration: 5000,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email", { id: toastId });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newStatus = e.target.value;
    if (!newStatus || newStatus === loadData.status) return;

    try {
      const updateToastId = toast.loading(`Updating status to ${newStatus}...`);
      await updateDoc(doc(db, "dispatch_loads", loadDocId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      setDbLoad((prev) => (prev ? { ...prev, status: newStatus } : prev));
      toast.success(`Load status updated to ${newStatus}`, {
        id: updateToastId,
      });

      if (newStatus === "Completed" || newStatus === "Completed Toun") {
        await handleSendCompletionPacket();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
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
                <Link
                  href={"/truck-dispatch"}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">
                    Load #{loadData.loadNumber}
                  </h1>

                  {loadData.isInvoiced && (
                    <span className="px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] text-xs font-bold uppercase rounded-full border border-[#22c55e]/20 tracking-wide">
                      Invoiced
                    </span>
                  )}

                  {loadData.isLocked && (
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
                <div className="min-w-[185px]">
                  <ActionDropdown
                    type="bol"
                    onViewConfirmation={() => setShowConfirmationModal(true)}
                    onViewBol={() => setShowBolModal(true)}
                    onSendERate={() => {
                      alert("Sending e-rate confirmation...");
                    }}
                    uploadedBolDocument={latestUploadedBol}
                    uploadedPodDocument={latestUploadedPod}
                    onViewUploadedDocument={handleViewDocument}
                  />
                </div>
                <button
                  onClick={handleSendCompletionPacket}
                  disabled={isSendingEmail}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                  title="Email all load documents to assigned driver and consignee"
                >
                  <Mail className="w-4 h-4" />
                  {isSendingEmail
                    ? "Sending Docs..."
                    : "Email Docs to Driver & Consignee"}
                </button>
                <button
                  onClick={() => setShowConfirmationModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F96176] text-white text-sm font-medium rounded-md hover:bg-[#F96176] transition shadow-sm"
                >
                  Customer Confirmation
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
              {TABS.map((tab) => {
                const count =
                  tab.id === "uploaded-docs"
                    ? uploadedDocumentsList.length
                    : null;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 px-1 flex items-center gap-2
                    ${
                      activeTab === tab.id
                        ? "border-[#F96176] text-[#F96176]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {count !== null && count > 0 && (
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          activeTab === tab.id
                            ? "bg-[#F96176] text-white"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* --- SUMMARY METRICS BAR --- */}
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <div className="flex overflow-x-auto pb-1 hide-scrollbar items-center">
              <MetricItem label="Revenue" value={loadData.revenue} isCurrency />
              <MetricItem label="Profit" value={loadData.profit} isCurrency />
              <MetricItem
                label="Rate"
                value={`${loadData.ratePerMile} per mile`}
              />
              <MetricItem
                label="Flat Rate"
                value={loadData.flatRate}
                isCurrency
              />
              <MetricItem label="Loaded Miles" value={loadData.loadedMiles} />
              <MetricItem
                label="Detention Tracked"
                value={loadData.detentionTracked}
              />
              <MetricItem label="Qty" value={loadData.quantity} />
              <MetricItem label="Weight" value={`${loadData.weight} lbs`} />
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
                {/* 1. Load Details */}
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
                      <InputField
                        value={dbLoad?.loadNumber || loadDocId || "-"}
                        disabled
                      />
                    </div>
                    <div>
                      <FormLabel>Load Status</FormLabel>
                      <SelectField
                        value={loadData.status}
                        options={loadStatusOptions}
                        onChange={handleStatusChange}
                      />
                    </div>
                    <div>
                      <FormLabel>Load Type</FormLabel>
                      <InputField value={dbLoad?.type || "-"} disabled />
                    </div>

                    {/* Row 2 */}
                    <div className="md:col-span-2 xl:col-span-3">
                      <FormLabel required>Customer</FormLabel>
                      <InputField
                        value={
                          dbLoad?.customerSearch || dbLoad?.customerName || "-"
                        }
                        disabled
                      />
                    </div>

                    {/* Row 3 */}
                    <div>
                      <FormLabel>Booking Office</FormLabel>
                      <InputField
                        value={dbLoad?.bookingOffice || "-"}
                        disabled
                      />
                    </div>
                    <div>
                      <FormLabel>Booking Authority</FormLabel>
                      <InputField
                        value={dbLoad?.bookingAuthority || "-"}
                        disabled
                      />
                    </div>
                    <div>
                      <FormLabel>Primary Fees</FormLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 text-sm">
                          $
                        </span>
                        <InputField
                          value={
                            dbLoad?.primaryFees !== undefined
                              ? String(dbLoad.primaryFees)
                              : "-"
                          }
                          className="pl-6"
                          disabled
                        />
                      </div>
                    </div>

                    {/* Row 4 */}
                    <div>
                      <FormLabel>Fee Type</FormLabel>
                      <InputField value={dbLoad?.feeType || "-"} disabled />
                    </div>
                    <div>
                      <FormLabel>Tendered Miles</FormLabel>
                      <InputField
                        value={
                          dbLoad?.tenderedMiles
                            ? `${dbLoad.tenderedMiles} Miles`
                            : "-"
                        }
                        disabled
                      />
                    </div>
                    <div>
                      <FormLabel>Fuel Surcharge Type</FormLabel>
                      <InputField value={dbLoad?.fuelSrcType || "-"} disabled />
                    </div>

                    {/* Row 5 */}
                    <div>
                      <FormLabel>Fuel Surcharge ($)</FormLabel>
                      <InputField
                        value={
                          dbLoad?.fuelSurcharge !== undefined
                            ? `$${dbLoad.fuelSurcharge}`
                            : dbLoad?.fuelSrc
                            ? `$${dbLoad.fuelSrc}`
                            : "-"
                        }
                        disabled
                      />
                    </div>
                    <div>
                      <FormLabel>Target Rate ($)</FormLabel>
                      <InputField
                        value={
                          dbLoad?.targetRate !== undefined
                            ? `$${dbLoad.targetRate}`
                            : "-"
                        }
                        disabled
                      />
                    </div>
                    <div>
                      <FormLabel>Equipment / Van Type</FormLabel>
                      <InputField value={dbLoad?.vanType || "-"} disabled />
                    </div>

                    {/* Row 6 */}
                    <div>
                      <FormLabel>Temperature</FormLabel>
                      <InputField value={dbLoad?.temperature || "-"} disabled />
                    </div>
                    <div>
                      <FormLabel>Length</FormLabel>
                      <InputField
                        value={dbLoad?.length ? `${dbLoad.length} ft` : "-"}
                        disabled
                      />
                    </div>
                    <div>
                      <FormLabel>Weight (Lbs)</FormLabel>
                      <InputField
                        value={dbLoad?.weight ? `${dbLoad.weight} lbs` : "-"}
                        disabled
                      />
                    </div>

                    {/* Row 7 */}
                    <div>
                      <FormLabel>Commodity</FormLabel>
                      <InputField value={dbLoad?.commodity || "-"} disabled />
                    </div>
                    <div>
                      <FormLabel>Declared Value ($)</FormLabel>
                      <InputField
                        value={
                          dbLoad?.declaredValue
                            ? `$${dbLoad.declaredValue}`
                            : "-"
                        }
                        disabled
                      />
                    </div>
                    <div>
                      <FormLabel>Sales Agent</FormLabel>
                      <InputField value={dbLoad?.salesAgent || "-"} disabled />
                    </div>

                    {/* Row 8 */}
                    <div>
                      <FormLabel>Booking Terminal</FormLabel>
                      <InputField
                        value={dbLoad?.bookingTerminalOffice || "-"}
                        disabled
                      />
                    </div>
                    <div>
                      <FormLabel>Agency</FormLabel>
                      <InputField value={dbLoad?.agency || "-"} disabled />
                    </div>
                    <div>
                      <FormLabel>Brokerage Agent</FormLabel>
                      <InputField
                        value={dbLoad?.brokerageAgent || "-"}
                        disabled
                      />
                    </div>

                    {/* Row 9 */}
                    <div className="md:col-span-2 xl:col-span-3">
                      <FormLabel>Yard Location</FormLabel>
                      <InputField
                        value={dbLoad?.yardLocation || "-"}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Equipment & Driver Assignment */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                      Equipment & Driver Assignment
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">
                      {dbLoad?.assignmentType === "carrier"
                        ? "Third-Party Carrier"
                        : "In-House Fleet"}
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {dbLoad?.assignmentType === "carrier" ? (
                      <>
                        <div>
                          <FormLabel>Carrier Name</FormLabel>
                          <InputField
                            value={
                              carrierProfile?.companyName ||
                              carrierProfile?.name ||
                              dbLoad?.carrierId ||
                              "-"
                            }
                            disabled
                          />
                        </div>
                        <div>
                          <FormLabel>Carrier Pay</FormLabel>
                          <InputField
                            value={formatCurrency(dbLoad?.totalCarrierPay)}
                            disabled
                          />
                        </div>
                        <div>
                          <FormLabel>Driver Name</FormLabel>
                          <InputField
                            value={dbLoad?.driverName || "-"}
                            disabled
                          />
                        </div>
                        <div>
                          <FormLabel>Truck #</FormLabel>
                          <InputField value={dbLoad?.truckId || "-"} disabled />
                        </div>
                        <div>
                          <FormLabel>Trailer #</FormLabel>
                          <InputField
                            value={dbLoad?.trailerId || "-"}
                            disabled
                          />
                        </div>
                        <div>
                          <FormLabel>Dispatcher</FormLabel>
                          <InputField
                            value={dbLoad?.dispatcherId || "-"}
                            disabled
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <FormLabel>Primary Driver</FormLabel>
                          <InputField
                            value={driverLabel || dbLoad?.driverId || "-"}
                            disabled
                          />
                        </div>
                        <div>
                          <FormLabel>Co-Driver</FormLabel>
                          <InputField
                            value={secondDriverLabel || "-"}
                            disabled
                          />
                        </div>
                        <div>
                          <FormLabel>Truck</FormLabel>
                          <InputField
                            value={truckLabel || dbLoad?.truckId || "-"}
                            disabled
                          />
                        </div>
                        <div>
                          <FormLabel>Trailer</FormLabel>
                          <InputField
                            value={trailerLabel || dbLoad?.trailerId || "-"}
                            disabled
                          />
                        </div>
                        <div>
                          <FormLabel>Trailer Type</FormLabel>
                          <InputField
                            value={dbLoad?.trailerType || "-"}
                            disabled
                          />
                        </div>
                        <div>
                          <FormLabel>Dispatcher</FormLabel>
                          <InputField
                            value={dbLoad?.dispatcherId || "-"}
                            disabled
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Financials Breakdown */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                      Financials Breakdown
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                          Line Haul
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(dbLoad?.lineHaul)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                          Fuel Surcharge
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(dbLoad?.fuelSurcharge)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                          Detention
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(dbLoad?.detention)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                          Layover
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(dbLoad?.layover)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                          TONU
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(dbLoad?.tonu)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                          Accessorials
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(dbLoad?.accessorials)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                        <span className="text-xs font-bold">
                          Total Customer Rate
                        </span>
                        <span className="text-sm font-black">
                          {formatCurrency(
                            dbLoad?.totalCustomerRate ||
                              Number(dbLoad?.lineHaul || 0) +
                                Number(dbLoad?.fuelSurcharge || 0) +
                                Number(dbLoad?.detention || 0) +
                                Number(dbLoad?.layover || 0) +
                                Number(dbLoad?.tonu || 0) +
                                Number(dbLoad?.accessorials || 0)
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 text-rose-900 border border-rose-200">
                        <span className="text-xs font-bold">
                          Total Carrier / Driver Pay
                        </span>
                        <span className="text-sm font-black">
                          {formatCurrency(dbLoad?.totalCarrierPay)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                        <span className="text-xs font-bold">Net Profit</span>
                        <span className="text-sm font-black">
                          {loadData.profit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Automation Settings */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                      Automation Settings
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="font-medium text-gray-700">
                        Auto Send Driver
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          dbLoad?.autoSendDriver
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {dbLoad?.autoSendDriver ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="font-medium text-gray-700">
                        Auto Track
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          dbLoad?.autoTrack
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {dbLoad?.autoTrack ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="font-medium text-gray-700">
                        Auto Invoice
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          dbLoad?.autoInvoice
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {dbLoad?.autoInvoice ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Notes */}
                {(dbLoad?.customerLoadNotes ||
                  dbLoad?.dispatchNotes ||
                  dbLoad?.internalNotes) && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                      <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                        Notes
                      </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dbLoad?.customerLoadNotes && (
                        <div>
                          <FormLabel>Customer Load Notes</FormLabel>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap">
                            {dbLoad.customerLoadNotes}
                          </div>
                        </div>
                      )}
                      {dbLoad?.dispatchNotes && (
                        <div>
                          <FormLabel>Dispatch Notes</FormLabel>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap">
                            {dbLoad.dispatchNotes}
                          </div>
                        </div>
                      )}
                      {dbLoad?.internalNotes && (
                        <div className="md:col-span-2">
                          <FormLabel>Internal Notes</FormLabel>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap">
                            {dbLoad.internalNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: DISPATCH, ACTIONS, STOPS (40%) */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
                {/* Header: Shipper/Consignee */}
                <div className="flex items-center justify-between pb-1">
                  <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                    Shipper / Consignee
                  </h2>
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
                          title={
                            dbLoad?.assignmentType === "carrier"
                              ? carrierProfile?.companyName ||
                                carrierProfile?.name ||
                                dbLoad?.carrierId ||
                                "Carrier"
                              : "In-House Fleet"
                          }
                        >
                          {dbLoad?.assignmentType === "carrier"
                            ? carrierProfile?.companyName ||
                              carrierProfile?.name ||
                              dbLoad?.carrierId ||
                              "Carrier"
                            : "In-House Fleet"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase block mb-0.5">
                          Vehicle
                        </span>
                        <span
                          className="font-bold text-gray-900 block truncate text-xs sm:text-sm"
                          title={
                            truckLabel !== "-"
                              ? truckLabel
                              : dbLoad?.truckId || "-"
                          }
                        >
                          {truckLabel !== "-"
                            ? truckLabel
                            : dbLoad?.truckId || "-"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase block mb-0.5">
                          Trailer
                        </span>
                        <span
                          className="font-bold text-gray-900 block truncate text-xs sm:text-sm"
                          title={
                            trailerLabel !== "-"
                              ? trailerLabel
                              : dbLoad?.trailerId || "-"
                          }
                        >
                          {trailerLabel !== "-"
                            ? trailerLabel
                            : dbLoad?.trailerId || "-"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase block mb-0.5">
                          Driver
                        </span>
                        <span
                          className="font-bold text-gray-900 block truncate text-xs sm:text-sm mb-1"
                          title={
                            dbLoad?.assignmentType === "carrier"
                              ? dbLoad?.driverName || "-"
                              : driverLabel !== "-"
                              ? driverLabel
                              : dbLoad?.driverName || "-"
                          }
                        >
                          {dbLoad?.assignmentType === "carrier"
                            ? dbLoad?.driverName || "-"
                            : driverLabel !== "-"
                            ? driverLabel
                            : dbLoad?.driverName || "-"}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            className="p-1 hover:bg-rose-50 rounded text-[#F96176]"
                            title="Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1 hover:bg-green-50 rounded text-green-500"
                            title="Phone"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                            title="Chat"
                          >
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
                    onViewBol={() => setShowBolModal(true)}
                    onViewConfirmation={() => setShowConfirmationModal(true)}
                    onSendERate={() => setShowConfirmationModal(true)}
                  />

                  <ActionDropdown
                    type="load-sheet"
                    onViewLoadSheet={() => setShowLoadSheetModal(true)}
                    onViewSwarnSheet={() => setShowLoadSheetModal(true)}
                    onViewLoadDriverSheet={() => setShowDriverSheetModal(true)}
                  />

                  <button
                    onClick={() => setShowCheckCallModal(true)}
                    className="flex items-center justify-center gap-2 px-2 py-3 bg-[#F96176] border border-[#F96176] rounded-md text-xs font-bold text-white hover:bg-[#F96176]/90 transition-all shadow-sm group"
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
                    {stops.map((stop, index) => {
                      const isPickup = stop.type === "PICKUP";
                      const accentColor = isPickup
                        ? "border-l-[#22c55e]"
                        : "border-l-[#F96176]";
                      const headerBg = isPickup
                        ? "bg-green-50/40"
                        : "bg-[#F96176]/10";
                      const textColor = isPickup
                        ? "text-green-700"
                        : "text-[#F96176]";
                      const iconColor = isPickup
                        ? "text-green-600"
                        : "text-[#F96176]";

                      return (
                        <div
                          key={`stop-${index}`}
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
                                    : "text-[#F96176] border-[#F96176]/30"
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
                                {stop.address}
                              </p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs border-t border-gray-50 pt-2">
                              <div>
                                <span className="text-gray-400 block uppercase text-[9px]">
                                  Contact
                                </span>
                                <span
                                  className="font-medium text-gray-800 truncate block"
                                  title={stop.contact}
                                >
                                  {stop.contact}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block uppercase text-[9px]">
                                  Ref #
                                </span>
                                <span
                                  className="font-medium text-gray-800 truncate block"
                                  title={stop.puNumber || stop.soNumber || "-"}
                                >
                                  {stop.puNumber || stop.soNumber || "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 col-span-2 bg-gray-50 rounded p-1.5 border border-gray-100 flex-wrap">
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
                            {stop.instructions && stop.instructions !== "-" && (
                              <div className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2">
                                {stop.instructions}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {stops.length === 0 && (
                      <div className="text-xs text-gray-400 italic bg-white p-4 rounded-lg border border-gray-200">
                        No stops recorded for this load.
                      </div>
                    )}
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
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-gray-50/80 transition-colors group overflow-visible"
                      >
                        {/* ACTIONS */}
                        <td className="px-6 py-4 text-center relative overflow-visible">
                          <DocumentActionsDropdown
                            loadDocument={doc}
                            onDownload={handleDownloadDocument}
                            onView={handleViewDocument}
                          />
                        </td>

                        {/* VIEW */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewDocument(doc)}
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
                    {documents.length === 0 && (
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

          {activeTab === "uploaded-docs" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Top Filter and Search Bar */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#F96176]" />
                      Uploaded Documents
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F96176]/10 text-[#F96176]">
                        {uploadedDocumentsList.length} Total
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Documents uploaded by the driver or dispatch team for this
                      load.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-72">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={uploadedSearchQuery}
                        onChange={(e) => setUploadedSearchQuery(e.target.value)}
                        placeholder="Search document name, type..."
                        className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-1 focus:ring-[#F96176] focus:border-[#F96176] outline-none"
                      />
                      {uploadedSearchQuery && (
                        <button
                          onClick={() => setUploadedSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 overflow-x-auto pb-1 hide-scrollbar text-xs">
                  <span className="text-gray-400 font-medium whitespace-nowrap flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5" /> Filter:
                  </span>
                  {[
                    { key: "all", label: "All Docs" },
                    { key: "bol", label: "BOL" },
                    { key: "pod", label: "POD" },
                    { key: "damage-photos", label: "Damage Photos" },
                    { key: "scale-ticket", label: "Scale Ticket" },
                    { key: "lumper", label: "Lumper Receipt" },
                    { key: "rate-confirmation", label: "Rate Conf." },
                    { key: "other", label: "Other" },
                  ].map((item) => {
                    const isSelected = uploadedCategoryFilter === item.key;
                    const count =
                      item.key === "all"
                        ? uploadedDocumentsList.length
                        : uploadedDocumentsList.filter((doc) => {
                            const typeKey = (doc.type || "")
                              .toLowerCase()
                              .trim();
                            const filterKey = item.key.toLowerCase().trim();
                            return (
                              typeKey === filterKey ||
                              typeKey.replace(/-/g, "") ===
                                filterKey.replace(/-/g, "") ||
                              (filterKey === "bol" &&
                                (typeKey === "bill-of-lading" ||
                                  typeKey === "bol")) ||
                              (filterKey === "pod" &&
                                (typeKey === "proof-of-delivery" ||
                                  typeKey === "pod")) ||
                              (filterKey === "lumper" &&
                                (typeKey === "lumper-receipt" ||
                                  typeKey === "lumper")) ||
                              (filterKey === "damage-photos" &&
                                (typeKey === "damage-photo" ||
                                  typeKey === "damage-photos")) ||
                              (filterKey === "rate-confirmation" &&
                                (typeKey === "rate-confirmation" ||
                                  typeKey === "rate-conf"))
                            );
                          }).length;

                    return (
                      <button
                        key={item.key}
                        onClick={() => setUploadedCategoryFilter(item.key)}
                        className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#F96176] text-white shadow-sm"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <span>{item.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-white text-gray-600 border border-gray-200"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table List View */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100/70 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                        <th className="px-6 py-4 w-[140px] text-center">
                          Actions
                        </th>
                        <th className="px-6 py-4">Document Details</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Uploaded By</th>
                        <th className="px-6 py-4">Uploaded Date</th>
                        <th className="px-6 py-4 text-right">File Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredUploadedDocs.map((docItem) => {
                        const categoryBadge = getDocTypeCategoryBadge(
                          docItem.type
                        );
                        const isImage = isImageDocument(docItem);
                        const isPdf = isPdfDocument(docItem);
                        const formattedDate = docItem.createdAt?.seconds
                          ? new Date(
                              docItem.createdAt.seconds * 1000
                            ).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            })
                          : "-";

                        return (
                          <tr
                            key={docItem.id}
                            className="hover:bg-gray-50/80 transition-colors group"
                          >
                            {/* ACTIONS */}
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setPreviewUploadedDoc(docItem)}
                                  title="Preview Document"
                                  className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-md border border-blue-200 hover:border-blue-600 transition shadow-xs"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDownloadUploadedDoc(docItem)
                                  }
                                  title="Download Document"
                                  className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-md border border-emerald-200 hover:border-emerald-600 transition shadow-xs"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                {docItem.url && (
                                  <a
                                    href={docItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open in new tab"
                                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-200 transition"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* DOCUMENT DETAILS */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                                    isImage
                                      ? "bg-sky-50 border-sky-200 text-sky-600"
                                      : isPdf
                                      ? "bg-rose-50 border-rose-200 text-rose-600"
                                      : "bg-gray-100 border-gray-200 text-gray-600"
                                  }`}
                                >
                                  {isImage ? (
                                    <FileImage className="w-5 h-5" />
                                  ) : isPdf ? (
                                    <FileText className="w-5 h-5" />
                                  ) : (
                                    <File className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <button
                                    onClick={() =>
                                      setPreviewUploadedDoc(docItem)
                                    }
                                    className="text-sm font-semibold text-gray-900 hover:text-[#F96176] transition-colors text-left truncate block max-w-xs md:max-w-md"
                                    title={docItem.name || "Document"}
                                  >
                                    {docItem.name || "Untitled Document"}
                                  </button>
                                  <span className="text-xs text-gray-400 block mt-0.5 font-mono">
                                    ID: {docItem.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* CATEGORY */}
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryBadge.bg}`}
                              >
                                {categoryBadge.label}
                              </span>
                            </td>

                            {/* UPLOADED BY */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                    docItem.uploadedByRole === "driver"
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : "bg-purple-50 text-purple-800 border-purple-200"
                                  }`}
                                >
                                  {docItem.uploadedByRole === "driver"
                                    ? "Driver"
                                    : "Admin / Owner"}
                                </span>
                                {docItem.uploadedByName && (
                                  <span className="text-xs text-gray-600">
                                    {docItem.uploadedByName}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* UPLOADED DATE */}
                            <td className="px-6 py-4 text-xs text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span>{formattedDate}</span>
                              </div>
                            </td>

                            {/* FILE SIZE */}
                            <td className="px-6 py-4 text-right text-xs font-semibold text-gray-700">
                              {formatDocFileSize(docItem.size)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* EMPTY STATE */}
                      {filteredUploadedDocs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center">
                            <div className="max-w-sm mx-auto flex flex-col items-center">
                              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                                <FileText className="w-7 h-7" />
                              </div>
                              <h3 className="text-sm font-bold text-gray-900 mb-1">
                                {uploadedDocumentsList.length === 0
                                  ? "No Uploaded Documents"
                                  : "No matching documents found"}
                              </h3>
                              <p className="text-xs text-gray-500 leading-relaxed">
                                {uploadedDocumentsList.length === 0
                                  ? "Documents uploaded by the driver on mobile or uploaded during dispatch will appear here for preview and download."
                                  : "Try adjusting your search query or filter category."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Uploaded Document Preview Modal */}
              {previewUploadedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#F96176]/10 text-[#F96176] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3
                            className="text-sm font-bold text-gray-900 truncate"
                            title={previewUploadedDoc.name}
                          >
                            {previewUploadedDoc.name || "Document Preview"}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span>
                              {
                                getDocTypeCategoryBadge(previewUploadedDoc.type)
                                  .label
                              }
                            </span>
                            <span>•</span>
                            <span>
                              {formatDocFileSize(previewUploadedDoc.size)}
                            </span>
                            {previewUploadedDoc.uploadedByRole && (
                              <>
                                <span>•</span>
                                <span className="capitalize">
                                  By{" "}
                                  {previewUploadedDoc.uploadedByName ||
                                    previewUploadedDoc.uploadedByRole}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            handleDownloadUploadedDoc(previewUploadedDoc)
                          }
                          className="px-3 py-1.5 bg-[#F96176] text-white text-xs font-semibold rounded-md hover:bg-[#F96176]/90 transition shadow-sm flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                        {previewUploadedDoc.url && (
                          <a
                            href={previewUploadedDoc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-100 transition shadow-xs flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Open in New
                            Tab
                          </a>
                        )}
                        <button
                          onClick={() => setPreviewUploadedDoc(null)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Modal Body Preview */}
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex items-center justify-center bg-gray-100/50 min-h-[400px] max-h-[70vh]">
                      {isImageDocument(previewUploadedDoc) &&
                      previewUploadedDoc.url ? (
                        <img
                          src={previewUploadedDoc.url}
                          alt={previewUploadedDoc.name || "Preview"}
                          className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md border border-gray-200"
                        />
                      ) : isPdfDocument(previewUploadedDoc) &&
                        previewUploadedDoc.url ? (
                        <iframe
                          src={`${previewUploadedDoc.url}#toolbar=1`}
                          title={previewUploadedDoc.name || "PDF Document"}
                          className="w-full h-[65vh] rounded-lg border border-gray-200 shadow-sm bg-white"
                        />
                      ) : (
                        <div className="text-center py-12 px-6">
                          <File className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                          <h4 className="text-base font-bold text-gray-800 mb-1">
                            Preview Not Available
                          </h4>
                          <p className="text-xs text-gray-500 max-w-sm mb-4">
                            This file type cannot be previewed directly in the
                            browser. You can download or open it in a new
                            window.
                          </p>
                          <button
                            onClick={() =>
                              handleDownloadUploadedDoc(previewUploadedDoc)
                            }
                            className="px-4 py-2 bg-[#F96176] text-white text-xs font-semibold rounded-md hover:bg-[#F96176]/90 transition"
                          >
                            Download File
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
        loadData={loadDataWithStops}
        autoAction={autoAction}
        onAutoActionComplete={handleAutoActionComplete}
      />

      <DocumentViewModal
        title="Bill of Lading"
        isOpen={showBolModal}
        onClose={() => setShowBolModal(false)}
        type="bol"
        loadData={loadDataWithStops}
        autoAction={autoAction}
        onAutoActionComplete={handleAutoActionComplete}
      />

      <DocumentViewModal
        title="Load Sheet"
        isOpen={showLoadSheetModal}
        onClose={() => setShowLoadSheetModal(false)}
        type="load-sheet"
        loadData={loadDataWithStops}
        autoAction={autoAction}
        onAutoActionComplete={handleAutoActionComplete}
      />

      <DocumentViewModal
        title="Driver Sheet"
        isOpen={showDriverSheetModal}
        onClose={() => setShowDriverSheetModal(false)}
        type="driver-sheet"
        loadData={loadDataWithStops}
        autoAction={autoAction}
        onAutoActionComplete={handleAutoActionComplete}
      />

      <DocumentViewModal
        title="Proof of Delivery"
        isOpen={showPodModal}
        onClose={() => setShowPodModal(false)}
        type="pod"
        loadData={loadDataWithStops}
        autoAction={autoAction}
        onAutoActionComplete={handleAutoActionComplete}
      />

      <DocumentViewModal
        title="Insurance Certificate"
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        type="insurance"
        loadData={loadDataWithStops}
        autoAction={autoAction}
        onAutoActionComplete={handleAutoActionComplete}
      />

      {/* Check Call Modal */}
      <CheckCallModal
        isOpen={showCheckCallModal}
        onClose={() => setShowCheckCallModal(false)}
        onSave={handleSaveCheckCall}
      />
      <DocumentViewModal
        title="Load Information"
        isOpen={showLoadInfoModal}
        onClose={() => setShowLoadInfoModal(false)}
        type="view-load-info"
        loadData={loadDataWithStops}
        autoAction={autoAction}
        onAutoActionComplete={handleAutoActionComplete}
      />
    </>
  );
}
