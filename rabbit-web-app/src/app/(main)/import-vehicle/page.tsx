"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

import { read, utils } from "xlsx";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  FieldValue,
  Timestamp,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContexts";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HashLoader } from "react-spinners";
import { format } from "date-fns";
import { FaExclamationTriangle, FaCheck } from "react-icons/fa";

export interface ExistingVehicleMatch {
  rowNumber: number;
  vehicleNumber: string;
  vehicleType: string;
  companyName: string;
  engineName: string;
  existingDocId: string;
  existingCompany?: string;
  newMiles?: string;
  newMyCompany?: string;
  newData: Partial<Vehicle>;
}

export interface Vehicle {
  firstTimeVehicle: boolean;
  id?: string;
  active: boolean;
  tripAssign: boolean;
  vehicleType: "Truck" | "Trailer";
  companyName: string;
  engineName: string;
  vehicleNumber: string;
  vin: string;
  dot?: string | null;
  iccms?: string | null;
  licensePlate: string;
  year?: string | null;
  isSet: boolean;
  uploadedDocuments: string[];
  createdAt: Timestamp | FieldValue | Date;
  currentMilesArray: Array<{
    miles: number;
    date: string;
  }>;
  services: Service[];
  currentMiles?: string;
  prevMilesValue?: string;
  firstTimeMiles?: string;
  oilChangeDate?: string;
  hoursReading?: string;
  prevHoursReadingValue?: string;
  nextNotificationMiles?: NextNotificationMile[];
  vehicleId?: string;
  myCompany?: string;
  mycomId?: string;
}

export interface Service {
  serviceId: string;
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number;
  type: string;
  subServices: string[];
  isNotification?: boolean;
}

export interface NextNotificationMile {
  serviceId: string;
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number;
  type: string;
  subServices: string[];
  isNotification?: boolean;
}

export interface ServiceData {
  sId: string;
  sName: string;
  vType: string;
  subServices: Array<{
    sName: string;
    [key: string]: string | number | boolean | undefined;
  }>;
  dValues: Array<{
    brand: string;
    value: number;
    type: string;
    [key: string]: string | number | boolean | undefined;
  }>;
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | Array<{
        sName: string;
        [key: string]: string | number | boolean | undefined;
      }>
    | Array<{
        brand: string;
        value: number;
        type: string;
        [key: string]: string | number | boolean | undefined;
      }>;
}

export default function ImportVehicle() {
  const { user } = useAuth() || { user: null };
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [excelData, setExcelData] = useState<Partial<Vehicle>[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [servicesData, setServicesData] = useState<ServiceData[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  // Overwrite Confirmation State
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [existingMatches, setExistingMatches] = useState<ExistingVehicleMatch[]>(
    []
  );
  const [isPreChecking, setIsPreChecking] = useState(false);

  // My Companies state
  const [myCompaniesList, setMyCompaniesList] = useState<
    { id: string; companyName: string }[]
  >([]);
  const [selectedMyCompanyId, setSelectedMyCompanyId] = useState<string>("");
  const [selectedMyCompanyName, setSelectedMyCompanyName] = useState<string>("");

  const router = useRouter();

  const sampleFiles = {
    truck: "/sample_excels/trenoops_truck_sample_file.xlsx",
    bulkTrucks: "/sample_excels/bulk_trucks_sample_file.xlsx",
    trailer: "/sample_excels/trenoops_trailer_sample_file.xlsx",
    bulkTrailers: "/sample_excels/bulk_trailers_sample_file.xlsx",
    truckCompanies: "/sample_excels/truck_company_nd_engine_name.xlsx",
    trailerCompanies: "/sample_excels/trailer_companies.xlsx",
  };

  // Fetch myCompanies
  const fetchMyCompanies = async (userId: string) => {
    try {
      const companiesSnapshot = await getDocs(
        collection(db, "Users", userId, "myCompanies")
      );
      const loaded: { id: string; companyName: string }[] = [];

      companiesSnapshot.forEach((docSnap) => {
        const cData = docSnap.data();
        const cName = (cData.companyName || cData.name || "").toString().trim();
        const isActive = cData.isActive !== false;
        if (cName && isActive) {
          loaded.push({ id: docSnap.id, companyName: cName });
        }
      });

      if (loaded.length === 0) {
        const userDoc = await getDoc(doc(db, "Users", userId));
        if (userDoc.exists()) {
          const rootComp = (userDoc.data().companyName || "").toString().trim();
          if (rootComp) {
            loaded.push({ id: "default", companyName: rootComp });
          }
        }
      }

      loaded.sort((a, b) => a.companyName.localeCompare(b.companyName));
      setMyCompaniesList(loaded);
      if (loaded.length > 0) {
        setSelectedMyCompanyId(loaded[0].id);
        setSelectedMyCompanyName(loaded[0].companyName);
      }
    } catch (error) {
      console.error("Error fetching myCompanies:", error);
    }
  };

  // Fetch user data and determine effectiveUserId
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || "");

          let effId = user.uid;
          if (userData.role === "SubOwner" && userData.createdBy) {
            effId = userData.createdBy;
          }

          setEffectiveUserId(effId);
          await fetchMyCompanies(effId);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        const docRef = doc(db, "metadata", "serviceData");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setServicesData(data.data || []);
        }
      } catch (error) {
        toast.error("Error fetching services data: " + error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServicesData();
  }, [user]);

  const calculateNextNotificationMiles = (
    currentMiles: number,
    vehicleType: string,
    engineName: string
  ): NextNotificationMile[] => {
    const nextNotificationMiles: NextNotificationMile[] = [];

    servicesData.forEach((service) => {
      if (service.vType === vehicleType) {
        const serviceName = service.sName;
        const serviceId = service.sId || "";
        const subServices = service.subServices || [];
        const defaultValues = service.dValues || [];

        let foundMatch = false;

        defaultValues.forEach((defaultValue) => {
          if (
            defaultValue.brand.toString().toLowerCase() ===
            engineName.toLowerCase()
          ) {
            foundMatch = true;

            const type = defaultValue.type.toString().toLowerCase();
            const value = parseInt(defaultValue.value.toString()) || 0;
            let notificationValue;

            if (type === "reading") {
              notificationValue = value * 1000;
            } else if (type === "day") {
              notificationValue = value;
            } else if (type === "hours") {
              notificationValue = value;
            } else {
              notificationValue = value;
            }

            nextNotificationMiles.push({
              serviceId: serviceId,
              serviceName: serviceName,
              defaultNotificationValue: notificationValue,
              nextNotificationValue: notificationValue,
              type: type,
              subServices: subServices.map((s) => s.sName.toString()),
              isNotification: true,
            });
          }
        });

        if (!foundMatch) {
          console.log(`No brand match found for service: ${serviceName}`);
        }
      } else {
        console.log(
          `Skipping service: ${service.sName} due to unmatched vehicle type.`
        );
      }
    });

    return nextNotificationMiles;
  };

  const convertExcelDate = (excelDate: number): string => {
    // Excel dates are based on 1900-01-01 (with 1900 incorrectly treated as a leap year)
    const utcDays = Math.floor(excelDate - 25569);
    const utcValue = utcDays * 86400 * 1000;
    const dateInfo = new Date(utcValue);

    // Adjust for timezone offset
    const timezoneOffset = dateInfo.getTimezoneOffset() * 60000;
    const localDate = new Date(utcValue + timezoneOffset);

    return format(localDate, "yyyy-MM-dd");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setIsParsing(true);
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: "array", cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const jsonData = utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: "yyyy-mm-dd",
        }) as Partial<Vehicle>[];

        // Process dates to ensure proper format
        const processedData = jsonData.map((item) => {
          // Handle year field - extract only the year (e.g. "2026"), not a full date
          if (item.year) {
            const yearStr = item.year.toString().trim();
            // If it's already a plain 4-digit year, keep it as is
            const plainYearMatch = yearStr.match(/^(\d{4})$/);
            if (plainYearMatch) {
              item.year = plainYearMatch[1];
            } else {
              // It might be a date string like "2026-01-01" — extract just the year
              try {
                const parsedDate = new Date(yearStr);
                if (!isNaN(parsedDate.getTime())) {
                  item.year = parsedDate.getFullYear().toString();
                }
              } catch (error) {
                console.warn(`Could not parse year: ${item.year} - ${error}`);
              }
            }
          }

          // Handle oilChangeDate field
          if (item.oilChangeDate) {
            if (typeof item.oilChangeDate === "number") {
              item.oilChangeDate = convertExcelDate(item.oilChangeDate);
            } else if (typeof item.oilChangeDate === "string") {
              try {
                const parsedDate = new Date(item.oilChangeDate);
                if (!isNaN(parsedDate.getTime())) {
                  item.oilChangeDate = format(parsedDate, "yyyy-MM-dd");
                }
              } catch (error) {
                console.warn(
                  `Could not parse oil change date: ${item.oilChangeDate} - ${error}`
                );
              }
            }
          }

          // Assign default My Company to each row if selected
          return {
            ...item,
            myCompany:
              item.myCompany ||
              selectedMyCompanyName ||
              (myCompaniesList.length > 0 ? myCompaniesList[0].companyName : ""),
            mycomId:
              item.mycomId ||
              selectedMyCompanyId ||
              (myCompaniesList.length > 0 ? myCompaniesList[0].id : ""),
          };
        });

        setExcelData(processedData);
      } catch (error) {
        toast.error("Failed to parse Excel file: " + error);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleApplyCompanyToAll = (compId: string) => {
    const matched = myCompaniesList.find((c) => c.id === compId);
    const cName = matched?.companyName || "";
    setSelectedMyCompanyId(compId);
    setSelectedMyCompanyName(cName);
    setExcelData((prev) =>
      prev.map((row) => ({
        ...row,
        mycomId: compId,
        myCompany: cName,
      }))
    );
    if (cName && excelData.length > 0) {
      toast.info(`Assigned "${cName}" to all ${excelData.length} vehicles`);
    }
  };

  const saveOrUpdateVehicle = async (
    data: Partial<Vehicle>,
    existingDocId?: string
  ): Promise<{ action: "added" | "updated"; vehicleNumber: string }> => {
    if (!effectiveUserId) throw new Error("User not authenticated");

    // 1. Validate required fields
    const vehicleType = data.vehicleType;
    const companyName = data.companyName?.toString().trim().toUpperCase();
    const engineName = data.engineName?.toString().trim().toUpperCase();
    const vehicleNumber = data.vehicleNumber?.toString().trim() || "";
    const assignedCompany = (
      data.myCompany ||
      selectedMyCompanyName ||
      ""
    ).trim();
    const assignedCompanyId = (
      data.mycomId ||
      selectedMyCompanyId ||
      ""
    ).trim();

    if (!vehicleType || !companyName || !engineName || !vehicleNumber) {
      throw new Error("Missing required vehicle properties");
    }

    if (!assignedCompany) {
      throw new Error(
        `Please select My Company for vehicle ${vehicleNumber || "entry"}`
      );
    }

    // 2. Vehicle type specific validation and default values
    if (vehicleType === "Truck") {
      // Current miles is optional for Truck
    } else if (vehicleType === "Trailer") {
      if (!data.hoursReading || data.hoursReading.toString().trim() === "") {
        data.hoursReading = "1000";
      } else {
        data.hoursReading = data.hoursReading.toString();
      }

      const currentDate = format(new Date(), "yyyy-MM-dd");
      data.oilChangeDate = data.oilChangeDate?.toString() || currentDate;
    }

    // 3. Calculate next notification miles
    const nextNotificationMiles = calculateNextNotificationMiles(
      vehicleType === "Truck"
        ? parseInt(data.currentMiles || "0")
        : parseInt(data.hoursReading || "0"),
      vehicleType,
      engineName
    );

    const vehiclesRef = collection(db, "Users", effectiveUserId, "Vehicles");

    if (existingDocId) {
      // OVERWRITE / UPDATE existing vehicle
      const existingDocRef = doc(
        db,
        "Users",
        effectiveUserId,
        "Vehicles",
        existingDocId
      );
      const existingDocSnap = await getDoc(existingDocRef);
      const existingData = existingDocSnap.exists()
        ? existingDocSnap.data()
        : {};

      const currentMilesNum =
        vehicleType === "Truck"
          ? parseInt(data.currentMiles || "0")
          : parseInt(data.hoursReading || "1000");

      const updatedMilesArray = [
        ...(existingData.currentMilesArray || []),
        {
          miles: currentMilesNum,
          date: new Date().toISOString(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedVehicleData: { [x: string]: any } = {
        active: true,
        vehicleType,
        companyName,
        engineName,
        vehicleNumber,
        myCompany: assignedCompany,
        mycomId: assignedCompanyId,
        vin: data.vin?.toString().trim() || existingData.vin || "",
        licensePlate:
          data.licensePlate?.toString().trim() ||
          existingData.licensePlate ||
          "",
        year: data.year?.toString().trim() || existingData.year || "",
        isSet: true,
        updatedAt: serverTimestamp(),
        nextNotificationMiles,
        services: nextNotificationMiles.map((service) => ({
          defaultNotificationValue: service.defaultNotificationValue,
          nextNotificationValue: service.nextNotificationValue,
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          type: service.type,
          subServices: service.subServices,
          isNotification: service.isNotification ?? true,
        })),
        ...(vehicleType === "Truck"
          ? {
              currentMiles:
                data.currentMiles?.toString() ||
                existingData.currentMiles ||
                "",
              prevMilesValue:
                data.currentMiles?.toString() ||
                existingData.prevMilesValue ||
                "",
              firstTimeMiles:
                existingData.firstTimeMiles ||
                data.currentMiles?.toString() ||
                "",
              currentMilesArray: updatedMilesArray,
            }
          : {
              oilChangeDate:
                data.oilChangeDate ||
                existingData.oilChangeDate ||
                format(new Date(), "yyyy-MM-dd"),
              hoursReading:
                data.hoursReading?.toString() ||
                existingData.hoursReading ||
                "1000",
              prevHoursReadingValue:
                data.hoursReading?.toString() ||
                existingData.prevHoursReadingValue ||
                "1000",
              hoursReadingArray: [
                ...(existingData.hoursReadingArray || []),
                {
                  hours: parseInt(data.hoursReading?.toString() || "1000"),
                  date: new Date().toISOString(),
                },
              ],
            }),
      };

      await updateDoc(existingDocRef, updatedVehicleData);
      return { action: "updated", vehicleNumber };
    } else {
      // Create NEW vehicle
      const vehicleData: Vehicle = {
        firstTimeVehicle: true,
        active: true,
        tripAssign: false,
        vehicleType,
        companyName,
        engineName,
        vehicleNumber,
        myCompany: assignedCompany,
        mycomId: assignedCompanyId,
        vin: data.vin?.toString().trim() || "",
        dot: "",
        iccms: "",
        licensePlate: data.licensePlate?.toString().trim() || "",
        year: data.year?.toString().trim() || "",
        isSet: true,
        uploadedDocuments: [],
        createdAt: serverTimestamp() as FieldValue,
        currentMilesArray: [
          {
            miles:
              vehicleType === "Truck"
                ? parseInt(data.currentMiles || "0")
                : parseInt(data.hoursReading || "1000"),
            date: new Date().toISOString(),
          },
        ],
        nextNotificationMiles,
        services: nextNotificationMiles.map((service) => ({
          defaultNotificationValue: service.defaultNotificationValue,
          nextNotificationValue: service.nextNotificationValue,
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          type: service.type,
          subServices: service.subServices,
          isNotification: service.isNotification ?? true,
        })),
        ...(vehicleType === "Truck"
          ? {
              currentMiles: data.currentMiles?.toString() || "",
              prevMilesValue: data.currentMiles?.toString() || "",
              firstTimeMiles: data.currentMiles?.toString() || "",
              oilChangeDate: "2025-04-12",
              hoursReading: "",
              prevHoursReadingValue: "",
              hoursReadingArray: [],
            }
          : {
              currentMiles: "",
              prevMilesValue: "",
              firstTimeMiles: "",
              oilChangeDate:
                data.oilChangeDate || format(new Date(), "yyyy-MM-dd"),
              hoursReading: data.hoursReading?.toString() || "1000",
              prevHoursReadingValue: data.hoursReading?.toString() || "1000",
              hoursReadingArray: [
                {
                  hours: parseInt(data.hoursReading?.toString() || "1000"),
                  date: new Date().toISOString(),
                },
              ],
            }),
      };

      const docRef = await addDoc(vehiclesRef, vehicleData);
      await updateDoc(docRef, { vehicleId: docRef.id });
      return { action: "added", vehicleNumber };
    }
  };

  const handleUpload = async () => {
    if (!excelData.length) return;

    // Validate that all vehicles have a company assigned
    const missingIndex = excelData.findIndex(
      (r) => !r.myCompany && !selectedMyCompanyName
    );
    if (missingIndex !== -1) {
      toast.error(
        `Row ${missingIndex + 1}: Please select 'My Company' for this vehicle before uploading.`,
        { autoClose: 5000 }
      );
      return;
    }

    if (!effectiveUserId) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setIsPreChecking(true);

      // 1. Fetch all existing vehicles for this user to check duplicates
      const vehiclesRef = collection(db, "Users", effectiveUserId, "Vehicles");
      const existingSnapshot = await getDocs(vehiclesRef);
      const existingDocs = existingSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as (Vehicle & { id: string })[];

      const duplicates: ExistingVehicleMatch[] = [];

      excelData.forEach((row, idx) => {
        const rowVehNum = (row.vehicleNumber || "")
          .toString()
          .trim()
          .toUpperCase();
        const rowVehType = (row.vehicleType || "")
          .toString()
          .trim()
          .toUpperCase();

        const match = existingDocs.find((ex) => {
          const exVehNum = (ex.vehicleNumber || "")
            .toString()
            .trim()
            .toUpperCase();
          const exVehType = (ex.vehicleType || "")
            .toString()
            .trim()
            .toUpperCase();
          return (
            exVehNum === rowVehNum &&
            (rowVehType ? exVehType === rowVehType : true)
          );
        });

        if (match) {
          duplicates.push({
            rowNumber: idx + 1,
            vehicleNumber: row.vehicleNumber || match.vehicleNumber,
            vehicleType: row.vehicleType || match.vehicleType,
            companyName: row.companyName || match.companyName,
            engineName: row.engineName || match.engineName,
            existingDocId: match.id,
            existingCompany: match.myCompany || match.companyName,
            newMiles: row.currentMiles || row.hoursReading || "",
            newMyCompany: row.myCompany || selectedMyCompanyName,
            newData: row,
          });
        }
      });

      setIsPreChecking(false);

      if (duplicates.length > 0) {
        setExistingMatches(duplicates);
        setShowOverwriteModal(true);
      } else {
        // No duplicates found, save all directly as new
        await executeUpload(false, []);
      }
    } catch (error) {
      setIsPreChecking(false);
      console.error("Error pre-checking vehicles:", error);
      toast.error("Failed to check existing vehicles: " + error);
    }
  };

  const executeUpload = async (
    allowOverwrite: boolean,
    overrideMatches?: ExistingVehicleMatch[]
  ) => {
    setShowOverwriteModal(false);
    setIsSaving(true);
    setUploadErrors([]);

    const matchesMap = new Map<string, string>();
    const currentMatches = overrideMatches || existingMatches;

    if (allowOverwrite) {
      currentMatches.forEach((m) => {
        const keyWithBoth = `${m.vehicleNumber.trim().toUpperCase()}_${m.vehicleType.trim().toUpperCase()}`;
        matchesMap.set(keyWithBoth, m.existingDocId);
        matchesMap.set(m.vehicleNumber.trim().toUpperCase(), m.existingDocId);
      });
    }

    const errors: string[] = [];
    let addedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < excelData.length; i++) {
      const data = excelData[i];
      try {
        const keyWithBoth = `${(data.vehicleNumber || "").trim().toUpperCase()}_${(data.vehicleType || "").trim().toUpperCase()}`;
        const keyNumOnly = (data.vehicleNumber || "").trim().toUpperCase();
        const existingDocId = allowOverwrite
          ? matchesMap.get(keyWithBoth) || matchesMap.get(keyNumOnly)
          : undefined;

        const res = await saveOrUpdateVehicle(data, existingDocId);
        if (res.action === "updated") {
          updatedCount++;
        } else {
          addedCount++;
        }
      } catch (error) {
        const rowNumber = i + 1;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(
          `Row ${rowNumber} (${data.vehicleNumber || "entry"}): ${errorMessage}`
        );
      }
    }

    setUploadErrors(errors);
    setIsSaving(false);

    if (addedCount > 0 || updatedCount > 0) {
      let successMsg = "";
      if (updatedCount > 0 && addedCount > 0) {
        successMsg = `Successfully updated ${updatedCount} existing and added ${addedCount} new vehicles!`;
      } else if (updatedCount > 0) {
        successMsg = `Successfully overwritten & updated ${updatedCount} vehicle(s)!`;
      } else {
        successMsg = `Successfully added ${addedCount} new vehicle(s)!`;
      }

      toast.success(successMsg, { autoClose: 5000 });
      setTimeout(() => {
        router.push("/account/my-vehicles");
      }, 1500);
    }

    if (errors.length > 0) {
      toast.error(
        `${errors.length} error(s) occurred during upload. See details below.`,
        { autoClose: 6000 }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[96%] 2xl:max-w-[1650px] mx-auto px-4 md:px-8 py-6">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-6">Import Vehicles</h1>
      {userRole === "SubOwner" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            Adding vehicle to Owner&lsquo;s account
          </p>
        </div>
      )}

      <Card className="p-4 mb-6">
        <div className="space-y-4">
          {/* Default Company (Quick Assign All) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="myCompany" className="text-base font-semibold block">
                Default My Company (Quick Assign All)
              </Label>
              <Link
                href="/my-companies"
                className="text-xs font-semibold text-[#F96176] hover:underline"
              >
                + Add / Manage Companies
              </Link>
            </div>
            <div className="flex gap-2 items-center">
              <select
                id="myCompany"
                value={selectedMyCompanyId}
                onChange={(e) => handleApplyCompanyToAll(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent bg-white text-sm"
              >
                <option value="">Select default company for all</option>
                {myCompaniesList.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.companyName}
                  </option>
                ))}
              </select>
              <Link
                href="/my-companies"
                title="Add New Company"
                className="p-3 bg-[#F96176] text-white rounded-lg hover:bg-[#e05065] transition-colors shrink-0 flex items-center justify-center h-[46px] w-[46px]"
              >
                <span className="text-xl font-bold leading-none">+</span>
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecting a company here applies it as the default for all imported vehicles. You can also customize individual vehicles in the table below.
            </p>
          </div>

          <div>
            <Label htmlFor="excelFile" className="text-base font-semibold mb-2 block">
              Upload Excel File (.xlsx)
            </Label>
            <input
              id="excelFile"
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              disabled={isParsing || isSaving}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2.5 file:px-5
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-rose-500 file:text-white
                hover:file:bg-rose-600 file:cursor-pointer
                cursor-pointer bg-white p-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Sample Files</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInstructions(true)}
              >
                Download Vehicle Template
              </Button>
              <Button variant="outline" asChild>
                <Link href={sampleFiles.bulkTrucks} download>
                  Bulk Trucks Sample (6 Vehicles)
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={sampleFiles.bulkTrailers} download>
                  Bulk Trailers Sample (9 Vehicles)
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={sampleFiles.truckCompanies} target="_blank">
                  Truck Companies & Engines
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={sampleFiles.trailerCompanies} target="_blank">
                  Trailer Companies & Engines
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {excelData.length > 0 && (
        <>
          <Card className="p-4 mb-6">
            <div className="overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Preview Data ({excelData.length} Vehicles)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Assign or change &lsquo;My Company&rsquo; for each individual vehicle before saving.
                  </p>
                </div>
              </div>
              <table className="min-w-full divide-y divide-gray-200 border text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">#</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">Vehicle #</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">Type</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">Company Make</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">Engine</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap bg-rose-50/70 border-x border-rose-200">
                      Assign My Company *
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">VIN</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">License Plate</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">Year</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">Miles / Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {excelData.map((row, index) => {
                    const isTruck = row.vehicleType === "Truck";
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold">
                          {String(row.vehicleNumber || "—")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              isTruck
                                ? "bg-rose-100 text-rose-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {String(row.vehicleType || "Truck")}
                          </span>
                        </td>
                        <td className="px-4 py-3">{String(row.companyName || "—")}</td>
                        <td className="px-4 py-3">{String(row.engineName || "—")}</td>
                        {/* Per-Vehicle Assign My Company Dropdown */}
                        <td className="px-4 py-3 min-w-[210px] bg-rose-50/30 border-x border-rose-100">
                          <select
                            value={row.mycomId || ""}
                            onChange={(e) => {
                              const compId = e.target.value;
                              const matched = myCompaniesList.find(
                                (c) => c.id === compId
                              );
                              setExcelData((prev) =>
                                prev.map((r, i) =>
                                  i === index
                                    ? {
                                        ...r,
                                        mycomId: compId,
                                        myCompany: matched?.companyName || "",
                                      }
                                    : r
                                )
                              );
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#F96176] focus:border-transparent font-medium shadow-sm"
                          >
                            <option value="">Select Company *</option>
                            {myCompaniesList.map((comp) => (
                              <option key={comp.id} value={comp.id}>
                                {comp.companyName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{String(row.vin || "—")}</td>
                        <td className="px-4 py-3">{String(row.licensePlate || "—")}</td>
                        <td className="px-4 py-3">{String(row.year || "—")}</td>
                        <td className="px-4 py-3">
                          {row.currentMiles
                            ? `${row.currentMiles} mi`
                            : row.hoursReading
                            ? `${row.hoursReading} hrs`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <Button
            onClick={handleUpload}
            disabled={isSaving || isPreChecking}
            className="w-full bg-[#F96176] hover:bg-[#e05064] text-white py-3 text-lg font-semibold cursor-pointer"
          >
            {isPreChecking
              ? "Checking for Existing Vehicles..."
              : isSaving
              ? "Saving & Uploading Vehicles..."
              : `Upload & Save ${excelData.length} Vehicles`}
          </Button>
        </>
      )}

      {uploadErrors.length > 0 && (
        <Card className="p-4 mt-6 border-red-200 bg-red-50">
          <h2 className="text-xl font-bold mb-4 text-red-600">Upload Errors</h2>
          <div className="space-y-2">
            {uploadErrors.map((error, index) => (
              <p key={index} className="text-red-600 text-sm">
                • {error}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Overwrite Confirmation Modal */}
      <Modal
        show={showOverwriteModal}
        onClose={() => setShowOverwriteModal(false)}
      >
        <div className="p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-4 text-amber-600">
            <div className="p-3 bg-amber-100 rounded-full">
              <FaExclamationTriangle className="text-2xl text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Existing Vehicle(s) Found
              </h3>
              <p className="text-sm text-gray-500">
                {existingMatches.length} vehicle(s) from your file already exist in your account.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-4 text-sm text-amber-900">
            <p className="font-semibold mb-1">
              Do you want to overwrite and update the existing vehicle details?
            </p>
            <p className="text-xs text-amber-800">
              Confirming will update their specifications (My Company, Engine, Miles/Hours, Services) with the new details from this Excel file.
            </p>
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-lg mb-6 shadow-xs">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Row</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Vehicle #</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Company</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {existingMatches.map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{m.rowNumber}</td>
                    <td className="px-3 py-2 font-bold text-gray-800">{m.vehicleNumber}</td>
                    <td className="px-3 py-2 text-gray-600">{m.vehicleType}</td>
                    <td className="px-3 py-2 text-gray-600">{m.newMyCompany || m.companyName || "—"}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        Will Overwrite
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowOverwriteModal(false)}
              className="px-4 py-2 text-gray-700 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={() => executeUpload(true)}
              className="bg-[#F96176] hover:bg-[#e05064] text-white px-5 py-2 font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <FaCheck size={14} /> Yes, Overwrite & Import All
            </Button>
          </div>
        </div>
      </Modal>

      <Modal show={showInstructions} onClose={() => setShowInstructions(false)}>
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4">Select Vehicle Template</h3>
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link href={sampleFiles.truck} download>
                Single Truck Template
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={sampleFiles.bulkTrucks} download>
                Bulk Trucks Sample (6 Vehicles)
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={sampleFiles.trailer} download>
                Single Trailer Template
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={sampleFiles.bulkTrailers} download>
                Bulk Trailers Sample (9 Vehicles)
              </Link>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
