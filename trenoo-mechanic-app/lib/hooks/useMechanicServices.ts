"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import toast from "react-hot-toast";

export interface ServiceItem {
  id: string;
  title: string;
  image_type?: number;
  price_type?: number;
  image?: string;
  isCustom?: boolean;
  category?: string;
  description?: string;
}

export const DEFAULT_PLATFORM_SERVICES: ServiceItem[] = [
  { id: "air_leak", title: "Air Leak truck", category: "Pneumatics" },
  { id: "battery", title: "Battery", category: "Electrical" },
  { id: "brake_service", title: "Brake Service", category: "Brakes" },
  { id: "electrical", title: "Electrical", category: "Electrical" },
  { id: "engine_diagnostic", title: "Engine Diagnostic", category: "Diagnostics" },
  { id: "engine_sign", title: "Engine Sign", category: "Diagnostics" },
  { id: "fuel_def", title: "Fuel Delivery / DEF", category: "Fuel & Fluids" },
  { id: "jump_start", title: "Jump Start", category: "Emergency" },
  { id: "lockout_service", title: "Lockout Service", category: "Emergency" },
  { id: "oil_leak", title: "Oil & Fluid Leak", category: "Fuel & Fluids" },
  { id: "reefer_repair", title: "Reefer Repair", category: "Refrigeration" },
  { id: "suspension", title: "Suspension & Steering", category: "Chassis" },
  { id: "tire_steer", title: "Tire Steer", category: "Tires" },
  { id: "tire_drive", title: "Tire Drive / Trailer", category: "Tires" },
  { id: "towing", title: "Towing", category: "Emergency" },
  { id: "transmission", title: "Transmission & Clutch", category: "Drivetrain" },
];

export function useMechanicServices() {
  const auth = useAuth();
  const user = auth?.user;
  const mechanicProfile = auth?.mechanicProfile;
  const currentUID = user?.uid || "";

  const [platformServices, setPlatformServices] = useState<ServiceItem[]>([]);
  const [customServices, setCustomServices] = useState<ServiceItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [initialSelectedServices, setInitialSelectedServices] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"all" | "selected" | "unselected">("all");

  // Fetch platform services from metadata/servicesList
  const fetchPlatformServices = useCallback(async () => {
    try {
      const docSnap = await getDoc(doc(db, "metadata", "servicesList"));
      if (docSnap.exists() && docSnap.data()?.data) {
        const rawList = docSnap.data().data as any[];
        if (Array.isArray(rawList) && rawList.length > 0) {
          const parsed: ServiceItem[] = rawList.map((item, index) => ({
            id: `platform_${index}_${String(item.title || "").toLowerCase().replace(/\s+/g, "_")}`,
            title: String(item.title || "").trim(),
            image_type: Number(item.image_type) || 0,
            price_type: Number(item.price_type) || 0,
            image: item.image || "",
            isCustom: false,
          })).filter((s) => s.title.length > 0);

          setPlatformServices(parsed);
          return;
        }
      }
      // Fallback if metadata is not configured
      setPlatformServices(DEFAULT_PLATFORM_SERVICES);
    } catch (err) {
      console.warn("Could not fetch metadata/servicesList, using defaults:", err);
      setPlatformServices(DEFAULT_PLATFORM_SERVICES);
    }
  }, []);

  // Fetch mechanic's selected and custom services from Firestore
  const fetchMechanicServices = useCallback(async () => {
    if (!currentUID) return;
    try {
      const docSnap = await getDoc(doc(db, "Mechanics", currentUID));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const selected = Array.isArray(data?.selected_services)
          ? data.selected_services.map((s: any) => String(s).trim())
          : [];

        const customsRaw = Array.isArray(data?.custom_services)
          ? data.custom_services
          : [];

        const parsedCustoms: ServiceItem[] = customsRaw.map((item: any, idx: number) => {
          if (typeof item === "string") {
            return {
              id: `custom_${idx}_${item.toLowerCase().replace(/\s+/g, "_")}`,
              title: item.trim(),
              isCustom: true,
            };
          }
          return {
            id: item.id || `custom_${idx}_${String(item.title || "").toLowerCase().replace(/\s+/g, "_")}`,
            title: String(item.title || "").trim(),
            category: item.category || "Custom Specialty",
            description: item.description || "",
            isCustom: true,
          };
        }).filter((c: ServiceItem) => c.title.length > 0);

        setSelectedServices(selected);
        setInitialSelectedServices(selected);
        setCustomServices(parsedCustoms);
      }
    } catch (err) {
      console.error("Error fetching mechanic selected services:", err);
      toast.error("Failed to load your selected services");
    }
  }, [currentUID]);

  // Load all initial data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      await Promise.all([fetchPlatformServices(), fetchMechanicServices()]);
      if (isMounted) setIsLoading(false);
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [fetchPlatformServices, fetchMechanicServices]);

  // Combine platform services + custom services (deduplicating by title)
  const allServices = useMemo(() => {
    const list: ServiceItem[] = [...platformServices];
    const seenTitles = new Set(platformServices.map((s) => s.title.toLowerCase()));

    for (const custom of customServices) {
      if (!seenTitles.has(custom.title.toLowerCase())) {
        list.push(custom);
        seenTitles.add(custom.title.toLowerCase());
      }
    }

    return list;
  }, [platformServices, customServices]);

  // Filtered services based on search and active filter
  const filteredServices = useMemo(() => {
    let result = allServices;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }

    // Active filter
    if (activeFilter === "selected") {
      result = result.filter((s) => selectedServices.includes(s.title));
    } else if (activeFilter === "unselected") {
      result = result.filter((s) => !selectedServices.includes(s.title));
    }

    return result;
  }, [allServices, searchQuery, activeFilter, selectedServices]);

  // Checkbox toggle handler matching Flutter onServiceSelected
  const toggleService = useCallback((title: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(title)) {
        return prev.filter((s) => s !== title);
      } else {
        return [...prev, title];
      }
    });
  }, []);

  // Select all visible or all services
  const selectAll = useCallback(() => {
    const allTitles = allServices.map((s) => s.title);
    setSelectedServices(Array.from(new Set([...selectedServices, ...allTitles])));
  }, [allServices, selectedServices]);

  // Deselect all
  const deselectAll = useCallback(() => {
    setSelectedServices([]);
  }, []);

  // Add a new custom service
  const addCustomService = useCallback((title: string, category?: string, description?: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Service title cannot be empty");
      return false;
    }

    // Check if duplicate
    const exists = allServices.some(
      (s) => s.title.toLowerCase() === trimmedTitle.toLowerCase()
    );
    if (exists) {
      toast.error("This service already exists in the catalog");
      return false;
    }

    const newCustom: ServiceItem = {
      id: `custom_${Date.now()}_${trimmedTitle.toLowerCase().replace(/\s+/g, "_")}`,
      title: trimmedTitle,
      category: category?.trim() || "Custom Specialty",
      description: description?.trim() || "",
      isCustom: true,
    };

    setCustomServices((prev) => [newCustom, ...prev]);
    // Automatically select the newly created service
    setSelectedServices((prev) => Array.from(new Set([...prev, trimmedTitle])));
    toast.success(`"${trimmedTitle}" added and selected`);
    return true;
  }, [allServices]);

  // Edit an existing custom service
  const editCustomService = useCallback((oldTitle: string, newTitle: string, category?: string, description?: string) => {
    const trimmedNew = newTitle.trim();
    if (!trimmedNew) {
      toast.error("Service title cannot be empty");
      return false;
    }

    setCustomServices((prev) =>
      prev.map((s) => {
        if (s.title.toLowerCase() === oldTitle.toLowerCase()) {
          return {
            ...s,
            title: trimmedNew,
            category: category?.trim() || s.category,
            description: description?.trim() || s.description,
          };
        }
        return s;
      })
    );

    // Update in selectedServices if it was selected
    setSelectedServices((prev) =>
      prev.map((s) => (s.toLowerCase() === oldTitle.toLowerCase() ? trimmedNew : s))
    );

    toast.success(`Service updated to "${trimmedNew}"`);
    return true;
  }, []);

  // Remove a custom service
  const removeCustomService = useCallback((title: string) => {
    setCustomServices((prev) => prev.filter((s) => s.title.toLowerCase() !== title.toLowerCase()));
    setSelectedServices((prev) => prev.filter((s) => s.toLowerCase() !== title.toLowerCase()));
    toast.success(`"${title}" removed`);
  }, []);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (selectedServices.length !== initialSelectedServices.length) return true;
    const sortedCurrent = [...selectedServices].sort();
    const sortedInitial = [...initialSelectedServices].sort();
    return sortedCurrent.some((val, idx) => val !== sortedInitial[idx]);
  }, [selectedServices, initialSelectedServices]);

  // Save selected services to Firestore Mechanics collection matching Flutter saveSelectedServices
  const saveServices = useCallback(async () => {
    if (!currentUID) {
      toast.error("Authentication required to save services");
      return false;
    }

    setIsSaving(true);
    try {
      const mechanicDocRef = doc(db, "Mechanics", currentUID);
      await updateDoc(mechanicDocRef, {
        selected_services: selectedServices,
        custom_services: customServices,
        updated_at: serverTimestamp(),
      });

      setInitialSelectedServices([...selectedServices]);
      toast.success("Services saved successfully!");
      return true;
    } catch (err: any) {
      console.error("Error saving selected services:", err);
      toast.error(err?.message || "Error saving services. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentUID, selectedServices, customServices]);

  return {
    allServices,
    filteredServices,
    selectedServices,
    customServices,
    isLoading,
    isSaving,
    hasChanges,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    toggleService,
    selectAll,
    deselectAll,
    addCustomService,
    editCustomService,
    removeCustomService,
    saveServices,
    refreshServices: fetchMechanicServices,
  };
}
