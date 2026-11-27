"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import MainLayout from "@/components/layout/MainLayout";
import { Vehicle } from "@/types/vehicle";
import toast from "react-hot-toast";
import {
  Truck,
  Plus,
  RefreshCw,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Building2,
  Hash,
} from "lucide-react";
import { isTeamMemberProfile } from "@/lib/jobWorkflow";

export default function MyVehiclesPage() {
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;
  const mechanicProfile = auth?.mechanicProfile;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [highlightedVehicleId, setHighlightedVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isMember = isTeamMemberProfile(mechanicProfile);
  const isOwner = !isMember;

  const effectiveMechanicId = isMember && mechanicProfile?.ownerId
    ? mechanicProfile.ownerId
    : user?.uid;

  // Real-time listener on Mechanics/{effectiveMechanicId}/Vehicles
  useEffect(() => {
    if (!effectiveMechanicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const vehiclesRef = collection(db, "Mechanics", effectiveMechanicId, "Vehicles");

    const unsubscribe = onSnapshot(
      vehiclesRef,
      (snapshot) => {
        const loaded: Vehicle[] = [];
        snapshot.forEach((d) => {
          loaded.push({ id: d.id, ...d.data() } as Vehicle);
        });
        setVehicles(loaded);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching vehicles:", error);
        toast.error("Failed to load vehicles");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [effectiveMechanicId]);

  // Sort vehicles alphabetically by vehicleNumber
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      const numA = a.vehicleNumber || "";
      const numB = b.vehicleNumber || "";
      return numA.localeCompare(numB);
    });
  }, [vehicles]);

  // Restore scroll position & highlight vehicle when returning from details or edit page
  useEffect(() => {
    if (loading || sortedVehicles.length === 0) return;
    const targetId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("lastViewedVehicleId")
        : null;
    if (!targetId) return;

    const timer = setTimeout(() => {
      const rowElement = document.getElementById(`vehicle-row-${targetId}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedVehicleId(targetId);

        const highlightTimer = setTimeout(() => {
          setHighlightedVehicleId(null);
          sessionStorage.removeItem("lastViewedVehicleId");
        }, 2500);

        return () => clearTimeout(highlightTimer);
      } else {
        sessionStorage.removeItem("lastViewedVehicleId");
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [sortedVehicles, loading]);

  // Toggle vehicle active status
  const handleToggleActive = async (vehicleId: string, newValue: boolean) => {
    if (!effectiveMechanicId) return;

    try {
      const vehicleRef = doc(db, "Mechanics", effectiveMechanicId, "Vehicles", vehicleId);
      await updateDoc(vehicleRef, { active: newValue });
      toast.success(newValue ? "Vehicle marked active" : "Vehicle duty paused");
    } catch (e) {
      console.error("Error updating vehicle status:", e);
      toast.error("Failed to update vehicle status");
    }
  };

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F96176]">
              <Truck size={14} />
              <span>Fleet & Workshop Units</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              My Vehicles
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage commercial semi-trucks, trailer chassis, and active service fleet vehicles.
            </p>
          </div>

          {/* Add Vehicle Button: DIRECT REDIRECT to /add-vehicle (no excel import option) */}
          <button
            onClick={() => router.push("/add-vehicle")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition active:scale-[0.99] cursor-pointer self-start sm:self-auto"
            title="Add Vehicle"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={26} className="animate-spin text-[#F96176]" />
            <span className="text-xs font-semibold text-gray-500">
              Loading vehicles...
            </span>
          </div>
        ) : sortedVehicles.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-xs flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-rose-50 text-[#F96176] rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Truck size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              No Vehicles Registered
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
              Add your workshop service trucks, commercial rigs, or customer trailer chassis to track repairs and inspections.
            </p>
            <button
              onClick={() => router.push("/add-vehicle")}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>Add First Vehicle</span>
            </button>
          </div>
        ) : (
          /* Table of Vehicles */
          <div className="overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs sm:text-sm">
                <thead className="bg-[#F96176] text-white font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 sm:px-6 py-3.5">
                      Vehicle Type
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Vehicle Number
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Make & Company
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-center">
                      Active Status
                    </th>
                    <th scope="col" className="px-5 sm:px-6 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {sortedVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      id={`vehicle-row-${vehicle.id}`}
                      className={`transition-all duration-300 ${
                        highlightedVehicleId === vehicle.id
                          ? "bg-amber-50 ring-2 ring-amber-400"
                          : "hover:bg-gray-50/70"
                      }`}
                    >
                      {/* Vehicle Type */}
                      <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 font-bold text-xs border border-gray-200">
                          <Truck size={14} className="text-[#F96176]" />
                          <span>{vehicle.vehicleType || "Commercial"}</span>
                        </div>
                      </td>

                      {/* Vehicle Number */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-gray-900">
                            {vehicle.vehicleNumber || "Unknown Unit"}
                          </span>
                          {vehicle.year && (
                            <span className="text-[11px] font-semibold text-gray-400">
                              ({vehicle.year})
                            </span>
                          )}
                          {vehicle.isAssignedToOther && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              Lent Out
                            </span>
                          )}
                        </div>
                        {vehicle.licensePlate && (
                          <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                            Plate: {vehicle.licensePlate}
                          </div>
                        )}
                      </td>

                      {/* Make & Company */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-gray-800">
                          {vehicle.companyName || "Unknown Make"}
                        </div>
                        {vehicle.myCompany && (
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Building2 size={11} className="text-gray-400" />
                            <span>{vehicle.myCompany}</span>
                          </div>
                        )}
                        {vehicle.engineName && (
                          <div className="text-[10px] text-gray-400 font-medium">
                            Engine: {vehicle.engineName}
                          </div>
                        )}
                      </td>

                      {/* Active Toggle Switch */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={vehicle.active !== false}
                            onClick={() =>
                              handleToggleActive(vehicle.id, !(vehicle.active !== false))
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                              vehicle.active !== false ? "bg-[#58BB87]" : "bg-gray-200"
                            }`}
                            title={vehicle.active !== false ? "Active (Online)" : "Paused"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                vehicle.active !== false
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-[11px] font-bold ${
                              vehicle.active !== false
                                ? "text-[#58BB87]"
                                : "text-gray-400"
                            }`}
                          >
                            {vehicle.active !== false ? "Active" : "Paused"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 sm:px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-2">
                        <Link
                          href={`/account/my-vehicles/${vehicle.id}`}
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              sessionStorage.setItem("lastViewedVehicleId", vehicle.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-[#F96176] hover:text-white text-gray-700 transition"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </Link>

                        <Link
                          href={`/account/my-vehicles/edit/${vehicle.id}`}
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              sessionStorage.setItem("lastViewedVehicleId", vehicle.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 border border-amber-200 transition"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
