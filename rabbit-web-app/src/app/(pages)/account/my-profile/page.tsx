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
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { updatePassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function MyProfile() {
  const { user } = useAuth() || { user: null };
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<ProfileValues | null>(null);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    userName: "",
    email: "",
    address: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const router = useRouter();

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
          setEditedData({
            userName: userProfile.userName || "",
            email: userProfile.email || "",
            address: userProfile.address || "",
          });
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
          id: doc.id,
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

  const handleSaveChanges = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "Users", user.uid);
      await updateDoc(userRef, {
        userName: editedData.userName,
        email: editedData.email,
        address: editedData.address,
      });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      GlobalToastError(error);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    try {
      await updatePassword(user, newPassword);
      setIsChangingPassword(false);
      setNewPassword("");
      toast.success("Password changed successfully!");
    } catch (error) {
      GlobalToastError(error);
    }
  };

  const handleEditVehicle = async (docId: string) => {
    if (!user) return;

    router.push(`/account/my-profile/edit-vehicle/${docId}`); //redirect to edit vehicle details screen
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
            <label className="absolute bottom-0 right-0 bg-[#F96176] rounded-full p-2 cursor-pointer shadow-lg">
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
          <div className="bg-[#F96176] px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              Personal Details
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white text-[#F96176] px-4 py-2 rounded-full"
              >
                Edit Details
              </button>
            )}
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditing ? (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <input
                    type="text"
                    value={editedData.userName}
                    onChange={(e) =>
                      setEditedData({ ...editedData, userName: e.target.value })
                    }
                    className="mt-1 w-full p-2 border rounded"
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <input
                    type="email"
                    value={editedData.email}
                    onChange={(e) =>
                      setEditedData({ ...editedData, email: e.target.value })
                    }
                    className="mt-1 w-full p-2 border rounded"
                  />
                </div>
                <ProfileField label="Phone" value={userData?.phoneNumber} />
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <input
                    type="text"
                    value={editedData.address}
                    onChange={(e) =>
                      setEditedData({ ...editedData, address: e.target.value })
                    }
                    className="mt-1 w-full p-2 border rounded"
                  />
                </div>
                <div className="col-span-2 flex justify-end gap-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="bg-[#F96176] text-white px-4 py-2 rounded-full"
                  >
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <>
                <ProfileField label="Full Name" value={userData?.userName} />
                <ProfileField label="Email" value={userData?.email} />
                <ProfileField label="Phone" value={userData?.phoneNumber} />
                <ProfileField label="Address" value={userData?.address} />
              </>
            )}
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-[#F96176] px-6 py-4">
            <h3 className="text-xl font-semibold text-white">
              Change Password
            </h3>
          </div>
          <div className="p-6">
            {isChangingPassword ? (
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setNewPassword("");
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="bg-[#F96176] text-white px-4 py-2 rounded-full"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200"
              >
                Change Password
              </button>
            )}
          </div>
        </div>

        {/* Wallet Balance Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-[#F96176] px-6 py-4">
            <h3 className="text-xl font-semibold text-white">Wallet Balance</h3>
          </div>
          <div className="p-6">{userData?.wallet}</div>
        </div>

        {/* Vehicle Details Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-[#F96176] px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              Vehicle Details
            </h3>
            <Link href="/add-vehicle">
              <button className="bg-white text-[#F96176] px-4 py-2 rounded-full">
                Add Vehicle
              </button>
            </Link>
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
                      onClick={() => handleEditVehicle(vehicle.id)}
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
                          d="M11 4h6m-3-3v6m5 3l-3-3m0 0L12 15m9-9l-9 9M2 20h18"
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
