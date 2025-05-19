"use client";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContexts";

interface Notification {
  id: string;
  message: string;
  vehicleId: string;
  date: Date;
  isRead: boolean;
  // [key: string]: any;
}

interface VehicleDetails {
  companyName: string;
  vehicleNumber: string;
  // [key: string]: any;
}

const NotificationPage = () => {
  const { user } = useAuth() || { user: null };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "Users", user.uid, "UserNotifications"),
      where("isRead", "==", false),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData: Notification[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as Notification[];

      setNotifications(notificationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const groupNotificationsByDate = () => {
    const grouped: { [key: string]: Notification[] } = {};

    notifications.forEach((notification) => {
      const dateKey = format(notification.date, "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(notification);
    });

    return grouped;
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.uid) return;

    if (
      window.confirm("Are you sure you want to mark this notification as read?")
    ) {
      try {
        const notificationRef = doc(
          db,
          "Users",
          user.uid,
          "UserNotifications",
          notificationId
        );
        await updateDoc(notificationRef, { isRead: true });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Notification Center
          </h1>

          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notifications found
            </div>
          ) : (
            <NotificationList
              groupedNotifications={groupNotificationsByDate()}
              onMarkAsRead={handleMarkAsRead}
              userId={user?.uid || ""}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationList = ({
  groupedNotifications,
  onMarkAsRead,
  userId,
}: {
  groupedNotifications: { [key: string]: Notification[] };
  onMarkAsRead: (id: string) => void;
  userId: string;
}) => {
  const sortedDates = Object.keys(groupedNotifications).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          {groupedNotifications[dateKey].map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              userId={userId}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const NotificationCard = ({
  notification,
  onMarkAsRead,
  userId,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  userId: string;
}) => {
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(
    null
  );

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        const vehicleDoc = await doc(
          db,
          "Users",
          userId,
          "Vehicles",
          notification.vehicleId
        );

        // You'll need to implement getDoc here
        const vehicleSnapshot = await getDoc(vehicleDoc);
        if (vehicleSnapshot.exists()) {
          setVehicleDetails(vehicleSnapshot.data() as VehicleDetails);
        }
      } catch (error) {
        console.error("Error fetching vehicle details:", error);
      }
    };

    if (notification.vehicleId) {
      fetchVehicleDetails();
    }
  }, [notification.vehicleId, userId]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-100">
      <div className="flex items-start gap-4">
        <div className="bg-blue-500 rounded-full p-2">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-800">Service Reminder</h3>
            <div className="bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-800">
              {format(notification.date, "d MMM")}
              <span className="ml-1">{format(notification.date, "yyyy")}</span>
            </div>
          </div>

          {vehicleDetails && (
            <p className="text-gray-600 text-sm mb-2">
              {vehicleDetails.companyName} ({vehicleDetails.vehicleNumber})
            </p>
          )}

          <p className="text-gray-600 text-sm mb-4">{notification.message}</p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              Mark as Read
            </button>
            <Link
              href={`/account/notifications/${notification.id}`}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
