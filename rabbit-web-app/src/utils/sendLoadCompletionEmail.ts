import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export interface LoadCompletionEmailParams {
  loadId: string;
  loadData?: any;
  showToast?: boolean;
}

export async function sendLoadCompletionEmail({
  loadId,
  loadData,
  showToast = true,
}: LoadCompletionEmailParams): Promise<{
  success: boolean;
  recipients?: string[];
  error?: string;
}> {
  try {
    let currentLoad = loadData;
    let targetCollection = "dispatch_loads";

    // If load data is not provided or incomplete, fetch fresh from Firestore
    if (!currentLoad || !currentLoad.documents || !currentLoad.loadNumber) {
      let loadSnap = await getDoc(doc(db, "dispatch_loads", loadId));
      if (!loadSnap.exists()) {
        loadSnap = await getDoc(doc(db, "Loads", loadId));
        if (loadSnap.exists()) {
          targetCollection = "Loads";
        } else {
          throw new Error("Load record not found in database");
        }
      }
      currentLoad = { id: loadSnap.id, ...loadSnap.data() };
    }

    // 1. Resolve Driver Info & Email
    let driverEmail = currentLoad.driverEmail || "";
    let driverName = currentLoad.driverName || currentLoad.driver || "";

    if (!driverEmail && currentLoad.driverId) {
      try {
        const driverSnap = await getDoc(doc(db, "Users", currentLoad.driverId));
        if (driverSnap.exists()) {
          const driverData = driverSnap.data();
          driverEmail = driverData.email || "";
          if (!driverName) {
            driverName = driverData.userName || driverData.name || driverEmail;
          }
        }
      } catch (e) {
        console.warn("Could not fetch driver email from Users:", e);
      }
    }

    // If assigned to a carrier
    if (!driverEmail && currentLoad.carrierId) {
      try {
        const carrierSnap = await getDoc(doc(db, "Carriers", currentLoad.carrierId));
        if (carrierSnap.exists()) {
          const carrierData = carrierSnap.data();
          driverEmail = carrierData.email || "";
          if (!driverName) {
            driverName = carrierData.companyName || carrierData.name || "";
          }
        }
      } catch (e) {
        console.warn("Could not fetch carrier email:", e);
      }
    }

    // 2. Resolve Consignee Info & Email
    let consigneeEmail =
      currentLoad.consigneeEmail ||
      currentLoad.customerEmail ||
      "";
    let consigneeName =
      currentLoad.consigneeName ||
      currentLoad.customerName ||
      currentLoad.customer ||
      "";

    // Check delivery stops for email if not found on root load object
    const deliveries = currentLoad.deliveries || [];
    if (!consigneeEmail && deliveries.length > 0) {
      for (const stop of deliveries) {
        if (stop.email && typeof stop.email === "string" && stop.email.includes("@")) {
          consigneeEmail = stop.email.trim();
        } else if (stop.contactEmail && typeof stop.contactEmail === "string" && stop.contactEmail.includes("@")) {
          consigneeEmail = stop.contactEmail.trim();
        }
        if (!consigneeName && (stop.contactPerson || stop.consignee || stop.name)) {
          consigneeName = stop.contactPerson || stop.consignee || stop.name;
        }
        if (consigneeEmail) break;
      }
    }

    // 3. Resolve Origin, Destination & Dates
    const pickups = currentLoad.pickups || [];
    const firstPickup = pickups[0];
    const lastDelivery = deliveries[deliveries.length - 1];

    const origin =
      firstPickup?.address ||
      firstPickup?.locationNotes ||
      currentLoad.pickupLocation ||
      "Origin Location";
    const destination =
      lastDelivery?.address ||
      lastDelivery?.locationNotes ||
      currentLoad.deliveryLocation ||
      "Destination Location";
    const deliveryDate =
      lastDelivery?.date ||
      currentLoad.deliveryDate ||
      new Date().toLocaleDateString();

    // 4. Resolve Documents
    const rawDocuments = currentLoad.documents || [];
    const documents = rawDocuments
      .filter((d: any) => d && (d.url || d.storagePath))
      .map((d: any) => ({
        id: d.id,
        name: d.name || d.type || "Shipment Document",
        type: d.type || "Document",
        url: d.url || "#",
        size: d.size || 0,
        uploadedByName: d.uploadedByName || d.uploadedByRole || "",
      }));

    if (!driverEmail && !consigneeEmail) {
      if (showToast) {
        toast.error(
          "Could not send email: Neither driver email nor consignee email is registered for this load.",
          { duration: 5000 }
        );
      }
      return {
        success: false,
        error: "No driver or consignee email found for this load.",
      };
    }

    // 5. Call the Next.js API Route
    const response = await fetch("/api/send-load-completed-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loadId,
        loadNumber: currentLoad.loadNumber || "N/A",
        customerName: consigneeName || currentLoad.customer || "",
        origin,
        destination,
        deliveryDate,
        driverEmail: driverEmail || undefined,
        driverName: driverName || undefined,
        consigneeEmail: consigneeEmail || undefined,
        consigneeName: consigneeName || undefined,
        documents,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to send completion documents email");
    }

    // 6. Record metadata & history in Firestore
    try {
      await updateDoc(doc(db, targetCollection, loadId), {
        completionEmailSent: true,
        completionEmailSentAt: serverTimestamp(),
        completionEmailRecipients: result.recipients || [],
      });

      // Add to History subcollection if available
      await addDoc(collection(db, targetCollection, loadId, "history"), {
        action: "email-completed-docs",
        description: `Sent completion document package (${documents.length} docs) to ${result.recipients?.join(", ")}`,
        performedBy: "System Dispatcher",
        timestamp: serverTimestamp(),
        metadata: {
          recipients: result.recipients,
          documentsCount: documents.length,
        },
      });
    } catch (dbErr) {
      console.warn("Could not record completion email history:", dbErr);
    }

    if (showToast) {
      if (result.wasReroutedForTesting) {
        toast.success(
          `[Test Mode] Documents emailed to ${result.actualRecipients?.[0] || "admin email"}. Verify domain on resend.com to send to live driver emails.`,
          { duration: 6000 }
        );
      } else {
        toast.success(
          `Delivery documents successfully emailed to ${result.recipients?.join(", ")}! ✉️`,
          { duration: 5000 }
        );
      }
    }

    return {
      success: true,
      recipients: result.recipients,
    };
  } catch (error: any) {
    console.error("Error in sendLoadCompletionEmail:", error);
    if (showToast) {
      toast.error(error.message || "Failed to send completion documents email");
    }
    return {
      success: false,
      error: error.message || "Failed to send completion email",
    };
  }
}
