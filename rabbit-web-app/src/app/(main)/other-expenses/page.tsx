"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import { ProfileValues, CompanyType } from "@/types/types";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, format } from "date-fns";
import {
  FaArrowLeft,
  FaPlus,
  FaSearch,
  FaTrash,
  FaEdit,
  FaFileExcel,
  FaFilePdf,
  FaArrowUp,
  FaArrowDown,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaTimes,
  FaExclamationTriangle,
  FaWallet,
} from "react-icons/fa";
import { utils, writeFile } from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AddOtherExpenseModal, {
  OtherExpenseRecord,
  OtherExpenseServiceOption,
} from "@/components/records/AddOtherExpenseModal";

const DEFAULT_SERVICES: string[] = [
  "Cash Advance",
  "Detention / Layover",
  "Driver Reimbursement",
  "Equipment Rental",
  "Fuel / Gas Surcharge",
  "Insurance & Legal",
  "Loading / Unloading (Lumper)",
  "Office & Misc Supplies",
  "Safety & Inspection",
  "Tolls & Permits",
  "Other",
];

const sortServicesAlphabetical = (
  services: OtherExpenseServiceOption[]
): OtherExpenseServiceOption[] => {
  const nonOther = services.filter(
    (s) => s.sName.trim().toLowerCase() !== "other"
  );
  const other = services.filter(
    (s) => s.sName.trim().toLowerCase() === "other"
  );

  nonOther.sort((a, b) =>
    a.sName.localeCompare(b.sName, undefined, { sensitivity: "base" })
  );

  return [...nonOther, ...other];
};

const formatDateSafe = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  try {
    const trimmed = String(dateStr).trim();
    if (!trimmed) return "";

    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
      const parts = trimmed.includes("-")
        ? trimmed.split("-")
        : trimmed.split("/");
      const p0 = Number(parts[0]);
      const p1 = Number(parts[1]);
      const yyyy = parts[2];
      if (p0 > 12) {
        return `${String(p1).padStart(2, "0")}-${String(p0).padStart(
          2,
          "0"
        )}-${yyyy}`;
      }
      return `${String(p0).padStart(2, "0")}-${String(p1).padStart(
        2,
        "0"
      )}-${yyyy}`;
    }

    const isoParsed = parseISO(trimmed);
    if (!isNaN(isoParsed.getTime())) {
      return format(isoParsed, "MM-dd-yyyy");
    }

    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime())) {
      return format(fallback, "MM-dd-yyyy");
    }

    return trimmed;
  } catch {
    return dateStr ? String(dateStr) : "";
  }
};

const formatEntryDate = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  const d = parseCustomDate(dateStr);
  if (!d) return dateStr;
  return format(d, "dd MMM yy");
};

const parseCustomDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();
  if (!trimmed) return null;

  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
    const parts = trimmed.includes("-")
      ? trimmed.split("-")
      : trimmed.split("/");
    const mm = Number(parts[0]);
    const dd = Number(parts[1]);
    const yyyy = Number(parts[2]);
    const d = new Date(yyyy, mm - 1, dd);
    return isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split("-").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
};

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export default function OtherExpensesPage() {
  const auth = useAuth();
  const user = auth?.user;
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [userData, setUserData] = useState<ProfileValues | null>(null);

  // Data states
  const [records, setRecords] = useState<OtherExpenseRecord[]>([]);
  const [servicesList, setServicesList] = useState<OtherExpenseServiceOption[]>(
    []
  );
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [vehicles, setVehicles] = useState<
    {
      id: string;
      vehicleNumber: string;
      vehicleType?: string;
      mycomId?: string;
      myCompany?: string;
      companyName?: string;
    }[]
  >([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Credit" | "Debit">(
    "All"
  );
  const [companyFilter, setCompanyFilter] = useState<string>("All");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<
    "All" | "Truck" | "Trailer"
  >("All");
  const [vehicleFilter, setVehicleFilter] = useState<string>("All");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] =
    useState<OtherExpenseRecord | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<OtherExpenseRecord | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // PDF Print Template Ref
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  // 1. Fetch effective user ID & profile data
  useEffect(() => {
    if (!user?.uid) return;

    const fetchEffectiveUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data() as ProfileValues;
          setUserData(uData);

          if (uData.role === "SubOwner" && uData.createdBy) {
            setEffectiveUserId(uData.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        } else {
          setEffectiveUserId(user.uid);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setEffectiveUserId(user.uid);
      }
    };

    fetchEffectiveUserData();
  }, [user?.uid]);

  // 2. Fetch companies to determine default company name
  useEffect(() => {
    if (!effectiveUserId) return;

    const companiesRef = collection(
      db,
      "Users",
      effectiveUserId,
      "myCompanies"
    );

    const unsubscribeCompanies = onSnapshot(
      companiesRef,
      (snapshot) => {
        const loaded: CompanyType[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            companyName:
              data.companyName || data.name || "Unnamed Company",
            dot: data.dot || "",
            mc: data.mc || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "",
            isDefault: Boolean(data.isDefault),
            isActive: data.isActive !== false,
            created_at: data.created_at,
            updated_at: data.updated_at,
          });
        });
        setCompanies(loaded);
      },
      (error) => {
        console.error("Error fetching companies:", error);
      }
    );

    // Fetch vehicles for filtering and search
    const vehiclesRef = collection(
      db,
      "Users",
      effectiveUserId,
      "Vehicles"
    );

    const unsubscribeVehicles = onSnapshot(
      vehiclesRef,
      (snapshot) => {
        const loaded: {
          id: string;
          vehicleNumber: string;
          vehicleType?: string;
          mycomId?: string;
          myCompany?: string;
          companyName?: string;
        }[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.active !== false) {
            const vNum = data.vehicleNumber || data.name || docSnap.id;
            if (vNum) {
              loaded.push({
                id: docSnap.id,
                vehicleNumber: vNum,
                vehicleType: data.vehicleType || "Truck",
                mycomId: data.mycomId || data.companyId || "",
                myCompany: data.myCompany || "",
                companyName: data.companyName || data.company || "",
              });
            }
          }
        });
        loaded.sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));
        setVehicles(loaded);
      },
      (error) => {
        console.error("Error fetching vehicles:", error);
      }
    );

    return () => {
      unsubscribeCompanies();
      unsubscribeVehicles();
    };
  }, [effectiveUserId]);

  // Determine Default Company Name
  const defaultCompanyName = useMemo(() => {
    const defaultCompany = companies.find(
      (c) => c.isDefault && c.isActive !== false
    );
    if (defaultCompany?.companyName?.trim()) {
      return defaultCompany.companyName.trim();
    }
    const activeCompany = companies.find((c) => c.isActive !== false);
    if (activeCompany?.companyName?.trim()) {
      return activeCompany.companyName.trim();
    }
    if (companies[0]?.companyName?.trim()) {
      return companies[0].companyName.trim();
    }
    return userData?.userName || "My Company";
  }, [companies, userData]);

  // 3. Fetch predefined services from otherExpensesServices collection
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const colRef = collection(db, "otherExpensesServices");
        const snapshot = await getDocs(colRef);

        const fetchedServices: OtherExpenseServiceOption[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const sName =
            data.sName || data.serviceName || data.name || d.id || "";
          if (sName.trim()) {
            fetchedServices.push({
              id: d.id,
              sName: sName.trim(),
            });
          }
        });

        const hasOther = fetchedServices.some(
          (s) => s.sName.toLowerCase() === "other"
        );

        if (fetchedServices.length === 0) {
          const defaults = DEFAULT_SERVICES.map((name, idx) => ({
            id: `default_${idx}`,
            sName: name,
          }));
          setServicesList(defaults);
        } else {
          if (!hasOther) {
            fetchedServices.push({ id: "custom_other", sName: "Other" });
          }
          setServicesList(sortServicesAlphabetical(fetchedServices));
        }
      } catch (error) {
        console.error("Error fetching otherExpensesServices:", error);
        setServicesList(
          DEFAULT_SERVICES.map((name, idx) => ({
            id: `default_${idx}`,
            sName: name,
          }))
        );
      }
    };

    fetchServices();
  }, []);

  // 4. Realtime listener for user other expenses
  useEffect(() => {
    if (!effectiveUserId) return;

    setIsLoadingRecords(true);
    const expensesRef = collection(
      db,
      "Users",
      effectiveUserId,
      "record_otherExpenses"
    );

    const unsubscribe = onSnapshot(
      expensesRef,
      (snapshot) => {
        const loaded: OtherExpenseRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.active !== false) {
            loaded.push({
              id: d.id,
              userId: data.userId || effectiveUserId,
              serviceId: data.serviceId || "",
              serviceName: data.serviceName || "Other Expense",
              isCustomService: !!data.isCustomService,
              companyId: data.companyId || "",
              companyName: data.companyName || "",
              vehicleId: data.vehicleId || "",
              vehicleNumber: data.vehicleNumber || "",
              vehicleType: data.vehicleType || "",
              teamMemberId: data.teamMemberId || "",
              teamMemberName: data.teamMemberName || "",
              teamMemberRole: data.teamMemberRole || "",
              teamMemberEmail: data.teamMemberEmail || "",
              teamMemberPhone: data.teamMemberPhone || "",
              date: data.date || "",
              amount: Number(data.amount) || 0,
              type: data.type === "Credit" ? "Credit" : "Debit",
              description: data.description || "",
              createdAt: data.createdAt || "",
              updatedAt: data.updatedAt || "",
              active: data.active !== false,
              addedFrom: data.addedFrom || "Web",
            });
          }
        });

        loaded.sort((a, b) => {
          const dateA = parseCustomDate(a.date)?.getTime() || 0;
          const dateB = parseCustomDate(b.date)?.getTime() || 0;
          return dateB - dateA;
        });

        setRecords(loaded);
        setIsLoadingRecords(false);
      },
      (error) => {
        console.error("Error listening to record_otherExpenses:", error);
        toast.error("Failed to load other expenses");
        setIsLoadingRecords(false);
      }
    );

    return () => unsubscribe();
  }, [effectiveUserId]);

  // Derived available companies for filter (from fetched companies + any companyName recorded in records)
  const availableCompanies = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((c) => {
      if (c.companyName?.trim()) {
        map.set(c.companyName.trim().toLowerCase(), c.companyName.trim());
      }
    });
    records.forEach((r) => {
      if (r.companyName?.trim()) {
        const key = r.companyName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, r.companyName.trim());
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [companies, records]);

  // Map of vehicle ID / vehicle number to vehicleType ("Truck" / "Trailer")
  const vehicleTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    vehicles.forEach((v) => {
      const vType = v.vehicleType || "Truck";
      if (v.id) map.set(v.id.toLowerCase(), vType);
      if (v.vehicleNumber) map.set(v.vehicleNumber.toLowerCase().trim(), vType);
    });
    return map;
  }, [vehicles]);

  // Helper to determine vehicle type of any given record
  const getRecordVehicleType = (rec: OtherExpenseRecord): string => {
    if (rec.vehicleType?.trim()) return rec.vehicleType.trim();
    if (rec.vehicleId && vehicleTypeMap.has(rec.vehicleId.toLowerCase())) {
      return vehicleTypeMap.get(rec.vehicleId.toLowerCase())!;
    }
    if (
      rec.vehicleNumber &&
      vehicleTypeMap.has(rec.vehicleNumber.toLowerCase().trim())
    ) {
      return vehicleTypeMap.get(rec.vehicleNumber.toLowerCase().trim())!;
    }
    return rec.vehicleNumber || rec.vehicleId ? "Truck" : "";
  };

  // Vehicles available for filter based on selected company and selected vehicle type
  const availableVehiclesForFilter = useMemo(() => {
    let list = vehicles;

    // 1. Filter by Company
    if (companyFilter !== "All") {
      const targetCompanyLower = companyFilter.toLowerCase().trim();
      const matchedCompany = companies.find(
        (c) =>
          c.companyName?.trim().toLowerCase() === targetCompanyLower ||
          c.id === companyFilter
      );

      list = list.filter((v) => {
        const vCompName = (v.companyName || v.myCompany || "")
          .toLowerCase()
          .trim();
        if (vCompName && vCompName === targetCompanyLower) return true;
        if (matchedCompany && v.mycomId && v.mycomId === matchedCompany.id)
          return true;
        return false;
      });
    }

    // 2. Filter by Vehicle Type (Truck / Trailer)
    if (vehicleTypeFilter !== "All") {
      const targetTypeLower = vehicleTypeFilter.toLowerCase();
      list = list.filter(
        (v) => (v.vehicleType || "Truck").toLowerCase() === targetTypeLower
      );
    }

    return list;
  }, [vehicles, companyFilter, vehicleTypeFilter, companies]);

  // Handle Company filter change with smart vehicle reset
  const handleCompanyFilterChange = (selectedCompany: string) => {
    setCompanyFilter(selectedCompany);
    if (selectedCompany !== "All" && vehicleFilter !== "All") {
      const targetCompanyLower = selectedCompany.toLowerCase().trim();
      const matchedCompany = companies.find(
        (c) =>
          c.companyName?.trim().toLowerCase() === targetCompanyLower ||
          c.id === selectedCompany
      );
      const vehicleExistsInCompany = vehicles.some((v) => {
        const isThisVehicle =
          v.vehicleNumber === vehicleFilter || v.id === vehicleFilter;
        if (!isThisVehicle) return false;
        const vCompName = (v.companyName || v.myCompany || "")
          .toLowerCase()
          .trim();
        if (vCompName && vCompName === targetCompanyLower) return true;
        if (matchedCompany && v.mycomId && v.mycomId === matchedCompany.id)
          return true;
        return false;
      });

      if (!vehicleExistsInCompany) {
        setVehicleFilter("All");
      }
    }
  };

  // Handle Vehicle Type filter change with smart vehicle reset
  const handleVehicleTypeFilterChange = (
    selectedType: "All" | "Truck" | "Trailer"
  ) => {
    setVehicleTypeFilter(selectedType);
    if (selectedType !== "All" && vehicleFilter !== "All") {
      const currentVeh = vehicles.find(
        (v) => v.vehicleNumber === vehicleFilter || v.id === vehicleFilter
      );
      if (
        currentVeh &&
        (currentVeh.vehicleType || "Truck").toLowerCase() !==
          selectedType.toLowerCase()
      ) {
        setVehicleFilter("All");
      }
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (typeFilter !== "All" && rec.type !== typeFilter) {
        return false;
      }

      // 1. Company Filter
      if (companyFilter !== "All") {
        const targetCompany = companyFilter.toLowerCase().trim();
        const matchesCompany =
          (rec.companyName || "").toLowerCase().trim() === targetCompany ||
          rec.companyId === companyFilter;
        if (!matchesCompany) {
          return false;
        }
      }

      // 2. Vehicle Type Filter (Truck vs Trailer)
      if (vehicleTypeFilter !== "All") {
        const recType = getRecordVehicleType(rec);
        if (recType.toLowerCase() !== vehicleTypeFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Vehicle Filter
      if (vehicleFilter !== "All") {
        const targetVehicle = vehicleFilter.toLowerCase().trim();
        const matchesVehicle =
          (rec.vehicleNumber || "").toLowerCase().trim() === targetVehicle ||
          rec.vehicleId === vehicleFilter;
        if (!matchesVehicle) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (rec.serviceName || "").toLowerCase().includes(q);
        const matchesDesc = (rec.description || "").toLowerCase().includes(q);
        const matchesAmount = rec.amount.toString().includes(q);
        const matchesVehicle = (rec.vehicleNumber || "")
          .toLowerCase()
          .includes(q);
        const matchesCompany = (rec.companyName || "")
          .toLowerCase()
          .includes(q);
        const matchesTeam =
          (rec.teamMemberName || "").toLowerCase().includes(q) ||
          (rec.teamMemberRole || "").toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesDesc &&
          !matchesAmount &&
          !matchesVehicle &&
          !matchesCompany &&
          !matchesTeam
        ) {
          return false;
        }
      }

      if (startDate || endDate) {
        const recDate = parseCustomDate(rec.date);
        if (!recDate) return false;

        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (recDate < s) return false;
        }

        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (recDate > e) return false;
        }
      }

      return true;
    });
  }, [
    records,
    typeFilter,
    companyFilter,
    vehicleTypeFilter,
    vehicleFilter,
    searchQuery,
    startDate,
    endDate,
    vehicleTypeMap,
  ]);

  // Summary calculations
  const { totalCredit, totalDebit, netBalance } = useMemo(() => {
    let credit = 0;
    let debit = 0;

    filteredRecords.forEach((rec) => {
      if (rec.type === "Credit") {
        credit += Number(rec.amount) || 0;
      } else {
        debit += Number(rec.amount) || 0;
      }
    });

    const net = credit - debit;
    return {
      totalCredit: credit,
      totalDebit: debit,
      netBalance: net,
    };
  }, [filteredRecords]);

  // Duration text calculation for PDF
  const durationText = useMemo(() => {
    if (startDate && endDate) {
      return `${format(startDate, "dd MMM yyyy")} - ${format(
        endDate,
        "dd MMM yyyy"
      )}`;
    }
    if (startDate) {
      return `From ${format(startDate, "dd MMM yyyy")}`;
    }
    if (endDate) {
      return `Until ${format(endDate, "dd MMM yyyy")}`;
    }
    if (filteredRecords.length > 0) {
      const dates = filteredRecords
        .map((r) => parseCustomDate(r.date))
        .filter((d): d is Date => d !== null)
        .sort((a, b) => a.getTime() - b.getTime());

      if (dates.length > 0) {
        const first = dates[0];
        const last = dates[dates.length - 1];
        if (first.getTime() === last.getTime()) {
          return format(first, "dd MMM yyyy");
        }
        return `${format(first, "dd MMM yyyy")} - ${format(
          last,
          "dd MMM yyyy"
        )}`;
      }
    }
    return format(new Date(), "dd MMM yyyy");
  }, [startDate, endDate, filteredRecords]);

  // Chronological entries with running balance for PDF table
  const pdfChronologicalEntries = useMemo(() => {
    const sorted = [...filteredRecords].sort((a, b) => {
      const dateA = parseCustomDate(a.date)?.getTime() || 0;
      const dateB = parseCustomDate(b.date)?.getTime() || 0;
      return dateA - dateB;
    });

    let currentBalance = 0;
    return sorted.map((item) => {
      const isCredit = item.type === "Credit";
      const amount = Number(item.amount) || 0;
      if (isCredit) {
        currentBalance += amount;
      } else {
        currentBalance -= amount;
      }

      return {
        ...item,
        cashIn: isCredit ? amount : null,
        cashOut: !isCredit ? amount : null,
        runningBalance: currentBalance,
      };
    });
  }, [filteredRecords]);

  // Open modal for Create
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (rec: OtherExpenseRecord) => {
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !effectiveUserId) return;
    setIsDeleting(true);
    try {
      const docRef = doc(
        db,
        "Users",
        effectiveUserId,
        "record_otherExpenses",
        deleteTarget.id
      );

      await updateDoc(docRef, {
        active: false,
        updatedAt: new Date().toISOString(),
      });

      toast.success("Expense record deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting other expense:", error);
      toast.error("Failed to delete record");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel with wide, comfortable column formatting
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      toast.error("No records available to export");
      return;
    }

    try {
      const exportData = filteredRecords.map((r, index) => {
        const vType = getRecordVehicleType(r);
        return {
          "S.No": String(index + 1),
          Date: formatDateSafe(r.date),
          "Service / Expense": r.serviceName,
          "Team Member": r.teamMemberName
            ? `${r.teamMemberName}${r.teamMemberRole ? ` (${r.teamMemberRole})` : ""}`
            : "-",
          Company: r.companyName || "-",
          Vehicle: r.vehicleNumber
            ? `${r.vehicleNumber}${vType ? ` (${vType})` : ""}`
            : "-",
          "Vehicle Type": vType || "-",
          Type: r.type === "Credit" ? "Credit (Cash In)" : "Debit (Cash Out)",
          "Amount ($)": Number(r.amount).toFixed(2),
          Description: r.description || "-",
        };
      });

      const ws = utils.json_to_sheet(exportData);

      // Define expanded, comfortable column widths (wch = character count)
      ws["!cols"] = [
        { wch: 8 }, // S.No
        { wch: 16 }, // Date (MM-DD-YYYY)
        { wch: 30 }, // Service / Expense
        { wch: 24 }, // Team Member
        { wch: 22 }, // Company
        { wch: 20 }, // Vehicle
        { wch: 16 }, // Vehicle Type
        { wch: 22 }, // Type (Credit (Cash In) / Debit (Cash Out))
        { wch: 16 }, // Amount ($)
        { wch: 45 }, // Description / Notes
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Other Expenses");
      writeFile(
        wb,
        `other_expenses_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      );
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel file");
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!pdfTemplateRef.current || filteredRecords.length === 0) {
      toast.error("No records available to export");
      return;
    }

    setIsExportingPdf(true);
    const toastId = toast.loading("Generating Other Expenses PDF report...");

    try {
      const element = pdfTemplateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = contentHeight;
      let position = margin;

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        position,
        contentWidth,
        contentHeight,
        undefined,
        "FAST"
      );
      heightLeft -= pdfHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - contentHeight + margin;
        pdf.addPage();
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          position,
          contentWidth,
          contentHeight,
          undefined,
          "FAST"
        );
        heightLeft -= pdfHeight;
      }

      const filename = `${defaultCompanyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")}_other_expenses_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.pdf`;

      pdf.save(filename);
      toast.success("PDF exported successfully!", { id: toastId });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
        <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/records"
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-150 flex items-center justify-center shadow-xs"
                title="Back to Records"
              >
                <FaArrowLeft className="text-sm" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Other Expenses
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">
                    Cash In / Cash Out
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Record and manage additional inflows and outflows not tied to
                  regular service invoices
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              {/* Export PDF Button */}
              <button
                onClick={handleExportPDF}
                disabled={filteredRecords.length === 0 || isExportingPdf}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Export PDF Report"
              >
                <FaFilePdf className="text-sm text-rose-600" />
                <span>{isExportingPdf ? "Generating..." : "Export PDF"}</span>
              </button>

              {/* Export Excel Button */}
              <button
                onClick={handleExportExcel}
                disabled={filteredRecords.length === 0}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Export Excel Sheet"
              >
                <FaFileExcel className="text-sm text-emerald-600" />
                <span>Export Excel</span>
              </button>

              {/* Add Expense Button */}
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95"
              >
                <FaPlus className="text-xs" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Credit (Cash In) */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Total Cash In (Credit)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center shadow-xs">
                <FaArrowDown className="text-sm transform rotate-45" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
                {formatCurrency(totalCredit)}
              </p>
              <p className="text-[11px] text-emerald-700/90 font-medium mt-1">
                Income, reimbursements & incoming cash
              </p>
            </div>
          </div>

          {/* Total Debit (Cash Out) */}
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Total Cash Out (Debit)
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-100/90 text-rose-700 flex items-center justify-center shadow-xs">
                <FaArrowUp className="text-sm transform rotate-45" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                {formatCurrency(totalDebit)}
              </p>
              <p className="text-[11px] text-rose-700/90 font-medium mt-1">
                Purchases, expenses & outgoing cash
              </p>
            </div>
          </div>

          {/* Net Balance */}
          <div
            className={`border rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm ${
              netBalance >= 0
                ? "bg-white border-emerald-200/90"
                : "bg-white border-rose-200/90"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  netBalance >= 0 ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                Final Balance
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                  netBalance >= 0
                    ? "bg-emerald-100/80 text-emerald-700"
                    : "bg-rose-100/80 text-rose-700"
                }`}
              >
                <FaWallet className="text-sm" />
              </div>
            </div>
            <div className="mt-3">
              <p
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  netBalance >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {formatCurrency(netBalance)}
              </p>
              <p
                className={`text-[11px] font-medium mt-1 ${
                  netBalance >= 0 ? "text-emerald-600/90" : "text-rose-600/90"
                }`}
              >
                {netBalance >= 0
                  ? "Net Cash Positive (Total Cash In − Cash Out)"
                  : "Net Cash Deficit (Total Cash In − Cash Out)"}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Type Filter Buttons */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl w-full sm:w-auto self-start">
              {(["All", "Credit", "Debit"] as const).map((tab) => {
                const isActive = typeFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setTypeFilter(tab)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? tab === "Credit"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : tab === "Debit"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-gray-900 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab === "All"
                      ? "All Types"
                      : tab === "Credit"
                        ? "Credit (Cash In)"
                        : "Debit (Cash Out)"}
                  </button>
                );
              })}
            </div>

            {/* Right Side: Search, Company Filter, Vehicle Filter & Date Range */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative min-w-[200px] flex-1 sm:flex-none">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search expense, vehicle, notes..."
                  className="w-full pl-9 pr-3.5 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              {/* Company Filter Dropdown (Placed before Vehicle Type & Vehicle Filter) */}
              <div className="relative min-w-[140px] flex-1 sm:flex-none">
                <select
                  value={companyFilter}
                  onChange={(e) => handleCompanyFilterChange(e.target.value)}
                  className={`w-full py-2 px-3 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all cursor-pointer font-medium ${
                    companyFilter !== "All"
                      ? "border-[#F96176] text-[#F96176] font-bold bg-rose-50/40"
                      : "border-gray-200"
                  }`}
                >
                  <option value="All">All Companies</option>
                  {availableCompanies.map((compName) => (
                    <option key={compName} value={compName}>
                      🏢 {compName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Type Filter Dropdown (Truck / Trailer) */}
              <div className="relative min-w-[130px] flex-1 sm:flex-none">
                <select
                  value={vehicleTypeFilter}
                  onChange={(e) =>
                    handleVehicleTypeFilterChange(
                      e.target.value as "All" | "Truck" | "Trailer"
                    )
                  }
                  className={`w-full py-2 px-3 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all cursor-pointer font-medium ${
                    vehicleTypeFilter !== "All"
                      ? "border-[#F96176] text-[#F96176] font-bold bg-rose-50/40"
                      : "border-gray-200"
                  }`}
                >
                  <option value="All">All Vehicle Types</option>
                  <option value="Truck">🚛 Truck</option>
                  <option value="Trailer">🚚 Trailer</option>
                </select>
              </div>

              {/* Vehicle Filter Dropdown */}
              <div className="relative min-w-[140px] flex-1 sm:flex-none">
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className={`w-full py-2 px-3 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all cursor-pointer font-medium ${
                    vehicleFilter !== "All"
                      ? "border-[#F96176] text-[#F96176] font-bold bg-rose-50/40"
                      : "border-gray-200"
                  }`}
                >
                  <option value="All">All Vehicles</option>
                  {availableVehiclesForFilter.map((v) => {
                    const isTrailer =
                      (v.vehicleType || "Truck").toLowerCase() === "trailer";
                    return (
                      <option key={v.id} value={v.vehicleNumber}>
                        {isTrailer ? "🚚 " : "🚛 "}
                        {v.vehicleNumber} ({v.vehicleType || "Truck"})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1">
                <FaCalendarAlt className="text-gray-400 text-xs ml-1" />
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  placeholderText="Start Date"
                  dateFormat="MM-dd-yyyy"
                  className="w-24 bg-transparent text-xs text-gray-700 focus:outline-none placeholder-gray-400 py-1"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
                <span className="text-gray-400 text-xs">-</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  placeholderText="End Date"
                  dateFormat="MM-dd-yyyy"
                  className="w-24 bg-transparent text-xs text-gray-700 focus:outline-none placeholder-gray-400 py-1"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Clear date filter"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {isLoadingRecords ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[#F96176] border-t-transparent mb-3"></div>
              <p className="text-sm font-medium text-gray-500">
                Loading other expenses...
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                <FaMoneyBillWave className="text-2xl" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">
                {searchQuery ||
                typeFilter !== "All" ||
                companyFilter !== "All" ||
                vehicleTypeFilter !== "All" ||
                vehicleFilter !== "All" ||
                startDate ||
                endDate
                  ? "No matching expenses found"
                  : "No other expenses recorded yet"}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                {searchQuery ||
                typeFilter !== "All" ||
                companyFilter !== "All" ||
                vehicleTypeFilter !== "All" ||
                vehicleFilter !== "All" ||
                startDate ||
                endDate
                  ? "Try adjusting your search query, company, vehicle type, vehicle, filter type, or date range."
                  : "Record cash inflows (Credit) and cash outflows (Debit) to keep your financials organized."}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <FaPlus className="text-xs" />
                <span>Add Other Expense</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Date</th>
                    <th className="py-3.5 px-4 sm:px-6">Service / Expense</th>
                    <th className="py-3.5 px-4 sm:px-6">Type</th>
                    <th className="py-3.5 px-4 sm:px-6">Amount</th>
                    <th className="py-3.5 px-4 sm:px-6">Description / Notes</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredRecords.map((record) => {
                    const isCredit = record.type === "Credit";
                    const vType = getRecordVehicleType(record);
                    const isTrailer = vType.toLowerCase() === "trailer";

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        {/* Date */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400 text-xs" />
                            <span>{formatDateSafe(record.date)}</span>
                          </div>
                        </td>

                        {/* Service / Expense Name */}
                        <td className="py-4 px-4 sm:px-6">
                          <div>
                            <span className="font-semibold text-gray-900">
                              {record.serviceName}
                            </span>
                            {record.isCustomService && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                Custom
                              </span>
                            )}
                          </div>
                          {(record.vehicleNumber ||
                            record.companyName ||
                            record.teamMemberName) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {record.teamMemberName && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-200">
                                  👤 {record.teamMemberName}
                                  {record.teamMemberRole && (
                                    <span className="text-[9px] text-emerald-600">
                                      ({record.teamMemberRole})
                                    </span>
                                  )}
                                </span>
                              )}
                              {record.vehicleNumber && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[10px] border border-blue-100">
                                  {isTrailer ? "🚚" : "🚛"}{" "}
                                  {record.vehicleNumber}
                                  <span className="text-[9px] text-blue-600 font-normal">
                                    ({vType || "Truck"})
                                  </span>
                                </span>
                              )}
                              {record.companyName && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium text-[10px] border border-purple-100">
                                  🏢 {record.companyName}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Type Badge */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          {isCredit ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Credit (Cash In)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Debit (Cash Out)
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <span
                            className={`font-black text-base ${
                              isCredit ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isCredit ? "+" : "-"}
                            {formatCurrency(record.amount)}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-4 sm:px-6 max-w-md text-xs text-gray-500 truncate">
                          {record.description || (
                            <span className="text-gray-300 italic">
                              No notes
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(record)}
                              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(record)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal Component */}
      <AddOtherExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        effectiveUserId={effectiveUserId}
        editingRecord={editingRecord}
        preloadedServices={servicesList}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <FaExclamationTriangle className="text-xl" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Delete Expense Record?
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Are you sure you want to delete this{" "}
              <strong className="text-gray-800">
                {deleteTarget.serviceName}
              </strong>{" "}
              record ({formatCurrency(deleteTarget.amount)})? This action cannot
              be undone.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable PDF Container (Exact match to uploaded design) */}
      <div className="overflow-hidden h-0 w-0 pointer-events-none opacity-0 fixed -left-[9999px] top-0">
        <div
          ref={pdfTemplateRef}
          style={{
            width: "794px",
            minHeight: "1123px",
            padding: "36px",
            backgroundColor: "#ffffff",
            fontFamily: "Arial, Helvetica, sans-serif",
            boxSizing: "border-box",
          }}
          className="text-gray-900"
        >
          {/* Top Banner Box */}
          <div
            style={{ backgroundColor: "#EEF4FF", borderColor: "#DBEAFE" }}
            className="rounded-2xl p-5 flex items-center gap-4 mb-6 border"
          >
            <div className="bg-white px-3.5 py-2 rounded-xl border border-blue-100 shadow-xs flex items-center justify-center flex-shrink-0">
              <img
                src="/logo-new.png"
                alt="Logo"
                className="h-12 w-auto max-w-[200px] object-contain"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {defaultCompanyName} Report
              </h2>
              <p className="text-xs text-gray-600 mt-1 font-medium">
                Generated On - {format(new Date(), "dd MMM yyyy, hh:mm a")}.
                Generated by -{" "}
                <span className="font-bold text-gray-800">
                  {userData?.userName || user?.displayName || "User"}
                </span>{" "}
                ({userData?.email || user?.email || ""})
              </p>
            </div>
          </div>

          {/* Company Title */}
          <div className="mb-3 px-1">
            <h1 className="text-lg font-bold text-gray-900">
              {defaultCompanyName}
            </h1>
          </div>

          {/* Duration Box */}
          <div className="border border-gray-200 rounded-xl p-3.5 mb-6 bg-white shadow-2xs">
            <p className="text-sm text-gray-800 font-medium">
              <span className="font-bold text-gray-900">Duration:</span>{" "}
              {durationText}
            </p>
          </div>

          {/* KPI Summary 3 Columns Box */}
          <div className="grid grid-cols-3 border border-gray-200 rounded-xl overflow-hidden mb-6 bg-white shadow-2xs">
            {/* Total Cash In */}
            <div className="p-4 border-r border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">
                Total Cash in
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {totalCredit.toFixed(0)}
              </p>
            </div>

            {/* Total Cash Out */}
            <div className="p-4 border-r border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">
                Total Cash out
              </p>
              <p className="text-2xl font-bold text-rose-600">
                {totalDebit.toFixed(0)}
              </p>
            </div>

            {/* Final Balance */}
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">
                Final Balance
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {netBalance.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Entries Count */}
          <div className="mb-3 px-1">
            <p className="text-xs font-bold text-gray-800">
              Total No. of entries: {pdfChronologicalEntries.length}
            </p>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-8 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  style={{ backgroundColor: "#EEF4FF" }}
                  className="border-b border-gray-200 text-gray-900 font-bold"
                >
                  <th className="py-3 px-3.5 border-r border-gray-200">Date</th>
                  <th className="py-3 px-3.5 border-r border-gray-200">
                    Remark
                  </th>
                  <th className="py-3 px-3.5 border-r border-gray-200">Mode</th>
                  <th className="py-3 px-3.5 border-r border-gray-200">
                    Cash in
                  </th>
                  <th className="py-3 px-3.5 border-r border-gray-200">
                    Cash out
                  </th>
                  <th className="py-3 px-3.5">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pdfChronologicalEntries.map((row) => (
                  <tr key={row.id} className="text-gray-800">
                    <td className="py-2.5 px-3.5 border-r border-gray-200 whitespace-nowrap">
                      {formatEntryDate(row.date)}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-gray-200">
                      <div className="font-semibold text-gray-900">
                        {row.serviceName}
                      </div>
                      {(row.vehicleNumber ||
                        row.companyName ||
                        row.teamMemberName ||
                        row.description) && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {row.teamMemberName && (
                            <span className="font-medium text-emerald-700">
                              👤 {row.teamMemberName}
                              {row.teamMemberRole
                                ? ` (${row.teamMemberRole})`
                                : ""}
                            </span>
                          )}
                          {row.teamMemberName &&
                            (row.vehicleNumber ||
                              row.companyName ||
                              row.description) && <span> • </span>}
                          {row.vehicleNumber && (
                            <span className="font-medium text-gray-700">
                              Veh: {row.vehicleNumber} ({getRecordVehicleType(row) || "Truck"})
                            </span>
                          )}
                          {row.vehicleNumber &&
                            (row.companyName || row.description) && (
                              <span> • </span>
                            )}
                          {row.companyName && <span>{row.companyName}</span>}
                          {row.companyName && row.description && (
                            <span> • </span>
                          )}
                          {row.description && <span>{row.description}</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-gray-200">
                      Cash
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-gray-200 text-emerald-600 font-bold">
                      {row.cashIn !== null ? row.cashIn.toFixed(0) : ""}
                    </td>
                    <td className="py-2.5 px-3.5 border-r border-gray-200 text-rose-600 font-bold">
                      {row.cashOut !== null ? row.cashOut.toFixed(0) : ""}
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-gray-900">
                      {row.runningBalance.toFixed(0)}
                    </td>
                  </tr>
                ))}

                {/* Final Balance Footer Row */}
                <tr
                  style={{ backgroundColor: "#EEF4FF" }}
                  className="font-bold text-gray-900 border-t-2 border-gray-300"
                >
                  <td className="py-3 px-3.5 border-r border-gray-200">
                    {pdfChronologicalEntries.length > 0
                      ? formatEntryDate(
                          pdfChronologicalEntries[
                            pdfChronologicalEntries.length - 1
                          ].date
                        )
                      : format(new Date(), "dd MMM yy")}
                  </td>
                  <td className="py-3 px-3.5 border-r border-gray-200 font-bold">
                    Final Balance
                  </td>
                  <td className="py-3 px-3.5 border-r border-gray-200"></td>
                  <td className="py-3 px-3.5 border-r border-gray-200"></td>
                  <td className="py-3 px-3.5 border-r border-gray-200"></td>
                  <td className="py-3 px-3.5 font-extrabold text-sm text-gray-900">
                    {netBalance.toFixed(0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer App Install Banner */}
          <div className="flex items-center gap-3 pt-6 border-t border-gray-200 mt-auto">
            <img
              src="/logo-new.png"
              alt="TrenoOps"
              className="h-7 w-auto object-contain"
            />
            <p className="text-xs text-gray-700">
              Generated by{" "}
              <span className="font-bold text-gray-900">TrenoOps App</span>.{" "}
              <a
                href="https://apps.apple.com/in/app/trenoops/id6765658994"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline font-semibold cursor-pointer"
              >
                Install Now
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
