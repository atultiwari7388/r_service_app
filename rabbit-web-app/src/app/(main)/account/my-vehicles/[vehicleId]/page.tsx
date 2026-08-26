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
} from "react-icons/fa";
import { toast } from "react-toastify";
import { ProfileValues } from "@/types/types";

interface VehicleDocument {
  imageUrl: string;
  text: string;
}

interface ServiceData {
  defaultNotificationValue: number | string;
  nextNotificationValue: number | string;
  serviceId: string;
  serviceName: string;
  type: string;
  preValue?: number | string;
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

  // Edit Service Modal States
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [serviceNewValue, setServiceNewValue] = useState<string>("");
  const [syncScope, setSyncScope] = useState<"all" | "single">("all");
  const [isSavingService, setIsSavingService] = useState(false);
  const [matchingVehiclesCount, setMatchingVehiclesCount] = useState<number>(1);

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
        const storageRef = ref(
          storage,
          `vehicle_images/${effectiveUserId}/${vehicleId}/${
            file.name
          }_${Date.now()}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        uploads.push({ imageUrl: downloadURL, text: customText });
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

  const handleDownloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Document downloaded successfully!");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Error downloading document");
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

  // Open Edit Service Modal
  const handleOpenEditModal = (service: ServiceData) => {
    setEditingService(service);
    setServiceNewValue(service.defaultNotificationValue?.toString() || "");
    setSyncScope("all");
    setShowServiceModal(true);
  };

  // Helper to recalculate services array for any vehicle
  const calculateUpdatedServices = (
    existingServices: ServiceData[] = [],
    targetService: ServiceData,
    newValueNum: number,
    vehicleCurrentReading: number = 0
  ): ServiceData[] => {
    return existingServices.map((s) => {
      const isTarget =
        s.serviceId === targetService.serviceId ||
        s.serviceName?.toLowerCase() === targetService.serviceName?.toLowerCase();

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
      };
    });
  };

  // Save Service Value (Single or Fleet-Wide)
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

      // Determine Owner ID
      const userDoc = await getDoc(doc(db, "Users", effectiveUserId));
      const userData = userDoc.data();
      const ownerId =
        userData?.role === "SubOwner" && userData?.createdBy
          ? userData.createdBy
          : effectiveUserId;

      const batch = writeBatch(db);

      // 1. Fetch Target Vehicles to update
      let targetVehicles: Array<{ id: string; currentMiles?: string; hoursReading?: string; services?: ServiceData[] }> = [];

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
          }));
      } else {
        // Single vehicle only
        targetVehicles = [
          {
            id: vehicleId,
            currentMiles: vehicleData.currentMiles,
            hoursReading: vehicleData.hoursReading,
            services: vehicleData.services || [],
          },
        ];
      }

      // 2. Fetch Team Members
      const teamMembersQuery = query(
        collection(db, "Users"),
        where("createdBy", "==", ownerId),
        where("isTeamMember", "==", true)
      );
      const teamMembersSnap = await getDocs(teamMembersQuery);
      const memberIds = teamMembersSnap.docs.map((d) => d.id);

      // 3. Apply updates to Owner's vehicles
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

        const ownerVehRef = doc(db, "Users", ownerId, "Vehicles", veh.id);
        batch.update(ownerVehRef, { services: updatedServices });

        // Sync with Team Members who have this vehicle
        for (const memberId of memberIds) {
          const memberVehRef = doc(db, "Users", memberId, "Vehicles", veh.id);
          const memberDocSnap = await getDoc(memberVehRef);
          if (memberDocSnap.exists()) {
            batch.update(memberVehRef, { services: updatedServices });
          }
        }
      }

      await batch.commit();

      // 4. Update local state for current vehicle
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
          } ${vehicleData.vehicleType || "Truck"}(s) and synced with team members!`
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
      {/* Fleet-Wide Service Rule Sync Modal */}
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
                      Apply to all {currentVehicleTypeLabel}s ({matchingVehiclesCount} in fleet)
                    </span>
                    <p className="text-xs text-gray-500">
                      Updates this service interval across all your {currentVehicleTypeLabel}s and syncs with team members.
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
                      Apply only to this {currentVehicleTypeLabel} ({vehicleData?.vehicleNumber || ""})
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
                  <th className="px-4 py-2 text-left">Actions</th>
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
                    <tr key={service.serviceId} className="border-b">
                      <td className="px-4 py-2">{index + 1}</td>
                      {/* Serial number */}
                      <td className="px-4 py-2">{service.serviceName}</td>
                      <td className="px-4 py-2">
                        {service.defaultNotificationValue || "N/A"} (
                        {service.type === "reading" ? "Miles" : service.type})
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          className="text-[#F96176] hover:text-[#F96176]"
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
          <div className="flex gap-4 mb-4">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="border p-2 rounded"
              accept="image/*"
            />
            <button
              onClick={handleUpload}
              disabled={filesToUpload.length === 0}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                filesToUpload.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#F96176] text-white hover:bg-[#F96176]"
              }`}
            >
              {loading ? <LoadingIndicator /> : "Upload Documents"}
            </button>
          </div>

          {filesToUpload.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Files to upload:</h3>
              {filesToUpload.map(({ id, file, customText }) => (
                <div
                  key={id}
                  className="flex items-center gap-4 p-3 border rounded"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 truncate">
                      {file.name}
                    </p>
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => handleTextChange(id, e.target.value)}
                      className="w-full p-2 border rounded mt-1"
                      placeholder="Enter description"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(id)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove file"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {role === "Owner" || role === "Accountant" || role === "SubOwner" ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Uploaded Documents</h2>
          {vehicleData?.uploadedDocuments?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {vehicleData.uploadedDocuments.map((doc, index) => (
                <div key={index} className="border rounded p-4 relative group">
                  <img
                    src={doc.imageUrl}
                    alt={`Document ${index + 1}`}
                    className="w-full h-40 object-cover mb-2"
                  />
                  <p className="text-gray-600 truncate">
                    {doc.text || `Document ${index + 1}`}
                  </p>
                  <button
                    onClick={() => handleViewImage(doc.imageUrl)}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                    title="View document"
                  >
                    <FaEye size={14} />
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadImage(
                        doc.imageUrl,
                        doc.text || `document-${index + 1}`
                      )
                    }
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                    title="Download document"
                  >
                    <FaDownload size={14} />
                  </button>
                  <button
                    onClick={() => confirmDelete(doc)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Delete document"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No documents uploaded yet</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
