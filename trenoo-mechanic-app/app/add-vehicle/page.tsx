"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import MainLayout from "@/components/layout/MainLayout";
import toast from "react-hot-toast";
import {
  Truck,
  Plus,
  RefreshCw,
  Building2,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { isTeamMemberProfile } from "@/lib/jobWorkflow";

// Standard fallback vehicle data when metadata documents are not yet seeded
const FALLBACK_VEHICLE_TYPES = ["Truck", "Trailer"];

const FALLBACK_COMPANIES: Record<string, string[]> = {
  Truck: [
    "FREIGHTLINER",
    "PETERBILT",
    "KENWORTH",
    "VOLVO",
    "INTERNATIONAL",
    "MACK",
    "WESTERN STAR",
  ],
  Trailer: [
    "GREAT DANE",
    "UTILITY",
    "WABASH",
    "VANGUARD",
    "HYUNDAI TRANSLEAD",
    "STOUGHTON",
    "FONTAINE",
  ],
};

const FALLBACK_ENGINES: Record<string, string[]> = {
  FREIGHTLINER: ["DETROIT DD15", "DETROIT DD13", "CUMMINS X15"],
  PETERBILT: ["PACCAR MX-13", "CUMMINS X15", "PACCAR MX-11"],
  KENWORTH: ["PACCAR MX-13", "CUMMINS X15", "PACCAR MX-11"],
  VOLVO: ["VOLVO D13", "VOLVO D11", "CUMMINS X15"],
  INTERNATIONAL: ["INTERNATIONAL A26", "CUMMINS X15"],
  MACK: ["MACK MP8", "MACK MP7"],
  "WESTERN STAR": ["DETROIT DD15", "DETROIT DD16", "CUMMINS X15"],
  "GREAT DANE": ["THERMO KING PRECEDENT", "CARRIER TRANSICOLD", "HENDRICKSON SUSPENSION"],
  UTILITY: ["CARRIER TRANSICOLD", "THERMO KING", "HENDRICKSON"],
  WABASH: ["CARRIER TRANSICOLD", "THERMO KING", "AIR RIDE CHASSIS"],
  VANGUARD: ["CARRIER TRANSICOLD", "THERMO KING", "VANGUARD DRY VAN"],
  "HYUNDAI TRANSLEAD": ["THERMO KING", "CARRIER", "HYUNDAI HT"],
  STOUGHTON: ["CARRIER", "THERMO KING", "STOUGHTON AIR"],
  FONTAINE: ["FLATBED AXLE", "DROP DECK CHASSIS"],
};

export default function AddVehiclePage() {
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;
  const mechanicProfile = auth?.mechanicProfile;

  const [loading, setLoading] = useState<boolean>(false);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(FALLBACK_VEHICLE_TYPES);
  const [companyList, setCompanyList] = useState<string[]>([]);
  const [engineNameList, setEngineNameList] = useState<string[]>([]);

  // Form State
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("Truck");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedEngineName, setSelectedEngineName] = useState<string>("");
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [vin, setVin] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [year, setYear] = useState<string>("");

  // My Companies list
  const [myCompaniesList, setMyCompaniesList] = useState<
    { id: string; companyName: string }[]
  >([]);
  const [selectedMyCompanyId, setSelectedMyCompanyId] = useState<string>("");
  const [selectedMyCompanyName, setSelectedMyCompanyName] = useState<string>("");

  const isMember = isTeamMemberProfile(mechanicProfile);

  const effectiveMechanicId = isMember && mechanicProfile?.ownerId
    ? mechanicProfile.ownerId
    : user?.uid;

  // 1. Fetch My Companies from Mechanics/{effectiveMechanicId}/myCompanies
  useEffect(() => {
    if (!effectiveMechanicId) return;

    const fetchMyCompanies = async () => {
      try {
        const snap = await getDocs(
          collection(db, "Mechanics", effectiveMechanicId, "myCompanies")
        );
        const list: { id: string; companyName: string }[] = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const name = (data.companyName || "").trim();
          if (name && data.isActive !== false) {
            list.push({ id: docSnap.id, companyName: name });
          }
        });

        // Fallback to root profile companyName if subcollection empty
        if (list.length === 0 && mechanicProfile?.companyName) {
          list.push({ id: "default", companyName: mechanicProfile.companyName });
        }

        list.sort((a, b) => a.companyName.localeCompare(b.companyName));
        setMyCompaniesList(list);

        if (list.length > 0) {
          setSelectedMyCompanyId(list[0].id);
          setSelectedMyCompanyName(list[0].companyName);
        }
      } catch (err) {
        console.error("Error fetching myCompanies:", err);
      }
    };

    fetchMyCompanies();
  }, [effectiveMechanicId, mechanicProfile?.companyName]);

  // 2. Fetch metadata vehicle types (or fallback)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const typeSnap = await getDoc(doc(db, "metadata", "vehicleType"));
        if (typeSnap.exists() && Array.isArray(typeSnap.data()?.type)) {
          setVehicleTypes(typeSnap.data()?.type);
        } else {
          setVehicleTypes(FALLBACK_VEHICLE_TYPES);
        }
      } catch {
        setVehicleTypes(FALLBACK_VEHICLE_TYPES);
      }
    };
    fetchMetadata();
  }, []);

  // 3. Update company make list when vehicle type changes
  useEffect(() => {
    if (!selectedVehicleType) {
      setCompanyList([]);
      setSelectedCompany("");
      return;
    }

    const fetchCompanies = async () => {
      try {
        const compSnap = await getDoc(doc(db, "metadata", "companyNameL"));
        if (compSnap.exists() && Array.isArray(compSnap.data()?.data)) {
          const filtered = compSnap.data()?.data
            .filter((c: any) => c.type === selectedVehicleType)
            .map((c: any) => c.cName.toString().toUpperCase());
          if (filtered.length > 0) {
            setCompanyList(filtered);
            setSelectedCompany(filtered[0]);
            return;
          }
        }
      } catch {}

      // Fallback
      const fallbacks = FALLBACK_COMPANIES[selectedVehicleType] || FALLBACK_COMPANIES.Truck;
      setCompanyList(fallbacks);
      setSelectedCompany(fallbacks[0] || "");
    };

    fetchCompanies();
  }, [selectedVehicleType]);

  // 4. Update engine list when company make changes
  useEffect(() => {
    if (!selectedCompany) {
      setEngineNameList([]);
      setSelectedEngineName("");
      return;
    }

    const fetchEngines = async () => {
      try {
        const engineSnap = await getDoc(doc(db, "metadata", "engineNameList"));
        if (engineSnap.exists() && Array.isArray(engineSnap.data()?.data)) {
          const filtered = engineSnap.data()?.data
            .filter(
              (e: any) =>
                e.type === selectedVehicleType &&
                e.cName.toUpperCase() === selectedCompany.toUpperCase()
            )
            .map((e: any) => e.eName.toString().toUpperCase());
          if (filtered.length > 0) {
            setEngineNameList(filtered);
            setSelectedEngineName(filtered[0]);
            return;
          }
        }
      } catch {}

      // Fallback
      const fallbacks = FALLBACK_ENGINES[selectedCompany] || [
        "STANDARD DIESEL ENGINE",
        "CUMMINS X15",
        "DETROIT DD15",
      ];
      setEngineNameList(fallbacks);
      setSelectedEngineName(fallbacks[0] || "");
    };

    fetchEngines();
  }, [selectedCompany, selectedVehicleType]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveMechanicId) {
      toast.error("Please log in first");
      return;
    }

    if (!selectedVehicleType || !selectedCompany || !vehicleNumber.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!selectedMyCompanyName && myCompaniesList.length > 0) {
      toast.error("Please select a company from My Companies");
      return;
    }

    setLoading(true);

    try {
      const vehiclesRef = collection(db, "Mechanics", effectiveMechanicId, "Vehicles");

      // Check if duplicate vehicleNumber exists
      const existing = await getDocs(
        query(
          vehiclesRef,
          where("vehicleNumber", "==", vehicleNumber.trim().toUpperCase())
        )
      );

      if (!existing.empty) {
        toast.error(`Vehicle with number ${vehicleNumber.trim().toUpperCase()} already exists.`);
        setLoading(false);
        return;
      }

      const vehicleData = {
        active: true,
        vehicleType: selectedVehicleType,
        companyName: selectedCompany.toUpperCase(),
        engineName: selectedEngineName.toUpperCase() || "STANDARD",
        myCompany: selectedMyCompanyName || mechanicProfile?.companyName || "Default Workshop",
        mycomId: selectedMyCompanyId || "default",
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vin: vin.trim().toUpperCase() || "",
        licensePlate: licensePlate.trim().toUpperCase() || "",
        year: year || new Date().getFullYear().toString(),
        isSet: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(vehiclesRef, vehicleData);
      await updateDoc(docRef, { vehicleId: docRef.id });

      toast.success("Vehicle registered successfully!");
      router.push("/account/my-vehicles");
    } catch (err: any) {
      console.error("Error adding vehicle:", err);
      toast.error(err?.message || "Failed to add vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        {/* Back Link + Header */}
        <div>
          <Link
            href="/account/my-vehicles"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#F96176] transition mb-3 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to My Vehicles</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F96176]">
            <Truck size={14} />
            <span>Manual Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            Add New Vehicle
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Register a commercial semi-truck, tractor, or trailer chassis into your active service fleet.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* 1. Vehicle Type Selection */}
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedVehicleType}
                onChange={(e) => setSelectedVehicleType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 bg-white focus:outline-hidden focus:border-[#F96176] font-medium"
                required
              >
                {vehicleTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Manufacturer Make Selection */}
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">
                {selectedVehicleType === "Truck"
                  ? "Truck Manufacturer / Make *"
                  : "Trailer Manufacturer / Make *"}
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 bg-white focus:outline-hidden focus:border-[#F96176] font-medium"
                required
              >
                {companyList.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. My Company Assignment */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-gray-700 font-bold">
                  Assigned Workshop / Company Entity <span className="text-red-500">*</span>
                </label>
                <Link
                  href="/my-companies"
                  className="text-xs font-bold text-[#F96176] hover:underline flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>Manage My Companies</span>
                </Link>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  value={selectedMyCompanyId}
                  onChange={(e) => {
                    const compId = e.target.value;
                    setSelectedMyCompanyId(compId);
                    const matched = myCompaniesList.find((c) => c.id === compId);
                    setSelectedMyCompanyName(matched?.companyName || "");
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 bg-white focus:outline-hidden focus:border-[#F96176] font-medium"
                >
                  {myCompaniesList.length === 0 ? (
                    <option value="">No registered companies found (Default workshop)</option>
                  ) : (
                    myCompaniesList.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.companyName}
                      </option>
                    ))
                  )}
                </select>
                <Link
                  href="/my-companies"
                  title="Add / Manage Companies"
                  className="p-3 bg-rose-50 border border-rose-200 hover:bg-[#F96176] hover:text-white text-[#F96176] rounded-xl transition-colors shrink-0 flex items-center justify-center h-[46px] w-[46px] cursor-pointer"
                >
                  <Building2 size={18} />
                </Link>
              </div>
            </div>

            {/* 4. Engine Model Selection */}
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">
                Engine / Unit Model <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedEngineName}
                onChange={(e) => setSelectedEngineName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 bg-white focus:outline-hidden focus:border-[#F96176] font-medium"
                required
              >
                {engineNameList.map((eng) => (
                  <option key={eng} value={eng}>
                    {eng}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Vehicle Number */}
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">
                Vehicle Unit Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. UNIT-101, RIG-88"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-[#F96176] font-bold"
                required
              />
            </div>

            {/* 6. VIN, License Plate & Year (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1.5">
                  VIN (Optional)
                </label>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="17-character VIN"
                  maxLength={17}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-[#F96176]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5">
                  License Plate (Optional)
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="e.g. 7XYZ890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-[#F96176]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1.5">
                  Year (Optional)
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-hidden focus:border-[#F96176]"
                >
                  <option value="">Select model year</option>
                  {Array.from({ length: 40 }, (_, i) =>
                    (new Date().getFullYear() + 1 - i).toString()
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <Link
                href="/account/my-vehicles"
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold transition shadow-xs hover:shadow-md disabled:opacity-60 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Registering Vehicle...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Add Vehicle</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
