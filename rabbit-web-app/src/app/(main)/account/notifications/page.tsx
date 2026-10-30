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
  vehicleId?: string;
  shareId?: string;
  title?: string;
  type?: string;
  category?: string;
  loadNumber?: string | number;
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

  // Update the notifications useEffect to use effectiveUserId
  useEffect(() => {
    if (!effectiveUserId) return; // Wait for effectiveUserId to be set

    const q = query(
      collection(db, "Users", effectiveUserId, "UserNotifications"), // Use effectiveUserId
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
  }, [effectiveUserId]); // Change dependency to effectiveUserId

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
    if (!effectiveUserId) return; // Change from user to effectiveUserId

    if (
      window.confirm("Are you sure you want to mark this notification as read?")
    ) {
      try {
        const notificationRef = doc(
          db,
          "Users",
          effectiveUserId, // Use effectiveUserId
          "UserNotifications",
          notificationId
        );
        await updateDoc(notificationRef, { isRead: true });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  // Update loading checks
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Please log in to access notifications</div>
      </div>
    );
  }

  // Add loading check for effectiveUserId
  if (!effectiveUserId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 w-full max-w-full overflow-hidden">
        {/* Role Indicator */}
        {userRole === "SubOwner" && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              Viewing notifications as Co-Owner (Owner&apos;s data)
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
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
              userId={effectiveUserId}
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
  userId, // This now receives effectiveUserId
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
              userId={userId} // Pass effectiveUserId down
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
  userId, // This now receives effectiveUserId
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
      if (!notification.vehicleId) return;
      try {
        const vehicleDoc = doc(
          db,
          "Users",
          userId, // Use the passed effectiveUserId
          "Vehicles",
          notification.vehicleId
        );

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
  }, [notification.vehicleId, userId]); // userId is now effectiveUserId

  const isFleetSharing =
    (notification.type || notification.category || "")
      .toString()
      .toLowerCase()
      .includes("fleet_sharing") ||
    !!notification.shareId;

  const isDispatch =
    (notification.type || notification.category || "")
      .toString()
      .toLowerCase() === "dispatch_load";

  const cardTitle =
    notification.title ||
    (isFleetSharing
      ? "Fleet Equipment Request"
      : isDispatch
      ? `Dispatch Load #${notification.loadNumber || ""}`
      : "Service Reminder");

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        <div
          className={`${
            isFleetSharing
              ? "bg-[#F96176]"
              : isDispatch
              ? "bg-indigo-600"
              : "bg-blue-500"
          } rounded-full p-2 shrink-0 text-white flex items-center justify-center`}
        >
          {isFleetSharing ? (
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          ) : isDispatch ? (
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
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
          )}
        </div>

        <div className="flex-1 w-full min-w-0">
          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">{cardTitle}</h3>
              {isFleetSharing && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Fleet Sharing
                </span>
              )}
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-700">
              {format(notification.date, "d MMM")}
              <span className="ml-1">{format(notification.date, "yyyy")}</span>
            </div>
          </div>

          {vehicleDetails && !isFleetSharing && (
            <p className="text-gray-600 text-sm mb-2 font-medium">
              {vehicleDetails.vehicleNumber} ({vehicleDetails.companyName})
            </p>
          )}

          <p className="text-gray-600 text-sm mb-4">{notification.message}</p>

          <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium transition cursor-pointer"
            >
              Disappear
            </button>
            <Link
              href={`/account/notifications/${notification.id}`}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-white rounded-md text-sm font-medium transition ${
                isFleetSharing
                  ? "bg-[#F96176] hover:bg-[#e05064]"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
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
