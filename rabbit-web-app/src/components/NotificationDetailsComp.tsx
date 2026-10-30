"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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
  FaHandshake,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaShieldAlt,
  FaExternalLinkAlt,
  FaCheck,
  FaTimes,
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
  title?: string;
  message?: string;
  vehicleId?: string;
  shareId?: string;
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

interface FleetShareDetails {
  id: string;
  shareCode?: string;
  type?: "direct_offer" | "borrow_request";
  status?: "pending" | "active" | "rejected" | "cancelled" | "completed";
  lenderId?: string;
  lenderEmail?: string;
  lenderName?: string;
  lenderCompanyName?: string;
  borrowerId?: string;
  borrowerEmail?: string;
  borrowerName?: string;
  borrowerCompanyName?: string;
  requestedCounts?: {
    trucks: number;
    trailers: number;
  };
  vehicles?: Array<{
    vehicleId: string;
    vehicleNumber: string;
    vehicleType: string;
    companyName: string;
    vin?: string;
    currentMilesAtShare: number;
    returnedMiles?: number;
  }>;
  description?: string;
  leaseTerms?: string;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  returnNotes?: string;
  createdAt?: any;
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
  const [fleetShareData, setFleetShareData] = useState<FleetShareDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth() || { user: null };
  const [effectiveUserId, setEffectiveUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isDispatchLoad =
    (notification?.type || notification?.category || "")
      .toString()
      .toLowerCase() === "dispatch_load";

  const isFleetSharing =
    (notification?.type || notification?.category || "")
      .toString()
      .toLowerCase()
      .includes("fleet_sharing") ||
    !!notification?.shareId;

  // Accept / Decline handlers for Fleet Sharing
  const handleAcceptShare = async () => {
    if (!fleetShareData) return;
    setIsActionLoading(true);
    try {
      await updateDoc(doc(db, "fleet_shares", fleetShareData.id), {
        status: "active",
        borrowerId: effectiveUserId,
        borrowerName: user?.displayName || "Partner Owner",
        lastUpdatedById: user?.uid || effectiveUserId,
        updatedAt: new Date(),
      });
      setFleetShareData((prev) => (prev ? { ...prev, status: "active" } : null));
      toast.success("Fleet share accepted! Agreement is now Active.");
    } catch (err: any) {
      console.error("Error accepting share:", err);
      toast.error("Failed to accept: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeclineShare = async () => {
    if (!fleetShareData) return;
    setIsActionLoading(true);
    try {
      await updateDoc(doc(db, "fleet_shares", fleetShareData.id), {
        status: "rejected",
        lastUpdatedById: user?.uid || effectiveUserId,
        updatedAt: new Date(),
      });
      setFleetShareData((prev) => (prev ? { ...prev, status: "rejected" } : null));
      toast.success("Fleet share request declined.");
    } catch (err: any) {
      console.error("Error declining share:", err);
      toast.error("Failed to decline: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Share handler
  const handleShare = async () => {
    if (!notification) return;

    let shareText = "";

    if (isFleetSharing) {
      const shareType =
        fleetShareData?.type === "borrow_request"
          ? "Equipment Borrow Request"
          : "Direct Fleet Sharing Offer";
      const statusStr = (fleetShareData?.status || "pending").toUpperCase();
      const codeStr =
        fleetShareData?.shareCode || notification.shareId || "Agreement";

      let vehiclesText = "";
      if (fleetShareData?.vehicles && fleetShareData.vehicles.length > 0) {
        vehiclesText =
          `• Equipment (${fleetShareData.vehicles.length} Units):\n` +
          fleetShareData.vehicles
            .map(
              (v) =>
                `  - ${v.vehicleNumber} (${v.vehicleType}) - ${v.companyName}`
            )
            .join("\n");
      } else if (fleetShareData?.requestedCounts) {
        vehiclesText = `• Requested: ${fleetShareData.requestedCounts.trucks || 0} Trucks, ${fleetShareData.requestedCounts.trailers || 0} Trailers`;
      }

      shareText = `🤝 Fleet Sharing Details | Trenoops 🚛

📋 Agreement Information:
• Code: ${codeStr}
• Type: ${shareType}
• Status: ${statusStr}

👥 Parties:
• Lender (Owner): ${fleetShareData?.lenderCompanyName || fleetShareData?.lenderName || "-"} (${fleetShareData?.lenderEmail || "-"})
• Borrower (Partner): ${fleetShareData?.borrowerCompanyName || fleetShareData?.borrowerName || "-"} (${fleetShareData?.borrowerEmail || "-"})

🚛 Equipment:
${vehiclesText || "• No specific units assigned yet"}

📅 Timeline & Purpose:
• Period: ${fleetShareData?.startDate || "-"} -> ${fleetShareData?.expectedEndDate || "Open"}
${fleetShareData?.description ? `• Purpose: ${fleetShareData.description}\n` : ""}${notification.message ? `• Note: ${notification.message}\n` : ""}
🔒 Note: Borrower can log records/expenses; master vehicle miles cannot be modified.
----------------------------------------
Trenoops Fleet & Service Management
• Website: https://www.trenoops.com/
• Android App: https://play.google.com/store/apps/details?id=com.trenoops.app
• iOS App: https://apps.apple.com/in/app/trenoops/id6765658994`;
    } else if (isDispatchLoad) {
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
          title: isFleetSharing
            ? `Fleet Sharing - ${fleetShareData?.shareCode || "Agreement"}`
            : isDispatchLoad
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

    let pageTitle = "Service Reminder Details";
    if (isFleetSharing) {
      pageTitle = "Fleet Sharing Agreement Details";
    } else if (isDispatchLoad) {
      pageTitle = "Dispatch Load Details";
    }

    const dateFormatted = formatCurrentDateMMDDYYYY();

    let contentRowsHtml = "";

    if (isFleetSharing) {
      const code = fleetShareData?.shareCode || notification.shareId || "-";
      const typeLabel =
        fleetShareData?.type === "borrow_request"
          ? "Equipment Borrow Request"
          : "Direct Fleet Sharing Offer";
      const statusLabel = (fleetShareData?.status || "pending").toUpperCase();
      const lender = `${fleetShareData?.lenderCompanyName || fleetShareData?.lenderName || "-"} (${fleetShareData?.lenderEmail || "-"})`;
      const borrower = `${fleetShareData?.borrowerCompanyName || fleetShareData?.borrowerName || "-"} (${fleetShareData?.borrowerEmail || "-"})`;

      let equipmentHtml = "";
      if (fleetShareData?.vehicles && fleetShareData.vehicles.length > 0) {
        equipmentHtml = `
          <div class="services-container">
            ${fleetShareData.vehicles
              .map(
                (v) => `
              <div class="service-item">
                <span class="service-name">${v.vehicleNumber} (${v.vehicleType} - ${v.companyName})</span>
                <span class="service-badge">${(v.currentMilesAtShare || 0).toLocaleString()} mi</span>
              </div>
            `
              )
              .join("")}
          </div>
        `;
      } else if (fleetShareData?.requestedCounts) {
        equipmentHtml = `
          <div class="service-item">
            <span class="service-name">Requested Equipment Units</span>
            <span class="service-badge">${fleetShareData.requestedCounts.trucks || 0} Trucks, ${fleetShareData.requestedCounts.trailers || 0} Trailers</span>
          </div>
        `;
      } else {
        equipmentHtml = `<div class="empty-state">No equipment units attached.</div>`;
      }

      contentRowsHtml = `
        <div class="info-row">
          <span class="info-label">Agreement Code:</span>
          <span class="info-value font-mono">${code}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Agreement Type:</span>
          <span class="info-value">${typeLabel}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value">${statusLabel}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Lender (Owner):</span>
          <span class="info-value">${lender}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Borrower (Partner):</span>
          <span class="info-value">${borrower}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Duration Period:</span>
          <span class="info-value">${fleetShareData?.startDate || "-"} &rarr; ${fleetShareData?.expectedEndDate || "Open"}</span>
        </div>
        ${
          fleetShareData?.description
            ? `
            <div class="divider"></div>
            <div class="info-row">
              <span class="info-label">Operational Need:</span>
              <span class="info-value">${fleetShareData.description}</span>
            </div>
          `
            : ""
        }
        ${
          notification.message
            ? `
            <div class="divider"></div>
            <div class="info-row">
              <span class="info-label">Notification Message:</span>
              <span class="info-value">${notification.message}</span>
            </div>
          `
            : ""
        }
        <div class="divider"></div>
        <div class="section-title">Equipment Allocation:</div>
        ${equipmentHtml}
      `;
    } else if (isDispatchLoad) {
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

  // Fetch notification, vehicle data, and fleet share data
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

        // Fetch vehicle data if service notification
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

        // Fetch fleet share details if fleet sharing notification
        if (notData.shareId) {
          try {
            const shareRef = doc(db, "fleet_shares", notData.shareId);
            const shareSnap = await getDoc(shareRef);
            if (shareSnap.exists()) {
              setFleetShareData({
                id: shareSnap.id,
                ...shareSnap.data(),
              } as FleetShareDetails);
            }
          } catch (shareErr) {
            console.error("Error fetching fleet share doc:", shareErr);
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
              {isFleetSharing
                ? notification.title || "Fleet Sharing Details"
                : isDispatchLoad
                ? "Dispatch Load Details"
                : "Service Reminder"}
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
            {isFleetSharing ? (
              /* Fleet Sharing View */
              <div className="space-y-6">
                {/* Header status bar */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg shadow-2xs">
                      <FaHandshake />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-gray-900 font-mono">
                          {fleetShareData?.shareCode || notification.shareId || "Agreement"}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                          {fleetShareData?.type === "borrow_request"
                            ? "Borrow Request"
                            : "Direct Sharing Offer"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Inter-Fleet Equipment Sharing Network
                      </p>
                    </div>
                  </div>

                  <div>
                    {fleetShareData?.status === "active" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FaCheckCircle className="text-xs text-emerald-600" />
                        Active Sharing
                      </span>
                    )}
                    {(!fleetShareData?.status || fleetShareData?.status === "pending") && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <FaClock className="text-xs text-amber-600" />
                        Pending Approval
                      </span>
                    )}
                    {fleetShareData?.status === "completed" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                        Completed / Returned
                      </span>
                    )}
                    {fleetShareData?.status === "rejected" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <FaTimesCircle className="text-xs text-rose-600" />
                        Declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Notification message banner */}
                {notification.message && (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                    <FaCommentDots className="text-base text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Notification: </strong>
                      <span>{notification.message}</span>
                    </div>
                  </div>
                )}

                {/* Parties Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lender */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1.5">
                      <FaBuilding />
                      <span>Lender Owner</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {fleetShareData?.lenderCompanyName || fleetShareData?.lenderName || "Owner"}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {fleetShareData?.lenderName}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      {fleetShareData?.lenderEmail || "—"}
                    </div>
                  </div>

                  {/* Borrower */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2 flex items-center gap-1.5">
                      <FaBuilding />
                      <span>Borrower Partner</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {fleetShareData?.borrowerCompanyName || fleetShareData?.borrowerName || "Partner"}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {fleetShareData?.borrowerName}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      {fleetShareData?.borrowerEmail || "—"}
                    </div>
                  </div>
                </div>

                {/* Equipment Section */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                    <FaTruck className="text-gray-500" />
                    <span>Equipment Details</span>
                  </div>

                  {fleetShareData?.vehicles && fleetShareData.vehicles.length > 0 ? (
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                      {fleetShareData.vehicles.map((v) => (
                        <div
                          key={v.vehicleId}
                          className="p-3 bg-gray-50/60 hover:bg-gray-50 flex items-center justify-between text-xs transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center justify-center font-bold">
                              <FaTruck className="text-xs" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 font-mono">
                                {v.vehicleNumber}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {v.vehicleType} &bull; {v.companyName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-semibold text-gray-700">
                              {(v.currentMilesAtShare || 0).toLocaleString()} mi
                            </span>
                            <div className="text-[10px] text-gray-400">At Share Dispatch</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : fleetShareData?.requestedCounts ? (
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                      <div className="font-bold text-amber-900 mb-1">
                        Requested Equipment Units:
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-white border border-amber-200 rounded-lg font-bold text-amber-800">
                          🚛 {fleetShareData.requestedCounts.trucks || 0} Trucks
                        </span>
                        <span className="px-3 py-1 bg-white border border-amber-200 rounded-lg font-bold text-amber-800">
                          📦 {fleetShareData.requestedCounts.trailers || 0} Trailers
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      No equipment units assigned yet.
                    </p>
                  )}

                  {/* Mileage Protection Notice */}
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                    <FaShieldAlt className="text-sm text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Master Mileage Protection:</strong> Second owner can add maintenance and expense records, but cannot modify master vehicle odometer miles.
                    </div>
                  </div>
                </div>

                {/* Terms and Dates */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <FaCalendarAlt className="text-gray-400" />
                      <span>Duration Period:</span>
                    </span>
                    <span className="font-bold text-gray-800 font-mono">
                      {fleetShareData?.startDate || "—"} &rarr; {fleetShareData?.expectedEndDate || "Open"}
                    </span>
                  </div>

                  {fleetShareData?.description && (
                    <div className="py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-semibold block mb-0.5">
                        Purpose / Operational Description:
                      </span>
                      <p className="text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        {fleetShareData.description}
                      </p>
                    </div>
                  )}

                  {fleetShareData?.leaseTerms && (
                    <div className="py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-semibold block mb-0.5">
                        Agreement Terms:
                      </span>
                      <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        {fleetShareData.leaseTerms}
                      </p>
                    </div>
                  )}

                  {fleetShareData?.returnNotes && (
                    <div className="py-1">
                      <span className="text-gray-500 font-semibold block mb-0.5">
                        Return Notes:
                      </span>
                      <p className="text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                        {fleetShareData.returnNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Interactive Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200 no-print">
                  <Link
                    href="/fleet-sharing"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition"
                  >
                    <span>Open Fleet Sharing Hub</span>
                    <FaExternalLinkAlt className="text-[10px]" />
                  </Link>

                  {fleetShareData?.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeclineShare}
                        disabled={isActionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                      >
                        <FaTimes className="text-xs" />
                        <span>Decline</span>
                      </button>

                      {fleetShareData.type === "borrow_request" ? (
                        <Link
                          href={`/fleet-sharing?fulfill=${fleetShareData.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                        >
                          <FaCheck className="text-xs" />
                          <span>Accept & Assign Vehicles</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAcceptShare}
                          disabled={isActionLoading}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          <FaCheck className="text-xs" />
                          <span>Accept Offer</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : isDispatchLoad ? (
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
