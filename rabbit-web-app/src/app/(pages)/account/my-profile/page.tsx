/* eslint-disable @next/next/no-img-element */
"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db, storage } from "@/lib/firebase";
import { ProfileValues, VehicleTypes } from "@/types/types";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import {
  doc,
  onSnapshot,
  collection,
  deleteDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function MyProfile() {
  const { user } = useAuth() || { user: null };
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<ProfileValues | null>(null);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    // Set up real-time listener for user profile
    const userRef = doc(db, "Users", user?.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const userProfile = doc.data() as ProfileValues;
          setUserData(userProfile);
        } else {
          GlobalToastError("User document not found");
        }
        setIsLoading(false);
      },
      (error) => {
        GlobalToastError(error);
        setIsLoading(false);
      }
    );

    // Fetch vehicles
    fetchVehicles();

    return () => unsubscribe();
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;
    try {
      const vehiclesRef = collection(db, "Users", user?.uid, "Vehicles");
      const vehiclesSnapshot = await getDocs(vehiclesRef);

      const vehiclesList = vehiclesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id, // Store the document ID
          companyName: data.companyName,
          createdAt: data.createdAt,
          isSet: data.isSet,
          licensePlate: data.licensePlate,
          vehicleNumber: data.vehicleNumber || "",
          vin: data.vin || null,
          year: data.year,
        } as VehicleTypes;
      });
      setVehicles(vehiclesList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      GlobalToastError(error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;

    setImageUploadLoading(true);
    try {
      const file = e.target.files[0];
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(downloadURL);
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      GlobalToastError(error);
    } finally {
      setImageUploadLoading(false);
    }
  };

  const updateProfile = async (imageUrl: string) => {
    if (!user) return;
    const userRef = doc(db, "Users", user.uid);
    await updateDoc(userRef, {
      profilePicture: imageUrl,
    });
  };

  const handleDeleteVehicle = async (docId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "Users", user.uid, "Vehicles", docId));
      toast.success("Vehicle deleted successfully!");
      fetchVehicles();
    } catch (error) {
      GlobalToastError(error);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <h1 className="text-xl font-semibold text-gray-800">
          Please login first to access this page
        </h1>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src={userData?.profilePicture || "/default-avatar.png"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <label className="absolute bottom-0 right-0 bg-pink-500 rounded-full p-2 cursor-pointer shadow-lg">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={imageUploadLoading}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </label>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">
            {userData?.userName}
          </h2>
        </div>

        {/* Personal Details Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-pink-500 to-red-500 px-6 py-4">
            <h3 className="text-xl font-semibold text-white">
              Personal Details
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField label="Full Name" value={userData?.userName} />
            <ProfileField label="Email" value={userData?.email} />
            <ProfileField label="Phone" value={userData?.phoneNumber} />
            <ProfileField label="Address" value={userData?.address} />
          </div>
        </div>

        {/* Vehicle Details Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-red-500 px-6 py-4">
            <h3 className="text-xl font-semibold text-white">
              Vehicle Details
            </h3>
          </div>
          <div className="p-6">
            {vehicles.length > 0 ? (
              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                  >
                    <span className="text-lg text-gray-800">
                      {vehicle.vehicleNumber}
                    </span>
                    <button
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No vehicles found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ProfileField = ({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-lg text-gray-900">{value || "Not provided"}</p>
  </div>
);
