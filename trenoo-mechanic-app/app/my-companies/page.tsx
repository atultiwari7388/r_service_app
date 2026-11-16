"use client";

import React, { useEffect, useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  Building2,
  Plus,
  MoreVertical,
  CheckCircle2,
  Edit3,
  MapPin,
  X,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Star,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { CompanyType } from "@/types/company";
import {
  SUPPORTED_COUNTRIES,
  COUNTRY_REGISTRATION_FIELDS,
  normalizeCountry,
  ALL_COUNTRY_REGISTRATION_KEYS,
  SupportedCountry,
} from "@/lib/countryFields";

interface CompanyFormData {
  companyName: string;
  dot: string;
  mc: string;
  nsc: string;
  cvor: string;
  nir: string;
  cbsa: string;
  rfc: string;
  ftp: string;
  voln: string;
  abn: string;
  hva: string;
  address: string;
  city: string;
  state: string;
  country: SupportedCountry;
  postalCode?: string;
  isDefault: boolean;
  isActive: boolean;
}

const initialFormData: CompanyFormData = {
  companyName: "",
  dot: "",
  mc: "",
  nsc: "",
  cvor: "",
  nir: "",
  cbsa: "",
  rfc: "",
  ftp: "",
  voln: "",
  abn: "",
  hva: "",
  address: "",
  city: "",
  state: "",
  country: "USA",
  postalCode: "",
  isDefault: false,
  isActive: true,
};

export default function MyCompaniesPage() {
  const auth = useAuth();
  const user = auth?.user;
  const mechanicProfile = auth?.mechanicProfile;
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active action dropdown
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const isMember =
    mechanicProfile?.role === "member" ||
    !!mechanicProfile?.ownerId ||
    mechanicProfile?.isTeamMember === true;
  const isOwner = !isMember;

  const effectiveMechanicId = isMember && mechanicProfile?.ownerId
    ? mechanicProfile.ownerId
    : user?.uid;

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Real-time listener for Mechanics/{effectiveMechanicId}/myCompanies
  useEffect(() => {
    if (!effectiveMechanicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const companiesRef = collection(db, "Mechanics", effectiveMechanicId, "myCompanies");

    const unsubscribe = onSnapshot(
      companiesRef,
      (snapshot) => {
        const loaded: CompanyType[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            companyName: data.companyName || "Unnamed Company",
            dot: data.dot || "",
            mc: data.mc || "",
            nsc: data.nsc || "",
            cvor: data.cvor || "",
            nir: data.nir || "",
            cbsa: data.cbsa || "",
            rfc: data.rfc || "",
            ftp: data.ftp || "",
            voln: data.voln || "",
            abn: data.abn || "",
            hva: data.hva || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "USA",
            postalCode: data.postalCode || "",
            isDefault: Boolean(data.isDefault),
            isActive: data.isActive !== false,
            created_at: data.created_at,
            updated_at: data.updated_at,
          });
        });
        setCompanies(loaded);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching companies:", error);
        toast.error("Failed to load companies");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [effectiveMechanicId]);

  // Sort companies: Default first, then A to Z
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.companyName.localeCompare(b.companyName);
    });
  }, [companies]);

  const handleOpenAddModal = () => {
    setEditingCompanyId(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (company: CompanyType) => {
    setEditingCompanyId(company.id);
    setFormData({
      companyName: company.companyName,
      dot: company.dot || "",
      mc: company.mc || "",
      nsc: company.nsc || "",
      cvor: company.cvor || "",
      nir: company.nir || "",
      cbsa: company.cbsa || "",
      rfc: company.rfc || "",
      ftp: company.ftp || "",
      voln: company.voln || "",
      abn: company.abn || "",
      hva: company.hva || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      country: normalizeCountry(company.country),
      postalCode: company.postalCode || "",
      isDefault: company.isDefault,
      isActive: company.isActive,
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveMechanicId) {
      toast.error("Mechanic not authenticated");
      return;
    }

    if (!isOwner) {
      toast.error("Only the workshop owner can add or edit company entities.");
      return;
    }

    if (!formData.companyName.trim()) {
      toast.error("Company Name is required");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Street address is required");
      return;
    }

    if (!formData.city.trim()) {
      toast.error("City is required");
      return;
    }

    if (!formData.state.trim()) {
      toast.error("State / Province is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const companiesRef = collection(db, "Mechanics", effectiveMechanicId, "myCompanies");
      const existingSnapshot = await getDocs(companiesRef);
      const isFirstCompany = existingSnapshot.empty;
      const makeDefault = formData.isDefault || isFirstCompany;

      // If makeDefault is true, unmark all other companies
      if (makeDefault) {
        const batch = writeBatch(db);
        existingSnapshot.docs.forEach((docSnap) => {
          if (docSnap.id !== editingCompanyId) {
            batch.update(docSnap.ref, { isDefault: false });
          }
        });
        await batch.commit();
      }

      const payload = {
        companyName: formData.companyName.trim(),
        dot: formData.dot.trim(),
        mc: formData.mc.trim(),
        nsc: formData.nsc.trim(),
        cvor: formData.cvor.trim(),
        nir: formData.nir.trim(),
        cbsa: formData.cbsa.trim(),
        rfc: formData.rfc.trim(),
        ftp: formData.ftp.trim(),
        voln: formData.voln.trim(),
        abn: formData.abn.trim(),
        hva: formData.hva.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postalCode: (formData.postalCode || "").trim(),
        isDefault: makeDefault,
        isActive: formData.isActive,
        updated_at: serverTimestamp(),
      };

      if (editingCompanyId) {
        await updateDoc(
          doc(db, "Mechanics", effectiveMechanicId, "myCompanies", editingCompanyId),
          payload
        );
        toast.success("Company updated successfully!");
      } else {
        await addDoc(companiesRef, {
          ...payload,
          created_at: serverTimestamp(),
        });
        toast.success("Company added successfully!");
      }

      // Sync root mechanic document if default
      if (makeDefault) {
        await updateDoc(doc(db, "Mechanics", effectiveMechanicId), {
          companyName: formData.companyName.trim(),
          dot: formData.dot.trim(),
          mc: formData.mc.trim(),
          nsc: formData.nsc.trim(),
          cvor: formData.cvor.trim(),
          nir: formData.nir.trim(),
          cbsa: formData.cbsa.trim(),
          rfc: formData.rfc.trim(),
          ftp: formData.ftp.trim(),
          voln: formData.voln.trim(),
          abn: formData.abn.trim(),
          hva: formData.hva.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
          postalCode: (formData.postalCode || "").trim(),
          updated_at: new Date(),
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Failed to save company");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetAsDefault = async (company: CompanyType) => {
    if (!effectiveMechanicId) return;

    if (!isOwner) {
      toast.error("Only the workshop owner can set the default company.");
      return;
    }

    try {
      const companiesRef = collection(db, "Mechanics", effectiveMechanicId, "myCompanies");
      const existingSnapshot = await getDocs(companiesRef);
      const batch = writeBatch(db);

      existingSnapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { isDefault: docSnap.id === company.id });
      });

      await batch.commit();

      // Sync root mechanic profile document
      await updateDoc(doc(db, "Mechanics", effectiveMechanicId), {
        companyName: company.companyName,
        dot: company.dot || "",
        mc: company.mc || "",
        nsc: company.nsc || "",
        cvor: company.cvor || "",
        nir: company.nir || "",
        cbsa: company.cbsa || "",
        rfc: company.rfc || "",
        ftp: company.ftp || "",
        voln: company.voln || "",
        abn: company.abn || "",
        hva: company.hva || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        country: company.country || "",
        postalCode: company.postalCode || "",
        updated_at: new Date(),
      });

      toast.success(`${company.companyName} set as default company`);
    } catch (error) {
      console.error("Error setting default company:", error);
      toast.error("Failed to set default company");
    }
  };

  const handleToggleStatus = async (company: CompanyType) => {
    if (!effectiveMechanicId) return;

    if (!isOwner) {
      toast.error("Only the workshop owner can change company status.");
      return;
    }

    try {
      const newStatus = !company.isActive;
      await updateDoc(
        doc(db, "Mechanics", effectiveMechanicId, "myCompanies", company.id),
        {
          isActive: newStatus,
          updated_at: serverTimestamp(),
        }
      );

      toast.success(
        newStatus
          ? `${company.companyName} marked as Active`
          : `${company.companyName} marked as Inactive / Closed`
      );
    } catch (error) {
      console.error("Error toggling company status:", error);
      toast.error("Failed to update status");
    }
  };

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F96176]">
              <Building2 size={14} />
              <span>Workshop Profiles & Entities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              My Companies
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage your registered commercial repair shops, DOT/MC certifications, and default dispatch entities.
            </p>
          </div>

          {isOwner && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition active:scale-[0.99] cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Add Company</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={26} className="animate-spin text-[#F96176]" />
            <span className="text-xs font-semibold text-gray-500">
              Loading registered companies...
            </span>
          </div>
        ) : sortedCompanies.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-xs flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-rose-50 text-[#F96176] rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Building2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              No Companies Registered
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
              Add your registered commercial repair business, roadside towing entity, or subsidiary shop to link with fleet dispatch requests and work orders.
            </p>
            {isOwner && (
              <button
                onClick={handleOpenAddModal}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus size={15} />
                <span>Add First Company</span>
              </button>
            )}
          </div>
        ) : (
          /* Companies Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedCompanies.map((company) => {
              const addressParts = [
                company.address,
                company.city,
                company.state,
                company.postalCode,
                company.country,
              ].filter(Boolean);
              const fullAddress = addressParts.join(", ");

              const countryKey = normalizeCountry(company.country);
              const fieldConfigs = COUNTRY_REGISTRATION_FIELDS[countryKey] || [];

              return (
                <div
                  key={company.id}
                  className={`bg-white rounded-2xl border ${
                    company.isDefault && isOwner
                      ? "border-[#F96176] ring-1 ring-[#F96176]/30 shadow-sm"
                      : "border-gray-200 shadow-xs hover:border-gray-300"
                  } p-5 transition-all relative flex flex-col justify-between gap-4`}
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-3 rounded-xl shrink-0 ${
                            company.isDefault && isOwner
                              ? "bg-rose-50 text-[#F96176]"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Building2 size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-gray-900 truncate">
                            {company.companyName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            {/* Active / Closed Badge */}
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                company.isActive
                                  ? "bg-emerald-50 text-[#58BB87] border border-[#58BB87]/30"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {company.isActive ? "Active" : "Closed"}
                            </span>

                            {/* Default Badge */}
                            {company.isDefault && isOwner && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-[#F96176] border border-rose-200">
                                <Star size={10} className="fill-[#F96176]" />
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Dropdown Menu */}
                      {isOwner && (
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(
                                activeDropdownId === company.id ? null : company.id
                              );
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeDropdownId === company.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-30 text-xs"
                            >
                              {!company.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleSetAsDefault(company);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 font-bold text-[#F96176] cursor-pointer"
                                >
                                  <CheckCircle2 size={14} />
                                  <span>Set as Default</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleOpenEditModal(company);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-semibold cursor-pointer"
                              >
                                <Edit3 size={14} />
                                <span>Edit Company</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleToggleStatus(company);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-semibold cursor-pointer"
                              >
                                {company.isActive ? (
                                  <>
                                    <PauseCircle size={14} className="text-amber-600" />
                                    <span>Mark as Closed</span>
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle size={14} className="text-[#58BB87]" />
                                    <span>Mark as Active</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Country & Authority Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {company.country && (
                        <span className="inline-block px-2 py-0.5 bg-rose-50 text-[#F96176] text-[11px] font-bold rounded-md border border-rose-200">
                          {normalizeCountry(company.country)}
                        </span>
                      )}
                      {fieldConfigs
                        .filter((f) => Boolean(company[f.key as keyof CompanyType]))
                        .map((f) => (
                          <span
                            key={f.key}
                            className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 text-[11px] font-medium rounded-md border border-gray-200"
                          >
                            <span className="font-bold">{f.badgeLabel}:</span>{" "}
                            {String(company[f.key as keyof CompanyType])}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="pt-3 border-t border-gray-100 flex items-start gap-1.5 text-xs text-gray-500">
                    <MapPin size={14} className="shrink-0 text-gray-400 mt-0.5" />
                    <span className="line-clamp-2">{fullAddress || "No address provided"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: ADD / EDIT COMPANY */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in">
            <div className="relative bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 sm:p-7">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-rose-50 text-[#F96176] flex items-center justify-center font-bold">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      {editingCompanyId ? "Edit Company" : "Add New Company"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Register your workshop or mobile service entity details
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveCompany} className="mt-5 space-y-4 text-xs">
                {/* 1. Company Name */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Company / Workshop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleFormChange}
                    placeholder="e.g. Metro Mobile Truck Repair LLC"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-[#F96176] font-medium"
                  />
                </div>

                {/* 2. Country Selection */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-hidden focus:border-[#F96176] font-medium"
                  >
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Dynamic Authority Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="sm:col-span-2 text-[11px] font-bold text-gray-600 flex items-center gap-1.5 mb-1">
                    <ShieldCheck size={14} className="text-[#58BB87]" />
                    <span>{formData.country} Authority & Certification Numbers</span>
                  </div>

                  {(COUNTRY_REGISTRATION_FIELDS[formData.country] || []).map((f) => (
                    <div key={f.key}>
                      <label className="block text-gray-600 font-semibold mb-1 text-[11px]">
                        {f.label}
                      </label>
                      <input
                        type="text"
                        name={f.key}
                        value={(formData as any)[f.key] || ""}
                        onChange={handleFormChange}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-hidden focus:border-[#F96176]"
                      />
                    </div>
                  ))}
                </div>

                {/* 4. Address Details */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="e.g. 1420 Commercial Parkway, Suite 100"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-[#F96176] font-medium"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      placeholder="e.g. Dallas"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-[#F96176]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      State / Province <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleFormChange}
                      placeholder="e.g. TX"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-[#F96176]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode || ""}
                      onChange={handleFormChange}
                      placeholder="e.g. 75001"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-[#F96176]"
                    />
                  </div>
                </div>

                {/* 5. Checkboxes */}
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleFormChange}
                      className="h-4 w-4 rounded-sm border-gray-300 text-[#F96176] focus:ring-[#F96176]"
                    />
                    <span className="text-xs font-semibold text-gray-800">
                      Set as primary default dispatch company
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                      className="h-4 w-4 rounded-sm border-gray-300 text-[#58BB87] focus:ring-[#58BB87]"
                    />
                    <span className="text-xs font-semibold text-gray-800">
                      Mark company as active for fleet requests
                    </span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-bold transition shadow-xs disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingCompanyId ? "Update Company" : "Save Company"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
