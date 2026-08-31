/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
  arrayRemove,
  UpdateData,
  DocumentData,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import {
  FaDownload,
  FaEdit,
  FaEye,
  FaPrint,
  FaTrash,
  FaTimes,
  FaFilePdf,
  FaFileImage,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { ProfileValues } from "@/types/types";

interface VehicleDocument {
  imageUrl: string;
  text: string;
  fileType?: string;
}

interface ServiceData {
  defaultNotificationValue: number | string;
  nextNotificationValue: number | string;
  serviceId: string;
  serviceName: string;
  type: string;
  preValue?: number | string;
  isNotification?: boolean;
}

interface VehicleData {
  companyName: string;
  vehicleNumber: string;
  year?: string | null;
  dot?: string | null;
  iccms?: string | null;
  currentMiles: string;
  hoursReading: string;
  licensePlate: string;
  vin: string;
  engineName: string;
  vehicleType: string;
  uploadedDocuments: VehicleDocument[];
  services?: ServiceData[];
}

interface FileWithId {
  id: string;
  file: File;
  customText: string;
}

export default function MyVehicleDetailsScreen() {
  const params = useParams();
  const vehicleId = params?.vehicleId as string;

  const [filesToUpload, setFilesToUpload] = useState<FileWithId[]>([]);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth() || { user: null };
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState<VehicleDocument | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [role, setRole] = useState("");
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");

  // Edit Service Value Modal States
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(
    null
  );
  const [serviceNewValue, setServiceNewValue] = useState<string>("");
  const [syncScope, setSyncScope] = useState<"all" | "single">("all");
  const [isSavingService, setIsSavingService] = useState(false);
  const [matchingVehiclesCount, setMatchingVehiclesCount] = useState<number>(1);

  // Toggle Notification Modal States
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [togglingService, setTogglingService] = useState<ServiceData | null>(
    null
  );
  const [targetNotificationState, setTargetNotificationState] =
    useState<boolean>(true);
  const [notificationSyncScope, setNotificationSyncScope] = useState<
    "all" | "single"
  >("all");
  const [isTogglingNotification, setIsTogglingNotification] = useState(false);

  // 1. Fetch user data to get role and determine effectiveUserId
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserDataAndDetermineEffectiveUserId = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as ProfileValues;
          setRole(data.role);

          if (data.role === "SubOwner" && data.createdBy) {
            setEffectiveUserId(data.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserDataAndDetermineEffectiveUserId();
  }, [user?.uid]);

  // 2. Fetch current vehicle data
  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!vehicleId || !effectiveUserId) return;

      try {
        const docRef = doc(db, "Users", effectiveUserId, "Vehicles", vehicleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as VehicleData;
          setVehicleData(data);

          // Count matching vehicles in fleet with same vehicleType
          const vType = data.vehicleType || "Truck";
          const fleetQuery = query(
            collection(db, "Users", effectiveUserId, "Vehicles"),
            where("active", "==", true)
          );
          const fleetSnap = await getDocs(fleetQuery);
          const matchingCount = fleetSnap.docs.filter((d) => {
            const v = d.data();
            const docVType = (v.vehicleType || "Truck").toLowerCase();
            return docVType === vType.toLowerCase();
          }).length;
          setMatchingVehiclesCount(matchingCount || 1);
        } else {
          console.log("No such vehicle document!");
        }
      } catch (error) {
        console.error("Error fetching vehicle details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [vehicleId, effectiveUserId]);

  const handlePrint = async () => {
    const printContent = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="text-align: center; margin-bottom: 20px;">Vehicle Details</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Company Name</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.companyName || ""
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Vehicle Number</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.vehicleNumber || ""
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">License Plate</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.licensePlate || ""
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">VIN</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.vin || ""
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Engine Name</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.engineName || ""
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Vehicle Type</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.vehicleType || ""
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Year</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.year || ""
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Current Miles</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.currentMiles || ""
            }</td>
          </tr>
        </table>
      </div>
    `;

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow?.document.write(`
      <html>
        <head>
          <title>Vehicle Details - ${
            vehicleData?.vehicleNumber || "Vehicle"
          }</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 200);
          </script>
        </body>
      </html>
    `);
    printWindow?.document.close();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        customText: file.name,
      }));
      setFilesToUpload([...filesToUpload, ...newFiles]);
    }
  };

  const handleUpload = async () => {
    if (!vehicleId || !effectiveUserId || filesToUpload.length === 0) return;

    setLoading(true);
    const uploads: VehicleDocument[] = [];

    try {
      for (const { file, customText } of filesToUpload) {
        const isPdfFile =
          file.type.toLowerCase().includes("pdf") ||
          file.name.toLowerCase().endsWith(".pdf");
        const storageRef = ref(
          storage,
          `vehicle_images/${effectiveUserId}/${vehicleId}/${
            file.name
          }_${Date.now()}`
        );
        await uploadBytes(storageRef, file, {
          contentType: file.type || (isPdfFile ? "application/pdf" : "image/jpeg"),
        });
        const downloadURL = await getDownloadURL(storageRef);
        uploads.push({
          imageUrl: downloadURL,
          text: customText,
          fileType: isPdfFile ? "pdf" : "image",
        });
      }

      const docRef = doc(db, "Users", effectiveUserId, "Vehicles", vehicleId);
      await updateDoc(docRef, {
        uploadedDocuments: [
          ...(vehicleData?.uploadedDocuments || []),
          ...uploads,
        ],
      });

      toast.success("Documents uploaded successfully!");
      setFilesToUpload([]);
      window.location.reload();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Error uploading documents");
    } finally {
      setLoading(false);
    }
  };

  const isPdfDocument = (documentItem: VehicleDocument): boolean => {
    if (documentItem.fileType?.toLowerCase() === "pdf") return true;
    if (documentItem.imageUrl?.toLowerCase().includes(".pdf")) return true;
    if (documentItem.text?.toLowerCase().endsWith(".pdf")) return true;
    return false;
  };

  const handleTextChange = (id: string, newText: string) => {
    setFilesToUpload(
      filesToUpload.map((item) =>
        item.id === id ? { ...item, customText: newText } : item
      )
    );
  };

  const removeFile = (id: string) => {
    setFilesToUpload(filesToUpload.filter((item) => item.id !== id));
  };

  const confirmDelete = (doc: VehicleDocument) => {
    setDocToDelete(doc);
    setShowDeleteDialog(true);
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete || !effectiveUserId || !vehicleId) return;

    setDeleteLoading(true);
    try {
      const imageRef = ref(storage, docToDelete.imageUrl);
      await deleteObject(imageRef);

      const docRef = doc(db, "Users", effectiveUserId, "Vehicles", vehicleId);
      await updateDoc(docRef, {
        uploadedDocuments: arrayRemove(docToDelete),
      });

      setVehicleData((prev) => ({
        ...prev!,
        uploadedDocuments:
          prev?.uploadedDocuments?.filter(
            (doc) => doc.imageUrl !== docToDelete.imageUrl
          ) || [],
      }));

      toast.success("Document deleted successfully!");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Error deleting document");
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
      setDocToDelete(null);
    }
  };

  const handleViewImage = (imageUrl: string) => {
    setCurrentImage(imageUrl);
    setShowImageViewer(true);
  };

  const handleDownloadDocument = async (
    fileUrl: string,
    fileName: string,
    isPdf: boolean
  ) => {
    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = fileName?.trim() || `document-${Date.now()}`;
      if (isPdf || fileUrl.toLowerCase().includes(".pdf")) {
        a.download = cleanName.toLowerCase().endsWith(".pdf")
          ? cleanName
          : `${cleanName}.pdf`;
      } else {
        a.download = cleanName.match(/\.(jpg|jpeg|png|webp|gif)$/i)
          ? cleanName
          : `${cleanName}.jpg`;
      }
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Document downloaded successfully!");
    } catch (error) {
      console.error("Error downloading document via blob, trying direct download:", error);
      const a = document.createElement("a");
      a.href = fileUrl;
      a.target = "_blank";
      a.download = fileName || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Helper Date Functions
  // ─────────────────────────────────────────────────────────────
  const isDateString = (value: string): boolean => {
    try {
      const parts = value.split(/[-/]/);
      if (parts.length === 3) {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        return !isNaN(p0) && !isNaN(p1) && !isNaN(p2);
      }
      return false;
    } catch {
      return false;
    }
  };

  const parseDateString = (dateString: string): Date => {
    const parts = dateString.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // yyyy-mm-dd
        return new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
      } else {
        // dd-mm-yyyy or dd/mm/yyyy
        return new Date(
          parseInt(parts[2], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[0], 10)
        );
      }
    }
    return new Date();
  };

  const formatDateToString = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  };

  // ─────────────────────────────────────────────────────────────
  // 1. EDIT SERVICE INTERVAL MODAL
  // ─────────────────────────────────────────────────────────────
  const handleOpenEditModal = (service: ServiceData) => {
    setEditingService(service);
    setServiceNewValue(service.defaultNotificationValue?.toString() || "");
    setSyncScope("all");
    setShowServiceModal(true);
  };

  const calculateUpdatedServices = (
    existingServices: ServiceData[] = [],
    targetService: ServiceData,
    newValueNum: number,
    vehicleCurrentReading: number = 0
  ): ServiceData[] => {
    return existingServices.map((s) => {
      const isTarget =
        s.serviceId === targetService.serviceId ||
        s.serviceName?.toLowerCase() ===
          targetService.serviceName?.toLowerCase();

      if (!isTarget) return s;

      const currentDefault =
        typeof s.defaultNotificationValue === "string"
          ? parseInt(s.defaultNotificationValue, 10) || 0
          : s.defaultNotificationValue || 0;

      const currentNext = s.nextNotificationValue;
      let newNextValue: string | number = 0;

      if (s.type === "day") {
        if (typeof currentNext === "string" && isDateString(currentNext)) {
          const currentNextDate = parseDateString(currentNext);
          const daysDelta = newValueNum - currentDefault;
          const newNextDate = new Date(currentNextDate);
          newNextDate.setDate(newNextDate.getDate() + daysDelta);
          newNextValue = formatDateToString(newNextDate);
        } else {
          const baseDate = new Date();
          baseDate.setDate(baseDate.getDate() + newValueNum);
          newNextValue = formatDateToString(baseDate);
        }
      } else {
        // numeric (reading / hours)
        const currentNextInt =
          typeof currentNext === "string"
            ? parseInt(currentNext, 10) || 0
            : currentNext || 0;

        if (currentNextInt > 0 && currentDefault > 0) {
          const delta = newValueNum - currentDefault;
          newNextValue = currentNextInt + delta;
          if (newNextValue < newValueNum) {
            newNextValue = newValueNum;
          }
        } else {
          newNextValue = vehicleCurrentReading + newValueNum;
        }
      }

      return {
        ...s,
        defaultNotificationValue: newValueNum,
        nextNotificationValue: newNextValue,
        preValue: currentDefault,
        isNotification: s.isNotification !== false,
      };
    });
  };

  const calculateUpdatedNextNotificationMiles = (
    existingList: Array<Record<string, unknown>> = [],
    targetService: ServiceData,
    newValueNum: number,
    vehicleCurrentReading: number = 0
  ): Array<Record<string, unknown>> => {
    return existingList.map((s) => {
      const isTarget =
        (s.serviceId && s.serviceId === targetService.serviceId) ||
        (s.sId && s.sId === targetService.serviceId) ||
        (typeof s.serviceName === "string" &&
          s.serviceName.toLowerCase() ===
            targetService.serviceName.toLowerCase()) ||
        (typeof s.sName === "string" &&
          s.sName.toLowerCase() === targetService.serviceName.toLowerCase());

      if (!isTarget) return s;

      const currentDefault =
        typeof s.defaultNotificationValue === "string"
          ? parseInt(s.defaultNotificationValue, 10) || 0
          : typeof s.defaultNotificationValue === "number"
          ? s.defaultNotificationValue
          : 0;

      const currentNext = s.nextNotificationValue;
      let newNextValue: string | number = 0;

      if (s.type === "day") {
        if (typeof currentNext === "string" && isDateString(currentNext)) {
          const currentNextDate = parseDateString(currentNext);
          const daysDelta = newValueNum - currentDefault;
          const newNextDate = new Date(currentNextDate);
          newNextDate.setDate(newNextDate.getDate() + daysDelta);
          newNextValue = formatDateToString(newNextDate);
        } else {
          const baseDate = new Date();
          baseDate.setDate(baseDate.getDate() + newValueNum);
          newNextValue = formatDateToString(baseDate);
        }
      } else {
        const currentNextInt =
          typeof currentNext === "string"
            ? parseInt(currentNext, 10) || 0
            : typeof currentNext === "number"
            ? currentNext
            : 0;

        if (currentNextInt > 0 && currentDefault > 0) {
          const delta = newValueNum - currentDefault;
          newNextValue = currentNextInt + delta;
          if (newNextValue < newValueNum) {
            newNextValue = newValueNum;
          }
        } else {
          newNextValue = vehicleCurrentReading + newValueNum;
        }
      }

      return {
        ...s,
        defaultNotificationValue: newValueNum,
        nextNotificationValue: newNextValue,
        isNotification: s.isNotification !== false,
      };
    });
  };

  const handleSaveService = async () => {
    if (!editingService || !effectiveUserId || !vehicleData) return;

    const newValueNum = parseInt(serviceNewValue.trim(), 10);
    if (isNaN(newValueNum) || newValueNum <= 0) {
      toast.error("Please enter a valid positive number for service interval.");
      return;
    }

    setIsSavingService(true);

    try {
      const currentVType = (vehicleData.vehicleType || "Truck").toLowerCase();
      const currentReading =
        currentVType === "trailer"
          ? Number(vehicleData.hoursReading || 0)
          : Number(vehicleData.currentMiles || 0);

      const userDoc = await getDoc(doc(db, "Users", effectiveUserId));
      const userData = userDoc.data();
      const ownerId =
        userData?.role === "SubOwner" && userData?.createdBy
          ? userData.createdBy
          : effectiveUserId;

      const batch = writeBatch(db);

      let targetVehicles: Array<{
        id: string;
        currentMiles?: string;
        hoursReading?: string;
        services?: ServiceData[];
        nextNotificationMiles?: Array<Record<string, unknown>>;
      }> = [];

      if (syncScope === "all") {
        const fleetQuery = query(
          collection(db, "Users", ownerId, "Vehicles"),
          where("active", "==", true)
        );
        const fleetSnap = await getDocs(fleetQuery);

        targetVehicles = fleetSnap.docs
          .filter((d) => {
            const vType = (d.data().vehicleType || "Truck").toLowerCase();
            return vType === currentVType;
          })
          .map((d) => ({
            id: d.id,
            currentMiles: d.data().currentMiles,
            hoursReading: d.data().hoursReading,
            services: d.data().services || [],
            nextNotificationMiles: d.data().nextNotificationMiles || [],
          }));
      } else {
        targetVehicles = [
          {
            id: vehicleId,
            currentMiles: vehicleData.currentMiles,
            hoursReading: vehicleData.hoursReading,
            services: vehicleData.services || [],
          },
        ];
      }

      const teamMembersQuery = query(
        collection(db, "Users"),
        where("createdBy", "==", ownerId),
        where("isTeamMember", "==", true)
      );
      const teamMembersSnap = await getDocs(teamMembersQuery);
      const memberIds = teamMembersSnap.docs.map((d) => d.id);

      for (const veh of targetVehicles) {
        const reading =
          currentVType === "trailer"
            ? Number(veh.hoursReading || 0)
            : Number(veh.currentMiles || 0);

        const updatedServices = calculateUpdatedServices(
          veh.services,
          editingService,
          newValueNum,
          reading
        );

        const updatePayload: UpdateData<DocumentData> = {
          services: updatedServices,
        };

        if (veh.nextNotificationMiles && veh.nextNotificationMiles.length > 0) {
          updatePayload.nextNotificationMiles =
            calculateUpdatedNextNotificationMiles(
              veh.nextNotificationMiles,
              editingService,
              newValueNum,
              reading
            );
        }

        const ownerVehRef = doc(db, "Users", ownerId, "Vehicles", veh.id);
        batch.update(ownerVehRef, updatePayload);

        for (const memberId of memberIds) {
          const memberVehRef = doc(db, "Users", memberId, "Vehicles", veh.id);
          const memberDocSnap = await getDoc(memberVehRef);
          if (memberDocSnap.exists()) {
            const memberData = memberDocSnap.data();
            const memberPayload: UpdateData<DocumentData> = {
              services: updatedServices,
            };
            if (
              memberData.nextNotificationMiles &&
              memberData.nextNotificationMiles.length > 0
            ) {
              memberPayload.nextNotificationMiles =
                calculateUpdatedNextNotificationMiles(
                  memberData.nextNotificationMiles,
                  editingService,
                  newValueNum,
                  reading
                );
            }
            batch.update(memberVehRef, memberPayload);
          }
        }
      }

      await batch.commit();

      const updatedLocalServices = calculateUpdatedServices(
        vehicleData.services,
        editingService,
        newValueNum,
        currentReading
      );

      setVehicleData((prev) => ({
        ...prev!,
        services: updatedLocalServices,
      }));

      setShowServiceModal(false);

      if (syncScope === "all") {
        toast.success(
          `Updated "${editingService.serviceName}" across all ${
            targetVehicles.length
          } ${
            vehicleData.vehicleType || "Truck"
          }(s) and synced with team members!`
        );
      } else {
        toast.success(
          `Updated "${editingService.serviceName}" for ${vehicleData.vehicleNumber}!`
        );
      }
    } catch (error) {
      console.error("Error updating service value:", error);
      toast.error("Failed to update service value");
    } finally {
      setIsSavingService(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. TOGGLE NOTIFICATION SWITCH MODAL & SYNC
  // ─────────────────────────────────────────────────────────────
  const handleToggleNotificationClick = (service: ServiceData) => {
    const currentState = service.isNotification !== false;
    setTogglingService(service);
    setTargetNotificationState(!currentState);
    setNotificationSyncScope("all");
    setShowNotificationModal(true);
  };

  const calculateNotificationToggledServices = (
    existingServices: ServiceData[] = [],
    targetService: ServiceData,
    newNotificationState: boolean
  ): ServiceData[] => {
    return existingServices.map((s) => {
      const isTarget =
        s.serviceId === targetService.serviceId ||
        s.serviceName?.toLowerCase() ===
          targetService.serviceName?.toLowerCase();

      if (!isTarget) return s;

      return {
        ...s,
        isNotification: newNotificationState,
      };
    });
  };

  const calculateNotificationToggledNextNotificationMiles = (
    existingList: Array<Record<string, unknown>> = [],
    targetService: ServiceData,
    newNotificationState: boolean
  ): Array<Record<string, unknown>> => {
    return existingList.map((s) => {
      const isTarget =
        (s.serviceId && s.serviceId === targetService.serviceId) ||
        (s.sId && s.sId === targetService.serviceId) ||
        (typeof s.serviceName === "string" &&
          s.serviceName.toLowerCase() ===
            targetService.serviceName.toLowerCase()) ||
        (typeof s.sName === "string" &&
          s.sName.toLowerCase() === targetService.serviceName.toLowerCase());

      if (!isTarget) return s;

      return {
        ...s,
        isNotification: newNotificationState,
      };
    });
  };

  const handleSaveNotificationToggle = async () => {
    if (!togglingService || !effectiveUserId || !vehicleData) return;

    setIsTogglingNotification(true);

    try {
      const currentVType = (vehicleData.vehicleType || "Truck").toLowerCase();

      const userDoc = await getDoc(doc(db, "Users", effectiveUserId));
      const userData = userDoc.data();
      const ownerId =
        userData?.role === "SubOwner" && userData?.createdBy
          ? userData.createdBy
          : effectiveUserId;

      const batch = writeBatch(db);

      let targetVehicles: Array<{
        id: string;
        services?: ServiceData[];
        nextNotificationMiles?: Array<Record<string, unknown>>;
      }> = [];

      if (notificationSyncScope === "all") {
        const fleetQuery = query(
          collection(db, "Users", ownerId, "Vehicles"),
          where("active", "==", true)
        );
        const fleetSnap = await getDocs(fleetQuery);

        targetVehicles = fleetSnap.docs
          .filter((d) => {
            const vType = (d.data().vehicleType || "Truck").toLowerCase();
            return vType === currentVType;
          })
          .map((d) => ({
            id: d.id,
            services: d.data().services || [],
            nextNotificationMiles: d.data().nextNotificationMiles || [],
          }));
      } else {
        targetVehicles = [
          {
            id: vehicleId,
            services: vehicleData.services || [],
          },
        ];
      }

      const teamMembersQuery = query(
        collection(db, "Users"),
        where("createdBy", "==", ownerId),
        where("isTeamMember", "==", true)
      );
      const teamMembersSnap = await getDocs(teamMembersQuery);
      const memberIds = teamMembersSnap.docs.map((d) => d.id);

      for (const veh of targetVehicles) {
        const updatedServices = calculateNotificationToggledServices(
          veh.services,
          togglingService,
          targetNotificationState
        );

        const updatePayload: UpdateData<DocumentData> = {
          services: updatedServices,
        };

        if (veh.nextNotificationMiles && veh.nextNotificationMiles.length > 0) {
          updatePayload.nextNotificationMiles =
            calculateNotificationToggledNextNotificationMiles(
              veh.nextNotificationMiles,
              togglingService,
              targetNotificationState
            );
        }

        const ownerVehRef = doc(db, "Users", ownerId, "Vehicles", veh.id);
        batch.update(ownerVehRef, updatePayload);

        for (const memberId of memberIds) {
          const memberVehRef = doc(db, "Users", memberId, "Vehicles", veh.id);
          const memberDocSnap = await getDoc(memberVehRef);
          if (memberDocSnap.exists()) {
            const memberData = memberDocSnap.data();
            const memberPayload: UpdateData<DocumentData> = {
              services: updatedServices,
            };
            if (
              memberData.nextNotificationMiles &&
              memberData.nextNotificationMiles.length > 0
            ) {
              memberPayload.nextNotificationMiles =
                calculateNotificationToggledNextNotificationMiles(
                  memberData.nextNotificationMiles,
                  togglingService,
                  targetNotificationState
                );
            }
            batch.update(memberVehRef, memberPayload);
          }
        }
      }

      await batch.commit();

      const updatedLocalServices = calculateNotificationToggledServices(
        vehicleData.services,
        togglingService,
        targetNotificationState
      );

      setVehicleData((prev) => ({
        ...prev!,
        services: updatedLocalServices,
      }));

      setShowNotificationModal(false);

      const statusText = targetNotificationState ? "ON" : "OFF";
      if (notificationSyncScope === "all") {
        toast.success(
          `Turned Notification ${statusText} for "${
            togglingService.serviceName
          }" across all ${targetVehicles.length} ${
            vehicleData.vehicleType || "Truck"
          }(s)!`
        );
      } else {
        toast.success(
          `Turned Notification ${statusText} for "${togglingService.serviceName}" on ${vehicleData.vehicleNumber}!`
        );
      }
    } catch (error) {
      console.error("Error updating notification status:", error);
      toast.error("Failed to update notification status");
    } finally {
      setIsTogglingNotification(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  const currentVehicleTypeLabel = vehicleData?.vehicleType || "Truck";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete this document?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDocument}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <LoadingIndicator />
                ) : (
                  <>
                    <FaTrash /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setShowImageViewer(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full p-2"
              onClick={() => setShowImageViewer(false)}
            >
              ✕
            </button>
            <img
              src={currentImage}
              alt="Full size document"
              className="max-w-full max-h-screen object-contain"
            />
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Edit Service Value Modal */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showServiceModal && editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Edit {editingService.serviceName}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                disabled={isSavingService}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Value (
                  {editingService.type === "reading"
                    ? "Miles"
                    : editingService.type === "hours"
                    ? "Hours"
                    : "Days"}
                  )
                </label>
                <input
                  type="number"
                  min="1"
                  value={serviceNewValue}
                  onChange={(e) => setServiceNewValue(e.target.value)}
                  placeholder={`Enter value`}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#F96176] focus:border-[#F96176]"
                />
              </div>

              {/* Sync Scope Selection */}
              <div className="space-y-2 pt-2">
                <label className="block text-sm font-medium text-gray-700">
                  Update Option:
                </label>

                {/* Option 1: Fleet-Wide */}
                <label className="flex items-start gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="syncScope"
                    value="all"
                    checked={syncScope === "all"}
                    onChange={() => setSyncScope("all")}
                    className="mt-1 accent-[#F96176]"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      Apply to all {currentVehicleTypeLabel}s (
                      {matchingVehiclesCount} in fleet)
                    </span>
                    <p className="text-xs text-gray-500">
                      Updates this service interval across all your{" "}
                      {currentVehicleTypeLabel}s and syncs with team members.
                    </p>
                  </div>
                </label>

                {/* Option 2: Single Vehicle Only */}
                <label className="flex items-start gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="syncScope"
                    value="single"
                    checked={syncScope === "single"}
                    onChange={() => setSyncScope("single")}
                    className="mt-1 accent-[#F96176]"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      Apply only to this {currentVehicleTypeLabel} (
                      {vehicleData?.vehicleNumber || ""})
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                disabled={isSavingService}
                className="px-4 py-2 border rounded hover:bg-gray-100 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveService}
                disabled={isSavingService}
                className="px-4 py-2 bg-[#F96176] text-white rounded hover:bg-[#e04f64] text-sm font-medium flex items-center gap-2"
              >
                {isSavingService ? (
                  <>
                    <LoadingIndicator />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Toggle Notification Modal */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showNotificationModal && togglingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {targetNotificationState
                  ? "Enable Notification"
                  : "Disable Notification"}
              </h3>
              <button
                onClick={() => setShowNotificationModal(false)}
                disabled={isTogglingNotification}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Service:{" "}
                <strong className="text-gray-900">
                  {togglingService.serviceName}
                </strong>
              </p>

              <div className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Target Status:
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    targetNotificationState
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {targetNotificationState ? "ON (Enabled)" : "OFF (Disabled)"}
                </span>
              </div>

              {/* Sync Scope Selection */}
              <div className="space-y-2 pt-2">
                <label className="block text-sm font-medium text-gray-700">
                  Update Option:
                </label>

                {/* Option 1: Fleet-Wide */}
                <label className="flex items-start gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="notificationSyncScope"
                    value="all"
                    checked={notificationSyncScope === "all"}
                    onChange={() => setNotificationSyncScope("all")}
                    className="mt-1 accent-[#F96176]"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      Apply to all {currentVehicleTypeLabel}s (
                      {matchingVehiclesCount} in fleet)
                    </span>
                    <p className="text-xs text-gray-500">
                      Sets notification status across all your{" "}
                      {currentVehicleTypeLabel}s and syncs with team members.
                    </p>
                  </div>
                </label>

                {/* Option 2: Single Vehicle Only */}
                <label className="flex items-start gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="notificationSyncScope"
                    value="single"
                    checked={notificationSyncScope === "single"}
                    onChange={() => setNotificationSyncScope("single")}
                    className="mt-1 accent-[#F96176]"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      Apply only to this {currentVehicleTypeLabel} (
                      {vehicleData?.vehicleNumber || ""})
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                disabled={isTogglingNotification}
                className="px-4 py-2 border rounded hover:bg-gray-100 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotificationToggle}
                disabled={isTogglingNotification}
                className="px-4 py-2 bg-[#F96176] text-white rounded hover:bg-[#e04f64] text-sm font-medium flex items-center gap-2"
              >
                {isTogglingNotification ? (
                  <>
                    <LoadingIndicator />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Update</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Vehicle Details</h1>
        <button
          onClick={handlePrint}
          className="bg-[#F96176] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#F96176]"
        >
          <FaPrint /> Print
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p className="text-gray-600">
            Company Name:{" "}
            <span className="font-semibold">
              {vehicleData?.companyName || ""}
            </span>
          </p>
          <p className="text-gray-600">
            Vehicle Number:{" "}
            <span className="font-semibold">
              {vehicleData?.vehicleNumber || ""}
            </span>
          </p>
          <p className="text-gray-600">
            License Plate:{" "}
            <span className="font-semibold">
              {vehicleData?.licensePlate || ""}
            </span>
          </p>
          <p className="text-gray-600">
            VIN: <span className="font-semibold">{vehicleData?.vin || ""}</span>
          </p>
          <p className="text-gray-600">
            Engine Name:{" "}
            <span className="font-semibold">
              {vehicleData?.engineName || ""}
            </span>
          </p>
          <p className="text-gray-600">
            Vehicle Type:{" "}
            <span className="font-semibold">
              {vehicleData?.vehicleType || ""}
            </span>
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-gray-600">
              Year:{" "}
              <span className="font-semibold">
                {vehicleData?.year
                  ? !isNaN(new Date(vehicleData.year).getTime()) &&
                    vehicleData.year.length > 4
                    ? new Date(vehicleData.year).toLocaleDateString()
                    : vehicleData.year
                  : ""}
              </span>
            </p>
            {vehicleData?.vehicleType === "Trailer" ? (
              ""
            ) : (
              <p className="text-gray-600">
                Miles/Hours :{" "}
                <span className="font-semibold">
                  {vehicleData?.vehicleType == "Truck"
                    ? vehicleData?.currentMiles || ""
                    : vehicleData?.hoursReading || ""}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/** Show Services only Owner */}
      {role === "Owner" || role === "SubOwner" ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Services</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Sr. No.</th>
                  {/* Serial number header */}
                  <th className="px-4 py-2 text-left">Service Name</th>
                  <th className="px-4 py-2 text-left">Default Value</th>
                  <th className="px-4 py-2 text-center">Notification</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicleData?.services
                  ?.filter(
                    (service) =>
                      service.defaultNotificationValue &&
                      service.defaultNotificationValue !== 0
                  )
                  .sort((a, b) => a.serviceName.localeCompare(b.serviceName))
                  .map((service, index) => (
                    <tr key={service.serviceId || index} className="border-b">
                      <td className="px-4 py-2">{index + 1}</td>
                      {/* Serial number */}
                      <td className="px-4 py-2 font-medium text-gray-800">
                        {service.serviceName}
                      </td>
                      <td className="px-4 py-2">
                        {service.defaultNotificationValue || "N/A"} (
                        {service.type === "reading" ? "Miles" : service.type})
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleNotificationClick(service)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            service.isNotification !== false
                              ? "bg-[#F96176]"
                              : "bg-gray-300"
                          }`}
                          title={
                            service.isNotification !== false
                              ? "Notification is ON (Click to turn OFF)"
                              : "Notification is OFF (Click to turn ON)"
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              service.isNotification !== false
                                ? "translate-x-5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          className="text-[#F96176] hover:text-[#F96176] p-1.5 rounded"
                          title="Edit Service Value"
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {role === "Owner" || role === "SubOwner" ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Upload Documents</h2>
          <div className="flex gap-4 mb-4 flex-wrap items-center">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="border p-2 rounded max-w-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#F96176] file:text-white hover:file:bg-[#e05065]"
              accept="image/*,application/pdf,.pdf"
            />
            <button
              onClick={handleUpload}
              disabled={filesToUpload.length === 0 || loading}
              className={`px-5 py-2.5 rounded font-medium flex items-center gap-2 transition ${
                filesToUpload.length === 0
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-[#F96176] text-white hover:bg-[#e05065]"
              }`}
            >
              {loading ? <LoadingIndicator /> : "Upload Documents"}
            </button>
          </div>

          {filesToUpload.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Files to upload:</h3>
              {filesToUpload.map(({ id, file, customText }) => {
                const isPdf =
                  file.type.toLowerCase().includes("pdf") ||
                  file.name.toLowerCase().endsWith(".pdf");
                return (
                  <div
                    key={id}
                    className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="text-2xl shrink-0">
                      {isPdf ? (
                        <FaFilePdf className="text-red-500 text-3xl" />
                      ) : (
                        <FaFileImage className="text-blue-500 text-3xl" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {file.name}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
                            isPdf
                              ? "bg-red-100 text-red-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {isPdf ? "PDF" : "Image"}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={customText}
                        onChange={(e) => handleTextChange(id, e.target.value)}
                        className="w-full p-2 border rounded mt-1 text-sm bg-white"
                        placeholder="Enter description"
                      />
                    </div>
                    <button
                      onClick={() => removeFile(id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50"
                      title="Remove file"
                    >
                      <FaTrash />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {role === "Owner" || role === "Accountant" || role === "SubOwner" ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Uploaded Documents</h2>
          {vehicleData?.uploadedDocuments?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {vehicleData.uploadedDocuments.map((docItem, index) => {
                const isPdf = isPdfDocument(docItem);
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-4 relative group bg-white hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    {/* Preview Area */}
                    {isPdf ? (
                      <div
                        onClick={() => window.open(docItem.imageUrl, "_blank")}
                        className="w-full h-44 bg-red-50 hover:bg-red-100 rounded-lg flex flex-col items-center justify-center cursor-pointer transition border border-red-200 mb-3"
                        title="Click to open PDF in new tab"
                      >
                        <FaFilePdf className="text-red-500 text-5xl mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-red-600 bg-red-100 px-2.5 py-0.5 rounded">
                          PDF Document
                        </span>
                        <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          Open in new tab <FaExternalLinkAlt size={10} />
                        </span>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleViewImage(docItem.imageUrl)}
                        className="w-full h-44 rounded-lg overflow-hidden bg-gray-100 mb-3 cursor-pointer relative group/img"
                        title="Click to view image"
                      >
                        <img
                          src={docItem.imageUrl}
                          alt={docItem.text || `Document ${index + 1}`}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/img:bg-opacity-20 transition-all flex items-center justify-center">
                          <span className="opacity-0 group-hover/img:opacity-100 bg-black bg-opacity-60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-opacity">
                            <FaEye size={12} /> View Full
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Document Info */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                            isPdf
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isPdf ? "PDF" : "IMAGE"}
                        </span>
                        <p className="text-sm font-semibold text-gray-800 truncate flex-1">
                          {docItem.text || `Document ${index + 1}`}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      {isPdf ? (
                        <>
                          <button
                            onClick={() =>
                              window.open(docItem.imageUrl, "_blank")
                            }
                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
                            title="Open PDF"
                          >
                            <FaEye size={13} /> View
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadDocument(
                                docItem.imageUrl,
                                docItem.text || `document-${index + 1}`,
                                true
                              )
                            }
                            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
                            title="Download PDF"
                          >
                            <FaDownload size={13} /> Download
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleViewImage(docItem.imageUrl)}
                            className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
                            title="Preview Image"
                          >
                            <FaEye size={13} /> View
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadDocument(
                                docItem.imageUrl,
                                docItem.text || `document-${index + 1}`,
                                false
                              )
                            }
                            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
                            title="Download Image"
                          >
                            <FaDownload size={13} /> Download
                          </button>
                        </>
                      )}
                    </div>

                    {/* Delete Icon Button */}
                    <button
                      onClick={() => confirmDelete(docItem)}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-red-500 text-gray-600 hover:text-white p-2 rounded-full shadow transition-all"
                      title="Delete document"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No documents uploaded yet</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
