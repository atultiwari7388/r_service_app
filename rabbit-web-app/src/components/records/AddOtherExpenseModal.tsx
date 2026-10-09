"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, format } from "date-fns";
import {
  FaTimes,
  FaCheck,
  FaArrowDown,
  FaArrowUp,
  FaBuilding,
  FaTruck,
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaUserCheck,
  FaUserTie,
} from "react-icons/fa";

export type TransactionType = "Credit" | "Debit";

export interface OtherExpenseRecord {
  id: string;
  userId: string;
  serviceId?: string;
  serviceName: string;
  isCustomService?: boolean;
  companyId?: string;
  companyName?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  teamMemberId?: string;
  teamMemberName?: string;
  teamMemberRole?: string;
  teamMemberEmail?: string;
  teamMemberPhone?: string;
  date: string;
  amount: number;
  type: TransactionType;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
  addedFrom?: string;
}

export interface OtherExpenseServiceOption {
  id: string;
  sName: string;
}

export interface CompanyOption {
  id: string;
  companyName: string;
  isDefault?: boolean;
}

export interface VehicleOption {
  id: string;
  vehicleNumber: string;
  vehicleType?: string;
  mycomId?: string;
  myCompany?: string;
  companyName?: string;
  active?: boolean;
}

export interface TeamMemberOption {
  uid: string;
  userName: string;
  email: string;
  phoneNumber: string;
  role: string;
  profilePicture?: string;
  active: boolean;
}

export interface AddOtherExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  effectiveUserId: string;
  onSuccess?: () => void;
  editingRecord?: OtherExpenseRecord | null;
  preloadedServices?: OtherExpenseServiceOption[];
}

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

export default function AddOtherExpenseModal({
  isOpen,
  onClose,
  effectiveUserId,
  onSuccess,
  editingRecord = null,
  preloadedServices,
}: AddOtherExpenseModalProps) {
  const [servicesList, setServicesList] = useState<OtherExpenseServiceOption[]>(
    preloadedServices ? sortServicesAlphabetical(preloadedServices) : []
  );
  const [companiesList, setCompaniesList] = useState<CompanyOption[]>([]);
  const [vehiclesList, setVehiclesList] = useState<VehicleOption[]>([]);
  const [teamList, setTeamList] = useState<TeamMemberOption[]>([]);

  // Form states
  const [formDate, setFormDate] = useState<string>(
    format(new Date(), "MM-dd-yyyy")
  );
  const [formSelectedService, setFormSelectedService] = useState<string>("");
  const [formCustomServiceName, setFormCustomServiceName] =
    useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState<string>("");
  const [selectedTeamMember, setSelectedTeamMember] =
    useState<TeamMemberOption | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>("");
  const [selectedTeamRoleFilter, setSelectedTeamRoleFilter] =
    useState<string>("All");

  const [formAmount, setFormAmount] = useState<string>("");
  const [formType, setFormType] = useState<TransactionType>("Debit");
  const [formDescription, setFormDescription] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // 1. Load services from collection if not preloaded
  useEffect(() => {
    if (preloadedServices && preloadedServices.length > 0) {
      setServicesList(sortServicesAlphabetical(preloadedServices));
      return;
    }

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
        console.error("Error fetching otherExpensesServices in modal:", error);
        setServicesList(
          DEFAULT_SERVICES.map((name, idx) => ({
            id: `default_${idx}`,
            sName: name,
          }))
        );
      }
    };

    fetchServices();
  }, [preloadedServices]);

  // 2. Fetch companies, vehicles, and team members for effective user
  useEffect(() => {
    if (!effectiveUserId || !isOpen) return;

    const fetchCompaniesVehiclesAndTeam = async () => {
      try {
        // Fetch myCompanies
        const compSnapshot = await getDocs(
          collection(db, "Users", effectiveUserId, "myCompanies")
        );
        const loadedCompanies: CompanyOption[] = [];
        compSnapshot.forEach((d) => {
          const data = d.data();
          if (data.isActive !== false) {
            loadedCompanies.push({
              id: d.id,
              companyName: data.companyName || data.name || "Unnamed Company",
              isDefault: Boolean(data.isDefault),
            });
          }
        });
        loadedCompanies.sort((a, b) => a.companyName.localeCompare(b.companyName));
        setCompaniesList(loadedCompanies);

        // Fetch Vehicles
        const vehSnapshot = await getDocs(
          collection(db, "Users", effectiveUserId, "Vehicles")
        );
        const loadedVehicles: VehicleOption[] = [];
        vehSnapshot.forEach((d) => {
          const data = d.data();
          if (data.active !== false) {
            loadedVehicles.push({
              id: d.id,
              vehicleNumber: data.vehicleNumber || data.name || d.id,
              vehicleType: data.vehicleType || "",
              mycomId: data.mycomId || "",
              myCompany: data.myCompany || "",
              companyName: data.companyName || "",
              active: data.active !== false,
            });
          }
        });
        loadedVehicles.sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));
        setVehiclesList(loadedVehicles);

        // Fetch Team Members
        try {
          const teamSnapshot = await getDocs(
            query(
              collection(db, "Users"),
              where("createdBy", "==", effectiveUserId)
            )
          );
          const loadedTeam: TeamMemberOption[] = [];
          teamSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.active !== false && docSnap.id !== effectiveUserId) {
              loadedTeam.push({
                uid: docSnap.id,
                userName: data.userName || data.name || "Unnamed Member",
                email: data.email || "",
                phoneNumber: (data.phoneNumber || "")
                  .toString()
                  .replace(/^\+1\s*/, "")
                  .replace(/^\+/, "")
                  .trim(),
                role: data.role || "Driver",
                profilePicture: data.profilePicture || "",
                active: data.active !== false,
              });
            }
          });
          loadedTeam.sort((a, b) => a.userName.localeCompare(b.userName));
          setTeamList(loadedTeam);
        } catch (teamErr) {
          console.error("Error loading team members in modal:", teamErr);
        }
      } catch (err) {
        console.error("Error loading companies and vehicles in modal:", err);
      }
    };

    fetchCompaniesVehiclesAndTeam();
  }, [effectiveUserId, isOpen]);

  // Derived available team roles
  const availableTeamRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    teamList.forEach((m) => {
      if (m.role) rolesSet.add(m.role);
    });

    const standardRoles = ["Driver", "Accountant", "Manager"];
    const otherRoles = Array.from(rolesSet).filter(
      (r) => !standardRoles.includes(r)
    );

    return ["All", ...standardRoles, ...otherRoles];
  }, [teamList]);

  // Filtered team members for selection dialog
  const filteredTeamMembers = useMemo(() => {
    return teamList.filter((member) => {
      if (
        selectedTeamRoleFilter !== "All" &&
        member.role.toLowerCase() !== selectedTeamRoleFilter.toLowerCase()
      ) {
        return false;
      }
      if (teamSearchQuery.trim()) {
        const q = teamSearchQuery.toLowerCase().trim();
        const matchName = member.userName.toLowerCase().includes(q);
        const matchEmail = member.email.toLowerCase().includes(q);
        const matchPhone = member.phoneNumber.toLowerCase().includes(q);
        const matchRole = member.role.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchRole) {
          return false;
        }
      }
      return true;
    });
  }, [teamList, selectedTeamRoleFilter, teamSearchQuery]);

  // Derived sorted services (Alphabetical A-Z, with "Other" kept at the end)
  const sortedServices = useMemo(() => {
    return sortServicesAlphabetical(servicesList);
  }, [servicesList]);

  // Derived sorted companies (Alphabetical A-Z)
  const sortedCompanies = useMemo(() => {
    return [...companiesList].sort((a, b) =>
      a.companyName.localeCompare(b.companyName, undefined, {
        sensitivity: "base",
      })
    );
  }, [companiesList]);

  // Filter vehicles according to selected company & sort alphabetically (A-Z)
  const availableVehicles = useMemo(() => {
    let list = vehiclesList;
    if (selectedCompanyId) {
      const comp = companiesList.find((c) => c.id === selectedCompanyId);
      const compNameLower = comp?.companyName?.trim().toLowerCase() || "";

      list = vehiclesList.filter((v) => {
        if (v.mycomId && v.mycomId === selectedCompanyId) return true;
        if (
          compNameLower &&
          v.myCompany &&
          v.myCompany.trim().toLowerCase() === compNameLower
        )
          return true;
        if (
          compNameLower &&
          v.companyName &&
          v.companyName.trim().toLowerCase() === compNameLower
        )
          return true;
        return false;
      });
    }

    return [...list].sort((a, b) =>
      a.vehicleNumber.localeCompare(b.vehicleNumber, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [vehiclesList, selectedCompanyId, companiesList]);

  // 3. Initialize or reset form based on editingRecord
  useEffect(() => {
    if (!isOpen) return;

    if (editingRecord) {
      setFormDate(formatDateSafe(editingRecord.date));

      const matchedService = servicesList.find(
        (s) => s.sName.toLowerCase() === editingRecord.serviceName.toLowerCase()
      );

      if (matchedService && matchedService.sName.toLowerCase() !== "other") {
        setFormSelectedService(matchedService.sName);
        setFormCustomServiceName("");
      } else {
        setFormSelectedService("Other");
        setFormCustomServiceName(editingRecord.serviceName);
      }

      setSelectedCompanyId(editingRecord.companyId || "");
      setSelectedCompanyName(editingRecord.companyName || "");
      setSelectedVehicleId(editingRecord.vehicleId || "");
      setSelectedVehicleNumber(editingRecord.vehicleNumber || "");

      // Initialize team member
      if (editingRecord.teamMemberId || editingRecord.teamMemberName) {
        const matchedTeam = teamList.find(
          (t) => t.uid === editingRecord.teamMemberId
        );
        if (matchedTeam) {
          setSelectedTeamMember(matchedTeam);
        } else {
          setSelectedTeamMember({
            uid: editingRecord.teamMemberId || "",
            userName: editingRecord.teamMemberName || "",
            role: editingRecord.teamMemberRole || "Driver",
            email: editingRecord.teamMemberEmail || "",
            phoneNumber: editingRecord.teamMemberPhone || "",
            active: true,
          });
        }
      } else {
        setSelectedTeamMember(null);
      }

      setFormAmount(
        editingRecord.amount ? editingRecord.amount.toString() : ""
      );
      setFormType(editingRecord.type);
      setFormDescription(editingRecord.description || "");
      setFormErrors({});
    } else {
      setFormDate(format(new Date(), "MM-dd-yyyy"));
      setFormSelectedService(servicesList[0]?.sName || "");
      setFormCustomServiceName("");

      // Default to default company if available
      const defaultComp =
        companiesList.find((c) => c.isDefault) || companiesList[0];
      if (defaultComp) {
        setSelectedCompanyId(defaultComp.id);
        setSelectedCompanyName(defaultComp.companyName);
      } else {
        setSelectedCompanyId("");
        setSelectedCompanyName("");
      }

      setSelectedVehicleId("");
      setSelectedVehicleNumber("");
      setSelectedTeamMember(null);
      setFormAmount("");
      setFormType("Debit");
      setFormDescription("");
      setFormErrors({});
    }
  }, [isOpen, editingRecord, servicesList, companiesList, teamList]);

  // Handle company change
  const handleCompanyChange = (compId: string) => {
    setSelectedCompanyId(compId);
    const matched = companiesList.find((c) => c.id === compId);
    setSelectedCompanyName(matched ? matched.companyName : "");

    // Check if previously selected vehicle still belongs to new company
    if (selectedVehicleId) {
      const compNameLower = matched?.companyName?.trim().toLowerCase() || "";
      const currentVeh = vehiclesList.find((v) => v.id === selectedVehicleId);
      const isStillValid =
        !compId ||
        (currentVeh &&
          (currentVeh.mycomId === compId ||
            (compNameLower &&
              currentVeh.myCompany?.trim().toLowerCase() === compNameLower) ||
            (compNameLower &&
              currentVeh.companyName?.trim().toLowerCase() === compNameLower)));

      if (!isStillValid) {
        setSelectedVehicleId("");
        setSelectedVehicleNumber("");
      }
    }
  };

  // Handle vehicle change
  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const matched = vehiclesList.find((v) => v.id === vId);
    setSelectedVehicleNumber(matched ? matched.vehicleNumber : "");
  };

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formDate || !formDate.trim()) {
      errors.date = "Please select or enter a date";
    } else {
      const parsed = parseCustomDate(formDate);
      if (!parsed || isNaN(parsed.getTime())) {
        errors.date = "Invalid date format. Please use MM-DD-YYYY";
      }
    }

    if (!formSelectedService || !formSelectedService.trim()) {
      errors.service = "Please select an expense / service";
    } else if (
      formSelectedService.toLowerCase() === "other" &&
      !formCustomServiceName.trim()
    ) {
      errors.customService = "Please enter the custom service/expense name";
    }

    const numAmount = parseFloat(formAmount);
    if (!formAmount || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = "Please enter a valid amount greater than 0";
    }

    if (!formType) {
      errors.type = "Please select transaction type (Credit or Debit)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveExpense = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!effectiveUserId) {
      toast.error("User identification missing. Please re-login.");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setIsSaving(true);
    try {
      const isOther = formSelectedService.toLowerCase() === "other";
      const finalServiceName = isOther
        ? formCustomServiceName.trim()
        : formSelectedService.trim();

      const matchedServiceObj = servicesList.find(
        (s) => s.sName.toLowerCase() === formSelectedService.toLowerCase()
      );

      const parsedDate = parseCustomDate(formDate) || new Date();
      const dbDateFormatted = format(parsedDate, "yyyy-MM-dd"); // Saved in database as YYYY-MM-DD

      const recordId =
        editingRecord?.id ||
        doc(
          collection(db, "Users", effectiveUserId, "record_otherExpenses")
        ).id;

      const matchedVeh = vehiclesList.find(
        (v) =>
          v.id === selectedVehicleId ||
          (selectedVehicleNumber && v.vehicleNumber === selectedVehicleNumber)
      );
      const determinedVehicleType =
        matchedVeh?.vehicleType ||
        (selectedVehicleId || selectedVehicleNumber ? "Truck" : "");

      const recordPayload = {
        id: recordId,
        userId: effectiveUserId,
        serviceId: matchedServiceObj ? matchedServiceObj.id : "custom",
        serviceName: finalServiceName,
        isCustomService: isOther,
        companyId: selectedCompanyId || "",
        companyName: selectedCompanyName || "",
        vehicleId: selectedVehicleId || "",
        vehicleNumber: selectedVehicleNumber || "",
        vehicleType: determinedVehicleType || editingRecord?.vehicleType || "",
        teamMemberId: selectedTeamMember?.uid || "",
        teamMemberName: selectedTeamMember?.userName || "",
        teamMemberRole: selectedTeamMember?.role || "",
        teamMemberEmail: selectedTeamMember?.email || "",
        teamMemberPhone: selectedTeamMember?.phoneNumber || "",
        date: dbDateFormatted,
        amount: parseFloat(formAmount) || 0,
        type: formType,
        description: formDescription.trim(),
        active: true,
        addedFrom: "Web",
        updatedAt: new Date().toISOString(),
        ...(editingRecord
          ? {}
          : {
              createdAt: new Date().toISOString(),
            }),
      };

      const docRef = doc(
        db,
        "Users",
        effectiveUserId,
        "record_otherExpenses",
        recordId
      );

      await setDoc(docRef, recordPayload, { merge: true });

      toast.success(
        editingRecord
          ? "Expense updated successfully!"
          : "Expense recorded successfully!"
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving other expense:", error);
      toast.error("Failed to save expense. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {editingRecord
                ? "Edit Expense Record"
                : "Add Expense / Service"}
            </h3>
            <p className="text-xs text-gray-500">
              {editingRecord
                ? "Modify this Cash In or Cash Out transaction"
                : "Record additional cash inflow or cash outflow"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSaveExpense} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Type Selector (Credit vs Debit) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Transaction Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Credit Button */}
              <button
                type="button"
                onClick={() => setFormType("Credit")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                  formType === "Credit"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-emerald-50/50 hover:border-emerald-300"
                }`}
              >
                <FaArrowDown className="text-xs transform rotate-45" />
                <span>Credit (Cash In)</span>
              </button>

              {/* Debit Button */}
              <button
                type="button"
                onClick={() => setFormType("Debit")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                  formType === "Debit"
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-rose-50/50 hover:border-rose-300"
                }`}
              >
                <FaArrowUp className="text-xs transform rotate-45" />
                <span>Debit (Cash Out)</span>
              </button>
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DatePicker
                selected={parseCustomDate(formDate)}
                onChange={(d: Date | null) => {
                  if (!d) {
                    setFormDate("");
                    return;
                  }
                  const formatted = format(d, "MM-dd-yyyy");
                  setFormDate(formatted);
                  if (formErrors.date) {
                    setFormErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.date;
                      return copy;
                    });
                  }
                }}
                onChangeRaw={(e: any) => {
                  const val = e?.target?.value || "";
                  setFormDate(val);
                }}
                dateFormat="MM-dd-yyyy"
                placeholderText="MM-DD-YYYY"
                className={`w-full p-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all ${
                  formErrors.date ? "border-red-500" : "border-gray-200"
                }`}
                wrapperClassName="w-full"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                popperPlacement="bottom-start"
                popperClassName="!z-[9999]"
              />
            </div>
            {formErrors.date && (
              <p className="text-[11px] text-red-500 mt-1">
                {formErrors.date}
              </p>
            )}
          </div>

          {/* Company & Vehicle Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Company Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <FaBuilding className="text-gray-400 text-[11px]" />
                  Company
                </span>
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full p-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all"
              >
                <option value="">-- Select Company (Optional) --</option>
                {sortedCompanies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.companyName}
                    {comp.isDefault ? " (Default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <FaTruck className="text-gray-400 text-[11px]" />
                  Vehicle
                </span>
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full p-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all"
              >
                <option value="">-- Select Vehicle (Optional) --</option>
                {availableVehicles.map((veh) => {
                  const isTrailer =
                    (veh.vehicleType || "").toLowerCase() === "trailer";
                  return (
                    <option key={veh.id} value={veh.id}>
                      {isTrailer ? "🚚 " : "🚛 "}
                      {veh.vehicleNumber} ({veh.vehicleType || "Truck"})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Service / Expense Dropdown */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Service / Expense Name <span className="text-red-500">*</span>
            </label>
            <select
              value={formSelectedService}
              onChange={(e) => {
                const val = e.target.value;
                setFormSelectedService(val);
                if (formErrors.service) {
                  setFormErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.service;
                    return copy;
                  });
                }
              }}
              className={`w-full p-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all ${
                formErrors.service ? "border-red-500" : "border-gray-200"
              }`}
            >
              <option value="" disabled>
                -- Select Service / Expense --
              </option>
              {sortedServices.map((s) => (
                <option key={s.id} value={s.sName}>
                  {s.sName}
                </option>
              ))}
            </select>
            {formErrors.service && (
              <p className="text-[11px] text-red-500 mt-1">
                {formErrors.service}
              </p>
            )}
          </div>

          {/* Custom Expense Input (Visible if "Other" is selected) */}
          {formSelectedService.toLowerCase() === "other" && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                Specify Custom Expense Name{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formCustomServiceName}
                onChange={(e) => {
                  setFormCustomServiceName(e.target.value);
                  if (formErrors.customService) {
                    setFormErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.customService;
                      return copy;
                    });
                  }
                }}
                placeholder="e.g., Warehouse cleaning, Parking fee, Tool purchase..."
                className={`w-full p-2.5 bg-white border rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all ${
                  formErrors.customService
                    ? "border-red-500"
                    : "border-amber-300"
                }`}
              />
              {formErrors.customService && (
                <p className="text-[11px] text-red-500 mt-1">
                  {formErrors.customService}
                </p>
              )}
            </div>
          )}

          {/* Team Assignment Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5">
                  <FaUsers className="text-[#F96176] text-xs" />
                  Team Assignment (Optional)
                </span>
              </label>
              {selectedTeamMember && (
                <button
                  type="button"
                  onClick={() => setSelectedTeamMember(null)}
                  className="text-[11px] text-red-500 hover:text-red-700 font-medium cursor-pointer"
                >
                  Clear team
                </button>
              )}
            </div>

            {selectedTeamMember ? (
              <div className="p-3 bg-gradient-to-r from-rose-50/60 to-orange-50/40 border border-rose-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F96176] to-[#e04f63] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs border border-white">
                    {selectedTeamMember.profilePicture ? (
                      <img
                        src={selectedTeamMember.profilePicture}
                        alt={selectedTeamMember.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedTeamMember.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {selectedTeamMember.userName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedTeamMember.role.toLowerCase() === "driver"
                            ? "bg-blue-100 text-blue-800"
                            : selectedTeamMember.role.toLowerCase() === "accountant"
                            ? "bg-emerald-100 text-emerald-800"
                            : selectedTeamMember.role.toLowerCase() === "manager"
                            ? "bg-purple-100 text-purple-800"
                            : selectedTeamMember.role.toLowerCase() === "subowner"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedTeamMember.role === "SubOwner"
                          ? "Co-Owner"
                          : selectedTeamMember.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {selectedTeamMember.email ||
                        selectedTeamMember.phoneNumber ||
                        "Assigned team member"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTeamSearchQuery("");
                      setSelectedTeamRoleFilter("All");
                      setIsTeamModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-[#F96176] bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition shadow-2xs cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeamMember(null)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Remove assignment"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTeamSearchQuery("");
                  setSelectedTeamRoleFilter("All");
                  setIsTeamModalOpen(true);
                }}
                className="w-full py-2.5 px-3 bg-gray-50 hover:bg-rose-50/50 border border-dashed border-gray-300 hover:border-rose-300 rounded-xl text-xs font-semibold text-gray-600 hover:text-[#F96176] flex items-center justify-center gap-2 transition cursor-pointer group"
              >
                <FaUserPlus className="text-sm text-gray-400 group-hover:text-[#F96176] transition-colors" />
                <span>+ Assign Team Member (Driver, Accountant, Manager...)</span>
              </button>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Amount ($) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formAmount}
                onChange={(e) => {
                  setFormAmount(e.target.value);
                  if (formErrors.amount) {
                    setFormErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.amount;
                      return copy;
                    });
                  }
                }}
                placeholder="0.00"
                className={`w-full pl-8 pr-3.5 py-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all ${
                  formErrors.amount ? "border-red-500" : "border-gray-200"
                }`}
              />
            </div>
            {formErrors.amount && (
              <p className="text-[11px] text-red-500 mt-1">
                {formErrors.amount}
              </p>
            )}
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Additional context or reference notes..."
              className="w-full p-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaCheck className="text-xs" />
                  <span>
                    {editingRecord ? "Update Record" : "Save Record"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Nested Team Member Selection Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden transform transition-all animate-in fade-in duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-4 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-[#F96176] rounded-xl">
                  <FaUsers className="text-base" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Select Team Member
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Assign this expense to a driver, accountant, or manager
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition cursor-pointer"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3.5 border-b border-gray-100 bg-white shrink-0">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  placeholder="Search by name, role, email, phone..."
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:bg-white transition"
                />
                {teamSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTeamSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Role Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar">
                {availableTeamRoles.map((roleName) => {
                  const isSelected = selectedTeamRoleFilter === roleName;
                  const count =
                    roleName === "All"
                      ? teamList.length
                      : teamList.filter(
                          (m) =>
                            m.role.toLowerCase() === roleName.toLowerCase()
                        ).length;

                  return (
                    <button
                      key={roleName}
                      type="button"
                      onClick={() => setSelectedTeamRoleFilter(roleName)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                        isSelected
                          ? "bg-[#F96176] text-white shadow-2xs"
                          : "bg-gray-100 hover:bg-gray-200/80 text-gray-600"
                      }`}
                    >
                      {roleName === "SubOwner" ? "Co-Owner" : roleName} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team List Content */}
            <div className="p-3.5 overflow-y-auto space-y-2 flex-1">
              {filteredTeamMembers.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <FaUserTie className="text-3xl mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-semibold text-gray-600">
                    No team members found
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {teamSearchQuery || selectedTeamRoleFilter !== "All"
                      ? "Try adjusting your search or role filter"
                      : "Add team members in Account > Manage Team"}
                  </p>
                </div>
              ) : (
                filteredTeamMembers.map((member) => {
                  const isCurrent =
                    selectedTeamMember?.uid === member.uid;

                  return (
                    <div
                      key={member.uid}
                      onClick={() => {
                        setSelectedTeamMember(member);
                        setIsTeamModalOpen(false);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-rose-50/80 border-[#F96176] shadow-2xs"
                          : "bg-white hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                          {member.profilePicture ? (
                            <img
                              src={member.profilePicture}
                              alt={member.userName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            member.userName.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {member.userName}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                member.role.toLowerCase() === "driver"
                                  ? "bg-blue-100 text-blue-800"
                                  : member.role.toLowerCase() === "accountant"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : member.role.toLowerCase() === "manager"
                                  ? "bg-purple-100 text-purple-800"
                                  : member.role.toLowerCase() === "subowner"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {member.role === "SubOwner"
                                ? "Co-Owner"
                                : member.role}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {member.email || member.phoneNumber || "No contact info"}
                          </p>
                          {member.phoneNumber && member.email && (
                            <p className="text-[10px] text-gray-400 truncate">
                              📞 {member.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCurrent ? (
                          <div className="w-6 h-6 rounded-full bg-[#F96176] text-white flex items-center justify-center shadow-2xs">
                            <FaCheck className="text-[10px]" />
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400 hover:text-[#F96176] px-2 py-1 bg-gray-50 hover:bg-rose-50 rounded-lg border border-gray-200 transition">
                            Select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedTeamMember(null);
                  setIsTeamModalOpen(false);
                }}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-200/60 transition cursor-pointer"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
