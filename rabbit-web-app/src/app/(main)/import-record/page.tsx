"use client";

import { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { read, utils } from "xlsx";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  arrayUnion,
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
import {
  FaFileDownload,
  FaArrowLeft,
  FaCloudUploadAlt,
  FaImage,
  FaTrash,
  FaCheckCircle,
} from "react-icons/fa";

export interface VehicleServiceEntry {
  serviceId: string;
  serviceName: string;
  type?: string;
  defaultNotificationValue?: number;
  nextNotificationValue?: number | string;
  subServices?: Array<{ name: string; id: string } | string>;
}

export interface VehicleTypes {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  companyName: string;
  engineName?: string;
  engineNumber?: string;
  currentMiles?: string;
  hoursReading?: string;
  active?: boolean;
  services?: VehicleServiceEntry[];
}

export interface ServiceDataDefaultValue {
  brand: string;
  value: number | string;
  type: string;
}

export interface ServiceData {
  sId: string;
  sName: string;
  vType: string;
  dValues: ServiceDataDefaultValue[];
  subServices?: Array<{ sName: string[] | string }>;
}

export interface ExcelRecordRow {
  vehicleNumber?: string;
  companyName?: string;
  vehicleType?: string;
  date?: string | number;
  miles?: string | number;
  hours?: string | number;
  services?: string;
  serviceNames?: string;
  subServices?: string;
  workshopName?: string;
  invoice?: string;
  invoiceAmount?: string | number;
  description?: string;
}

export interface RowImageData {
  file: File;
  preview: string;
}

export default function ImportRecordsPage() {
  const { user } = useAuth() || { user: null };
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [excelData, setExcelData] = useState<ExcelRecordRow[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [servicesData, setServicesData] = useState<ServiceData[]>([]);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  // Map of rowIndex (number) -> { file: File, preview: string }
  const [rowImages, setRowImages] = useState<Record<number, RowImageData>>({});
  const [savingProgress, setSavingProgress] = useState<string>("");

  const sampleFiles = {
    truckSingle: "/records/truck_sample_record.xlsx",
    trailerSingle: "/records/trailer_sample_record.xlsx",
    truckBulk: "/records/truck_bulk_records_sample.xlsx",
    truckMultiServicesBulk: "/records/truck_multi_services_bulk_sample.xlsx",
    trailerBulk: "/records/trailer_bulk_records_sample.xlsx",
    trailerMultiServicesBulk: "/records/trailer_multi_services_bulk_sample.xlsx",
    truckServicesList: "/records/truck_services_sample_list.xlsx",
    trailerServicesList: "/records/trailer_services_sample_list.xlsx",
    servicesList: "/records/truck_trailer_services_list.xlsx",
  };

  // 1. Fetch user data and determine effectiveUserId
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || "");

          if (userData.role === "SubOwner" && userData.createdBy) {
            setEffectiveUserId(userData.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  // 2. Fetch vehicles & services metadata
  useEffect(() => {
    if (!effectiveUserId) return;

    const fetchData = async () => {
      try {
        // Fetch active vehicles
        const vehiclesRef = collection(
          db,
          "Users",
          effectiveUserId,
          "Vehicles"
        );
        const q = query(vehiclesRef, where("active", "==", true));
        const vehicleSnap = await getDocs(q);
        const vList: VehicleTypes[] = vehicleSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            vehicleNumber: data.vehicleNumber || "",
            vehicleType: data.vehicleType || "Truck",
            companyName: data.companyName || "",
            engineName: data.engineName || data.engineNumber || "",
            engineNumber: data.engineNumber || data.engineName || "",
            currentMiles: data.currentMiles || "",
            hoursReading: data.hoursReading || "",
            active: data.active ?? true,
            services: data.services || [],
          };
        });
        setVehicles(vList);

        // Fetch services metadata
        const servicesDocRef = doc(db, "metadata", "serviceData");
        const servicesSnap = await getDoc(servicesDocRef);
        if (servicesSnap.exists()) {
          const rawServices = servicesSnap.data()?.data || [];
          setServicesData(rawServices as ServiceData[]);
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
        toast.error("Error loading vehicles or services data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [effectiveUserId]);

  const convertExcelDate = (excelDate: number): string => {
    const utcDays = Math.floor(excelDate - 25569);
    const utcValue = utcDays * 86400 * 1000;
    const dateInfo = new Date(utcValue);
    const timezoneOffset = dateInfo.getTimezoneOffset() * 60000;
    const localDate = new Date(utcValue + timezoneOffset);
    return format(localDate, "yyyy-MM-dd");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setIsParsing(true);
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = read(data, { type: "array", cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const jsonData = utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: "yyyy-mm-dd",
        }) as ExcelRecordRow[];

        const processedData = jsonData.map((item) => {
          // Normalize date
          if (item.date) {
            if (typeof item.date === "number") {
              item.date = convertExcelDate(item.date);
            } else if (typeof item.date === "string") {
              const strDate = item.date.trim();
              try {
                const parsed = new Date(strDate);
                if (!isNaN(parsed.getTime())) {
                  item.date = format(parsed, "yyyy-MM-dd");
                }
              } catch (err) {
                console.warn(`Could not parse date: ${item.date}`, err);
              }
            }
          } else {
            item.date = format(new Date(), "yyyy-MM-dd");
          }

          // Normalize serviceNames or services
          if (!item.services && item.serviceNames) {
            item.services = item.serviceNames;
          }

          return item;
        });

        setExcelData(processedData);
        setRowImages({});
        if (processedData.length === 0) {
          toast.warning("The uploaded Excel file contains no data rows.");
        } else {
          toast.success(`Parsed ${processedData.length} record(s) from Excel.`);
        }
      } catch (error) {
        console.error("Failed to parse Excel:", error);
        toast.error("Failed to parse Excel file: " + error);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle per-row image upload
  const handleRowImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRowImages((prev) => ({
            ...prev,
            [index]: {
              file,
              preview: event.target?.result as string,
            },
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveRowImage = (index: number) => {
    setRowImages((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  // Upload an individual file to Firebase Storage
  const uploadSingleImage = async (
    file: File,
    vehicleNumber: string
  ): Promise<string> => {
    if (!effectiveUserId) return "";

    try {
      const sanitizedNumber = (vehicleNumber || "vehicle").replace(/[^a-zA-Z0-9]/g, "_");
      const storageRef = ref(
        storage,
        `service-records/${effectiveUserId}/${Date.now()}_${sanitizedNumber}_${file.name}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          () => {},
          (error) => {
            console.error("Upload error for image:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in uploadSingleImage:", error);
      return "";
    }
  };

  const saveRecordRow = async (
    row: ExcelRecordRow,
    rowIndex: number,
    imageUrl: string
  ) => {
    if (!effectiveUserId) throw new Error("User not authenticated");

    const vehicleNumber = row.vehicleNumber?.toString().trim().toUpperCase();
    if (!vehicleNumber) {
      throw new Error(`Row ${rowIndex}: Vehicle Number is required`);
    }

    // Match vehicle in user active vehicles
    const matchedVehicle = vehicles.find(
      (v) =>
        v.vehicleNumber?.toString().trim().toUpperCase() === vehicleNumber
    );

    if (!matchedVehicle) {
      throw new Error(
        `Row ${rowIndex}: Vehicle with number "${vehicleNumber}" not found in your active vehicles list.`
      );
    }

    const vehicleId = matchedVehicle.id;
    const vehicleType = matchedVehicle.vehicleType || (row.vehicleType ? String(row.vehicleType) : "Truck");
    const engineName = (
      matchedVehicle.engineName ||
      matchedVehicle.engineNumber ||
      ""
    ).toString().toUpperCase();

    const milesNum = row.miles ? Number(row.miles) : (vehicleType === "Truck" ? Number(matchedVehicle.currentMiles || 0) : 0);
    const hoursNum = row.hours ? Number(row.hours) : (vehicleType === "Trailer" ? Number(matchedVehicle.hoursReading || 0) : 0);

    const recordDate = row.date?.toString().trim() || format(new Date(), "yyyy-MM-dd");

    // Process services list from string
    const rawServicesString = (row.services || row.serviceNames || "").toString();
    const serviceNameList = rawServicesString
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (serviceNameList.length === 0) {
      throw new Error(
        `Row ${rowIndex}: At least one service is required (e.g. Oil Change/Service)`
      );
    }

    // Sub-services list
    const rawSubServicesString = (row.subServices || "").toString();
    const subServiceNameList = rawSubServicesString
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Fetch existing vehicle services
    const vehicleRef = doc(db, "Users", effectiveUserId, "Vehicles", vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    const currentVehicleServices: VehicleServiceEntry[] = vehicleDoc.exists()
      ? vehicleDoc.data()?.services || []
      : [];

    const updatedVehicleServices: VehicleServiceEntry[] = [...currentVehicleServices];
    const servicesDataForRecord = [];
    const notificationData = [];

    for (const sName of serviceNameList) {
      // Find matching service metadata (normalizing slashes and whitespace)
      const cleanSName = sName.toLowerCase().replace(/\s*\/\s*/g, "/").trim();
      const matchedMeta =
        servicesData.find(
          (s) =>
            s.sName?.toLowerCase().replace(/\s*\/\s*/g, "/").trim() === cleanSName &&
            (!s.vType || s.vType.toLowerCase() === vehicleType.toLowerCase())
        ) ||
        servicesData.find(
          (s) => s.sName?.toLowerCase().replace(/\s*\/\s*/g, "/").trim() === cleanSName
        );

      const serviceId =
        matchedMeta?.sId ||
        `srv_${sName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      const existingIdx = updatedVehicleServices.findIndex(
        (s) =>
          s.serviceId === serviceId ||
          s.serviceName?.toLowerCase() === sName.toLowerCase()
      );

      let defaultValue = 0;
      let type = vehicleType === "Trailer" ? "hours" : "reading";

      if (existingIdx >= 0) {
        type = updatedVehicleServices[existingIdx].type || type;
        defaultValue =
          updatedVehicleServices[existingIdx].defaultNotificationValue || 0;
      } else if (matchedMeta) {
        const matchingDValue = matchedMeta.dValues?.find(
          (dv) => dv.brand?.toString().toUpperCase() === engineName
        );
        type = (
          matchingDValue?.type ||
          (vehicleType === "Trailer" ? "hours" : "reading")
        ).toLowerCase();
        defaultValue = matchingDValue?.value ? Number(matchingDValue.value) : 0;
      }

      // Calculate next notification
      let nextNotificationValue: number | string = 0;
      if (defaultValue > 0) {
        if (type === "reading") {
          nextNotificationValue = milesNum + defaultValue;
        } else if (type === "hours") {
          nextNotificationValue = hoursNum + defaultValue;
        } else if (type === "day") {
          const baseD = new Date(recordDate);
          const nextD = new Date(baseD);
          nextD.setDate(baseD.getDate() + Number(defaultValue));
          nextNotificationValue = format(nextD, "dd-MM-yyyy");
        }
      }

      const serviceRecordEntry = {
        serviceId,
        serviceName: matchedMeta?.sName || sName,
        type,
        defaultNotificationValue: defaultValue,
        nextNotificationValue,
        subServices: subServiceNameList.map((subName, i) => ({
          name: subName,
          id: `${serviceId}_${subName.replace(/\s+/g, "_")}_${i}`,
        })),
      };

      servicesDataForRecord.push(serviceRecordEntry);

      notificationData.push({
        serviceName: matchedMeta?.sName || sName,
        type,
        nextNotificationValue,
        subServices: subServiceNameList,
      });

      if (existingIdx >= 0) {
        updatedVehicleServices[existingIdx] = {
          ...updatedVehicleServices[existingIdx],
          nextNotificationValue,
        };
      } else {
        updatedVehicleServices.push({
          ...serviceRecordEntry,
          nextNotificationValue,
        });
      }
    }

    // Build Record Data
    const recordId = doc(collection(db, "temp")).id;
    const currentMilesStr = milesNum.toString();

    const recordData = {
      userId: effectiveUserId,
      vehicleId,
      imageUrl: imageUrl || "",
      vehicleDetails: {
        ...matchedVehicle,
        currentMiles: currentMilesStr,
        nextNotificationMiles: notificationData,
      },
      services: servicesDataForRecord,
      currentMilesArray: [{ miles: milesNum, date: recordDate }],
      miles: vehicleType === "Truck" ? milesNum : 0,
      hours: vehicleType === "Trailer" ? hoursNum : 0,
      totalMiles: milesNum,
      date: recordDate,
      workshopName: row.workshopName?.toString().trim() || "",
      invoice: row.invoice?.toString().trim() || "",
      invoiceAmount: row.invoiceAmount?.toString().trim() || "",
      description: row.description?.toString().trim() || "",
      createdAt: format(new Date(), "yyyy-MM-dd"),
      updatedAt: format(new Date(), "yyyy-MM-dd"),
      active: true,
      addedFrom: "Web Excel Import",
    };

    const batch = writeBatch(db);

    // Determine Owner ID
    const currentUserDoc = await getDoc(doc(db, "Users", effectiveUserId));
    const isTeamMember = currentUserDoc.data()?.isTeamMember;
    const ownerId = isTeamMember
      ? currentUserDoc.data()?.createdBy
      : effectiveUserId;

    // 1. Owner DataServices
    const ownerRecordRef = doc(db, "Users", ownerId, "DataServices", recordId);
    batch.set(ownerRecordRef, recordData);

    // 2. Global DataServicesRecords
    const globalRecordRef = doc(db, "DataServicesRecords", recordId);
    batch.set(globalRecordRef, { ...recordData, id: recordId });

    // 3. Owner Vehicle update
    const ownerVehicleRef = doc(db, "Users", ownerId, "Vehicles", vehicleId);
    batch.update(ownerVehicleRef, {
      services: updatedVehicleServices,
      currentMiles: currentMilesStr,
      currentMilesArray: arrayUnion({
        miles: milesNum,
        date: recordDate,
      }),
      nextNotificationMiles: notificationData,
      ...(vehicleType === "Trailer"
        ? { hoursReading: hoursNum.toString() }
        : {}),
    });

    // 4. Team Members sync
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
        vehicleId
      );
      const memberVehicleSnap = await getDoc(memberVehicleRef);

      if (memberVehicleSnap.exists()) {
        batch.update(memberVehicleRef, {
          services: updatedVehicleServices,
          currentMiles: currentMilesStr,
          currentMilesArray: arrayUnion({
            miles: milesNum,
            date: recordDate,
          }),
          nextNotificationMiles: notificationData,
          ...(vehicleType === "Trailer"
            ? { hoursReading: hoursNum.toString() }
            : {}),
        });

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

    // 5. If current user is team member
    if (isTeamMember && effectiveUserId !== ownerId) {
      const currentMemberRecordRef = doc(
        db,
        "Users",
        effectiveUserId,
        "DataServices",
        recordId
      );
      batch.set(currentMemberRecordRef, recordData);
    }

    await batch.commit();

    // Trigger cloud function notification (commented out)
    // try {
    //   const checkDataServices = httpsCallable(
    //     functions,
    //     "checkDataServicesAndNotify"
    //   );
    //   await checkDataServices({ userId: ownerId, vehicleId });
    // } catch (e) {
    //   console.warn("Cloud function notify warning:", e);
    // }

    return true;
  };

  const handleUpload = async () => {
    if (!excelData.length) return;

    setIsSaving(true);
    setUploadErrors([]);
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      setSavingProgress(`Saving record ${i + 1} of ${excelData.length} (${row.vehicleNumber || ""})...`);

      try {
        // Upload row-specific image if present
        let rowImageUrl = "";
        if (rowImages[i]?.file) {
          setSavingProgress(`Uploading image for record ${i + 1} (${row.vehicleNumber || ""})...`);
          rowImageUrl = await uploadSingleImage(
            rowImages[i].file,
            row.vehicleNumber || `record_${i + 1}`
          );
        }

        await saveRecordRow(row, i + 1, rowImageUrl);
        successCount++;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        errors.push(msg);
      }
    }

    setUploadErrors(errors);
    setIsSaving(false);
    setSavingProgress("");

    if (successCount > 0) {
      toast.success(
        `Successfully imported ${successCount} service record(s)!`,
        {
          autoClose: 4000,
        }
      );
      setTimeout(() => {
        router.push("/records");
      }, 1500);
    }

    if (errors.length > 0) {
      toast.error(
        `${errors.length} record(s) failed to import. See details below.`
      );
    }
  };

  const attachedImagesCount = Object.keys(rowImages).length;

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/records">
            <Button variant="outline" className="flex items-center gap-2">
              <FaArrowLeft /> Back to Records
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Import Service Records
          </h1>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowSampleModal(true)}
          className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          <FaFileDownload /> Download Sample Excels
        </Button>
      </div>

      {userRole === "SubOwner" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            Importing service records to Owner&apos;s account
          </p>
        </div>
      )}

      {/* 1. Upload Excel Card */}
      <Card className="p-6 mb-6 shadow-sm border border-gray-200">
        <div className="space-y-6">
          <div>
            <Label
              htmlFor="excelFile"
              className="text-base font-semibold mb-3 block text-gray-800"
            >
              Upload Records Excel File (.xlsx)
            </Label>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50/60 hover:border-rose-400 transition-colors flex flex-col items-center justify-center text-center">
              <FaCloudUploadAlt className="w-12 h-12 text-rose-500 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Select your Excel records file to upload
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Supports single or bulk service records for Trucks (with miles)
                and Trailers (with hours)
              </p>

              <div className="w-full max-w-2xl">
                <input
                  id="excelFile"
                  type="file"
                  accept=".xlsx, .xls"
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
            </div>
          </div>

          {/* Sample Download Links */}
          <div className="pt-4 border-t flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
              Sample Templates:
            </span>
            <Button variant="outline" asChild size="sm">
              <Link href={sampleFiles.truckSingle} download>
                <FaFileDownload className="mr-2 text-rose-500" /> Truck Single (ACHA9999)
              </Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href={sampleFiles.truckMultiServicesBulk} download>
                <FaFileDownload className="mr-2 text-purple-600" /> Truck Bulk Multi-Services (10-30 Services)
              </Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href={sampleFiles.trailerSingle} download>
                <FaFileDownload className="mr-2 text-blue-500" /> Trailer Single (BZ88BS77)
              </Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href={sampleFiles.trailerMultiServicesBulk} download>
                <FaFileDownload className="mr-2 text-indigo-600" /> Trailer Bulk Multi-Services (8-16 Services)
              </Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href={sampleFiles.truckServicesList} download>
                <FaFileDownload className="mr-2 text-emerald-500" /> Truck Services List (56)
              </Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href={sampleFiles.trailerServicesList} download>
                <FaFileDownload className="mr-2 text-teal-600" /> Trailer Services List (18)
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Preview Data with Per-Record Image Upload */}
      {excelData.length > 0 && (
        <>
          <Card className="p-6 mb-6 shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  Preview Data ({excelData.length} Records)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Each record below has its own optional service image upload. Upload individual invoices, receipts, or inspection photos per record.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {attachedImagesCount > 0 ? (
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <FaCheckCircle className="text-emerald-600" />
                    {attachedImagesCount} of {excelData.length} images attached
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-600 font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <FaImage className="text-gray-500" />
                    0 of {excelData.length} images attached (optional)
                  </span>
                )}

                {attachedImagesCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRowImages({})}
                    className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                  >
                    Clear All Images
                  </Button>
                )}
              </div>
            </div>

            {/* Parsed Data Table with Image Upload Column per Row */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 border text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                      #
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                      Vehicle #
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                      Company
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                      Miles / Hours
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                      Services
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                      Workshop
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                      Invoice
                    </th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                      Amount
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-gray-700 min-w-[180px]">
                      Description
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap bg-blue-50/70 border-l border-blue-100">
                      Upload Service Image (Optional)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {excelData.map((row, index) => {
                    const vehicleExists = vehicles.some(
                      (v) =>
                        v.vehicleNumber?.toString().trim().toUpperCase() ===
                        row.vehicleNumber?.toString().trim().toUpperCase()
                    );
                    const rowImg = rowImages[index];

                    return (
                      <tr
                        key={index}
                        className={
                          vehicleExists
                            ? "hover:bg-gray-50/80"
                            : "bg-red-50/80 hover:bg-red-100/80"
                        }
                      >
                        <td className="px-4 py-3 font-medium text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          {String(row.vehicleNumber || "—")}
                          {!vehicleExists && (
                            <span className="block text-[11px] text-red-600 font-normal mt-0.5">
                              Vehicle not found
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {String(row.companyName || "—")}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {String(row.date || "—")}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                          {row.miles
                            ? `${row.miles} mi`
                            : row.hours
                            ? `${row.hours} hrs`
                            : "—"}
                        </td>
                        <td
                          className="px-5 py-3 text-gray-800"
                          title={String(row.services || row.serviceNames || "")}
                        >
                          <span className="inline-block bg-rose-50 text-rose-700 text-xs px-2 py-1 rounded font-medium border border-rose-200/60">
                            {String(row.services || row.serviceNames || "—")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {String(row.workshopName || "—")}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {String(row.invoice || "—")}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {row.invoiceAmount ? `$${row.invoiceAmount}` : "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-600 text-xs">
                          {String(row.description || "—")}
                        </td>

                        {/* Individual Upload Service Image Section */}
                        <td className="px-5 py-3 bg-blue-50/30 border-l border-blue-100 min-w-[240px]">
                          {rowImg ? (
                            <div className="flex items-center gap-2.5 p-1.5 bg-white rounded-lg border border-blue-200 shadow-2xs">
                              <Image
                                src={rowImg.preview}
                                alt={`Record ${index + 1} Image`}
                                width={38}
                                height={38}
                                className="object-contain rounded border bg-gray-50 h-9 w-9 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate" title={rowImg.file.name}>
                                  {rowImg.file.name}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {(rowImg.file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRowImage(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                title="Remove Image"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          ) : (
                            <label
                              htmlFor={`image-upload-${index}`}
                              className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-blue-300 bg-blue-50/60 hover:bg-blue-100/70 hover:border-blue-500 text-xs font-medium text-blue-700 transition-all"
                            >
                              <FaImage className="text-blue-500 shrink-0" />
                              <span>Upload Image</span>
                              <input
                                id={`image-upload-${index}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleRowImageChange(index, e)}
                                disabled={isParsing || isSaving}
                              />
                            </label>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {isSaving && savingProgress && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm font-medium flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
              {savingProgress}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={isSaving}
            className="w-full bg-[#F96176] hover:bg-[#e05064] text-white py-3.5 text-lg font-semibold flex items-center justify-center gap-2 shadow-sm rounded-lg transition-colors"
          >
            <FaCloudUploadAlt className="text-xl" />
            {isSaving
              ? "Saving & Syncing Records..."
              : `Upload & Save ${excelData.length} Records (${attachedImagesCount} image${attachedImagesCount === 1 ? "" : "s"})`}
          </Button>
        </>
      )}

      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <Card className="p-6 mt-6 border-red-200 bg-red-50">
          <h2 className="text-xl font-bold mb-4 text-red-600">Import Errors</h2>
          <div className="space-y-2">
            {uploadErrors.map((error, index) => (
              <p key={index} className="text-red-700 text-sm">
                • {error}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Sample Modal */}
      <Modal show={showSampleModal} onClose={() => setShowSampleModal(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Download Sample Excel Files</h3>
          <p className="text-sm text-gray-600 mb-6">
            Choose a sample file below. Pre-filled with accurate truck and trailer details matching the database.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href={sampleFiles.truckSingle} download>
                <FaFileDownload className="mr-2 text-rose-500" />
                Truck Single Record Sample (ACHA9999 / VOLVO)
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={sampleFiles.truckMultiServicesBulk} download>
                <FaFileDownload className="mr-2 text-purple-600" />
                Truck Bulk Multi-Services (10, 20, 30 Services with Sub-Services)
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={sampleFiles.truckBulk} download>
                <FaFileDownload className="mr-2 text-purple-400" />
                Truck Bulk Sample (6 Records - Single Service)
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={sampleFiles.trailerSingle} download>
                <FaFileDownload className="mr-2 text-blue-500" />
                Trailer Single Record Sample (BZ88BS77 / HYUNDAI)
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={sampleFiles.trailerMultiServicesBulk} download>
                <FaFileDownload className="mr-2 text-indigo-600" />
                Trailer Bulk Multi-Services (8 to 16 Services with Sub-Services)
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={sampleFiles.trailerBulk} download>
                <FaFileDownload className="mr-2 text-indigo-400" />
                Trailer Bulk Sample (9 Records - Single Service)
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={sampleFiles.truckServicesList} download>
                <FaFileDownload className="mr-2 text-emerald-500" />
                Truck Services Reference List (56 Services & Sub-Services)
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={sampleFiles.trailerServicesList} download>
                <FaFileDownload className="mr-2 text-teal-600" />
                Trailer Services Reference List (18 Services & Sub-Services)
              </Link>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
