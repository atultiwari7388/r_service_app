"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { HashLoader } from "react-spinners";
import toast from "react-hot-toast";
import {
  FaBuilding,
  FaArrowLeft,
  FaTruck,
  FaTrailer,
  FaExchangeAlt,
  FaSearch,
  FaCheckSquare,
  FaSquare,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import { CompanyType } from "@/types/types";

interface Vehicle {
  id: string;
  vehicleNumber: string;
  companyName: string; // Make (e.g. Freightliner, MACK)
  vehicleType: string; // "Truck" | "Trailer"
  vin?: string;
  licensePlate?: string;
  currentMiles?: string;
  currentReading?: string;
  active?: boolean;
  myCompany?: string;
  mycomId?: string;
}

export default function CompanyVehiclesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: companyId } = use(params);
  const { user } = useAuth() || { user: null };

  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Company and all companies
  const [currentCompany, setCurrentCompany] = useState<CompanyType | null>(null);
  const [allCompanies, setAllCompanies] = useState<CompanyType[]>([]);

  // Vehicles
  const [allUserVehicles, setAllUserVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(
    new Set()
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Truck" | "Trailer">("All");

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [vehiclesToTransfer, setVehiclesToTransfer] = useState<Vehicle[]>([]);
  const [targetCompanyId, setTargetCompanyId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // 1. Resolve Effective User ID
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const resolveEffectiveUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role || "");
          if (data.role === "SubOwner" && data.createdBy) {
            setEffectiveUserId(data.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        } else {
          setEffectiveUserId(user.uid);
        }
      } catch (error) {
        console.error("Error resolving effective user:", error);
        setEffectiveUserId(user.uid);
      }
    };

    resolveEffectiveUser();
  }, [user?.uid]);

  // 2. Listen to Current Company & All Companies
  useEffect(() => {
    if (!effectiveUserId || !companyId) return;

    // Listen to current company
    const companyRef = doc(db, "Users", effectiveUserId, "myCompanies", companyId);
    const unsubCompany = onSnapshot(
      companyRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentCompany({
            id: docSnap.id,
            companyName: data.companyName || data.name || "Unnamed Company",
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
        } else {
          setCurrentCompany(null);
        }
      },
      (err) => {
        console.error("Error fetching company:", err);
        toast.error("Failed to load company details");
      }
    );

    // Listen to all companies for transfer options
    const allCompaniesRef = collection(db, "Users", effectiveUserId, "myCompanies");
    const unsubAllCompanies = onSnapshot(allCompaniesRef, (snapshot) => {
      const list: CompanyType[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          companyName: data.companyName || data.name || "Unnamed Company",
          dot: data.dot || "",
          mc: data.mc || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          isDefault: Boolean(data.isDefault),
          isActive: data.isActive !== false,
        });
      });
      setAllCompanies(list);
    });

    return () => {
      unsubCompany();
      unsubAllCompanies();
    };
  }, [effectiveUserId, companyId]);

  // 3. Listen to all Vehicles for this user
  useEffect(() => {
    if (!effectiveUserId) return;

    setLoading(true);
    const vehiclesRef = collection(db, "Users", effectiveUserId, "Vehicles");
    const unsubVehicles = onSnapshot(
      vehiclesRef,
      (snapshot) => {
        const loaded: Vehicle[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            vehicleNumber: data.vehicleNumber || "",
            companyName: data.companyName || "",
            vehicleType: data.vehicleType || "Truck",
            vin: data.vin || "",
            licensePlate: data.licensePlate || "",
            currentMiles: data.currentMiles || data.currentReading || "0",
            active: data.active !== false,
            myCompany: data.myCompany || "",
            mycomId: data.mycomId || "",
          });
        });
        setAllUserVehicles(loaded);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching vehicles:", err);
        toast.error("Failed to load vehicles");
        setLoading(false);
      }
    );

    return () => unsubVehicles();
  }, [effectiveUserId]);

  // Filter vehicles that belong to THIS company
  const companyVehicles = useMemo(() => {
    if (!currentCompany) return [];
    return allUserVehicles.filter((v) => {
      if (v.mycomId && v.mycomId === companyId) return true;
      if (!v.mycomId && v.myCompany && currentCompany.companyName) {
        return (
          v.myCompany.trim().toLowerCase() ===
          currentCompany.companyName.trim().toLowerCase()
        );
      }
      return false;
    });
  }, [allUserVehicles, currentCompany, companyId]);

  // Filtered & Searched vehicles
  const displayedVehicles = useMemo(() => {
    return companyVehicles
      .filter((v) => {
        if (filterType === "All") return true;
        return v.vehicleType.toLowerCase() === filterType.toLowerCase();
      })
      .filter((v) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          v.vehicleNumber.toLowerCase().includes(q) ||
          v.companyName.toLowerCase().includes(q) ||
          (v.vin && v.vin.toLowerCase().includes(q)) ||
          (v.licensePlate && v.licensePlate.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));
  }, [companyVehicles, filterType, searchQuery]);

  // Selection handlers
  const handleToggleSelectVehicle = (vId: string) => {
    setSelectedVehicleIds((prev) => {
      const next = new Set(prev);
      if (next.has(vId)) {
        next.delete(vId);
      } else {
        next.add(vId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedVehicleIds.size === displayedVehicles.length) {
      setSelectedVehicleIds(new Set());
    } else {
      setSelectedVehicleIds(new Set(displayedVehicles.map((v) => v.id)));
    }
  };

  // Open Transfer Modal for Single Vehicle
  const handleOpenSingleTransfer = (vehicle: Vehicle) => {
    setVehiclesToTransfer([vehicle]);
    setTargetCompanyId("");
    setIsTransferModalOpen(true);
  };

  // Open Transfer Modal for Bulk Selected Vehicles
  const handleOpenBulkTransfer = () => {
    const list = companyVehicles.filter((v) => selectedVehicleIds.has(v.id));
    if (list.length === 0) {
      toast.error("Please select at least one vehicle to transfer");
      return;
    }
    setVehiclesToTransfer(list);
    setTargetCompanyId("");
    setIsTransferModalOpen(true);
  };

  // Perform Transfer (Atomic Batch)
  const handleExecuteTransfer = async () => {
    if (!effectiveUserId) {
      toast.error("User not authenticated");
      return;
    }

    if (!targetCompanyId) {
      toast.error("Please select a target company");
      return;
    }

    const targetCompany = allCompanies.find((c) => c.id === targetCompanyId);
    if (!targetCompany) {
      toast.error("Selected company is invalid");
      return;
    }

    if (targetCompany.id === companyId) {
      toast.error("Target company cannot be the same as the current company");
      return;
    }

    setIsTransferring(true);

    try {
      const batch = writeBatch(db);

      // 1. Update owner's vehicle docs
      for (const vehicle of vehiclesToTransfer) {
        const ownerVehicleRef = doc(
          db,
          "Users",
          effectiveUserId,
          "Vehicles",
          vehicle.id
        );
        batch.update(ownerVehicleRef, {
          myCompany: targetCompany.companyName,
          mycomId: targetCompany.id,
        });
      }

      // 2. Also check team members / drivers assigned to these vehicles
      try {
        const teamMembersSnapshot = await getDocs(
          query(collection(db, "Users"), where("createdBy", "==", effectiveUserId))
        );

        for (const memberDoc of teamMembersSnapshot.docs) {
          const memberId = memberDoc.id;
          const memberVehiclesSnapshot = await getDocs(
            collection(db, "Users", memberId, "Vehicles")
          );

          for (const mVehDoc of memberVehiclesSnapshot.docs) {
            const mVehData = mVehDoc.data();
            const matchingTransfer = vehiclesToTransfer.find(
              (v) =>
                v.id === mVehDoc.id ||
                v.vehicleNumber.toLowerCase() ===
                  (mVehData.vehicleNumber || "").toLowerCase()
            );

            if (matchingTransfer) {
              batch.update(mVehDoc.ref, {
                myCompany: targetCompany.companyName,
                mycomId: targetCompany.id,
              });
            }
          }
        }
      } catch (memberErr) {
        console.warn("Could not sync driver vehicle subcollections:", memberErr);
      }

      // Commit batch
      await batch.commit();

      const count = vehiclesToTransfer.length;
      toast.success(
        `Successfully transferred ${count} ${
          count === 1 ? "vehicle" : "vehicles"
        } to ${targetCompany.companyName}!`
      );

      // Clear selection & close modal
      setSelectedVehicleIds((prev) => {
        const next = new Set(prev);
        vehiclesToTransfer.forEach((v) => next.delete(v.id));
        return next;
      });
      setIsTransferModalOpen(false);
      setVehiclesToTransfer([]);
      setTargetCompanyId("");
    } catch (error) {
      console.error("Error executing vehicle transfer:", error);
      toast.error("Failed to transfer vehicles: " + error);
    } finally {
      setIsTransferring(false);
    }
  };

  // Available Target Companies (All except current company)
  const availableTargetCompanies = useMemo(() => {
    return allCompanies.filter((c) => c.id !== companyId);
  }, [allCompanies, companyId]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-lg">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <FaBuilding className="text-4xl text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Company Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">
            The company you are trying to view does not exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/my-companies")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F96176] text-white text-sm font-semibold hover:bg-[#e05065]"
          >
            <FaArrowLeft /> Back to My Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-80px)]">
      {/* Back Button & Breadcrumbs */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/my-companies"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#F96176] transition-colors"
        >
          <FaArrowLeft /> Back to My Companies
        </Link>
        <span className="text-xs text-gray-400">
          My Companies / {currentCompany.companyName} / Vehicles
        </span>
      </div>

      {userRole === "SubOwner" && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          Viewing assigned vehicles for Owner&apos;s company.
        </div>
      )}

      {/* Company Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-[#F96176]/10 text-[#F96176] rounded-2xl text-2xl shrink-0">
              <FaBuilding />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {currentCompany.companyName}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    currentCompany.isActive
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-orange-50 text-orange-700 border border-orange-200"
                  }`}
                >
                  {currentCompany.isActive ? "Active" : "Closed"}
                </span>
                {currentCompany.isDefault && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F96176]/10 text-[#F96176] border border-[#F96176]/30">
                    Default Company
                  </span>
                )}
              </div>

              {/* DOT / MC Badges & Address */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                {currentCompany.dot && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-800 font-semibold rounded-md border border-gray-200">
                    DOT: {currentCompany.dot}
                  </span>
                )}
                {currentCompany.mc && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-800 font-semibold rounded-md border border-gray-200">
                    MC: {currentCompany.mc}
                  </span>
                )}
                {(currentCompany.address || currentCompany.city) && (
                  <span className="text-gray-500">
                    {[
                      currentCompany.address,
                      currentCompany.city,
                      currentCompany.state,
                      currentCompany.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats & Action Buttons */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-center">
              <span className="block text-2xl font-bold text-gray-900">
                {companyVehicles.length}
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Vehicles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action / Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by vehicle #, make, VIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-start sm:justify-end">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            {(["All", "Truck", "Trailer"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  filterType === type
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedVehicleIds.size > 0 && (
        <div className="sticky top-4 z-30 mb-6 bg-gray-900 text-white rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#F96176] flex items-center justify-center font-bold text-sm">
              {selectedVehicleIds.size}
            </span>
            <span className="text-sm font-medium">
              {selectedVehicleIds.size}{" "}
              {selectedVehicleIds.size === 1 ? "Vehicle" : "Vehicles"} Selected
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedVehicleIds(new Set())}
              className="px-3.5 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={handleOpenBulkTransfer}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F96176] hover:bg-[#e05065] text-white text-xs font-bold shadow-md transition-colors"
            >
              <FaExchangeAlt />
              Reassign ({selectedVehicleIds.size}) to another Company
            </button>
          </div>
        </div>
      )}

      {/* Vehicles Table / Grid */}
      {displayedVehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FaTruck />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {companyVehicles.length === 0
              ? "No Vehicles Assigned to this Company"
              : "No Vehicles Match Your Search"}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            {companyVehicles.length === 0
              ? "Vehicles assigned to this company during Add Vehicle or Import will appear here. You can also reassign vehicles from other companies."
              : "Try clearing your search term or adjusting filters."}
          </p>
          {companyVehicles.length === 0 ? (
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/add-vehicle"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F96176] text-white text-sm font-semibold hover:bg-[#e05065] transition-colors"
              >
                <FaTruck /> Add Vehicle
              </Link>
              <Link
                href="/account/my-vehicles"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                View All Vehicles
              </Link>
            </div>
          ) : (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterType("All");
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <button
                      onClick={handleSelectAll}
                      className="text-lg text-gray-400 hover:text-gray-600"
                      title={
                        selectedVehicleIds.size === displayedVehicles.length
                          ? "Deselect All"
                          : "Select All"
                      }
                    >
                      {selectedVehicleIds.size > 0 &&
                      selectedVehicleIds.size === displayedVehicles.length ? (
                        <FaCheckSquare className="text-[#F96176]" />
                      ) : (
                        <FaSquare className="text-gray-300" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Vehicle #</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Make / Model</th>
                  <th className="px-4 py-3.5">VIN / License Plate</th>
                  <th className="px-4 py-3.5">Assigned Company</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedVehicles.map((vehicle) => {
                  const isSelected = selectedVehicleIds.has(vehicle.id);
                  const isTruck = vehicle.vehicleType.toLowerCase() === "truck";

                  return (
                    <tr
                      key={vehicle.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isSelected ? "bg-red-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleSelectVehicle(vehicle.id)}
                          className="text-lg"
                        >
                          {isSelected ? (
                            <FaCheckSquare className="text-[#F96176]" />
                          ) : (
                            <FaSquare className="text-gray-300 hover:text-gray-400" />
                          )}
                        </button>
                      </td>

                      {/* Vehicle Number */}
                      <td className="px-4 py-3.5 font-bold text-gray-900">
                        {vehicle.vehicleNumber}
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isTruck
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {isTruck ? <FaTruck /> : <FaTrailer />}
                          {vehicle.vehicleType}
                        </span>
                      </td>

                      {/* Make / Model */}
                      <td className="px-4 py-3.5 text-gray-700 font-medium">
                        {vehicle.companyName || "—"}
                      </td>

                      {/* VIN / License Plate */}
                      <td className="px-4 py-3.5 text-xs text-gray-500">
                        {vehicle.vin && <div>VIN: {vehicle.vin}</div>}
                        {vehicle.licensePlate && (
                          <div>Plate: {vehicle.licensePlate}</div>
                        )}
                        {!vehicle.vin && !vehicle.licensePlate && "—"}
                      </td>

                      {/* Assigned Company Badge */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                          <FaBuilding className="text-gray-500" />
                          {currentCompany.companyName}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenSingleTransfer(vehicle)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 hover:text-[#F96176] shadow-sm transition-colors"
                          title="Reassign this vehicle to another company"
                        >
                          <FaExchangeAlt />
                          Reassign
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {displayedVehicles.length} of {companyVehicles.length} assigned{" "}
              {companyVehicles.length === 1 ? "vehicle" : "vehicles"}
            </span>
            {selectedVehicleIds.size > 0 && (
              <span className="font-semibold text-[#F96176]">
                {selectedVehicleIds.size} selected for bulk transfer
              </span>
            )}
          </div>
        </div>
      )}

      {/* Transfer / Reassign Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaExchangeAlt className="text-[#F96176]" />
                Reassign Vehicles
              </h2>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                disabled={isTransferring}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4">
              {/* Transfer Summary Box */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span>Current Company</span>
                  <span className="text-[#F96176]">
                    {vehiclesToTransfer.length}{" "}
                    {vehiclesToTransfer.length === 1 ? "Vehicle" : "Vehicles"}
                  </span>
                </div>
                <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <FaBuilding className="text-gray-500" />
                  {currentCompany.companyName}
                </div>

                {/* Preview of vehicles being transferred */}
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-500 block mb-1.5">
                    Vehicles to be reassigned:
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {vehiclesToTransfer.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between text-xs bg-white p-1.5 rounded border border-gray-200"
                      >
                        <span className="font-bold text-gray-800">
                          {v.vehicleNumber}
                        </span>
                        <span className="text-gray-500">
                          {v.companyName} ({v.vehicleType})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Company Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select New Target Company *
                </label>

                {availableTargetCompanies.length === 0 ? (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800 flex items-start gap-2">
                    <FaInfoCircle className="text-base shrink-0 mt-0.5" />
                    <span>
                      You don&apos;t have any other active companies to transfer
                      to. Please add another company in{" "}
                      <Link
                        href="/my-companies"
                        className="font-bold underline hover:text-orange-950"
                      >
                        My Companies
                      </Link>{" "}
                      first.
                    </span>
                  </div>
                ) : (
                  <select
                    value={targetCompanyId}
                    onChange={(e) => setTargetCompanyId(e.target.value)}
                    disabled={isTransferring}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:border-transparent bg-white font-medium text-gray-900"
                  >
                    <option value="">-- Choose Target Company --</option>
                    {availableTargetCompanies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.companyName} {comp.dot ? `(DOT: ${comp.dot})` : ""}{" "}
                        {comp.isDefault ? "• [Default]" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Informational Alert */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <FaInfoCircle className="text-sm shrink-0 mt-0.5" />
                <span>
                  Each vehicle is strictly assigned to one company. Reassigning
                  will remove these vehicles from{" "}
                  <strong>{currentCompany.companyName}</strong> and immediately
                  assign them to the selected company.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                disabled={isTransferring}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={
                  isTransferring ||
                  !targetCompanyId ||
                  availableTargetCompanies.length === 0
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F96176] hover:bg-[#e05065] text-white text-sm font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransferring ? (
                  <>
                    <HashLoader size={16} color="#ffffff" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <FaExchangeAlt />
                    Confirm Transfer ({vehiclesToTransfer.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
