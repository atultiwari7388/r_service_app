"use client";

import React, { useState } from "react";
import {
  Download,
  Upload,
  Plus,
  RefreshCw,
  Database,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Mail,
  Phone,
  Building,
  Calendar,
} from "lucide-react";
import EditCarrierDialog from "../components/EditCarrierComponent";
import Header from "../components/Header";

// --- Type Definitions ---
interface Carrier {
  id: string;
  carrierName: string;
  mcNumber: string;
  dotNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  contactPerson: string;
  status: "Active" | "Inactive" | "Pending" | "Frozen";
  customCarrierId: string;
  accountSynced: boolean;
  dateTime: string;
  isFreezePay?: boolean;
}

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: Carrier["status"] }> = ({ status }) => {
  const getStatusConfig = (status: Carrier["status"]) => {
    switch (status) {
      case "Active":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          icon: <CheckCircle className="w-3 h-3" />,
        };
      case "Inactive":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          icon: <XCircle className="w-3 h-3" />,
        };
      case "Pending":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          border: "border-yellow-200",
          icon: <Clock className="w-3 h-3" />,
        };
      case "Frozen":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: <XCircle className="w-3 h-3" />,
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
          icon: <Clock className="w-3 h-3" />,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.icon}
      {status}
    </span>
  );
};

// --- Account Sync Badge ---
const AccountSyncBadge: React.FC<{ synced: boolean }> = ({ synced }) => {
  return synced ? (
    <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
      <CheckCircle className="w-4 h-4 text-green-600" />
    </div>
  ) : (
    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
      <Clock className="w-4 h-4 text-gray-400" />
    </div>
  );
};

// --- Action Dropdown Component ---
const ActionDropdown: React.FC<{
  carrierId: string;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, carrierId: string) => void;
}> = ({ carrierId, isOpen, onClose, onAction }) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: "view",
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      color: "text-blue-600",
    },
    {
      id: "edit",
      label: "Edit Carrier",
      icon: <Edit className="w-4 h-4" />,
      color: "text-green-600",
    },
    {
      id: "freeze",
      label: "Freeze Pay",
      icon: <XCircle className="w-4 h-4" />,
      color: "text-orange-600",
    },
    {
      id: "sync",
      label: "Sync Account",
      icon: <RefreshCw className="w-4 h-4" />,
      color: "text-purple-600",
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      color: "text-red-600",
    },
  ];

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
      <div className="py-1">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              onAction(action.id, carrierId);
              onClose();
            }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm ${action.color} hover:bg-gray-50 transition-colors`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function CarriersPage({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const itemsPerPage = 7;

  // --- Dummy Data (based on your screenshot) ---
  const dummyCarriers: Carrier[] = [
    {
      id: "1",
      carrierName: "3.4mma.his",
      mcNumber: "MC503581",
      dotNumber: "354719",
      address: "4651 W Corral Ave",
      city: "Fresno",
      state: "CA",
      zipCode: "93722",
      phone: "(559) 250-0000",
      email: "indemnetric@gmail.com",
      contactPerson: "Right: Avraw",
      status: "Active",
      customCarrierId: "CAR001",
      accountSynced: true,
      dateTime: "2024-01-15 14:30",
      isFreezePay: false,
    },
    {
      id: "2",
      carrierName: "3.1kcts.Transport.his",
      mcNumber: "MC502030",
      dotNumber: "2940598",
      address: "Po Box 6602",
      city: "Kent",
      state: "WA",
      zipCode: "98064",
      phone: "(465) 070-7575",
      email: "tgentanageortneg@outlook.com",
      contactPerson: "Right: Singh",
      status: "Active",
      customCarrierId: "CAR002",
      accountSynced: true,
      dateTime: "2024-01-14 11:20",
      isFreezePay: true,
    },
    {
      id: "3",
      carrierName: "7.9km.Carrier.his",
      mcNumber: "MC194054",
      dotNumber: "229693",
      address: "3428 Ro Dennis Ln",
      city: "Batesfield",
      state: "CA",
      zipCode: "95238",
      phone: "(618) 890-202",
      email: "Yayushot23@gmail.com",
      contactPerson: "using: aupb",
      status: "Inactive",
      customCarrierId: "CAR003",
      accountSynced: false,
      dateTime: "2024-01-13 09:45",
    },
    {
      id: "4",
      carrierName: "7bbs.Transport.his",
      mcNumber: "MC596382",
      dotNumber: "2898433",
      address: "347 E Ervis St",
      city: "San Bernardino",
      state: "CA",
      zipCode: "92408",
      phone: "(230) 944-474",
      email: "PMEETMARSPORTATON@GAMAL.COM",
      contactPerson: "-",
      status: "Active",
      customCarrierId: "CAR004",
      accountSynced: true,
      dateTime: "2024-01-12 16:15",
    },
    {
      id: "5",
      carrierName: "A.A.A.Express.Transport.LLC",
      mcNumber: "MC729056",
      dotNumber: "2088453",
      address: "6409 Jesus St",
      city: "Donna",
      state: "TX",
      zipCode: "78537",
      phone: "(969) 998-2002",
      email: "oscrap.300pg@gmail.com",
      contactPerson: "Oscar Porras",
      status: "Pending",
      customCarrierId: "CAR005",
      accountSynced: false,
      dateTime: "2024-01-11 10:30",
    },
    {
      id: "6",
      carrierName: "A.S.D.Transport.his",
      mcNumber: "MC503058",
      dotNumber: "325849",
      address: "1450 Stan Avenue Suite 92 Pte Di",
      city: "Clovis",
      state: "CA",
      zipCode: "9581",
      phone: "(559) 250-0000",
      email: "affincd.fireshire@yahoo.com",
      contactPerson: "Right: Singh",
      status: "Active",
      customCarrierId: "CAR006",
      accountSynced: true,
      dateTime: "2024-01-10 13:45",
    },
    {
      id: "7",
      carrierName: "A.Aud.Transport.his",
      mcNumber: "MC503254",
      dotNumber: "377727",
      address: "2040 Philipp St",
      city: "San Fernando",
      state: "CA",
      zipCode: "9340",
      phone: "(291) 053-352",
      email: "asranageort999@gmail.com",
      contactPerson: "Steve Dean Blanche",
      status: "Frozen",
      customCarrierId: "CAR007",
      accountSynced: false,
      dateTime: "2024-01-09 15:20",
    },
    {
      id: "8",
      carrierName: "Bestway Logistics Inc",
      mcNumber: "MC889012",
      dotNumber: "4456123",
      address: "1234 Commerce St",
      city: "Dallas",
      state: "TX",
      zipCode: "75201",
      phone: "(214) 555-1234",
      email: "info@bestwaylogistics.com",
      contactPerson: "John Smith",
      status: "Active",
      customCarrierId: "CAR008",
      accountSynced: true,
      dateTime: "2024-01-08 08:30",
    },
    {
      id: "9",
      carrierName: "Swift Transport Co",
      mcNumber: "MC667890",
      dotNumber: "3987654",
      address: "5678 Industrial Way",
      city: "Phoenix",
      state: "AZ",
      zipCode: "85001",
      phone: "(602) 555-9876",
      email: "dispatch@swifttransport.com",
      contactPerson: "Mike Johnson",
      status: "Inactive",
      customCarrierId: "CAR009",
      accountSynced: false,
      dateTime: "2024-01-07 11:15",
    },
    {
      id: "10",
      carrierName: "Reliable Carriers LLC",
      mcNumber: "MC334455",
      dotNumber: "1122334",
      address: "9101 Trucker Ave",
      city: "Atlanta",
      state: "GA",
      zipCode: "30301",
      phone: "(404) 555-5566",
      email: "support@reliablecarriers.com",
      contactPerson: "Sarah Williams",
      status: "Pending",
      customCarrierId: "CAR010",
      accountSynced: false,
      dateTime: "2024-01-06 14:45",
    },
  ];

  // --- Filter Carriers ---
  const filteredCarriers = dummyCarriers.filter((carrier) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      carrier.carrierName.toLowerCase().includes(query) ||
      carrier.mcNumber.toLowerCase().includes(query) ||
      carrier.dotNumber.toLowerCase().includes(query) ||
      carrier.city.toLowerCase().includes(query) ||
      carrier.state.toLowerCase().includes(query) ||
      carrier.email.toLowerCase().includes(query) ||
      carrier.contactPerson.toLowerCase().includes(query)
    );
  });

  // --- Pagination ---
  const totalPages = Math.ceil(filteredCarriers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCarriers = filteredCarriers.slice(startIndex, endIndex);

  // --- Action Handlers ---
  const handleAction = (action: string, carrierId: string) => {
    console.log(`${action} for carrier:`, carrierId);
    // Implement action logic here
  };

  const handleRowClick = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setIsEditDialogOpen(true);
  };

  const toggleDropdown = (carrierId: string) => {
    setOpenDropdown(openDropdown === carrierId ? null : carrierId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}

      <Header
        title="Carriers"
        description="Manage all your carriers in one place"
        onMenuClick={onMenuClick}
      >
        {/* Top Right Buttons */}
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Download Template
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" />
            Import Carrier
          </button>
          <button className="px-4 py-2 bg-[#F96176] text-white rounded-md hover:bg-[#F96176]/90 flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Create New Carrier
          </button>
        </div>
      </Header>

      {/* Summary Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Carriers in Networks</p>
                <p className="text-2xl font-bold text-gray-900">800</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">607</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">193</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Action Buttons Row */}
      <div className="px-6 pb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search carriers by name, MC, DOT, city, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4" />
                Sync
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm">
                <Database className="w-4 h-4" />
                Get Carrier Data
              </button>
              <button className="px-4 py-2 bg-[#F96176] text-white rounded-md hover:bg-[#F96176]/90 flex items-center gap-2 text-sm">
                <UserPlus className="w-4 h-4" />
                Initiate New Carrier Registration
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Carriers Table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Carrier Name
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    MC
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    DOT
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Zip Code
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact Person
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Custom Carrier ID
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account Synced
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedCarriers.map((carrier) => (
                  <tr
                    key={carrier.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(carrier)}
                  >
                    <td className="py-4 px-4">
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(carrier.id)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                          title="More Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <ActionDropdown
                          carrierId={carrier.id}
                          isOpen={openDropdown === carrier.id}
                          onClose={() => setOpenDropdown(null)}
                          onAction={handleAction}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-gray-900">
                        {carrier.carrierName}
                      </div>
                      {carrier.isFreezePay && (
                        <div className="text-xs text-red-600 font-medium mt-1">
                          Freeze Pay
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {carrier.mcNumber}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {carrier.dotNumber}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 max-w-[150px] truncate">
                      {carrier.address}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {carrier.city}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {carrier.state}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {carrier.zipCode}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Phone className="w-3 h-3" />
                        {carrier.phone}
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-[180px]">
                      <div className="flex items-center gap-1 text-sm text-gray-900 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{carrier.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 max-w-[120px] truncate">
                      {carrier.contactPerson}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={carrier.status} />
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {carrier.customCarrierId}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <AccountSyncBadge synced={carrier.accountSynced} />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {carrier.dateTime}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredCarriers.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No carriers found
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Try adjusting your search to find what you're looking for."
                  : "No carriers available. Create your first carrier."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredCarriers.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(endIndex, filteredCarriers.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filteredCarriers.length}</span>{" "}
                carriers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        currentPage === pageNum
                          ? "bg-[#F96176] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Carrier Dialog */}
      <EditCarrierDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedCarrier(null);
        }}
        carrierId={selectedCarrier?.id}
        // carrierData={selectedCarrier}
      />
    </div>
  );
}
