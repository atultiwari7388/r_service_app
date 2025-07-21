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
import { VehicleTypes } from "@/types/types";
import { useAuth } from "@/contexts/AuthContexts";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { CiSearch, CiTurnL1 } from "react-icons/ci";
import { IoMdAdd } from "react-icons/io";
import Link from "next/link";
import DatePicker from "react-datepicker";
import { BiFilter, BiSearch } from "react-icons/bi";
import { FaPrint } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import Image from "next/image";

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
  const [invoice, setInvoice] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showAddRecords, setShowAddRecords] = useState(false);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [serviceSearchText, setServiceSearchText] = useState("");

  //for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [selectedVehicleData, setSelectedVehicleData] =
    useState<VehicleTypes | null>(null);

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

  const handleRedirect = ({ path }: RedirectProps): void => {
    setShowPopup(false);
    window.location.href = path;
  };

  const fetchVehicles = async () => {
    if (!user) return;
    try {
      const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
      const q = query(vehiclesRef, where("active", "==", true));
      const vehiclesSnapshot = await getDocs(q);
      const vehiclesList = vehiclesSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as VehicleTypes)
      );
      setVehicles(vehiclesList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      GlobalToastError(error);
    }
  };

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
      toast.error("Failed to fetch services");
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
      toast.error("Failed to fetch service packages");
    }
  };

  const updateServiceDefaultValues = async () => {
    if (!selectedVehicle || !user?.uid) return;

    try {
      const vehicleRef = doc(
        db,
        "Users",
        user.uid,
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

  const handleServiceSelect = (serviceId: string) => {
    const newSelectedServices = new Set(selectedServices);
    const isServiceSelected = newSelectedServices.has(serviceId);

    if (isServiceSelected) {
      // Deselect the service
      newSelectedServices.delete(serviceId);

      // Remove any subservices for this service
      setSelectedSubServices((prev) => {
        const newSubServices = { ...prev };
        delete newSubServices[serviceId];
        return newSubServices;
      });
    } else {
      // Select the service
      newSelectedServices.add(serviceId);

      // Initialize subservices if they exist
      const service = services.find((s) => s.sId === serviceId);
      if (service?.subServices) {
        const subServiceNames = service.subServices
          .flatMap((sub) => sub.sName)
          .filter((name) => name.trim().length > 0);

        if (subServiceNames.length > 0) {
          setSelectedSubServices((prev) => ({
            ...prev,
            [serviceId]: [],
          }));
        }
      }
    }

    setSelectedServices(newSelectedServices);
    updateServiceDefaultValues();

    // Only expand if the service has subservices and we're selecting it
    const service = services.find((s) => s.sId === serviceId);
    if (
      service?.subServices &&
      service.subServices.length > 0 &&
      !isServiceSelected
    ) {
      setExpandedService(serviceId);
    } else {
      // If deselecting or service has no subservices, collapse
      setExpandedService(null);
    }
  };

  const handleAddMiles = async () => {
    setIsMilesSaving(true);
    if (!selectedVehicle || !todayMiles || !user?.uid) {
      toast.error("Please select a vehicle and enter miles/hours.");
      return;
    }

    const vehicleData = vehicles.find((v) => v.id === selectedVehicle);
    if (!vehicleData) {
      toast.error("Vehicle data not found.");
      return;
    }

    try {
      const vehicleRef = doc(
        db,
        "Users",
        user.uid,
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

      if (enteredValue < currentReading) {
        toast.error(
          `${
            selectedVehicleType === "Truck" ? "Miles" : "Hours"
          } cannot be less than the current value.`
        );
        return;
      }

      const data = {
        [prevReadingField]: currentReading.toString(),
        [currentReadingField]: enteredValue.toString(),
        [readingValueField]: enteredValue.toString(),
        [readingArrayField]: arrayUnion({
          [readingValueField]: enteredValue,
          date: new Date().toISOString(),
        }),
      };

      // Update owner's vehicle first
      await updateDoc(vehicleRef, data);

      // Check if current user is team member
      const currentUserDoc = await getDoc(doc(db, "Users", user.uid));
      const isTeamMember = currentUserDoc.data()?.isTeamMember || false;

      if (isTeamMember) {
        // If current user is team member, update owner's vehicle
        const ownerId = currentUserDoc.data()?.createdBy;
        if (ownerId) {
          const ownerVehicleRef = doc(
            db,
            "Users",
            ownerId,
            "Vehicles",
            selectedVehicle
          );
          await updateDoc(ownerVehicleRef, data);
        }
      } else {
        // If current user is owner, update all team members who have this vehicle
        const teamMembersQuery = query(
          collection(db, "Users"),
          where("createdBy", "==", user.uid),
          where("isTeamMember", "==", true)
        );

        const teamMembersSnapshot = await getDocs(teamMembersQuery);

        for (const memberDoc of teamMembersSnapshot.docs) {
          const teamMemberUid = memberDoc.id;
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
      }

      // Check DataServices
      const dataServicesQuery = query(
        collection(db, "Users", user.uid, "DataServices"),
        where("vehicleId", "==", selectedVehicle)
      );
      const dataServicesSnapshot = await getDocs(dataServicesQuery);

      if (dataServicesSnapshot.empty) {
        // Call cloud function to notify about missing services
        const checkAndNotify = httpsCallable(
          functions,
          "checkAndNotifyUserForVehicleService"
        );
        await checkAndNotify({ userId: user.uid, vehicleId: selectedVehicle });
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
          userId: user.uid,
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
      toast.error(
        `Failed to save ${
          selectedVehicleType === "Truck" ? "miles" : "hours"
        }: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      );
    } finally {
      setIsMilesSaving(false);
    }
  };

  const handleVehicleSelect = async (value: string) => {
    setSelectedVehicle(value);
    setSelectedVehicleData(null);
    setSelectedPackages(new Set());

    if (!user?.uid || !value) return;

    try {
      const vehicleRef = doc(db, "Users", user.uid, "Vehicles", value);
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

  const handlePackageSelect = (selectedPackages: string[]) => {
    const newSelectedServices = new Set(selectedServices);

    selectedPackages.forEach((pkg) => {
      services.forEach((service) => {
        if (
          service.pName &&
          service.pName.some(
            (p) => normalizePackageName(p) === normalizePackageName(pkg)
          )
        ) {
          newSelectedServices.add(service.sId);
        }
      });
    });

    setSelectedServices(newSelectedServices);
    setSelectedPackages(new Set(selectedPackages));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user?.uid) return null;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const storageRef = ref(
        storage,
        `service-records/${user.uid}/${Date.now()}_${imageFile.name}`
      );
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

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
      console.error("Upload error:", error);
      setIsUploading(false);
      return null;
    }
  };

  const filteredRecords = records
    .filter((record) => {
      const recordDate = new Date(record.date);
      const matchesVehicle =
        !filterVehicle ||
        record.vehicleDetails.vehicleNumber
          .toLowerCase()
          .includes(filterVehicle.toLowerCase());
      const matchesService =
        !filterService ||
        record.services.some((s: { serviceName: string }) =>
          s.serviceName.toLowerCase().includes(filterService.toLowerCase())
        );
      const matchesInvoice =
        !filterInvoice ||
        (record.invoice || "")
          .toLowerCase()
          .includes(filterInvoice.toLowerCase());
      const matchesDate =
        !startDate ||
        !endDate ||
        (recordDate >= startDate && recordDate <= endDate);

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
      // Convert date strings to Date objects (format: "2025-06-28")
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      // For descending order (newest first)
      return dateB.getTime() - dateA.getTime();
    });

  const handleSearchFilterOpen = () => setShowSearchFilter(true);
  const handleSearchFilterClose = () => setShowSearchFilter(false);

  useEffect(() => {
    fetchVehicles();
    fetchServices();
    fetchServicePackages();
    if (!user?.uid) return;

    const recordsQuery = query(
      collection(db, "Users", user.uid, "DataServices"),
      where("active", "==", true)
    );

    const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
      const recordsData: RecordData[] = snapshot.docs.map((doc) => {
        const data = doc.data() as ServiceRecord;
        return {
          ...data,
          id: doc.id,
          vehicle: data.vehicleDetails.companyName,
        };
      });

      setRecords(recordsData);
      console.log(`Fetched ${recordsData.length} records`);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const handleSaveRecords = async () => {
    try {
      setIsRecordSaving(true);
      if (!user || !selectedVehicle || selectedServices.size === 0) {
        toast.error("Please select vehicle and at least one service");
        return;
      }

      const vehicleData = vehicles.find((v) => v.id === selectedVehicle);
      if (!vehicleData) {
        toast.error("Vehicle data not found");
        return;
      }

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          toast.error("Failed to upload image");
          return;
        }
      }

      const currentMiles = Number(miles);
      const currentHours = Number(hours) || 0;

      // Get current vehicle services to preserve existing ones
      const vehicleRef = doc(
        db,
        "Users",
        user.uid,
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

      for (const serviceId of selectedServices) {
        const service = services.find((s) => s.sId === serviceId);
        if (!service) continue;

        // Check if vehicle already has this service
        const existingServiceIndex = updatedVehicleServices.findIndex(
          (s: { serviceId: string }) => s.serviceId === serviceId
        );

        // Get default value - priority to vehicle-specific if exists
        let defaultValue = serviceDefaultValues[serviceId] || 0;
        let type = "reading";

        if (existingServiceIndex >= 0) {
          // Keep existing service type if available
          type = updatedVehicleServices[existingServiceIndex].type || "reading";
          // Use existing default if available, otherwise use calculated
          defaultValue =
            updatedVehicleServices[existingServiceIndex]
              .defaultNotificationValue ||
            serviceDefaultValues[serviceId] ||
            0;
        } else {
          // Determine type from metadata if new service
          const engineName = vehicleData.engineNumber?.toString().toUpperCase();
          const dValues = service.dValues || [];
          const matchingDValue = dValues.find(
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
          } else if (type === "hour") {
            nextNotificationValue = currentHours + defaultValue;
            numericValue = nextNotificationValue;
          }
        }

        // Prepare service data for record
        const serviceData = {
          serviceId,
          serviceName: service.sName || "",
          type,
          defaultNotificationValue: defaultValue,
          nextNotificationValue:
            type === "day" ? formattedDate : nextNotificationValue.toString(),
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
            type === "day" ? formattedDate : nextNotificationValue.toString(),
          subServices: selectedSubServices[serviceId] || [],
        });

        // Update vehicle services array - update existing or add new
        if (existingServiceIndex >= 0) {
          updatedVehicleServices[existingServiceIndex] = {
            ...updatedVehicleServices[existingServiceIndex],
            nextNotificationValue:
              type === "day" ? formattedDate : nextNotificationValue.toString(),
          };
        } else {
          updatedVehicleServices.push({
            ...serviceData,
            nextNotificationValue:
              type === "day" ? formattedDate : nextNotificationValue.toString(),
          });
        }
      }

      // Format date for storage
      const baseDate = date ? new Date(date) : new Date();
      const formattedDate = baseDate.toISOString().split("T")[0];

      const recordData = {
        userId: user.uid,
        vehicleId: selectedVehicle,
        imageUrl: imageUrl,
        vehicleDetails: {
          ...vehicleData,
          currentMiles: currentMiles.toString(),
          nextNotificationMiles: notificationData,
        },
        services: servicesData,
        currentMilesArray: [
          {
            miles: currentMiles,
            date: formattedDate,
          },
        ],
        miles: vehicleData.vehicleType === "Truck" ? currentMiles : 0,
        hours: vehicleData.vehicleType === "Trailer" ? currentHours : 0,
        totalMiles: currentMiles,
        date: formattedDate,
        workshopName,
        invoice,
        invoiceAmount,
        description,
        createdAt: new Date().toISOString(),
        active: true,
      };

      const batch = writeBatch(db);

      // Handle record creation/update
      if (isEditing && editingRecordId) {
        // Update existing record
        const recordRef = doc(
          db,
          "Users",
          user.uid,
          "DataServices",
          editingRecordId
        );
        batch.update(recordRef, recordData);

        // Update global record if exists
        const globalRecordQuery = query(
          collection(db, "DataServicesRecords"),
          where("userId", "==", user.uid),
          where("vehicleId", "==", selectedVehicle),
          where("createdAt", "==", recordData.createdAt)
        );
        const globalSnapshot = await getDocs(globalRecordQuery);
        if (!globalSnapshot.empty) {
          batch.update(globalSnapshot.docs[0].ref, recordData);
        }
      } else {
        // Create new records
        const newRecordRef = doc(
          collection(db, "Users", user.uid, "DataServices")
        );
        const globalRecordRef = doc(collection(db, "DataServicesRecords"));

        batch.set(newRecordRef, recordData);
        batch.set(globalRecordRef, {
          ...recordData,
          id: newRecordRef.id,
        });
      }

      // Update vehicle document
      batch.update(vehicleRef, {
        services: updatedVehicleServices,
        currentMiles: currentMiles.toString(),
        currentMilesArray: arrayUnion({
          miles: currentMiles,
          date: formattedDate,
        }),
        nextNotificationMiles: notificationData,
      });

      // Handle team members (MOVED THIS SECTION OUTSIDE OF THE isEditing CONDITION)
      const teamMembersQuery = query(
        collection(db, "Users"),
        where("createdBy", "==", user.uid),
        where("isTeamMember", "==", true)
      );
      const teamMembersSnapshot = await getDocs(teamMembersQuery);

      for (const memberDoc of teamMembersSnapshot.docs) {
        const memberVehicleRef = doc(
          db,
          "Users",
          memberDoc.id,
          "Vehicles",
          selectedVehicle
        );
        const memberVehicleSnap = await getDoc(memberVehicleRef);

        if (memberVehicleSnap.exists()) {
          // Update team member's vehicle
          batch.update(memberVehicleRef, {
            services: updatedVehicleServices,
            currentMiles: currentMiles.toString(),
            currentMilesArray: arrayUnion({
              miles: currentMiles,
              date: formattedDate,
            }),
            nextNotificationMiles: notificationData,
          });

          // For editing, we need to find and update the existing record in team member's DataServices
          if (isEditing && editingRecordId) {
            // Find the corresponding record in team member's DataServices
            const memberRecordQuery = query(
              collection(db, "Users", memberDoc.id, "DataServices"),
              where("userId", "==", user.uid),
              where("vehicleId", "==", selectedVehicle),
              where("createdAt", "==", recordData.createdAt)
            );
            const memberRecordSnapshot = await getDocs(memberRecordQuery);

            if (!memberRecordSnapshot.empty) {
              batch.update(memberRecordSnapshot.docs[0].ref, recordData);
            }
          } else {
            // Add new record to team member's DataServices
            const memberRecordRef = doc(
              collection(db, "Users", memberDoc.id, "DataServices")
            );
            batch.set(memberRecordRef, recordData);
          }
        }
      }

      // Handle if current user is team member (save to owner)
      const currentUserDoc = await getDoc(doc(db, "Users", user.uid));
      if (currentUserDoc.data()?.isTeamMember) {
        const ownerId = currentUserDoc.data()?.createdBy;
        if (ownerId) {
          const ownerVehicleRef = doc(
            db,
            "Users",
            ownerId,
            "Vehicles",
            selectedVehicle
          );
          const ownerVehicleSnap = await getDoc(ownerVehicleRef);

          if (ownerVehicleSnap.exists()) {
            batch.update(ownerVehicleRef, {
              services: updatedVehicleServices,
              currentMiles: currentMiles.toString(),
              currentMilesArray: arrayUnion({
                miles: currentMiles,
                date: formattedDate,
              }),
              nextNotificationMiles: notificationData,
            });

            // For editing, find and update the existing record in owner's DataServices
            if (isEditing && editingRecordId) {
              const ownerRecordQuery = query(
                collection(db, "Users", ownerId, "DataServices"),
                where("userId", "==", user.uid),
                where("vehicleId", "==", selectedVehicle),
                where("createdAt", "==", recordData.createdAt)
              );
              const ownerRecordSnapshot = await getDocs(ownerRecordQuery);

              if (!ownerRecordSnapshot.empty) {
                batch.update(ownerRecordSnapshot.docs[0].ref, recordData);
              }
            } else {
              // Add new record to owner's DataServices
              const ownerRecordRef = doc(
                collection(db, "Users", ownerId, "DataServices")
              );
              batch.set(ownerRecordRef, recordData);
            }
          }
        }
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

  const formatDateToDDMMYYYY = (date: Date | string): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  };

  // Update the handleSubserviceToggle function for better single-selection handling

  const handleEditRecord = (record: ServiceRecord) => {
    setIsEditing(true);
    setEditingRecordId(record.id);

    // Set form values from the selected record
    setSelectedVehicle(record.vehicleId);
    const vehicleData = vehicles.find((v) => v.id === record.vehicleId) || null;
    setSelectedVehicleData(vehicleData);

    // Initialize serviceDefaultValues from the record
    const newServiceDefaultValues: { [key: string]: number } = {};
    record.services.forEach((service) => {
      newServiceDefaultValues[service.serviceId] =
        service.defaultNotificationValue || 0;
    });
    setServiceDefaultValues(newServiceDefaultValues);

    // Set selected services from the record (convert to Set)
    const servicesSet = new Set(record.services.map((s) => s.serviceId));
    setSelectedServices(servicesSet);

    // Set subservices from the record
    const subServices: { [key: string]: string[] } = {};
    record.services.forEach((service) => {
      subServices[service.serviceId] =
        service.subServices?.map((ss) => ss.name) || [];
    });

    let recordDate = record.date;
    setSelectedSubServices(subServices);
    setMiles(record.miles.toString());
    setHours(record.hours.toString());
    if (recordDate && recordDate.includes("T")) {
      recordDate = recordDate.split("T")[0];
    }
    setDate(record.date);
    setWorkshopName(record.workshopName || "");
    setInvoice(record.invoice || "");
    setInvoiceAmount(record.invoiceAmount || "");
    setDescription(record.description || "");

    setShowAddRecords(true);
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
        return {
          ...prev,
          [serviceId]: currentSubs.includes(subName) ? [] : [subName],
        };
      } else {
        // For other services, allow multiple selections
        const newSubs = currentSubs.includes(subName)
          ? currentSubs.filter((name) => name !== subName)
          : [...currentSubs, subName];
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

  const resetForm = () => {
    setSelectedVehicle("");
    setSelectedServices(new Set());
    setSelectedPackages(new Set());
    setSelectedSubServices({});
    setServiceDefaultValues({});
    setMiles("");
    setHours("");
    setDate("");
    setWorkshopName("");
    setInvoice("");
    setDescription("");
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

  return (
    <div className="flex flex-col justify-center items-center p-6 bg-gray-100 gap-8">
      {/* Button Container */}
      <div className="flex justify-center gap-4 mb-6">
        {/** Add Record */}

        <button
          onClick={() => setShowAddRecords(true)}
          className="bg-[#F96176] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#F96176]"
        >
          <IoMdAdd /> Add Record
        </button>

        {/** Add mile */}

        <button
          onClick={() => setShowAddMiles(true)}
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
        </DialogActions>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog
        open={showAddRecords}
        onClose={() => setShowAddRecords(false)}
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
                        const value = e.target.value;
                        setSelectedVehicle(value);
                        const vehicleData =
                          vehicles.find((v) => v.id === value) || null;
                        setSelectedVehicleData(vehicleData);
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
                      onChange={(e) =>
                        handlePackageSelect(e.target.value as string[])
                      }
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
                          if (
                            selectedServices.has(service.sId) &&
                            service.subServices &&
                            service.subServices.length > 0
                          ) {
                            setExpandedService(
                              expandedService === service.sId
                                ? null
                                : service.sId
                            );
                          }
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
                        }}
                        variant={
                          selectedServices.has(service.sId)
                            ? "filled"
                            : "outlined"
                        }
                        className="w-full transition duration-300 hover:shadow-lg"
                      />

                      <Collapse
                        in={
                          selectedServices.has(service.sId) &&
                          expandedService === service.sId &&
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
                    {selectedVehicleData.engineName === "DRY VAN" ? (
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
                    {/* <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      className="mb-4 rounded-lg"
                    /> */}
                  </>
                )}

                <TextField
                  fullWidth
                  label="Workshop Name"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  className="mb-4 rounded-lg"
                />
                <TextField
                  fullWidth
                  label="Invoice Number (Optional)"
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
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
                    Upload Service Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500
      file:mr-4 file:py-2 file:px-4
      file:rounded-md file:border-0
      file:text-sm file:font-semibold
      file:bg-blue-50 file:text-blue-700
      hover:file:bg-blue-100"
                  />

                  {imagePreview && (
                    <div className="mt-2">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={128}
                        height={128}
                        className="object-contain rounded border"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Image
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
            onClick={() => setShowAddRecords(false)}
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

      {records.length === 0 ? (
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
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="table-cell">
                      {record.invoice && record.invoice.trim() !== ""
                        ? record.invoice
                        : "N/A"}
                    </TableCell>
                    <TableCell className="table-cell">
                      {record.vehicleDetails.vehicleNumber}
                    </TableCell>

                    <TableCell className="table-cell">
                      {record.vehicleDetails.companyName}
                    </TableCell>

                    <TableCell className="table-cell">
                      {record.vehicleDetails.vehicleType === "Trailer"
                        ? record.hours
                          ? `${record.hours}`
                          : "N/A"
                        : record.miles
                        ? `${record.miles}`
                        : "N/A"}
                    </TableCell>
                    <TableCell className="table-cell">
                      {record.services && record.services.length > 0
                        ? record.services
                            .map((service) => service.serviceName)
                            .join(", ")
                        : "N/A"}
                    </TableCell>

                    <TableCell className="table-cell">
                      {record.workshopName && record.workshopName.trim() !== ""
                        ? record.workshopName
                        : "N/A"}
                    </TableCell>

                    <TableCell>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="bg-[#58BB87] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#58BB87]"
                        >
                          Edit
                        </button>

                        <Link href={`/records/${record.id}`} passHref>
                          <button className="bg-[#F96176] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#F96176]">
                            View
                          </button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </div>
  );
}
