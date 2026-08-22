"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { HashLoader } from "react-spinners";
import toast from "react-hot-toast";
import {
  FaBuilding,
  FaPlus,
  FaEllipsisV,
  FaCheckCircle,
  FaEdit,
  FaMapMarkerAlt,
  FaTimes,
  FaPauseCircle,
  FaPlayCircle,
} from "react-icons/fa";
import { CompanyType } from "@/types/types";

const COUNTRY_OPTIONS = [
  "USA",
  "Canada",
  "England",
  "Australia",
  "Mexico",
];

interface CompanyFormData {
  companyName: string;
  dot: string;
  mc: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
  isActive: boolean;
}

const initialFormData: CompanyFormData = {
  companyName: "",
  dot: "",
  mc: "",
  address: "",
  city: "",
  state: "",
  country: "USA",
  isDefault: false,
  isActive: true,
};

export default function MyCompaniesPage() {
  const { user } = useAuth() || { user: null };
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open action dropdown tracking
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Determine effectiveUserId
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

  // Real-time listener for companies
  useEffect(() => {
    if (!effectiveUserId) return;

    setLoading(true);
    const companiesRef = collection(db, "Users", effectiveUserId, "myCompanies");

    const unsubscribe = onSnapshot(
      companiesRef,
      (snapshot) => {
        const loaded: CompanyType[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            companyName: data.companyName || data.name || "Unnamed Company",
            dot: data.dot || "",
            mc: data.mc || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "",
            isDefault: Boolean(data.isDefault),
            isActive: data.isActive !== false, // default to true if undefined
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
  }, [effectiveUserId]);

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
      dot: company.dot,
      mc: company.mc,
      address: company.address,
      city: company.city,
      state: company.state,
      country: company.country || "USA",
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
    if (!effectiveUserId) {
      toast.error("User not authenticated");
      return;
    }

    if (!formData.companyName.trim()) {
      toast.error("Company Name is required");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Address is required");
      return;
    }

    if (!formData.city.trim()) {
      toast.error("City is required");
      return;
    }

    if (!formData.state.trim()) {
      toast.error("State is required");
      return;
    }

    if (!formData.country.trim()) {
      toast.error("Country is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const companiesRef = collection(db, "Users", effectiveUserId, "myCompanies");
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
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        isDefault: makeDefault,
        isActive: formData.isActive,
        updated_at: serverTimestamp(),
      };

      if (editingCompanyId) {
        await updateDoc(
          doc(db, "Users", effectiveUserId, "myCompanies", editingCompanyId),
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

      // Sync root user document if default
      if (makeDefault) {
        await updateDoc(doc(db, "Users", effectiveUserId), {
          companyName: formData.companyName.trim(),
          dot: formData.dot.trim(),
          mc: formData.mc.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
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
    if (!effectiveUserId) return;

    try {
      const companiesRef = collection(db, "Users", effectiveUserId, "myCompanies");
      const existingSnapshot = await getDocs(companiesRef);
      const batch = writeBatch(db);

      existingSnapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { isDefault: docSnap.id === company.id });
      });

      await batch.commit();

      // Sync root user document
      await updateDoc(doc(db, "Users", effectiveUserId), {
        companyName: company.companyName,
        dot: company.dot,
        mc: company.mc,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        updated_at: new Date(),
      });

      toast.success(`${company.companyName} set as default company`);
    } catch (error) {
      console.error("Error setting default company:", error);
      toast.error("Failed to set default company");
    }
  };

  const handleToggleStatus = async (company: CompanyType) => {
    if (!effectiveUserId) return;

    try {
      const newStatus = !company.isActive;
      await updateDoc(
        doc(db, "Users", effectiveUserId, "myCompanies", company.id),
        {
          isActive: newStatus,
          updated_at: serverTimestamp(),
        }
      );

      toast.success(
        newStatus
          ? `${company.companyName} marked as Active`
          : `${company.companyName} marked as Closed / Inactive`
      );
    } catch (error) {
      console.error("Error toggling company status:", error);
      toast.error("Failed to update status");
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-6 py-12 text-center text-gray-700">
        Please log in to manage your companies.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-80px)]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaBuilding className="text-[#F96176]" />
            My Companies
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your company profiles, active status, DOT/MC credentials and dispatch entities
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F96176] text-white text-sm font-semibold shadow hover:bg-[#e05065] transition-colors self-start sm:self-auto"
        >
          <FaPlus />
          Add Company
        </button>
      </div>

      {userRole === "SubOwner" && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          Managing companies for Owner&apos;s account.
        </div>
      )}

      {/* Companies List */}
      {sortedCompanies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-[#F96176] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FaBuilding />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Companies Found</h3>
          <p className="text-sm text-gray-500 mb-6">
            Add your primary or subsidiary logistics companies to assign them to vehicles and service records.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F96176] text-white text-sm font-semibold hover:bg-[#e05065] transition-colors"
          >
            <FaPlus />
            Add First Company
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCompanies.map((company) => {
            const addressParts = [
              company.address,
              company.city,
              company.state,
              company.country,
            ].filter(Boolean);
            const fullAddress = addressParts.join(", ");

            return (
              <div
                key={company.id}
                className={`bg-white rounded-xl border ${
                  company.isDefault
                    ? "border-[#F96176] ring-1 ring-[#F96176]/30 shadow-md"
                    : "border-gray-200 shadow-sm hover:shadow-md"
                } p-5 transition-all relative flex flex-col justify-between`}
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          company.isDefault
                            ? "bg-[#F96176]/10 text-[#F96176]"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <FaBuilding className="text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-snug">
                          {company.companyName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Active / Closed Badge */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              company.isActive
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-orange-50 text-orange-700 border border-orange-200"
                            }`}
                          >
                            {company.isActive ? "Active" : "Closed"}
                          </span>

                          {/* Default Badge */}
                          {company.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F96176]/10 text-[#F96176] border border-[#F96176]/30">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Dropdown Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(
                            activeDropdownId === company.id ? null : company.id
                          );
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <FaEllipsisV />
                      </button>

                      {activeDropdownId === company.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 text-sm"
                        >
                          <button
                            onClick={() => {
                              setActiveDropdownId(null);
                              handleToggleStatus(company);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                          >
                            {company.isActive ? (
                              <>
                                <FaPauseCircle className="text-orange-500" />
                                Mark as Closed
                              </>
                            ) : (
                              <>
                                <FaPlayCircle className="text-green-600" />
                                Mark as Active
                              </>
                            )}
                          </button>

                          {!company.isDefault && (
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleSetAsDefault(company);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-[#F96176]"
                            >
                              <FaCheckCircle />
                              Set as Default
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActiveDropdownId(null);
                              handleOpenEditModal(company);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700"
                          >
                            <FaEdit />
                            Edit Company
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DOT & MC Badges */}
                  {(company.dot || company.mc) && (
                    <div className="flex flex-wrap gap-2 my-3">
                      {company.dot && (
                        <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-md border border-gray-200">
                          DOT: {company.dot}
                        </span>
                      )}
                      {company.mc && (
                        <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-md border border-gray-200">
                          MC: {company.mc}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Address Section */}
                {fullAddress && (
                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-500">
                    <FaMapMarkerAlt className="mt-0.5 text-gray-400 shrink-0" />
                    <span className="line-clamp-2 leading-relaxed">{fullAddress}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaBuilding className="text-[#F96176]" />
                {editingCompanyId ? "Edit Company" : "Add New Company"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="mt-4 space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleFormChange}
                  placeholder="e.g. Apex Freight Logistics"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F96176] focus:border-transparent bg-gray-50"
                  required
                />
              </div>

              {/* DOT & MC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    DOT Number
                  </label>
                  <input
                    type="text"
                    name="dot"
                    value={formData.dot}
                    onChange={handleFormChange}
                    placeholder="e.g. 1234567"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F96176] focus:border-transparent bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    MC Number
                  </label>
                  <input
                    type="text"
                    name="mc"
                    value={formData.mc}
                    onChange={handleFormChange}
                    placeholder="e.g. MC-987654"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F96176] focus:border-transparent bg-gray-50"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="123 Commerce St"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F96176] focus:border-transparent bg-gray-50"
                  required
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    placeholder="Dallas"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F96176] focus:border-transparent bg-gray-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleFormChange}
                    placeholder="TX"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F96176] focus:border-transparent bg-gray-50"
                    required
                  />
                </div>
              </div>

              {/* Country Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Country *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F96176] focus:border-transparent bg-gray-50"
                  required
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Status Switch */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Active Status</div>
                  <div className="text-xs text-gray-500">
                    {formData.isActive
                      ? "Company is operational & available for dispatch"
                      : "Company is closed / inactive"}
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                  className="toggle toggle-success"
                />
              </div>

              {/* Default Company Switch */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Set as Default Company
                  </div>
                  <div className="text-xs text-gray-500">
                    Primary company for default profile and vehicle assignments
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleFormChange}
                  className="toggle toggle-secondary"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#F96176] rounded-lg hover:bg-[#e05065] transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingCompanyId
                    ? "Update Company"
                    : "Save Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
