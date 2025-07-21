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
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { FaEdit, FaPrint } from "react-icons/fa";

interface VehicleDocument {
  imageUrl: string;
  text: string;
}

interface ServiceData {
  defaultNotificationValue: number;
  nextNotificationValue: number;
  serviceId: string;
  serviceName: string;
  type: string;
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

export default function MyVehicleDetailsScreen() {
  const params = useParams();
  const vehicleId = params?.vehicleId as string;

  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth() || { user: null };

  // const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [vehicleId, user?.uid]);

  //print vehicle details
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
      setUploadedFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    if (!vehicleId || !user?.uid || uploadedFiles.length === 0) return;

    setLoading(true);
    const uploads: VehicleDocument[] = [];

    for (const file of uploadedFiles) {
      const storageRef = ref(storage, `vehicle_images/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      uploads.push({ imageUrl: downloadURL, text: "" });
    }

    const docRef = doc(db, "Users", user.uid, "Vehicles", vehicleId);
    await updateDoc(docRef, {
      uploadedDocuments: uploads,
    });

    setLoading(false);
    setUploadedFiles([]);
  };

  // const handleEditService = (index: number, service: ServiceData) => {
  //   const newDefaultValue = prompt(
  //     `Edit default notification value for ${service.serviceName}`,
  //     service.defaultNotificationValue.toString()
  //   );

  //   if (newDefaultValue && vehicleData) {
  //     const updatedServices = [...(vehicleData.services || [])];
  //     updatedServices[index] = {
  //       ...service,
  //       defaultNotificationValue: parseInt(newDefaultValue, 10),
  //     };

  //     if (user?.uid && vehicleId) {
  //       const docRef = doc(db, "Users", user.uid, "Vehicles", vehicleId);
  //       updateDoc(docRef, { services: updatedServices })
  //         .then(() => {
  //           setVehicleData((prevData) => ({
  //             ...prevData!,
  //             services: updatedServices,
  //           }));
  //         })
  //         .catch((error) => console.error("Error updating services:", error));
  //     }
  //   }
  // };

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

        // Calculate the difference between current values
        const currentDefault = service.defaultNotificationValue;
        const currentNext = service.nextNotificationValue;
        const difference = currentNext - currentDefault;

        // Calculate new next value based on the difference
        let newNextValue = newValue + difference;

        // Ensure the new next value is not less than the new default
        if (newNextValue < newValue) {
          newNextValue = newValue;
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

  // Helper function to update current user's vehicle
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
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
              <p className="text-gray-600">
                Miles/Hours :{" "}
                <span className="font-semibold">
                  {/* {vehicleData?.currentMiles || "N/A"} */}
                  {vehicleData?.vehicleType == "Truck"
                    ? vehicleData?.currentMiles
                    : vehicleData?.hoursReading}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Services</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
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
                    service.defaultNotificationValue !== 0 &&
                    service.defaultNotificationValue !== 0
                )
                .sort((a, b) => a.serviceName.localeCompare(b.serviceName))
                .map((service, index) => (
                  <tr key={service.serviceId} className="border-b">
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
      </div> */}

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

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Upload Documents</h2>
        <div className="flex gap-4">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="border p-2 rounded"
          />
          <button
            onClick={handleUpload}
            className="bg-[#F96176] text-white px-4 py-2 rounded hover:bg-[#F96176]"
          >
            Upload Documents
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Uploaded Documents</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {vehicleData?.uploadedDocuments?.map((doc, index) => (
            <div key={index} className="border rounded p-4">
              <img
                src={doc.imageUrl}
                alt={`Document ${index + 1}`}
                className="w-full h-40 object-cover mb-2"
              />
              <p className="text-gray-600">
                {doc.text || `Document ${index + 1}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
