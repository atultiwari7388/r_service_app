"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  FaEdit,
  FaEllipsisV,
  FaPlus,
  FaTrash,
  FaMapMarkerAlt,
  FaTimes,
} from "react-icons/fa";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { GlobalToastError } from "@/utils/globalErrorToast";

type TabId =
  | "shippers"
  | "carrier"
  | "bookingAuthority"
  | "bookingAgent"
  | "salesAgent"
  | "bookingOffice";

type FieldType = "text" | "tel" | "time";

interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
}

interface SettingsEntity {
  id: string;
  name: string;
  address: string;
  phone: string;
  zipCode?: string;
  pinCode?: string;
  startTime?: string;
  endTime?: string;
  yardLocation?: string;
  companyName?: string;
  currentUserId: string;
  effectiveUserId: string;
}

interface TabConfig {
  id: TabId;
  label: string;
  buttonText: string;
  collectionName: string;
}

const PAGE_SIZE = 5;

const GOOGLE_LIBRARIES: "places"[] = ["places"];

const tabs: TabConfig[] = [
  {
    id: "shippers",
    label: "Shipper/Consignee",
    buttonText: "Add Shipper/Consignee",
    collectionName: "settings_shippers",
  },
  {
    id: "carrier",
    label: "Carrier",
    buttonText: "Add Carrier",
    collectionName: "settings_carriers",
  },
  {
    id: "bookingAuthority",
    label: "Booking Authority",
    buttonText: "Add Company",
    collectionName: "settings_booking_authorities",
  },
  {
    id: "bookingAgent",
    label: "Booking Agent",
    buttonText: "Add Agent",
    collectionName: "settings_booking_agents",
  },
  {
    id: "salesAgent",
    label: "Sales Agent",
    buttonText: "Add Agent",
    collectionName: "settings_sales_agents",
  },
  {
    id: "bookingOffice",
    label: "Booking Office",
    buttonText: "Add Office",
    collectionName: "settings_booking_offices",
  },
];

const getFormFields = (tabId: TabId): FormField[] => {
  const baseFields: FormField[] = [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "address", label: "Address", type: "text", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    { name: "pinCode", label: "Pin Code", type: "text", required: true },
  ];

  switch (tabId) {
    case "shippers":
      return [
        ...baseFields,
        // { name: "zipCode", label: "Zip Code", type: "text", required: true },
        {
          name: "startTime",
          label: "Start Time",
          type: "time",
          required: true,
        },
        { name: "endTime", label: "End Time", type: "time", required: true },
      ];
    case "carrier":
      return [
        ...baseFields,
        {
          name: "yardLocation",
          label: "Yard Location",
          type: "text",
          required: true,
        },
      ];
    case "bookingAuthority":
      return [
        {
          name: "companyName",
          label: "Company Name",
          type: "text",
          required: true,
        },
        ...baseFields.slice(1),
      ];
    default:
      return baseFields;
  }
};

const getExtraColumns = (tabId: TabId) => {
  switch (tabId) {
    case "shippers":
      return [
        { key: "pinCode", label: "Pin Code" },
        // { key: "zipCode", label: "Zip Code" },
        { key: "timings", label: "Working Hours" },
      ];
    case "carrier":
      return [
        { key: "pinCode", label: "Pin Code" },
        { key: "yardLocation", label: "Yard Location" },
      ];
    default:
      return [{ key: "pinCode", label: "Pin Code" }];
  }
};

// ─── Manual Time Input Component with AM/PM ───
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
}

const ManualTimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  required,
}) => {
  const parseTime = (val: string) => {
    if (!val) return { hour: "", minute: "", period: "AM" };

    const amPmMatch = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (amPmMatch) {
      return {
        hour: amPmMatch[1],
        minute: amPmMatch[2],
        period: amPmMatch[3].toUpperCase(),
      };
    }

    const match24 = val.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      let h = parseInt(match24[1], 10);
      const m = match24[2];
      const period = h >= 12 ? "PM" : "AM";
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
      return {
        hour: String(h),
        minute: m,
        period,
      };
    }

    return { hour: "", minute: "", period: "AM" };
  };

  const { hour, minute, period } = parseTime(value);
  const [localHour, setLocalHour] = useState(hour);
  const [localMinute, setLocalMinute] = useState(minute);
  const [localPeriod, setLocalPeriod] = useState(period);

  useEffect(() => {
    setLocalHour(hour);
    setLocalMinute(minute);
    setLocalPeriod(period);
  }, [value, hour, minute, period]);

  const buildValue = (h: string, m: string, p: string) => {
    const hNum = parseInt(h, 10);
    const mNum = parseInt(m, 10);
    if (
      !isNaN(hNum) &&
      !isNaN(mNum) &&
      hNum >= 1 &&
      hNum <= 12 &&
      mNum >= 0 &&
      mNum <= 59
    ) {
      onChange(
        `${String(hNum).padStart(2, "0")}:${String(mNum).padStart(2, "0")} ${p}`
      );
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);

    if (raw === "") {
      setLocalHour("");
      return;
    }

    // Always allow typing up to 2 digits for smooth experience
    const num = parseInt(raw, 10);
    if (raw.length <= 2 && (raw.length === 1 || (num >= 1 && num <= 12))) {
      setLocalHour(raw);

      // Auto-format if complete valid time
      if (raw.length === 2 && localMinute && num >= 1 && num <= 12) {
        const hNum = parseInt(raw, 10);
        const mNum = parseInt(localMinute, 10);
        if (!isNaN(mNum) && mNum >= 0 && mNum <= 59) {
          onChange(
            `${String(hNum).padStart(2, "0")}:${String(mNum).padStart(
              2,
              "0"
            )} ${localPeriod}`
          );
        }
      }
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);

    if (raw === "") {
      setLocalMinute("");
      return;
    }

    const num = parseInt(raw, 10);
    if (raw.length <= 2 && (raw.length === 1 || (num >= 0 && num <= 59))) {
      setLocalMinute(raw);

      // Auto-format if complete valid time
      if (raw.length === 2 && localHour && num >= 0 && num <= 59) {
        const hNum = parseInt(localHour, 10);
        const mNum = parseInt(raw, 10);
        if (!isNaN(hNum) && hNum >= 1 && hNum <= 12) {
          onChange(
            `${String(hNum).padStart(2, "0")}:${String(mNum).padStart(
              2,
              "0"
            )} ${localPeriod}`
          );
        }
      }
    }
  };

  const togglePeriod = (p: string) => {
    setLocalPeriod(p);
    if (localHour && localMinute) {
      const hNum = parseInt(localHour, 10);
      const mNum = parseInt(localMinute, 10);
      if (
        !isNaN(hNum) &&
        hNum >= 1 &&
        hNum <= 12 &&
        !isNaN(mNum) &&
        mNum >= 0 &&
        mNum <= 59
      ) {
        onChange(
          `${String(hNum).padStart(2, "0")}:${String(mNum).padStart(
            2,
            "0"
          )} ${p}`
        );
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center gap-3">
        {/* Hour Input */}
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="HH"
            maxLength={2}
            value={localHour}
            onChange={handleHourChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F96176] focus:border-[#F96176] transition-colors shadow-sm bg-white text-center text-lg font-semibold text-gray-700 tracking-widest"
            required={required}
          />
          <span className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-gray-400">
            Hour (1-12)
          </span>
        </div>

        <span className="text-2xl font-bold text-gray-400 pb-4">:</span>

        {/* Minute Input */}
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM"
            maxLength={2}
            value={localMinute}
            onChange={handleMinuteChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F96176] focus:border-[#F96176] transition-colors shadow-sm bg-white text-center text-lg font-semibold text-gray-700 tracking-widest"
            required={required}
          />
          <span className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-gray-400">
            Minute (0-59)
          </span>
        </div>

        {/* AM/PM Toggle */}
        <div className="flex flex-col gap-1 pb-4">
          <button
            type="button"
            onClick={() => togglePeriod("AM")}
            className={`px-4 py-2 text-xs font-bold tracking-wider rounded-lg transition-all duration-200 ${
              localPeriod === "AM"
                ? "bg-[#F96176] text-white shadow-md scale-105"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => togglePeriod("PM")}
            className={`px-4 py-2 text-xs font-bold tracking-wider rounded-lg transition-all duration-200 ${
              localPeriod === "PM"
                ? "bg-[#F96176] text-white shadow-md scale-105"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Address Autocomplete Input Component ───
interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onOpenMap?: () => void;
  showMapButton?: boolean;
  required?: boolean;
  label: string;
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onOpenMap,
  showMapButton = false,
  required,
  label,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef =
    useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (
      !inputRef.current ||
      !window.google?.maps?.places ||
      autocompleteInstanceRef.current
    )
      return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["geocode", "establishment"],
          fields: ["formatted_address", "geometry", "name"],
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          onChangeRef.current(place.formatted_address);
        } else if (place.name) {
          onChangeRef.current(place.name);
        }
      });

      autocompleteInstanceRef.current = autocomplete;
    } catch (err) {
      console.warn("Google Places Autocomplete init failed:", err);
    }

    return () => {
      if (autocompleteInstanceRef.current) {
        google.maps.event.clearInstanceListeners(
          autocompleteInstanceRef.current
        );
        autocompleteInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F96176] focus:border-[#F96176] transition-colors shadow-sm"
          placeholder="Start typing an address..."
          required={required}
          autoComplete="off"
        />
        {showMapButton && onOpenMap && (
          <button
            type="button"
            onClick={onOpenMap}
            className="px-4 py-3 bg-[#F96176] text-white rounded-xl hover:bg-[#F96176]/90 transition-all flex items-center shadow-sm flex-shrink-0"
            title="Select on Map"
          >
            <FaMapMarkerAlt className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default function SettingPage() {
  const { user, isLoading } = useAuth() || { user: null, isLoading: false };
  const [activeTab, setActiveTab] = useState<TabId>("shippers");
  const [entities, setEntities] = useState<SettingsEntity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SettingsEntity | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [effectiveUserId, setEffectiveUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isResolvingUser, setIsResolvingUser] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Map related states
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 41.8781, lng: -87.6298 });
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const formFields = getFormFields(activeTab);
  const extraColumns = getExtraColumns(activeTab);

  const buildFormData = (item: SettingsEntity | null) =>
    formFields.reduce<Record<string, string>>((acc, field) => {
      if (!item) {
        acc[field.name] = "";
        return acc;
      }

      if (field.name === "companyName") {
        acc[field.name] = item.companyName || item.name || "";
        return acc;
      }

      acc[field.name] =
        (item[field.name as keyof SettingsEntity] as string) || "";
      return acc;
    }, {});

  const resolveEffectiveUserId = async (userId: string) => {
    setIsResolvingUser(true);
    try {
      const userDoc = await getDoc(doc(db, "Users", userId));

      if (userDoc.exists()) {
        const userData = userDoc.data() as {
          role?: string;
          createdBy?: string;
        };

        setUserRole(userData.role || "");
        if (userData.role === "SubOwner" && userData.createdBy) {
          setEffectiveUserId(userData.createdBy);
        } else {
          setEffectiveUserId(userId);
        }
      } else {
        setEffectiveUserId(userId);
      }
    } catch (error) {
      GlobalToastError(error);
      setEffectiveUserId(userId);
    } finally {
      setIsResolvingUser(false);
    }
  };

  const fetchEntities = useCallback(
    async (targetPage = 1) => {
      if (!effectiveUserId) {
        return;
      }

      setIsFetching(true);

      try {
        const currentCollectionRef = collection(db, currentTab.collectionName);
        const snapshot = await getDocs(
          query(
            currentCollectionRef,
            where("effectiveUserId", "==", effectiveUserId)
          )
        );

        const allEntities = snapshot.docs
          .map((entityDoc) => ({
            id: entityDoc.id,
            ...(entityDoc.data() as Omit<SettingsEntity, "id">),
          }))
          .sort((a, b) => {
            const aSeconds =
              (a as SettingsEntity & { updatedAt?: { seconds?: number } })
                .updatedAt?.seconds || 0;
            const bSeconds =
              (b as SettingsEntity & { updatedAt?: { seconds?: number } })
                .updatedAt?.seconds || 0;

            return bSeconds - aSeconds;
          });

        const startIndex = (targetPage - 1) * PAGE_SIZE;
        const pageDocs = allEntities.slice(startIndex, startIndex + PAGE_SIZE);

        setEntities(pageDocs);
        setHasNextPage(startIndex + PAGE_SIZE < allEntities.length);
        setCurrentPage(targetPage);
      } catch (error) {
        GlobalToastError(error);
        setEntities([]);
        setHasNextPage(false);
      } finally {
        setIsFetching(false);
      }
    },
    [currentTab.collectionName, effectiveUserId]
  );

  const goToPage = async (targetPage: number) => {
    if (targetPage < 1) {
      return;
    }

    await fetchEntities(targetPage);
  };

  useEffect(() => {
    if (!user?.uid) {
      setEffectiveUserId("");
      setIsResolvingUser(false);
      return;
    }

    resolveEffectiveUserId(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    setEntities([]);
    setCurrentPage(1);
    setHasNextPage(false);
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  }, [activeTab]);

  useEffect(() => {
    if (effectiveUserId) {
      fetchEntities(1);
    }
  }, [effectiveUserId, activeTab, fetchEntities]);

  const openModal = (item: SettingsEntity | null = null) => {
    setEditingItem(item);
    setFormData(buildFormData(item));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openMapModal = () => {
    setIsMapModalOpen(true);
  };

  const closeMapModal = () => {
    setIsMapModalOpen(false);
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        setFormData((prev) => ({
          ...prev,
          address: place.formatted_address!,
        }));
        toast.success("Address selected!");
        closeMapModal();
      }
    }
  };

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: e.latLng }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setFormData((prev) => ({
            ...prev,
            address: results[0].formatted_address!,
          }));
          toast.success("Address selected!");
          closeMapModal();
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid || !effectiveUserId) {
      toast.error("Please login to manage settings.");
      return;
    }

    setIsSubmitting(true);

    try {
      const currentCollectionRef = collection(db, currentTab.collectionName);
      const trimmedValues = formFields.reduce<Record<string, string>>(
        (acc, field) => {
          acc[field.name] = (formData[field.name] || "").trim();
          return acc;
        },
        {}
      );

      const normalizedName =
        activeTab === "bookingAuthority"
          ? trimmedValues.companyName || ""
          : trimmedValues.name || "";

      const payload = {
        ...trimmedValues,
        name: normalizedName,
        currentUserId: user.uid,
        effectiveUserId,
        updatedAt: serverTimestamp(),
      };

      if (editingItem) {
        await updateDoc(doc(currentCollectionRef, editingItem.id), payload);
        toast.success(`${currentTab.label} updated successfully.`);
      } else {
        const newDocRef = doc(currentCollectionRef);
        await setDoc(newDocRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success(`${currentTab.label} created successfully.`);
      }

      closeModal();
      await fetchEntities(1);
    } catch (error) {
      GlobalToastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (item: SettingsEntity) => {
    if (!effectiveUserId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${item.companyName || item.name}" from ${currentTab.label}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const currentCollectionRef = collection(db, currentTab.collectionName);
      await deleteDoc(doc(currentCollectionRef, item.id));
      toast.success(`${currentTab.label} deleted successfully.`);
      await fetchEntities(1);
    } catch (error) {
      GlobalToastError(error);
    }
  };

  const renderExtraColumnValue = (item: SettingsEntity, key: string) => {
    if (key === "timings") {
      if (!item.startTime && !item.endTime) {
        return "-";
      }
      return `${item.startTime || "-"} — ${item.endTime || "-"}`;
    }

    return (item[key as keyof SettingsEntity] as string) || "-";
  };

  const EmptyState = () => (
    <div className="text-center py-16 px-6">
      <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FaPlus className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No {currentTab.label.toLowerCase()} yet
      </h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Create your first {currentTab.label.toLowerCase()} record and it will be
        stored in Firebase for this user.
      </p>
      <button
        type="button"
        onClick={() => openModal()}
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#F96176] to-[#e8506a] text-white rounded-2xl shadow-lg hover:shadow-xl hover:from-[#F96176]/90 transition-all font-medium"
      >
        <FaPlus className="mr-2 w-5 h-5" />
        {currentTab.buttonText}
      </button>
    </div>
  );

  const ActionMenu = ({ item }: { item: SettingsEntity }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 transition-all"
        >
          <FaEllipsisV className="w-4 h-4" />
        </button>
        {isOpen && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-[49]"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 py-2 z-[60] border border-gray-100 max-w-xs origin-top-right">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openModal(item);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
              >
                <FaEdit className="mr-3 w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  deleteItem(item);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
              >
                <FaTrash className="mr-3 w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  if (isLoading || isResolvingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        Loading settings...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        Please log in to manage your settings.
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""}
      libraries={GOOGLE_LIBRARIES}
    >
      <div className="min-h-screen bg-gray-50">
        {/* ─── FULL WIDTH CONTAINER ─── */}
        <div className="w-full py-8 px-4 sm:px-6 lg:px-10 xl:px-16">
          {/* Header */}
          <div className="mb-10">
            <p className="mt-4 text-xl text-gray-500 max-w-3xl">
              Manage shippers, carriers, agents and all your master data in one
              place
            </p>
            {userRole === "SubOwner" && (
              <div className="mt-4 inline-flex rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                You are managing the owner&apos;s shared master data.
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-10">
            <nav className="-mb-px flex flex-nowrap space-x-6 lg:space-x-10 overflow-x-auto overflow-y-hidden border-b border-gray-200 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 snap-x snap-mandatory pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    activeTab === tab.id
                      ? "whitespace-nowrap py-4 px-1 border-b-2 border-[#F96176] text-[#F96176] font-semibold text-sm flex-shrink-0 snap-center transition-all"
                      : "whitespace-nowrap py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors flex-shrink-0 snap-center"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* ─── FULL WIDTH CARD ─── */}
          <div className="bg-white shadow-xl border border-gray-200 rounded-3xl overflow-hidden w-full">
            <div className="p-6 sm:p-8 lg:p-10">
              {/* Section Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {currentTab.label}
                  </h2>
                  <p className="mt-1.5 text-base text-gray-500">
                    {isFetching
                      ? "Loading..."
                      : `${entities.length} entries on this page`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openModal()}
                  className="self-start lg:self-center w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 bg-[#F96176] hover:bg-[#F96176]/90 text-white font-medium rounded-2xl shadow-lg transition-all"
                >
                  <FaPlus className="mr-3 w-5 h-5" />
                  {currentTab.buttonText}
                </button>
              </div>

              {/* ─── FULL WIDTH TABLE ─── */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 w-full">
                {isFetching ? (
                  <div className="py-16 text-center text-gray-500">
                    Fetching {currentTab.label.toLowerCase()}...
                  </div>
                ) : entities.length > 0 ? (
                  <div>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-16">
                              Sr
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Address
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Phone
                            </th>
                            {extraColumns.map((column) => (
                              <th
                                key={column.key}
                                className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                              >
                                {column.label}
                              </th>
                            ))}
                            <th className="px-5 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {entities.map((item, index) => (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50/80 transition-colors"
                            >
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-500">
                                  {(currentPage - 1) * PAGE_SIZE + index + 1}
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  {item.companyName || item.name}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-sm text-gray-700 max-w-sm truncate">
                                  {item.address || "-"}
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">
                                  {item.phone || "-"}
                                </div>
                              </td>
                              {extraColumns.map((column) => (
                                <td
                                  key={column.key}
                                  className="px-5 py-4 whitespace-nowrap"
                                >
                                  <div className="text-sm text-gray-700">
                                    {renderExtraColumnValue(item, column.key)}
                                  </div>
                                </td>
                              ))}
                              <td className="px-5 py-4 whitespace-nowrap text-right">
                                <ActionMenu item={item} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-200 bg-white px-6 py-4">
                      <p className="text-sm text-gray-500">
                        Page {currentPage}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={!hasNextPage}
                          className="px-5 py-2.5 rounded-xl bg-[#F96176] text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F96176]/90 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── FORM MODAL (Scrollable) ─── */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden mx-4">
              {/* Modal Header — fixed at top */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingItem ? "Edit" : "New"} {currentTab.label}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 -m-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body — scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <form onSubmit={handleSubmit} className="p-6 space-y-7">
                  {formFields.map((field) => {
                    // ─── Time fields: Manual type input with AM/PM ───
                    if (field.type === "time") {
                      return (
                        <ManualTimePicker
                          key={field.name}
                          label={field.label}
                          required={field.required}
                          value={formData[field.name] || ""}
                          onChange={(val) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field.name]: val,
                            }))
                          }
                        />
                      );
                    }

                    // ─── Address fields: Autocomplete with suggestions ───
                    if (field.name === "address") {
                      return (
                        <AddressAutocompleteInput
                          key={field.name}
                          label={field.label}
                          required={field.required}
                          value={formData[field.name] || ""}
                          onChange={(val) =>
                            setFormData((prev) => ({
                              ...prev,
                              address: val,
                            }))
                          }
                          showMapButton={activeTab === "shippers"}
                          onOpenMap={openMapModal}
                        />
                      );
                    }

                    // ─── Default text/tel fields ───
                    return (
                      <div key={field.name} className="space-y-2">
                        <label
                          htmlFor={field.name}
                          className="block text-sm font-semibold text-gray-700"
                        >
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        <input
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          value={formData[field.name] || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F96176] focus:border-[#F96176] transition-colors shadow-sm"
                          placeholder={`Enter ${field.label}`}
                          required={field.required}
                        />
                      </div>
                    );
                  })}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 pb-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-[#F96176] text-white font-medium rounded-xl shadow-lg hover:bg-[#F96176]/90 transition-all disabled:opacity-60"
                    >
                      {isSubmitting
                        ? "Saving..."
                        : editingItem
                        ? "Update"
                        : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ─── MAP MODAL ─── */}
        {isMapModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <h3 className="text-2xl font-bold text-gray-900">
                  Select Location on Map
                </h3>
                <button
                  type="button"
                  onClick={closeMapModal}
                  className="p-2 -m-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 relative overflow-hidden rounded-b-3xl">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapCenter}
                  zoom={4}
                  onClick={onMapClick}
                  options={{
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                  }}
                >
                  <Autocomplete
                    onLoad={(autocomplete) => {
                      autocompleteRef.current = autocomplete;
                    }}
                    onPlaceChanged={onPlaceChanged}
                  >
                    <input
                      type="text"
                      placeholder="Search for location..."
                      className="absolute top-4 left-1/2 transform -translate-x-1/2 w-4/5 z-10 p-3 rounded-2xl shadow-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] bg-white text-lg"
                    />
                  </Autocomplete>
                  <Marker position={mapCenter} />
                </GoogleMap>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoadScript>
  );
}
