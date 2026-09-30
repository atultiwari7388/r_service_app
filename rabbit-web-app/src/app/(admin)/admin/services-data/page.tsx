"use client";

import React, { useEffect, useState, useMemo } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Database,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  FileJson,
  Truck,
  Layers,
  Tag,
  Wrench,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  ExternalLink,
  Code2,
  Table as TableIcon,
} from "lucide-react";
import toast from "react-hot-toast";

// --- Types ---
export interface DValue {
  brand: string;
  type: string; // "Reading" | "Day" | "hours" | etc.
  value: string;
  vType?: string;
}

export interface SubServiceGroup {
  sName?: string[];
}

export interface ServiceItem {
  sId: string;
  sName: string;
  vType: "Truck" | "Trailer" | string;
  priority: number | string;
  pName: string[];
  subServices: (SubServiceGroup | string)[];
  dValues: DValue[];
}

const STANDARD_TRUCK_BRANDS = [
  "Detroit",
  "Cummins",
  "Paccar",
  "Volvo",
  "Mack",
  "Maxforce",
  "Navistar",
  "Caterpiller",
  "Mercedes Benz",
  "Hino Motors",
  "Isuzu Motors",
];

const STANDARD_TRAILER_BRANDS = ["Dry Van", "Carrier", "Thermoking", "Mylex"];

const VALUE_TYPES = ["Reading", "Day", "hours"];

export default function AdminServicesDataPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [vTypeFilter, setVTypeFilter] = useState<"all" | "Truck" | "Trailer">("all");
  const [activeTab, setActiveTab] = useState<"services" | "json">("services");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<ServiceItem>({
    sId: "",
    sName: "",
    vType: "Truck",
    priority: 0,
    pName: [],
    subServices: [],
    dValues: [],
  });

  const [pNameInput, setPNameInput] = useState("");
  const [subServicesInput, setSubServicesInput] = useState("");

  // Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    service: ServiceItem | null;
    index: number | null;
  }>({
    isOpen: false,
    service: null,
    index: null,
  });

  // --- Fetch Services from Firestore ---
  const fetchServices = async () => {
    setLoading(true);
    try {
      console.log("🔍 [Admin] Fetching doc(db, 'metadata', 'serviceData')...");
      const docRef = doc(db, "metadata", "serviceData");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const rawData = docSnap.data();
        console.log("✅ Fetched Service Data Document:", rawData);

        if (Array.isArray(rawData.data)) {
          setServices(rawData.data as ServiceItem[]);
          console.log(`📦 Loaded ${rawData.data.length} services`);
        } else {
          setServices([]);
          console.warn("⚠️ Document 'data' field is not an array:", rawData);
        }
      } else {
        // Fallback plural check
        const fallbackDocRef = doc(db, "metadata", "servicesData");
        const fallbackSnap = await getDoc(fallbackDocRef);
        if (fallbackSnap.exists() && Array.isArray(fallbackSnap.data().data)) {
          setServices(fallbackSnap.data().data as ServiceItem[]);
        } else {
          setServices([]);
        }
      }
    } catch (err: any) {
      console.error("❌ Error fetching service data:", err);
      toast.error(`Error loading services: ${err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // --- Persist Entire List to Firestore ---
  const saveServicesToFirestore = async (updatedList: ServiceItem[]) => {
    setSaving(true);
    try {
      const docRef = doc(db, "metadata", "serviceData");
      await setDoc(docRef, { data: updatedList }, { merge: true });
      setServices(updatedList);
      toast.success("Changes saved to Firebase successfully!");
      return true;
    } catch (err: any) {
      console.error("❌ Error saving services to Firebase:", err);
      toast.error(`Failed to save: ${err?.message || "Unknown error"}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // --- Helper: Extract subServices strings ---
  const getSubServicesList = (subServices: (SubServiceGroup | string)[]): string[] => {
    if (!subServices || !Array.isArray(subServices)) return [];
    const list: string[] = [];
    subServices.forEach((item) => {
      if (typeof item === "string") {
        list.push(item);
      } else if (item && Array.isArray(item.sName)) {
        list.push(...item.sName);
      }
    });
    return list;
  };

  // --- Open Add Modal ---
  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingIndex(null);
    setFormData({
      sId: "",
      sName: "",
      vType: "Truck",
      priority: 0,
      pName: [],
      subServices: [],
      dValues: [
        { brand: "Detroit", type: "Reading", value: "0" },
        { brand: "Cummins", type: "Reading", value: "0" },
        { brand: "Paccar", type: "Reading", value: "0" },
        { brand: "Volvo", type: "Reading", value: "0" },
        { brand: "Mack", type: "Reading", value: "0" },
      ],
    });
    setPNameInput("");
    setSubServicesInput("");
    setIsModalOpen(true);
  };

  // --- Open Edit Modal ---
  const handleOpenEditModal = (service: ServiceItem, index: number) => {
    setModalMode("edit");
    setEditingIndex(index);
    setFormData({
      sId: service.sId || "",
      sName: service.sName || "",
      vType: service.vType || "Truck",
      priority: service.priority ?? 0,
      pName: Array.isArray(service.pName) ? [...service.pName] : [],
      subServices: Array.isArray(service.subServices) ? [...service.subServices] : [],
      dValues: Array.isArray(service.dValues)
        ? service.dValues.map((v) => ({ ...v }))
        : [],
    });
    setPNameInput("");
    const subList = getSubServicesList(service.subServices);
    setSubServicesInput(subList.join(", "));
    setIsModalOpen(true);
  };

  // --- Clone / Duplicate Service ---
  const handleCloneService = (service: ServiceItem) => {
    setModalMode("add");
    setEditingIndex(null);
    setFormData({
      sId: `${service.sId}_copy`,
      sName: `${service.sName} (Copy)`,
      vType: service.vType || "Truck",
      priority: service.priority ?? 0,
      pName: Array.isArray(service.pName) ? [...service.pName] : [],
      subServices: Array.isArray(service.subServices) ? [...service.subServices] : [],
      dValues: Array.isArray(service.dValues)
        ? service.dValues.map((v) => ({ ...v }))
        : [],
    });
    setPNameInput("");
    const subList = getSubServicesList(service.subServices);
    setSubServicesInput(subList.join(", "));
    setIsModalOpen(true);
  };

  // --- Auto slugify sName into sId ---
  const handleNameChange = (name: string) => {
    setFormData((prev) => {
      // Only auto-generate sId if adding a new service and sId is untouched or matches previous auto slug
      if (modalMode === "add" && (!prev.sId || prev.sId === slugify(prev.sName))) {
        return { ...prev, sName: name, sId: slugify(name) };
      }
      return { ...prev, sName: name };
    });
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  // --- Manage dValues ---
  const handleAddDValueRow = () => {
    setFormData((prev) => ({
      ...prev,
      dValues: [...prev.dValues, { brand: "Mylex", type: "Reading", value: "0" }],
    }));
  };

  const handleUpdateDValue = (idx: number, field: keyof DValue, val: string) => {
    setFormData((prev) => {
      const next = [...prev.dValues];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, dValues: next };
    });
  };

  const handleRemoveDValue = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      dValues: prev.dValues.filter((_, i) => i !== idx),
    }));
  };

  const handleApplyPresetBrands = (brands: string[], defaultValue = "0", type = "Reading") => {
    const newRows: DValue[] = brands.map((b) => ({
      brand: b,
      type: type,
      value: defaultValue,
    }));
    setFormData((prev) => ({
      ...prev,
      dValues: newRows,
    }));
    toast.success(`Loaded ${brands.length} brand presets`);
  };

  // --- Manage pName Tags ---
  const handleAddPName = () => {
    if (!pNameInput.trim()) return;
    const tag = pNameInput.trim();
    if (!formData.pName.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        pName: [...prev.pName, tag],
      }));
    }
    setPNameInput("");
  };

  const handleRemovePName = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      pName: prev.pName.filter((tag) => tag !== tagToRemove),
    }));
  };

  // --- Save Form (Add or Edit) ---
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sName.trim()) {
      toast.error("Please enter a Service Name");
      return;
    }
    if (!formData.sId.trim()) {
      toast.error("Please enter a Service ID");
      return;
    }

    // Process Sub-services from input
    const subList = subServicesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const formattedSubServices: SubServiceGroup[] =
      subList.length > 0 ? [{ sName: subList }] : [];

    const finalItem: ServiceItem = {
      ...formData,
      sId: formData.sId.trim(),
      sName: formData.sName.trim(),
      priority: Number(formData.priority) || 0,
      subServices: formattedSubServices,
    };

    let updatedList: ServiceItem[] = [];

    if (modalMode === "add") {
      // Check for duplicate ID
      const exists = services.some(
        (s) => s.sId.toLowerCase() === finalItem.sId.toLowerCase()
      );
      if (exists) {
        toast.error(`Service ID '${finalItem.sId}' already exists. Use a unique ID.`);
        return;
      }
      updatedList = [...services, finalItem];
    } else {
      // Edit existing
      if (editingIndex === null || editingIndex < 0) return;
      updatedList = [...services];
      updatedList[editingIndex] = finalItem;
    }

    const success = await saveServicesToFirestore(updatedList);
    if (success) {
      setIsModalOpen(false);
    }
  };

  // --- Delete Handler ---
  const handleConfirmDelete = async () => {
    if (deleteModal.index === null) return;
    const updated = services.filter((_, idx) => idx !== deleteModal.index);
    const success = await saveServicesToFirestore(updated);
    if (success) {
      setDeleteModal({ isOpen: false, service: null, index: null });
      toast.success("Service deleted successfully");
    }
  };

  // --- Toggle Expand Row ---
  const toggleRow = (sId: string) => {
    setExpandedRows((prev) => ({ ...prev, [sId]: !prev[sId] }));
  };

  // --- Download Full Backup JSON ---
  const handleDownloadBackup = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify({ data: services }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `serviceData_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Backup downloaded!");
  };

  // --- Filtered and Search List ---
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      // vType filter
      if (vTypeFilter !== "all" && item.vType !== vTypeFilter) {
        return false;
      }
      // search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sName = (item.sName || "").toLowerCase();
        const sId = (item.sId || "").toLowerCase();
        const vType = (item.vType || "").toLowerCase();
        const pNames = (item.pName || []).join(" ").toLowerCase();
        const subNames = getSubServicesList(item.subServices).join(" ").toLowerCase();
        const brandNames = (item.dValues || []).map((v) => v.brand).join(" ").toLowerCase();

        return (
          sName.includes(q) ||
          sId.includes(q) ||
          vType.includes(q) ||
          pNames.includes(q) ||
          subNames.includes(q) ||
          brandNames.includes(q)
        );
      }
      return true;
    });
  }, [services, vTypeFilter, searchQuery]);

  // Counts
  const truckCount = useMemo(
    () => services.filter((s) => s.vType === "Truck").length,
    [services]
  );
  const trailerCount = useMemo(
    () => services.filter((s) => s.vType === "Trailer").length,
    [services]
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[#F96176]">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-gray-900">
                    Services Master Data Manager
                  </h1>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-[#F96176]/10 text-[#F96176] rounded-full">
                    {services.length} Total Services
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Manage truck & trailer maintenance service intervals, default values, brands, and sub-services.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#F96176] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#F96176]/90 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Service
            </button>
            <button
              onClick={fetchServices}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
              title="Refresh from Firebase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-50 transition shadow-xs"
              title="Download JSON backup"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setVTypeFilter("all")}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            vTypeFilter === "all"
              ? "border-[#F96176] ring-1 ring-[#F96176]"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            All Services
          </span>
          <div className="text-2xl font-bold text-gray-900">{services.length}</div>
          <span className="text-xs text-gray-500 mt-0.5 block">Configured</span>
        </div>

        <div
          onClick={() => setVTypeFilter("Truck")}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            vTypeFilter === "Truck"
              ? "border-[#F96176] ring-1 ring-[#F96176]"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-blue-600" /> Truck Services
          </span>
          <div className="text-2xl font-bold text-blue-600">{truckCount}</div>
          <span className="text-xs text-gray-500 mt-0.5 block">
            {((truckCount / (services.length || 1)) * 100).toFixed(0)}% of total
          </span>
        </div>

        <div
          onClick={() => setVTypeFilter("Trailer")}
          className={`bg-white p-4 rounded-xl border transition cursor-pointer shadow-xs ${
            vTypeFilter === "Trailer"
              ? "border-[#F96176] ring-1 ring-[#F96176]"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-600" /> Trailer Services
          </span>
          <div className="text-2xl font-bold text-purple-600">{trailerCount}</div>
          <span className="text-xs text-gray-500 mt-0.5 block">
            {((trailerCount / (services.length || 1)) * 100).toFixed(0)}% of total
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Database Status
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-gray-900">Firestore Live</span>
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block font-mono">
            metadata &rarr; serviceData
          </span>
        </div>
      </div>

      {/* Main Table / View Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:px-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/60">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-200/70 p-1 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab("services")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
                  activeTab === "services"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" /> Services List
              </button>
              <button
                onClick={() => setActiveTab("json")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
                  activeTab === "json"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> Raw JSON View
              </button>
            </div>

            {/* Filter Pills */}
            <div className="hidden sm:flex items-center gap-1 ml-3 border-l border-gray-300 pl-3">
              {(["all", "Truck", "Trailer"] as const).map((vt) => (
                <button
                  key={vt}
                  onClick={() => setVTypeFilter(vt)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    vTypeFilter === vt
                      ? "bg-[#F96176] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {vt === "all" ? "All Types" : vt}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search service, ID, brand, parts..."
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-1 focus:ring-[#F96176] focus:border-[#F96176] outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 text-[#F96176] animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">
              Loading service catalog from Firestore...
            </p>
          </div>
        ) : activeTab === "json" ? (
          /* JSON Viewer */
          <div className="p-4 sm:p-6 bg-slate-950 text-slate-100">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs text-slate-400 font-mono">
              <span>doc(db, "metadata", "serviceData") &bull; {services.length} items</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({ data: services }, null, 2));
                  toast.success("JSON copied to clipboard!");
                }}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy JSON
              </button>
            </div>
            <pre className="text-xs font-mono leading-relaxed max-h-[600px] overflow-y-auto">
              {JSON.stringify({ data: services }, null, 2)}
            </pre>
          </div>
        ) : (
          /* Services Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="px-5 py-3.5 w-12 text-center">#</th>
                  <th className="px-5 py-3.5">Service Name & ID</th>
                  <th className="px-5 py-3.5">Vehicle Type</th>
                  <th className="px-5 py-3.5">Brand Values</th>
                  <th className="px-5 py-3.5">Sub-Services / Parts</th>
                  <th className="px-5 py-3.5 text-center">Priority</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredServices.map((service, index) => {
                  const actualIndex = services.findIndex((s) => s.sId === service.sId);
                  const isExpanded = !!expandedRows[service.sId];
                  const subList = getSubServicesList(service.subServices);

                  return (
                    <React.Fragment key={service.sId || index}>
                      <tr className="hover:bg-gray-50/80 transition-colors group">
                        {/* Index */}
                        <td className="px-5 py-4 text-xs font-mono text-gray-400 text-center">
                          {index + 1}
                        </td>

                        {/* Name & ID */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <span>{service.sName || "Untitled Service"}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {service.sId}
                            </span>
                          </div>
                        </td>

                        {/* Vehicle Type */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              service.vType === "Truck"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : service.vType === "Trailer"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {service.vType === "Truck" ? (
                              <Truck className="w-3 h-3" />
                            ) : (
                              <Layers className="w-3 h-3" />
                            )}
                            {service.vType || "Truck"}
                          </span>
                        </td>

                        {/* Brand Values Summary */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">
                              {service.dValues?.length || 0} Brands configured
                            </span>
                            <button
                              onClick={() => toggleRow(service.sId)}
                              className="text-xs text-[#F96176] hover:underline flex items-center gap-0.5 font-medium"
                            >
                              {isExpanded ? (
                                <>
                                  Hide <ChevronUp className="w-3.5 h-3.5" />
                                </>
                              ) : (
                                <>
                                  View <ChevronDown className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          </div>
                          {/* Quick pill preview */}
                          <div className="flex flex-wrap gap-1 mt-1 max-w-xs">
                            {(service.dValues || []).slice(0, 3).map((dv, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-gray-50 border border-gray-200 text-gray-600 px-1.5 py-0.2 rounded"
                              >
                                {dv.brand}: <b>{dv.value}</b> ({dv.type})
                              </span>
                            ))}
                            {(service.dValues || []).length > 3 && (
                              <span className="text-[10px] text-gray-400">
                                +{(service.dValues || []).length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Sub-Services & Parts */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {subList.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] uppercase font-bold text-gray-400">
                                  Sub-services:
                                </span>
                                {subList.slice(0, 2).map((sub, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium"
                                  >
                                    {sub}
                                  </span>
                                ))}
                                {subList.length > 2 && (
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    +{subList.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}

                            {service.pName && service.pName.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] uppercase font-bold text-gray-400">
                                  Parts:
                                </span>
                                {service.pName.map((p, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-mono"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}

                            {subList.length === 0 && (!service.pName || service.pName.length === 0) && (
                              <span className="text-xs text-gray-400 italic">None</span>
                            )}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                            {service.priority ?? 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(service, actualIndex)}
                              title="Edit Service"
                              className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-md border border-blue-200 hover:border-blue-600 transition shadow-2xs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCloneService(service)}
                              title="Duplicate / Clone Service"
                              className="p-1.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-md border border-slate-200 hover:border-slate-700 transition shadow-2xs"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  service,
                                  index: actualIndex,
                                })
                              }
                              title="Delete Service"
                              className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-md border border-red-200 hover:border-red-600 transition shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-gray-200">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-[#F96176]" />
                                Default Intervals by Vehicle Brand ({service.dValues?.length || 0})
                              </h4>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                {(service.dValues || []).map((dv, i) => (
                                  <div
                                    key={i}
                                    className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs"
                                  >
                                    <div className="font-bold text-gray-900 truncate">
                                      {dv.brand}
                                    </div>
                                    <div className="text-gray-500 mt-1 flex items-baseline justify-between">
                                      <span className="text-[11px]">Value:</span>
                                      <b className="text-[#F96176] font-mono text-sm">
                                        {dv.value}
                                      </b>
                                    </div>
                                    <div className="text-gray-400 text-[10px] mt-0.5 text-right uppercase">
                                      {dv.type}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {subList.length > 0 && (
                                <div className="pt-2 border-t border-gray-100">
                                  <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                                    All Sub-Services:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {subList.map((sub, i) => (
                                      <span
                                        key={i}
                                        className="text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-medium"
                                      >
                                        {sub}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredServices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FileJson className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-700">
                        No matching services found
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Try clearing search query or changing vehicle filter
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD / EDIT SERVICE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F96176]/10 text-[#F96176] flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {modalMode === "add" ? "Add New Service" : "Edit Service"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {modalMode === "add"
                      ? "Create a new maintenance service entry in master metadata"
                      : `Editing service: ${formData.sName}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Oil Change / Service"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#F96176] focus:border-[#F96176] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Service ID (sId) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sId: e.target.value }))
                    }
                    placeholder="e.g. oil_change_service"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-1 focus:ring-[#F96176] focus:border-[#F96176] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vType}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, vType: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-[#F96176] focus:border-[#F96176] outline-none"
                  >
                    <option value="Truck">Truck</option>
                    <option value="Trailer">Trailer</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#F96176] focus:border-[#F96176] outline-none"
                  />
                </div>
              </div>

              {/* pName (Related Parts / Parameters) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Related Parts / Parameter Names (pName)</span>
                  <span className="text-[11px] font-normal text-gray-400">
                    Press Enter or click Add Tag
                  </span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={pNameInput}
                    onChange={(e) => setPNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPName();
                      }
                    }}
                    placeholder="e.g. oilChange, oilPan, oilPump"
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#F96176] focus:border-[#F96176] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPName}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition"
                  >
                    Add Tag
                  </button>
                </div>
                {formData.pName.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.pName.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemovePName(tag)}
                          className="hover:text-emerald-950 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-services */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sub-Services (comma separated)
                </label>
                <input
                  type="text"
                  value={subServicesInput}
                  onChange={(e) => setSubServicesInput(e.target.value)}
                  placeholder="e.g. Firestone, Bridgestone, Michelin, Goodyear or Steer Axle (D/S), Steer Axle (P/S)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-[#F96176] focus:border-[#F96176] outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Separate multiple sub-options with commas.
                </p>
              </div>

              {/* Brand Default Values (dValues) */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      Default Brand Intervals (dValues)
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Configure interval values for specific vehicle engines/brands.
                    </p>
                  </div>

                  {/* Preset quick actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyPresetBrands(STANDARD_TRUCK_BRANDS, "0", "Reading")
                      }
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-[11px] font-semibold transition"
                    >
                      + Truck Brands Preset
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyPresetBrands(STANDARD_TRAILER_BRANDS, "365", "Day")
                      }
                      className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded text-[11px] font-semibold transition"
                    >
                      + Trailer Brands Preset
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDValueRow}
                      className="px-2.5 py-1 bg-[#F96176] text-white hover:bg-[#F96176]/90 rounded text-[11px] font-semibold transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Row
                    </button>
                  </div>
                </div>

                {/* dValues Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100/80 sticky top-0 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="px-3 py-2">Brand / Model</th>
                        <th className="px-3 py-2 w-32">Interval Value</th>
                        <th className="px-3 py-2 w-32">Interval Type</th>
                        <th className="px-3 py-2 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {formData.dValues.map((dv, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80">
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={dv.brand}
                              onChange={(e) =>
                                handleUpdateDValue(idx, "brand", e.target.value)
                              }
                              placeholder="e.g. Detroit, Cummins, Mylex"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:border-[#F96176] outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={dv.value}
                              onChange={(e) =>
                                handleUpdateDValue(idx, "value", e.target.value)
                              }
                              placeholder="e.g. 25, 90, 300"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono font-bold text-[#F96176] focus:border-[#F96176] outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={dv.type}
                              onChange={(e) =>
                                handleUpdateDValue(idx, "type", e.target.value)
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:border-[#F96176] outline-none"
                            >
                              {VALUE_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveDValue(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {formData.dValues.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-400">
                            No brand intervals defined. Click "+ Truck Brands Preset" or "Add Row".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#F96176] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#F96176]/90 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Service Data"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">
              Delete Service?
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1 leading-relaxed">
              Are you sure you want to delete{" "}
              <b className="text-gray-900">{deleteModal.service?.sName}</b> (
              <span className="font-mono">{deleteModal.service?.sId}</span>)? This action will update Firebase Firestore immediately.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, service: null, index: null })
                }
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? "Deleting..." : "Yes, Delete Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
