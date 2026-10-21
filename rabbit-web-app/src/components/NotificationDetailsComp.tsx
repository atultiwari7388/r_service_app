"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FaCar,
  FaGasPump,
  FaTools,
  FaBell,
  FaShareAlt,
  FaPrint,
  FaTruck,
  FaBuilding,
  FaMapMarkerAlt,
  FaRoute,
  FaCommentDots,
} from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContexts";
import { HashLoader } from "react-spinners";
import toast from "react-hot-toast";

interface Service {
  serviceName: string;
  defaultNotificationValue?: number;
  nextNotificationValue: number | string;
  subServices?: string[];
  type?: string;
}

interface NotificationData {
  message?: string;
  vehicleId?: string;
  currentMiles?: number;
  hoursReading?: number;
  notifications?: Service[];
  type?: string;
  category?: string;
  loadNumber?: string | number;
  customerName?: string;
  pickupCompany?: string;
  deliveryCompany?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  tenderedMiles?: string | number;
  vehicleNumber?: string;
  companyName?: string;
}

interface VehicleData {
  vehicleNumber: string;
  companyName: string;
  vehicleType: string;
}

const formatDDMMYYYYtoMMDDYYYY = (value: string | number) => {
  const str = String(value);
  const [dd, mm, yyyy] = str.split("/");

  if (!dd || !mm || !yyyy) return str;

  return `${mm}/${dd}/${yyyy}`;
};

const formatCurrentDateMMDDYYYY = () => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
};

export default function NotificationDetailsComponent({
  notId,
}: {
  notId: string;
}) {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth() || { user: null };
  const [effectiveUserId, setEffectiveUserId] = useState("");
  const [userRole, setUserRole] = useState("");

  const isDispatchLoad =
    (notification?.type || notification?.category || "")
      .toString()
      .toLowerCase() === "dispatch_load";

  // Share handler
  const handleShare = async () => {
    if (!notification) return;

    let shareText = "";

    if (isDispatchLoad) {
      shareText = `📦 Dispatch Load Details | Trenoops 🚛

• Load Number: ${notification.loadNumber || "-"}
• Customer: ${notification.customerName || "-"}
• Route: ${notification.pickupCompany || "-"} -> ${notification.deliveryCompany || "-"}
• Pickup Address: ${notification.pickupAddress || "-"}
• Delivery Address: ${notification.deliveryAddress || "-"}
• Tendered Miles: ${notification.tenderedMiles || "-"}
${notification.message ? `• Message: ${notification.message}\n` : ""}
----------------------------------------
Trenoops
• Website: https://www.trenoops.com/
• Android App: https://play.google.com/store/apps/details?id=com.trenoops.app
• iOS App: https://apps.apple.com/in/app/trenoops/id6765658994`;
    } else {
      if (!vehicleData) return;
      const isTrailer = vehicleData.vehicleType === "Trailer";
      const readingText = isTrailer
        ? `${notification.hoursReading ?? 0} (current hours)`
        : `${notification.currentMiles ?? 0} (current miles)`;

      const dueServices = [...(notification.notifications || [])]
        .filter((s) => (s.nextNotificationValue ?? 0) !== 0)
        .sort((a, b) => (a.serviceName || "").localeCompare(b.serviceName || ""))
        .map((s) => {
          const val =
            s.type === "day"
              ? formatDDMMYYYYtoMMDDYYYY(s.nextNotificationValue)
              : `${s.nextNotificationValue} ${isTrailer ? "hrs" : "mi"}`;
          return `• ${s.serviceName}: ${val}`;
        })
        .join("\n");

      shareText = `🚚 Service Reminder | Trenoops 🔧

📋 Vehicle Information:
• Vehicle Number: ${vehicleData.vehicleNumber}
• Company: ${vehicleData.companyName}
• Vehicle Type: ${vehicleData.vehicleType}
• Current Reading: ${readingText}

🔔 Next Due Services:
${dueServices || "• No pending services due"}

----------------------------------------
Trenoops
• Website: https://www.trenoops.com/
• Android App: https://play.google.com/store/apps/details?id=com.trenoops.app
• iOS App: https://apps.apple.com/in/app/trenoops/id6765658994`;
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: isDispatchLoad
            ? `Dispatch Load - ${notification.loadNumber || "Load"}`
            : `Service Reminder - ${vehicleData?.vehicleNumber || "Vehicle"}`,
          text: shareText,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Notification details copied to clipboard!");
    } catch {
      toast.error("Failed to copy details.");
    }
  };

  // Print handler - Exact design parity with rabbit_service_d_app notification_detail_screen.dart
  const handlePrint = () => {
    if (!notification) return;

    const pageTitle = isDispatchLoad
      ? "Dispatch Load Details"
      : "Service Reminder Details";
    const dateFormatted = formatCurrentDateMMDDYYYY();

    let contentRowsHtml = "";

    if (isDispatchLoad) {
      contentRowsHtml = `
        <div class="info-row">
          <span class="info-label">Load Number:</span>
          <span class="info-value">${notification.loadNumber ?? "-"}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Customer:</span>
          <span class="info-value">${notification.customerName ?? "-"}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Route:</span>
          <span class="info-value">${notification.pickupCompany ?? "-"} &rarr; ${notification.deliveryCompany ?? "-"}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Pickup Address:</span>
          <span class="info-value">${notification.pickupAddress ?? "-"}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Delivery Address:</span>
          <span class="info-value">${notification.deliveryAddress ?? "-"}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Tendered Miles:</span>
          <span class="info-value">${notification.tenderedMiles ?? "-"}</span>
        </div>
        ${
          notification.message && notification.message.trim()
            ? `
            <div class="divider"></div>
            <div class="info-row">
              <span class="info-label">Message:</span>
              <span class="info-value">${notification.message}</span>
            </div>
            `
            : ""
        }
      `;
    } else {
      const vNumber =
        vehicleData?.vehicleNumber || notification.vehicleNumber || "Unknown";
      const cName =
        vehicleData?.companyName || notification.companyName || "Unknown";
      const isTrailer = vehicleData?.vehicleType === "Trailer";

      const currentReading =
        notification.currentMiles != null
          ? `${notification.currentMiles} (current miles)`
          : notification.hoursReading != null
          ? `${notification.hoursReading} (current Hours)`
          : "N/A";

      const services = notification.notifications || [];
      const sortedServices = [...services].sort((a, b) =>
        (a.serviceName || "").toLowerCase().localeCompare((b.serviceName || "").toLowerCase())
      );
      const filteredServices = sortedServices.filter(
        (s) => (s.nextNotificationValue ?? 0) !== 0
      );

      const servicesHtml =
        filteredServices.length === 0
          ? `<div class="empty-state">No services due.</div>`
          : filteredServices
              .map((service) => {
                const sName = service.serviceName || "";
                const val =
                  service.type === "day"
                    ? formatDDMMYYYYtoMMDDYYYY(service.nextNotificationValue)
                    : `${service.nextNotificationValue} ${isTrailer ? "hrs" : "mi"}`;

                return `
                <div class="service-item">
                  <span class="service-name">${sName}</span>
                  <span class="service-badge">${val}</span>
                </div>
              `;
              })
              .join("");

      contentRowsHtml = `
        <div class="info-row">
          <span class="info-label">Vehicle:</span>
          <span class="info-value">${vNumber} (${cName})</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Current Reading:</span>
          <span class="info-value">${currentReading}</span>
        </div>
        <div class="divider"></div>
        <div class="section-title">Next Due Services:</div>
        <div class="services-container">
          ${servicesHtml}
        </div>
      `;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${pageTitle}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #111827;
              background: #FFFFFF;
            }
            .header-banner {
              background-color: #F96176 !important;
              color: #FFFFFF !important;
              padding: 14px 18px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }
            .header-title {
              font-size: 16px;
              font-weight: 700;
              margin: 0;
              letter-spacing: -0.01em;
            }
            .header-date {
              font-size: 12px;
              font-weight: 500;
              opacity: 0.95;
            }
            .content-card {
              border: 1px solid #E5E7EB;
              border-radius: 8px;
              padding: 18px;
              background-color: #FFFFFF;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 6px 0;
            }
            .info-label {
              font-size: 13px;
              font-weight: 700;
              color: #4B5563;
              min-width: 140px;
            }
            .info-value {
              font-size: 13px;
              color: #111827;
              font-weight: 500;
              text-align: right;
              max-width: 65%;
              word-break: break-word;
            }
            .divider {
              border: 0;
              border-top: 1px solid #E5E7EB;
              margin: 12px 0;
            }
            .section-title {
              font-size: 13px;
              font-weight: 700;
              color: #F96176;
              margin: 14px 0 10px 0;
            }
            .services-container {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .service-item {
              background-color: #F3F4F6 !important;
              border-radius: 6px;
              padding: 9px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .service-name {
              font-size: 12px;
              font-weight: 700;
              color: #1F2937;
            }
            .service-badge {
              background-color: #58BB87 !important;
              color: #FFFFFF !important;
              font-size: 12px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 4px;
              white-space: nowrap;
            }
            .empty-state {
              font-size: 12px;
              color: #6B7280;
              padding: 8px 0;
            }
            .footer-branding {
              margin-top: 28px;
              text-align: center;
              font-size: 11px;
              color: #9CA3AF;
              border-top: 1px solid #F3F4F6;
              padding-top: 12px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="header-title">${pageTitle}</div>
            <div class="header-date">${dateFormatted}</div>
          </div>
          <div class="content-card">
            ${contentRowsHtml}
          </div>
          <div class="footer-branding">
            Trenoops Fleet & Service Management • www.trenoops.com
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    // Try opening clean print window first
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
    } else {
      // Fallback: direct window.print() if popups are restricted
      window.print();
    }
  };

  // Fetch user data and determine effectiveUserId
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || "");

          if (userData.role === "SubOwner" && userData.createdBy) {
            setEffectiveUserId(userData.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  // Fetch notification and vehicle data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!effectiveUserId) return;

        const notRef = doc(
          db,
          "Users",
          effectiveUserId,
          "UserNotifications",
          notId
        );
        const notSnapshot = await getDoc(notRef);

        if (!notSnapshot.exists()) {
          throw new Error("Notification not found");
        }

        const notData = notSnapshot.data() as NotificationData;
        setNotification(notData);

        if (notData.vehicleId) {
          const vehicleRef = doc(
            db,
            "Users",
            effectiveUserId,
            "Vehicles",
            notData.vehicleId
          );
          const vehicleSnapshot = await getDoc(vehicleRef);

          if (vehicleSnapshot.exists()) {
            setVehicleData(vehicleSnapshot.data() as VehicleData);
          }
        }
      } catch (err) {
        setError("Failed to load notification details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [notId, effectiveUserId]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">
          Please log in to view notification details
        </div>
      </div>
    );
  }

  if (!effectiveUserId || loading) {
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
  if (!notification) return null;

  const services = (notification.notifications || []).filter(
    (s) => (s.nextNotificationValue ?? 0) !== 0
  );
  const sortedServices = [...services].sort((a, b) =>
    (a.serviceName || "").localeCompare(b.serviceName || "")
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      {/* Print-specific style tag for direct window.print() support */}
      <style jsx global>{`
        @media print {
          nav,
          header,
          footer,
          aside,
          .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4">
        {/* Role Indicator */}
        {userRole === "SubOwner" && (
          <div className="no-print mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              Viewing notification as Co-Owner (Owner&apos;s data)
            </p>
          </div>
        )}

        <div className="print-container bg-white rounded-xl shadow-xs p-6 border border-gray-200">
          {/* Top Bar with Title, Print Button, Share Button and Back Button */}
          <div className="mb-6 flex flex-wrap justify-between items-center gap-3 no-print">
            <h1 className="text-2xl font-bold text-gray-800">
              {isDispatchLoad ? "Dispatch Load Details" : "Service Reminder"}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* PRINT BUTTON */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#58BB87] hover:bg-[#48a674] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Print notification details"
              >
                <FaPrint className="text-white text-xs sm:text-sm" />
                <span>Print</span>
              </button>

              {/* SHARE BUTTON */}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#F96176] hover:bg-[#e05064] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Share notification details"
              >
                <FaShareAlt className="text-white text-xs sm:text-sm" />
                <span>Share</span>
              </button>

              {/* BACK BUTTON */}
              <Link
                href="/account/notifications"
                className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-100 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors"
              >
                Back to Notifications
              </Link>
            </div>
          </div>

          {/* MAIN NOTIFICATION CONTENT */}
          <div className="space-y-6">
            {isDispatchLoad ? (
              /* Dispatch Load View */
              <div className="space-y-4">
                <InfoRow
                  icon={<FaTruck className="text-gray-600" />}
                  label="Load Number"
                  text={String(notification.loadNumber || "Load")}
                />
                <div className="border-t border-gray-200 my-3" />

                <InfoRow
                  icon={<FaBuilding className="text-gray-600" />}
                  label="Customer"
                  text={String(notification.customerName || "-")}
                />
                <div className="border-t border-gray-200 my-3" />

                <InfoRow
                  icon={<FaRoute className="text-gray-600" />}
                  label="Route"
                  text={`${notification.pickupCompany || "-"} -> ${notification.deliveryCompany || "-"}`}
                />
                <div className="border-t border-gray-200 my-3" />

                <InfoRow
                  icon={<FaMapMarkerAlt className="text-gray-600" />}
                  label="Pickup Address"
                  text={String(notification.pickupAddress || "-")}
                />
                <div className="border-t border-gray-200 my-3" />

                <InfoRow
                  icon={<FaMapMarkerAlt className="text-gray-600" />}
                  label="Delivery Address"
                  text={String(notification.deliveryAddress || "-")}
                />
                <div className="border-t border-gray-200 my-3" />

                <InfoRow
                  icon={<FaRoute className="text-gray-600" />}
                  label="Tendered Miles"
                  text={String(notification.tenderedMiles || "-")}
                />

                {notification.message && (
                  <>
                    <div className="border-t border-gray-200 my-3" />
                    <InfoRow
                      icon={<FaCommentDots className="text-gray-600" />}
                      label="Message"
                      text={notification.message}
                    />
                  </>
                )}
              </div>
            ) : (
              /* Service Reminder View */
              <>
                {vehicleData && (
                  <InfoRow
                    icon={<FaCar className="text-gray-600" />}
                    text={`${vehicleData.vehicleNumber} (${vehicleData.companyName})`}
                  />
                )}

                <div className="border-t border-gray-200 my-4" />

                {/* Current Reading */}
                {vehicleData?.vehicleType === "Trailer" ? (
                  <InfoRow
                    icon={<FaGasPump className="text-gray-600" />}
                    text={`${notification.hoursReading ?? 0} (current hours)`}
                  />
                ) : (
                  <InfoRow
                    icon={<FaGasPump className="text-gray-600" />}
                    text={`${notification.currentMiles ?? 0} (current miles)`}
                  />
                )}

                <div className="border-t border-gray-200 my-4" />

                {/* Services Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Next Due :
                  </h2>
                  <div className="space-y-3">
                    {sortedServices.length === 0 ? (
                      <p className="text-gray-500 text-sm">No services due.</p>
                    ) : (
                      sortedServices.map((service, index) => (
                        <ServiceItem
                          key={index}
                          service={service}
                          isTrailer={vehicleData?.vehicleType === "Trailer"}
                        />
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoRow = ({
  icon,
  text,
  label,
}: {
  icon: React.ReactNode;
  text: string;
  label?: string;
}) => (
  <div className="flex items-start gap-4">
    <div className="mt-1 text-gray-500 shrink-0">{icon}</div>
    <div className="flex-1">
      {label && <span className="font-semibold text-gray-700 mr-2">{label}:</span>}
      <span className="text-gray-800">{text}</span>
    </div>
  </div>
);

const ServiceItem = ({
  service,
  isTrailer,
}: {
  service: Service;
  isTrailer?: boolean;
}) => {
  if ((service.nextNotificationValue ?? 0) === 0) return null;

  const formattedValue =
    service.type === "day"
      ? formatDDMMYYYYtoMMDDYYYY(service.nextNotificationValue)
      : `${service.nextNotificationValue} ${isTrailer ? "hrs" : "mi"}`;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center gap-3">
        <FaTools className="text-gray-500 shrink-0" />
        <span className="text-gray-800 font-medium text-sm">
          {service.serviceName}
        </span>
      </div>

      <div className="flex items-center gap-2 bg-[#58BB87]/15 text-[#58BB87] px-3 py-1 rounded-full font-bold text-xs sm:text-sm">
        <FaBell className="text-[#58BB87]" />
        <span>{formattedValue}</span>
      </div>
    </div>
  );
};
