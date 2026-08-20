"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { db, functions } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";
import {
  FiDownload,
  FiUploadCloud,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
  FiTruck,
  FiFileText,
} from "react-icons/fi";

interface Vehicle {
  id: string;
  vehicleNumber: string;
  companyName: string;
  isSet?: boolean;
}

interface ParsedDriverRow {
  rowIndex: number;
  memberName: string;
  memberEmail: string;
  memberEmail2: string;
  memberPhoneNumber: string;
  memberTelephone: string;
  memberPassword: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal: string;
  licenseNumber: string;
  socialSecurity: string;
  perMileCharge: string;
  payType: string;
  assignedVehicleInput: string;
  assignedVehicles: string[]; // Matched vehicle IDs
  assignedVehicleNames: string[]; // Matched vehicle numbers
  unmatchedVehicles: string[];
  recordAccess: string[];
  chequeAccess: string[];
  licExpiryDate: string | null;
  dob: string | null;
  lastDrugTest: string | null;
  dateOfHire: string | null;
  dateOfTermination: string | null;
  isValid: boolean;
  errors: string[];
}

interface DriverExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  effectiveUserId: string;
  onSuccess: () => void;
}

export default function DriverExcelImportModal({
  isOpen,
  onClose,
  effectiveUserId,
  onSuccess,
}: DriverExcelImportModalProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [, setLoadingVehicles] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ParsedDriverRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [filterTab, setFilterTab] = useState<"all" | "valid" | "invalid">("all");

  // Fetch active owner vehicles on open
  useEffect(() => {
    if (!isOpen || !effectiveUserId) return;

    const fetchOwnerVehicles = async () => {
      setLoadingVehicles(true);
      try {
        const vehiclesRef = collection(db, "Users", effectiveUserId, "Vehicles");
        const q = query(vehiclesRef, where("active", "==", true));
        const snap = await getDocs(q);

        const list: Vehicle[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            vehicleNumber: (data.vehicleNumber || data.companyName || d.id).toString().trim(),
            companyName: (data.companyName || "").toString().trim(),
          };
        });
        setVehicles(list);
      } catch (err) {
        console.error("Error fetching vehicles for import:", err);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchOwnerVehicles();
  }, [isOpen, effectiveUserId]);

  if (!isOpen) return null;

  // Clean and match vehicle string against owner fleet
  const matchVehicles = (
    inputStr: string,
    fleetVehicles: Vehicle[]
  ): { matchedIds: string[]; matchedNames: string[]; unmatched: string[] } => {
    if (!inputStr || !inputStr.trim()) {
      return { matchedIds: [], matchedNames: [], unmatched: [] };
    }

    // Split by comma, semicolon, or slash
    const parts = inputStr
      .split(/[,;/]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const matchedIds: string[] = [];
    const matchedNames: string[] = [];
    const unmatched: string[] = [];

    for (const rawPart of parts) {
      // Extract clean vehicle number if format is "ACHA9999 - VOLVO" or "ACHA9999 (VOLVO)"
      const cleanPart = rawPart
        .split(/[-–(]/)[0]
        .trim()
        .toUpperCase();

      const found = fleetVehicles.find(
        (v) =>
          v.vehicleNumber.toUpperCase() === cleanPart ||
          v.vehicleNumber.toUpperCase() === rawPart.toUpperCase() ||
          v.id === rawPart
      );

      if (found) {
        if (!matchedIds.includes(found.id)) {
          matchedIds.push(found.id);
          matchedNames.push(found.vehicleNumber);
        }
      } else {
        unmatched.push(rawPart);
      }
    }

    return { matchedIds, matchedNames, unmatched };
  };

  // Parse Excel date or string into ISO string / YYYY-MM-DD
  const parseDateValue = (val: unknown): string | null => {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString();
    }
    if (typeof val === "number") {
      // Excel serial date to JS Date
      const utcDays = Math.floor(val - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      if (!isNaN(dateInfo.getTime())) {
        return dateInfo.toISOString();
      }
    }
    if (typeof val === "string") {
      const d = new Date(val.trim());
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    return null;
  };

  // Handle File Upload and Parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsProcessing(true);
    setProgressText("Reading Excel spreadsheet...");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });

      if (!rawData || rawData.length === 0) {
        toast.error("The uploaded Excel file contains no data rows.");
        setIsProcessing(false);
        return;
      }

      setProgressText("Validating driver rows and vehicle assignments...");

      const seenEmails = new Set<string>();
      const parsed: ParsedDriverRow[] = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const errors: string[] = [];

        // Normalize helper to match variations of column keys
        const getCol = (...keys: string[]): string => {
          for (const key of keys) {
            const foundKey = Object.keys(row).find(
              (k) =>
                k.trim().toLowerCase().replace(/[*_\s-]/g, "") ===
                key.trim().toLowerCase().replace(/[*_\s-]/g, "")
            );
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
              return String(row[foundKey]).trim();
            }
          }
          return "";
        };

        const getColRaw = (...keys: string[]): unknown => {
          for (const key of keys) {
            const foundKey = Object.keys(row).find(
              (k) =>
                k.trim().toLowerCase().replace(/[*_\s-]/g, "") ===
                key.trim().toLowerCase().replace(/[*_\s-]/g, "")
            );
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
              return row[foundKey];
            }
          }
          return "";
        };

        const name = getCol("Driver Name", "Name", "Full Name", "Member Name");
        const email = getCol("Email", "Driver Email", "Member Email").toLowerCase();
        const phone = getCol("Phone Number", "Phone", "Mobile", "Contact");
        const vehicleInput = getCol(
          "Assigned Vehicle Numbers",
          "Assigned Vehicles",
          "Vehicle Number",
          "Vehicle",
          "Vehicles"
        );
        const password = getCol("Password", "Member Password") || "12345678";
        const payType = getCol("Pay Type", "Pay Mode", "PayType") || "Per Mile";
        const perMileCharge = getCol("Pay Per Mile", "Per Mile Charge", "Rate Per Mile") || "0";
        const address = getCol("Address", "Street Address");
        const city = getCol("City") || "Dallas";
        const state = getCol("State") || "TX";
        const country = getCol("Country") || "USA";
        const postal = getCol("Postal Code", "Zip Code", "Postal", "Zip");
        const licenseNumber = getCol("License Number", "DL Number", "License");
        const socialSecurity = getCol("Social Security Number", "SSN", "Social Security");
        const secondaryEmail = getCol("Secondary Email", "Email 2", "Member Email 2");
        const telephone = getCol("Telephone", "Tel");
        const recordAccessStr = getCol("Record Access", "Access");

        // Parse Dates
        const licExpiryDate = parseDateValue(
          getColRaw("License Expiry Date", "License Expiry", "DL Expiry")
        );
        const dob = parseDateValue(getColRaw("Date of Birth", "DOB", "Birth Date"));
        const lastDrugTest = parseDateValue(
          getColRaw("Last Drug Test", "Drug Test Date", "Drug Test")
        );
        const dateOfHire = parseDateValue(
          getColRaw("Date of Hire", "Hire Date", "Joining Date")
        );

        // Validation Rules
        if (!name) errors.push("Driver Name is required");
        if (!email) {
          errors.push("Email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push("Invalid email format");
        } else if (seenEmails.has(email)) {
          errors.push("Duplicate email in Excel file");
        } else {
          seenEmails.add(email);
        }

        if (!phone) errors.push("Phone Number is required");

        // Match Vehicles
        const { matchedIds, matchedNames, unmatched } = matchVehicles(
          vehicleInput,
          vehicles
        );

        if (matchedIds.length === 0) {
          errors.push(
            unmatched.length > 0
              ? `Vehicle "${unmatched.join(", ")}" not found in your fleet`
              : "At least one assigned vehicle from your fleet is required"
          );
        }

        // Record Access
        let recordAccess = ["View", "Edit", "Add"];
        if (recordAccessStr) {
          recordAccess = recordAccessStr
            .split(/[,;/]+/)
            .map((s) => s.trim())
            .filter((s) => ["View", "Edit", "Add"].includes(s));
          if (recordAccess.length === 0) recordAccess = ["View", "Edit", "Add"];
        }

        parsed.push({
          rowIndex: i + 2,
          memberName: name,
          memberEmail: email,
          memberEmail2: secondaryEmail,
          memberPhoneNumber: phone,
          memberTelephone: telephone,
          memberPassword: password,
          companyName: "",
          address,
          city,
          state,
          country,
          postal,
          licenseNumber,
          socialSecurity,
          perMileCharge: payType === "Per Mile" ? perMileCharge : "0",
          payType,
          assignedVehicleInput: vehicleInput,
          assignedVehicles: matchedIds,
          assignedVehicleNames: matchedNames,
          unmatchedVehicles: unmatched,
          recordAccess,
          chequeAccess: [],
          licExpiryDate,
          dob,
          lastDrugTest,
          dateOfHire,
          dateOfTermination: null,
          isValid: errors.length === 0,
          errors,
        });
      }

      setPreviewRows(parsed);
    } catch (err) {
      console.error("Error parsing Excel:", err);
      toast.error("Failed to parse Excel file. Please ensure it is a valid format.");
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  // Submit and create valid drivers
  const handleImportSubmit = async () => {
    const validRows = previewRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid driver records to import. Please fix errors first.");
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    const createTeamMemberFn = httpsCallable(functions, "createTeamMember");

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const currentNum = i + 1;
      setProgressText(
        `Importing driver ${currentNum} of ${validRows.length}: ${row.memberName}...`
      );
      setProgressPercent(Math.round((currentNum / validRows.length) * 100));

      try {
        // Pre-check if email already registered in Users or Mechanics
        const uSnap = await getDocs(
          query(collection(db, "Users"), where("email", "==", row.memberEmail))
        );
        const mSnap = await getDocs(
          query(collection(db, "Mechanics"), where("email", "==", row.memberEmail))
        );

        if (!uSnap.empty || !mSnap.empty) {
          row.isValid = false;
          row.errors.push("Email already registered in system");
          failCount++;
          continue;
        }

        // Call Cloud Function
        await createTeamMemberFn({
          name: row.memberName,
          email: row.memberEmail,
          email2: row.memberEmail2,
          phone: row.memberPhoneNumber,
          telephone: row.memberTelephone,
          password: row.memberPassword,
          companyName: row.companyName,
          address: row.address,
          city: row.city,
          state: row.state,
          country: row.country,
          postal: row.postal,
          licenseNum: row.licenseNumber,
          socialSecurity: row.socialSecurity,
          currentUId: effectiveUserId,
          selectedRole: "Driver",
          selectedPayType: row.payType,
          selectedVehicles: row.assignedVehicles,
          perMileCharge: row.perMileCharge,
          selectedRecordAccess: row.recordAccess,
          selectedChequeAccess: row.chequeAccess,
          licExpiryDate: row.licExpiryDate,
          recordAccess: row.recordAccess,
          chequeAccess: row.chequeAccess,
          dob: row.dob,
          lastDrugTest: row.lastDrugTest,
          dateOfHire: row.dateOfHire,
          dateOfTermination: row.dateOfTermination,
          profilePicture:
            "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
          created_at: new Date(),
          updated_at: new Date(),
          currentDeviceId: null,
          lastLogin: new Date(),
          createdFrom: "Web Bulk Import",
        });

        // Update assigned_at on Owner's Vehicles subcollection
        for (const vId of row.assignedVehicles) {
          const vehRef = doc(db, "Users", effectiveUserId, "Vehicles", vId);
          const vDoc = await getDoc(vehRef);
          if (vDoc.exists()) {
            await setDoc(
              vehRef,
              {
                ...vDoc.data(),
                assigned_at: new Date(),
                updatedAt: new Date(),
              },
              { merge: true }
            );
          }
        }

        successCount++;
      } catch (error) {
        console.error(`Failed to import driver ${row.memberName}:`, error);
        row.isValid = false;
        row.errors.push(String(error));
        failCount++;
      }
    }

    setIsProcessing(false);
    setProgressText("");
    setProgressPercent(0);

    if (successCount > 0) {
      toast.success(
        `Successfully imported ${successCount} driver(s)!${
          failCount > 0 ? ` (${failCount} failed)` : ""
        }`
      );
      onSuccess();
      onClose();
    } else {
      toast.error(`Failed to import drivers. Please inspect the errors.`);
      setPreviewRows([...previewRows]);
    }
  };

  const validCount = previewRows.filter((r) => r.isValid).length;
  const invalidCount = previewRows.filter((r) => !r.isValid).length;

  const displayRows = previewRows.filter((r) => {
    if (filterTab === "valid") return r.isValid;
    if (filterTab === "invalid") return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#58BB87] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Import Drivers (Excel)
              </h3>
              <p className="text-xs text-white/90">
                Bulk create drivers and auto-assign fleet vehicles using an Excel spreadsheet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Sample Templates Card */}
          <div className="bg-[#58BB87]/10 border border-[#58BB87]/30 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[#20593b] flex items-center gap-2">
                  <FiDownload className="w-4 h-4 text-[#58BB87]" />
                  Download Driver Sample Templates
                </h4>
                <p className="text-xs text-[#2e724f] mt-0.5">
                  Pre-filled with your fleet vehicles (e.g. ACHA9999, AQWSAS4323, CH001):
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/sample_excels/driver_single_sample.xlsx"
                  download="driver_single_sample.xlsx"
                  className="inline-flex items-center px-3.5 py-2 text-xs font-semibold bg-white border border-[#58BB87]/40 text-[#20593b] hover:bg-[#58BB87]/20 rounded-xl transition-all shadow-sm"
                >
                  <FiFileText className="mr-1.5 text-[#58BB87]" />
                  Single Driver Sample
                </a>
                <a
                  href="/sample_excels/driver_bulk_sample.xlsx"
                  download="driver_bulk_sample.xlsx"
                  className="inline-flex items-center px-3.5 py-2 text-xs font-semibold bg-[#58BB87] text-white hover:bg-[#4aa975] rounded-xl transition-all shadow-sm"
                >
                  <FiDownload className="mr-1.5 text-white" />
                  Bulk 10 Drivers Sample
                </a>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-gray-300 hover:border-[#58BB87] rounded-2xl p-6 text-center transition-all bg-gray-50/50 hover:bg-[#58BB87]/5">
            <input
              type="file"
              id="driver-excel-upload"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
            />
            <label
              htmlFor="driver-excel-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#58BB87]/15 text-[#58BB87] flex items-center justify-center shadow-inner">
                <FiUploadCloud className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-gray-700">
                {importFile ? importFile.name : "Click to select or drag & drop Excel file"}
              </span>
              <span className="text-xs text-gray-400">
                Supports .xlsx, .xls, .csv • Fleet has {vehicles.length} active vehicles ready
              </span>
            </label>
          </div>

          {/* Progress / Status */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-blue-900">
                <span>{progressText}</span>
                {progressPercent > 0 && <span>{progressPercent}%</span>}
              </div>
              {progressPercent > 0 && (
                <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#58BB87] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h4 className="text-base font-bold text-gray-900">
                    Preview Drivers ({previewRows.length} Rows)
                  </h4>
                  <p className="text-xs text-gray-500">
                    Review extracted driver information and assigned fleet vehicles before importing.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterTab("all")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      filterTab === "all"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All ({previewRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab("valid")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                      filterTab === "valid"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    Valid ({validCount})
                  </button>
                  {invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterTab("invalid")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                        filterTab === "invalid"
                          ? "bg-rose-600 text-white"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      <FiAlertCircle className="w-3.5 h-3.5" />
                      Invalid ({invalidCount})
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-2xl max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-gray-600 border-collapse">
                  <thead className="bg-gray-50 text-gray-700 font-semibold sticky top-0 border-b border-gray-200 z-10">
                    <tr>
                      <th className="p-3 w-10">#</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Driver Name</th>
                      <th className="p-3">Email & Phone</th>
                      <th className="p-3">Assigned Vehicles</th>
                      <th className="p-3">Pay Type / Rate</th>
                      <th className="p-3">City / State</th>
                      <th className="p-3">License #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayRows.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={
                          row.isValid
                            ? "hover:bg-gray-50/80"
                            : "bg-rose-50/40 hover:bg-rose-50/70"
                        }
                      >
                        <td className="p-3 font-mono text-gray-400">
                          {row.rowIndex}
                        </td>
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                              Ready
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                                <FiAlertCircle className="w-3 h-3 text-rose-600" />
                                Error
                              </span>
                              <div className="text-[10px] text-rose-600 font-medium">
                                {row.errors.join(", ")}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-gray-900">
                          {row.memberName || "-"}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-800">
                            {row.memberEmail || "-"}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {row.memberPhoneNumber || "-"}
                          </div>
                        </td>
                        <td className="p-3">
                          {row.assignedVehicleNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {row.assignedVehicleNames.map((vNum) => (
                                <span
                                  key={vNum}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#58BB87]/15 text-[#20593b] font-medium text-[11px]"
                                >
                                  <FiTruck className="w-3 h-3 text-[#58BB87]" />
                                  {vNum}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-rose-500 font-medium">
                              {row.assignedVehicleInput || "None"}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-gray-800">
                            {row.payType}
                          </span>
                          {row.payType === "Per Mile" && (
                            <span className="text-gray-500 text-[11px] block">
                              ${row.perMileCharge}/mi
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-700">
                          {row.city ? `${row.city}, ${row.state}` : "-"}
                        </td>
                        <td className="p-3 text-gray-700 font-mono">
                          {row.licenseNumber || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-gray-500">
            {previewRows.length > 0 ? (
              <span>
                <strong>{validCount}</strong> valid of{" "}
                <strong>{previewRows.length}</strong> total driver records.
              </span>
            ) : (
              <span>Select an Excel file to begin preview.</span>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-200/80 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={isProcessing || validCount === 0}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#58BB87] hover:bg-[#4aa975] rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              <FiCheckCircle className="w-4 h-4" />
              {isProcessing
                ? "Importing..."
                : `Import ${validCount} Valid Driver(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
