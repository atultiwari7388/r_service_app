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
import { FaDownload, FaEdit, FaEye, FaPrint, FaTrash } from "react-icons/fa";
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
  year: string;
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
  // const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth() || { user: null };
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState<VehicleDocument | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [role, setRole] = useState("");
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");

  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, "Users", user?.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as ProfileValues;
        setRole(data.role);
      }
    };

    const fetchVehicleData = async () => {
      if (!vehicleId || !user?.uid) return;

      const docRef = doc(db, "Users", user.uid, "Vehicles", vehicleId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setVehicleData(docSnap.data() as VehicleData);
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };

    fetchVehicleData();
    fetchUserData();
  }, [vehicleId, user?.uid]);

  const handlePrint = async () => {
    const printContent = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="text-align: center; margin-bottom: 20px;">Vehicle Details</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Company Name</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.companyName || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Vehicle Number</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.vehicleNumber || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">License Plate</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.licensePlate || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">VIN</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.vin || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Engine Name</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.engineName || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Vehicle Type</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.vehicleType || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Year</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.year || "N/A"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Current Miles</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${
              vehicleData?.currentMiles || "N/A"
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
    if (!vehicleId || !user?.uid || filesToUpload.length === 0) return;

    setLoading(true);
    const uploads: VehicleDocument[] = [];

    try {
      for (const { file, customText } of filesToUpload) {
        const storageRef = ref(
          storage,
          `vehicle_images/${user.uid}/${vehicleId}/${file.name}_${Date.now()}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        uploads.push({ imageUrl: downloadURL, text: customText });
      }

      const docRef = doc(db, "Users", user.uid, "Vehicles", vehicleId);
      await updateDoc(docRef, {
        uploadedDocuments: [
          ...(vehicleData?.uploadedDocuments || []),
          ...uploads,
        ],
      });

      toast.success("Documents uploaded successfully!");
      setFilesToUpload([]);
      // Refresh the page to show new images
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
    if (!docToDelete || !user?.uid || !vehicleId) return;

    setDeleteLoading(true);
    try {
      // Delete from storage
      const imageRef = ref(storage, docToDelete.imageUrl);
      await deleteObject(imageRef);

      // Delete from Firestore
      const docRef = doc(db, "Users", user.uid, "Vehicles", vehicleId);
      await updateDoc(docRef, {
        uploadedDocuments: arrayRemove(docToDelete),
      });

      // Update local state
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

  const handleEditService = async (index: number, service: ServiceData) => {
    const newDefaultValue = prompt(
      `Edit default notification value for ${service.serviceName}`,
      service.defaultNotificationValue.toString()
    );

    if (newDefaultValue && vehicleData && user?.uid && vehicleId) {
      const newValue = parseInt(newDefaultValue, 10);
      if (isNaN(newValue)) {
        alert("Please enter a valid number");
        return;
      }

      try {
        setLoading(true);

        // Get current values
        const currentDefault = service.defaultNotificationValue;
        const currentNext = service.nextNotificationValue;

        let newNextValue;

        if (service.type === "day") {
          // For day type, handle date calculations
          if (typeof currentNext === "string" && isDateString(currentNext)) {
            // Current next value is a date string
            const currentNextDate = parseDateString(currentNext);
            const currentDefaultInt =
              typeof currentDefault === "string"
                ? parseInt(currentDefault, 10)
                : currentDefault;

            // Calculate the date difference between current default and next value
            const today = new Date();
            const daysUntilNext = Math.floor(
              (currentNextDate.getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            // Calculate the new next date based on the new default value
            const newNextDate = new Date();
            newNextDate.setDate(
              today.getDate() + daysUntilNext + (newValue - currentDefaultInt)
            );

            newNextValue = formatDateToString(newNextDate);
          } else {
            // Fallback: if next value is not a date string, calculate normally
            const currentNextInt =
              typeof currentNext === "string"
                ? parseInt(currentNext, 10)
                : currentNext;
            const currentDefaultInt =
              typeof currentDefault === "string"
                ? parseInt(currentDefault, 10)
                : currentDefault;

            const difference = currentNextInt - currentDefaultInt;
            newNextValue = newValue + difference;
          }
        } else {
          // For other types (reading, hours), handle numeric calculations
          const currentNextInt =
            typeof currentNext === "string"
              ? parseInt(currentNext, 10)
              : currentNext;
          const currentDefaultInt =
            typeof currentDefault === "string"
              ? parseInt(currentDefault, 10)
              : currentDefault;

          const difference = currentNextInt - currentDefaultInt;
          newNextValue = newValue + difference;

          // Ensure the new next value is not less than the new default
          if (newNextValue < newValue) {
            newNextValue = newValue;
          }
        }

        // Create the updated service object
        const updatedService = {
          ...service,
          defaultNotificationValue: newValue,
          nextNotificationValue: newNextValue,
          preValue: currentDefault,
        };

        // First update current user's vehicle
        await updateCurrentUserVehicle(updatedService);

        // Check if current user is owner and update team members
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        const userData = userDoc.data();

        if (userData?.role === "Owner") {
          await updateTeamMembersVehicles(updatedService);
        } else {
          // If current user is team member, update owner's vehicle
          if (userData?.createdBy) {
            await updateOwnerVehicle(userData.createdBy, updatedService);
          }
        }

        alert("Service value updated successfully");
      } catch (error) {
        console.error("Error updating service:", error);
        alert("Error updating service");
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper function to check if a string is a date in the expected format (dd/MM/yyyy)
  const isDateString = (value: string): boolean => {
    try {
      const parts = value.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        return (
          !isNaN(day) &&
          !isNaN(month) &&
          !isNaN(year) &&
          day >= 1 &&
          day <= 31 &&
          month >= 1 &&
          month <= 12 &&
          year >= 2000 &&
          year <= 2100
        );
      }
      return false;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  };

  // Helper function to parse date string (dd/MM/yyyy)
  const parseDateString = (dateString: string): Date => {
    const parts = dateString.split("/");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JavaScript
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  // Helper function to format DateTime to string (dd/MM/yyyy)
  const formatDateToString = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  };

  const updateCurrentUserVehicle = async (updatedService: ServiceData) => {
    if (!vehicleData || !user?.uid) return;

    // Find the index of the service to update using serviceId
    const serviceIndex = vehicleData.services?.findIndex(
      (s) => s.serviceId === updatedService.serviceId
    );

    if (serviceIndex === undefined || serviceIndex === -1) return;

    const updatedServices = [...(vehicleData.services || [])];
    updatedServices[serviceIndex] = updatedService;

    const docRef = doc(db, "Users", user.uid, "Vehicles", vehicleId);
    await updateDoc(docRef, { services: updatedServices });

    setVehicleData((prevData) => ({
      ...prevData!,
      services: updatedServices,
    }));
  };

  // Helper function to update team members' vehicles
  const updateTeamMembersVehicles = async (updatedService: ServiceData) => {
    if (!user?.uid) return;

    // Get all team members
    const teamMembersQuery = query(
      collection(db, "Users"),
      where("createdBy", "==", user.uid),
      where("isTeamMember", "==", true)
    );

    const teamMembersSnapshot = await getDocs(teamMembersQuery);

    const updatePromises: Promise<void>[] = [];

    teamMembersSnapshot.forEach((memberDoc) => {
      const memberId = memberDoc.id;
      const promise = updateVehicleService(memberId, updatedService);
      updatePromises.push(promise);
    });

    await Promise.all(updatePromises);
  };

  // Helper function to update owner's vehicle
  const updateOwnerVehicle = async (
    ownerId: string,
    updatedService: ServiceData
  ) => {
    return updateVehicleService(ownerId, updatedService);
  };

  // Generic function to update a vehicle's service
  const updateVehicleService = async (
    userId: string,
    updatedService: ServiceData
  ) => {
    try {
      const vehicleDocRef = doc(db, "Users", userId, "Vehicles", vehicleId);
      const vehicleDoc = await getDoc(vehicleDocRef);

      if (vehicleDoc.exists()) {
        const vehicleData = vehicleDoc.data();
        const services = [...(vehicleData.services || [])];

        // Find the exact service to update using serviceId
        const serviceIndex = services.findIndex(
          (s) => s.serviceId === updatedService.serviceId
        );

        if (serviceIndex !== -1) {
          services[serviceIndex] = updatedService;
          await updateDoc(vehicleDocRef, { services });
        }
      }
    } catch (error) {
      console.error(`Error updating vehicle for user ${userId}:`, error);
      throw error;
    }
  };

  const handleViewImage = (imageUrl: string) => {
    setCurrentImage(imageUrl);
    setShowImageViewer(true);
  };

  // const handleDownloadImage = async (imageUrl: string, fileName: string) => {
  //   try {
  //     const response = await fetch(imageUrl);
  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.style.display = "none";
  //     a.href = url;
  //     a.download = fileName || "document";
  //     document.body.appendChild(a);
  //     a.click();
  //     window.URL.revokeObjectURL(url);
  //     document.body.removeChild(a);
  //     toast.success("Document downloaded successfully!");
  //   } catch (error) {
  //     console.error("Error downloading document:", error);
  //     toast.error("Error downloading document");
  //   }
  // };

  const handleDownloadImage = async (imageUrl: string, fileName: string) => {
    try {
      // Fetch with CORS support
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      // Convert to blob
      const blob = await response.blob();

      // Create a temporary link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.jpg`; // ✅ Ensure extension (jpg/png)
      document.body.appendChild(a);

      a.click(); // Trigger download

      // Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Document downloaded successfully!");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Error downloading document");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    );
  }

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
              {vehicleData?.companyName || "N/A"}
            </span>
          </p>
          <p className="text-gray-600">
            Vehicle Number:{" "}
            <span className="font-semibold">
              {vehicleData?.vehicleNumber || "N/A"}
            </span>
          </p>
          <p className="text-gray-600">
            License Plate:{" "}
            <span className="font-semibold">
              {vehicleData?.licensePlate || "N/A"}
            </span>
          </p>
          <p className="text-gray-600">
            VIN:{" "}
            <span className="font-semibold">{vehicleData?.vin || "N/A"}</span>
          </p>
          <p className="text-gray-600">
            Engine Name:{" "}
            <span className="font-semibold">
              {vehicleData?.engineName || "N/A"}
            </span>
          </p>
          <p className="text-gray-600">
            Vehicle Type:{" "}
            <span className="font-semibold">
              {vehicleData?.vehicleType || "N/A"}
            </span>
          </p>
          {vehicleData?.companyName == "DRY VAN" ? (
            ""
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-gray-600">
                Year:{" "}
                <span className="font-semibold">
                  {new Date(
                    vehicleData?.year.toString() ?? ""
                  ).toLocaleDateString()}
                </span>
              </p>
              {vehicleData?.vehicleType === "Trailer" ? (
                ""
              ) : (
                <p className="text-gray-600">
                  Miles/Hours :{" "}
                  <span className="font-semibold">
                    {/* {vehicleData?.currentMiles || "N/A"} */}
                    {vehicleData?.vehicleType == "Truck"
                      ? vehicleData?.currentMiles
                      : vehicleData?.hoursReading}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/** Show Services only Owner */}
      {role === "Owner" ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Services</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Sr. No.</th>{" "}
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
                      <td className="px-4 py-2">{index + 1}</td>{" "}
                      {/* Serial number */}
                      <td className="px-4 py-2">{service.serviceName}</td>
                      <td className="px-4 py-2">
                        {service.defaultNotificationValue || "N/A"} (
                        {service.type === "reading" ? "Miles" : service.type})
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleEditService(index, service)}
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
      {role === "Owner" ? (
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

      {role === "Owner" || role === "Accountant" ? (
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
