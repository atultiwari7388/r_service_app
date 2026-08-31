"use client";

import { useState, useEffect, useRef } from "react";
import { db, functions, storage } from "@/lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  Checkbox,
  IconButton,
  Collapse,
  Box,
  LinearProgress,
  Typography,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import toast from "react-hot-toast";
import { ProfileValues, VehicleTypes } from "@/types/types";
import { useAuth } from "@/contexts/AuthContexts";
// import { GlobalToastError } from "@/utils/globalErrorToast";
import { CiSearch, CiTurnL1 } from "react-icons/ci";
import { IoMdAdd } from "react-icons/io";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BiFilter, BiSearch } from "react-icons/bi";
import {
  FaPrint,
  FaDownload,
  FaFileImport,
  FaFilePdf,
  FaFileImage,
  FaExternalLinkAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { utils, writeFile } from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import Image from "next/image";
import { parseISO, format } from "date-fns";

const formatDateSafe = (dateStr?: string | null): string => {
  if (!dateStr) return "N/A";
  try {
    const trimmed = String(dateStr).trim();
    if (!trimmed) return "N/A";

    // If format is MM-DD-YYYY or MM/DD/YYYY, convert to MM-DD-YYYY
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
      return trimmed.replace(/\//g, "-");
    }

    // Try parseISO
    const isoParsed = parseISO(trimmed);
    if (!isNaN(isoParsed.getTime())) {
      return format(isoParsed, "MM-dd-yyyy");
    }

    // Try new Date
    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime())) {
      return format(fallback, "MM-dd-yyyy");
    }

    return trimmed;
  } catch {
    return dateStr ? String(dateStr) : "N/A";
  }
};

interface Vehicle {
  brand: string;
  type: string;
  value: string;
}

interface ServicePackage {
  name: string;
  type: string[];
}

interface ServiceData {
  sId: string;
  sName: string;
  vType: string;
  dValues: Vehicle[];
  subServices?: Array<{ sName: string[] }>;
  pName?: string[];
}

interface ServiceRecord {
  id: string;
  vehicleId: string;
  vehicleDetails: {
    vehicleNumber: string;
    vehicleType: string;
    companyName: string;
    engineNumber: string;
    currentMiles?: string;
    nextNotificationMiles?: Array<{
      serviceName: string;
      nextNotificationValue: number;
      subServices: string[];
    }>;
  };
  services: Array<{
    serviceId: string;
    serviceName: string;
    defaultNotificationValue: number;
    nextNotificationValue: number;
    subServices: Array<{ name: string; id: string }>;
  }>;
  date: string;
  hours: number;
  miles: number;
  totalMiles: number;
  createdAt: string;
  workshopName: string;
  invoice?: string;
  description?: string;
  invoiceAmount: string;
  imageUrl: string;
}

interface RecordData extends ServiceRecord {
  id: string;
  vehicle: string;
}

interface RedirectProps {
  path: string;
}

export default function RecordsPage() {
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const { user } = useAuth() || { user: null };
  const [effectiveUserId, setEffectiveUserId] = useState("");
  const [userRole, setUserRole] = useState("");

  // Search & Filter State
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterInvoice, setFilterInvoice] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchType, setSearchType] = useState<
    "vehicle" | "service" | "date" | "invoice" | "all"
  >("all");

  // Add Records Form State
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set()
  );
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(
    new Set()
  );

  const [selectedSubServices, setSelectedSubServices] = useState<{
    [key: string]: string[];
  }>({});
  const [serviceDefaultValues, setServiceDefaultValues] = useState<{
    [key: string]: number;
  }>({});
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [miles, setMiles] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [workshopList, setWorkshopList] = useState<string[]>([]);
  const [isOtherServiceSelected, setIsOtherServiceSelected] =
    useState<boolean>(false);
  const [otherServiceName, setOtherServiceName] = useState<string>("");
  const [invoice, setInvoice] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showAddRecords, setShowAddRecords] = useState(false);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [serviceSearchText, setServiceSearchText] = useState("");

  const [activeTab, setActiveTab] = useState<"records" | "miles">("records");

  //for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [selectedVehicleData, setSelectedVehicleData] =
    useState<VehicleTypes | null>(null);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // Add Miles Form State
  const [showAddMiles, setShowAddMiles] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const [todayMiles, setTodayMiles] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecordSaving, setIsRecordSaving] = useState(false);
  const [isMilesSaving, setIsMilesSaving] = useState(false);
  const [summaryStartDate, setSummaryStartDate] = useState<Date | null>(null);
  const [summaryEndDate, setSummaryEndDate] = useState<Date | null>(null);
  const [userData, setUserData] = useState<ProfileValues | null>(null);
  const [role, setRole] = useState("");
  const [selectedVehicleTypeFilter, setSelectedVehicleTypeFilter] = useState<
    "all" | "truck" | "trailer"
  >("all");
  const [selectedVehiclesForFilter, setSelectedVehiclesForFilter] = useState<
    Set<string>
  >(new Set());
  const [showVehicleFilter, setShowVehicleFilter] = useState(false);

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const handleRedirect = ({ path }: RedirectProps): void => {
    setShowPopup(false);
    window.location.href = path;
  };

  useEffect(() => {
    if (!user?.uid) return;

    const fetchEffectiveUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as ProfileValues;
          setUserData(userData);
          setUserRole(userData.role || "");
          setRole(userData.role || "");

          // Determine effectiveUserId based on role
          if (userData.role === "SubOwner" && userData.createdBy) {
            setEffectiveUserId(userData.createdBy);
            console.log(
              "SubOwner detected, using effectiveUserId:",
              userData.createdBy
            );
          } else {
            setEffectiveUserId(user.uid);
            console.log("Regular user, using own uid:", user.uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchEffectiveUserData();
  }, [user?.uid]);

  // const fetchVehicles = async () => {
  //   if (!effectiveUserId) return;

  //   try {
  //     const vehiclesRef = collection(db, "Users", effectiveUserId, "Vehicles");
  //     const q = query(vehiclesRef, where("active", "==", true));

  //     // Replace getDocs with onSnapshot for real-time updates
  //     const unsubscribe = onSnapshot(q, (snapshot) => {
  //       const vehiclesList = snapshot.docs.map(
  //         (doc) =>
  //           ({
  //             id: doc.id,
  //             ...doc.data(),
  //           } as VehicleTypes)
  //       );
  //       setVehicles(vehiclesList);
  //     });

  //     // Return the unsubscribe function to clean up later
  //     return unsubscribe;
  //   } catch (error) {
  //     console.error("Error fetching vehicles:", error);
  //   }
  // };

  const fetchServices = async () => {
    try {
      const servicesDoc = await getDoc(doc(db, "metadata", "serviceData"));
      if (servicesDoc.exists()) {
        const servicesData = servicesDoc.data().data || [];
        setServices(servicesData);

        // Extract unique package names
        const uniquePackages = new Set<string>();
        servicesData.forEach((service: ServiceData) => {
          if (service.pName) {
            service.pName.forEach((pkg) => uniquePackages.add(pkg));
          }
        });
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      // toast.error("Failed to fetch services");
    }
  };

  const fetchServicePackages = async () => {
    try {
      const packagesDoc = await getDoc(
        doc(db, "metadata", "nServicesPackages")
      );
      if (packagesDoc.exists()) {
        const packagesData = packagesDoc.data().data || [];
        console.log("Fetched packages:", packagesData); // Debug log
        setServicePackages(packagesData);
      } else {
        console.log("No packages document found");
      }
    } catch (error) {
      console.error("Error fetching service packages:", error);
      // toast.error("Failed to fetch service packages");
    }
  };

  const updateServiceDefaultValues = async () => {
    if (!selectedVehicle || !effectiveUserId) return;

    try {
      const vehicleRef = doc(
        db,
        "Users",
        effectiveUserId,
        "Vehicles",
        selectedVehicle
      );
      const vehicleDoc = await getDoc(vehicleRef);

      if (!vehicleDoc.exists()) return;

      const vehicleServices = vehicleDoc.data()?.services || [];
      const newDefaults: { [key: string]: number } = {};

      for (const serviceId of selectedServices) {
        // First check if vehicle has a default for this service
        const vehicleService = vehicleServices.find(
          (s: { serviceId: string }) => s.serviceId === serviceId
        );

        if (vehicleService?.defaultNotificationValue !== undefined) {
          // Use vehicle-specific default value directly (don't multiply by 1000)
          newDefaults[serviceId] = Number(
            vehicleService.defaultNotificationValue
          );
          continue;
        }

        // Fall back to metadata defaults if no vehicle-specific default
        const service = services.find((s) => s.sId === serviceId);
        const engineName = selectedVehicleData?.engineNumber?.toUpperCase();
        const dValues = service?.dValues || [];

        const matchingDValue = dValues.find(
          (dv) => dv.brand?.toString().toUpperCase() === engineName
        );

        if (matchingDValue) {
          const [baseValue] = matchingDValue.value
            .toString()
            .split(",")
            .map(Number);
          let value = baseValue;

          if (matchingDValue.type?.toLowerCase() === "reading") {
            value = baseValue * 1000;
          }

          newDefaults[serviceId] = value;
        }
      }

      setServiceDefaultValues(newDefaults);
    } catch (error) {
      console.error("Error updating service defaults:", error);
    }
  };

  const extractSubServices = (subServices: unknown): string[] => {
    if (!subServices || !Array.isArray(subServices)) return [];
    const result: string[] = [];
    subServices.forEach((item) => {
      if (typeof item === "string") {
        result.push(item);
      } else if (item && typeof item === "object") {
        const itemObj = item as Record<string, unknown>;
        if (Array.isArray(itemObj.sName)) {
          itemObj.sName.forEach((n) => result.push(String(n)));
        } else if (typeof itemObj.sName === "string") {
          result.push(itemObj.sName);
        } else if (typeof itemObj.name === "string") {
          result.push(itemObj.name);
        }
      }
    });
    return result;
  };

  const handleAddRecordVehicleSelect = (value: string) => {
    setSelectedVehicle(value);
    const vehicleData = vehicles.find((v) => v.id === value) || null;
    setSelectedVehicleData(vehicleData);

    if (vehicleData) {
      const isDryVan = vehicleData.engineName === "DRY VAN";
      const availableServices = services
        .filter((service) => {
          const matchesVehicleType =
            !vehicleData || service.vType === vehicleData.vehicleType;
          const isExcludedService =
            DRY_VAN_EXCLUDED_SERVICES.includes(service.sName);
          return matchesVehicleType && !(isDryVan && isExcludedService);
        })
        .sort((a, b) => a.sName.localeCompare(b.sName));

      const formattedServices = availableServices.map((s, idx) => {
        const subs = extractSubServices(s.subServices);
        return {
          "#": idx + 1,
          "Service Name": s.sName,
          "Sub-Services": subs.length > 0 ? subs.join(", ") : "—",
          "Type": s.vType,
        };
      });

      console.group(
        `%c🚗 SELECTED VEHICLE: ${vehicleData.vehicleNumber} | ${vehicleData.companyName} (${vehicleData.vehicleType})`,
        "color: #F96176; font-weight: bold; font-size: 14px;"
      );
      console.log(
        `📌 Total Available Services for this vehicle: ${availableServices.length}`
      );

      console.log(
        "%c📊 TABLE OF SERVICES & SUBSERVICES:",
        "color: #3B82F6; font-weight: bold;"
      );
      console.table(formattedServices);

      console.log(
        "%c📋 COMMA-SEPARATED SERVICES LIST (Copy for Excel):",
        "color: #10B981; font-weight: bold;"
      );
      console.log(availableServices.map((s) => s.sName).join(", "));

      console.log(
        "%c📦 COMPLETE SERVICES & SUBSERVICES JSON OBJECT (Copy as JSON):",
        "color: #8B5CF6; font-weight: bold;"
      );
      console.log(
        JSON.stringify(
          availableServices.map((s) => ({
            serviceName: s.sName,
            serviceId: s.sId,
            vehicleType: s.vType,
            subServices: extractSubServices(s.subServices),
          })),
          null,
          2
        )
      );
      console.groupEnd();
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const newSelectedServices = new Set(selectedServices);
    const isServiceSelected = newSelectedServices.has(serviceId);
    const service = services.find((s) => s.sId === serviceId);

    if (isServiceSelected) {
      // Deselect the service
      newSelectedServices.delete(serviceId);

      // Remove any subservices for this service
      setSelectedSubServices((prev) => {
        const newSubServices = { ...prev };
        delete newSubServices[serviceId];
        return newSubServices;
      });

      // Clear validation error for this service
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[serviceId];
        return newErrors;
      });
    } else {
      // Select the service
      newSelectedServices.add(serviceId);

      // Initialize subservices if they exist
      if (service?.subServices) {
        const subServiceNames = service.subServices
          .flatMap((sub) => sub.sName)
          .filter((name) => name.trim().length > 0);

        if (subServiceNames.length > 0) {
          setSelectedSubServices((prev) => ({
            ...prev,
            [serviceId]: [],
          }));

          // Set validation error if service requires subservices
          setValidationErrors((prev) => ({
            ...prev,
            [serviceId]: "Select at least one sub-service",
          }));
        }
      }
    }

    setSelectedServices(newSelectedServices);
    updateServiceDefaultValues();

    // Only expand if the service has subservices and we're selecting it
    if (
      service?.subServices &&
      service.subServices.length > 0 &&
      !isServiceSelected
    ) {
      setExpandedService(serviceId);
      console.log("Expanded service:", expandedService);
    }
  };

  const handleAddMiles = async () => {
    setIsMilesSaving(true);
    if (!selectedVehicle || !todayMiles || !effectiveUserId) {
      toast.error("Please select a vehicle and enter miles/hours.");
      return;
    }

    const vehicleData = vehicles.find((v) => v.id === selectedVehicle);
    if (!vehicleData) {
      toast.error("Vehicle data not found.");
      return;
    }

    try {
      // Check if current user is team member and get owner ID
      const currentUserDoc = await getDoc(doc(db, "Users", effectiveUserId));
      const isTeamMember = currentUserDoc.data()?.isTeamMember || false;
      const ownerId = isTeamMember
        ? currentUserDoc.data()?.createdBy || effectiveUserId
        : effectiveUserId;

      const vehicleRef = doc(
        db,
        "Users",
        effectiveUserId,
        "Vehicles",
        selectedVehicle
      );
      const vehicleDoc = await getDoc(vehicleRef);

      if (!vehicleDoc.exists()) {
        toast.error("Vehicle data not found.");
        return;
      }

      const currentReadingField =
        selectedVehicleType === "Truck" ? "currentMiles" : "hoursReading";
      const prevReadingField =
        selectedVehicleType === "Truck"
          ? "prevMilesValue"
          : "prevHoursReadingValue";
      const readingArrayField =
        selectedVehicleType === "Truck"
          ? "currentMilesArray"
          : "hoursReadingArray";
      const readingValueField =
        selectedVehicleType === "Truck" ? "miles" : "hours";

      const currentReading = parseInt(
        vehicleDoc.data()[currentReadingField] || "0"
      );
      const enteredValue = parseInt(todayMiles);

      // if (enteredValue < currentReading) {
      //   toast.error(
      //     `${
      //       selectedVehicleType === "Truck" ? "Miles" : "Hours"
      //     } cannot be less than the current value.`
      //   );
      //   return;
      // }

      const data = {
        updatedAt: new Date().toISOString().split("T")[0],
        [prevReadingField]: currentReading.toString(),
        [currentReadingField]: enteredValue.toString(),
        [readingValueField]: enteredValue.toString(),
        [readingArrayField]: arrayUnion({
          [readingValueField]: enteredValue,
          date: new Date().toISOString(),
        }),
      };

      // Update owner's vehicle first
      const ownerVehicleRef = doc(
        db,
        "Users",
        ownerId,
        "Vehicles",
        selectedVehicle
      );
      await updateDoc(ownerVehicleRef, data);

      // Query all team members under this owner
      const teamMembersQuery = query(
        collection(db, "Users"),
        where("createdBy", "==", ownerId),
        where("isTeamMember", "==", true)
      );

      const teamMembersSnapshot = await getDocs(teamMembersQuery);

      // Save to all team members who have this vehicle
      for (const memberDoc of teamMembersSnapshot.docs) {
        const teamMemberUid = memberDoc.id;

        // Skip current user if they're a team member (we'll update them separately)
        if (isTeamMember && teamMemberUid === effectiveUserId) continue;

        const teamMemberVehicleRef = doc(
          db,
          "Users",
          teamMemberUid,
          "Vehicles",
          selectedVehicle
        );
        const teamMemberVehicleDoc = await getDoc(teamMemberVehicleRef);

        if (teamMemberVehicleDoc.exists()) {
          await updateDoc(teamMemberVehicleRef, data);
        }
      }

      // If current user is team member, also update their own vehicle
      if (isTeamMember && effectiveUserId !== ownerId) {
        const currentUserVehicleRef = doc(
          db,
          "Users",
          effectiveUserId,
          "Vehicles",
          selectedVehicle
        );
        const currentUserVehicleDoc = await getDoc(currentUserVehicleRef);

        if (currentUserVehicleDoc.exists()) {
          await updateDoc(currentUserVehicleRef, data);
        }
      }

      // Check DataServices for the owner
      const dataServicesQuery = query(
        collection(db, "Users", ownerId, "DataServices"),
        where("vehicleId", "==", selectedVehicle)
      );
      const dataServicesSnapshot = await getDocs(dataServicesQuery);

      if (dataServicesSnapshot.empty) {
        // Call cloud function to notify about missing services
        const checkAndNotify = httpsCallable(
          functions,
          "checkAndNotifyUserForVehicleService"
        );
        await checkAndNotify({ userId: ownerId, vehicleId: selectedVehicle });
        console.log(
          "Called checkAndNotifyUserForVehicleService for",
          selectedVehicle
        );
      } else {
        // Call the cloud function to check for notifications
        const checkDataServices = httpsCallable(
          functions,
          "checkDataServicesAndNotify"
        );
        const result = await checkDataServices({
          userId: ownerId,
          vehicleId: selectedVehicle,
        });
        console.log(
          "Check Data Services Cloud function result:",
          result.data,
          "vehicle Id",
          selectedVehicle
        );
      }

      toast.success(
        `${
          selectedVehicleType === "Truck" ? "Miles" : "Hours"
        } updated successfully!`
      );
      setTodayMiles("");
      setShowAddMiles(false);
      setSelectedVehicle("");
      setSelectedVehicleType("");
    } catch (error) {
      console.error("Error updating miles/hours:", error);
      // toast.error(
      //   `Failed to save ${
      //     selectedVehicleType === "Truck" ? "miles" : "hours"
      //   }: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      // );
    } finally {
      setIsMilesSaving(false);
    }
  };

  const handleVehicleSelect = async (value: string) => {
    setSelectedVehicle(value);
    setSelectedVehicleData(null);
    setSelectedPackages(new Set());

    if (!effectiveUserId || !value) return;

    try {
      const vehicleRef = doc(db, "Users", effectiveUserId, "Vehicles", value);
      const vehicleDoc = await getDoc(vehicleRef);

      if (vehicleDoc.exists()) {
        const vehicleData = vehicleDoc.data() as VehicleTypes;
        setSelectedVehicleData(vehicleData);
        setSelectedVehicleType(vehicleData.vehicleType);
        if (vehicleData.vehicleType) {
        }
      } else {
        toast.error("Vehicle data not found.");
      }
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      toast.error("Failed to fetch vehicle data.");
    }
  };

  const normalizePackageName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "");
  };

  const handlePackageSelect = (selectedPackageNames: string[]) => {
    const newSelectedPackages = new Set(selectedPackageNames);

    // First, create a set of all services that should be selected based on packages
    const packageServices = new Set<string>();
    selectedPackageNames.forEach((pkg) => {
      services.forEach((service) => {
        if (
          service.pName &&
          service.pName.some(
            (p) => normalizePackageName(p) === normalizePackageName(pkg)
          )
        ) {
          packageServices.add(service.sId);
        }
      });
    });

    // Now determine which services to keep selected:
    // 1. All services from selected packages
    // 2. Any manually selected services that aren't part of any package
    const newSelectedServices = new Set<string>();

    // Add all services from selected packages
    packageServices.forEach((serviceId) => {
      newSelectedServices.add(serviceId);
    });

    // Add manually selected services that aren't in any package
    selectedServices.forEach((serviceId) => {
      const service = services.find((s) => s.sId === serviceId);
      // Only keep if service has no packages or isn't in any selected package
      if (!service?.pName || service.pName.length === 0) {
        newSelectedServices.add(serviceId);
      }
    });

    setSelectedServices(newSelectedServices);
    setSelectedPackages(newSelectedPackages);

    // Also clear subservices for any deselected services
    setSelectedSubServices((prev) => {
      const newSubServices = { ...prev };
      Object.keys(newSubServices).forEach((serviceId) => {
        if (!newSelectedServices.has(serviceId)) {
          delete newSubServices[serviceId];
        }
      });
      return newSubServices;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      const isPdf =
        file.type.toLowerCase().includes("pdf") ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        // Create image preview
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagePreview(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !effectiveUserId) return null;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const isPdf =
        imageFile.type.toLowerCase().includes("pdf") ||
        imageFile.name.toLowerCase().endsWith(".pdf");

      const storageRef = ref(
        storage,
        `service-records/${effectiveUserId}/${Date.now()}_${imageFile.name}`
      );
      const uploadTask = uploadBytesResumable(storageRef, imageFile, {
        contentType:
          imageFile.type || (isPdf ? "application/pdf" : "image/jpeg"),
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload error:", error);
            setIsUploading(false);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setIsUploading(false);
              resolve(downloadURL);
            } catch (error) {
              console.error("Error getting download URL:", error);
              setIsUploading(false);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error setting up upload:", error);
      setIsUploading(false);
      return null;
    }
  };

  const filteredRecords = records
    .filter((record) => {
      if (!record) return false;
      const recordDate = record.date ? new Date(record.date) : null;
      const vehNum = record.vehicleDetails?.vehicleNumber || "";
      const matchesVehicle =
        !filterVehicle ||
        vehNum.toLowerCase().includes(filterVehicle.toLowerCase());

      const matchesService =
        !filterService ||
        (record.services || []).some((s: { serviceName?: string }) =>
          (s?.serviceName || "")
            .toLowerCase()
            .includes(filterService.toLowerCase())
        );

      const matchesInvoice =
        !filterInvoice ||
        (record.invoice || "")
          .toLowerCase()
          .includes(filterInvoice.toLowerCase());

      const matchesDate =
        !startDate ||
        !endDate ||
        (recordDate !== null &&
          !isNaN(recordDate.getTime()) &&
          recordDate >= startDate &&
          recordDate <= endDate);

      switch (searchType) {
        case "vehicle":
          return matchesVehicle;
        case "service":
          return matchesService;
        case "date":
          return matchesDate;
        case "invoice":
          return matchesInvoice;
        case "all":
          return (
            matchesVehicle && matchesService && matchesDate && matchesInvoice
          );
        default:
          return true;
      }
    })
    .sort((a, b) => {
      const dateA = a?.date ? new Date(a.date).getTime() : 0;
      const dateB = b?.date ? new Date(b.date).getTime() : 0;
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });

  const handleSearchFilterOpen = () => setShowSearchFilter(true);
  const handleSearchFilterClose = () => setShowSearchFilter(false);

  useEffect(() => {
    if (!effectiveUserId) return; // Wait until effectiveUserId is set

    const recordsQuery = query(
      collection(db, "Users", effectiveUserId, "DataServices"),
      where("active", "==", true)
    );

    const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
      const recordsData: RecordData[] = snapshot.docs.map((doc) => {
        const data = (doc.data() || {}) as Partial<ServiceRecord>;
        const vehDetails = data.vehicleDetails || {
          vehicleNumber: "",
          vehicleType: "Truck",
          companyName: "",
          engineNumber: "",
        };
        return {
          id: doc.id,
          vehicleId: data.vehicleId || "",
          vehicleDetails: vehDetails,
          services: Array.isArray(data.services) ? data.services : [],
          date: data.date || "",
          hours: Number(data.hours) || 0,
          miles: Number(data.miles) || 0,
          totalMiles: Number(data.totalMiles) || 0,
          createdAt: data.createdAt || "",
          workshopName: data.workshopName || "",
          invoice: data.invoice || "",
          description: data.description || "",
          invoiceAmount: data.invoiceAmount ? String(data.invoiceAmount) : "",
          imageUrl: data.imageUrl || "",
          vehicle: vehDetails.companyName || vehDetails.vehicleNumber || "",
        } as RecordData;
      });

      setRecords(recordsData);
      console.log(
        `Fetched ${recordsData.length} records for user: ${effectiveUserId}`
      );
    });

    // Fetch vehicles using effectiveUserId
    const fetchData = async () => {
      try {
        const vehiclesRef = collection(
          db,
          "Users",
          effectiveUserId,
          "Vehicles"
        );
        const q = query(vehiclesRef, where("active", "==", true));

        const unsubscribeVehicles = onSnapshot(q, (snapshot) => {
          const vehiclesList = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as VehicleTypes)
          );
          setVehicles(vehiclesList);
          console.log(
            `Fetched ${vehiclesList.length} vehicles for user: ${effectiveUserId}`
          );
        });

        return unsubscribeVehicles;
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };

    const fetchWorkshopNames = async () => {
      try {
        const snap = await getDocs(
          collection(db, "Users", effectiveUserId, "recordWorkshopName")
        );
        const list: string[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const name = (data.workshopName || data.name || "").toString().trim();
          if (
            name &&
            !list.some((item) => item.toLowerCase() === name.toLowerCase())
          ) {
            list.push(name);
          }
        });
        list.sort((a, b) => a.localeCompare(b));
        setWorkshopList(list);
      } catch (err) {
        console.error("Error fetching workshop names:", err);
      }
    };

    fetchData();
    fetchServices();
    fetchServicePackages();
    fetchWorkshopNames();

    return () => unsubscribe();
  }, [effectiveUserId]);

  useEffect(() => {
    updateServiceDefaultValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle, selectedServices]);

  //print record lists
  const handlePrint = async () => {
    if (!printRef.current) return;

    const root = document.documentElement;
    const originalStyles = {
      background: root.style.getPropertyValue("--background"),
      foreground: root.style.getPropertyValue("--foreground"),
      primary: root.style.getPropertyValue("--primary"),
      card: root.style.getPropertyValue("--card"),
    };

    // Step 1: Use compatible color formats (hsl or rgb)
    root.style.setProperty("--background", "rgb(255, 255, 255)"); // white
    root.style.setProperty("--foreground", "rgb(26, 26, 26)"); // dark gray
    root.style.setProperty("--primary", "rgb(0, 123, 255)"); // blue
    root.style.setProperty("--card", "rgb(245, 245, 245)"); // light gray

    window.scrollTo(0, 0); // scroll to top

    // Helper function to convert color to RGB
    const convertColorToRGB = (color: string): string => {
      const tempElement: HTMLDivElement = document.createElement("div");
      tempElement.style.color = color;
      document.body.appendChild(tempElement);
      const computedColor: string = getComputedStyle(tempElement).color;
      document.body.removeChild(tempElement);
      return computedColor; // Returns the color in RGB format
    };

    // Step 2: Force computed styles into inline style to avoid oklch leak
    const elements = printRef.current.querySelectorAll<HTMLElement>("*");
    elements.forEach((el) => {
      const style = getComputedStyle(el);

      // Convert colors if they are in unsupported formats
      el.style.color = style.color.includes("oklch")
        ? convertColorToRGB(style.color)
        : style.color;
      el.style.backgroundColor = style.backgroundColor.includes("oklch")
        ? convertColorToRGB(style.backgroundColor)
        : style.backgroundColor;
      el.style.borderColor = style.borderColor.includes("oklch")
        ? convertColorToRGB(style.borderColor)
        : style.borderColor;

      // Check for other unsupported formats and replace them
      const unsupportedColorRegex = /oklch\(([^)]+)\)/g;
      if (unsupportedColorRegex.test(style.color)) {
        el.style.color = "rgb(0, 0, 0)"; // Fallback color
      }
      if (unsupportedColorRegex.test(style.backgroundColor)) {
        el.style.backgroundColor = "rgb(255, 255, 255)"; // Fallback color
      }
      if (unsupportedColorRegex.test(style.borderColor)) {
        el.style.borderColor = "rgb(0, 0, 0)"; // Fallback color
      }
    });

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY,
        backgroundColor: null,
        ignoreElements: (el) => el.classList.contains("no-print"),
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save("record_details.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      // Step 3: Restore Tailwind CSS variable values
      root.style.setProperty("--background", originalStyles.background);
      root.style.setProperty("--foreground", originalStyles.foreground);
      root.style.setProperty("--primary", originalStyles.primary);
      root.style.setProperty("--card", originalStyles.card);
    }
  };

  const downloadSingleRecord = (record: ServiceRecord) => {
    try {
      const isTrailer = record.vehicleDetails?.vehicleType === "Trailer";
      const recordRow = {
        vehicleNumber: record.vehicleDetails?.vehicleNumber || "",
        companyName: record.vehicleDetails?.companyName || "",
        vehicleType:
          record.vehicleDetails?.vehicleType ||
          (isTrailer ? "Trailer" : "Truck"),
        date: record.date || "",
        ...(isTrailer
          ? { hours: record.hours || 0 }
          : { miles: record.miles || 0 }),
        services: record.services?.map((s) => s.serviceName).join(", ") || "",
        subServices:
          record.services
            ?.flatMap((s) => (s.subServices || []).map((sub) => sub.name))
            .join(", ") || "",
        workshopName: record.workshopName || "",
        invoice: record.invoice || "",
        invoiceAmount: record.invoiceAmount || "",
        description: record.description || "",
      };

      const wb = utils.book_new();
      const ws = utils.json_to_sheet([recordRow]);
      ws["!cols"] = [
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 40 },
        { wch: 35 },
        { wch: 25 },
        { wch: 16 },
        { wch: 16 },
        { wch: 50 },
      ];
      utils.book_append_sheet(wb, ws, "Service Record");
      writeFile(
        wb,
        `${record.vehicleDetails?.vehicleNumber || "vehicle"}_record_${
          record.date || "service"
        }.xlsx`
      );
      toast.success("Record downloaded successfully!");
    } catch (error) {
      console.error("Error downloading record:", error);
      toast.error("Failed to download record");
    }
  };

  const downloadAllRecords = () => {
    try {
      if (!filteredRecords || filteredRecords.length === 0) {
        toast.error("No records available to download");
        return;
      }

      const rows = filteredRecords.map((record) => {
        const isTrailer = record.vehicleDetails?.vehicleType === "Trailer";
        return {
          vehicleNumber: record.vehicleDetails?.vehicleNumber || "",
          companyName: record.vehicleDetails?.companyName || "",
          vehicleType:
            record.vehicleDetails?.vehicleType ||
            (isTrailer ? "Trailer" : "Truck"),
          date: record.date || "",
          miles: isTrailer ? "" : record.miles || 0,
          hours: isTrailer ? record.hours || 0 : "",
          services: record.services?.map((s) => s.serviceName).join(", ") || "",
          subServices:
            record.services
              ?.flatMap((s) => (s.subServices || []).map((sub) => sub.name))
              .join(", ") || "",
          workshopName: record.workshopName || "",
          invoice: record.invoice || "",
          invoiceAmount: record.invoiceAmount || "",
          description: record.description || "",
        };
      });

      const wb = utils.book_new();
      const ws = utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 40 },
        { wch: 35 },
        { wch: 25 },
        { wch: 16 },
        { wch: 16 },
        { wch: 50 },
      ];
      utils.book_append_sheet(wb, ws, "All Records");
      writeFile(
        wb,
        `all_service_records_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      );
      toast.success(
        `Downloaded ${filteredRecords.length} record(s) successfully!`
      );
    } catch (error) {
      console.error("Error downloading records:", error);
      toast.error("Failed to download records");
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    const hasPredefinedServices = selectedServices.size > 0;
    const hasOtherService =
      isOtherServiceSelected && otherServiceName.trim() !== "";

    // Check if at least one service is selected
    if (!hasPredefinedServices && !hasOtherService) {
      errors.general = "Please select at least one service";
    }

    if (isOtherServiceSelected && !otherServiceName.trim()) {
      errors.otherService = "Please specify the other service name";
    }

    // Check if services with subservices have at least one subservice selected
    selectedServices.forEach((serviceId) => {
      const service = services.find((s) => s.sId === serviceId);
      if (service?.subServices && service.subServices.length > 0) {
        const subServices = selectedSubServices[serviceId] || [];
        if (subServices.length === 0) {
          errors[serviceId] = "Please select at least one sub-service";
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRecords = async () => {
    try {
      if (!validateForm()) {
        toast.error(`Select at least one service and required sub-services`);
        return;
      }

      setIsRecordSaving(true);

      const hasPredefinedServices = selectedServices.size > 0;
      const hasOtherService =
        isOtherServiceSelected && otherServiceName.trim() !== "";

      // Validate inputs
      if (
        !effectiveUserId ||
        !selectedVehicle ||
        (!hasPredefinedServices && !hasOtherService)
      ) {
        toast.error("Please select vehicle and at least one service");
        return;
      }

      const vehicleData = vehicles.find((v) => v.id === selectedVehicle);
      if (!vehicleData) {
        toast.error("Vehicle data not found");
        return;
      }

      // Upload image/pdf if exists
      let imageUrl = existingImageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          toast.error("Failed to upload document");
          return;
        }
      }

      // Get numeric values
      const currentMiles = Number(miles);
      const currentHours = Number(hours) || 0;

      // Get current vehicle services
      const vehicleRef = doc(
        db,
        "Users",
        effectiveUserId,
        "Vehicles",
        selectedVehicle
      );
      const vehicleDoc = await getDoc(vehicleRef);
      const currentVehicleServices = vehicleDoc.exists()
        ? vehicleDoc.data()?.services || []
        : [];

      // Prepare services data
      const servicesData = [];
      const notificationData = [];
      const updatedVehicleServices = [...currentVehicleServices];

      // Process each selected predefined service
      for (const serviceId of selectedServices) {
        const service = services.find((s) => s.sId === serviceId);
        if (!service) continue;

        // Find existing service or initialize new one
        const existingServiceIndex = updatedVehicleServices.findIndex(
          (s) => s.serviceId === serviceId
        );

        // Determine service type and default value
        let defaultValue = serviceDefaultValues[serviceId] || 0;
        let type = "reading";

        if (existingServiceIndex >= 0) {
          type = updatedVehicleServices[existingServiceIndex].type || "reading";
          defaultValue =
            updatedVehicleServices[existingServiceIndex]
              .defaultNotificationValue || defaultValue;
        } else {
          const engineName = vehicleData.engineNumber?.toString().toUpperCase();
          const matchingDValue = service.dValues?.find(
            (dv) => dv.brand?.toString().toUpperCase() === engineName
          );
          type = (matchingDValue?.type || "reading").toLowerCase();
        }

        // Calculate next notification
        let nextNotificationValue = 0;
        let formattedDate = "";
        let numericValue = 0;

        if (defaultValue > 0) {
          if (type === "reading") {
            nextNotificationValue = currentMiles + defaultValue;
            numericValue = nextNotificationValue;
          } else if (type === "day") {
            const baseDate = date ? new Date(date) : new Date();
            const nextDate = new Date(baseDate);
            nextDate.setDate(baseDate.getDate() + Number(defaultValue));
            formattedDate = formatDateToDDMMYYYY(nextDate);
            numericValue = nextDate.getTime();
            nextNotificationValue = numericValue;
          } else if (type === "hours") {
            nextNotificationValue = currentHours + defaultValue;
            numericValue = nextNotificationValue;
          }
        }

        // Prepare service data
        const serviceData = {
          serviceId,
          serviceName: service.sName || "",
          type,
          defaultNotificationValue: defaultValue,
          nextNotificationValue:
            type === "day" ? formattedDate : nextNotificationValue,
          subServices: (selectedSubServices[serviceId] || []).map(
            (subService, index) => ({
              name: subService,
              id: `${serviceId}_${subService.replace(/\s+/g, "_")}_${index}`,
            })
          ),
        };
        servicesData.push(serviceData);

        // Prepare notification data
        notificationData.push({
          serviceName: service.sName || "",
          type,
          nextNotificationValue:
            type === "day" ? formattedDate : nextNotificationValue,
          subServices: selectedSubServices[serviceId] || [],
        });

        // Update vehicle services
        if (existingServiceIndex >= 0) {
          updatedVehicleServices[existingServiceIndex] = {
            ...updatedVehicleServices[existingServiceIndex],
            nextNotificationValue:
              type === "day" ? formattedDate : nextNotificationValue,
          };
        } else {
          updatedVehicleServices.push({
            ...serviceData,
            nextNotificationValue:
              type === "day" ? formattedDate : nextNotificationValue,
          });
        }
      }

      // Process "Other Service" if selected and specified
      if (hasOtherService) {
        const customName = otherServiceName.trim();
        const customId = `custom_${customName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")}`;
        const otherServiceData = {
          serviceId: customId,
          serviceName: customName,
          type: "reading",
          defaultNotificationValue: 0,
          nextNotificationValue: 0,
          subServices: [],
        };
        servicesData.push(otherServiceData);
        notificationData.push({
          serviceName: customName,
          type: "reading",
          nextNotificationValue: 0,
          subServices: [],
        });
      }

      // Prepare record data
      const baseDate = date ? new Date(date) : new Date();
      const formattedDate = baseDate.toISOString().split("T")[0];

      const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicle);
      const myCompany =
        selectedVehicleObj?.myCompany || vehicleData?.myCompany || "";
      const mycomId =
        selectedVehicleObj?.mycomId || vehicleData?.mycomId || "";

      const recordData = {
        userId: effectiveUserId,
        vehicleId: selectedVehicle,
        imageUrl,
        myCompany: myCompany,
        mycomId: mycomId,
        vehicleDetails: {
          ...vehicleData,
          myCompany: myCompany,
          mycomId: mycomId,
          currentMiles: currentMiles.toString(),
          nextNotificationMiles: notificationData,
        },
        services: servicesData,
        currentMilesArray: [{ miles: currentMiles, date: formattedDate }],
        miles: vehicleData.vehicleType === "Truck" ? currentMiles : 0,
        hours: vehicleData.vehicleType === "Trailer" ? currentHours : 0,
        totalMiles: currentMiles,
        date: formattedDate,
        workshopName,
        invoice,
        invoiceAmount,
        description,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        active: true,
        addedFrom: "Web",
      };

      const batch = writeBatch(db);

      // Determine owner and if current user is team member
      const currentUserDoc = await getDoc(doc(db, "Users", effectiveUserId));
      const isTeamMember = currentUserDoc.data()?.isTeamMember;
      const ownerId = isTeamMember
        ? currentUserDoc.data()?.createdBy
        : effectiveUserId;

      // 1. Handle record in owner's collection
      const recordId =
        isEditing && editingRecordId
          ? editingRecordId
          : doc(collection(db, "temp")).id;
      const ownerRecordRef = doc(
        db,
        "Users",
        ownerId,
        "DataServices",
        recordId
      );

      if (isEditing && editingRecordId) {
        batch.update(ownerRecordRef, recordData);
      } else {
        batch.set(ownerRecordRef, recordData);
      }

      // Save Workshop Name to recordWorkshopName collection if new
      const trimmedWorkshop = (workshopName || "").trim();
      if (trimmedWorkshop) {
        try {
          const alreadyExists = workshopList.some(
            (w) => w.toLowerCase() === trimmedWorkshop.toLowerCase()
          );
          if (!alreadyExists) {
            const wsColRef = collection(
              db,
              "Users",
              effectiveUserId,
              "recordWorkshopName"
            );
            await addDoc(wsColRef, {
              workshopName: trimmedWorkshop,
              createdAt: serverTimestamp(),
            });
            setWorkshopList((prev) => {
              const updated = [...prev, trimmedWorkshop];
              updated.sort((a, b) => a.localeCompare(b));
              return updated;
            });
          }
        } catch (wsError) {
          console.error("Error adding workshop name:", wsError);
        }
      }

      // 2. Handle global record
      const globalRecordRef = doc(db, "DataServicesRecords", recordId);
      batch.set(globalRecordRef, { ...recordData, id: recordId });

      // 3. Update owner's vehicle
      const ownerVehicleRef = doc(
        db,
        "Users",
        ownerId,
        "Vehicles",
        selectedVehicle
      );
      batch.update(ownerVehicleRef, {
        services: updatedVehicleServices,
        currentMiles: currentMiles.toString(),
        currentMilesArray: arrayUnion({
          miles: currentMiles,
          date: formattedDate,
        }),
        nextNotificationMiles: notificationData,
      });

      // 4. Handle all team members
      const teamMembersQuery = query(
        collection(db, "Users"),
        where("createdBy", "==", ownerId),
        where("isTeamMember", "==", true)
      );
      const teamMembersSnapshot = await getDocs(teamMembersQuery);

      for (const memberDoc of teamMembersSnapshot.docs) {
        const memberId = memberDoc.id;
        if (memberId === ownerId) continue;

        const memberVehicleRef = doc(
          db,
          "Users",
          memberId,
          "Vehicles",
          selectedVehicle
        );
        const memberVehicleSnap = await getDoc(memberVehicleRef);

        if (memberVehicleSnap.exists()) {
          // Update vehicle
          batch.update(memberVehicleRef, {
            services: updatedVehicleServices,
            currentMiles: currentMiles.toString(),
            currentMilesArray: arrayUnion({
              miles: currentMiles,
              date: formattedDate,
            }),
            nextNotificationMiles: notificationData,
          });

          // Update or create record
          const memberRecordRef = doc(
            db,
            "Users",
            memberId,
            "DataServices",
            recordId
          );
          batch.set(memberRecordRef, recordData);
        }
      }

      // 5. If current user is team member, ensure their record exists
      if (isTeamMember && effectiveUserId !== ownerId) {
        const currentUserRecordRef = doc(
          db,
          "Users",
          effectiveUserId,
          "DataServices",
          recordId
        );
        batch.set(currentUserRecordRef, recordData);
      }

      await batch.commit();
      toast.success(
        isEditing
          ? "Record updated successfully!"
          : "Record added successfully!"
      );
      resetForm();
    } catch (error) {
      console.error("Error saving record:", error);
      toast.error(
        `Failed to save record: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsRecordSaving(false);
    }
  };

  const handleEditRecord = (record: ServiceRecord) => {
    if (!record) return;
    setIsEditing(true);
    setEditingRecordId(record.id);

    // Set form values from record
    setSelectedVehicle(record.vehicleId || "");
    setSelectedVehicleData(
      vehicles.find((v) => v.id === record.vehicleId) || null
    );

    // Initialize service defaults
    const newServiceDefaultValues: Record<string, number> = {};
    const recordServices = Array.isArray(record.services) ? record.services : [];
    recordServices.forEach((service) => {
      if (service && service.serviceId) {
        newServiceDefaultValues[service.serviceId] =
          service.defaultNotificationValue || 0;
      }
    });
    setServiceDefaultValues(newServiceDefaultValues);

    // Set selected services and subservices
    const predefinedIds = new Set<string>();
    let customServiceFound = false;
    let customServiceName = "";

    recordServices.forEach((s) => {
      if (!s) return;
      if (s.serviceId && s.serviceId.startsWith("custom_")) {
        customServiceFound = true;
        customServiceName = s.serviceName || "";
      } else if (s.serviceId) {
        predefinedIds.add(s.serviceId);
      }
    });

    setSelectedServices(predefinedIds);
    setIsOtherServiceSelected(customServiceFound);
    setOtherServiceName(customServiceName);

    const subServices: Record<string, string[]> = {};
    recordServices.forEach((service) => {
      if (service && service.serviceId) {
        subServices[service.serviceId] = Array.isArray(service.subServices)
          ? service.subServices.map((ss) => ss.name)
          : [];
      }
    });
    setSelectedSubServices(subServices);

    // Set other fields
    setMiles((record.miles || 0).toString());
    setHours((record.hours || 0).toString());
    const dateStr = record.date || "";
    setDate(dateStr.includes("T") ? dateStr.split("T")[0] : dateStr);
    setWorkshopName(record.workshopName || "");
    setInvoice(record.invoice || "");
    setInvoiceAmount(record.invoiceAmount || "");
    setDescription(record.description || "");

    setExistingImageUrl(record.imageUrl || null);
    setImagePreview(record.imageUrl || null);

    setShowAddRecords(true);
  };

  const formatDateToDDMMYYYY = (date: Date | string): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  };

  const handleSubserviceToggle = (serviceId: string, subName: string) => {
    setSelectedSubServices((prev) => {
      const currentSubs = prev[serviceId] || [];
      const service = services.find((s) => s.sId === serviceId);

      // For "Steer Tires" and "DPF Clean", allow only one selection
      if (
        service?.sName === "Steer Tires" ||
        service?.sName === "DPF Percentage"
      ) {
        // If already selected, deselect it, otherwise select only this one
        const newSubs = currentSubs.includes(subName) ? [] : [subName];

        // Clear validation error if subservice is selected
        if (newSubs.length > 0) {
          setValidationErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[serviceId];
            return newErrors;
          });
        } else {
          setValidationErrors((prev) => ({
            ...prev,
            [serviceId]: "Please select at least one sub-service",
          }));
        }

        return {
          ...prev,
          [serviceId]: newSubs,
        };
      } else {
        // For other services, allow multiple selections
        const newSubs = currentSubs.includes(subName)
          ? currentSubs.filter((name) => name !== subName)
          : [...currentSubs, subName];

        // Clear validation error if at least one subservice is selected
        if (newSubs.length > 0) {
          setValidationErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[serviceId];
            return newErrors;
          });
        } else {
          setValidationErrors((prev) => ({
            ...prev,
            [serviceId]: "Please select at least one sub-service",
          }));
        }

        return { ...prev, [serviceId]: newSubs };
      }
    });

    // Show toast notification for selection
    const service = services.find((s) => s.sId === serviceId);
    const isSelected =
      selectedSubServices[serviceId]?.includes(subName) ?? false;

    if (!isSelected) {
      toast.success(`${subName} selected for ${service?.sName}`, {
        position: "top-right",
        duration: 2000,
      });
    }
  };

  const calculateTotals = () => {
    let totalInvoiceAmount = 0;
    let truckTotal = 0;
    let trailerTotal = 0;
    let otherTotal = 0;

    filteredRecords.forEach((record) => {
      // Get the record date (already in YYYY-MM-DD format)
      const recordDateStr = record.date;

      // Convert filter dates to YYYY-MM-DD strings
      const startDateStr = summaryStartDate
        ? formatDateToYYYYMMDD(summaryStartDate)
        : null;

      const endDateStr = summaryEndDate
        ? formatDateToYYYYMMDD(summaryEndDate)
        : null;

      // Check if record is within date range using string comparison
      const isWithinDateRange =
        (!startDateStr || recordDateStr >= startDateStr) &&
        (!endDateStr || recordDateStr <= endDateStr);

      // Check vehicle filters
      const vehicleType = record.vehicleDetails.vehicleType;
      const vehicleId = record.vehicleId;

      const passesVehicleFilter =
        selectedVehicleTypeFilter === "all" ||
        (selectedVehicleTypeFilter === "truck" && vehicleType === "Truck") ||
        (selectedVehicleTypeFilter === "trailer" && vehicleType === "Trailer");

      const passesSpecificVehicleFilter =
        selectedVehiclesForFilter.size === 0 ||
        selectedVehiclesForFilter.has(vehicleId);

      if (
        isWithinDateRange &&
        passesVehicleFilter &&
        passesSpecificVehicleFilter
      ) {
        const amount = parseFloat(record.invoiceAmount) || 0;
        totalInvoiceAmount += amount;

        if (vehicleType === "Truck") {
          truckTotal += amount;
        } else if (vehicleType === "Trailer") {
          trailerTotal += amount;
        } else {
          otherTotal += amount;
        }
      }
    });

    return {
      totalInvoiceAmount,
      truckTotal,
      trailerTotal,
      otherTotal,
    };
  };

  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const { totalInvoiceAmount, truckTotal, trailerTotal, otherTotal } =
    calculateTotals();

  const resetForm = () => {
    setSelectedVehicle("");
    setSelectedVehicleData(null);
    setSelectedServices(new Set());
    setSelectedPackages(new Set());
    setSelectedSubServices({});
    setServiceDefaultValues({});
    setMiles("");
    setHours("");
    setDate("");
    setWorkshopName("");
    setInvoice("");
    setInvoiceAmount("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setIsOtherServiceSelected(false);
    setOtherServiceName("");
    setValidationErrors({});
    setServiceSearchText("");
    setIsEditing(false);
    setEditingRecordId(null);
    setShowAddRecords(false);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <h1 className="text-xl font-semibold text-gray-700">
          Please Login to access the page..
        </h1>
      </div>
    );
  }

  const DRY_VAN_EXCLUDED_SERVICES = [
    "Alternator",
    "Battery Change",
    "EGR Cooler Clean",
    "Oil Change/Service",
    "Starter",
    "Water /Coolant Pump",
  ];

  const MilesTab = () => {
    return (
      <div className="w-full bg-white p-4 rounded-lg shadow">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Current Miles/Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.vehicleNumber}</TableCell>
                  <TableCell>{vehicle.companyName}</TableCell>
                  <TableCell>{vehicle.vehicleType}</TableCell>
                  <TableCell>
                    {vehicle.vehicleType === "Truck"
                      ? vehicle.currentMiles || "0"
                      : vehicle.hoursReading || "0"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  };

  return userData?.isView ? (
    <div className="flex flex-col justify-center items-center p-6 bg-gray-100 gap-8">
      {/* Button Container */}
      <div className="flex justify-center gap-4 mb-6">
        {/** Add Record */}

        <button
          onClick={() =>
            userData?.isAdd
              ? setShowAddRecords(true)
              : toast.error("You don't have permission to add records.")
          }
          className="bg-[#F96176] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#F96176]"
        >
          <IoMdAdd /> Add Record
        </button>

        {/** Add mile */}

        <button
          onClick={() =>
            userData?.isView || userData?.isAdd
              ? setShowAddMiles(true)
              : toast.error("You don't have permission to add miles/hours.")
          }
          className="bg-[#58BB87] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#58BB87]"
        >
          <IoMdAdd /> Add Miles/Hours
        </button>

        {/** Search Functionality */}

        <button
          onClick={() => handleSearchFilterOpen()}
          className="bg-[#58BB87] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#58BB87]"
        >
          Search <BiFilter />
        </button>

        {/** Print pdf */}
        <button
          onClick={handlePrint}
          className="bg-[#F96176] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#F96176]"
        >
          <FaPrint /> Print
        </button>

        {/** Import Record Excel */}
        <Link href="/import-record" passHref>
          <button className="bg-[#3B82F6] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#2563EB]">
            <FaFileImport /> Import Excel
          </button>
        </Link>

        {/** Download All Records */}
        <button
          onClick={downloadAllRecords}
          className="bg-[#10B981] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#059669]"
        >
          <FaDownload /> Download All
        </button>
      </div>

      {userRole === "SubOwner" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            Viewing records as Co-Owner (Owner&apos;s data)
          </p>
        </div>
      )}

      {/* Summary Box */}
      {(role === "Owner" || role === "Accountant" || role === "SubOwner") && (
        <div className="w-full bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Invoice Summary</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowVehicleFilter(!showVehicleFilter)}
                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
              >
                {selectedVehicleTypeFilter === "all"
                  ? "All Vehicles"
                  : selectedVehicleTypeFilter === "truck"
                  ? "Trucks"
                  : "Trailers"}
              </button>

              <DatePicker
                selected={summaryStartDate}
                onChange={(date) => setSummaryStartDate(date)}
                selectsStart
                startDate={summaryStartDate}
                endDate={summaryEndDate}
                placeholderText="Start Date"
                className="p-2 border rounded w-40"
              />

              <DatePicker
                selected={summaryEndDate}
                onChange={(date) => setSummaryEndDate(date)}
                selectsEnd
                startDate={summaryStartDate}
                endDate={summaryEndDate}
                minDate={summaryStartDate ?? undefined}
                placeholderText="End Date"
                className="p-2 border rounded w-40"
              />
              <button
                onClick={() => {
                  setSummaryStartDate(null);
                  setSummaryEndDate(null);
                  setSelectedVehicleTypeFilter("all");
                  setSelectedVehiclesForFilter(new Set());
                }}
                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Vehicle Filter Dropdown */}
          {showVehicleFilter && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setSelectedVehicleTypeFilter("all")}
                  className={`px-3 py-1 rounded ${
                    selectedVehicleTypeFilter === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedVehicleTypeFilter("truck")}
                  className={`px-3 py-1 rounded ${
                    selectedVehicleTypeFilter === "truck"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Trucks
                </button>
                <button
                  onClick={() => setSelectedVehicleTypeFilter("trailer")}
                  className={`px-3 py-1 rounded ${
                    selectedVehicleTypeFilter === "trailer"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Trailers
                </button>
              </div>

              {selectedVehicleTypeFilter !== "all" && (
                <div className="max-h-60 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">
                    Select specific vehicles:
                  </p>
                  {/* Fixed height scrollable container */}
                  <div className="max-h-[300px] overflow-y-auto border rounded-lg p-2">
                    {vehicles
                      .filter((v) =>
                        selectedVehicleTypeFilter === "truck"
                          ? v.vehicleType === "Truck"
                          : v.vehicleType === "Trailer"
                      )
                      .map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className="flex items-center mb-2"
                        >
                          <Checkbox
                            checked={selectedVehiclesForFilter.has(vehicle.id)}
                            onChange={() => {
                              const newSelected = new Set(
                                selectedVehiclesForFilter
                              );
                              if (newSelected.has(vehicle.id)) {
                                newSelected.delete(vehicle.id);
                              } else {
                                newSelected.add(vehicle.id);
                              }
                              setSelectedVehiclesForFilter(newSelected);
                            }}
                          />
                          <span>
                            {vehicle.vehicleNumber} ({vehicle.companyName})
                            {/* {vehicle.myCompany ? ` (${vehicle.myCompany})` : ""} */}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">
                Total Invoice Amount
              </h3>
              <p className="text-2xl font-bold">
                ${totalInvoiceAmount.toFixed(0)}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">
                Truck Services
              </h3>
              <p className="text-2xl font-bold">${truckTotal.toFixed(0)}</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">
                Trailer Services
              </h3>
              <p className="text-2xl font-bold">${trailerTotal.toFixed(0)}</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">
                Other Services
              </h3>
              <p className="text-2xl font-bold">${otherTotal.toFixed(0)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setActiveTab("records")}
          className={`px-4 py-2 rounded ${
            activeTab === "records" ? "bg-[#F96176] text-white" : "bg-gray-200"
          }`}
        >
          Records
        </button>
        <button
          onClick={() => setActiveTab("miles")}
          className={`px-4 py-2 rounded ${
            activeTab === "miles" ? "bg-[#F96176] text-white" : "bg-gray-200"
          }`}
        >
          Miles/Hours
        </button>
      </div>

      {/* Search & Filter Dialog */}
      <Dialog
        fullWidth
        maxWidth="sm"
        open={showSearchFilter}
        onClose={handleSearchFilterClose}
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <span>Search & Filter</span>
            <IconButton onClick={handleSearchFilterClose}>
              <CiTurnL1 />
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent>
          <div className="grid gap-4 mt-4">
            <FormControl fullWidth>
              <InputLabel>Search Type</InputLabel>
              <Select
                value={searchType}
                onChange={(e) =>
                  setSearchType(
                    e.target.value as
                      | "vehicle"
                      | "service"
                      | "date"
                      | "invoice"
                      | "all"
                  )
                }
                label="Search Type"
              >
                <MenuItem value="all">Search All</MenuItem>
                <MenuItem value="vehicle">Search by Vehicle</MenuItem>
                <MenuItem value="service">Search by Service</MenuItem>
                <MenuItem value="date">Search by Date</MenuItem>
                <MenuItem value="invoice">Search by Invoice</MenuItem>
              </Select>
            </FormControl>

            {(searchType === "vehicle" || searchType === "all") && (
              <FormControl fullWidth>
                <InputLabel>Vehicle</InputLabel>
                <Select
                  value={filterVehicle}
                  onChange={(e) => setFilterVehicle(e.target.value as string)}
                  label="Vehicle"
                >
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.vehicleNumber}>
                      {vehicle.vehicleNumber} ({vehicle.companyName})
                      {/* {vehicle.myCompany ? ` (${vehicle.myCompany})` : ""} */}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {(searchType === "service" || searchType === "all") && (
              <FormControl fullWidth>
                <InputLabel>Service</InputLabel>
                <Select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value as string)}
                  label="Service"
                >
                  {services.map((service) => (
                    <MenuItem key={service.sId} value={service.sName}>
                      {service.sName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {(searchType === "date" || searchType === "all") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-2">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}

            {(searchType === "invoice" || searchType === "all") && (
              <TextField
                fullWidth
                label="Invoice Number"
                value={filterInvoice}
                onChange={(e) => setFilterInvoice(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BiSearch />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </div>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setFilterVehicle("");
              setFilterService("");
              setFilterInvoice("");
              setStartDate(null);
              setEndDate(null);
              setSearchType("all");
            }}
          >
            Reset
          </Button>
          <Button onClick={handleSearchFilterClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Miles Dialog Box */}
      <Dialog
        open={showAddMiles}
        onClose={() => setShowAddMiles(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-[#58BB87] text-white">
          Add Miles/Hours
        </DialogTitle>
        <DialogContent>
          <Card className="mt-4 shadow-lg rounded-lg">
            <CardContent>
              <div className="mb-4">
                <FormControl fullWidth className="mb-4">
                  <InputLabel>Select Vehicle</InputLabel>

                  <Select
                    value={selectedVehicle}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="rounded-lg"
                    sx={{ minHeight: "56px" }}
                    label="Select Vehicle"
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNumber} ({vehicle.companyName})
                        {/* {vehicle.myCompany ? ` (${vehicle.myCompany})` : ""} */}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {selectedVehicleType && (
                <TextField
                  fullWidth
                  label={
                    selectedVehicleType === "Truck"
                      ? "Miles/Hours"
                      : "Hours/Miles"
                  }
                  type="number"
                  value={todayMiles}
                  onChange={(e) => setTodayMiles(e.target.value)}
                  className="mb-4 rounded-lg"
                />
              )}
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAddMiles(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>

          {isMilesSaving ? (
            <CircularProgress />
          ) : (
            <Button
              onClick={handleAddMiles}
              variant="contained"
              color="primary"
              className="bg-[#58BB87] hover:bg-[#58BB87] transition duration-300"
            >
              {isMilesSaving
                ? "Saving..."
                : selectedVehicleType === "Truck"
                ? "Save Miles"
                : "Save Hours"}
              {/* Save {selectedVehicleType === "Truck" ? "Miles" : "Hours"} */}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog
        open={showAddRecords}
        // onClose={() => setShowAddRecords(false)}
        onClose={() => {
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-[#F96176] text-white">
          {/* Add Service Record */}
          {isEditing ? "Edit Service Record" : "Add Service Record"}
        </DialogTitle>
        <DialogContent>
          <Card className="mt-4 shadow-lg rounded-lg">
            <CardContent>
              <div className="mb-4">
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="select-vehicle-label">
                    Select Vehicle
                  </InputLabel>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Select
                      labelId="select-vehicle-label"
                      value={selectedVehicle}
                      onChange={(e) => {
                        handleAddRecordVehicleSelect(e.target.value);
                      }}
                      className="rounded-lg"
                      sx={{ minHeight: "56px", flex: 1, marginRight: "8px" }}
                      label="Select Vehicle"
                    >
                      {/* Sort vehicles alphabetically by vehicleNumber before mapping */}
                      {vehicles
                        .sort((a, b) =>
                          a.vehicleNumber.localeCompare(b.vehicleNumber)
                        )
                        .map((vehicle) => (
                          <MenuItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.vehicleNumber} ({vehicle.companyName})
                            {/* {vehicle.myCompany ? ` (${vehicle.myCompany})` : ""} */}
                          </MenuItem>
                        ))}
                    </Select>

                    {/* Circular + Add Button */}
                    <button
                      className="btn bg-[#F96176] text-white text-2xl text-center rounded-md hover:bg-[#eb929e] tooltip mt-1"
                      title="Add Vehicle"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPopup(true);
                      }}
                    >
                      +
                    </button>

                    {/* Popup Dialog for Add/Import Vehicle */}
                    <Dialog
                      open={showPopup}
                      onClose={() => setShowPopup(false)}
                      maxWidth="xs"
                      PaperProps={{
                        sx: {
                          borderRadius: 3,
                          p: 2,
                          backgroundColor: "#fefefe",
                          boxShadow: 24,
                        },
                      }}
                    >
                      <DialogTitle
                        sx={{
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: 20,
                          mb: 1,
                        }}
                      >
                        Select Option
                      </DialogTitle>

                      <DialogContent
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Box
                          onClick={() =>
                            handleRedirect({ path: "/add-vehicle" })
                          }
                          sx={{
                            backgroundColor: "#F96176",
                            color: "#fff",
                            borderRadius: 2,
                            textAlign: "center",
                            py: 1.5,
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "16px",
                            transition: "all 0.3s",
                            "&:hover": {
                              backgroundColor: "#e14a60",
                            },
                          }}
                        >
                          Add Vehicle
                        </Box>

                        <Box
                          onClick={() =>
                            handleRedirect({ path: "/import-vehicle" })
                          }
                          sx={{
                            backgroundColor: "#58BB87",
                            color: "#fff",
                            borderRadius: 2,
                            textAlign: "center",
                            py: 1.5,
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "16px",
                            transition: "all 0.3s",
                            "&:hover": {
                              backgroundColor: "#4aa975",
                            },
                          }}
                        >
                          Import Vehicle
                        </Box>
                      </DialogContent>
                    </Dialog>
                  </Box>
                </FormControl>
              </div>
              {/** Select packages */}

              {selectedVehicleData?.vehicleType == "Truck" && (
                <div className="mb-4">
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="select-packages-label">
                      Select Packages
                    </InputLabel>
                    <Select
                      labelId="select-packages-label"
                      multiple
                      value={Array.from(selectedPackages)}
                      onChange={(e) => {
                        const newPackages = e.target.value as string[];
                        handlePackageSelect(newPackages);
                      }}
                      renderValue={(selected) => selected.join(", ")}
                      label="Select Packages"
                      sx={{ minHeight: "56px" }}
                    >
                      {servicePackages
                        .filter((pkg) =>
                          pkg.type.some(
                            (t) =>
                              t.toLowerCase() ===
                              selectedVehicleData?.vehicleType?.toLowerCase()
                          )
                        )
                        .map((pkg) => (
                          <MenuItem key={pkg.name} value={pkg.name}>
                            <Checkbox
                              checked={selectedPackages.has(pkg.name)}
                            />
                            {pkg.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </div>
              )}
              <div className="mb-4">
                <TextField
                  fullWidth
                  label="Search Services"
                  value={serviceSearchText}
                  onChange={(e) => setServiceSearchText(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <CiSearch />
                      </InputAdornment>
                    ),
                  }}
                  className="rounded-lg"
                />
              </div>
              {/** Select Services */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {services
                  .filter((service) => {
                    const matchesSearch = service.sName
                      .toLowerCase()
                      .includes(serviceSearchText.toLowerCase());

                    const matchesVehicleType =
                      !selectedVehicleData ||
                      service.vType === selectedVehicleData.vehicleType;

                    // Exclude specific services for DRY VAN
                    const isDryVan =
                      selectedVehicleData?.engineName === "DRY VAN";
                    const isExcludedService =
                      DRY_VAN_EXCLUDED_SERVICES.includes(service.sName);

                    return (
                      matchesSearch &&
                      matchesVehicleType &&
                      !(isDryVan && isExcludedService)
                    );
                  })
                  .sort((a, b) => a.sName.localeCompare(b.sName))
                  .map((service) => (
                    <div key={service.sId} className="w-full">
                      <Chip
                        label={service.sName}
                        onClick={(e) => {
                          e.preventDefault();
                          handleServiceSelect(service.sId);
                        }}
                        sx={{
                          backgroundColor: selectedServices.has(service.sId)
                            ? "#F96176"
                            : "default",
                          color: selectedServices.has(service.sId)
                            ? "white"
                            : "inherit",
                          "&:hover": {
                            backgroundColor: selectedServices.has(service.sId)
                              ? "#F96176"
                              : "#FFCDD2",
                          },
                          border: validationErrors[service.sId]
                            ? "2px solid red"
                            : "none",
                        }}
                        variant={
                          selectedServices.has(service.sId)
                            ? "filled"
                            : "outlined"
                        }
                        className="w-full transition duration-300 hover:shadow-lg"
                      />

                      {/* Show validation error if exists */}
                      {validationErrors[service.sId] && (
                        <div className="text-red-500 text-xs mt-1 ml-2">
                          {validationErrors[service.sId]}
                        </div>
                      )}

                      <Collapse
                        in={
                          selectedServices.has(service.sId) &&
                          service.subServices &&
                          service.subServices.length > 0
                        }
                        timeout="auto"
                        unmountOnExit
                      >
                        {service.subServices && (
                          <div className="ml-1 mt-2 w-3/4">
                            {service.subServices.map((subService) =>
                              subService.sName.map((name, idx) => {
                                const isSelected =
                                  selectedSubServices[service.sId]?.includes(
                                    name
                                  );
                                return (
                                  <div
                                    key={`${service.sId}-${name}-${idx}`}
                                    className={`flex items-center rounded-full px-1 py-1 m-1 transition duration-300 
                ${
                  isSelected
                    ? "bg-[#58BB87] text-gray-800"
                    : "bg-gray-200 text-gray-800"
                }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSubserviceToggle(service.sId, name);
                                    }}
                                  >
                                    <span className="flex items-center text-sm ml-1 space-x-1">
                                      <span>{name}</span>
                                      {isSelected && (
                                        <span className="text-[#F96176] bg-white rounded-full px-2">
                                          ✓
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </Collapse>
                    </div>
                  ))}

                {/* Other Service Option */}
                <div className="w-full">
                  <Chip
                    label="Other Service"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOtherServiceSelected(!isOtherServiceSelected);
                    }}
                    sx={{
                      backgroundColor: isOtherServiceSelected
                        ? "#F96176"
                        : "default",
                      color: isOtherServiceSelected ? "white" : "inherit",
                      "&:hover": {
                        backgroundColor: isOtherServiceSelected
                          ? "#F96176"
                          : "#FFCDD2",
                      },
                      border: validationErrors.otherService
                        ? "2px solid red"
                        : "none",
                    }}
                    variant={isOtherServiceSelected ? "filled" : "outlined"}
                    className="w-full transition duration-300 hover:shadow-lg font-medium"
                  />

                  {validationErrors.otherService && (
                    <div className="text-red-500 text-xs mt-1 ml-2">
                      {validationErrors.otherService}
                    </div>
                  )}

                  {isOtherServiceSelected && (
                    <div className="mt-2 w-full">
                      <TextField
                        fullWidth
                        size="small"
                        label="Enter Custom Service Name *"
                        placeholder="e.g. Battery Replacement, AC Repair, Body Work"
                        value={otherServiceName}
                        onChange={(e) => setOtherServiceName(e.target.value)}
                        className="bg-white rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4 flex flex-col gap-4">
                {selectedVehicleData?.vehicleType === "Truck" && (
                  <TextField
                    fullWidth
                    label="Miles"
                    type="number"
                    value={miles}
                    onChange={(e) => setMiles(e.target.value)}
                    className="mb-4 rounded-lg"
                  />
                )}

                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  className="mb-4 rounded-lg mt-4"
                />

                {selectedVehicleData?.vehicleType === "Trailer" && (
                  <>
                    {selectedVehicleData?.engineName === "DRY VAN" ? (
                      <div></div>
                    ) : (
                      <TextField
                        fullWidth
                        label="Hours"
                        type="number"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="mb-4 rounded-lg"
                      />
                    )}
                  </>
                )}

                <Autocomplete
                  freeSolo
                  options={workshopList}
                  value={workshopName}
                  onInputChange={(event, newInputValue) => {
                    setWorkshopName(newInputValue);
                  }}
                  onChange={(event, newValue) => {
                    setWorkshopName(newValue || "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Workshop Name"
                      placeholder="Select existing workshop or type new workshop"
                      className="mb-4 rounded-lg"
                    />
                  )}
                />

                <TextField
                  fullWidth
                  label="Invoice Number (Optional)"
                  value={invoice}
                  onChange={(e) => {
                    // Limit to 10 characters
                    if (e.target.value.length <= 10) {
                      setInvoice(e.target.value);
                    }
                  }}
                  inputProps={{
                    maxLength: 10,
                  }}
                  className="mb-4 rounded-lg"
                />
                <TextField
                  fullWidth
                  label="Invoice Amount (Optional)"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="mb-4 rounded-lg"
                />
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-lg"
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Service Document / Invoice (Image or PDF)
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#F96176] file:text-white
                      hover:file:bg-[#e05065]"
                  />

                  {(imageFile || imagePreview || existingImageUrl) && (
                    <div className="mt-3 p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                      {(imageFile &&
                        (imageFile.type.toLowerCase().includes("pdf") ||
                          imageFile.name.toLowerCase().endsWith(".pdf"))) ||
                      (!imageFile &&
                        existingImageUrl &&
                        (existingImageUrl.toLowerCase().includes(".pdf") ||
                          existingImageUrl
                            .toLowerCase()
                            .includes("application%2fpdf"))) ? (
                        <div className="flex items-center gap-3">
                          <FaFilePdf className="text-red-500 text-3xl shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {imageFile
                                ? imageFile.name
                                : "Attached PDF Invoice"}
                            </p>
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-semibold uppercase">
                              PDF Document
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-16 rounded overflow-hidden border bg-white shrink-0">
                            {imagePreview || existingImageUrl ? (
                              <img
                                src={imagePreview || existingImageUrl || ""}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {imageFile
                                ? imageFile.name
                                : "Attached Service Image"}
                            </p>
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-semibold uppercase">
                              Image
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          setExistingImageUrl(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 p-2 rounded hover:bg-red-50"
                      >
                        <FaTrash size={12} /> Remove
                      </button>
                    </div>
                  )}

                  {isUploading && (
                    <div className="mt-2">
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                      />
                      <Typography
                        variant="caption"
                        display="block"
                        gutterBottom
                      >
                        Uploading: {Math.round(uploadProgress)}%
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => resetForm()}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveRecords}
            variant="contained"
            color="primary"
            className="bg-[#F96176] hover:bg-[#F96176] transition duration-300"
          >
            {/* Save Record */}

            {isEditing
              ? isRecordSaving
                ? "Updating..."
                : "Update Record"
              : isRecordSaving
              ? "Saving..."
              : "Save Record"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Records Table */}

      {activeTab === "records" ? (
        records.length === 0 ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <h1 className="text-xl font-semibold text-gray-700">
              No records found.
            </h1>
          </div>
        ) : (
          <div
            ref={printRef}
            className="w-full bg-white"
            style={{ overflow: "visible", maxHeight: "none" }}
          >
            <TableContainer component={Paper}>
              <Table className="table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Inv. Amount</TableCell>
                    {records.some((record) => record.miles > 0) && (
                      <TableCell>Miles/Hours</TableCell>
                    )}
                    {records.some((record) => record.hours < 0) && (
                      <TableCell>Hours</TableCell>
                    )}
                    <TableCell>Services</TableCell>
                    <TableCell>Workshop Name</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="table-cell">
                        {formatDateSafe(record.date)}
                      </TableCell>
                      <TableCell className="table-cell">
                        {record.invoice && record.invoice.trim() !== ""
                          ? record.invoice
                          : "N/A"}
                      </TableCell>
                      <TableCell className="table-cell">
                        {record.vehicleDetails?.vehicleNumber || "N/A"}
                      </TableCell>

                      <TableCell className="table-cell">
                        {record.vehicleDetails?.companyName || "N/A"}
                      </TableCell>
                      <TableCell className="table-cell">
                        {record.invoiceAmount &&
                        String(record.invoiceAmount).trim() !== ""
                          ? `$${record.invoiceAmount}`
                          : "N/A"}
                      </TableCell>

                      <TableCell className="table-cell">
                        {record.vehicleDetails?.vehicleType === "Trailer"
                          ? record.hours
                            ? `${record.hours}`
                            : "N/A"
                          : record.miles
                          ? `${record.miles}`
                          : "N/A"}
                      </TableCell>
                      <TableCell className="table-cell">
                        {record.services && record.services.length > 0
                          ? [...record.services]
                              .filter((s) => s && s.serviceName)
                              .sort((a, b) =>
                                (a.serviceName || "").localeCompare(
                                  b.serviceName || ""
                                )
                              )
                              .map((service) => service.serviceName)
                              .join(", ") || "N/A"
                          : "N/A"}
                      </TableCell>

                      <TableCell className="table-cell">
                        {record.workshopName &&
                        record.workshopName.trim() !== ""
                          ? record.workshopName
                          : "N/A"}
                      </TableCell>

                      <TableCell>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() =>
                              userData?.isEdit
                                ? handleEditRecord(record)
                                : toast.error(
                                    "You don't have permission to edit this record."
                                  )
                            }
                            className="bg-[#58BB87] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#58BB87]"
                          >
                            Edit
                          </button>

                          <Link href={`/records/${record.id}`} passHref>
                            <button className="bg-[#F96176] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#F96176]">
                              View
                            </button>
                          </Link>

                          <button
                            onClick={() => downloadSingleRecord(record)}
                            className="bg-[#3B82F6] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#2563EB]"
                            title="Download Excel"
                          >
                            <FaDownload /> Download
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )
      ) : (
        <MilesTab />
      )}
    </div>
  ) : (
    <div>You don&apos;t have permission to see this page.</div>
  );
}
