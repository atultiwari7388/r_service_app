import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Calendar,
  User,
  MoreVertical,
  Eye,
  Edit,
  Printer,
  Download,
  Filter,
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  DollarSign,
  FileUp,
  Mail,
  FileText,
  History,
  Copy,
  PauseCircle,
  Phone,
  X,
} from "lucide-react";
import Link from "next/link";
import Header from "../components/Header";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

interface DispatchStop {
  company?: string;
  date?: string;
}

interface DispatchLoadRecord {
  id: string;
  loadNumber?: string;
  customerName?: string;
  type?: string;
  status?: string;
  truckId?: string;
  trailerId?: string;
  driverId?: string;
  weight?: string;
  totalCustomerRate?: number;
  totalCarrierPay?: number;
  documents?: { id: string }[];
  pickups?: DispatchStop[];
  deliveries?: DispatchStop[];
  dispatchNotes?: string;
  lineHaul?: number;
  fuelSurcharge?: number;
  detention?: number;
  layover?: number;
  tonu?: number;
  accessorials?: number;
  createdAt?: { seconds?: number };
}

export default function TruckDispatchScreen({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const { user } = useAuth() || { user: null };
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [effectiveUserId, setEffectiveUserId] = useState("");
  const [isResolvingUser, setIsResolvingUser] = useState(true);
  const [isFetchingLoads, setIsFetchingLoads] = useState(false);
  const [loads, setLoads] = useState<LoadData[]>([]);
  // const [isSidebarOpen, setSidebarOpen] = useState(false);

  const itemsPerPage = 10;

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

  const toDateLabel = (value?: string) => {
    if (!value) return "-";
    return value;
  };

  const normalizeLoadForTable = useCallback((record: DispatchLoadRecord): LoadData => {
    const pickups = record.pickups || [];
    const deliveries = record.deliveries || [];
    const pickup = pickups[0] || {};
    const delivery = deliveries[0] || {};

    const revenue =
      Number(record.lineHaul || 0) +
      Number(record.fuelSurcharge || 0) +
      Number(record.detention || 0) +
      Number(record.layover || 0) +
      Number(record.tonu || 0) +
      Number(record.accessorials || 0);
    const carrierPay = Number(record.totalCarrierPay || 0);

    const mappedStatus =
      record.status === "Posted"
        ? "Booked"
        : record.status === "Draft"
        ? "Pre-Planned"
        : record.status || "Booked";

    return {
      id: record.id,
      loadNumber: record.loadNumber || "LD-DRAFT",
      customer: record.customerName || "-",
      type: (record.type as LoadData["type"]) || "FTL",
      status: mappedStatus as LoadData["status"],
      truck: record.truckId || "-",
      trailer: record.trailerId || "-",
      driver: record.driverId || "-",
      pickupLocation: pickup.company || "-",
      pickupDate: toDateLabel(pickup.date),
      dropLocation: delivery.company || "-",
      dropDate: toDateLabel(delivery.date),
      distance: "-",
      weight: record.weight ? `${record.weight} lbs` : "-",
      rate: Number(record.totalCustomerRate || revenue || 0),
      profit: Number((record.totalCustomerRate || revenue || 0) - carrierPay),
      progress: mappedStatus === "Completed" ? 100 : 0,
      quantity: Math.max(pickups.length, deliveries.length, 1),
      specialInstructions: record.dispatchNotes || "",
      documents: record.documents?.length || 0,
    };
  }, []);

  const tabDefinitions = [
    { id: "all", label: "All" },
    { id: "booked", label: "Booked" },
    { id: "pre-planned", label: "Pre-Planned" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
  ];

  useEffect(() => {
    if (!user?.uid) {
      setEffectiveUserId("");
      setIsResolvingUser(false);
      return;
    }

    resolveEffectiveUserId(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    const fetchLoads = async () => {
      if (!effectiveUserId) return;

      setIsFetchingLoads(true);
      try {
        const loadsSnap = await getDocs(
          query(
            collection(db, "dispatch_loads"),
            where("effectiveUserId", "==", effectiveUserId)
          )
        );

        const normalized = loadsSnap.docs
          .map(
            (item) =>
              ({
                id: item.id,
                ...(item.data() as Omit<DispatchLoadRecord, "id">),
              }) as DispatchLoadRecord
          )
          .sort(
            (a, b) =>
              (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          )
          .map(normalizeLoadForTable);

        setLoads(normalized);
      } catch (error) {
        GlobalToastError(error);
        setLoads([]);
      } finally {
        setIsFetchingLoads(false);
      }
    };

    fetchLoads();
  }, [effectiveUserId, normalizeLoadForTable]);

  const allLoads = loads;
  const tabStatusMap: Record<string, string> = {
    booked: "Booked",
    "pre-planned": "Pre-Planned",
    ready: "Ready",
    active: "Active",
    completed: "Completed",
    "missing-bol": "Missing BOL",
  };
  const tabs: Tab[] = tabDefinitions.map((tab) => ({
    id: tab.id,
    label: tab.label,
    count:
      tab.id === "all"
        ? allLoads.length
        : allLoads.filter((item) => item.status === tabStatusMap[tab.id]).length,
    color: "",
    bgColor: "",
  }));
  const activeLoadsCount = allLoads.filter(
    (item) => item.status === "Active"
  ).length;
  const readyLoadsCount = allLoads.filter((item) =>
    ["Ready", "Booked", "Posted", "Draft"].includes(item.status)
  ).length;
  const totalRateAmount = allLoads.reduce(
    (sum, item) => sum + Number(item.rate || 0),
    0
  );

  // --- Filter Loads ---
  const filteredLoads = allLoads.filter((load) => {
    if (activeTab !== "all") {
      if (load.status !== tabStatusMap[activeTab]) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        load.loadNumber.toLowerCase().includes(query) ||
        load.customer.toLowerCase().includes(query) ||
        load.driver.toLowerCase().includes(query) ||
        load.pickupLocation.toLowerCase().includes(query) ||
        load.dropLocation.toLowerCase().includes(query)
      );
    }

    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // --- Pagination ---
  const totalPages = Math.ceil(filteredLoads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLoads = filteredLoads.slice(startIndex, endIndex);

  // --- Action Handlers ---
  const handleViewLoad = (loadId: string) => {
    // Using Link component in the JSX instead
    console.log("View load:", loadId);
  };

  const handleEditLoad = (loadId: string) => {
    console.log("Edit load:", loadId);
  };

  const handlePrintLoad = (loadId: string) => {
    console.log("Print load:", loadId);
  };

  const handleDownloadDocs = (loadId: string) => {
    console.log("Download docs for load:", loadId);
  };

  // --- Dropdown Handlers ---
  const handleMoreClick = (e: React.MouseEvent, loadId: string) => {
    e.stopPropagation();
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    setDropdownPosition({
      x: rect.right - 224,
      y: rect.bottom + window.scrollY,
    });

    setDropdownOpen(dropdownOpen === loadId ? null : loadId);
  };

  const handleCloseDropdown = () => {
    setDropdownOpen(null);
  };

  const handleAction = (action: string, loadId: string) => {
    console.log(`${action} for load:`, loadId);
    // Your action handlers
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        Please log in to view dispatch loads.
      </div>
    );
  }

  if (isResolvingUser || isFetchingLoads) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        Loading dispatch loads...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP HEADER ROW - Hamburger, Title, and Action Buttons */}
      <Header
        title="Truck Dispatch"
        description="Manage and track all your loads in one place"
        onMenuClick={onMenuClick}
      >
        <Link
          href="/create-new-load"
          className="px-4 py-2 bg-[#F96176] text-white rounded-md flex items-center gap-2"
        >
          + New Load
        </Link>
      </Header>

      {/* Main Content Area */}
      <div className="p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Loads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allLoads.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Loads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeLoadsCount}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ready for Dispatch</p>
                <p className="text-2xl font-bold text-gray-900">
                  {readyLoadsCount}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalRateAmount.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search loads by ID, customer, driver, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Sort
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Loads Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    SR. NO.
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    LOAD DETAILS
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    TYPE
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    TRUCK/TRAILER
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    PICKUP
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    DROP
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    PROGRESS
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    QUANTITY
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLoads.map((load, index) => (
                  <tr key={load.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#F96176]">
                            {load.loadNumber}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-sm text-gray-900">
                            {load.customer}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          {load.driver}
                          <span className="text-gray-300">•</span>
                          <DollarSign className="w-3 h-3" />$
                          {load.rate.toLocaleString()}
                          <span className="text-gray-300">•</span>
                          <span
                            className={`font-medium ${
                              load.profit > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            +${load.profit}
                          </span>
                        </div>
                        {load.specialInstructions && (
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="font-medium">Note:</span>{" "}
                            {load.specialInstructions}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <LoadTypeBadge type={load.type} />
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={load.status} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          {load.truck}
                        </div>
                        <div className="text-xs text-gray-500">
                          {load.trailer}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <MapPin className="w-3 h-3" />
                          {load.pickupLocation}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {load.pickupDate}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <MapPin className="w-3 h-3" />
                          {load.dropLocation}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {load.dropDate}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-2">
                        <ProgressBar progress={load.progress} />
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">{load.distance}</span>
                          <span className="font-medium text-gray-700">
                            {load.weight}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Docs: {load.documents} / 5
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                          {load.quantity}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/view-load-info/${load.id}`}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                          title="View Load"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleEditLoad(load.id)}
                          className="p-1.5 hover:bg-green-50 rounded text-green-600"
                          title="Edit Load"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintLoad(load.id)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocs(load.id)}
                          className="p-1.5 hover:bg-purple-50 rounded text-purple-600"
                          title="Download Documents"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleMoreClick(e, load.id)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                          title="More Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <DropdownMenu
                          loadId={load.id}
                          isOpen={dropdownOpen === load.id}
                          onClose={handleCloseDropdown}
                          position={dropdownPosition}
                          onAction={handleAction}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredLoads.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No loads found
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "No loads available for the selected status."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredLoads.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(endIndex, filteredLoads.length)}
                </span>{" "}
                of <span className="font-medium">{filteredLoads.length}</span>{" "}
                results
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
    </div>
  );
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  loadId,
  isOpen,
  onClose,
  position,
  onAction,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      dropdownRef.current.style.left = `${Math.max(10, adjustedX)}px`;
      dropdownRef.current.style.top = `${Math.max(10, adjustedY)}px`;
    }
  }, [isOpen, position]);

  const menuItems = [
    {
      id: "upload-bol",
      label: "Upload BOL",
      icon: <FileUp className="w-4 h-4" />,
      color: "text-blue-600 hover:bg-blue-50",
    },
    {
      id: "upload-pod",
      label: "Upload POD",
      icon: <FileUp className="w-4 h-4" />,
      color: "text-green-600 hover:bg-green-50",
    },
    {
      id: "email-log",
      label: "Email Log",
      icon: <Mail className="w-4 h-4" />,
      color: "text-purple-600 hover:bg-purple-50",
    },
    {
      id: "load-notes",
      label: "Load Notes",
      icon: <FileText className="w-4 h-4" />,
      color: "text-yellow-600 hover:bg-yellow-50",
    },
    {
      id: "history",
      label: "History",
      icon: <History className="w-4 h-4" />,
      color: "text-gray-600 hover:bg-gray-50",
    },
    {
      id: "duplicate-load",
      label: "Duplicate Load",
      icon: <Copy className="w-4 h-4" />,
      color: "text-indigo-600 hover:bg-indigo-50",
    },
    {
      id: "additional-invoice",
      label: "Additional Invoice",
      icon: <FileText className="w-4 h-4" />,
      color: "text-pink-600 hover:bg-pink-50",
    },
    {
      id: "hold",
      label: "Hold",
      icon: <PauseCircle className="w-4 h-4" />,
      color: "text-orange-600 hover:bg-orange-50",
    },
    {
      id: "view-check-calls",
      label: "View Check Calls",
      icon: <Phone className="w-4 h-4" />,
      color: "text-teal-600 hover:bg-teal-50",
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 mt-2 w-56 rounded-md bg-white shadow-lg border border-gray-200"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Actions</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-1 max-h-64 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onAction(item.id, loadId);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${item.color} transition-colors hover:bg-gray-50`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Tab Navigation Component ---
const TabNavigation: React.FC<{
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => {
  const getTabColors = (tabId: string, isActive: boolean) => {
    if (isActive) {
      return {
        bg: "bg-[#F96176]",
        text: "text-white",
        badge: "bg-white/30",
      };
    }

    switch (tabId) {
      case "all":
        return {
          bg: "bg-gray-200",
          text: "text-gray-800",
          badge: "bg-white/60",
        };
      case "booked":
        return {
          bg: "bg-amber-200",
          text: "text-amber-800",
          badge: "bg-white/60",
        };
      case "pre-planned":
        return {
          bg: "bg-violet-200",
          text: "text-violet-800",
          badge: "bg-white/60",
        };
      case "active":
        return {
          bg: "bg-pink-200",
          text: "text-pink-800",
          badge: "bg-white/60",
        };
      case "completed":
        return {
          bg: "bg-green-200",
          text: "text-green-800",
          badge: "bg-white/60",
        };
      default:
        return {
          bg: "bg-gray-200",
          text: "text-gray-800",
          badge: "bg-white/60",
        };
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const colors = getTabColors(tab.id, isActive);

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium text-sm transition-all ${colors.bg} ${colors.text} hover:opacity-90`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Booked":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          icon: <Calendar className="w-3 h-3" />,
        };
      case "Pre-Planned":
        return {
          bg: "bg-violet-50",
          text: "text-violet-700",
          border: "border-violet-200",
          icon: <Clock className="w-3 h-3" />,
        };
      case "Ready":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: <CheckCircle className="w-3 h-3" />,
        };
      case "Active":
        return {
          bg: "bg-[#F96176]/10",
          text: "text-[#F96176]",
          border: "border-[#F96176]/20",
          icon: <Truck className="w-3 h-3" />,
        };
      case "Completed":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          icon: <CheckCircle className="w-3 h-3" />,
        };
      case "Missing BOL":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          icon: <AlertCircle className="w-3 h-3" />,
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
      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.icon}
      {status}
    </span>
  );
};

// --- Progress Bar Component ---
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-green-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

// --- Load Type Badge Component ---
const LoadTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "FTL":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
        };
      case "LTL":
        return {
          bg: "bg-purple-50",
          text: "text-purple-700",
          border: "border-purple-200",
        };
      case "Reefer":
        return {
          bg: "bg-teal-50",
          text: "text-teal-700",
          border: "border-teal-200",
        };
      case "Flatbed":
        return {
          bg: "bg-orange-50",
          text: "text-orange-700",
          border: "border-orange-200",
        };
      case "Dry Van":
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
        };
    }
  };

  const config = getTypeConfig(type);

  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {type}
    </span>
  );
};
