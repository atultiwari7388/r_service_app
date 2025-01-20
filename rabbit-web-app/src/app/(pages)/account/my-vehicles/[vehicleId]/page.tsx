/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { FaEdit } from "react-icons/fa";

interface VehicleDocument {
  imageUrl: string;
  text: string;
}

interface ServiceData {
  defaultNotificationValue: number;
  nextNotificationValue: number;
  serviceId: string;
  serviceName: string;
}

interface VehicleData {
  vehicleNumber: string;
  year: string;
  currentMiles: string;
  licensePlate: string;
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

  const handleEditService = (index: number, service: ServiceData) => {
    const newDefaultValue = prompt(
      `Edit default notification value for ${service.serviceName}`,
      service.defaultNotificationValue.toString()
    );

    if (newDefaultValue && vehicleData) {
      const updatedServices = [...(vehicleData.services || [])];
      updatedServices[index] = {
        ...service,
        defaultNotificationValue: parseInt(newDefaultValue, 10),
      };

      if (user?.uid && vehicleId) {
        const docRef = doc(db, "Users", user.uid, "Vehicles", vehicleId);
        updateDoc(docRef, { services: updatedServices })
          .then(() => {
            setVehicleData((prevData) => ({
              ...prevData!,
              services: updatedServices,
            }));
          })
          .catch((error) => console.error("Error updating services:", error));
      }
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
      <h1 className="text-3xl font-bold mb-8">Vehicle Details</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <p className="text-gray-600">
            Vehicle Number:{" "}
            <span className="font-semibold">{vehicleData?.vehicleNumber}</span>
          </p>
          <p className="text-gray-600">
            Year: <span className="font-semibold">{vehicleData?.year}</span>
          </p>
          <p className="text-gray-600">
            Current Miles:{" "}
            <span className="font-semibold">{vehicleData?.currentMiles}</span>
          </p>
          <p className="text-gray-600">
            License Plate:{" "}
            <span className="font-semibold">{vehicleData?.licensePlate}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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
                ) // Exclude services with defaultNotificationValue === "0" or 0
                .map((service, index) => (
                  <tr key={service.serviceId} className="border-b">
                    <td className="px-4 py-2">{service.serviceName}</td>
                    <td className="px-4 py-2">
                      {service.defaultNotificationValue || "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleEditService(index, service)}
                        className="text-blue-500 hover:text-blue-700"
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
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
