"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContexts";
import { logActivity, AuditCategory } from "@/lib/auditLogger";

const routeNameToCategory: Record<string, { title: string; category: AuditCategory }> = {
  "/": { title: "Home / Find Mechanic", category: "Mechanic" },
  "/records": { title: "Service Records", category: "Records" },
  "/other-expenses": { title: "Other Expenses", category: "Expenses" },
  "/account/manage-check": { title: "Manage Checks", category: "Checks" },
  "/account/my-vehicles": { title: "My Vehicles", category: "Vehicles" },
  "/my-companies": { title: "My Companies", category: "Companies" },
  "/account/manage-team": { title: "Manage Team", category: "Team" },
  "/account/activity-logs": { title: "Activity Logs", category: "General" },
  "/truck-dispatch": { title: "Truck Dispatch", category: "Dispatch" },
  "/create-new-load": { title: "Create New Load", category: "Dispatch" },
  "/dispatch-settings": { title: "Dispatch Settings", category: "Dispatch" },
  "/dispatch-reports": { title: "Dispatch Reports", category: "Reports" },
  "/import-record": { title: "Import Records", category: "Records" },
  "/import-vehicle": { title: "Import Vehicles", category: "Vehicles" },
};

/**
 * Global Activity Tracker:
 * Automatically records PAGE_VIEW audit entries when users navigate between pages.
 * Debounced & non-blocking; automatically attaches user role, owner id, and route info.
 */
export default function GlobalActivityTracker() {
  const pathname = usePathname();
  const authContext = useAuth();
  const user = authContext?.user;
  const lastLoggedPath = useRef<string>("");

  useEffect(() => {
    if (!user || !pathname) return;

    // Avoid duplicate logging for identical pathname
    if (lastLoggedPath.current === pathname) return;
    lastLoggedPath.current = pathname;

    // Do not flood logs for login / signup / public routes
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/api")
    ) {
      return;
    }

    const matchedInfo = routeNameToCategory[pathname] || {
      title: pathname
        .replace(/^\//, "")
        .replace(/[-_/]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      category: "Navigation" as AuditCategory,
    };

    logActivity({
      userId: user.uid,
      userName: user.displayName || user.email || "User",
      userEmail: user.email || "",
      action: "PAGE_VIEW",
      category: matchedInfo.category,
      title: `Navigated to ${matchedInfo.title}`,
      description: `Visited page ${pathname}`,
      path: pathname,
      metadata: {
        pathname,
      },
    });
  }, [pathname, user]);

  return null;
}
