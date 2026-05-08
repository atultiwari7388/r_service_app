/* eslint-disable @next/next/no-img-element */
"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  useRef,
  useCallback,
} from "react";
import {
  Truck,
  User,
  Package,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  Save,
  X,
  Search,
  UploadCloud,
  ChevronDown,
  LucideIcon,
  Eye,
  FileImage,
  MapPin,
  Fuel,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { GlobalToastError } from "@/utils/globalErrorToast";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";

// --- Type Definitions ---

interface Stop {
  id: number;
  // Basic Info
  company: string;
  customerLoadRefConf: string;

  // Location & Timing
  locationNotes: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  stopType: string; // For "Stop pickup" or "Stop delivery"
  hasAppointment: boolean;

  // Load Details
  totalQty: string;
  qtyType: string;
  totalWeight: string;
  commodity: string;
  length: string; // in inches
  width: string; // in inches
  height: string; // in inches
  pickup: string;
  shipmentBol: string;
  poNumber: string;

  // Reefer & Equipment (Pickup only)
  reeferMode: string;
  routeName: string;
  instructions: string;
  seal: string;
  container: string;
  chassis: string;
  customerTrailer: string;
  pro: string;
  reeferFuelLevel: string;

  // Split Load
  splitLoad: string;
  yardLocation: string;

  // Original fields kept for compatibility
  contactPerson: string;
  phone: string;
  address: string;
  type: "FCFS" | "Appt" | "Window";
  pickupNumber: string;
  loadNumber: string;
  notes: string;
}

interface DocumentFile {
  id: string;
  name: string;
  type:
    | "rate-confirmation"
    | "bol"
    | "pod"
    | "damage-photos"
    | "scale-ticket"
    | "lumper";
  file?: File;
  previewUrl?: string;
  size?: number;
}

interface FormData {
  // 1. Customer & Load Header
  bookingOffice: string;
  customerSearch: string;
  customerName: string;
  primaryFees: number;
  feeType: string;
  tenderedMiles: string;
  fuelSrcType: string;
  fuelSrc: string;
  targetRate: number;
  vanType: string;
  temperature: string;
  length: string;
  weight: string;
  bookingAuthority: string;
  commodity: string;
  type: string;
  declaredValue: string;
  salesAgent: string;
  bookingTerminalOffice: string;
  agency: string;
  brokerageAgent: string;
  customerLoadNotes: string;
  dispatchNotes: string;
  yardLocation: string; // New field
  internalNotes: string; // New field

  // 2. Pickups (Array)
  pickups: Stop[];

  // 3. Deliveries (Array)
  deliveries: Stop[];

  // 4. Equipment
  driverId: string;
  secondDriverId: string;
  truckId: string;
  trailerId: string;
  trailerType: string;
  dispatcherId: string;
  carrierId: string;

  // 5. Rates
  lineHaul: number;
  fuelSurcharge: number;
  detention: number;
  layover: number;
  tonu: number;
  accessorials: number;
  totalCustomerRate: number;
  totalCarrierPay: number;

  // 6. Automation
  autoSendDriver: boolean;
  autoTrack: boolean;
  autoInvoice: boolean;

  // 7. Status
  status: string;

  assignmentType: "carrier" | "driver" | "";
  carrierPay: number;

  // 8. Documents
  documents: DocumentFile[];
}

interface Option {
  value: string;
  label: string;
}

interface SettingsEntity {
  id: string;
  name?: string;
  companyName?: string;
  address?: string;
  yardLocation?: string;
}

interface Calculations {
  totalRevenue: number;
  estimatedProfit: number;
  margin: number;
}

interface DriverOption {
  id: string;
  name: string;
  active: boolean;
}

interface AssignedVehicle {
  id: string;
  companyName: string;
  vehicleNumber: string;
  vehicleType: string;
}

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  colorClass?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  colorClass = "text-blue-600",
}) => (
  <div className="flex items-center gap-2 border-b pb-2 mb-4 mt-2">
    <Icon className={`w-5 h-5 ${colorClass}`} />
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

interface InputGroupProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon;
}

const InputGroup: React.FC<InputGroupProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  disabled = false,
  icon: Icon,
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          disabled ? "bg-gray-50 cursor-not-allowed" : ""
        } ${Icon ? "pl-9" : ""}`}
      />
    </div>
  </div>
);

interface SelectGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  className?: string;
}

const SelectGroup: React.FC<SelectGroupProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  className = "",
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
      {label}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

interface SearchableSelectGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  showCreateButton?: boolean;
  createTooltip?: string;
  onCreateClick?: () => void;
}

const SearchableSelectGroup: React.FC<SearchableSelectGroupProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  className = "",
  showCreateButton = false,
  createTooltip = "Create",
  onCreateClick,
}) => {
  const listId = `${name}-options`;
  const [isOpen, setIsOpen] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const normalizedValue = value.toLowerCase().trim();
  const filteredOptions = (
    showAllOptions
      ? options
      : options.filter((opt) => {
          const optionValue = opt.value.toLowerCase();
          const optionLabel = opt.label.toLowerCase();
          return (
            !normalizedValue ||
            optionValue.includes(normalizedValue) ||
            optionLabel.includes(normalizedValue)
          );
        })
  ).slice(0, 12);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowAllOptions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectOption = (selectedValue: string) => {
    onChange({
      target: { name, value: selectedValue },
    } as ChangeEvent<HTMLInputElement>);
    setIsOpen(false);
    setShowAllOptions(false);
  };

  return (
    <div className={`flex flex-col ${className}`} ref={wrapperRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">
          {label}
        </label>
        {showCreateButton && (
          <button
            type="button"
            onClick={onCreateClick}
            title={createTooltip}
            className="h-5 w-5 rounded-full bg-[#F96176] hover:bg-[#f74f67] text-white flex items-center justify-center transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e);
            setIsOpen(true);
            setShowAllOptions(false);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || "Type to search or select..."}
          autoComplete="off"
          className="w-full rounded-md border border-gray-300 pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setShowAllOptions(true);
            setIsOpen((prev) => !prev);
          }}
          className="absolute right-2 top-1.5 p-1 rounded hover:bg-gray-100"
          aria-label={`Toggle ${label} options`}
        >
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div
            id={listId}
            className="absolute z-40 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
          >
            <div className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={`${name}-${opt.value}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectOption(opt.value)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      opt.value === value
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    title={opt.label}
                  >
                    {opt.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface TextAreaGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const TextAreaGroup: React.FC<TextAreaGroupProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
      {label}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
    />
  </div>
);

interface CheckboxGroupProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  name,
  checked,
  onChange,
}) => (
  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
      id={name}
    />
    <label
      htmlFor={name}
      className="text-sm text-gray-700 select-none cursor-pointer"
    >
      {label}
    </label>
  </div>
);

interface FileUploadBoxProps {
  label: string;
  type:
    | "rate-confirmation"
    | "bol"
    | "pod"
    | "damage-photos"
    | "scale-ticket"
    | "lumper";
  onFileUpload: (type: string, file: File) => void;
}

const FileUploadBox: React.FC<FileUploadBoxProps> = ({
  label,
  type,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Upload each file
      Array.from(files).forEach((file) => {
        onFileUpload(type, file);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/") || file.type === "application/pdf") {
          onFileUpload(type, file);
        }
      });
    }
  };

  return (
    <div className="relative">
      <div
        className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer group h-full min-h-[120px] flex flex-col justify-center ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:bg-blue-50 hover:border-blue-300"
        }`}
        onClick={handleFileSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud
          className={`w-6 h-6 mx-auto mb-2 ${
            isDragging
              ? "text-blue-500"
              : "text-gray-400 group-hover:text-blue-500"
          }`}
        />
        <p className="text-xs font-medium text-gray-600 leading-tight line-clamp-2">
          {label}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          Drag & drop or click to select multiple
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          multiple // Add multiple attribute
        />
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-600",
    Posted: "bg-blue-100 text-blue-700",
    Assigned: "bg-purple-100 text-purple-700",
    "In Transit": "bg-yellow-100 text-yellow-800",
    Delivered: "bg-green-100 text-green-700",
    Completed: "bg-emerald-100 text-emerald-800",
    "Completed Toun": "bg-teal-100 text-teal-800",
    Cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
        styles[status] || styles["Draft"]
      }`}
    >
      {status}
    </span>
  );
};

// --- Image Preview Modal Component ---
interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  imageUrl,
  onClose,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 p-2"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="bg-white rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-auto max-h-[80vh] object-contain"
          />
          <div className="p-4 bg-white border-t">
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function CreateNewLoadPage() {
  // --- State Management ---
  const { user, isLoading } = useAuth() || { user: null, isLoading: false };
  const [isCancelled, setIsCancelled] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [autoFillDeliveries, setAutoFillDeliveries] = useState(true);
  const [effectiveUserId, setEffectiveUserId] = useState("");
  const [isResolvingUser, setIsResolvingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicCustomerOptions, setDynamicCustomerOptions] = useState<
    Option[]
  >([]);
  const [dynamicBookingAuthorityOptions, setDynamicBookingAuthorityOptions] =
    useState<Option[]>([]);
  const [dynamicSalesAgentOptions, setDynamicSalesAgentOptions] = useState<
    Option[]
  >([]);
  const [dynamicOfficeOptions, setDynamicOfficeOptions] = useState<Option[]>(
    []
  );
  const [dynamicAgentOptions, setDynamicAgentOptions] = useState<Option[]>([]);
  const [dynamicCarrierOptions, setDynamicCarrierOptions] = useState<Option[]>(
    []
  );
  const [dynamicShipperConsigneeOptions, setDynamicShipperConsigneeOptions] =
    useState<Option[]>([]);
  const [dynamicYardLocationOptions, setDynamicYardLocationOptions] = useState<
    Option[]
  >([]);
  const [shipperConsigneeAddressByName, setShipperConsigneeAddressByName] =
    useState<Record<string, string>>({});
  const [driverOptions, setDriverOptions] = useState<Option[]>([]);
  const [driverVehiclesById, setDriverVehiclesById] = useState<
    Record<string, AssignedVehicle[]>
  >({});

  const [formData, setFormData] = useState<FormData>({
    // 1. Customer & Load Header
    bookingOffice: "",
    customerSearch: "",
    customerName: "",
    primaryFees: 0,
    feeType: "Line Haul",
    tenderedMiles: "",
    fuelSrcType: "Included",
    fuelSrc: "",
    targetRate: 0,
    vanType: "Van Or Reefer",
    temperature: "",
    length: "53",
    weight: "",
    bookingAuthority: "Direct",
    commodity: "",
    type: "FTL",
    declaredValue: "",
    salesAgent: "",
    bookingTerminalOffice: "",
    agency: "",
    brokerageAgent: "",
    customerLoadNotes: "",
    dispatchNotes: "",
    yardLocation: "", // New field
    internalNotes: "", // New field

    // 2. Pickups (Array)
    pickups: [
      {
        id: 1,
        company: "",
        customerLoadRefConf: "",
        locationNotes: "",
        date: "",
        timeStart: "",
        timeEnd: "",
        stopType: "live-load",
        hasAppointment: false,
        totalQty: "",
        qtyType: "pallets",
        totalWeight: "",
        commodity: "",
        length: "",
        width: "",
        height: "",
        pickup: "",
        shipmentBol: "",
        poNumber: "",
        reeferMode: "",
        routeName: "",
        instructions: "",
        seal: "",
        container: "",
        chassis: "",
        customerTrailer: "",
        pro: "",
        reeferFuelLevel: "",
        splitLoad: "",
        yardLocation: "",
        contactPerson: "",
        phone: "",
        address: "",
        type: "FCFS",
        pickupNumber: "",
        loadNumber: "",
        notes: "",
      },
    ],

    // 3. Deliveries (Array)
    deliveries: [
      {
        id: 1,
        company: "",
        customerLoadRefConf: "",
        locationNotes: "",
        date: "",
        timeStart: "",
        timeEnd: "",
        stopType: "live-load",
        hasAppointment: false,
        totalQty: "",
        qtyType: "pallets",
        totalWeight: "",
        commodity: "",
        length: "",
        width: "",
        height: "",
        pickup: "",
        shipmentBol: "",
        poNumber: "",
        reeferMode: "",
        routeName: "",
        instructions: "",
        seal: "",
        container: "",
        chassis: "",
        customerTrailer: "",
        pro: "",
        reeferFuelLevel: "",
        splitLoad: "",
        yardLocation: "",
        contactPerson: "",
        phone: "",
        address: "",
        type: "FCFS",
        pickupNumber: "",
        loadNumber: "",
        notes: "",
      },
    ],

    // 4. Equipment
    driverId: "",
    secondDriverId: "",
    truckId: "",
    trailerId: "",
    trailerType: "Dry Van",
    dispatcherId: "DISP-001",
    carrierId: "",

    // 5. Rates
    lineHaul: 0,
    fuelSurcharge: 0,
    detention: 0,
    layover: 0,
    tonu: 0,
    accessorials: 0,
    totalCustomerRate: 0,
    totalCarrierPay: 0,

    // 6. Automation
    autoSendDriver: false,
    autoTrack: true,
    autoInvoice: false,

    // 7. Status
    status: "Draft",
    assignmentType: "carrier",
    carrierPay: 0,

    // 8. Documents
    documents: [],
  });

  const [calculations, setCalculations] = useState<Calculations>({
    totalRevenue: 0,
    estimatedProfit: 0,
    margin: 0,
  });

  // Options for dropdowns
  const feeTypeOptions: Option[] = [
    { value: "Line Haul", label: "Line Haul" },
    { value: "Flat Rate", label: "Flat Rate" },
    { value: "Per Mile", label: "Per Mile" },
    { value: "Hourly", label: "Hourly" },
    { value: "Lump Sum", label: "Lump Sum" },
  ];

  const fuelSrcTypeOptions: Option[] = [
    { value: "Included", label: "Included" },
    { value: "Separate", label: "Separate" },
    { value: "Customer Pays", label: "Customer Pays" },
    { value: "Carrier Pays", label: "Carrier Pays" },
  ];

  const vanTypeOptions: Option[] = [
    { value: "Van Or Reefer", label: "Van Or Reefer" },
    { value: "Dry Van", label: "Dry Van" },
    { value: "Reefer", label: "Reefer" },
    { value: "Flatbed", label: "Flatbed" },
    { value: "Step Deck", label: "Step Deck" },
    { value: "Double Drop", label: "Double Drop" },
    { value: "Lowboy", label: "Lowboy" },
    { value: "Conestoga", label: "Conestoga" },
    { value: "Power Only", label: "Power Only" },
  ];

  const lengthOptions: Option[] = [
    { value: "48", label: "48 ft" },
    { value: "53", label: "53 ft" },
    { value: "28", label: "28 ft" },
    { value: "26", label: "26 ft" },
    { value: "20", label: "20 ft" },
    { value: "40", label: "40 ft" },
  ];

  const bookingAuthorityOptions: Option[] = [
    { value: "Direct", label: "Direct" },
    { value: "Broker", label: "Broker" },
    { value: "Online Board", label: "Online Board" },
    { value: "TMS", label: "TMS" },
    { value: "Email", label: "Email" },
    { value: "Phone", label: "Phone" },
  ];

  const typeOptions: Option[] = [
    { value: "FTL", label: "FTL" },
    { value: "LTL", label: "LTL" },
    { value: "Partial", label: "Partial" },
    { value: "Team", label: "Team" },
    { value: "Expedited", label: "Expedited" },
    { value: "Hazmat", label: "Hazmat" },
  ];

  const salesAgentOptions: Option[] = [
    { value: "john.doe@company.com", label: "John Doe" },
    { value: "jane.smith@company.com", label: "Jane Smith" },
    { value: "mike.jones@company.com", label: "Mike Jones" },
    { value: "sarah.wilson@company.com", label: "Sarah Wilson" },
  ];

  const officeOptions: Option[] = [
    { value: "main", label: "Main Terminal" },
    { value: "east", label: "East Coast Office" },
    { value: "west", label: "West Coast Office" },
    { value: "south", label: "Southern Terminal" },
    { value: "midwest", label: "Midwest Hub" },
  ];

  const agencyOptions: Option[] = [
    { value: "internal", label: "Internal" },
    { value: "partner-1", label: "Logistics Partner Inc." },
    { value: "partner-2", label: "Global Transport Agency" },
    { value: "partner-3", label: "Freight Solutions LLC" },
  ];

  const brokerageAgentOptions: Option[] = [
    { value: "agent-1", label: "David Chen" },
    { value: "agent-2", label: "Lisa Rodriguez" },
    { value: "agent-3", label: "Robert Kim" },
    { value: "agent-4", label: "Emily Watson" },
  ];

  const shipperOptions: Option[] = [
    { value: "shipper-1", label: "ABC Manufacturing" },
    { value: "shipper-2", label: "XYZ Logistics" },
    { value: "shipper-3", label: "Global Goods Inc." },
    { value: "shipper-4", label: "Quality Products LLC" },
    { value: "shipper-5", label: "National Distributors" },
  ];

  const consigneeOptions: Option[] = [
    { value: "consignee-1", label: "Retail Chain Corp" },
    { value: "consignee-2", label: "Distribution Center #5" },
    { value: "consignee-3", label: "Warehouse Services Inc." },
    { value: "consignee-4", label: "Final Destination LLC" },
  ];

  const pickupTypeOptions: Option[] = [
    { value: "live-load", label: "Live Load" },
    { value: "drop-hook", label: "Drop & Hook" },
    { value: "pickup-only", label: "Pickup Only" },
    { value: "cross-dock", label: "Cross Dock" },
  ];

  const stopTypeOptions: Option[] = [
    { value: "live-unload", label: "Live Unload" },
    { value: "drop-hook", label: "Drop & Hook" },
    { value: "drop-only", label: "Drop Only" },
    { value: "cross-dock", label: "Cross Dock" },
  ];

  const qtyTypeOptions: Option[] = [
    { value: "pallets", label: "Pallets" },
    { value: "cartons", label: "Cartons" },
    { value: "pieces", label: "Pieces" },
    { value: "bundles", label: "Bundles" },
    { value: "drums", label: "Drums" },
    { value: "units", label: "Units" },
  ];

  const reeferModeOptions: Option[] = [
    { value: "continuous", label: "Continuous Run" },
    { value: "start-stop", label: "Start/Stop" },
    { value: "monitor-only", label: "Monitor Only" },
    { value: "off", label: "Off (No Power)" },
    { value: "pre-cool", label: "Pre-Cool" },
  ];

  const yardLocationOptions: Option[] = [
    { value: "dock-1", label: "Dock 1 - Main" },
    { value: "dock-2", label: "Dock 2 - Receiving" },
    { value: "dock-3", label: "Dock 3 - Shipping" },
    { value: "dock-4", label: "Dock 4 - Loading" },
    { value: "yard-a", label: "Yard A" },
    { value: "yard-b", label: "Yard B" },
    { value: "lot-1", label: "Parking Lot 1" },
    { value: "lot-2", label: "Parking Lot 2" },
  ];

  const bookingAuthorityOptionsFinal =
    dynamicBookingAuthorityOptions.length > 0
      ? dynamicBookingAuthorityOptions
      : bookingAuthorityOptions;
  const customerOptionsFinal =
    dynamicCustomerOptions.length > 0
      ? dynamicCustomerOptions
      : [{ value: "", label: "No customers found" }];
  const salesAgentOptionsFinal =
    dynamicSalesAgentOptions.length > 0
      ? dynamicSalesAgentOptions
      : salesAgentOptions;
  const officeOptionsFinal =
    dynamicOfficeOptions.length > 0 ? dynamicOfficeOptions : officeOptions;
  const agencyOptionsFinal =
    dynamicAgentOptions.length > 0 ? dynamicAgentOptions : agencyOptions;
  const brokerageAgentOptionsFinal =
    dynamicAgentOptions.length > 0
      ? dynamicAgentOptions
      : brokerageAgentOptions;
  const shipperOptionsFinal =
    dynamicShipperConsigneeOptions.length > 0
      ? dynamicShipperConsigneeOptions
      : shipperOptions;
  const consigneeOptionsFinal =
    dynamicShipperConsigneeOptions.length > 0
      ? dynamicShipperConsigneeOptions
      : consigneeOptions;
  const yardLocationOptionsFinal =
    dynamicYardLocationOptions.length > 0
      ? dynamicYardLocationOptions
      : yardLocationOptions;
  const carrierOptionsFinal =
    dynamicCarrierOptions.length > 0
      ? dynamicCarrierOptions
      : [
          { value: "CAR-101", label: "3 Arrows INC." },
          { value: "CAR-102", label: "7 Days Carrier" },
          { value: "CAR-103", label: "A & D Trucklines" },
        ];
  const selectedDriverVehicles = formData.driverId
    ? driverVehiclesById[formData.driverId] || []
    : [];
  const assignedTruckOptions: Option[] = selectedDriverVehicles
    .filter((vehicle) => vehicle.vehicleType.toLowerCase() === "truck")
    .map((vehicle) => ({
      value: vehicle.id,
      label: `${vehicle.vehicleNumber} (${vehicle.companyName})`,
    }));
  const assignedTrailerOptions: Option[] = selectedDriverVehicles
    .filter((vehicle) => vehicle.vehicleType.toLowerCase() === "trailer")
    .map((vehicle) => ({
      value: vehicle.id,
      label: `${vehicle.vehicleNumber} (${vehicle.companyName})`,
    }));

  const mapSettingsToOptions = (
    entities: SettingsEntity[],
    includeAddressInLabel = false
  ) =>
    entities
      .map((item) => {
        const name = (item.companyName || item.name || "").trim();
        const address = (item.address || "").trim();
        if (!name) return null;

        return {
          value: name,
          label:
            includeAddressInLabel && address ? `${name} (${address})` : name,
        };
      })
      .filter((item): item is Option => !!item);

  const loadSettingsOptions = useCallback(async (ownerId: string) => {
    try {
      const [
        customersSnap,
        shippersSnap,
        carriersSnap,
        bookingAuthoritiesSnap,
        bookingAgentsSnap,
        salesAgentsSnap,
        bookingOfficesSnap,
      ] = await Promise.all([
        getDocs(
          query(
            collection(db, "settings_customers"),
            where("effectiveUserId", "==", ownerId)
          )
        ),
        getDocs(
          query(
            collection(db, "settings_shippers"),
            where("effectiveUserId", "==", ownerId)
          )
        ),
        getDocs(
          query(
            collection(db, "settings_carriers"),
            where("effectiveUserId", "==", ownerId)
          )
        ),
        getDocs(
          query(
            collection(db, "settings_booking_authorities"),
            where("effectiveUserId", "==", ownerId)
          )
        ),
        getDocs(
          query(
            collection(db, "settings_booking_agents"),
            where("effectiveUserId", "==", ownerId)
          )
        ),
        getDocs(
          query(
            collection(db, "settings_sales_agents"),
            where("effectiveUserId", "==", ownerId)
          )
        ),
        getDocs(
          query(
            collection(db, "settings_booking_offices"),
            where("effectiveUserId", "==", ownerId)
          )
        ),
      ]);

      const customers = customersSnap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<SettingsEntity, "id">),
          } as SettingsEntity)
      );
      const shippers = shippersSnap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<SettingsEntity, "id">),
          } as SettingsEntity)
      );
      const carriers = carriersSnap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<SettingsEntity, "id">),
          } as SettingsEntity)
      );
      const bookingAuthorities = bookingAuthoritiesSnap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<SettingsEntity, "id">),
          } as SettingsEntity)
      );
      const bookingAgents = bookingAgentsSnap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<SettingsEntity, "id">),
          } as SettingsEntity)
      );
      const salesAgents = salesAgentsSnap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<SettingsEntity, "id">),
          } as SettingsEntity)
      );
      const bookingOffices = bookingOfficesSnap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<SettingsEntity, "id">),
          } as SettingsEntity)
      );

      setDynamicCustomerOptions(mapSettingsToOptions(customers, true));
      setDynamicShipperConsigneeOptions(mapSettingsToOptions(shippers, true));
      setDynamicCarrierOptions(mapSettingsToOptions(carriers));
      setDynamicBookingAuthorityOptions(
        mapSettingsToOptions(bookingAuthorities)
      );
      setDynamicSalesAgentOptions(mapSettingsToOptions(salesAgents));
      setDynamicOfficeOptions(mapSettingsToOptions(bookingOffices));
      setDynamicAgentOptions(mapSettingsToOptions(bookingAgents));
      setShipperConsigneeAddressByName(
        shippers.reduce<Record<string, string>>((acc, item) => {
          const name = (item.companyName || item.name || "").trim();
          const address = (item.address || "").trim();
          if (name && address) acc[name] = address;
          return acc;
        }, {})
      );

      const uniqueYards = Array.from(
        new Set(
          carriers
            .map((item) => (item.yardLocation || "").trim())
            .filter((yard) => yard.length > 0)
        )
      );
      setDynamicYardLocationOptions(
        uniqueYards.map((yard) => ({ value: yard, label: yard }))
      );
    } catch (error) {
      GlobalToastError(error);
    }
  }, []);

  const loadDriverAssignments = useCallback(async (ownerId: string) => {
    try {
      const driversSnap = await getDocs(
        query(
          collection(db, "Users"),
          where("createdBy", "==", ownerId),
          where("role", "==", "Driver")
        )
      );

      const drivers: DriverOption[] = driversSnap.docs.map((driverDoc) => {
        const driverData = driverDoc.data() as {
          userName?: string;
          email?: string;
          active?: boolean;
        };

        return {
          id: driverDoc.id,
          name: (driverData.userName || driverData.email || "Unknown").trim(),
          active: driverData.active !== false,
        };
      });

      drivers.sort((a, b) => a.name.localeCompare(b.name));

      const driverOptionsMapped: Option[] = drivers.map((driver) => ({
        value: driver.id,
        label: driver.active ? driver.name : `${driver.name} (Inactive)`,
      }));
      setDriverOptions(driverOptionsMapped);

      const vehiclesByDriver: Record<string, AssignedVehicle[]> = {};

      await Promise.all(
        drivers.map(async (driver) => {
          const vehiclesSnap = await getDocs(
            collection(db, "Users", driver.id, "Vehicles")
          );

          const vehicles = vehiclesSnap.docs.map((vehicleDoc) => {
            const vehicleData = vehicleDoc.data() as {
              companyName?: string;
              vehicleNumber?: string;
              vehicleType?: string;
              type?: string;
            };

            return {
              id: vehicleDoc.id,
              companyName: vehicleData.companyName || "Unknown Company",
              vehicleNumber: vehicleData.vehicleNumber || "Unknown Vehicle",
              vehicleType: vehicleData.vehicleType || vehicleData.type || "",
            };
          });

          vehiclesByDriver[driver.id] = vehicles;
        })
      );

      setDriverVehiclesById(vehiclesByDriver);
    } catch (error) {
      GlobalToastError(error);
      setDriverOptions([]);
      setDriverVehiclesById({});
    }
  }, []);

  const resolveEffectiveUserId = async (userId: string) => {
    setIsResolvingUser(true);
    try {
      const userDoc = await getDoc(doc(db, "Users", userId));
      if (!userDoc.exists()) {
        setEffectiveUserId(userId);
        return;
      }

      const userData = userDoc.data() as { role?: string; createdBy?: string };
      if (userData.role === "SubOwner" && userData.createdBy) {
        setEffectiveUserId(userData.createdBy);
      } else {
        setEffectiveUserId(userId);
      }
    } catch (error) {
      GlobalToastError(error);
      setEffectiveUserId(userId);
    } finally {
      setIsResolvingUser(false);
    }
  };

  const buildLoadNumber = (docId: string) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const suffix = docId.slice(-5).toUpperCase();
    return `LD-${y}${m}${d}-${suffix}`;
  };

  const handleSaveLoad = async (status: "Draft" | "Posted") => {
    if (!user?.uid || !effectiveUserId) {
      toast.error("Please login to save this load.");
      return;
    }

    setIsSaving(true);

    try {
      const loadsRef = collection(db, "dispatch_loads");
      const newLoadRef = doc(loadsRef);

      const documents = formData.documents.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        size: item.size || 0,
      }));

      await setDoc(newLoadRef, {
        ...formData,
        loadNumber: buildLoadNumber(newLoadRef.id),
        status,
        documents,
        currentUserId: user.uid,
        effectiveUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(
        status === "Draft"
          ? "Load saved as draft successfully."
          : "Load created successfully."
      );
      router.push("/truck-dispatch");
    } catch (error) {
      GlobalToastError(error);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Handlers ---

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => {
        if (name === "driverId") {
          return {
            ...prev,
            driverId: value,
            truckId: "",
            trailerId: "",
          };
        }

        return {
          ...prev,
          [name]: value,
        };
      });
    }
  };

  const handleStopChange = (
    section: "pickups" | "deliveries",
    id: number,
    field: keyof Stop,
    value: string | boolean
  ) => {
    const newFormData = { ...formData };
    newFormData[section] = newFormData[section].map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );

    // Auto-fill delivery fields when pickup fields are changed (only for the first pickup)
    if (autoFillDeliveries && section === "pickups" && id === 1) {
      const fieldsToAutoFill: (keyof Stop)[] = [
        "totalQty",
        "qtyType",
        "totalWeight",
        "commodity",
        "poNumber",
      ];

      if (fieldsToAutoFill.includes(field)) {
        // Update the first delivery's corresponding field
        if (newFormData.deliveries.length > 0) {
          newFormData.deliveries[0] = {
            ...newFormData.deliveries[0],
            [field]: value,
          };
        }
      }
    }

    setFormData(newFormData);
  };

  const addStop = (section: "pickups" | "deliveries") => {
    const newId =
      formData[section].length > 0
        ? Math.max(...formData[section].map((i) => i.id)) + 1
        : 1;

    const newStop: Stop = {
      id: newId,
      company: "",
      customerLoadRefConf: "",
      locationNotes: "",
      date: "",
      timeStart: "",
      timeEnd: "",
      stopType: "live-load",
      hasAppointment: false,
      totalQty: "",
      qtyType: "pallets",
      totalWeight: "",
      commodity: "",
      length: "",
      width: "",
      height: "",
      pickup: "",
      shipmentBol: "",
      poNumber: "",
      reeferMode: "",
      routeName: "",
      instructions: "",
      seal: "",
      container: "",
      chassis: "",
      customerTrailer: "",
      pro: "",
      reeferFuelLevel: "",
      splitLoad: "",
      yardLocation: "",
      contactPerson: "",
      phone: "",
      address: "",
      type: "FCFS",
      pickupNumber: "",
      loadNumber: "",
      notes: "",
    };

    setFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], newStop],
    }));

    // Scroll to the new stop after a small delay to allow DOM update
    setTimeout(() => {
      const stopElement = document.getElementById(`${section}-${newId}`);
      if (stopElement) {
        stopElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const removeStop = (section: "pickups" | "deliveries", id: number) => {
    if (formData[section].length === 1) return; // Prevent deleting last stop
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].filter((item) => item.id !== id),
    }));
  };

  const handleFileUpload = (type: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newDoc: DocumentFile = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: type as DocumentFile["type"],
        file: file,
        previewUrl: e.target?.result as string,
        size: file.size,
      };

      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, newDoc],
      }));
    };

    if (file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
    } else {
      // For PDF and other non-image files
      const newDoc: DocumentFile = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: type as DocumentFile["type"],
        file: file,
        size: file.size,
      };

      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, newDoc],
      }));
    }
  };

  const handleFileRemove = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== id),
    }));
  };

  const router = useRouter();

  const handleCancel = () => {
    // setIsCancelled(true);
    router.push("/truck-dispatch");
  };

  const handleViewPreview = (previewUrl: string) => {
    setPreviewImage(previewUrl);
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  const navigateToDispatchSettings = () => {
    router.push("/dispatch-settings");
  };

  // --- Effects ---

  useEffect(() => {
    if (!user?.uid) {
      setEffectiveUserId("");
      setIsResolvingUser(false);
      return;
    }

    resolveEffectiveUserId(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    if (!effectiveUserId) return;
    loadSettingsOptions(effectiveUserId);
    loadDriverAssignments(effectiveUserId);
  }, [effectiveUserId, loadSettingsOptions, loadDriverAssignments]);

  // Auto-calculate Totals & Profit
  useEffect(() => {
    const revenue =
      Number(formData.lineHaul) +
      Number(formData.fuelSurcharge) +
      Number(formData.detention) +
      Number(formData.layover) +
      Number(formData.tonu) +
      Number(formData.accessorials);

    const cost = Number(formData.totalCarrierPay);
    const profit = revenue - cost;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

    setCalculations({
      totalRevenue: revenue,
      estimatedProfit: profit,
      margin: Number(margin),
    });

    setFormData((prev) => ({ ...prev, totalCustomerRate: revenue }));
  }, [
    formData.lineHaul,
    formData.fuelSurcharge,
    formData.detention,
    formData.layover,
    formData.tonu,
    formData.accessorials,
    formData.totalCarrierPay,
  ]);

  useEffect(() => {
    return () => {
      formData.documents.forEach((doc) => {
        if (doc.previewUrl && doc.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(doc.previewUrl);
        }
      });
    };
  }, [formData.documents]);

  if (isCancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Load Creation Cancelled
          </h2>
          <p className="text-gray-600 mb-6">
            The new load creation has been cancelled. No data was saved.
          </p>
          <button
            onClick={() => setIsCancelled(false)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Start New Load
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage}
          onClose={handleClosePreview}
        />
      )}

      <div className="min-h-screen bg-gray-50 pb-20 font-sans">
        <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
          <div className="max-w-full mx-auto px-10 py-4">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Create New Load
                  </h1>
                  <span className="hidden sm:inline text-gray-400">|</span>
                  <div className="text-sm text-gray-500 font-mono">
                    ID: Auto-generated on save
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Fill in the details below to dispatch a new shipment.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={() => handleSaveLoad("Draft")}
                  disabled={isSaving || isLoading || isResolvingUser}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 flex items-center justify-center gap-2 font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />{" "}
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  onClick={() => handleSaveLoad("Posted")}
                  disabled={isSaving || isLoading || isResolvingUser}
                  className="px-4 py-2 bg-[#F96176] text-white rounded-md hover:bg-[#F96176] shadow-md flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Package className="w-4 h-4" />{" "}
                  {isSaving ? "Saving..." : "Create & Post"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-auto mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-10 space-y-6">
            {/* SECTION 1: Customer & Load Header - UPDATED with 3 fields per row */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <SectionHeader
                icon={User}
                title="Customer & Load Information"
                colorClass="text-blue-600"
              />

              {/* First Row: Search Customer, Fee Type, */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Search Customer */}
                <SearchableSelectGroup
                  label="Search Customer"
                  name="customerSearch"
                  value={formData.customerSearch}
                  onChange={handleInputChange}
                  options={customerOptionsFinal}
                  placeholder="Type to search or select customer..."
                  showCreateButton
                  createTooltip="Add Customer"
                  onCreateClick={navigateToDispatchSettings}
                />
                <SearchableSelectGroup
                  label="Van Type"
                  name="vanType"
                  value={formData.vanType}
                  onChange={handleInputChange}
                  options={vanTypeOptions}
                />
                {(formData.vanType === "Van Or Reefer" ||
                  formData.vanType === "Reefer") && (
                  <InputGroup
                    label="Temperature (°F)"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    placeholder="e.g., 34"
                  />
                )}
                {!(
                  formData.vanType === "Van Or Reefer" ||
                  formData.vanType === "Reefer"
                ) && <div />}
              </div>

              {/* Third Row: Length, Booking Authority, Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <SelectGroup
                  label="Length"
                  name="length"
                  value={formData.length}
                  onChange={handleInputChange}
                  options={lengthOptions}
                />

                {/* Primary Fees */}
                <InputGroup
                  label="Primary Fees ($)"
                  name="primaryFees"
                  type="number"
                  value={formData.primaryFees}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  icon={DollarSign}
                />
                <SearchableSelectGroup
                  label="Booking Authority"
                  name="bookingAuthority"
                  value={formData.bookingAuthority}
                  onChange={handleInputChange}
                  options={bookingAuthorityOptionsFinal}
                  showCreateButton
                  createTooltip="Add Booking Authority"
                  onCreateClick={navigateToDispatchSettings}
                />
                <SelectGroup
                  label="Type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  options={typeOptions}
                />
              </div>

              {/* SECTION 4: Equipment & Driver Assignment */}
              <div>
                <SectionHeader
                  icon={Truck}
                  title="Equipment & Driver Assignment"
                  colorClass="text-orange-600"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {/* Assignment Type Selector - Takes 1/3 width */}
                  <div className="col-span-1">
                    <SelectGroup
                      label="Assignment Type"
                      name="assignmentType"
                      value={formData.assignmentType}
                      onChange={handleInputChange}
                      options={[
                        { value: "carrier", label: "Carrier" },
                        { value: "driver", label: "Driver" },
                      ]}
                    />
                  </div>

                  {/* Carrier-specific fields - Shown when carrier is selected */}
                  {formData.assignmentType === "carrier" && (
                    <>
                      <div className="col-span-1">
                        <SearchableSelectGroup
                          label="Select Carrier"
                          name="carrierId"
                          value={formData.carrierId}
                          onChange={handleInputChange}
                          options={carrierOptionsFinal}
                          showCreateButton
                          createTooltip="Add Carrier"
                          onCreateClick={navigateToDispatchSettings}
                        />
                      </div>

                      <div className="col-span-1">
                        <InputGroup
                          label="Carrier Pay ($)"
                          name="totalCarrierPay"
                          type="number"
                          value={formData.totalCarrierPay || ""}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          icon={DollarSign}
                        />
                      </div>
                    </>
                  )}

                  {/* Driver-specific fields - Shown when driver is selected */}
                  {formData.assignmentType === "driver" && (
                    <>
                      <div className="col-span-1">
                        <SelectGroup
                          label="Select Driver"
                          name="driverId"
                          value={formData.driverId}
                          onChange={handleInputChange}
                          options={
                            driverOptions.length > 0
                              ? driverOptions
                              : [{ value: "", label: "No drivers found" }]
                          }
                        />
                      </div>

                      <div className="col-span-1">
                        <SelectGroup
                          label="Assigned Truck"
                          name="truckId"
                          value={formData.truckId}
                          onChange={handleInputChange}
                          options={
                            assignedTruckOptions.length > 0
                              ? assignedTruckOptions
                              : [{ value: "", label: "No assigned trucks" }]
                          }
                        />
                      </div>

                      <div className="col-span-1">
                        <SelectGroup
                          label="Assigned Trailer"
                          name="trailerId"
                          value={formData.trailerId}
                          onChange={handleInputChange}
                          options={
                            assignedTrailerOptions.length > 0
                              ? assignedTrailerOptions
                              : [{ value: "", label: "No assigned trailers" }]
                          }
                        />
                      </div>
                      <div className="col-span-1">
                        <InputGroup
                          label="Co-Driver (Team)"
                          name="secondDriverId"
                          value={formData.secondDriverId}
                          onChange={handleInputChange}
                          placeholder="Optional"
                        />
                      </div>

                      <div className="col-span-1">
                        {/* <InputGroup
                          label="Dispatcher"
                          name="dispatcherId"
                          value={formData.dispatcherId}
                          onChange={handleInputChange}
                          disabled
                        /> */}
                      </div>
                    </>
                  )}
                </div>

                {/* Additional Driver fields - Shown in a second row when driver is selected */}
                {formData.assignmentType === "driver" &&
                  // <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  //   <div className="col-span-1">
                  //     <InputGroup
                  //       label="Co-Driver (Team)"
                  //       name="secondDriverId"
                  //       value={formData.secondDriverId}
                  //       onChange={handleInputChange}
                  //       placeholder="Optional"
                  //     />
                  //   </div>

                  //   <div className="col-span-1">
                  //     <InputGroup
                  //       label="Dispatcher"
                  //       name="dispatcherId"
                  //       value={formData.dispatcherId}
                  //       onChange={handleInputChange}
                  //       disabled
                  //     />
                  //   </div>

                  //   {/* Empty column to maintain layout */}
                  //   <div className="col-span-1"></div>
                  // </div>
                  null}

                {/* Common Options for both Carrier and Driver */}
                {formData.assignmentType &&
                  // <div className="mt-4 pt-4 border-t">
                  //   <div className="flex flex-col sm:flex-row gap-3">
                  //     <CheckboxGroup
                  //       label="Notify via App"
                  //       name="autoSendDriver"
                  //       checked={formData.autoSendDriver}
                  //       onChange={handleInputChange}
                  //     />
                  //     <CheckboxGroup
                  //       label="Enable GPS Tracking"
                  //       name="autoTrack"
                  //       checked={formData.autoTrack}
                  //       onChange={handleInputChange}
                  //     />
                  //     {formData.assignmentType === "driver" && (
                  //       <CheckboxGroup
                  //         label="Auto Invoice"
                  //         name="autoInvoice"
                  //         checked={formData.autoInvoice}
                  //         onChange={handleInputChange}
                  //       />
                  //     )}
                  //   </div>
                  // </div>
                  null}

                {/* Show message when no assignment type is selected */}
                {!formData.assignmentType && (
                  <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                    <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">
                      Select an assignment type above to configure equipment and
                      driver details.
                    </p>
                  </div>
                )}
              </div>

              {/* Advanced Button */}
              <div className="mt-4 mb-4">
                <button
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showAdvancedFields ? "rotate-180" : ""
                    }`}
                  />
                  {showAdvancedFields
                    ? "Hide Advanced Fields"
                    : "Show Advanced Fields"}
                </button>
              </div>

              {/* Advanced Fields Card - Appears when showAdvancedFields is true */}
              {showAdvancedFields && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">
                    Advanced Settings
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {/* Booking Office */}
                    {/* <SelectGroup
                      label="Booking Office"
                      name="bookingOffice"
                      value={formData.bookingOffice}
                      onChange={handleInputChange}
                      options={officeOptions}
                    /> */}
                    {/* Brokerage Agent */}
                    <SearchableSelectGroup
                      label="Brokerage Agent"
                      name="brokerageAgent"
                      value={formData.brokerageAgent}
                      onChange={handleInputChange}
                      options={brokerageAgentOptionsFinal}
                      showCreateButton
                      createTooltip="Add Booking Agent"
                      onCreateClick={navigateToDispatchSettings}
                    />
                    {/* Yard Location */}
                    {/* <SelectGroup
                      label="Yard Location"
                      name="yardLocation"
                      value={formData.yardLocation}
                      onChange={handleInputChange}
                      options={yardLocationOptions}
                    /> */}
                    <InputGroup
                      label="Declared Value ($)"
                      name="declaredValue"
                      value={formData.declaredValue}
                      onChange={handleInputChange}
                      placeholder="Value of goods"
                      icon={Shield}
                    />
                    <SearchableSelectGroup
                      label="Sales Agent"
                      name="salesAgent"
                      value={formData.salesAgent}
                      onChange={handleInputChange}
                      options={salesAgentOptionsFinal}
                      showCreateButton
                      createTooltip="Add Sales Agent"
                      onCreateClick={navigateToDispatchSettings}
                    />

                    <SearchableSelectGroup
                      label="Booking/Terminal Office"
                      name="bookingTerminalOffice"
                      value={formData.bookingTerminalOffice}
                      onChange={handleInputChange}
                      options={officeOptionsFinal}
                      showCreateButton
                      createTooltip="Add Booking Office"
                      onCreateClick={navigateToDispatchSettings}
                    />

                    <SearchableSelectGroup
                      label="Agency"
                      name="agency"
                      value={formData.agency}
                      onChange={handleInputChange}
                      options={agencyOptionsFinal}
                      showCreateButton
                      createTooltip="Add Booking Agent"
                      onCreateClick={navigateToDispatchSettings}
                    />
                    <InputGroup
                      label="Tendered Miles"
                      name="tenderedMiles"
                      value={formData.tenderedMiles}
                      onChange={handleInputChange}
                      placeholder="Enter miles"
                      icon={MapPin}
                    />
                  </div>

                  {/* Internal Notes - Full width */}
                  <div className="mt-4">
                    <TextAreaGroup
                      label="Internal Notes"
                      name="internalNotes"
                      value={formData.internalNotes}
                      onChange={handleInputChange}
                      placeholder="Private internal notes for this load..."
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Customer Load Notes and Dispatch Notes (always visible) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <TextAreaGroup
                  label="Customer Load Notes"
                  name="customerLoadNotes"
                  value={formData.customerLoadNotes}
                  onChange={handleInputChange}
                  placeholder="Special instructions, requirements, etc."
                  rows={1}
                />
                <TextAreaGroup
                  label="Dispatch Notes"
                  name="dispatchNotes"
                  value={formData.dispatchNotes}
                  onChange={handleInputChange}
                  placeholder="Internal dispatch instructions"
                  rows={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-2 gap-6">
              {/* Pickups */}
              <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                        A
                      </div>
                      Pickups
                    </h3>

                    {/* Auto-fill toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={autoFillDeliveries}
                        onChange={(e) =>
                          setAutoFillDeliveries(e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        id="autoFillToggle"
                      />
                      <label
                        htmlFor="autoFillToggle"
                        className="text-xs text-gray-600 select-none cursor-pointer"
                      >
                        Auto-fill deliveries
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => addStop("pickups")}
                    className="text-xs bg-green-50 text-green-600 px-3 py-2 rounded hover:bg-green-100 font-medium flex items-center justify-center gap-1 w-full sm:w-auto"
                  >
                    <Plus className="w-3 h-3" /> Add Pickup
                  </button>
                </div>

                {formData.pickups.map((stop, index) => (
                  <div
                    key={stop.id}
                    id={`pickups-${stop.id}`}
                    className="mb-6 pb-6 border-b border-dashed last:border-0 last:mb-0 last:pb-0 relative"
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b">
                      <h4 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        {index > 0 && (
                          <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + index)}
                          </div>
                        )}
                        {index > 0 && `Pickup ${index + 1}`}
                      </h4>

                      {index > 0 && (
                        <button
                          onClick={() => removeStop("pickups", stop.id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete Pickup
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-10 gap-4 items-end mb-4">
                        <div className="sm:col-span-7">
                          <SearchableSelectGroup
                            label="Shipper"
                            name={`pickup-company-${stop.id}`}
                            value={stop.company}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "company",
                                e.target.value
                              )
                            }
                            options={shipperOptionsFinal}
                            showCreateButton
                            createTooltip="Add Shipper"
                            onCreateClick={navigateToDispatchSettings}
                          />
                          {shipperConsigneeAddressByName[stop.company] && (
                            <p className="mt-1 text-xs text-gray-600">
                              Address:{" "}
                              {shipperConsigneeAddressByName[stop.company]}
                            </p>
                          )}
                        </div>
                        <div className="sm:col-span-3">
                          <InputGroup
                            label="Customer Load/Ref/Conf"
                            value={stop.customerLoadRefConf}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "customerLoadRefConf",
                                e.target.value
                              )
                            }
                            placeholder="Customer reference number"
                            name={""}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location Notes:
                        </h4>
                      </div>

                      {/* Date, Time, Appt - MODIFIED */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end mb-4">
                        <InputGroup
                          label="Date"
                          type="date"
                          value={stop.date}
                          onChange={(e) =>
                            handleStopChange(
                              "pickups",
                              stop.id,
                              "date",
                              e.target.value
                            )
                          }
                          name={""}
                        />

                        {stop.hasAppointment ? (
                          <InputGroup
                            label="Time"
                            type="time"
                            value={stop.timeStart}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "timeStart",
                                e.target.value
                              )
                            }
                            name={""}
                            className="sm:col-span-2"
                          />
                        ) : (
                          <>
                            <InputGroup
                              label="Start Time"
                              type="time"
                              value={stop.timeStart}
                              onChange={(e) =>
                                handleStopChange(
                                  "pickups",
                                  stop.id,
                                  "timeStart",
                                  e.target.value
                                )
                              }
                              name={""}
                            />
                            <InputGroup
                              label="End Time"
                              type="time"
                              value={stop.timeEnd}
                              onChange={(e) =>
                                handleStopChange(
                                  "pickups",
                                  stop.id,
                                  "timeEnd",
                                  e.target.value
                                )
                              }
                              name={""}
                            />
                          </>
                        )}

                        <div className="flex items-center gap-2 h-[42px] border border-transparent">
                          <input
                            type="checkbox"
                            checked={stop.hasAppointment}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "hasAppointment",
                                e.target.checked
                              )
                            }
                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            id={`appt-${stop.id}`}
                          />
                          <label
                            htmlFor={`appt-${stop.id}`}
                            className="text-sm font-bold text-gray-700 select-none cursor-pointer"
                          >
                            Appt
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectGroup
                          label="Stop Pickup"
                          value={stop.stopType}
                          onChange={(e) =>
                            handleStopChange(
                              "pickups",
                              stop.id,
                              "stopType",
                              e.target.value
                            )
                          }
                          options={pickupTypeOptions}
                          name={""}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Total Qty
                          </label>
                          <input
                            type="text"
                            value={stop.totalQty}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "totalQty",
                                e.target.value
                              )
                            }
                            placeholder="Quantity"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Qty Type
                          </label>
                          <select
                            value={stop.qtyType}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "qtyType",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                          >
                            <option value="">Select...</option>
                            {qtyTypeOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Total Weight (lbs)
                          </label>
                          <input
                            type="text"
                            value={stop.totalWeight}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "totalWeight",
                                e.target.value
                              )
                            }
                            placeholder="Weight"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Commodity
                          </label>
                          <input
                            type="text"
                            value={stop.commodity}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "commodity",
                                e.target.value
                              )
                            }
                            placeholder="Type of goods"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Pickup #
                          </label>
                          <input
                            type="text"
                            value={stop.pickup}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "pickup",
                                e.target.value
                              )
                            }
                            placeholder="Pickup number"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            PO Number
                          </label>
                          <input
                            type="text"
                            value={stop.poNumber}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "poNumber",
                                e.target.value
                              )
                            }
                            placeholder="Purchase order"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Reefer Mode
                          </label>
                          <select
                            value={stop.reeferMode}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "reeferMode",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                          >
                            <option value="">Select...</option>
                            {reeferModeOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Instructions
                          </label>
                          <input
                            type="text"
                            value={stop.instructions}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "instructions",
                                e.target.value
                              )
                            }
                            placeholder="Special instructions"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Seal #
                          </label>
                          <input
                            type="text"
                            value={stop.seal}
                            onChange={(e) =>
                              handleStopChange(
                                "pickups",
                                stop.id,
                                "seal",
                                e.target.value
                              )
                            }
                            placeholder="Seal number"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Split Load
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputGroup
                          label="Yard Location"
                          value={stop.yardLocation}
                          onChange={(e) =>
                            handleStopChange(
                              "pickups",
                              stop.id,
                              "yardLocation",
                              e.target.value
                            )
                          }
                          placeholder="Enter yard location"
                          name={""}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Deliveries */}
              <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                      Z
                    </div>
                    Deliveries
                  </h3>
                  <button
                    onClick={() => addStop("deliveries")}
                    className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 font-medium flex items-center justify-center gap-1 w-full sm:w-auto"
                  >
                    <Plus className="w-3 h-3" /> Add Delivery
                  </button>
                </div>

                {formData.deliveries.map((stop, index) => (
                  <div
                    key={stop.id}
                    id={`deliveries-${stop.id}`}
                    className="mb-6 pb-6 border-b border-dashed last:border-0 last:mb-0 last:pb-0 relative"
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b">
                      <h4 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        {index > 0 && (
                          <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + index)}
                          </div>
                        )}
                        {index > 0 && `Delivery ${index + 1}`}
                      </h4>

                      {index > 0 && (
                        <button
                          onClick={() => removeStop("deliveries", stop.id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete Delivery
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-10 gap-4 items-end mb-4">
                        <div className="sm:col-span-7">
                          <SearchableSelectGroup
                            label="Consignee"
                            name={`delivery-company-${stop.id}`}
                            value={stop.company}
                            onChange={(e) =>
                              handleStopChange(
                                "deliveries",
                                stop.id,
                                "company",
                                e.target.value
                              )
                            }
                            options={consigneeOptionsFinal}
                            showCreateButton
                            createTooltip="Add Consignee"
                            onCreateClick={navigateToDispatchSettings}
                          />
                          {shipperConsigneeAddressByName[stop.company] && (
                            <p className="mt-1 text-xs text-gray-600">
                              Address:{" "}
                              {shipperConsigneeAddressByName[stop.company]}
                            </p>
                          )}
                        </div>
                        <div className="sm:col-span-3">
                          <InputGroup
                            label="Customer Load/Ref/Conf"
                            value={stop.customerLoadRefConf}
                            onChange={(e) =>
                              handleStopChange(
                                "deliveries",
                                stop.id,
                                "customerLoadRefConf",
                                e.target.value
                              )
                            }
                            placeholder="Customer reference number"
                            name={""}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location Notes:
                        </h4>
                      </div>

                      {/* Date, Time, Appt - MODIFIED */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end mb-4">
                        <InputGroup
                          label="Date"
                          type="date"
                          value={stop.date}
                          onChange={(e) =>
                            handleStopChange(
                              "deliveries",
                              stop.id,
                              "date",
                              e.target.value
                            )
                          }
                          name={""}
                        />

                        {stop.hasAppointment ? (
                          <InputGroup
                            label="Time"
                            type="time"
                            value={stop.timeStart}
                            onChange={(e) =>
                              handleStopChange(
                                "deliveries",
                                stop.id,
                                "timeStart",
                                e.target.value
                              )
                            }
                            name={""}
                            className="sm:col-span-2"
                          />
                        ) : (
                          <>
                            <InputGroup
                              label="Start Time"
                              type="time"
                              value={stop.timeStart}
                              onChange={(e) =>
                                handleStopChange(
                                  "deliveries",
                                  stop.id,
                                  "timeStart",
                                  e.target.value
                                )
                              }
                              name={""}
                            />
                            <InputGroup
                              label="End Time"
                              type="time"
                              value={stop.timeEnd}
                              onChange={(e) =>
                                handleStopChange(
                                  "deliveries",
                                  stop.id,
                                  "timeEnd",
                                  e.target.value
                                )
                              }
                              name={""}
                            />
                          </>
                        )}

                        <div className="flex items-center gap-2 h-[42px] border border-transparent">
                          <input
                            type="checkbox"
                            checked={stop.hasAppointment}
                            onChange={(e) =>
                              handleStopChange(
                                "deliveries",
                                stop.id,
                                "hasAppointment",
                                e.target.checked
                              )
                            }
                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            id={`del-appt-${stop.id}`}
                          />
                          <label
                            htmlFor={`del-appt-${stop.id}`}
                            className="text-sm font-bold text-gray-700 select-none cursor-pointer"
                          >
                            Appt
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectGroup
                          label="Stop Delivery"
                          value={stop.stopType}
                          onChange={(e) =>
                            handleStopChange(
                              "deliveries",
                              stop.id,
                              "stopType",
                              e.target.value
                            )
                          }
                          options={stopTypeOptions}
                          name={""}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Total Qty
                          </label>
                          <input
                            type="text"
                            value={stop.totalQty}
                            onChange={(e) =>
                              handleStopChange(
                                "deliveries",
                                stop.id,
                                "totalQty",
                                e.target.value
                              )
                            }
                            placeholder="Quantity"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Qty Type
                          </label>
                          <select
                            value={stop.qtyType}
                            onChange={(e) =>
                              handleStopChange(
                                "deliveries",
                                stop.id,
                                "qtyType",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                          >
                            <option value="">Select...</option>
                            {qtyTypeOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Total Weight (lbs)
                          </label>
                          <input
                            type="text"
                            value={stop.totalWeight}
                            onChange={(e) =>
                              handleStopChange(
                                "deliveries",
                                stop.id,
                                "totalWeight",
                                e.target.value
                              )
                            }
                            placeholder="Weight"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Commodity
                          </label>
                          <input
                            type="text"
                            value={stop.commodity}
                            onChange={(e) =>
                              handleStopChange(
                                "deliveries",
                                stop.id,
                                "commodity",
                                e.target.value
                              )
                            }
                            placeholder="Type of goods"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Delivery Instruction
                          </label>
                          <input
                            type="text"
                            value={stop.pickup}
                            onChange={(e) =>
                              handleStopChange(
                                "deliveries",
                                stop.id,
                                "pickup",
                                e.target.value
                              )
                            }
                            placeholder="Delivery instruction"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            PO Number
                          </label>
                          <input
                            type="text"
                            value={stop.poNumber}
                            onChange={(e) =>
                              handleStopChange(
                                "deliveries",
                                stop.id,
                                "poNumber",
                                e.target.value
                              )
                            }
                            placeholder="Purchase order"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Split Load
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputGroup
                          label="Yard Location"
                          value={stop.yardLocation}
                          onChange={(e) =>
                            handleStopChange(
                              "deliveries",
                              stop.id,
                              "yardLocation",
                              e.target.value
                            )
                          }
                          placeholder="Enter yard location"
                          name={""}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Financials, Status & Documents) */}
          <div className="lg:col-span-2 space-y-6">
            {/* SECTION 6: Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h3 className="font-bold text-gray-700">Load Status</h3>
                <StatusBadge status={formData.status} />
              </div>
              <div className="space-y-3 relative">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                {[
                  "Draft",
                  "Posted",
                  "Assigned",
                  "In Transit",
                  "Delivered",
                  "Completed Toun",
                ].map((step) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 relative z-10"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        step === formData.status
                          ? "bg-[#F96176] border-[#F96176]"
                          : "bg-white border-gray-300"
                      }`}
                    ></div>
                    <span
                      className={`text-sm ${
                        step === formData.status
                          ? "font-bold text-[#F96176]"
                          : "text-gray-500"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                  Change Status
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 bg-gray-50"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Draft">Draft</option>
                  <option value="Posted">Posted (Open)</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Completed Toun">Completed Toun</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* SECTION 8: Documents & Compliance - MOVED to right sidebar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <SectionHeader
                icon={FileText}
                title="Documents & Compliance"
                colorClass="text-gray-600"
              />
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                <FileUploadBox
                  label="Rate Confirmation"
                  type="rate-confirmation"
                  onFileUpload={handleFileUpload}
                />
                <FileUploadBox
                  label="Bill of Lading (BOL)"
                  type="bol"
                  onFileUpload={handleFileUpload}
                />
                <FileUploadBox
                  label="Proof of Delivery (POD)"
                  type="pod"
                  onFileUpload={handleFileUpload}
                />
                <FileUploadBox
                  label="Damage Photos"
                  type="damage-photos"
                  onFileUpload={handleFileUpload}
                />
                <FileUploadBox
                  label="Scale Ticket"
                  type="scale-ticket"
                  onFileUpload={handleFileUpload}
                />
                <FileUploadBox
                  label="Lumper"
                  type="lumper"
                  onFileUpload={handleFileUpload}
                />
              </div>

              {/* Uploaded Documents Section - Show ALL documents */}
              {formData.documents.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      All Uploaded Documents
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        Total: {formData.documents.length} file(s)
                      </span>
                      <button
                        onClick={() => {
                          // Remove all documents
                          formData.documents.forEach((doc) =>
                            handleFileRemove(doc.id)
                          );
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto pr-2">
                    {formData.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 mb-2"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileImage className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="capitalize">
                                {doc.type.replace("-", " ")}
                              </span>
                              {doc.size && (
                                <span>• {(doc.size / 1024).toFixed(1)} KB</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {doc.previewUrl && (
                            <button
                              onClick={() => handleViewPreview(doc.previewUrl!)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="View Preview"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleFileRemove(doc.id)}
                            className="p-1 hover:bg-red-100 hover:text-red-600 rounded"
                            title="Remove File"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
