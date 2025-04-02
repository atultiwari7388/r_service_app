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
  notifications: Service[];
}

interface Service {
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number;
  subServices?: string[];
}

interface VehicleData {
  vehicleNumber: string;
  companyName: string;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch notification data
        if (!user?.uid) {
          throw new Error("User not authenticated");
        }
        const notRef = doc(db, "Users", user.uid, "UserNotifications", notId);
        const notSnapshot = await getDoc(notRef);

        if (!notSnapshot.exists()) {
          throw new Error("Notification not found");
        }

        const notData = notSnapshot.data() as NotificationData;
        setNotification(notData);

        // Fetch vehicle data
        const vehicleRef = doc(
          db,
          "Users",
          user.uid,
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
  }, [notId]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <HashLoader color="#36d7b7" size={50} />
        <span className="text-gray-700 ml-4">Loading...</span>
      </div>
    );
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!notification || !vehicleData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
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
            <InfoRow
              icon={<FaGasPump className="text-gray-600" />}
              text={`${notification.currentMiles} (current miles)`}
            />

            <div className="border-t border-gray-200 my-4" />

            {/* Services Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Services:</h2>
              <div className="space-y-4">
                {notification.notifications.map((service, index) => (
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

const ServiceItem = ({ service }: { service: Service }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <FaTools className="text-gray-500" />
        <span className="text-gray-700 font-medium">{service.serviceName}</span>
      </div>

      {service.nextNotificationValue > 0 && (
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
          <FaBell className="text-blue-500" />
          <span className="text-gray-700">{service.nextNotificationValue}</span>
        </div>
      )}
    </div>

    {/* {service.subServices?.length > 0 && (
      <div className="ml-8 text-sm text-gray-500">
        Subservices: {service.subServices.join(", ")}
      </div>
    )} */}
  </div>
);
