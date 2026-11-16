"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import MainLayout from "@/components/layout/MainLayout";
import { Vehicle } from "@/types/vehicle";
import toast from "react-hot-toast";
import {
  Truck,
  ArrowLeft,
  Edit3,
  Building2,
  Calendar,
  Hash,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
} from "lucide-react";

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;
  const mechanicProfile = auth?.mechanicProfile;

  const vehicleId = params?.vehicleId as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const isMember =
    mechanicProfile?.role === "member" ||
    !!mechanicProfile?.ownerId ||
    mechanicProfile?.isTeamMember === true;

  const effectiveMechanicId = isMember && mechanicProfile?.ownerId
    ? mechanicProfile.ownerId
    : user?.uid;

  useEffect(() => {
    if (!effectiveMechanicId || !vehicleId) {
      setLoading(false);
      return;
    }

    const fetchVehicle = async () => {
      try {
        const docRef = doc(db, "Mechanics", effectiveMechanicId, "Vehicles", vehicleId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setVehicle({ id: snap.id, ...snap.data() } as Vehicle);
        } else {
          toast.error("Vehicle not found");
        }
      } catch (err) {
        console.error("Error fetching vehicle details:", err);
        toast.error("Failed to load vehicle details");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [effectiveMechanicId, vehicleId]);

  const handleToggleActive = async () => {
    if (!effectiveMechanicId || !vehicle) return;
    const newActive = !vehicle.active;

    try {
      const docRef = doc(db, "Mechanics", effectiveMechanicId, "Vehicles", vehicle.id);
      await updateDoc(docRef, { active: newActive });
      setVehicle((prev) => (prev ? { ...prev, active: newActive } : null));
      toast.success(newActive ? "Vehicle marked active" : "Vehicle duty paused");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/account/my-vehicles"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#F96176] transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to My Vehicles</span>
        </Link>

        {loading ? (
          <div className="py-24 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={26} className="animate-spin text-[#F96176]" />
            <span className="text-xs font-semibold text-gray-500">
              Loading vehicle details...
            </span>
          </div>
        ) : !vehicle ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-xs">
            <h3 className="text-base font-bold text-gray-800">Vehicle Not Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              The requested vehicle record could not be located.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-rose-50 text-[#F96176] flex items-center justify-center font-bold shrink-0">
                  <Truck size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F96176]">
                      {vehicle.vehicleType}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        vehicle.active !== false
                          ? "bg-emerald-50 text-[#58BB87] border border-[#58BB87]/30"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {vehicle.active !== false ? "Active Unit" : "Paused"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
                    {vehicle.vehicleNumber}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {vehicle.companyName} • {vehicle.engineName || "Standard Unit"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-center">
                <button
                  onClick={handleToggleActive}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    vehicle.active !== false
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
                      : "bg-[#58BB87] hover:bg-[#48a674] text-white border-transparent"
                  }`}
                >
                  {vehicle.active !== false ? "Pause Duty" : "Activate Unit"}
                </button>

                <Link
                  href={`/account/my-vehicles/edit/${vehicle.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Edit Vehicle</span>
                </Link>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Vehicle Specifications & Workshop Link
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
                <div>
                  <span className="text-gray-400 font-semibold block mb-0.5">
                    Assigned Workshop Entity
                  </span>
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Building2 size={15} className="text-[#F96176]" />
                    {vehicle.myCompany || "Default Workshop"}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold block mb-0.5">
                    Make / Manufacturer
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {vehicle.companyName || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold block mb-0.5">
                    Engine / Model
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {vehicle.engineName || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold block mb-0.5">
                    Model Year
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {vehicle.year || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold block mb-0.5">
                    License Plate
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {vehicle.licensePlate || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold block mb-0.5">
                    VIN
                  </span>
                  <span className="text-sm font-bold text-gray-900 font-mono">
                    {vehicle.vin || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
