"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import {
  FiTruck,
  FiShare2,
  FiSend,
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiRotateCcw,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiFileText,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiLayers,
  FiInbox,
  FiArrowUpRight,
  FiArrowDownLeft,
} from "react-icons/fi";
import { format } from "date-fns";
import toast from "react-hot-toast";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface SharedVehicleItem {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: "Truck" | "Trailer";
  companyName: string;
  vin?: string;
  currentMilesAtShare: number;
  returnedMiles?: number;
}

export interface FleetShareDoc {
  id: string;
  shareCode: string;
  type: "direct_offer" | "borrow_request";
  status: "pending" | "active" | "rejected" | "cancelled" | "completed";

  // Parties
  lenderId: string;
  lenderEmail: string;
  lenderName: string;
  lenderCompanyName?: string;

  borrowerId?: string;
  borrowerEmail: string;
  borrowerName?: string;
  borrowerCompanyName?: string;

  // Equipment
  requestedCounts?: {
    trucks: number;
    trailers: number;
  };
  vehicles: SharedVehicleItem[];

  // Terms & Notes
  description: string;
  leaseTerms?: string;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  startingOdometerNotes?: string;
  returnNotes?: string;

  // Metadata
  createdAt?: any;
  createdById?: string;
  updatedAt?: any;
}

export interface LocalFleetVehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: "Truck" | "Trailer";
  companyName: string;
  vin?: string;
  currentMiles: number;
  active: boolean;
  isAssignedToOther?: boolean;
  sharingPending?: boolean;
}

export interface ShareHistoryEvent {
  id: string;
  action: string;
  timestamp?: any;
  notes?: string;
  performedBy?: string;
  performedByEmail?: string;
}

export default function FleetSharingPage() {
  const auth = useAuth();
  const user = auth?.user;

  // User Profile
  const [userRole, setUserRole] = useState<string>("");
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);

  // Firestore Realtime Collections
  const [fleetShares, setFleetShares] = useState<FleetShareDoc[]>([]);
  const [myVehicles, setMyVehicles] = useState<LocalFleetVehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Navigation & Search
  const [activeTab, setActiveTab] = useState<
    "lent" | "borrowed" | "requests" | "history"
  >("lent");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modals
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedShareForDetail, setSelectedShareForDetail] =
    useState<FleetShareDoc | null>(null);
  const [shareHistory, setShareHistory] = useState<ShareHistoryEvent[]>([]);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [shareToReturn, setShareToReturn] = useState<FleetShareDoc | null>(
    null
  );
  const [returnOdometerNote, setReturnOdometerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fulfill Request States (Lender fulfills a borrow request by selecting & assigning vehicles)
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [shareToFulfill, setShareToFulfill] = useState<FleetShareDoc | null>(
    null
  );
  const [fulfillSelectedVehicleIds, setFulfillSelectedVehicleIds] = useState<
    string[]
  >([]);
  const [fulfillNotes, setFulfillNotes] = useState("");

  // Offer Form States (Lend Out)
  const [offerBorrowerEmail, setOfferBorrowerEmail] = useState("");
  const [offerSelectedVehicleIds, setOfferSelectedVehicleIds] = useState<
    string[]
  >([]);
  const [offerDurationDays, setOfferDurationDays] = useState("30");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerLeaseTerms, setOfferLeaseTerms] = useState("");

  // Request Form States (Borrow Fleet)
  const [reqLenderEmail, setReqLenderEmail] = useState("");
  const [reqTruckCount, setReqTruckCount] = useState<number>(1);
  const [reqTrailerCount, setReqTrailerCount] = useState<number>(1);
  const [reqDurationDays, setReqDurationDays] = useState("30");
  const [reqDescription, setReqDescription] = useState("");

  // ==========================================
  // 1. Resolve Effective User & Profile
  // ==========================================
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUser = async () => {
      try {
        const uDoc = await getDoc(doc(db, "Users", user.uid));
        if (uDoc.exists()) {
          const uData = uDoc.data();
          setUserRole(uData.role || "");
          setUserProfile(uData);
          if (
            (uData.role === "SubOwner" || uData.isTeamMember) &&
            uData.createdBy
          ) {
            setEffectiveUserId(uData.createdBy.trim());
          } else {
            setEffectiveUserId(user.uid);
          }
        } else {
          setEffectiveUserId(user.uid);
        }
      } catch (err) {
        console.error("Error resolving user:", err);
        setEffectiveUserId(user.uid);
      }
    };

    fetchUser();
  }, [user?.uid]);

  // ==========================================
  // 2. Realtime Listener: My Vehicles Fleet
  // ==========================================
  useEffect(() => {
    if (!effectiveUserId) return;

    const vRef = collection(db, "Users", effectiveUserId, "Vehicles");
    const unsub = onSnapshot(
      vRef,
      (snapshot) => {
        const loaded: LocalFleetVehicle[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.active !== false) {
            loaded.push({
              id: d.id,
              vehicleNumber: data.vehicleNumber || data.name || d.id,
              vehicleType:
                data.vehicleType?.toLowerCase() === "trailer"
                  ? "Trailer"
                  : "Truck",
              companyName: data.companyName || data.myCompany || "My Fleet",
              vin: data.vin || "",
              currentMiles: Number(
                data.currentMiles || data.currentReading || 0
              ),
              active: true,
              isAssignedToOther: !!data.isAssignedToOther,
              sharingPending: !!data.sharingPending,
            });
          }
        });
        loaded.sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));
        setMyVehicles(loaded);
      },
      (err) => {
        console.error("Error listening to fleet vehicles:", err);
      }
    );

    return () => unsub();
  }, [effectiveUserId]);

  // ==========================================
  // 3. Realtime Listener: Root `fleet_shares`
  // ==========================================
  useEffect(() => {
    if (!effectiveUserId && !user?.email) return;

    setIsLoading(true);

    // Query 1: As Lender (effectiveUserId or user.uid)
    const qLender = query(
      collection(db, "fleet_shares"),
      where("lenderId", "in", [effectiveUserId, user?.uid || ""])
    );

    // Query 1b: As Lender (by lenderEmail if lenderId was pending/empty)
    const qLenderEmail = user?.email
      ? query(
          collection(db, "fleet_shares"),
          where("lenderEmail", "==", user.email.trim().toLowerCase())
        )
      : null;

    // Query 2: As Borrower (by borrowerId)
    const qBorrowerId = query(
      collection(db, "fleet_shares"),
      where("borrowerId", "in", [effectiveUserId, user?.uid || ""])
    );

    // Query 3: As Borrower (by email if borrowerId is pending)
    const qBorrowerEmail = user?.email
      ? query(
          collection(db, "fleet_shares"),
          where("borrowerEmail", "==", user.email.trim().toLowerCase())
        )
      : null;

    const sharesMap = new Map<string, FleetShareDoc>();

    const updateFromSnapshot = (snap: any) => {
      snap.forEach((d: any) => {
        const data = d.data();
        sharesMap.set(d.id, {
          id: d.id,
          shareCode: data.shareCode || `FST-${d.id.substring(0, 6)}`,
          type: data.type || "direct_offer",
          status: data.status || "pending",
          lenderId: data.lenderId || "",
          lenderEmail: data.lenderEmail || "",
          lenderName: data.lenderName || "Partner Owner",
          lenderCompanyName: data.lenderCompanyName || "Partner Logistics",
          borrowerId: data.borrowerId || "",
          borrowerEmail: data.borrowerEmail || "",
          borrowerName: data.borrowerName || "Partner Owner",
          borrowerCompanyName: data.borrowerCompanyName || "Partner Carrier",
          requestedCounts: data.requestedCounts || { trucks: 0, trailers: 0 },
          vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
          description: data.description || "",
          leaseTerms: data.leaseTerms || "",
          startDate: data.startDate || "",
          expectedEndDate: data.expectedEndDate || "",
          actualEndDate: data.actualEndDate || "",
          startingOdometerNotes: data.startingOdometerNotes || "",
          returnNotes: data.returnNotes || "",
          createdAt: data.createdAt,
          createdById: data.createdById,
        });
      });

      const list = Array.from(sharesMap.values());
      list.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setFleetShares(list);
      setIsLoading(false);
    };

    const unsubLender = onSnapshot(qLender, updateFromSnapshot);
    const unsubLenderEmail = qLenderEmail
      ? onSnapshot(qLenderEmail, updateFromSnapshot)
      : () => {};
    const unsubBorrowerId = onSnapshot(qBorrowerId, updateFromSnapshot);
    const unsubBorrowerEmail = qBorrowerEmail
      ? onSnapshot(qBorrowerEmail, updateFromSnapshot)
      : () => {};

    return () => {
      unsubLender();
      unsubLenderEmail();
      unsubBorrowerId();
      unsubBorrowerEmail();
    };
  }, [effectiveUserId, user?.uid, user?.email]);

  // Load audit history when a share is selected for detail
  useEffect(() => {
    if (!selectedShareForDetail?.id) {
      setShareHistory([]);
      return;
    }

    const histRef = collection(
      db,
      "fleet_shares",
      selectedShareForDetail.id,
      "history"
    );
    const unsub = onSnapshot(histRef, (snap) => {
      const list: ShareHistoryEvent[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          action: data.action || "UPDATE",
          timestamp: data.timestamp,
          notes: data.notes || "",
          performedBy: data.performedBy || "",
          performedByEmail: data.performedByEmail || "",
        });
      });
      list.sort((a, b) => {
        const tA = a.timestamp?.seconds || 0;
        const tB = b.timestamp?.seconds || 0;
        return tB - tA;
      });
      setShareHistory(list);
    });

    return () => unsub();
  }, [selectedShareForDetail?.id]);

  // Check for ?fulfill=shareId query parameter to auto-open fulfill modal
  useEffect(() => {
    if (typeof window === "undefined" || fleetShares.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const fulfillId = params.get("fulfill");
    if (fulfillId) {
      const target = fleetShares.find((s) => s.id === fulfillId);
      if (
        target &&
        target.status === "pending" &&
        target.type === "borrow_request"
      ) {
        setShareToFulfill(target);
        setFulfillSelectedVehicleIds([]);
        setFulfillNotes(target.leaseTerms || "");
        setIsFulfillModalOpen(true);
      }
    }
  }, [fleetShares]);

  // ==========================================
  // KPI Calculations
  // ==========================================
  const activeLentVehiclesCount = useMemo(() => {
    return fleetShares
      .filter((s) => s.lenderId === effectiveUserId && s.status === "active")
      .reduce((acc, s) => acc + (s.vehicles?.length || 0), 0);
  }, [fleetShares, effectiveUserId]);

  const activeBorrowedVehiclesCount = useMemo(() => {
    return fleetShares
      .filter(
        (s) =>
          (s.borrowerId === effectiveUserId ||
            s.borrowerEmail?.toLowerCase() === user?.email?.toLowerCase()) &&
          s.status === "active"
      )
      .reduce((acc, s) => acc + (s.vehicles?.length || 0), 0);
  }, [fleetShares, effectiveUserId, user?.email]);

  const pendingRequestsCount = useMemo(() => {
    return fleetShares.filter((s) => s.status === "pending").length;
  }, [fleetShares]);

  // Available vehicles for lending (not currently lent out or pending)
  const availableVehiclesForOffer = useMemo(() => {
    return myVehicles.filter((v) => !v.isAssignedToOther && !v.sharingPending);
  }, [myVehicles]);

  // Filtered List based on Active Tab
  const filteredShares = useMemo(() => {
    return fleetShares.filter((share) => {
      const isLender = share.lenderId === effectiveUserId;
      const isBorrower =
        share.borrowerId === effectiveUserId ||
        share.borrowerEmail?.toLowerCase() === user?.email?.toLowerCase();

      // Tab filter
      if (activeTab === "lent") {
        if (!isLender || share.status === "completed") return false;
      } else if (activeTab === "borrowed") {
        if (!isBorrower || share.status === "completed") return false;
      } else if (activeTab === "requests") {
        if (share.status !== "pending") return false;
      } else if (activeTab === "history") {
        if (
          share.status !== "completed" &&
          share.status !== "rejected" &&
          share.status !== "cancelled"
        ) {
          return false;
        }
      }

      // Status dropdown filter
      if (statusFilter !== "All") {
        if (share.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = share.shareCode.toLowerCase().includes(q);
        const matchLender =
          share.lenderName.toLowerCase().includes(q) ||
          share.lenderEmail.toLowerCase().includes(q);
        const matchBorrower =
          share.borrowerName?.toLowerCase().includes(q) ||
          share.borrowerEmail.toLowerCase().includes(q);
        const matchVeh = share.vehicles.some((v) =>
          v.vehicleNumber.toLowerCase().includes(q)
        );
        if (!matchCode && !matchLender && !matchBorrower && !matchVeh) {
          return false;
        }
      }

      return true;
    });
  }, [
    fleetShares,
    activeTab,
    statusFilter,
    searchQuery,
    effectiveUserId,
    user?.email,
  ]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // Helper to look up an Owner in Users collection by email
  const findOwnerByEmail = async (emailToSearch: string) => {
    const clean = emailToSearch.trim().toLowerCase();
    if (!clean) return null;

    // 1. Check exact lowercase query
    let qUsers = query(collection(db, "Users"), where("email", "==", clean));
    let snap = await getDocs(qUsers);

    // 2. Fallback: check raw input if different casing
    if (snap.empty && emailToSearch.trim() !== clean) {
      qUsers = query(
        collection(db, "Users"),
        where("email", "==", emailToSearch.trim())
      );
      snap = await getDocs(qUsers);
    }

    // 3. Fallback: check userEmail field
    if (snap.empty) {
      qUsers = query(collection(db, "Users"), where("userEmail", "==", clean));
      snap = await getDocs(qUsers);
    }

    // 4. Fallback: check existing fleet shares in state
    if (snap.empty) {
      const match = fleetShares.find(
        (s) =>
          s.borrowerEmail?.toLowerCase() === clean ||
          s.lenderEmail?.toLowerCase() === clean
      );
      if (match) {
        const isBorrowerMatch = match.borrowerEmail?.toLowerCase() === clean;
        const targetUid = isBorrowerMatch ? match.borrowerId : match.lenderId;
        if (targetUid) {
          try {
            const uDoc = await getDoc(doc(db, "Users", targetUid));
            if (uDoc.exists()) {
              const uData = uDoc.data();
              return {
                uid: targetUid,
                name:
                  uData.userName ||
                  uData.name ||
                  (isBorrowerMatch ? match.borrowerName : match.lenderName) ||
                  "Fleet Owner",
                companyName:
                  uData.companyName ||
                  uData.carrierName ||
                  (isBorrowerMatch
                    ? match.borrowerCompanyName
                    : match.lenderCompanyName) ||
                  "Logistics",
                email: clean,
                role: uData.role || (uData.isOwner ? "Owner" : "Owner"),
                isOwner: true,
                fcmToken: uData.fcmToken || "",
              };
            }
          } catch (e) {
            console.warn("Known share fallback error:", e);
          }
        }
      }
    }

    // 5. Fallback: Scan Users collection for case-insensitive / trimmed matches
    if (snap.empty) {
      try {
        const allUsersSnap = await getDocs(collection(db, "Users"));
        const matched = allUsersSnap.docs.find((d) => {
          const u = d.data();
          const e1 = (u.email || "").toString().trim().toLowerCase();
          const e2 = (u.userEmail || "").toString().trim().toLowerCase();
          return e1 === clean || e2 === clean;
        });

        if (matched) {
          const data = matched.data();
          return {
            uid: data.uid || matched.id,
            name: data.userName || data.name || "Fleet Owner",
            companyName: data.companyName || data.carrierName || "Logistics",
            email: clean,
            role: data.role || (data.isOwner ? "Owner" : "Owner"),
            isOwner: data.isOwner ?? true,
            fcmToken: data.fcmToken || "",
          };
        }
      } catch (scanErr) {
        console.warn("User scan fallback error:", scanErr);
      }
    }

    if (snap.empty) {
      return null;
    }

    const matchedDoc = snap.docs[0];
    const data = matchedDoc.data();
    return {
      uid: data.uid || matchedDoc.id,
      name: data.userName || data.name || "Fleet Owner",
      companyName: data.companyName || data.carrierName || "Logistics",
      email: data.email || clean,
      role: data.role || (data.isOwner ? "Owner" : "Owner"),
      isOwner: data.isOwner ?? true,
      fcmToken: data.fcmToken || "",
    };
  };

  // 1. Submit Direct Offer (Lend vehicles)
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = offerBorrowerEmail.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Please enter partner owner's email address");
      return;
    }
    if (cleanEmail === user?.email?.toLowerCase()) {
      toast.error("You cannot share vehicles with your own account email");
      return;
    }
    if (offerSelectedVehicleIds.length === 0) {
      toast.error("Please select at least 1 vehicle to share");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Verify that Borrower exists and has role == 'Owner'
      const borrowerOwner = await findOwnerByEmail(cleanEmail);
      if (!borrowerOwner) {
        toast.error("No registered user found with this email address");
        setIsSubmitting(false);
        return;
      }
      const isOwnerRole =
        borrowerOwner.role?.toLowerCase() === "owner" ||
        (borrowerOwner as any).isOwner === true;
      if (!isOwnerRole) {
        toast.error(
          `This user's role is "${
            borrowerOwner.role || "Team Member"
          }". Fleet sharing is only allowed with accounts having the "Owner" role.`
        );
        setIsSubmitting(false);
        return;
      }

      const selectedVehicles: SharedVehicleItem[] = myVehicles
        .filter((v) => offerSelectedVehicleIds.includes(v.id))
        .map((v) => ({
          vehicleId: v.id,
          vehicleNumber: v.vehicleNumber,
          vehicleType: v.vehicleType,
          companyName: v.companyName,
          vin: v.vin || "",
          currentMilesAtShare: v.currentMiles,
        }));

      const shareCode = `SHR-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const shareDocData: Omit<FleetShareDoc, "id"> = {
        shareCode,
        type: "direct_offer",
        status: "pending",
        lenderId: effectiveUserId,
        lenderEmail: user?.email || "",
        lenderName: userProfile?.userName || userProfile?.name || "Fleet Owner",
        lenderCompanyName:
          userProfile?.companyName || userProfile?.carrierName || "Logistics",
        borrowerId: borrowerOwner.uid,
        borrowerEmail: borrowerOwner.email,
        borrowerName: borrowerOwner.name,
        borrowerCompanyName: borrowerOwner.companyName,
        vehicles: selectedVehicles,
        description: offerDescription.trim() || "Equipment sharing allocation.",
        leaseTerms:
          offerLeaseTerms.trim() ||
          "Standard inter-fleet sharing agreement. Borrower cannot update master odometer readings.",
        startDate: format(new Date(), "yyyy-MM-dd"),
        expectedEndDate: format(
          new Date(Date.now() + Number(offerDurationDays || 30) * 86400000),
          "yyyy-MM-dd"
        ),
        createdAt: serverTimestamp(),
        createdById: user?.uid || effectiveUserId,
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "fleet_shares"), shareDocData);

      // Instantly mark vehicles as sharingPending locally
      setMyVehicles((prev) =>
        prev.map((v) =>
          offerSelectedVehicleIds.includes(v.id)
            ? { ...v, sharingPending: true }
            : v
        )
      );

      toast.success(
        `Fleet share offer ${shareCode} sent to ${borrowerOwner.name} (${borrowerOwner.email})!`
      );
      setIsOfferModalOpen(false);

      // Reset
      setOfferBorrowerEmail("");
      setOfferSelectedVehicleIds([]);
      setOfferDurationDays("30");
      setOfferDescription("");
      setOfferLeaseTerms("");
    } catch (err: any) {
      console.error("Error creating fleet share offer:", err);
      toast.error("Failed to create offer: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Borrow Request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reqTruckCount <= 0 && reqTrailerCount <= 0) {
      toast.error("Please request at least 1 truck or trailer");
      return;
    }

    const cleanLenderEmail = reqLenderEmail.trim().toLowerCase();
    if (!cleanLenderEmail) {
      toast.error(
        "Please enter the Owner's email from whom you are requesting equipment"
      );
      return;
    }
    if (cleanLenderEmail === user?.email?.toLowerCase()) {
      toast.error("You cannot request equipment from your own account email");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Verify that Lender Owner exists and has role == 'Owner'
      const lenderOwner = await findOwnerByEmail(cleanLenderEmail);
      if (!lenderOwner) {
        toast.error("No registered user found with this email address");
        setIsSubmitting(false);
        return;
      }
      const isOwnerRole =
        lenderOwner.role?.toLowerCase() === "owner" ||
        (lenderOwner as any).isOwner === true;
      if (!isOwnerRole) {
        toast.error(
          `This user's role is "${
            lenderOwner.role || "Team Member"
          }". You can only request equipment from users having the "Owner" role.`
        );
        setIsSubmitting(false);
        return;
      }

      const shareCode = `REQ-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const shareDocData = {
        shareCode,
        type: "borrow_request",
        status: "pending",
        lenderId: lenderOwner.uid,
        lenderEmail: lenderOwner.email,
        lenderName: lenderOwner.name,
        lenderCompanyName: lenderOwner.companyName,
        borrowerId: effectiveUserId,
        borrowerEmail: user?.email || "",
        borrowerName:
          userProfile?.userName || userProfile?.name || "Fleet Owner",
        borrowerCompanyName:
          userProfile?.companyName || userProfile?.carrierName || "Logistics",
        requestedCounts: {
          trucks: Number(reqTruckCount) || 0,
          trailers: Number(reqTrailerCount) || 0,
        },
        vehicles: [],
        description: reqDescription.trim() || "Equipment borrow request.",
        startDate: format(new Date(), "yyyy-MM-dd"),
        expectedEndDate: format(
          new Date(Date.now() + Number(reqDurationDays || 30) * 86400000),
          "yyyy-MM-dd"
        ),
        createdAt: serverTimestamp(),
        createdById: user?.uid || effectiveUserId,
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "fleet_shares"), shareDocData);

      toast.success(
        `Equipment request ${shareCode} submitted to ${lenderOwner.name} (${lenderOwner.email})!`
      );
      setIsRequestModalOpen(false);

      // Reset
      setReqLenderEmail("");
      setReqTruckCount(1);
      setReqTrailerCount(1);
      setReqDurationDays("30");
      setReqDescription("");
    } catch (err: any) {
      console.error("Error creating borrow request:", err);
      toast.error("Failed to create request: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Accept Incoming Share
  const handleAcceptShare = async (share: FleetShareDoc) => {
    try {
      await updateDoc(doc(db, "fleet_shares", share.id), {
        status: "active",
        borrowerId: effectiveUserId,
        borrowerName: userProfile?.userName || userProfile?.name || "Partner",
        borrowerCompanyName: userProfile?.companyName || "Partner Logistics",
        lastUpdatedById: user?.uid || effectiveUserId,
        updatedAt: serverTimestamp(),
      });
      toast.success(
        "Fleet share accepted! Vehicles are now available for service records."
      );
    } catch (err: any) {
      console.error("Error accepting share:", err);
      toast.error("Failed to accept share: " + err.message);
    }
  };

  // 4. Reject Incoming Share
  const handleRejectShare = async (share: FleetShareDoc) => {
    try {
      await updateDoc(doc(db, "fleet_shares", share.id), {
        status: "rejected",
        lastUpdatedById: user?.uid || effectiveUserId,
        updatedAt: serverTimestamp(),
      });
      toast.success("Share offer declined.");
    } catch (err: any) {
      console.error("Error rejecting share:", err);
      toast.error("Failed to decline: " + err.message);
    }
  };

  // 4b. Open Fulfill Modal (Lender allocates vehicles to incoming borrow request)
  const handleOpenFulfillModal = (share: FleetShareDoc) => {
    setShareToFulfill(share);
    setFulfillSelectedVehicleIds([]);
    setFulfillNotes(share.leaseTerms || "");
    setIsFulfillModalOpen(true);
  };

  // 4c. Confirm Fulfill Request (Assign selected vehicles and activate agreement)
  const handleConfirmFulfill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareToFulfill) return;
    if (fulfillSelectedVehicleIds.length === 0) {
      toast.error("Please select at least 1 vehicle to assign to this request");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedVehicles: SharedVehicleItem[] = myVehicles
        .filter((v) => fulfillSelectedVehicleIds.includes(v.id))
        .map((v) => ({
          vehicleId: v.id,
          vehicleNumber: v.vehicleNumber,
          vehicleType: v.vehicleType,
          companyName: v.companyName,
          vin: v.vin || "",
          currentMilesAtShare: v.currentMiles,
        }));

      await updateDoc(doc(db, "fleet_shares", shareToFulfill.id), {
        status: "active",
        vehicles: selectedVehicles,
        leaseTerms:
          fulfillNotes.trim() ||
          shareToFulfill.leaseTerms ||
          "Standard inter-fleet sharing agreement. Borrower cannot update master odometer readings.",
        startDate: format(new Date(), "yyyy-MM-dd"),
        lastUpdatedById: user?.uid || effectiveUserId,
        updatedAt: serverTimestamp(),
      });

      // Mark vehicles locally as assigned
      setMyVehicles((prev) =>
        prev.map((v) =>
          fulfillSelectedVehicleIds.includes(v.id)
            ? { ...v, isAssignedToOther: true }
            : v
        )
      );

      toast.success(
        `Vehicles successfully assigned to ${
          shareToFulfill.borrowerCompanyName || shareToFulfill.borrowerName
        }! Request ${shareToFulfill.shareCode} is now Active.`
      );
      setIsFulfillModalOpen(false);
      setShareToFulfill(null);
    } catch (err: any) {
      console.error("Error fulfilling borrow request:", err);
      toast.error("Failed to assign vehicles: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Open Return Modal
  const handleOpenReturnModal = (share: FleetShareDoc) => {
    setShareToReturn(share);
    setReturnOdometerNote("");
    setIsReturnModalOpen(true);
  };

  // 6. Confirm Return & Reset Vehicle Status
  const handleConfirmReturn = async () => {
    if (!shareToReturn) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "fleet_shares", shareToReturn.id), {
        status: "completed",
        actualEndDate: format(new Date(), "yyyy-MM-dd"),
        returnNotes:
          returnOdometerNote.trim() ||
          "Equipment returned to original owner. Normal fleet operations restored.",
        lastUpdatedById: user?.uid || effectiveUserId,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(
        "Vehicles successfully returned! Returned to normal status in fleet."
      );
      setIsReturnModalOpen(false);
      setShareToReturn(null);
      if (selectedShareForDetail?.id === shareToReturn.id) {
        setSelectedShareForDetail(null);
      }
    } catch (err: any) {
      console.error("Error returning vehicles:", err);
      toast.error("Failed to return vehicles: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top App Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
        <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Fleet Sharing
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700">
                  Inter-Fleet Network
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lend underutilized vehicles to other fleet owners or borrow
                partner equipment with strict mileage protection & service
                record access.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              {/* Request Equipment Button */}
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs active:scale-95"
              >
                <FiInbox className="text-sm text-gray-600" />
                <span>Request Equipment</span>
              </button>

              {/* Share / Lend Out Vehicles Button */}
              <button
                onClick={() => setIsOfferModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F96176] hover:bg-[#e04f63] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              >
                <FiPlus className="text-sm" />
                <span>Share My Vehicles</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Lent Out */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs transition hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Lent To Partners
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
                <FiArrowUpRight className="text-base" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {activeLentVehiclesCount}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-1">
                Your units operating under partner care (`isAssignedToOther:
                true`)
              </p>
            </div>
          </div>

          {/* Card 2: Borrowed In */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs transition hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Borrowed In Fleet
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <FiArrowDownLeft className="text-base" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {activeBorrowedVehiclesCount}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-1">
                Partner equipment in your operations (Service Records only)
              </p>
            </div>
          </div>

          {/* Card 3: Pending Inquiries */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs transition hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Pending Actions
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                <FiClock className="text-base" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {pendingRequestsCount}
              </p>
              <p className="text-[11px] text-amber-700/90 font-medium mt-1">
                Awaiting partner response or your review
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls & Search Filter */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab("lent");
                  setStatusFilter("All");
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "lent"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Lent Out (
                {
                  fleetShares.filter(
                    (s) =>
                      s.lenderId === effectiveUserId && s.status !== "completed"
                  ).length
                }
                )
              </button>

              <button
                onClick={() => {
                  setActiveTab("borrowed");
                  setStatusFilter("All");
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "borrowed"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Borrowed (
                {
                  fleetShares.filter(
                    (s) =>
                      (s.borrowerId === effectiveUserId ||
                        s.borrowerEmail?.toLowerCase() ===
                          user?.email?.toLowerCase()) &&
                      s.status !== "completed"
                  ).length
                }
                )
              </button>

              <button
                onClick={() => {
                  setActiveTab("requests");
                  setStatusFilter("All");
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition relative ${
                  activeTab === "requests"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Pending Requests
                {pendingRequestsCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab("history");
                  setStatusFilter("All");
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "history"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                History & Audits
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-72">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search code, partner, vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
                />
              </div>

              {activeTab !== "requests" && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176] text-gray-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed / Returned</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Shares Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-gray-500">
              <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading fleet shares...
            </div>
          ) : filteredShares.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                <FiTruck />
              </div>
              <h3 className="text-base font-bold text-gray-800">
                No Fleet Sharing Records
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {activeTab === "requests"
                  ? "No pending requests found."
                  : activeTab === "lent"
                  ? "You haven't lent out any vehicles yet. Tap 'Share My Vehicles' to assign units to a partner carrier."
                  : "No active borrowed partner equipment in your fleet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Agreement Code</th>
                    <th className="py-3.5 px-4">Partner Party</th>
                    <th className="py-3.5 px-4">Equipment Units</th>
                    <th className="py-3.5 px-4">Duration & Dates</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {filteredShares.map((item) => {
                    const isLender = item.lenderId === effectiveUserId;
                    const isBorrower =
                      item.borrowerId === effectiveUserId ||
                      item.borrowerEmail?.toLowerCase() ===
                        user?.email?.toLowerCase();
                    const isActive = item.status === "active";
                    const isPending = item.status === "pending";
                    const isCompleted = item.status === "completed";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        {/* Share Code */}
                        <td className="py-4 px-4 font-mono">
                          <div className="font-bold text-rose-600">
                            {item.shareCode}
                          </div>
                          <div className="text-[10px] text-gray-400 font-sans mt-0.5">
                            {isLender
                              ? "↑ Lent by My Fleet"
                              : "↓ Borrowed in Fleet"}
                          </div>
                        </td>

                        {/* Partner */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-900">
                            {isLender
                              ? item.borrowerCompanyName ||
                                item.borrowerName ||
                                item.borrowerEmail
                              : item.lenderCompanyName ||
                                item.lenderName ||
                                item.lenderEmail}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Email:{" "}
                            {isLender ? item.borrowerEmail : item.lenderEmail}
                          </div>
                        </td>

                        {/* Equipment */}
                        <td className="py-4 px-4">
                          {item.type === "borrow_request" &&
                          item.vehicles.length === 0 ? (
                            <div>
                              <span className="font-bold text-amber-700">
                                Requested: {item.requestedCounts?.trucks || 0}{" "}
                                Trucks, {item.requestedCounts?.trailers || 0}{" "}
                                Trailers
                              </span>
                              <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                                {item.description}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-gray-900">
                                {item.vehicles.length}{" "}
                                {item.vehicles.length === 1 ? "Unit" : "Units"}
                              </span>
                              <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-1">
                                {item.vehicles.map((v) => (
                                  <span
                                    key={v.vehicleId}
                                    className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-mono border border-gray-200"
                                  >
                                    {v.vehicleNumber} ({v.vehicleType})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-800">
                            {item.startDate} &rarr;{" "}
                            {item.expectedEndDate || "Open"}
                          </div>
                          {item.actualEndDate && (
                            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                              Returned on {item.actualEndDate}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {isActive && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <FiClock className="text-xs" />
                              Pending Approval
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                              Completed / Returned
                            </span>
                          )}
                          {item.status === "rejected" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Declined
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* 1. Borrower receiving a Direct Offer */}
                            {isPending &&
                              isBorrower &&
                              item.type === "direct_offer" && (
                                <>
                                  <button
                                    onClick={() => handleAcceptShare(item)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectShare(item)}
                                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}

                            {/* 2. Lender receiving a Borrow Request -> Accept & Assign Vehicles */}
                            {isPending &&
                              isLender &&
                              item.type === "borrow_request" && (
                                <>
                                  <button
                                    onClick={() => handleOpenFulfillModal(item)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                    title="Assign your available vehicles to fulfill this request"
                                  >
                                    <FiCheck className="text-xs" />
                                    <span>Accept & Assign</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectShare(item)}
                                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}

                            {/* Return / Switch Back to Normal */}
                            {isActive && (
                              <button
                                onClick={() => handleOpenReturnModal(item)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                              >
                                <FiRotateCcw className="text-xs" />
                                {isLender
                                  ? "Recall / Reclaim"
                                  : "Return to Owner"}
                              </button>
                            )}

                            {/* Detail Drawer Trigger */}
                            <button
                              onClick={() => setSelectedShareForDetail(item)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                              title="View Details & History"
                            >
                              <FiEye className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: SHARE MY VEHICLES (Lend Out Offer) */}
      {/* ============================================================ */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                  Outbound Equipment Allocation
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-0.5">
                  Assign Vehicles to Partner Owner
                </h2>
              </div>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-6">
              {/* Partner Email */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Second Owner Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. partner.owner@transport.com"
                  value={offerBorrowerEmail}
                  onChange={(e) => setOfferBorrowerEmail(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  The partner owner will receive an instant notification & email
                  to accept this equipment share.
                </p>
              </div>

              {/* Select Available Vehicles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Select Vehicles to Assign ({offerSelectedVehicleIds.length}{" "}
                    Selected)
                  </label>
                  <span className="text-[11px] text-gray-500">
                    Available: {availableVehiclesForOffer.length} units
                  </span>
                </div>

                {availableVehiclesForOffer.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-gray-50 text-center text-xs text-gray-500 border border-gray-200">
                    No vehicles available. All vehicles in your fleet are either
                    already lent out or pending.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-2xl p-2 max-h-52 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
                    {availableVehiclesForOffer.map((veh) => {
                      const isChecked = offerSelectedVehicleIds.includes(
                        veh.id
                      );
                      return (
                        <label
                          key={veh.id}
                          className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition ${
                            isChecked ? "bg-rose-50" : "hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setOfferSelectedVehicleIds((prev) =>
                                  prev.includes(veh.id)
                                    ? prev.filter((id) => id !== veh.id)
                                    : [...prev, veh.id]
                                )
                              }
                              className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                            />
                            <div>
                              <span className="text-xs font-bold text-gray-900">
                                {veh.vehicleNumber}
                              </span>
                              <span className="text-[10px] text-gray-500 ml-2">
                                ({veh.vehicleType}) &bull; {veh.companyName}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-gray-500">
                            {veh.currentMiles.toLocaleString()} mi
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lease Duration & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Estimated Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={offerDurationDays}
                    onChange={(e) => setOfferDurationDays(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Purpose / Load Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Interstate load support..."
                    value={offerDescription}
                    onChange={(e) => setOfferDescription(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                  />
                </div>
              </div>

              {/* Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2.5">
                <FiAlertCircle className="text-base text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Master Mileage Protection:</strong> While assigned to
                  the second owner, they can add maintenance & expense records,
                  but <strong>cannot update vehicle miles</strong>. Master
                  odometer integrity remains preserved.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || availableVehiclesForOffer.length === 0
                  }
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#F96176] hover:bg-[#e04f63] text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Dispatching..." : "Send Share Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: REQUEST EQUIPMENT FROM OTHER OWNER */}
      {/* ============================================================ */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Borrow Request
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-0.5">
                  Request Equipment from Other Owner
                </h2>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Partner Owner Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. partner.owner@transport.com"
                  value={reqLenderEmail}
                  onChange={(e) => setReqLenderEmail(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  The partner owner will receive an instant in-app & push
                  notification in Trenoops to review your request.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Trucks Needed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reqTruckCount}
                    onChange={(e) => setReqTruckCount(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Trailers Needed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reqTrailerCount}
                    onChange={(e) => setReqTrailerCount(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Estimated Days Required
                </label>
                <input
                  type="number"
                  min="1"
                  value={reqDurationDays}
                  onChange={(e) => setReqDurationDays(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Description / Operational Need *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your load, routes, dates, and driver arrangements..."
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#F96176] hover:bg-[#e04f63] text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Equipment Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2.5: FULFILL BORROW REQUEST (Lender assigns vehicles) */}
      {/* ============================================================ */}
      {isFulfillModalOpen && shareToFulfill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Fulfill Equipment Request &bull; {shareToFulfill.shareCode}
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-0.5">
                  Assign Vehicles to Partner
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsFulfillModalOpen(false);
                  setShareToFulfill(null);
                }}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Request Summary Card */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 mb-6 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-indigo-950 text-sm">
                  {shareToFulfill.borrowerCompanyName ||
                    shareToFulfill.borrowerName}
                </span>
                <span className="text-indigo-600 font-mono text-[11px]">
                  {shareToFulfill.borrowerEmail}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 font-bold text-indigo-900">
                  🚛 Requested: {shareToFulfill.requestedCounts?.trucks || 0}{" "}
                  Truck(s)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 font-bold text-indigo-900">
                  📦 Requested: {shareToFulfill.requestedCounts?.trailers || 0}{" "}
                  Trailer(s)
                </span>
              </div>

              {shareToFulfill.description && (
                <div className="text-indigo-900/90 pt-1">
                  <strong>Need / Load Notes: </strong>
                  <span>{shareToFulfill.description}</span>
                </div>
              )}

              <div className="text-[11px] text-indigo-800/80">
                Period: {shareToFulfill.startDate} &rarr;{" "}
                {shareToFulfill.expectedEndDate || "Open"}
              </div>
            </div>

            <form onSubmit={handleConfirmFulfill} className="space-y-6">
              {/* Select Available Vehicles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Select Vehicles from Your Fleet to Assign (
                    {fulfillSelectedVehicleIds.length} Selected)
                  </label>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Available in your fleet: {availableVehiclesForOffer.length}{" "}
                    units
                  </span>
                </div>

                {availableVehiclesForOffer.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-gray-50 text-center text-xs text-gray-500 border border-gray-200">
                    No available vehicles in your fleet to assign. All vehicles
                    are either already shared or pending.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-2xl p-2 max-h-56 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
                    {availableVehiclesForOffer.map((veh) => {
                      const isChecked = fulfillSelectedVehicleIds.includes(
                        veh.id
                      );
                      return (
                        <label
                          key={veh.id}
                          className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition ${
                            isChecked
                              ? "bg-emerald-50/80 border border-emerald-200"
                              : "hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setFulfillSelectedVehicleIds((prev) =>
                                  prev.includes(veh.id)
                                    ? prev.filter((id) => id !== veh.id)
                                    : [...prev, veh.id]
                                )
                              }
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <div>
                              <span className="text-xs font-bold text-gray-900 font-mono">
                                {veh.vehicleNumber}
                              </span>
                              <span className="text-[10px] text-gray-500 ml-2">
                                ({veh.vehicleType}) &bull; {veh.companyName}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-gray-500">
                            {veh.currentMiles.toLocaleString()} mi
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lease Terms & Agreement Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Sharing Agreement Terms / Allocation Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Standard equipment allocation for designated freight route..."
                  value={fulfillNotes}
                  onChange={(e) => setFulfillNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Master Mileage Protection Alert */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2.5">
                <FiCheckCircle className="text-base text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Protected Assignment:</strong> These vehicles will
                  appear in{" "}
                  {shareToFulfill.borrowerCompanyName ||
                    shareToFulfill.borrowerName}
                  &apos;s fleet with service record &amp; expense entry
                  permissions, but{" "}
                  <strong>master odometer miles cannot be changed</strong>.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsFulfillModalOpen(false);
                    setShareToFulfill(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || fulfillSelectedVehicleIds.length === 0
                  }
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Assigning..." : "Confirm & Assign Vehicles"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: RETURN / RECALL FLEET MODAL */}
      {/* ============================================================ */}
      {isReturnModalOpen && shareToReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-black text-gray-900">
                Return & Restore Fleet Vehicles
              </h3>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <FiX />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to complete this share agreement (
              <strong>{shareToReturn.shareCode}</strong>)? All assigned vehicles
              will be returned to normal fleet status (`isAssignedToOther:
              false`).
            </p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-bold text-gray-700">
                Final Return Notes / Condition Check (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Returned in good condition, trip finished..."
                value={returnOdometerNote}
                onChange={(e) => setReturnOdometerNote(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F96176]"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition"
              >
                {isSubmitting ? "Returning..." : "Confirm Return & Restore"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: DETAILS & AUDIT HISTORY DRAWER */}
      {/* ============================================================ */}
      {selectedShareForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                  Agreement Details & History
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-0.5">
                  {selectedShareForDetail.shareCode}
                </h2>
              </div>
              <button
                onClick={() => setSelectedShareForDetail(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Partner Card */}
              <div className="border border-gray-200 rounded-2xl p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Agreement Parties
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Lender (Owner):</span>
                    <div className="font-bold text-gray-900 mt-0.5">
                      {selectedShareForDetail.lenderCompanyName ||
                        selectedShareForDetail.lenderName}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {selectedShareForDetail.lenderEmail}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Borrower (Partner):</span>
                    <div className="font-bold text-gray-900 mt-0.5">
                      {selectedShareForDetail.borrowerCompanyName ||
                        selectedShareForDetail.borrowerName ||
                        "Pending Assignment"}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {selectedShareForDetail.borrowerEmail}
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment list */}
              {selectedShareForDetail.vehicles.length > 0 && (
                <div className="border border-gray-200 rounded-2xl p-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Assigned Units ({selectedShareForDetail.vehicles.length})
                  </div>
                  <div className="space-y-2">
                    {selectedShareForDetail.vehicles.map((v) => (
                      <div
                        key={v.vehicleId}
                        className="p-2.5 rounded-xl bg-gray-50 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-bold text-gray-900">
                            {v.vehicleNumber}
                          </span>
                          <span className="text-[10px] text-gray-500 ml-2">
                            {v.vehicleType} &bull; {v.companyName}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-600">
                          {v.currentMilesAtShare.toLocaleString()} mi
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Terms & Notes */}
              <div className="border border-gray-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Dates:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedShareForDetail.startDate} &rarr;{" "}
                    {selectedShareForDetail.expectedEndDate || "Open"}
                  </span>
                </div>
                {selectedShareForDetail.description && (
                  <div className="py-1">
                    <span className="text-gray-500">Description:</span>
                    <p className="font-medium text-gray-800 mt-0.5">
                      {selectedShareForDetail.description}
                    </p>
                  </div>
                )}
                {selectedShareForDetail.leaseTerms && (
                  <div className="py-1">
                    <span className="text-gray-500">Lease Terms:</span>
                    <p className="font-medium text-gray-800 mt-0.5">
                      {selectedShareForDetail.leaseTerms}
                    </p>
                  </div>
                )}
                {selectedShareForDetail.returnNotes && (
                  <div className="py-1">
                    <span className="text-gray-500">Return Notes:</span>
                    <p className="font-medium text-emerald-800 mt-0.5">
                      {selectedShareForDetail.returnNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Timeline Audit Events */}
              <div className="border border-gray-200 rounded-2xl p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Audit History Events
                </div>
                {shareHistory.length === 0 ? (
                  <div className="text-[11px] text-gray-400">
                    No history log entries recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shareHistory.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-start gap-2.5 text-[11px]"
                      >
                        <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></div>
                        <div>
                          <div className="font-bold text-gray-800">
                            {h.action}
                          </div>
                          {h.notes && (
                            <div className="text-gray-600 mt-0.5">
                              {h.notes}
                            </div>
                          )}
                          {h.timestamp && (
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {format(
                                new Date(h.timestamp.seconds * 1000),
                                "dd MMM yyyy, hh:mm a"
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
