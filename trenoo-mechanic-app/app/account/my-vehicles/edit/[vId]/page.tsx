"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import MainLayout from "@/components/layout/MainLayout";
import toast from "react-hot-toast";
import {
  Truck,
  ArrowLeft,
  RefreshCw,
  Building2,
  CheckCircle2,
  Plus,
} from "lucide-react";

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

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;
  const mechanicProfile = auth?.mechanicProfile;

  const vId = params?.vId as string;
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("Truck");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedEngineName, setSelectedEngineName] = useState<string>("");
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [vin, setVin] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [year, setYear] = useState<string>("");

  // Lists
  const [vehicleTypes] = useState<string[]>(FALLBACK_VEHICLE_TYPES);
  const [companyList, setCompanyList] = useState<string[]>([]);
  const [engineNameList, setEngineNameList] = useState<string[]>([]);
  const [myCompaniesList, setMyCompaniesList] = useState<
    { id: string; companyName: string }[]
  >([]);
  const [selectedMyCompanyId, setSelectedMyCompanyId] = useState<string>("");
  const [selectedMyCompanyName, setSelectedMyCompanyName] = useState<string>("");

  const isMember =
    mechanicProfile?.role === "member" ||
    !!mechanicProfile?.ownerId ||
    mechanicProfile?.isTeamMember === true;

  const effectiveMechanicId = isMember && mechanicProfile?.ownerId
    ? mechanicProfile.ownerId
    : user?.uid;

  // 1. Fetch My Companies
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

        if (list.length === 0 && mechanicProfile?.companyName) {
          list.push({ id: "default", companyName: mechanicProfile.companyName });
        }

        list.sort((a, b) => a.companyName.localeCompare(b.companyName));
        setMyCompaniesList(list);
      } catch (err) {
        console.error("Error fetching myCompanies:", err);
      }
    };

    fetchMyCompanies();
  }, [effectiveMechanicId, mechanicProfile?.companyName]);

  // 2. Load existing vehicle data
  useEffect(() => {
    if (!effectiveMechanicId || !vId) {
      setLoadingInitial(false);
      return;
    }

    const loadVehicle = async () => {
      try {
        const docRef = doc(db, "Mechanics", effectiveMechanicId, "Vehicles", vId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setSelectedVehicleType(data.vehicleType || "Truck");
          setSelectedCompany(data.companyName || "");
          setSelectedEngineName(data.engineName || "");
          setVehicleNumber(data.vehicleNumber || "");
          setVin(data.vin || "");
          setLicensePlate(data.licensePlate || "");
          setYear(data.year || "");
          setSelectedMyCompanyId(data.mycomId || "");
          setSelectedMyCompanyName(data.myCompany || "");
        } else {
          toast.error("Vehicle record not found");
        }
      } catch (err) {
        console.error("Error loading vehicle:", err);
        toast.error("Failed to load vehicle record");
      } finally {
        setLoadingInitial(false);
      }
    };

    loadVehicle();
  }, [effectiveMechanicId, vId]);

  // 3. Update company make list when vehicle type changes
  useEffect(() => {
    const list = FALLBACK_COMPANIES[selectedVehicleType] || FALLBACK_COMPANIES.Truck;
    setCompanyList(list);
  }, [selectedVehicleType]);

  // 4. Update engine list when company make changes
  useEffect(() => {
    const list = FALLBACK_ENGINES[selectedCompany] || [
      "STANDARD DIESEL ENGINE",
      "CUMMINS X15",
      "DETROIT DD15",
    ];
    setEngineNameList(list);
  }, [selectedCompany]);

  // Submit Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveMechanicId || !vId) {
      toast.error("Unauthorized");
      return;
    }

    if (!vehicleNumber.trim()) {
      toast.error("Vehicle Number is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const docRef = doc(db, "Mechanics", effectiveMechanicId, "Vehicles", vId);
      await updateDoc(docRef, {
        vehicleType: selectedVehicleType,
        companyName: selectedCompany.toUpperCase(),
        engineName: selectedEngineName.toUpperCase(),
        myCompany: selectedMyCompanyName || "Default Workshop",
        mycomId: selectedMyCompanyId || "default",
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vin: vin.trim().toUpperCase(),
        licensePlate: licensePlate.trim().toUpperCase(),
        year: year || "",
        updatedAt: serverTimestamp(),
      });

      toast.success("Vehicle updated successfully!");
      router.push("/account/my-vehicles");
    } catch (err: any) {
      console.error("Error updating vehicle:", err);
      toast.error(err?.message || "Failed to update vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
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
            <span>Vehicle Modification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            Edit Vehicle Unit
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Update specifications, assigned workshop entity, and compliance credentials.
          </p>
        </div>

        {loadingInitial ? (
          <div className="py-24 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={26} className="animate-spin text-[#F96176]" />
            <span className="text-xs font-semibold text-gray-500">
              Loading vehicle information...
            </span>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* 1. Vehicle Type */}
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

              {/* 2. Manufacturer Make */}
              <div>
                <label className="block text-gray-700 font-bold mb-1.5">
                  Manufacturer / Make <span className="text-red-500">*</span>
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
                  {myCompaniesList.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.companyName}
                    </option>
                  ))}
                </select>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-[#F96176] font-bold"
                  required
                />
              </div>

              {/* 6. VIN, License Plate, Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1.5">
                    VIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
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
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold transition shadow-xs hover:shadow-md disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Update Vehicle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
