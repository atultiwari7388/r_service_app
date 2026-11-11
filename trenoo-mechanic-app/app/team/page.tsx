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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { MechanicProfile } from "@/types/auth";
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("All");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MechanicProfile | null>(null);
  const [deletingMember, setDeletingMember] = useState<MechanicProfile | null>(null);

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
  const busyCount = members.filter((m) => !!m.currentActiveJobId).length;

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
              Add and manage your technicians across Dallas, Houston, Chicago, Atlanta, and US territories. Each member logs in without purchasing their own plan.
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

        {/* KPI Cards */}
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
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400">Operating Cities</span>
              <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{operatingCities.length || 1}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400">Direct Accept</span>
              <p className="text-xl sm:text-2xl font-extrabold text-purple-600">{directDispatchCount}</p>
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
          /* Team Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => {
              const memberName = member.name || member.userName || "Technician";
              const initials = memberName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "T";
              const city = member.baseCity || member.city || "Unassigned";
              const isDirectAccept = member.allowDirectJobAcceptance === true;
              const isBusy = !!member.currentActiveJobId;
              const isActive = member.active !== false;
              const rating = member.rating || 5.0;
              const reviews = member.totalReviewsCount || 0;
              const rate = member.perHourCharge || (member as any).perHCharge || 45;

              return (
                <div
                  key={member.uid}
                  className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group"
                >
                  <div>
                    {/* Status & Badge Row */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      {/* Active / Busy badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                          isBusy
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : isActive
                            ? "bg-[#EAF8F1] text-[#58BB87] border border-emerald-200"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isBusy
                              ? "bg-amber-500 animate-pulse"
                              : isActive
                              ? "bg-[#58BB87]"
                              : "bg-gray-400"
                          }`}
                        />
                        {isBusy ? "Busy on Job" : isActive ? "Active On-Duty" : "Offline"}
                      </span>

                      {/* City Pill */}
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-[#F96176] border border-rose-100 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {city}
                      </span>
                    </div>

                    {/* Member Profile Info */}
                    <div className="flex items-start gap-3.5 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F96176] to-[#ff7d8f] text-white flex items-center justify-center font-extrabold text-base shadow-xs shrink-0">
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-extrabold text-gray-900 truncate">
                          {memberName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <b className="text-gray-800">{rating.toFixed(1)}</b> ({reviews})
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs font-bold text-gray-700">
                            ${rate}/hr
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Dispatch Mode Info */}
                    <div className="space-y-2 py-3 border-t border-gray-100 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" /> Email:
                        </span>
                        <span className="font-semibold text-gray-800 truncate max-w-[160px]">
                          {member.email || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone:
                        </span>
                        <a
                          href={`tel:${member.cellPhone || member.phoneNumber}`}
                          className="font-semibold text-gray-800 hover:text-[#F96176] transition"
                        >
                          {formatUSPhoneNumber(member.cellPhone || member.phoneNumber || "") || "N/A"}
                        </a>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-gray-400" /> Dispatch Mode:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isDirectAccept
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isDirectAccept ? "Autonomous Direct" : "Owner Dispatched"}
                        </span>
                      </div>
                    </div>

                    {/* Specialties Tags */}
                    {member.selected_services && member.selected_services.length > 0 && (
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                        {member.selected_services.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-gray-50 text-gray-600 border border-gray-200"
                          >
                            {s}
                          </span>
                        ))}
                        {member.selected_services.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold bg-gray-100 text-gray-500">
                            +{member.selected_services.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${member.cellPhone || member.phoneNumber}`}
                      className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingMember(member)}
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer"
                        title="Edit Member"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingMember(member)}
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
