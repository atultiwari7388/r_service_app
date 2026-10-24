import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type AuditCategory =
  | "Records"
  | "Expenses"
  | "Checks"
  | "Team"
  | "Vehicles"
  | "Companies"
  | "Dispatch"
  | "Reports"
  | "Mechanic"
  | "Navigation"
  | "General";

export type AuditActionType =
  // Navigation / Views
  | "PAGE_VIEW"
  // Expenses
  | "EXPENSE_CREATE"
  | "EXPENSE_UPDATE"
  | "EXPENSE_DELETE"
  // Records
  | "RECORD_CREATE"
  | "RECORD_UPDATE"
  | "RECORD_DELETE"
  | "RECORD_PRINT"
  // Data imports & exports
  | "IMPORT_EXCEL"
  | "EXPORT_DATA"
  | "SEARCH_FILTER"
  // Checks
  | "CHECK_CREATE"
  | "CHECK_UPDATE"
  | "CHECK_DELETE"
  | "CHECK_PRINT"
  // Team
  | "TEAM_MEMBER_CREATE"
  | "TEAM_MEMBER_UPDATE"
  | "TEAM_MEMBER_DELETE"
  // Vehicles
  | "VEHICLE_CREATE"
  | "VEHICLE_UPDATE"
  | "VEHICLE_DELETE"
  // Companies
  | "COMPANY_CREATE"
  | "COMPANY_UPDATE"
  // Dispatch
  | "LOAD_CREATE"
  | "LOAD_UPDATE"
  | "LOAD_STATUS_UPDATE"
  | "LOAD_DELETE"
  | "DISPATCH_SETTINGS_CREATE"
  | "DISPATCH_SETTINGS_UPDATE"
  // Reports
  | "REPORT_EXPORT"
  // Mechanic
  | "MECHANIC_SEARCH"
  // General
  | "CUSTOM";

export interface AuditLogUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
}

export interface AuditLogEntry {
  id?: string;
  ownerId: string;
  performedBy: AuditLogUser;
  action: AuditActionType;
  category: AuditCategory;
  title: string;
  description?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  path?: string;
  timestamp?: any;
}

export interface LogActivityParams {
  userId: string;
  ownerId?: string; // Optional: if omitted, will be resolved automatically
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userProfilePic?: string;
  action: AuditActionType;
  category: AuditCategory;
  title: string;
  description?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  path?: string;
}

/**
 * Non-blocking, fire-and-forget activity logger.
 * Stores audit logs in Users/{ownerId}/audit_logs.
 * Automatically resolves ownerId and user details if not provided.
 * Never throws errors to caller or interrupts primary UX.
 */
export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    if (!params.userId) {
      console.warn("[AuditLogger] Missing userId, skipping log.");
      return;
    }

    let resolvedOwnerId = "";
    let finalUserName = params.userName || "";
    let finalUserEmail = params.userEmail || "";
    let finalUserRole = params.userRole || "";
    let finalUserProfilePic = params.userProfilePic || "";

    // Always fetch current user document from Users collection to determine true creator/owner
    try {
      const uSnap = await getDoc(doc(db, "Users", params.userId));
      if (uSnap.exists()) {
        const uData = uSnap.data();
        if (!finalUserName) finalUserName = uData.userName || uData.name || uData.email || "Unknown";
        if (!finalUserEmail) finalUserEmail = uData.email || "";
        if (!finalUserRole) finalUserRole = uData.role || "Member";
        if (!finalUserProfilePic) finalUserProfilePic = uData.profilePicture || "";

        const createdByVal = uData.createdBy ? String(uData.createdBy).trim() : "";

        // Core rule:
        // If createdBy exists and is different from current user UID,
        // it means current user is a Team Member, SubOwner, Accountant, Manager, Driver, etc.
        // And createdBy points directly to the main Owner's UID.
        if (createdByVal && createdByVal !== params.userId) {
          resolvedOwnerId = createdByVal;
        } else {
          // If createdBy == currentUID or createdBy is missing, this user is the Owner
          resolvedOwnerId = params.userId;
        }
      }
    } catch (e) {
      console.warn("[AuditLogger] Error fetching user doc:", e);
    }

    // Fallback if firestore fetch failed
    if (!resolvedOwnerId) {
      if (params.ownerId && params.ownerId !== params.userId) {
        resolvedOwnerId = params.ownerId;
      } else {
        resolvedOwnerId = params.userId;
      }
    }

    // RULE: If current user is the Owner themselves (userId === resolvedOwnerId or role === Owner),
    // do NOT save audit log. Audit logs are exclusively for Owner to track their team members / SubOwners.
    const isOwner =
      params.userId === resolvedOwnerId ||
      (finalUserRole && finalUserRole.toLowerCase() === "owner");

    if (isOwner) {
      return;
    }

    const currentPath =
      params.path ||
      (typeof window !== "undefined" ? window.location.pathname : "");

    const logPayload = {
      ownerId: resolvedOwnerId,
      performedBy: {
        uid: params.userId,
        name: finalUserName || "Unknown User",
        email: finalUserEmail || "",
        role: finalUserRole || "Team Member",
        profilePicture: finalUserProfilePic || "",
      },
      action: params.action,
      category: params.category,
      title: params.title,
      description: params.description || "",
      targetId: params.targetId || "",
      targetName: params.targetName || "",
      metadata: params.metadata || {},
      path: currentPath,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      createdDate: new Date().toISOString(),
    };

    // Store in Users/{resolvedOwnerId}/audit_logs
    addDoc(collection(db, "Users", resolvedOwnerId, "audit_logs"), logPayload).catch(
      (err) => {
        console.warn("[AuditLogger] Background write failed:", err);
      }
    );
  } catch (error) {
    console.warn("[AuditLogger] Error executing logActivity:", error);
  }
};
