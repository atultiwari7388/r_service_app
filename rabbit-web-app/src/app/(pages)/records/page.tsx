"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
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
  const [todayMiles, setTodayMiles] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const fetchVehicles = async () => {
    if (!user) return;
    try {
      const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
      const vehiclesSnapshot = await getDocs(vehiclesRef);
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

  const updateServiceDefaultValues = () => {
    const newDefaults: { [key: string]: number } = {};

    selectedServices.forEach((serviceId) => {
      const service = services.find((s) => s.sId === serviceId);
      const vehicleEngine = selectedVehicleData?.engineNumber?.toUpperCase();

      if (service?.dValues && vehicleEngine) {
        const dValue = service.dValues.find(
          (dv) => dv.brand?.toUpperCase() === vehicleEngine
        );

        if (dValue) {
          const [baseValue] = dValue.value.toString().split(",").map(Number);
          let value = baseValue * 1000; // Default for 'reading'

          if (dValue.type?.toLowerCase() === "day") value = baseValue;
          if (dValue.type?.toLowerCase() === "hour") value = baseValue;

          newDefaults[serviceId] = value;
        }
      }
    });

    setServiceDefaultValues(newDefaults);
  };

  const handleServiceSelect = (serviceId: string) => {
    const newSelectedServices = new Set(selectedServices);

    if (newSelectedServices.has(serviceId)) {
      // Deselect the service
      newSelectedServices.delete(serviceId);

      // Remove its subservices
      const newSubServices = { ...selectedSubServices };
      delete newSubServices[serviceId];
      setSelectedSubServices(newSubServices);

      // Collapse if this was the expanded service
      if (expandedService === serviceId) {
        setExpandedService(null);
      }
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

      // Expand this service
      setExpandedService(serviceId);
    }

    setSelectedServices(newSelectedServices);
    updateServiceDefaultValues();
  };

  const handleAddMiles = async () => {
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
      const currentReadingArrayField =
        selectedVehicleType === "Truck"
          ? "currentMilesArray"
          : "hoursReadingArray";

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

      await updateDoc(vehicleRef, {
        [currentReadingField]: enteredValue,
        [currentReadingArrayField]: arrayUnion({
          [selectedVehicleType === "Truck" ? "miles" : "hours"]: enteredValue,
          date: new Date().toISOString(),
        }),
      });

      toast.success(
        `${
          selectedVehicleType === "Truck" ? "Miles" : "Hours"
        } updated successfully!`
      );
      setTodayMiles("");
      setShowAddMiles(false);
    } catch (error) {
      console.error("Error updating miles/hours:", error);
      toast.error("Failed to save miles/hours.");
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
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const handleSearchFilterOpen = () => setShowSearchFilter(true);
  const handleSearchFilterClose = () => setShowSearchFilter(false);

  const handleSaveRecords = async () => {
    try {
      if (!user || !selectedVehicle) {
        toast.error("Please select vehicle and services");
        return;
      }

      const vehicleData = vehicles.find((v) => v.id === selectedVehicle);
      if (!vehicleData) {
        toast.error("Vehicle data not found");
        return;
      }

      const currentMiles = Number(miles);
      const currentHours = Number(hours) || 0;

      // const recordRef = doc(db, "Users", user.uid, "DataServices", recordId); // Use recordId for editing

      const servicesData = Array.from(selectedServices).map((serviceId) => {
        const service = services.find((s) => s.sId === serviceId);
        const defaultValue = serviceDefaultValues[serviceId] || 0;
        const serviceObj = services.find((s) => s.sId === serviceId);
        const type = (
          serviceObj?.dValues?.[0]?.type || "reading"
        ).toLowerCase();
        // const nextNotificationValue =
        //   defaultValue === 0 ? 0 : currentMiles + defaultValue;
        let nextNotificationValue = 0;

        if (type === "reading") {
          nextNotificationValue = currentMiles + defaultValue;
        } else if (type === "day") {
          const date = new Date();
          date.setDate(date.getDate() + defaultValue);
          nextNotificationValue = date.getTime();
        } else if (type === "hour") {
          nextNotificationValue = currentHours + defaultValue;
        }

        return {
          serviceId,
          serviceName: service?.sName || "",
          defaultNotificationValue: defaultValue,
          nextNotificationValue: nextNotificationValue,
          subServices:
            selectedSubServices[serviceId]?.map((subService, index) => ({
              name: subService,
              id: `${serviceId}_${subService.replace(/\s+/g, "_")}_${index}`, // Add index to make unique
            })) || [],
        };
      });

      const notificationData = servicesData.map((service) => ({
        serviceName: service.serviceName,
        nextNotificationValue: service.nextNotificationValue,
        subServices: selectedSubServices[service.serviceId] || [],
      }));

      const recordData = {
        userId: user.uid,
        vehicleId: selectedVehicle,
        vehicleDetails: {
          ...vehicleData,
          currentMiles: currentMiles.toString(),
          nextNotificationMiles: notificationData,
        },
        services: servicesData,
        currentMilesArray: [
          {
            miles: currentMiles,
            date: new Date().toISOString(),
          },
        ],
        miles: vehicleData.vehicleType === "Truck" ? currentMiles : 0,
        hours: vehicleData.vehicleType === "Trailer" ? Number(hours) : 0,
        totalMiles: currentMiles,
        date: date || new Date().toISOString(),
        workshopName,
        invoice,
        invoiceAmount,
        description,
        createdAt: new Date().toISOString(),
        active: true,
      };

      if (isEditing && editingRecordId) {
        // Update existing record
        const recordRef = doc(
          db,
          "Users",
          user.uid,
          "DataServices",
          editingRecordId
        );
        await updateDoc(recordRef, recordData);
        toast.success("Record updated successfully!");
      } else {
        //create new record
        const batch = {
          newRecord: doc(collection(db, "Users", user.uid, "DataServices")),
          globalRecord: doc(collection(db, "DataServicesRecords")),
          vehicle: doc(db, "Users", user.uid, "Vehicles", selectedVehicle),
        };

        await Promise.all([
          setDoc(batch.newRecord, recordData),
          setDoc(batch.globalRecord, recordData),
          setDoc(
            batch.vehicle,
            {
              currentMiles: currentMiles.toString(),
              currentMilesArray: [
                {
                  miles: currentMiles,
                  date: new Date().toISOString(),
                },
              ],
              nextNotificationMiles: notificationData,
            },
            { merge: true }
          ),
        ]);
      }

      toast.success("Record added successfully!");
      resetForm();
    } catch (error) {
      console.error("Error saving record:", error);
      toast.error("Failed to save record");
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchServices();
    fetchServicePackages();
    if (!user?.uid) return;

    const recordsQuery = query(
      collection(db, "Users", user.uid, "DataServices")
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

  // Add this function to handle editing records
  const handleEditRecord = (record: ServiceRecord) => {
    setIsEditing(true);
    setEditingRecordId(record.id);

    // Set form values from the selected record
    setSelectedVehicle(record.vehicleId);
    setSelectedVehicleData(
      vehicles.find((v) => v.id === record.vehicleId) || null
    );

    // Set selected services and subservices
    const servicesSet = new Set(
      record.services.map((s: { serviceId: string }) => s.serviceId)
    );
    setSelectedServices(servicesSet);

    // Set subservices
    const subServices: { [key: string]: string[] } = {};
    record.services.forEach((service) => {
      subServices[service.serviceId] =
        service.subServices?.map((ss) => ss.name) || [];
    });
    setSelectedSubServices(subServices);

    // Set other form fields
    setMiles(record.miles.toString());
    setHours(record.hours.toString());
    setDate(record.date);
    setWorkshopName(record.workshopName);
    setInvoice(record.invoice || "");
    setInvoiceAmount(record.invoiceAmount || "");
    setDescription(record.description || "");

    setShowAddRecords(true);
  };

  const handleSubserviceToggle = (serviceId: string, subName: string) => {
    setSelectedSubServices((prev) => {
      const currentSubs = prev[serviceId] || [];

      // Check if this is a service that should only have one subservice selected
      const service = services.find((s) => s.sId === serviceId);
      const isSingleSubService =
        service?.sName === "Steer Tires" || service?.sName === "DPF Clean";

      if (isSingleSubService) {
        // If already selected, deselect it, otherwise select only this one
        return {
          ...prev,
          [serviceId]: currentSubs.includes(subName) ? [] : [subName],
        };
      } else {
        // For normal services, allow multiple selections
        const newSubs = currentSubs.includes(subName)
          ? currentSubs.filter((name) => name !== subName)
          : [...currentSubs, subName];
        return { ...prev, [serviceId]: newSubs };
      }
    });
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

  return (
    <div className="flex flex-col justify-center items-center p-6 bg-gray-100 gap-8">
      {/* Button Container */}
      <div className="flex justify-center gap-4 mb-6">
        {/** Add Record */}
        <Button
          variant="contained"
          startIcon={<IoMdAdd />}
          onClick={() => setShowAddRecords(true)}
          className="bg-[#F96176] hover:bg-[#F96176] text-white transition duration-300"
        >
          Add Record
        </Button>

        {/** Add mile */}
        <Button
          variant="contained"
          onClick={() => setShowAddMiles(true)}
          className="bg-[#58BB87] hover:bg-[#58BB87] text-white transition duration-300"
        >
          Add Miles/Hours
        </Button>

        {/** Search Functionality */}
        {/* <IconButton onClick={handleSearchFilterOpen}> */}

        <Button
          variant="contained"
          onClick={() => handleSearchFilterOpen()}
          className="bg-[#58BB87] hover:bg-[#58BB87] text-white transition duration-300"
        >
          Search <BiFilter />
        </Button>
        {/* </IconButton> */}

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
                  {/* <Select
                    value={selectedVehicle}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="rounded-lg"
                    sx={{ minHeight: "56px" }} // Adjust the minimum height and padding
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNumber} ({vehicle.companyName})
                      </MenuItem>
                    ))}
                  </Select> */}

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
            Save {selectedVehicleType === "Truck" ? "Miles" : "Hours"}
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
              {/** Select packages */}

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
                          <Checkbox checked={selectedPackages.has(pkg.name)} />
                          {pkg.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </div>
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
                  .filter(
                    (service) =>
                      service.sName
                        .toLowerCase()
                        .includes(serviceSearchText.toLowerCase()) &&
                      (!selectedVehicleData ||
                        service.vType === selectedVehicleData.vehicleType)
                  )
                  .sort((a, b) => a.sName.localeCompare(b.sName)) // ✅ Sort alphabetically
                  .map((service) => (
                    <div key={service.sId} className="w-full">
                      <Chip
                        label={service.sName}
                        onClick={(e) => {
                          e.preventDefault();
                          handleServiceSelect(service.sId);
                          setExpandedService(
                            expandedService === service.sId ? null : service.sId
                          );
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
                        className="mb-2 transition duration-300 hover:shadow-lg"
                      />

                      <Collapse
                        in={
                          expandedService === service.sId &&
                          selectedServices.has(service.sId)
                        }
                        timeout="auto"
                      >
                        {service.subServices && (
                          <div className="ml-4 mt-2">
                            {service.subServices.map((subService) =>
                              subService.sName.map((name, idx) => (
                                <Chip
                                  key={`${service.sId}-${name}-${idx}`}
                                  label={name}
                                  size="small"
                                  className={`m-1 transition duration-300 ${
                                    selectedSubServices[service.sId]?.includes(
                                      name
                                    )
                                      ? "bg-green-500 text-white"
                                      : "hover:bg-gray-200"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // For "Steer Tires" and "DPF Clean", allow only one selection
                                    if (
                                      service.sName === "Steer Tires" ||
                                      service.sName === "DPF Clean"
                                    ) {
                                      const newSubServices = {
                                        ...selectedSubServices,
                                        [service.sId]: [name],
                                      };
                                      setSelectedSubServices(newSubServices);
                                    } else {
                                      // For other services, allow multiple selections
                                      handleSubserviceToggle(service.sId, name);
                                    }
                                  }}
                                />
                              ))
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
                    <TextField
                      fullWidth
                      label="Hours"
                      type="number"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="mb-4 rounded-lg"
                    />
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      className="mb-4 rounded-lg"
                    />
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
            {isEditing ? "Update Record" : "Save Record"}
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
        // <div ref={printRef} className="table-container">
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
                  {records.some((record) => record.miles > 0) && (
                    <TableCell>Miles</TableCell>
                  )}
                  {records.some((record) => record.hours < 0) && (
                    <TableCell>Hours</TableCell>
                  )}
                  <TableCell>Services</TableCell>
                  <TableCell>Workshop Name</TableCell>

                  {records.some((record) => record.description) && (
                    <TableCell>Description</TableCell>
                  )}

                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    component={Link}
                    href={`/records/${record.id}`}
                    className="link"
                  >
                    <TableCell className="table-cell">
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="table-cell">
                      {record.invoice && record.invoice.trim() !== ""
                        ? record.invoice
                        : "N/A"}
                    </TableCell>
                    <TableCell className="table-cell">
                      {record.vehicleDetails.companyName} ({" "}
                      {record.vehicleDetails.vehicleNumber})
                    </TableCell>

                    {record.miles > 0 && (
                      <TableCell className="table-cell">
                        {record.miles}
                      </TableCell>
                    )}
                    {record.hours > 0 && (
                      <TableCell className="table-cell">
                        {record.hours}
                      </TableCell>
                    )}
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

                    <TableCell className="table-cell">
                      {record.description && record.description.trim() !== ""
                        ? record.description
                        : "N/A"}
                    </TableCell>

                    <TableCell>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleEditRecord(record)}
                        >
                          Edit
                        </Button>

                        <Link href={`/records/${record.id}`} passHref>
                          <Button
                            variant="outlined"
                            color="secondary"
                            component="a"
                          >
                            View
                          </Button>
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
