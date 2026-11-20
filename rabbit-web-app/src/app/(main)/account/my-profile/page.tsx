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
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  Truck,
  Layers,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { isSubscriptionBypassedEmail } from "@/lib/adminConfig";

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
    city: "",
    state: "",
    country: "",
    vehicleRange: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const vehicleOptions = [
    "1 to 5",
    "1 to 10",
    "1 to 20",
    "1 to 30",
    "1 to 50",
    "1 to 100",
    "1 to 200",
    "1 to 500",
    "above 500",
  ];

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
            city: userProfile.city || "",
            state: userProfile.state || "",
            country: userProfile.country || "",
            vehicleRange: userProfile.vehicleRange || "",
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
        city: editedData.city,
        state: editedData.state,
        country: editedData.country,
        vehicleRange: editedData.vehicleRange,
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 w-full max-w-full overflow-hidden">
      <div className="max-w-3xl mx-auto">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
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
          <h2 className="mt-4 text-xl sm:text-2xl font-bold text-gray-800 text-center">
            {userData?.userName}
          </h2>
        </div>

        {/* Membership / Subscription Plan Section */}
        {(() => {
          const isPurchased = userData?.isSubscriptionPurchase === true;
          const isBypassed = Boolean(user && isSubscriptionBypassedEmail(user.email));
          const sub = userData?.currentSubscription;

          const formatSubscriptionDate = (timestamp: any): string => {
            if (!timestamp) return "";
            try {
              const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
              if (isNaN(date.getTime())) return "";
              return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
            } catch {
              return "";
            }
          };

          const getSubCurrencySymbol = (currency?: string): string => {
            const c = (currency || "USD").toUpperCase();
            if (c === "CAD") return "C$";
            if (c === "MXN") return "Mex$";
            if (c === "GBP") return "£";
            if (c === "AUD") return "A$";
            if (c === "EUR") return "€";
            return "$";
          };

          return (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-100">
              <div className="bg-gradient-to-r from-[#F96176] to-[#e04f63] px-4 sm:px-6 py-3.5 sm:py-4 flex flex-wrap gap-2 justify-between items-center text-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/20 text-white">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                      Membership Plan
                    </h3>
                    <p className="text-xs text-white/80">
                      Your active fleet operations subscription & coverage
                    </p>
                  </div>
                </div>

                <Link
                  href="/choose-plan"
                  className="bg-white text-[#F96176] hover:bg-rose-50 px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full transition shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>{isPurchased ? "Upgrade / Change Plan" : "Choose a Plan"}</span>
                </Link>
              </div>

              <div className="p-5 sm:p-6">
                {isPurchased ? (
                  <div className="space-y-4">
                    {/* Top Status & Plan Name Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-gray-900">
                            {sub?.planName || "Fleet Operations Plan"}
                          </h4>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#58BB87] border border-emerald-200">
                            <CheckCircle2 size={12} />
                            <span>Active</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Billing Interval:{" "}
                          <span className="font-semibold text-gray-700">
                            {sub?.duration || "Monthly"}
                          </span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-2xl font-black text-gray-900">
                          {getSubCurrencySymbol(sub?.currency)}
                          {Number(sub?.amountPaid || 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-400 uppercase font-semibold">
                          Per {sub?.duration?.toLowerCase() || "month"}
                        </p>
                      </div>
                    </div>

                    {/* Fleet Limits & Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Covered Trucks */}
                      <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F96176] text-white flex items-center justify-center font-bold shrink-0">
                          <Truck size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Power Units
                          </p>
                          <p className="text-sm font-black text-gray-900">
                            {sub?.trucksCount || 0}{" "}
                            {sub?.trucksCount === 1 ? "Truck" : "Trucks"}
                          </p>
                        </div>
                      </div>

                      {/* Covered Trailers */}
                      <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#58BB87] text-white flex items-center justify-center font-bold shrink-0">
                          <Truck size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Trailed Units
                          </p>
                          <p className="text-sm font-black text-gray-900">
                            {sub?.trailersCount || 0}{" "}
                            {sub?.trailersCount === 1 ? "Trailer" : "Trailers"}
                          </p>
                        </div>
                      </div>

                      {/* Range & Capacity */}
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-700 text-white flex items-center justify-center font-bold shrink-0">
                          <Layers size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Fleet Capacity
                          </p>
                          <p className="text-sm font-black text-gray-900">
                            {(sub?.trucksCount || 0) + (sub?.trailersCount || 0)} Units{" "}
                            {sub?.vehicleRange ? `(${sub.vehicleRange})` : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expiration / Renewal Date */}
                    {Boolean(sub?.purchasedAt || sub?.expiresAt || sub?.currentPeriodEnd) && (
                      <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 gap-2">
                        {sub?.purchasedAt && (
                          <span>
                            Activated on:{" "}
                            <strong className="text-gray-700">
                              {formatSubscriptionDate(sub.purchasedAt)}
                            </strong>
                          </span>
                        )}
                        {Boolean(sub?.expiresAt || sub?.currentPeriodEnd) && (
                          <span>
                            Renews / Valid through:{" "}
                            <strong className="text-gray-700">
                              {formatSubscriptionDate(sub?.expiresAt || sub?.currentPeriodEnd)}
                            </strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : isBypassed ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#58BB87] text-white shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          Co-Owner Administrative Access
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Your account has full unlocked access across all fleet operations, dispatch, and driver management features.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#58BB87] border border-emerald-200 self-start sm:self-auto shrink-0">
                      Unlimited Access
                    </span>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#F96176] flex items-center justify-center mx-auto mb-3">
                      <AlertCircle size={24} />
                    </div>
                    <h4 className="text-base font-bold text-gray-900">
                      No Active Membership Plan
                    </h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
                      You do not currently have an active fleet membership plan. Choose a package to unlock full maintenance dispatch, driver seats, and emergency road service.
                    </p>
                    <Link
                      href="/choose-plan"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold transition shadow-md shadow-[#F96176]/20"
                    >
                      <CreditCard size={14} />
                      <span>Select Fleet Plan</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Personal Details Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-[#F96176] px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap gap-2 justify-between items-center">
            <h3 className="text-lg sm:text-xl font-semibold text-white">
              Personal Details
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white text-[#F96176] px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-full"
              >
                Edit Details
              </button>
            )}
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">City</p>
                  <input
                    type="text"
                    value={editedData.city}
                    onChange={(e) =>
                      setEditedData({ ...editedData, city: e.target.value })
                    }
                    className="mt-1 w-full p-2 border rounded"
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">State</p>
                  <input
                    type="text"
                    value={editedData.state}
                    onChange={(e) =>
                      setEditedData({ ...editedData, state: e.target.value })
                    }
                    className="mt-1 w-full p-2 border rounded"
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Country</p>
                  <input
                    type="text"
                    value={editedData.country}
                    onChange={(e) =>
                      setEditedData({ ...editedData, country: e.target.value })
                    }
                    className="mt-1 w-full p-2 border rounded"
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">
                    Vehicle Range
                  </p>
                  <select
                    value={editedData.vehicleRange}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        vehicleRange: e.target.value,
                      })
                    }
                    className="mt-1 w-full p-2 border rounded"
                  >
                    <option value="">Select Range</option>
                    {vehicleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
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
                <ProfileField label="City" value={userData?.city} />
                <ProfileField label="State" value={userData?.state} />
                <ProfileField label="Country" value={userData?.country} />
                <ProfileField
                  label="Vehicle Range"
                  value={userData?.vehicleRange}
                />
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
