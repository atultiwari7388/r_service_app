"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Users,
  Plus,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Star,
  Search,
  CheckCircle2,
  Clock,
  Radio,
  Edit3,
  Trash2,
  Wrench,
  DollarSign,
  AlertCircle,
  Building2,
  RefreshCw,
  Truck,
  Power,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { MechanicProfile } from "@/types/auth";
import { Vehicle } from "@/types/vehicle";
import AddTeamMemberModal from "@/components/team/AddTeamMemberModal";
import EditTeamMemberModal from "@/components/team/EditTeamMemberModal";
import DeleteTeamMemberModal from "@/components/team/DeleteTeamMemberModal";
import toast from "react-hot-toast";
import { formatUSPhoneNumber } from "@/lib/utils";

export default function TeamPage() {
  const auth = useAuth();
  const currentUser = auth?.user;
  const currentMechanic = auth?.mechanicProfile;

  const [members, setMembers] = useState<MechanicProfile[]>([]);
  const [workshopVehicles, setWorkshopVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("All");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MechanicProfile | null>(null);
  const [deletingMember, setDeletingMember] = useState<MechanicProfile | null>(null);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  // Toggle technician duty/service on/off in real-time
  const handleToggleService = async (member: MechanicProfile) => {
    if (!member.uid) return;
    const isCurrentlyActive = member.active !== false;
    const newActive = !isCurrentlyActive;
    setTogglingUid(member.uid);

    try {
      await updateDoc(doc(db, "Mechanics", member.uid), {
        active: newActive,
      });
      toast.success(
        `${member.name || member.userName || "Technician"} service is now ${
          newActive ? "ON (Online)" : "OFF (Duty Paused)"
        }`
      );
    } catch (error: any) {
      console.error("Error toggling member active status:", error);
      toast.error(error?.message || "Failed to toggle service status");
    } finally {
      setTogglingUid(null);
    }
  };

  // Subscribe in real-time to this owner's team members
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    const membersRef = collection(db, "Mechanics");
    const q = query(
      membersRef,
      where("ownerId", "==", currentUser.uid),
      where("isTeamMember", "==", true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const teamList: MechanicProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          teamList.push({
            ...(data as MechanicProfile),
            uid: docSnap.id,
          });
        });

        // Sort by created_at desc
        teamList.sort((a, b) => {
          const dateA = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
          const dateB = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
          return dateB - dateA;
        });

        setMembers(teamList);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to team members:", error);
        toast.error("Failed to sync team members");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Subscribe in real-time to this owner's workshop fleet vehicles
  useEffect(() => {
    if (!currentUser?.uid) return;

    const vehiclesRef = collection(db, "Mechanics", currentUser.uid, "Vehicles");
    const unsubscribe = onSnapshot(
      vehiclesRef,
      (snapshot) => {
        const list: Vehicle[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Vehicle);
        });
        setWorkshopVehicles(list);
      },
      (error) => {
        console.error("Error listening to vehicles:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Extract unique operating cities
  const operatingCities = Array.from(
    new Set(
      members
        .map((m) => m.baseCity || m.city)
        .filter((city): city is string => Boolean(city && city.trim()))
    )
  );

  // Filter members by search and city
  const filteredMembers = members.filter((member) => {
    const memberName = (member.name || member.userName || "").toLowerCase();
    const memberEmail = (member.email || "").toLowerCase();
    const memberPhone = (member.cellPhone || member.phoneNumber || "").toLowerCase();
    const memberCity = (member.baseCity || member.city || "").toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !q ||
      memberName.includes(q) ||
      memberEmail.includes(q) ||
      memberPhone.includes(q) ||
      memberCity.includes(q);

    const matchesCity =
      selectedCityFilter === "All" ||
      (member.baseCity || member.city) === selectedCityFilter;

    return matchesSearch && matchesCity;
  });

  // Calculate KPIs
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.active !== false).length;
  const directDispatchCount = members.filter(
    (m) => m.allowDirectJobAcceptance === true
  ).length;

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F96176]">
              <Users size={15} />
              <span>Workshop Personnel & Dispatch Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              Team & Field Dispatch
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Add and manage your technicians and assign workshop fleet vehicles. Each member logs in directly with assigned units without purchasing a plan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-[#F96176]/20 cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Team Member</span>
            </button>
          </div>
        </div>

        {/* KPI Cards (No Blue/Purple Colors) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#F96176] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400">Total Technicians</span>
              <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{totalCount}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#58BB87] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400">Active On-Duty</span>
              <p className="text-xl sm:text-2xl font-extrabold text-[#58BB87]">{activeCount}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400">Operating Cities</span>
              <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{operatingCities.length || 1}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#58BB87] flex items-center justify-center font-bold">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400">Direct Accept</span>
              <p className="text-xl sm:text-2xl font-extrabold text-[#58BB87]">{directDispatchCount}</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search technician by name, email, phone or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#F96176] transition"
            />
          </div>

          {/* City Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCityFilter("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedCityFilter === "All"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Cities ({totalCount})
            </button>
            {operatingCities.map((city) => {
              const count = members.filter(
                (m) => (m.baseCity || m.city) === city
              ).length;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCityFilter(city)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    selectedCityFilter === city
                      ? "bg-[#F96176] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{city}</span>
                  <span className="opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-gray-200 shadow-xs">
            <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">
              Loading workshop team personnel...
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-xs max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#F96176] flex items-center justify-center mx-auto border border-rose-100">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {searchQuery || selectedCityFilter !== "All"
                  ? "No matching technicians found"
                  : "No team members added yet"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {searchQuery || selectedCityFilter !== "All"
                  ? "Try resetting your search query or city filter."
                  : "Expand your workshop reach! Add field technicians across US metropolitan corridors and interstate highways to automatically route commercial breakdown requests."}
              </p>
            </div>
            {searchQuery || selectedCityFilter !== "All" ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCityFilter("All");
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#F96176] text-white text-xs font-bold hover:bg-[#e0485d] transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add First Technician
              </button>
            )}
          </div>
        ) : (
          /* Horizontal Team Table */
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4 sm:px-6">Name</th>
                    <th className="py-3.5 px-4">Vehicle Number</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4 text-center">Service Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {filteredMembers.map((member) => {
                    const memberName = member.name || member.userName || "Technician";
                    const initials =
                      memberName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "T";
                    const city = member.baseCity || member.city || "Unassigned";
                    const isActive = member.active !== false;
                    const isBusy = !!member.currentActiveJobId;
                    const isToggling = togglingUid === member.uid;

                    // Find vehicles assigned to this member
                    const memberAssignedVehicles = workshopVehicles.filter(
                      (v) =>
                        v.assignedTo === member.uid ||
                        (Array.isArray(member.assignedVehicles) &&
                          member.assignedVehicles.includes(v.id))
                    );

                    return (
                      <tr
                        key={member.uid}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        {/* 1. Name */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F96176] to-[#ff7d8f] text-white flex items-center justify-center font-extrabold text-xs shadow-2xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 truncate">
                                  {memberName}
                                </span>
                                {isBusy && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                    On Job
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                                <span className="truncate max-w-[170px]">
                                  {member.email || "No email"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Vehicle Number */}
                        <td className="py-4 px-4">
                          {memberAssignedVehicles.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                              {memberAssignedVehicles.map((v) => (
                                <span
                                  key={v.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-[#F96176] border border-rose-100"
                                  title={`${v.companyName || "Workshop"} ${
                                    v.licensePlate ? `• Plate: ${v.licensePlate}` : ""
                                  }`}
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>#{v.vehicleNumber}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              No vehicle assigned
                            </span>
                          )}
                        </td>

                        {/* 3. Location */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#F96176] shrink-0" />
                            <span className="truncate max-w-[150px]">{city}</span>
                          </div>
                        </td>

                        {/* 4. Phone Number */}
                        <td className="py-4 px-4">
                          {member.cellPhone || member.phoneNumber ? (
                            <a
                              href={`tel:${member.cellPhone || member.phoneNumber}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 hover:text-[#F96176] transition"
                            >
                              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="whitespace-nowrap">
                                {formatUSPhoneNumber(
                                  member.cellPhone || member.phoneNumber || ""
                                )}
                              </span>
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">N/A</span>
                          )}
                        </td>

                        {/* 5. Service ON/OFF Button */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActive}
                              disabled={isToggling}
                              onClick={() => handleToggleService(member)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                                isActive ? "bg-[#58BB87]" : "bg-gray-300"
                              }`}
                              title={
                                isActive
                                  ? "Service ON (Receiving jobs) - Click to turn OFF"
                                  : "Service OFF (Duty paused) - Click to turn ON"
                              }
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                  isActive ? "translate-x-5" : "translate-x-0"
                                }`}
                              >
                                {isToggling ? (
                                  <RefreshCw
                                    size={10}
                                    className="animate-spin text-gray-500"
                                  />
                                ) : (
                                  <Power
                                    size={11}
                                    className={
                                      isActive ? "text-[#58BB87]" : "text-gray-400"
                                    }
                                  />
                                )}
                              </span>
                            </button>
                            <span
                              className={`text-xs font-bold min-w-[34px] text-left ${
                                isActive ? "text-[#58BB87]" : "text-gray-400"
                              }`}
                            >
                              {isActive ? "ON" : "OFF"}
                            </span>
                          </div>
                        </td>

                        {/* 6. Edit & Actions Button */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingMember(member)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-[#F96176] text-gray-700 hover:text-[#F96176] hover:bg-rose-50/50 text-xs font-semibold transition cursor-pointer"
                              title="Edit Member"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeletingMember(member)}
                              className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        <AddTeamMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />

        <EditTeamMemberModal
          isOpen={!!editingMember}
          member={editingMember}
          onClose={() => setEditingMember(null)}
        />

        <DeleteTeamMemberModal
          isOpen={!!deletingMember}
          member={deletingMember}
          onClose={() => setDeletingMember(null)}
        />
      </div>
    </MainLayout>
  );
}
