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
  FaLayerGroup,
  FaWrench,
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
  myCompany?: string;
  mycomId?: string;
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

export interface GroupedServiceItem {
  serviceName: string;
  subServices: string[];
}

export interface GroupedRecord {
  groupKey: string;
  vehicleNumber: string;
  companyName: string;
  vehicleType?: string;
  date: string;
  miles?: number | string;
  hours?: number | string;
  services: GroupedServiceItem[];
  workshopName: string;
  invoice: string;
  invoiceAmount: string | number;
  description: string;
  rawRowCount: number;
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
  const [groupedRecords, setGroupedRecords] = useState<GroupedRecord[]>([]);
  const [totalExcelRowsCount, setTotalExcelRowsCount] = useState<number>(0);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [servicesData, setServicesData] = useState<ServiceData[]>([]);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  // Map of group index (number) -> { file: File, preview: string }
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
        } else {
          setEffectiveUserId(user.uid);
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
            myCompany: data.myCompany || "",
            mycomId: data.mycomId || "",
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

  // Group multiple Excel rows by Vehicle + Invoice (or Date + Workshop)
  const groupExcelRows = (rows: ExcelRecordRow[]): GroupedRecord[] => {
    const groupsMap = new Map<string, GroupedRecord>();

    rows.forEach((row, index) => {
      const vNum = (row.vehicleNumber || "").toString().trim().toUpperCase();
      if (!vNum) return; // Ignore empty rows without vehicle number

      const invoice = (row.invoice || "").toString().trim();
      let recordDate = "";
      if (row.date) {
        if (typeof row.date === "number") {
          recordDate = convertExcelDate(row.date);
        } else if (typeof row.date === "string") {
          const strDate = row.date.trim();
          try {
            const parsed = new Date(strDate);
            if (!isNaN(parsed.getTime())) {
              recordDate = format(parsed, "yyyy-MM-dd");
            } else {
              recordDate = strDate;
            }
          } catch {
            recordDate = strDate;
          }
        }
      } else {
        recordDate = format(new Date(), "yyyy-MM-dd");
      }

      const workshopName = (row.workshopName || "").toString().trim();

      // Determine Group Key:
      // If invoice number is provided, group strictly by VehicleNumber + Invoice
      // Otherwise group by VehicleNumber + Date + Workshop
      let groupKey = "";
      if (invoice) {
        groupKey = `${vNum}___INV___${invoice.toUpperCase()}`;
      } else {
        groupKey = `${vNum}___DATE___${recordDate}___WS___${workshopName.toUpperCase()}___ROW___${index}`;
      }

      // Parse services from row
      const rawServicesStr = (row.services || row.serviceNames || "").toString();
      const serviceNamesList = rawServicesStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Parse subservices from row
      const rawSubServicesStr = (row.subServices || "").toString();
      const subServicesList = rawSubServicesStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          groupKey,
          vehicleNumber: vNum,
          companyName: (row.companyName || "").toString().trim(),
          vehicleType: (row.vehicleType || "").toString().trim(),
          date: recordDate,
          miles: row.miles ? String(row.miles).trim() : undefined,
          hours: row.hours ? String(row.hours).trim() : undefined,
          workshopName,
          invoice,
          invoiceAmount: row.invoiceAmount ? String(row.invoiceAmount).trim() : "",
          description: (row.description || "").toString().trim(),
          services: [],
          rawRowCount: 0,
        });
      }

      const currentGroup = groupsMap.get(groupKey)!;
      currentGroup.rawRowCount += 1;

      // Fill in any fields that were empty in previous rows
      if (!currentGroup.companyName && row.companyName) {
        currentGroup.companyName = row.companyName.toString().trim();
      }
      if (!currentGroup.miles && row.miles) {
        currentGroup.miles = String(row.miles).trim();
      }
      if (!currentGroup.hours && row.hours) {
        currentGroup.hours = String(row.hours).trim();
      }
      if (!currentGroup.invoiceAmount && row.invoiceAmount) {
        currentGroup.invoiceAmount = String(row.invoiceAmount).trim();
      }
      if (!currentGroup.workshopName && row.workshopName) {
        currentGroup.workshopName = row.workshopName.toString().trim();
      }
      if (!currentGroup.description && row.description) {
        currentGroup.description = row.description.toString().trim();
      }

      // Add services & map subservices
      serviceNamesList.forEach((sName) => {
        const existingService = currentGroup.services.find(
          (s) => s.serviceName.toLowerCase() === sName.toLowerCase()
        );

        if (existingService) {
          // Merge subservices avoiding duplicates
          subServicesList.forEach((sub) => {
            if (
              !existingService.subServices.some(
                (existingSub) =>
                  existingSub.toLowerCase() === sub.toLowerCase()
              )
            ) {
              existingService.subServices.push(sub);
            }
          });
        } else {
          currentGroup.services.push({
            serviceName: sName,
            subServices: [...subServicesList],
          });
        }
      });
    });

    return Array.from(groupsMap.values());
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

        setTotalExcelRowsCount(jsonData.length);

        const grouped = groupExcelRows(jsonData);
        setGroupedRecords(grouped);
        setRowImages({});

        if (grouped.length === 0) {
          toast.warning("The uploaded Excel file contains no valid vehicle records.");
        } else {
          toast.success(
            `Parsed ${jsonData.length} Excel row(s) into ${grouped.length} unified invoice record(s)!`
          );
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

  // Handle per-record image upload
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

  // Upload image to Firebase Storage
  const uploadSingleImage = async (
    file: File,
    vehicleNumber: string
  ): Promise<string> => {
    if (!effectiveUserId) return "";

    try {
      const sanitizedNumber = (vehicleNumber || "vehicle").replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
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

  // Save 1 unified record containing all grouped services to Firestore
  const saveGroupedRecord = async (
    record: GroupedRecord,
    recordIndex: number,
    imageUrl: string
  ) => {
    if (!effectiveUserId) throw new Error("User not authenticated");

    const vehicleNumber = record.vehicleNumber.trim().toUpperCase();
    if (!vehicleNumber) {
      throw new Error(`Record #${recordIndex}: Vehicle Number is required`);
    }

    // Match vehicle in user active vehicles
    const matchedVehicle = vehicles.find(
      (v) =>
        v.vehicleNumber?.toString().trim().toUpperCase() === vehicleNumber
    );

    if (!matchedVehicle) {
      throw new Error(
        `Record #${recordIndex}: Vehicle with number "${vehicleNumber}" not found in your active vehicles list.`
      );
    }

    const vehicleId = matchedVehicle.id;
    const vehicleType =
      matchedVehicle.vehicleType || record.vehicleType || "Truck";
    const engineName = (
      matchedVehicle.engineName ||
      matchedVehicle.engineNumber ||
      ""
    )
      .toString()
      .toUpperCase();

    const milesNum = record.miles
      ? Number(record.miles)
      : vehicleType === "Truck"
      ? Number(matchedVehicle.currentMiles || 0)
      : 0;
    const hoursNum = record.hours
      ? Number(record.hours)
      : vehicleType === "Trailer"
      ? Number(matchedVehicle.hoursReading || 0)
      : 0;

    const recordDate = record.date || format(new Date(), "yyyy-MM-dd");

    if (record.services.length === 0) {
      throw new Error(
        `Record #${recordIndex}: At least one service is required for vehicle ${vehicleNumber}`
      );
    }

    // Fetch existing vehicle services
    const vehicleRef = doc(db, "Users", effectiveUserId, "Vehicles", vehicleId);
    const vehicleDoc = await getDoc(vehicleRef);
    const currentVehicleServices: VehicleServiceEntry[] = vehicleDoc.exists()
      ? vehicleDoc.data()?.services || []
      : [];

    const updatedVehicleServices: VehicleServiceEntry[] = [
      ...currentVehicleServices,
    ];
    const servicesDataForRecord = [];
    const notificationData = [];

    for (const serviceItem of record.services) {
      const sName = serviceItem.serviceName;
      const subServiceNameList = serviceItem.subServices;

      // Find matching service metadata (normalizing slashes and whitespace)
      const cleanSName = sName.toLowerCase().replace(/\s*\/\s*/g, "/").trim();
      const matchedMeta =
        servicesData.find(
          (s) =>
            s.sName?.toLowerCase().replace(/\s*\/\s*/g, "/").trim() === cleanSName &&
            (!s.vType || s.vType.toLowerCase() === vehicleType.toLowerCase())
        ) ||
        servicesData.find(
          (s) =>
            s.sName?.toLowerCase().replace(/\s*\/\s*/g, "/").trim() === cleanSName
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

    // Build Single Unified Record Data
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
      workshopName: record.workshopName,
      invoice: record.invoice,
      invoiceAmount: record.invoiceAmount,
      description: record.description,
      myCompany: matchedVehicle.myCompany || "",
      mycomId: matchedVehicle.mycomId || "",
      createdAt: format(new Date(), "yyyy-MM-dd"),
      updatedAt: format(new Date(), "yyyy-MM-dd"),
      active: true,
      addedFrom: "Web Excel Import (Line-Item Grouped)",
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
    return true;
  };

  const handleUpload = async () => {
    if (!groupedRecords.length) return;

    setIsSaving(true);
    setUploadErrors([]);
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < groupedRecords.length; i++) {
      const record = groupedRecords[i];
      setSavingProgress(
        `Saving invoice record ${i + 1} of ${groupedRecords.length} (${record.vehicleNumber}${
          record.invoice ? ` / ${record.invoice}` : ""
        })...`
      );

      try {
        // Upload row-specific image if present
        let rowImageUrl = "";
        if (rowImages[i]?.file) {
          setSavingProgress(
            `Uploading invoice image for record ${i + 1} (${record.vehicleNumber})...`
          );
          rowImageUrl = await uploadSingleImage(
            rowImages[i].file,
            record.vehicleNumber || `record_${i + 1}`
          );
        }

        await saveGroupedRecord(record, i + 1, rowImageUrl);
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
        `Successfully imported ${successCount} service invoice record(s)!`,
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
          className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold"
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
                Supports line-item records with multiple services &amp; sub-services automatically grouped per invoice!
              </p>
              <input
                id="excelFile"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                disabled={isParsing || isSaving}
                className="block text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Parsed Data Preview Card */}
      {groupedRecords.length > 0 && (
        <>
          <Card className="p-6 mb-6 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500" />
                  Preview Grouped Records ({groupedRecords.length} Invoices / {totalExcelRowsCount} Excel Lines)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lines with the same Vehicle # and Invoice are merged into 1 unified database record with all respective services &amp; sub-services.
                </p>
              </div>

              {attachedImagesCount > 0 && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 self-start sm:self-auto">
                  {attachedImagesCount} image{attachedImagesCount === 1 ? "" : "s"} attached
                </span>
              )}
            </div>

            {/* Parsed Data Table with Nested Services & Sub-Services */}
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
                    <th className="px-5 py-3.5 text-left font-semibold text-gray-700 min-w-[280px]">
                      Services &amp; Sub-Services
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
                    <th className="px-5 py-3.5 text-left font-semibold text-gray-700 min-w-[160px]">
                      Description
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-gray-700 whitespace-nowrap bg-blue-50/70 border-l border-blue-100">
                      Upload Invoice Image (Optional)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {groupedRecords.map((record, index) => {
                    const vehicleExists = vehicles.some(
                      (v) =>
                        v.vehicleNumber?.toString().trim().toUpperCase() ===
                        record.vehicleNumber?.toString().trim().toUpperCase()
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
                        {/* Index & Merged indicator */}
                        <td className="px-4 py-3 font-medium text-gray-600 align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span>{index + 1}</span>
                            {record.rawRowCount > 1 && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200"
                                title={`Merged ${record.rawRowCount} Excel rows under this invoice`}
                              >
                                <FaLayerGroup className="text-[9px]" />
                                {record.rawRowCount} rows
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Vehicle Number */}
                        <td className="px-5 py-3 font-semibold text-gray-900 align-top">
                          {record.vehicleNumber || "—"}
                          {!vehicleExists && (
                            <span className="block text-[11px] text-red-600 font-normal mt-0.5">
                              Vehicle not found
                            </span>
                          )}
                        </td>

                        {/* Company / Make */}
                        <td className="px-4 py-3 text-gray-700 align-top">
                          {record.companyName || "—"}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap align-top">
                          {record.date || "—"}
                        </td>

                        {/* Miles / Hours */}
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap align-top">
                          {record.miles
                            ? `${record.miles} mi`
                            : record.hours
                            ? `${record.hours} hrs`
                            : "—"}
                        </td>

                        {/* Services & Sub-Services Badges */}
                        <td className="px-5 py-3 text-gray-800 align-top">
                          <div className="flex flex-col gap-2">
                            {record.services.map((srv, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-2 rounded-lg bg-rose-50/70 border border-rose-200/80"
                              >
                                <div className="font-semibold text-xs text-rose-800 flex items-center gap-1.5">
                                  <FaWrench className="text-[10px] text-rose-500" />
                                  {srv.serviceName}
                                </div>

                                {srv.subServices && srv.subServices.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5 pl-3 border-l-2 border-rose-300">
                                    {srv.subServices.map((sub, subIdx) => (
                                      <span
                                        key={subIdx}
                                        className="inline-block bg-white text-gray-700 text-[11px] px-2 py-0.5 rounded border border-gray-200 font-medium shadow-2xs"
                                      >
                                        {sub}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Workshop */}
                        <td className="px-4 py-3 text-gray-700 align-top">
                          {record.workshopName || "—"}
                        </td>

                        {/* Invoice */}
                        <td className="px-4 py-3 font-semibold text-gray-800 align-top">
                          {record.invoice || "—"}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 font-medium text-gray-800 align-top whitespace-nowrap">
                          {record.invoiceAmount ? `$${record.invoiceAmount}` : "—"}
                        </td>

                        {/* Description */}
                        <td className="px-5 py-3 text-gray-600 text-xs align-top">
                          {record.description || "—"}
                        </td>

                        {/* Individual Upload Service Image Section */}
                        <td className="px-5 py-3 bg-blue-50/30 border-l border-blue-100 min-w-[240px] align-top">
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
                                <p
                                  className="text-xs font-semibold text-gray-800 truncate"
                                  title={rowImg.file.name}
                                >
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
              : `Upload & Save ${groupedRecords.length} Record${
                  groupedRecords.length === 1 ? "" : "s"
                } (${attachedImagesCount} image${
                  attachedImagesCount === 1 ? "" : "s"
                })`}
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
                Truck Bulk Multi-Services (Line-Item Grouped with Sub-Services)
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
                Trailer Bulk Multi-Services (Line-Item Grouped with Sub-Services)
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
                Truck Services Reference List (56 Services &amp; Sub-Services)
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={sampleFiles.trailerServicesList} download>
                <FaFileDownload className="mr-2 text-teal-600" />
                Trailer Services Reference List (18 Services &amp; Sub-Services)
              </Link>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
