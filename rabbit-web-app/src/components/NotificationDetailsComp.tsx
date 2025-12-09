"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaCar, FaGasPump, FaTools, FaBell } from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContexts";
import { HashLoader } from "react-spinners";

interface NotificationData {
  message: string;
  vehicleId: string;
  currentMiles: number;
  hoursReading: number;
  notifications: Service[];
}

interface Service {
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number | string;
  subServices?: string[];
  type: string;
}

interface VehicleData {
  vehicleNumber: string;
  companyName: string;
  vehicleType: string;
}

export default function NotificationDetailsComponent({
  notId,
}: {
  notId: string;
}) {
  const [notification, setNotification] = useState<NotificationData | null>(
    null
  );
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth() || { user: null };
  const [effectiveUserId, setEffectiveUserId] = useState(""); // Add effectiveUserId state
  const [userRole, setUserRole] = useState(""); // Add user role state

  // Fetch user data and determine effectiveUserId
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || "");

          // Determine effectiveUserId based on role
          if (userData.role === "SubOwner" && userData.createdBy) {
            setEffectiveUserId(userData.createdBy);
            console.log(
              "SubOwner detected, using effectiveUserId:",
              userData.createdBy
            );
          } else {
            setEffectiveUserId(user.uid);
            console.log("Regular user, using own uid:", user.uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  // Update the main data fetching useEffect to use effectiveUserId
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!effectiveUserId) return; // Wait for effectiveUserId to be set

        // Fetch notification data using effectiveUserId
        const notRef = doc(
          db,
          "Users",
          effectiveUserId,
          "UserNotifications",
          notId
        ); // Use effectiveUserId
        const notSnapshot = await getDoc(notRef);

        if (!notSnapshot.exists()) {
          throw new Error("Notification not found");
        }

        const notData = notSnapshot.data() as NotificationData;
        setNotification(notData);

        // Fetch vehicle data using effectiveUserId
        const vehicleRef = doc(
          db,
          "Users",
          effectiveUserId, // Use effectiveUserId
          "Vehicles",
          notData.vehicleId
        );
        const vehicleSnapshot = await getDoc(vehicleRef);

        if (vehicleSnapshot.exists()) {
          setVehicleData(vehicleSnapshot.data() as VehicleData);
        }
      } catch (err) {
        setError("Failed to load notification details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [notId, effectiveUserId]); // Add effectiveUserId to dependencies

  // Update loading checks
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">
          Please log in to view notification details
        </div>
      </div>
    );
  }

  // Add loading check for effectiveUserId
  if (!effectiveUserId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <HashLoader color="#36d7b7" size={50} />
        <span className="text-gray-700 ml-4">Loading user data...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <HashLoader color="#36d7b7" size={50} />
        <span className="text-gray-700 ml-4">
          Loading notification details...
        </span>
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!notification || !vehicleData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Role Indicator */}
        {userRole === "SubOwner" && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              Viewing notification as Co-Owner (Owner&apos;s data)
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Service Reminder
            </h1>
            <Link
              href="/account/notifications"
              className="text-blue-500 hover:underline"
            >
              Back to Notifications
            </Link>
          </div>

          <div className="space-y-6">
            {/* Vehicle Info Row */}
            <InfoRow
              icon={<FaCar className="text-gray-600" />}
              text={`${vehicleData.vehicleNumber} (${vehicleData.companyName})`}
            />

            <div className="border-t border-gray-200 my-4" />

            {/* Current Miles Row */}
            {vehicleData.vehicleType === "Trailer" ? (
              <InfoRow
                icon={<FaGasPump className="text-gray-600" />}
                text={`${notification.hoursReading} (current hours)`}
              />
            ) : (
              <InfoRow
                icon={<FaGasPump className="text-gray-600" />}
                text={`${notification.currentMiles} (current miles)`}
              />
            )}

            <div className="border-t border-gray-200 my-4" />

            {/* Services Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Services:</h2>
              <div className="space-y-4">
                {[...notification.notifications]
                  .sort((a, b) => a.serviceName.localeCompare(b.serviceName))
                  .map((service, index) => (
                    <ServiceItem key={index} service={service} />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoRow = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-start gap-4">
    <div className="mt-1">{icon}</div>
    <p className="text-gray-600 flex-1">{text}</p>
  </div>
);

const ServiceItem = ({ service }: { service: Service }) => {
  if (service.nextNotificationValue === 0) return null;

  const formatToMMDDYYYY = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // fallback if invalid

    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const formattedValue =
    service.type === "day"
      ? formatToMMDDYYYY(String(service.nextNotificationValue))
      : service.nextNotificationValue;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaTools className="text-gray-500" />
          <span className="text-gray-700 font-medium">
            {service.serviceName}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
          <FaBell className="text-blue-500" />
          <span className="text-gray-700">{formattedValue}</span>
        </div>
      </div>
    </div>
  );
};
