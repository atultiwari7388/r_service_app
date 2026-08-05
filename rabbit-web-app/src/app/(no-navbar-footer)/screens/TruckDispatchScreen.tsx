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
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { useAuth } from "@/contexts/AuthContexts";
import { db, storage } from "@/lib/firebase";
import { GlobalToastError } from "@/utils/globalErrorToast";
import toast from "react-hot-toast";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

interface LoadData {
  id: string;
  loadNumber: string;
  isDuplicate?: boolean;
  duplicateOfLoadNumber?: string;
  customer: string;
  type: "FTL" | "LTL" | "Reefer" | "Flatbed" | "Dry Van";
  status: string;
  statusGroup:
    | "Booked"
    | "Pre-Planned"
    | "Ready"
    | "Active"
    | "Completed"
    | "Missing BOL";
  truck: string;
  trailer: string;
  driver: string;
  pickupLocation: string;
  pickupDate: string;
  dropLocation: string;
  dropDate: string;
  distance: string;
  weight: string;
  rate: number;
  profit: number;
  progress: number;
  quantity: number;
  specialInstructions: string;
  documents: number;
}

interface Tab {
  id: string;
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

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
  documents?: DispatchDocumentRecord[];
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
  effectiveUserId?: string;
  currentUserId?: string;
  isDuplicate?: boolean;
  duplicateOfLoadNumber?: string;
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

interface DispatchHistoryRecord {
  id: string;
  action: string;
  message: string;
  createdAt?: { seconds?: number };
  createdBy?: string;
  metadata?: Record<string, string>;
}

interface DriverRecord {
  userName?: string;
  email?: string;
}

interface VehicleRecord {
  vehicleNumber?: string;
  companyName?: string;
}

const resolveStatusGroup = (
  status?: string
): LoadData["statusGroup"] => {
  switch (status) {
    case "Draft":
      return "Pre-Planned";
    case "Posted":
      return "Booked";
    case "Assigned":
      return "Ready";
    case "In Transit":
      return "Active";
    case "Delivered":
    case "Completed Toun":
      return "Completed";
    case "Booked":
    case "Pre-Planned":
    case "Ready":
    case "Active":
    case "Completed":
    case "Missing BOL":
      return status;
    default:
      return "Booked";
  }
};

export default function TruckDispatchScreen({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const { user } = useAuth() || { user: null };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [effectiveUserId, setEffectiveUserId] = useState("");
  const [isResolvingUser, setIsResolvingUser] = useState(true);
  const [isFetchingLoads, setIsFetchingLoads] = useState(false);
  const [loads, setLoads] = useState<LoadData[]>([]);
  const [activeLoadId, setActiveLoadId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<"bol" | "pod" | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(
    null
  );
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItems, setHistoryItems] = useState<DispatchHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const itemsPerPage = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyOrUserName, setCompanyOrUserName] = useState("");

  const resolveEffectiveUserId = async (userId: string) => {
    setIsResolvingUser(true);
    try {
      const userDoc = await getDoc(doc(db, "Users", userId));
      if (!userDoc.exists()) {
        setEffectiveUserId(userId);
        return;
      }

      const userData = userDoc.data() as {
        role?: string;
        createdBy?: string;
        companyName?: string;
        userName?: string;
      };

      let targetUserId = userId;
      let targetName = (userData.companyName || userData.userName || "").trim();

      if (userData.role === "SubOwner" && userData.createdBy) {
        targetUserId = userData.createdBy;
        const ownerDoc = await getDoc(doc(db, "Users", userData.createdBy));
        if (ownerDoc.exists()) {
          const ownerData = ownerDoc.data() as {
            companyName?: string;
            userName?: string;
          };
          const ownerName = (ownerData.companyName || ownerData.userName || "").trim();
          if (ownerName) targetName = ownerName;
        }
      }

      setEffectiveUserId(targetUserId);
      setCompanyOrUserName(targetName);
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

  const generateLoadPrefix = (name: string): string => {
    const trimmed = (name || "").trim();
    if (!trimmed) return "LOAD";
    const formatted = trimmed
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return formatted || "LOAD";
  };

  const generateNextLoadNumber = async (
    ownerId: string,
    rawName: string
  ): Promise<string> => {
    const prefix = generateLoadPrefix(rawName);

    try {
      const loadsSnap = await getDocs(
        query(
          collection(db, "dispatch_loads"),
          where("effectiveUserId", "==", ownerId)
        )
      );

      let maxNum = 0;
      const escapedPrefix = prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const pattern = new RegExp(`^${escapedPrefix}-(\\d+)$`, "i");

      loadsSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const loadNum = data.loadNumber;
        if (typeof loadNum === "string") {
          const match = loadNum.match(pattern);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      });

      const nextNum = maxNum + 1;
      const paddedNum = String(nextNum).padStart(4, "0");
      return `${prefix}-${paddedNum}`;
    } catch (error) {
      console.error("Error generating load number:", error);
      return `${prefix}-0001`;
    }
  };

  const formatHistoryDate = (seconds?: number) => {
    if (!seconds) return "Just now";
    return new Date(seconds * 1000).toLocaleString();
  };

  const createHistoryEntry = async (
    loadId: string,
    action: string,
    message: string,
    metadata?: Record<string, string>
  ) => {
    await addDoc(collection(db, "dispatch_loads", loadId, "history"), {
      action,
      message,
      metadata: metadata || {},
      createdBy: user?.uid || "",
      createdAt: serverTimestamp(),
    });
  };

  const tabDefinitions = [
    { id: "all", label: "All" },
    { id: "booked", label: "Booked" },
    { id: "pre-planned", label: "Pre-Planned" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
  ];

  const fetchLoads = useCallback(async () => {
    if (!effectiveUserId) return;

    setIsFetchingLoads(true);
    try {
      const loadsSnap = await getDocs(
        query(
          collection(db, "dispatch_loads"),
          where("effectiveUserId", "==", effectiveUserId)
        )
      );

      const rawRecords = loadsSnap.docs
        .map(
          (item) =>
            ({
              id: item.id,
              ...(item.data() as Omit<DispatchLoadRecord, "id">),
            } as DispatchLoadRecord)
        )
        .sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );

      const uniqueDriverIds = Array.from(
        new Set(
          rawRecords
            .map((record) => record.driverId || "")
            .filter((id) => id.length > 0)
        )
      );

      const driverMap: Record<string, string> = {};
      const vehicleMap: Record<string, string> = {};

      await Promise.all(
        uniqueDriverIds.map(async (driverId) => {
          const driverSnap = await getDoc(doc(db, "Users", driverId));
          if (driverSnap.exists()) {
            const driverData = driverSnap.data() as DriverRecord;
            const driverName = (
              driverData.userName ||
              driverData.email ||
              driverId
            ).trim();
            driverMap[driverId] = driverName || driverId;
          } else {
            driverMap[driverId] = driverId;
          }

          const vehiclesSnap = await getDocs(
            collection(db, "Users", driverId, "Vehicles")
          );

          vehiclesSnap.docs.forEach((vehicleDoc) => {
            const vehicleData = vehicleDoc.data() as VehicleRecord;
            const vehicleNumber = (vehicleData.vehicleNumber || "").trim();
            const companyName = (vehicleData.companyName || "").trim();

            if (vehicleNumber && companyName) {
              vehicleMap[vehicleDoc.id] = `${vehicleNumber} (${companyName})`;
            } else if (vehicleNumber) {
              vehicleMap[vehicleDoc.id] = vehicleNumber;
            } else if (companyName) {
              vehicleMap[vehicleDoc.id] = companyName;
            }
          });
        })
      );

      const normalized = rawRecords.map((record) => {
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
        const status = record.status || "Draft";
        const statusGroup = resolveStatusGroup(status);
        return {
          id: record.id,
          loadNumber: record.loadNumber || "LD-DRAFT",
          isDuplicate: record.isDuplicate || false,
          duplicateOfLoadNumber: record.duplicateOfLoadNumber || "",
          customer: record.customerName || "-",
          type: (record.type as LoadData["type"]) || "FTL",
          status,
          statusGroup,
          truck:
            (record.truckId && vehicleMap[record.truckId]) ||
            record.truckId ||
            "-",
          trailer:
            (record.trailerId && vehicleMap[record.trailerId]) ||
            record.trailerId ||
            "-",
          driver:
            (record.driverId && driverMap[record.driverId]) ||
            record.driverId ||
            "-",
          pickupLocation: pickup.company || "-",
          pickupDate: toDateLabel(pickup.date),
          dropLocation: delivery.company || "-",
          dropDate: toDateLabel(delivery.date),
          distance: "-",
          weight: record.weight ? `${record.weight} lbs` : "-",
          rate: Number(record.totalCustomerRate || revenue || 0),
          profit: Number(
            (record.totalCustomerRate || revenue || 0) - carrierPay
          ),
          progress: statusGroup === "Completed" ? 100 : 0,
          quantity: Math.max(pickups.length, deliveries.length, 1),
          specialInstructions: record.dispatchNotes || "",
          documents: record.documents?.length || 0,
        } as LoadData;
      });

      setLoads(normalized);
    } catch (error) {
      GlobalToastError(error);
      setLoads([]);
    } finally {
      setIsFetchingLoads(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    if (!user?.uid) {
      setEffectiveUserId("");
      setIsResolvingUser(false);
      return;
    }

    resolveEffectiveUserId(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  const allLoads = loads.filter((load) => !load.isDuplicate);
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
        : allLoads.filter((item) => item.statusGroup === tabStatusMap[tab.id])
            .length,
    color: "",
    bgColor: "",
  }));
  const activeLoadsCount = allLoads.filter(
    (item) => item.statusGroup === "Active"
  ).length;
  const readyLoadsCount = allLoads.filter((item) =>
    ["Ready", "Booked", "Pre-Planned"].includes(item.statusGroup)
  ).length;
  const totalRateAmount = allLoads.reduce(
    (sum, item) => sum + Number(item.rate || 0),
    0
  );

  // --- Filter Loads ---
  const filteredLoads = allLoads.filter((load) => {
    if (activeTab !== "all") {
      if (load.statusGroup !== tabStatusMap[activeTab]) return false;
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
  const handleEditLoad = (loadId: string) => {
    router.push(`/create-new-load?editId=${loadId}`);
  };

  const handlePrintLoad = (loadId: string) => {
    window.open(
      `/view-load-info/${loadId}?action=print`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDownloadDocs = (loadId: string) => {
    window.open(
      `/view-load-info/${loadId}?action=download`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openUploadModal = (loadId: string, type: "bol" | "pod") => {
    setActiveLoadId(loadId);
    setUploadType(type);
    setSelectedUploadFile(null);
  };

  const closeUploadModal = () => {
    setActiveLoadId(null);
    setUploadType(null);
    setSelectedUploadFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadDocument = async () => {
    if (!activeLoadId || !uploadType || !selectedUploadFile) {
      toast.error("Please choose a file to upload.");
      return;
    }

    setIsUploadingDocument(true);
    try {
      const loadRef = doc(db, "dispatch_loads", activeLoadId);
      const loadSnap = await getDoc(loadRef);

      if (!loadSnap.exists()) {
        toast.error("Load not found.");
        return;
      }

      const loadData = loadSnap.data() as DispatchLoadRecord;
      const sanitizedName = selectedUploadFile.name.replace(/\s+/g, "_");
      const storagePath = `dispatch-loads/${activeLoadId}/${uploadType}/${Date.now()}-${sanitizedName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, selectedUploadFile);
      const downloadURL = await getDownloadURL(storageRef);

      const documentType =
        uploadType === "bol" ? "bill-of-lading" : "proof-of-delivery";
      const documentName =
        uploadType === "bol"
          ? `Uploaded BOL - ${selectedUploadFile.name}`
          : `Uploaded POD - ${selectedUploadFile.name}`;

      const nextDocuments: DispatchDocumentRecord[] = [
        ...(loadData.documents || []),
        {
          id: `${uploadType}-${Date.now()}`,
          name: documentName,
          type: documentType,
          size: selectedUploadFile.size,
          url: downloadURL,
          mimeType: selectedUploadFile.type,
          source: "uploaded",
          storagePath,
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
          uploadedByRole: "admin",
          uploadedById: user?.uid || "",
          uploadedByName: "Admin",
        },
      ];

      await updateDoc(loadRef, {
        documents: nextDocuments,
        updatedAt: serverTimestamp(),
      });

      await createHistoryEntry(
        activeLoadId,
        uploadType === "bol" ? "upload-bol" : "upload-pod",
        `${uploadType.toUpperCase()} uploaded`,
        {
          fileName: selectedUploadFile.name,
          documentType,
        }
      );

      toast.success(`${uploadType.toUpperCase()} uploaded successfully.`);
      closeUploadModal();
      setLoads((prev) =>
        prev.map((item) =>
          item.id === activeLoadId
            ? { ...item, documents: item.documents + 1 }
            : item
        )
      );
    } catch (error) {
      GlobalToastError(error);
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleShowHistory = async (loadId: string) => {
    setActiveLoadId(loadId);
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    try {
      const historySnap = await getDocs(
        collection(db, "dispatch_loads", loadId, "history")
      );
      const items = historySnap.docs
        .map(
          (item) =>
            ({
              id: item.id,
              ...(item.data() as Omit<DispatchHistoryRecord, "id">),
            } as DispatchHistoryRecord)
        )
        .sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
      setHistoryItems(items);
    } catch (error) {
      GlobalToastError(error);
      setHistoryItems([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDuplicateLoad = async (loadId: string) => {
    try {
      const sourceRef = doc(db, "dispatch_loads", loadId);
      const sourceSnap = await getDoc(sourceRef);

      if (!sourceSnap.exists()) {
        toast.error("Load not found.");
        return;
      }

      const sourceData = sourceSnap.data() as DispatchLoadRecord;
      const duplicateRef = doc(collection(db, "dispatch_loads"));
      const duplicateLoadNumber = await generateNextLoadNumber(
        effectiveUserId,
        companyOrUserName
      );
      const duplicatedDocuments = (sourceData.documents || []).map((item) => ({
        ...item,
        id: `${item.id || "doc"}-${Date.now()}`,
      }));
      const duplicateNote = `Duplicate of ${sourceData.loadNumber || loadId}`;
      const mergedDispatchNotes = sourceData.dispatchNotes
        ? `${duplicateNote}. ${sourceData.dispatchNotes}`
        : duplicateNote;

      await setDoc(duplicateRef, {
        ...sourceData,
        loadNumber: duplicateLoadNumber,
        status: "Draft",
        isDuplicate: true,
        duplicateOfLoadNumber: sourceData.loadNumber || loadId,
        dispatchNotes: mergedDispatchNotes,
        documents: duplicatedDocuments,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await createHistoryEntry(
        duplicateRef.id,
        "duplicate-load",
        `Load duplicated from ${sourceData.loadNumber || loadId}`,
        {
          sourceLoadId: loadId,
          sourceLoadNumber: sourceData.loadNumber || loadId,
        }
      );

      await createHistoryEntry(
        loadId,
        "duplicate-load",
        `Duplicated as ${duplicateLoadNumber}`,
        {
          duplicateLoadId: duplicateRef.id,
        }
      );

      toast.success("Load duplicated successfully.");
      await fetchLoads();
    } catch (error) {
      GlobalToastError(error);
    }
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
    switch (action) {
      case "upload-bol":
        openUploadModal(loadId, "bol");
        break;
      case "upload-pod":
        openUploadModal(loadId, "pod");
        break;
      case "history":
        handleShowHistory(loadId);
        break;
      case "duplicate-load":
        handleDuplicateLoad(loadId);
        break;
      case "email-log":
      case "load-notes":
        toast("This action will be connected later.");
        break;
      default:
        toast("This action is not available yet.");
        break;
    }
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
                          {load.isDuplicate && (
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 border border-indigo-200">
                              Duplicate
                            </span>
                          )}
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={(event) =>
          setSelectedUploadFile(event.target.files?.[0] || null)
        }
      />

      {uploadType && activeLoadId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload {uploadType.toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500">
                  Upload image, PDF, Word, or Excel files.
                </p>
              </div>
              <button
                onClick={closeUploadModal}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-gray-300 rounded-lg px-4 py-8 text-center hover:border-[#F96176] hover:bg-rose-50/50 transition"
              >
                <FileUp className="w-8 h-8 mx-auto mb-2 text-[#F96176]" />
                <div className="font-medium text-gray-900">Choose a file</div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedUploadFile
                    ? selectedUploadFile.name
                    : "PNG, JPG, PDF, DOC, DOCX, XLS, XLSX"}
                </div>
              </button>

              {selectedUploadFile && (
                <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
                  <div className="font-medium">{selectedUploadFile.name}</div>
                  <div className="text-gray-500">
                    {(selectedUploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <button
                onClick={closeUploadModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                disabled={!selectedUploadFile || isUploadingDocument}
                className="px-4 py-2 text-sm font-medium text-white bg-[#F96176] rounded-md hover:bg-[#f74e66] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingDocument
                  ? "Uploading..."
                  : `Upload ${uploadType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-gray-200 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Load History
                </h3>
                <p className="text-sm text-gray-500">
                  Recent actions for this load.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistoryItems([]);
                }}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {isLoadingHistory ? (
                <div className="text-sm text-gray-500">Loading history...</div>
              ) : historyItems.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No history available yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-gray-900">
                          {item.message}
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {formatHistoryDate(item.createdAt?.seconds)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                        {item.action}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
      case "Draft":
        return {
          bg: "bg-violet-50",
          text: "text-violet-700",
          border: "border-violet-200",
          icon: <Clock className="w-3 h-3" />,
        };
      case "Posted":
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
      case "Assigned":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: <CheckCircle className="w-3 h-3" />,
        };
      case "In Transit":
      case "Active":
        return {
          bg: "bg-[#F96176]/10",
          text: "text-[#F96176]",
          border: "border-[#F96176]/20",
          icon: <Truck className="w-3 h-3" />,
        };
      case "Delivered":
      case "Completed Toun":
      case "Completed":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          icon: <CheckCircle className="w-3 h-3" />,
        };
      case "Cancelled":
        return {
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: <PauseCircle className="w-3 h-3" />,
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
