"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
  Truck,
  Package,
  MapPin,
  Weight,
  User,
  FileText,
  Clock,
  ChevronRight,
  ChevronLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Eye,
  Settings,
  Building,
  Thermometer,
  Ruler,
} from "lucide-react";

// --- Types & Interfaces ---

interface LoadData {
  loadNumber: string;
  status: string;
  customer: string;
  customerAddress: string;
  primaryFees: string;
  feeType: string;
  tenderedMiles: string;
  fuelSurcharge: string;
  targetRate: string;
  billingAuthority: string;
  billingAddress: string;
  salesAgent: string;
  bookingTerminal: string;
  revenue: string;
  profit: string;
  ratePerMile: string;
  flatRate: string;
  loadedMiles: string;
  extensionTracked: string;
  quantity: string;
  weight: string;
  loadType: string;
  commodity: string;
  declaredValue: string;
  carrier: string;
  truck: string;
  trailer: string;
  driver: string;
  dispatcher: string;
  temperature: string;
  length: string;
}

interface Stop {
  type: "PICKUP" | "DELIVERY";
  number: number;
  date: string;
  timeWindow: string;
  locationName: string;
  address: string;
  cityStateZip: string;
  contact: string;
  qty: string;
  weight: string;
  instructions: string;
  miles: string;
  detention: string;
  status: "Completed" | "Pending" | "In Transit";
}

interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  uploadedBy: string;
}

// --- Mock Data ---

const MOCK_LOAD_DATA: LoadData = {
  loadNumber: "203783",
  status: "Completed",
  customer: "Welcome Enterprises Inc.",
  customerAddress: "Your Customer Info",
  primaryFees: "$3,400.00",
  feeType: "Flat Rate",
  tenderedMiles: "3,500 Miles",
  fuelSurcharge: "Flat Amount 0.00",
  targetRate: "Reefer $0",
  billingAuthority: "Welcome Enterprises Brokerage Inc.",
  billingAddress: "Alaska, GB",
  salesAgent: "System Admin",
  bookingTerminal: "Main Office - AR",
  revenue: "$3,400.00",
  profit: "$4,500.00",
  ratePerMile: "$0.57",
  flatRate: "$3,400.00",
  loadedMiles: "3,500 Miles",
  extensionTracked: "0.0000 (Calc.: 0.000)",
  quantity: "2343 Pickets",
  weight: "28,975.00 lbs",
  loadType: "Full Truck Load",
  commodity: "Pickets",
  declaredValue: "$10,000.00",
  carrier: "S.S. Transport Inc.",
  truck: "TRK-9901",
  trailer: "TRL-5520",
  driver: "Steve Expiry",
  dispatcher: "Alex Morgan",
  temperature: "Set Point: -10 F",
  length: "53 ft",
};

const MOCK_STOPS: Stop[] = [
  {
    type: "PICKUP",
    number: 1,
    date: "17/01/2025",
    timeWindow: "09:00 AM - 09:00 PM",
    locationName: "FREEZE #1 STORE",
    address: "3114 W APACHE",
    cityStateZip: "SPRINGDALE, AR, 72794",
    contact: "Warehouse Mgr",
    qty: "2343 Pickets",
    weight: "28,975 lbs",
    instructions: "RJ100 #1:145847, 143897. Check in at Guard Shack.",
    miles: "0 Empty",
    detention: "No Out Detention",
    status: "Completed",
  },
  {
    type: "DELIVERY",
    number: 2,
    date: "17/01/2025",
    timeWindow: "09:00 AM - 09:00 AM",
    locationName: "TECHNOLOGY CENTER",
    address: "Technology Drive",
    cityStateZip: "Future Products, CA, 90210",
    contact: "John Doe - (555) 123-4567",
    qty: "2343 Pickets",
    weight: "28,975 lbs",
    instructions: "Live Unload. Driver must assist with tailgating.",
    miles: "15 Empty",
    detention: "Detention: 2 hours",
    status: "Completed",
  },
];

const MOCK_DOCS: Document[] = [
  {
    id: "1",
    name: "Rate Confirmation.pdf",
    type: "Rate Con",
    date: "Jan 15, 2025",
    size: "1.2 MB",
    uploadedBy: "System",
  },
  {
    id: "2",
    name: "Bill of Lading (signed).pdf",
    type: "BOL",
    date: "Jan 17, 2025",
    size: "2.4 MB",
    uploadedBy: "Driver App",
  },
  {
    id: "3",
    name: "Lumper Receipt.jpg",
    type: "Receipt",
    date: "Jan 17, 2025",
    size: "850 KB",
    uploadedBy: "Driver App",
  },
  {
    id: "4",
    name: "Proof of Delivery.pdf",
    type: "POD",
    date: "Jan 18, 2025",
    size: "1.1 MB",
    uploadedBy: "Billing Dept",
  },
  {
    id: "5",
    name: "Weight Ticket.pdf",
    type: "Ticket",
    date: "Jan 17, 2025",
    size: "0.5 MB",
    uploadedBy: "Driver App",
  },
];

const TABS = [
  { id: "load-info", label: "Load Information" },
  { id: "load-docs", label: "Load Docs" },
  { id: "accessorial", label: "Accessorial" },
  { id: "adjustments", label: "Adjustments" },
  { id: "support", label: "Support" },
  { id: "milestone", label: "Milestone" },
  { id: "check-calls", label: "Check Calls" },
  { id: "exceptions", label: "Load Exceptions" },
  { id: "additional-info", label: "Additional Info" },
  { id: "update-history", label: "Updated History" },
  { id: "bd-history", label: "Bd History" },
  { id: "miles", label: "Miles breakdown" },
];

// --- Sub-Components ---

const StatCard = ({
  label,
  value,
  colorClass = "text-gray-900",
}: {
  label: string;
  value: string;
  colorClass?: string;
}) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
      {label}
    </span>
    <span className={`text-lg font-bold ${colorClass} truncate`}>{value}</span>
  </div>
);

const EmptyState = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200 border-dashed h-96">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
      <AlertCircle className="w-8 h-8 text-gray-300" />
    </div>
    <h3 className="text-lg font-medium text-gray-900">No {title} Found</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
      There is currently no data available for this section. Information will
      appear here once it is generated.
    </p>
  </div>
);

const LoadDocsView = ({ docs }: { docs: Document[] }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
      <h3 className="font-semibold text-gray-800">
        Uploaded Documents ({docs.length})
      </h3>
      <button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition flex items-center gap-2">
        <Paperclip className="w-3 h-3" /> Upload New
      </button>
    </div>
    <div className="p-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
          <tr>
            <th className="px-6 py-3">Document Name</th>
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Date Uploaded</th>
            <th className="px-6 py-3">Uploaded By</th>
            <th className="px-6 py-3">Size</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {docs.map((doc) => (
            <tr
              key={doc.id}
              className="hover:bg-blue-50/50 transition-colors group"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-gray-900">{doc.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-600">
                <span className="px-2 py-1 rounded-full bg-gray-100 text-xs font-medium border border-gray-200">
                  {doc.type}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-600">{doc.date}</td>
              <td className="px-6 py-4 text-gray-600">{doc.uploadedBy}</td>
              <td className="px-6 py-4 text-gray-600">{doc.size}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const LoadInfoView = ({
  loadData,
  stops,
}: {
  loadData: LoadData;
  stops: Stop[];
}) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Customer & Financials & Authority */}
        <div className="space-y-8">
          {/* Customer Section */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Customer *
            </h3>
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-900">
                {loadData.customer}
              </p>
              <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                {loadData.customerAddress}
              </button>
            </div>
          </div>

          {/* Financials Block */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
              <span className="text-gray-500">Primary Fees</span>
              <span className="font-semibold text-gray-900">
                {loadData.primaryFees}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
              <span className="text-gray-500">Fees Type</span>
              <span className="font-medium text-gray-900">
                {loadData.feeType}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
              <span className="text-gray-500">Tendered Miles</span>
              <span className="font-semibold text-gray-900">
                {loadData.tenderedMiles}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
              <span className="text-gray-500">Fuel Surcharge</span>
              <span className="font-medium text-gray-900">
                {loadData.fuelSurcharge}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Target Rate</span>
              <span className="font-medium text-gray-900">
                {loadData.targetRate}
              </span>
            </div>
          </div>

          {/* Authority & Agents */}
          <div className="space-y-4 pt-2">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Billing Authority *
              </h3>
              <p className="text-sm font-semibold text-gray-900">
                {loadData.billingAuthority}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin className="w-3 h-3" /> {loadData.billingAddress}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Sales Agent
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                    SA
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {loadData.salesAgent}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Booking Terminal Office
                </h3>
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">
                    {loadData.bookingTerminal}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Load Specs */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Load Specifications
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Weight Box */}
            <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Total Weight</div>
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-gray-900">
                  {loadData.weight}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">
                  Normal
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded border border-amber-200">
                  Tarp Req
                </span>
              </div>
            </div>

            {/* Commodity Box */}
            <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Commodity</div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-gray-900">
                  {loadData.commodity}
                </span>
              </div>
            </div>

            {/* Temp Box */}
            <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Temperature</div>
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-gray-900">
                  {loadData.temperature}
                </span>
              </div>
            </div>

            {/* Length Box */}
            <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Length</div>
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-gray-900">
                  {loadData.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-4 rounded border border-blue-100">
            <div className="text-xs text-blue-500 mb-1 font-medium uppercase">
              Declared Value
            </div>
            <div className="text-xl font-bold text-blue-900">
              {loadData.declaredValue}
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Info Strip */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Dispatch Assignment
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div>
            <p className="text-xs text-slate-500 mb-1">Carrier</p>
            <p className="font-semibold text-slate-900 text-sm">
              {loadData.carrier}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Truck / Trailer</p>
            <div className="flex items-center gap-2">
              <Truck className="w-3 h-3 text-slate-400" />
              <p className="font-semibold text-slate-900 text-sm">
                {loadData.truck} / {loadData.trailer}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Driver</p>
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-slate-400" />
              <p className="font-semibold text-slate-900 text-sm">
                {loadData.driver}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Dispatcher</p>
            <p className="font-semibold text-slate-900 text-sm">
              {loadData.dispatcher}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Customer Load Notes
          </h4>
          <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 text-sm text-yellow-800 italic min-h-[60px]">
            No specific customer notes provided.
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Dispatch Internal Notes
          </h4>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-600 min-h-[60px]">
            Driver instructed to call upon arrival.
          </div>
        </div>
      </div>
    </div>

    {/* Stops Section */}
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          Stop Information
        </h3>
      </div>
      <div className="p-6">
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gray-200" />

          {stops.map((stop, index) => (
            <div key={index} className="relative pl-12 mb-10 last:mb-0 group">
              {/* Timeline Dot */}
              <div
                className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm ${
                  stop.type === "PICKUP"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {stop.type === "PICKUP" ? (
                  <Truck className="w-4 h-4" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
              </div>

              {/* Content Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        stop.type === "PICKUP"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}
                    >
                      {stop.type} {stop.number}
                    </span>
                    <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {stop.date}
                    </span>
                    <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {stop.timeWindow}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mt-1">
                    {stop.locationName}
                  </h4>
                </div>
                {/* Status Badge */}
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" /> {stop.status}
                </div>
              </div>

              {/* Content Details Box */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors shadow-sm">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {stop.address}, {stop.cityStateZip}
                </p>
                <p className="text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  {stop.contact}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Total Qty
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {stop.qty}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Total Weight
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {stop.weight}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">
                      Detention
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {stop.detention}
                    </span>
                  </div>
                </div>

                {stop.instructions && (
                  <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 border border-gray-200 mt-2">
                    <span className="font-bold text-gray-700 mr-1">
                      Instructions:
                    </span>
                    {stop.instructions}
                  </div>
                )}

                <div className="mt-3 flex gap-4 text-xs text-gray-400">
                  <span>
                    Empty Miles:{" "}
                    <span className="text-gray-600 font-medium">
                      {stop.miles}
                    </span>
                  </span>
                  {stop.type === "PICKUP" && (
                    <span>
                      Reset Mode:{" "}
                      <span className="text-gray-600 font-medium">
                        Continuous
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- Main App Component ---

export default function ViewLoadInfoPage() {
  const [activeTab, setActiveTab] = useState("load-info");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 pb-20">
      {/* Top Navbar Area */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 hover:border-gray-300">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Load #{MOCK_LOAD_DATA.loadNumber}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full tracking-wide border border-emerald-200">
                    {MOCK_LOAD_DATA.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> {MOCK_LOAD_DATA.loadType}
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span>Created Jan 15, 2025</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2 shadow-sm transition-all">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2 shadow-sm transition-all">
                <Download className="w-4 h-4" /> Download
              </button>
              <button className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2 shadow-sm transition-all">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button className="px-3 py-2 bg-blue-600 border border-blue-600 rounded-md text-white hover:bg-blue-700 text-sm font-medium flex items-center gap-2 shadow-sm transition-all">
                <Settings className="w-4 h-4" /> Actions
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-4 md:px-6 pb-6 pt-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-0 divide-x-0 lg:divide-x divide-gray-100">
            <div className="px-2">
              <StatCard label="Revenue" value={MOCK_LOAD_DATA.revenue} />
            </div>
            <div className="px-2 lg:pl-6">
              <StatCard
                label="Profit"
                value={MOCK_LOAD_DATA.profit}
                colorClass="text-emerald-600"
              />
            </div>
            <div className="px-2 lg:pl-6">
              <StatCard
                label="Rate / Mile"
                value={`${MOCK_LOAD_DATA.ratePerMile}`}
              />
            </div>
            <div className="px-2 lg:pl-6">
              <StatCard label="Flat Rate" value={MOCK_LOAD_DATA.flatRate} />
            </div>
            <div className="px-2 lg:pl-6">
              <StatCard
                label="Loaded Miles"
                value={MOCK_LOAD_DATA.loadedMiles}
              />
            </div>
            <div className="px-2 lg:pl-6">
              <StatCard label="Total Weight" value={MOCK_LOAD_DATA.weight} />
            </div>
          </div>
        </div>

        {/* Tabs - Scrollable */}
        <div className="px-4 md:px-6 border-t border-gray-200 bg-gray-50/50">
          <div className="flex overflow-x-auto hide-scrollbar gap-1 pt-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-t-lg"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area with Resizable/Toggleable Sidebar */}
      <div className="px-4 md:px-6 py-6 max-w-[1920px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 relative items-start">
          {/* Main Panel */}
          <div
            className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
              isSidebarExpanded ? "lg:mr-0" : "mr-0"
            }`}
          >
            {activeTab === "load-info" ? (
              <LoadInfoView loadData={MOCK_LOAD_DATA} stops={MOCK_STOPS} />
            ) : activeTab === "load-docs" ? (
              <LoadDocsView docs={MOCK_DOCS} />
            ) : (
              <EmptyState
                title={TABS.find((t) => t.id === activeTab)?.label || "Content"}
              />
            )}
          </div>

          {/* Toggle Button ("Green Arrow") */}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={`hidden lg:flex absolute z-10 top-0 transition-all duration-300 items-center justify-center w-6 h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md rounded-l-md border-l border-t border-b border-emerald-600 cursor-pointer
             ${isSidebarExpanded ? "right-[320px]" : "right-0"}`}
            title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarExpanded ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Right Sidebar */}
          <div
            className={`transition-all duration-300 ease-in-out bg-white lg:bg-transparent overflow-hidden flex-shrink-0
             ${
               isSidebarExpanded
                 ? "w-full lg:w-[320px] opacity-100"
                 : "w-0 opacity-0 lg:opacity-100 lg:w-0"
             }
             `}
          >
            <div className="space-y-6 lg:min-w-[320px]">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-colors">
                    <FileText className="w-4 h-4" /> View BOL / Confirmation
                  </button>
                  <button className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                    <Truck className="w-4 h-4" /> Load / Driver Sheet
                  </button>
                  <button className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                    <Clock className="w-4 h-4" /> Add Check Call
                  </button>
                </div>
              </div>

              {/* Additional Info Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Additional Info
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-500">Extension Tracked</span>
                    <span className="font-medium text-gray-900">
                      {MOCK_LOAD_DATA.extensionTracked}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span className="text-gray-500">Quantity</span>
                    <span className="font-medium text-gray-900">
                      {MOCK_LOAD_DATA.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Load Type</span>
                    <span className="font-medium text-gray-900">
                      {MOCK_LOAD_DATA.loadType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Agency Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Agency
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Assigned Agent</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                        A
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        Alex Morgan
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Agency</p>
                    <select className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 border p-2 bg-gray-50">
                      <option>Braborage Inc.</option>
                      <option>Global Logistics</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline Feed */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Activity Log
                </h3>
                <div className="relative border-l-2 border-gray-100 ml-2 space-y-6">
                  {[
                    {
                      status: "Completed",
                      date: "Jan 18",
                      time: "11:00 AM",
                      color: "bg-emerald-500",
                    },
                    {
                      status: "Delivered",
                      date: "Jan 18",
                      time: "09:00 AM",
                      color: "bg-emerald-500",
                    },
                    {
                      status: "In Transit",
                      date: "Jan 17",
                      time: "02:00 PM",
                      color: "bg-blue-500",
                    },
                    {
                      status: "Picked Up",
                      date: "Jan 17",
                      time: "09:00 AM",
                      color: "bg-blue-500",
                    },
                    {
                      status: "Dispatched",
                      date: "Jan 16",
                      time: "09:30 AM",
                      color: "bg-gray-400",
                    },
                    {
                      status: "Booked",
                      date: "Jan 15",
                      time: "10:00 AM",
                      color: "bg-gray-300",
                    },
                  ].map((item, i) => (
                    <div key={i} className="ml-4 relative">
                      <div
                        className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${item.color}`}
                      />
                      <p className="text-sm font-medium text-gray-900">
                        {item.status}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.date} • {item.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Helper Icon Component
function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}
