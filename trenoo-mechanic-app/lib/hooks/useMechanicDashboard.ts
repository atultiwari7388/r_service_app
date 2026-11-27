"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  getDoc,
  arrayUnion,
  query,
  orderBy,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import {
  FirestoreJob,
  MechanicOffer,
  SubmitOfferParams,
  CancelJobParams,
  SubmitRatingParams,
} from "@/types/job";
import toast from "react-hot-toast";
import {
  AppliedCommission,
  ZERO_COMMISSION,
  resolveCommission,
  roundMoney,
} from "@/lib/commission";
import { loadWorkshopCommissionConfig } from "@/lib/services/commissionService";
import {
  JOB_STATUS,
  JobRelation,
  canMarkArrived,
  canMarkRepairFinished,
  canSubmitInspection,
  getAcceptedOffer,
  getExecutingTechnicianId,
  getJobRelation,
  isTeamMemberProfile,
} from "@/lib/jobWorkflow";

/** Statuses in which a dispatched technician is actively working a job. */
const ACTIVE_EXECUTION_STATUSES: number[] = [
  JOB_STATUS.DISPATCHED,
  JOB_STATUS.ON_SITE,
  JOB_STATUS.WORK_ORDER,
];

/** Normalise Firestore Timestamp / Date / string / {seconds} into epoch ms (0 if unknown). */
export function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (typeof value === "object") {
    const v = value as { toMillis?: () => number; seconds?: number };
    if (typeof v.toMillis === "function") return v.toMillis();
    if (typeof v.seconds === "number") return v.seconds * 1000;
  }
  return 0;
}

/**
 * Recursively removes all `undefined` values from an object or array.
 * Firestore throws an error if `undefined` is passed in any field, nested map, or array element.
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  // Preserve Date, Firestore Timestamp, or FieldValue instances
  if (
    typeof data === "object" &&
    data !== null &&
    (data instanceof Date ||
      data instanceof Timestamp ||
      ("isEqual" in data && typeof (data as any).isEqual === "function") ||
      ("_methodName" in data && typeof (data as any)._methodName === "string"))
  ) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (typeof data === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Exact Haversine formula matching Flutter rabbit_shop_app/lib/services/calculate_distance.dart
 * Radius of Earth = 6371 km
 */
export function calculateDistance(
  userLat: number,
  userLng: number,
  mecLat: number,
  mecLng: number
): number {
  if (!userLat || !userLng || !mecLat || !mecLng) return 1;
  const earthRadius = 6371; // Radius of Earth in km matching Flutter
  const lat1 = (userLat * Math.PI) / 180;
  const lon1 = (userLng * Math.PI) / 180;
  const lat2 = (mecLat * Math.PI) / 180;
  const lon2 = (mecLng * Math.PI) / 180;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;

  return distance < 1 ? 1 : Math.round(distance);
}

export function useMechanicDashboard() {
  const authContext = useAuth();
  const user = authContext?.user;
  const mechanicProfile = authContext?.mechanicProfile;
  const currentUId = user?.uid || "";

  // State
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [currentLat, setCurrentLat] = useState<number>(0);
  const [currentLng, setCurrentLng] = useState<number>(0);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);

  // Active Plan Check (Owner must have isSubscriptionPurchase, Member can inherit)
  const isMember = isTeamMemberProfile(mechanicProfile);
  const isOwner = !isMember;

  const hasActivePlan = Boolean(
    mechanicProfile?.isSubscriptionPurchase === true ||
    (isMember && mechanicProfile?.inheritedSubscriptionOwnerId)
  );

  // Sorting & Nearby Filtering state (matching Flutter DashboardController)
  const [selectedSortOption, setSelectedSortOption] = useState<
    "Near by" | "Rating" | "Newest"
  >("Near by");
  const [filterOnlyNearby, setFilterOnlyNearby] = useState<boolean>(true);

  const [allJobs, setAllJobs] = useState<FirestoreJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);
  const [cancelReasons, setCancelReasons] = useState<string[]>([]);

  // Real-time 1-second ticker to invalidate & auto-hide jobs after 5 minutes (300s) matching Flutter
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Synchronize mechanic online status & saved location from Firestore profile
  useEffect(() => {
    if (mechanicProfile) {
      if (typeof mechanicProfile.active === "boolean") {
        setIsOnline(mechanicProfile.active);
        // Only show address if currently online
        if (mechanicProfile.active && mechanicProfile.address) {
          setCurrentAddress(mechanicProfile.address);
        } else if (!mechanicProfile.active) {
          setCurrentAddress("");
        }
      }
      if (
        mechanicProfile.location?.latitude &&
        mechanicProfile.location?.longitude
      ) {
        setCurrentLat(mechanicProfile.location.latitude);
        setCurrentLng(mechanicProfile.location.longitude);
      }
    }
  }, [mechanicProfile]);

  // Request browser geolocation ONLY when explicitly triggered or on active switch toggle ON
  const refreshLocation = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setIsUpdatingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLat(lat);
        setCurrentLng(lng);

        // Reverse geocoding via OpenStreetMap Nominatim for human readable street/city
        let resolvedAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              resolvedAddress = data.display_name;
            }
          }
        } catch {
          // fallback to lat/lng
        }

        setCurrentAddress(resolvedAddress);

        // Persist to Firestore if mechanic is logged in
        if (currentUId) {
          try {
            await updateDoc(doc(db, "Mechanics", currentUId), {
              address: resolvedAddress,
              location: {
                latitude: lat,
                longitude: lng,
              },
            });
            toast.success("Location synchronized with GPS coordinates");
          } catch (e) {
            console.warn("Could not save location to Firestore:", e);
          }
        }
        setIsUpdatingLocation(false);
      },
      (err) => {
        console.warn("Geolocation warning:", err.message);
        toast.error("Could not obtain GPS location: " + err.message);
        setIsUpdatingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [currentUId]);

  // Fetch cancel reasons from metadata
  useEffect(() => {
    async function loadCancelReasons() {
      try {
        const docSnap = await getDoc(
          doc(db, "metadata", "mechanicJobCancelReasons")
        );
        if (docSnap.exists() && docSnap.data()?.list) {
          setCancelReasons(docSnap.data().list);
        } else {
          setCancelReasons([
            "Driver Late",
            "Mis-Communication",
            "Language Problem",
            "Customer Vehicle Moved",
            "Parts Unavailable",
            "Other",
          ]);
        }
      } catch {
        setCancelReasons([
          "Driver Late",
          "Mis-Communication",
          "Language Problem",
          "Customer Vehicle Moved",
          "Parts Unavailable",
          "Other",
        ]);
      }
    }
    loadCancelReasons();
  }, []);

  // Real-time listener for Firestore `jobs`
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingJobs(true);
    const jobsCol = collection(db, "jobs");
    const q = query(jobsCol, orderBy("orderDate", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsList: FirestoreJob[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          jobsList.push({
            id: docSnap.id,
            orderId: data.orderId || docSnap.id,
            userId: data.userId || "",
            userName: data.userName || "Customer",
            userPhoneNumber: data.userPhoneNumber || "",
            userPhoto: data.userPhoto || "",
            userDeliveryAddress:
              data.userDeliveryAddress || data.address || "N/A",
            selectedService:
              data.selectedService || "General Roadside Assistance",
            companyName: data.companyName || "",
            vehicleNumber: data.vehicleNumber || "",
            vehicleModel: data.vehicleModel || "",
            userLat: typeof data.userLat === "number" ? data.userLat : 0,
            userLong: typeof data.userLong === "number" ? data.userLong : 0,
            status: typeof data.status === "number" ? data.status : 0,
            orderDate: data.orderDate || data.date || Timestamp.now(),
            date: data.date,
            nearByDistance:
              typeof data.nearByDistance === "number"
                ? data.nearByDistance
                : 50,
            isImageSelected: Boolean(data.isImageSelected),
            images: data.images || [],
            fixPriceEnabled: Boolean(data.fixPriceEnabled),
            fixPrice: data.fixPrice ?? 0,
            myCompany: data.myCompany || "",
            payMode: data.payMode || "",
            cancelReason: data.cancelReason || "",
            cancelBy: data.cancelBy || "",
            description: data.description || "",
            mechanicsOffer: data.mechanicsOffer || [],
            mRating: data.mRating,
            mReview: data.mReview,
            mReviewSubmitted: data.mReviewSubmitted,
            // Team dispatch & workflow state
            assignedMemberId: data.assignedMemberId,
            assignedMemberName: data.assignedMemberName,
            assignedMemberPhone: data.assignedMemberPhone,
            assignedMemberCity: data.assignedMemberCity,
            ownerId: data.ownerId,
            mechanicId: data.mechanicId,
            estimatedRepairMinutes: data.estimatedRepairMinutes,
            activeJobStartedAt: data.activeJobStartedAt,
            handoverRequested: data.handoverRequested,
            handoverReason: data.handoverReason,
            handoverRequestedAt: data.handoverRequestedAt,
            reassignedFromMemberId: data.reassignedFromMemberId,
            finalDiagnosedAmount: data.finalDiagnosedAmount,
            inspectionNotes: data.inspectionNotes,
            inspectionCompletedAt: data.inspectionCompletedAt,
            repairCompletedByTechnician: data.repairCompletedByTechnician,
            repairFinishedAt: data.repairFinishedAt,
            customerSignOff: data.customerSignOff,
            customerSignOffAt: data.customerSignOffAt,
            isPaid: data.isPaid,
            paidAmount: data.paidAmount,
            paidAt: data.paidAt,
            assignmentStatus: data.assignmentStatus,
            memberAcceptedAt: data.memberAcceptedAt,
            memberDeclinedAt: data.memberDeclinedAt,
            arrivedAtLocation: data.arrivedAtLocation,
            arrivedAt: data.arrivedAt,
            mechanicCommission: data.mechanicCommission,
            mechanicCommissionRule: data.mechanicCommissionRule,
            mechanicNetEarning: data.mechanicNetEarning,
            customerServiceFee: data.customerServiceFee,
            customerServiceFeeRule: data.customerServiceFeeRule,
            totalAmountDue: data.totalAmountDue,
            settlementId: data.settlementId,
          });
        });
        setAllJobs(jobsList);
        setIsLoadingJobs(false);
      },
      (err) => {
        console.error("Firestore jobs listener error:", err);
        setIsLoadingJobs(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Toggle active/inactive in Firestore
  const toggleActive = async (newVal: boolean) => {
    if (newVal) {
      // Must have an active plan to go online
      if (!hasActivePlan) {
        toast.error("Active membership required to go online. Please purchase a plan.");
        return;
      }

      setIsOnline(true);
      // Fetch GPS position & address on active toggle ON
      if (typeof window !== "undefined" && navigator.geolocation) {
        setIsUpdatingLocation(true);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setCurrentLat(lat);
            setCurrentLng(lng);

            let resolvedAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
              );
              if (res.ok) {
                const data = await res.json();
                if (data?.display_name) {
                  resolvedAddress = data.display_name;
                }
              }
            } catch {
              // fallback
            }

            setCurrentAddress(resolvedAddress);

            if (currentUId) {
              try {
                await updateDoc(doc(db, "Mechanics", currentUId), {
                  active: true,
                  address: resolvedAddress,
                  location: {
                    latitude: lat,
                    longitude: lng,
                  },
                });
                toast.success("You are now ONLINE & accepting jobs");
              } catch (err: any) {
                console.error("Firestore active error:", err);
              }
            }
            setIsUpdatingLocation(false);
          },
          (err) => {
            console.warn("Geolocation warning on toggle online:", err.message);
            toast.error("Location permission required to go online: " + err.message);
            setIsUpdatingLocation(false);
            setIsOnline(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        return;
      }
    } else {
      // Toggle OFF: clear current address & set active: false
      setIsOnline(false);
      setCurrentAddress("");
      if (!currentUId) return;
      try {
        await updateDoc(doc(db, "Mechanics", currentUId), {
          active: false,
        });
        toast.success("You are now OFFLINE");
      } catch (err: any) {
        toast.error(err.message || "Failed to update offline status");
        setIsOnline(true); // revert
      }
    }
  };

  // Mechanic's registered services
  const mechanicServices = useMemo(() => {
    return mechanicProfile?.selected_services || [];
  }, [mechanicProfile?.selected_services]);

  // Attach live distance from the mechanic's current GPS position
  const withDistance = useCallback(
    (job: FirestoreJob): FirestoreJob => ({
      ...job,
      calculatedDistance: calculateDistance(
        job.userLat || 0,
        job.userLong || 0,
        currentLat,
        currentLng
      ),
    }),
    [currentLat, currentLng]
  );

  // Upcoming Jobs
  //  - Team members: ONLY jobs dispatched to them (status 2-4). Never open requests,
  //    never pending quotes. Members do not bid.
  //  - Owners: open status-0 requests they have not quoted yet (Flutter dashboard rules).
  const upcomingJobs = useMemo(() => {
    if (!currentUId) return [];

    if (isMember) {
      return allJobs
        .filter(
          (job) =>
            ACTIVE_EXECUTION_STATUSES.includes(job.status) &&
            getJobRelation(job, currentUId).relation === "executor"
        )
        .map(withDistance);
    }

    // Open roadside requests are only offered while online with registered services
    if (!isOnline || mechanicServices.length === 0) return [];

    const openJobs = allJobs
      .filter((job) => {
        if (job.status !== JOB_STATUS.OPEN) return false;

        // Already quoted (or withdrawn) by this workshop: never quote twice
        if (job.mechanicsOffer?.some((o) => o.mId === currentUId)) return false;

        // Service match (Flutter dashboard_screen.dart lines 278-286)
        if (!mechanicServices.includes(job.selectedService)) return false;

        // 5-minute auto-hide (Flutter dashboard_screen.dart lines 288-305)
        const jobTimeMs = toMillis(job.orderDate);
        if (jobTimeMs > 0 && Math.floor((currentTime - jobTimeMs) / 1000) >= 300) {
          return false;
        }

        // Nearby distance filtering (Flutter dashboard_screen.dart lines 369-371)
        if (filterOnlyNearby && currentLat !== 0 && currentLng !== 0) {
          const dist = calculateDistance(
            job.userLat || 0,
            job.userLong || 0,
            currentLat,
            currentLng
          );
          const maxAllowedDistance =
            typeof job.nearByDistance === "number" && job.nearByDistance > 0
              ? job.nearByDistance
              : 50;
          if (dist > maxAllowedDistance) return false;
        }

        return true;
      })
      .map(withDistance);

    // Sorting (Flutter dashboard_screen.dart lines 170-204)
    if (selectedSortOption === "Near by") {
      openJobs.sort(
        (a, b) => (a.calculatedDistance || 0) - (b.calculatedDistance || 0)
      );
    } else if (selectedSortOption === "Rating") {
      openJobs.sort((a, b) => (b.mRating || 4.5) - (a.mRating || 4.5));
    } else if (selectedSortOption === "Newest") {
      openJobs.sort((a, b) => toMillis(b.orderDate) - toMillis(a.orderDate));
    }

    return openJobs;
  }, [
    allJobs,
    isMember,
    isOnline,
    currentUId,
    mechanicServices,
    currentTime,
    currentLat,
    currentLng,
    filterOnlyNearby,
    selectedSortOption,
    withDistance,
  ]);

  // Ongoing Jobs
  //  - Executor (member or self-assigned owner) and supervising owner: status 2-4
  //  - Owner's pending quotes while the request is still open (offer status 1)
  //  - Losing bids disappear as soon as the customer accepts another offer
  const ongoingJobs = useMemo(() => {
    if (!currentUId) return [];

    return allJobs
      .filter((job) => {
        const { relation, offer } = getJobRelation(job, currentUId);
        if (relation === "executor" || relation === "supervisor") {
          return ACTIVE_EXECUTION_STATUSES.includes(job.status);
        }
        if (relation === "bidder") {
          return (
            !isMember &&
            job.status === JOB_STATUS.OPEN &&
            offer?.status === JOB_STATUS.QUOTED
          );
        }
        return false;
      })
      .map(withDistance);
  }, [allJobs, currentUId, isMember, withDistance]);

  // Completed jobs: this mechanic executed or supervised the signed-off work order
  const completedJobs = useMemo(() => {
    if (!currentUId) return [];
    return allJobs.filter((job) => {
      if (job.status !== JOB_STATUS.COMPLETED) return false;
      const { relation } = getJobRelation(job, currentUId);
      return relation === "executor" || relation === "supervisor";
    });
  }, [allJobs, currentUId]);

  // Cancelled jobs: engaged work orders that were cancelled, or this workshop's withdrawn quotes
  const cancelledJobs = useMemo(() => {
    if (!currentUId) return [];
    return allJobs.filter((job) => {
      const { relation, offer } = getJobRelation(job, currentUId);
      if (relation === "executor" || relation === "supervisor") {
        return job.status === JOB_STATUS.CANCELLED;
      }
      if (relation === "bidder") {
        return (
          job.status === JOB_STATUS.CANCELLED ||
          offer?.status === JOB_STATUS.CANCELLED
        );
      }
      return false;
    });
  }, [allJobs, currentUId]);

  // History tab: completed + cancelled, newest first (allJobs is ordered by orderDate desc)
  const historyJobs = useMemo(() => {
    const ids = new Set([...completedJobs, ...cancelledJobs].map((j) => j.id));
    return allJobs.filter((j) => ids.has(j.id));
  }, [allJobs, completedJobs, cancelledJobs]);

  // Counters matching Flutter DashboardController (dashboard_controller.dart lines 92-97)
  const totalCompletedJobsCount = useMemo(() => {
    return completedJobs.length;
  }, [completedJobs]);

  const ongoingJobsCount = useMemo(() => {
    return ongoingJobs.length;
  }, [ongoingJobs]);

  // Total count of all new jobs in system vs nearby (within 5-minute active window)
  const totalNewJobsCount = useMemo(() => {
    if (isMember) return 0;
    return allJobs.filter((j) => {
      if (j.status !== JOB_STATUS.OPEN) return false;
      const jobTimeMs = toMillis(j.orderDate);
      return !(jobTimeMs > 0 && Math.floor((currentTime - jobTimeMs) / 1000) >= 300);
    }).length;
  }, [allJobs, currentTime, isMember]);

  // ─── Firestore helpers ──────────────────────────────────────────────────────

  // Jobs may be stored under "#id" or the bare id; resolve whichever exists.
  const loadJob = async (jobId: string) => {
    const rawId = jobId.replace(/^#/, "");
    for (const candidate of [jobId, `#${rawId}`, rawId]) {
      const snap = await getDoc(doc(db, "jobs", candidate));
      if (snap.exists()) {
        const data = snap.data();
        const job = {
          ...data,
          id: snap.id,
          status: typeof data.status === "number" ? data.status : 0,
          mechanicsOffer: (data.mechanicsOffer || []) as MechanicOffer[],
        } as FirestoreJob & { mechanicsOffer: MechanicOffer[] };
        return { job, data };
      }
    }
    throw new Error("Job not found. It may have been removed by the customer.");
  };

  // Reliably sync updates across the jobs doc and every related user history doc
  const syncJobAndHistories = async (
    jobId: string,
    userId: string,
    jobData: Record<string, unknown> | null | undefined,
    updates: Record<string, unknown>
  ) => {
    const rawId = jobId.replace(/^#/, "");
    const hashId = `#${rawId}`;
    const cleanUpdates = sanitizeFirestoreData(updates);

    let jobDocUpdated = false;
    for (const jId of [jobId, rawId, hashId]) {
      try {
        const jRef = doc(db, "jobs", jId);
        const jSnap = await getDoc(jRef);
        if (jSnap.exists()) {
          await updateDoc(jRef, cleanUpdates);
          jobDocUpdated = true;
          break;
        }
      } catch (e) {
        console.warn(`jobs/${jId} update skipped:`, e);
      }
    }
    if (!jobDocUpdated) {
      throw new Error("Could not update the job. Please retry.");
    }

    // Customer-side history copies (driver, fleet owner, creator)
    const targetUids = new Set<string>();
    if (userId) targetUids.add(userId);
    for (const key of ["userId", "ownerId", "createdBy", "creatorId"] as const) {
      const uid = jobData?.[key];
      if (typeof uid === "string" && uid) targetUids.add(uid);
    }

    for (const targetUid of targetUids) {
      if (!targetUid) continue;
      for (const hId of [rawId, hashId]) {
        try {
          const hRef = doc(db, "Users", targetUid, "history", hId);
          const hSnap = await getDoc(hRef);
          if (hSnap.exists()) {
            await updateDoc(hRef, cleanUpdates);
          }
        } catch (e) {
          console.warn(`history ${targetUid}/${hId} update skipped:`, e);
        }
      }
    }
  };

  // Clear / set the technician's active-job pointer used by the 70% queueing rule
  const setTechnicianActiveJob = async (
    techUid: string,
    jobId: string | null,
    estimatedMinutes?: number
  ) => {
    if (!techUid) return;
    try {
      await updateDoc(doc(db, "Mechanics", techUid), {
        currentActiveJobId: jobId,
        activeJobStartedAt: jobId ? Timestamp.now() : null,
        activeJobEstimatedMinutes: jobId ? estimatedMinutes || 45 : null,
      });
    } catch (e) {
      console.warn("Could not update technician active job:", e);
    }
  };

  /**
   * Run a guarded field transition on the ACCEPTED offer only.
   * Re-reads the job first so stale UI can never move the state machine backwards.
   */
  const runFieldTransition = async (
    jobId: string,
    opts: {
      allowed: JobRelation[];
      guard: (job: FirestoreJob) => boolean;
      guardMessage: string;
      build: (
        job: FirestoreJob,
        now: Timestamp
      ) => { job: Record<string, any>; offer: Partial<MechanicOffer> };
    }
  ) => {
    const { job, data } = await loadJob(jobId);
    const { relation } = getJobRelation(job, currentUId);
    if (!opts.allowed.includes(relation)) {
      throw new Error("Only the technician assigned to this job can do that.");
    }
    if (!opts.guard(job)) {
      throw new Error(opts.guardMessage);
    }

    const now = Timestamp.now();
    const patch = opts.build(job, now);
    const accepted = getAcceptedOffer(job);
    const mechanicsOffer = job.mechanicsOffer.map((o) =>
      o === accepted ? { ...o, ...patch.offer } : o
    );

    await syncJobAndHistories(job.id, job.userId || data.userId, data, {
      ...patch.job,
      mechanicsOffer,
    });
    return { job, accepted, now };
  };

  const withToast = async <T,>(
    action: () => Promise<T>,
    success: string,
    failure: string
  ): Promise<T> => {
    try {
      const result = await action();
      toast.success(success);
      return result;
    } catch (err: unknown) {
      console.error(failure, err);
      toast.error(err instanceof Error && err.message ? err.message : failure);
      throw err;
    }
  };

  // ─── Phase 1: Workshop owner submits a quote (optionally delegated) ─────────
  const submitOffer = async (params: SubmitOfferParams) => {
    if (!currentUId) {
      toast.error("Please sign in as a mechanic first");
      return;
    }
    if (isMember) {
      toast.error("Team members cannot quote on jobs. Your workshop owner dispatches jobs to you.");
      return;
    }

    const {
      jobId,
      userId,
      arrivalCharges,
      perHourCharges,
      fixPrice,
      arrivalTime,
      assignedMemberId,
      assignedMemberName,
      assignedMemberCity,
      assignedMemberPhone,
    } = params;

    const isAssigned = Boolean(
      assignedMemberId &&
        assignedMemberId.trim() !== "" &&
        assignedMemberId !== "self" &&
        assignedMemberId !== currentUId
    );

    const offerPayload: Record<string, any> = {
      mId: currentUId,
      mName:
        mechanicProfile?.workshopName ||
        mechanicProfile?.userName ||
        "Mechanic",
      mNumber: mechanicProfile?.cellPhone || mechanicProfile?.telephone || "",
      mDp: mechanicProfile?.profilePicture || mechanicProfile?.mDp || "",
      arrivalCharges: arrivalCharges || 0,
      perHourCharges: perHourCharges || mechanicProfile?.perHourCharge || 0,
      fixPrice: fixPrice || 0,
      time: String(arrivalTime || "15"),
      latitude: currentLat || 0,
      longitude: currentLng || 0,
      status: JOB_STATUS.QUOTED,
      rating: "4.8",
      reviewSubmitted: false,
      languages: mechanicProfile?.languages
        ? Object.entries(mechanicProfile.languages)
            .filter(([, v]) => v)
            .map(([k]) => k)
        : ["English"],
      mechanicAddress: currentAddress || "",
      offerAcceptedDate: Timestamp.now(),
      isAssignedByOwner: isAssigned,
    };

    if (isAssigned) {
      offerPayload.assignedMemberId = assignedMemberId;
      offerPayload.assignedMemberName = (assignedMemberName || "").trim();
      offerPayload.assignedMemberCity = (assignedMemberCity || "").trim();
      offerPayload.assignedMemberPhone = (assignedMemberPhone || "").trim();
    }

    const cleanOffer = sanitizeFirestoreData(offerPayload) as MechanicOffer;

    await withToast(
      async () => {
        const { job, data: jobData } = await loadJob(jobId);
        if (job.status !== JOB_STATUS.OPEN) {
          throw new Error("This request is no longer open for quotes.");
        }
        if (job.mechanicsOffer.some((o) => o.mId === currentUId)) {
          throw new Error("Your workshop has already quoted on this request.");
        }

        // NOTE: only the offer is written here. Top-level dispatch fields
        // (assignedMemberId, etc.) are written by the customer app when THIS
        // offer is accepted; writing them now would let the last bidder
        // overwrite them. `ownerId` on the job is the customer's fleet owner and
        // must never be touched by the mechanic app.
        await updateDoc(doc(db, "jobs", job.id), {
          mechanicsOffer: arrayUnion(cleanOffer),
        });

        const targetUids = new Set<string>();
        if (userId) targetUids.add(userId);
        if (jobData?.userId) targetUids.add(jobData.userId);
        if (jobData?.ownerId) targetUids.add(jobData.ownerId);
        if (jobData?.createdBy) targetUids.add(jobData.createdBy);
        if (jobData?.creatorId) targetUids.add(jobData.creatorId);

        for (const targetUid of targetUids) {
          if (!targetUid) continue;
          const historyRef = doc(db, "Users", targetUid, "history", job.id);
          const historySnap = await getDoc(historyRef);
          if (historySnap.exists()) {
            await updateDoc(historyRef, {
              mechanicsOffer: arrayUnion(cleanOffer),
            });
          } else {
            await setDoc(
              historyRef,
              sanitizeFirestoreData({
                ...(jobData || {}),
                mechanicsOffer: [cleanOffer],
                orderId: job.id,
                status: JOB_STATUS.OPEN,
              })
            );
          }
        }
      },
      isAssigned && assignedMemberName
        ? `Quote submitted. ${assignedMemberName} will be dispatched if the driver accepts.`
        : "Offer submitted to driver successfully!",
      "Failed to submit offer"
    );
  };

  // ─── Phase 3: Technician arrives on site (status 2 → 3) ─────────────────────
  const markArrivedAtSite = async (jobId: string) =>
    withToast(
      () =>
        runFieldTransition(jobId, {
          allowed: ["executor"],
          guard: canMarkArrived,
          guardMessage: "Arrival can only be recorded while the job is en route.",
          build: (_job, now) => ({
            job: {
              status: JOB_STATUS.ON_SITE,
              assignmentStatus: "inspecting",
              arrivedAtLocation: true,
              arrivedAt: now,
            },
            offer: { status: JOB_STATUS.ON_SITE, assignmentStatus: "inspecting" },
          }),
        }),
      "Arrival recorded. Complete the on-site inspection.",
      "Failed to mark arrival"
    );

  // ─── Phase 3 → 4: Inspection with verified final amount ─────────────────────
  const submitInspectionAndQuote = async (
    jobId: string,
    params: {
      finalAmount: number;
      inspectionNotes: string;
      estimatedMinutes: number;
    }
  ) => {
    const finalAmount = Math.round(Number(params.finalAmount) * 100) / 100;
    const notes = (params.inspectionNotes || "").trim();
    const minutes = Math.round(Number(params.estimatedMinutes));

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      toast.error("Enter a verified final amount greater than $0.");
      throw new Error("Invalid final amount");
    }
    if (!notes) {
      toast.error("Diagnostic notes are required.");
      throw new Error("Missing diagnostic notes");
    }
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error("Enter the estimated repair time in minutes.");
      throw new Error("Invalid repair minutes");
    }

    // Lock the workshop owner's plan commission on this work order now, so the
    // technician / owner see their net earning before the repair starts.
    // Team members are billed on their workshop owner's plan (offer.mId).
    let commissionRule: AppliedCommission = { ...ZERO_COMMISSION };
    try {
      const { job: current } = await loadJob(jobId);
      const workshopOwnerId = getAcceptedOffer(current)?.mId;
      const config = await loadWorkshopCommissionConfig(workshopOwnerId);
      commissionRule = resolveCommission(config, current.selectedService, finalAmount, {
        capAtBase: true,
      });
    } catch (err) {
      console.warn("Commission lookup failed; it will be resolved at sign-off:", err);
    }
    const mechanicNetEarning = roundMoney(finalAmount - commissionRule.amount);

    const { accepted } = await withToast(
      () =>
        runFieldTransition(jobId, {
          allowed: ["executor"],
          guard: canSubmitInspection,
          guardMessage: "Inspection can only be submitted after arriving on site.",
          build: (_job, now) => ({
            job: {
              status: JOB_STATUS.WORK_ORDER,
              assignmentStatus: "awaiting_payment",
              finalDiagnosedAmount: finalAmount,
              inspectionNotes: notes,
              inspectionCompletedAt: now,
              estimatedRepairMinutes: minutes,
              isPaid: false,
              mechanicCommission: commissionRule.amount,
              mechanicCommissionRule: commissionRule,
              mechanicNetEarning,
            },
            offer: {
              status: JOB_STATUS.WORK_ORDER,
              assignmentStatus: "awaiting_payment",
              finalDiagnosedAmount: finalAmount,
              inspectionNotes: notes,
              inspectionCompletedAt: now,
            },
          }),
        }),
      "Inspection submitted. Final work order sent to the customer for payment.",
      "Failed to submit inspection"
    );

    await setTechnicianActiveJob(getExecutingTechnicianId(accepted), jobId, minutes);
  };

  // ─── Phase 5: Repair finished (requires payment) ────────────────────────────
  const markRepairFinished = async (jobId: string) => {
    const { accepted } = await withToast(
      () =>
        runFieldTransition(jobId, {
          allowed: ["executor"],
          guard: canMarkRepairFinished,
          guardMessage: "The repair can only be finished after the customer has paid.",
          build: (_job, now) => ({
            job: { repairCompletedByTechnician: true, repairFinishedAt: now },
            offer: { repairCompletedByTechnician: true, repairFinishedAt: now },
          }),
        }),
      "Repair marked finished. Waiting for the customer's quality sign-off.",
      "Failed to mark repair finished"
    );
    await setTechnicianActiveJob(getExecutingTechnicianId(accepted), null);
  };

  // ─── Emergency handover (executing technician) ──────────────────────────────
  const requestEmergencyHandover = async (jobId: string, reason: string): Promise<void> => {
    await withToast(
      () =>
        runFieldTransition(jobId, {
          allowed: ["executor"],
          guard: (job) => ACTIVE_EXECUTION_STATUSES.includes(job.status),
          guardMessage: "Handover is only possible on an active job.",
          build: (_job, now) => ({
            job: {
              handoverRequested: true,
              handoverReason: reason,
              handoverRequestedAt: now,
            },
            offer: {},
          }),
        }),
      "Emergency handover requested. Workshop owner notified.",
      "Failed to request handover"
    );
  };

  // ─── Reassign technician (workshop owner) ───────────────────────────────────
  // member === null → owner takes the job back ("Self")
  const reassignJobMember = async (
    jobId: string,
    member: { id: string; name: string; phone?: string; city?: string } | null
  ) =>
    withToast(
      async () => {
        const { job, data } = await loadJob(jobId);
        const { relation, offer } = getJobRelation(job, currentUId);
        if (!offer || offer.mId !== currentUId) {
          throw new Error("Only the workshop owner can reassign this job.");
        }
        const isOpenBid = relation === "bidder" && job.status === JOB_STATUS.OPEN;
        if (!isOpenBid && !ACTIVE_EXECUTION_STATUSES.includes(job.status)) {
          throw new Error("This job can no longer be reassigned.");
        }
        if (job.isPaid && job.repairCompletedByTechnician) {
          throw new Error("Repair is already finished; reassignment is not needed.");
        }

        const target = offer as MechanicOffer;
        const previousTechId = getExecutingTechnicianId(target);
        const delegate = member && member.id !== currentUId ? member : null;

        // Rebuild the offer without stale member fields when reverting to self
        const {
          assignedMemberId: _oldId,
          assignedMemberName: _oldName,
          assignedMemberPhone: _oldPhone,
          assignedMemberCity: _oldCity,
          ...offerBase
        } = target;
        const nextOffer: MechanicOffer = delegate
          ? {
              ...offerBase,
              assignedMemberId: delegate.id,
              assignedMemberName: delegate.name,
              assignedMemberPhone: delegate.phone || "",
              assignedMemberCity: delegate.city || "",
              isAssignedByOwner: true,
            }
          : { ...offerBase, isAssignedByOwner: false };

        const mechanicsOffer = job.mechanicsOffer.map((o) =>
          o === target ? nextOffer : o
        );

        const updates: Record<string, unknown> = { mechanicsOffer };
        if (!isOpenBid) {
          Object.assign(updates, {
            assignedMemberId: delegate ? delegate.id : deleteField(),
            assignedMemberName: delegate ? delegate.name : deleteField(),
            assignedMemberPhone: delegate ? delegate.phone || "" : deleteField(),
            assignedMemberCity: delegate ? delegate.city || "" : deleteField(),
            isAssignedByOwner: Boolean(delegate),
            handoverRequested: false,
            reassignedFromMemberId: previousTechId || null,
            reassignedAt: Timestamp.now(),
          });
        }

        await syncJobAndHistories(job.id, job.userId || data.userId, data, updates);

        if (!isOpenBid) {
          const nextTechId = delegate ? delegate.id : currentUId;
          if (previousTechId && previousTechId !== nextTechId) {
            await setTechnicianActiveJob(previousTechId, null);
          }
          if (job.status === JOB_STATUS.WORK_ORDER) {
            await setTechnicianActiveJob(nextTechId, job.id, job.estimatedRepairMinutes);
          }
        }
      },
      member ? `Job reassigned to ${member.name}.` : "Job reassigned to you (Self).",
      "Failed to reassign job"
    );

  // ─── Cancel ─────────────────────────────────────────────────────────────────
  // Open request: withdraw ONLY this workshop's quote (the customer's request stays open).
  // Accepted job: the workshop owner can cancel before payment is captured.
  const cancelJob = async (params: CancelJobParams) => {
    const { jobId, reason } = params;
    await withToast(
      async () => {
        const { job, data } = await loadJob(jobId);
        const { relation, offer } = getJobRelation(job, currentUId);

        if (relation === "bidder" && job.status === JOB_STATUS.OPEN && offer) {
          const mechanicsOffer = job.mechanicsOffer.map((o) =>
            o === offer ? { ...o, status: JOB_STATUS.CANCELLED, cancelReason: reason } : o
          );
          await syncJobAndHistories(job.id, job.userId || data.userId, data, {
            mechanicsOffer,
          });
          return;
        }

        if (!offer || offer.mId !== currentUId) {
          throw new Error(
            "Only the workshop owner can cancel an accepted job. Use Handover instead."
          );
        }
        if (!ACTIVE_EXECUTION_STATUSES.includes(job.status)) {
          throw new Error("This job can no longer be cancelled.");
        }
        if (job.isPaid) {
          throw new Error(
            "The customer has already paid for this work order. Contact support to cancel and refund."
          );
        }

        const mechanicsOffer = job.mechanicsOffer.map((o) =>
          o === offer ? { ...o, status: JOB_STATUS.CANCELLED } : o
        );
        await syncJobAndHistories(job.id, job.userId || data.userId, data, {
          status: JOB_STATUS.CANCELLED,
          cancelReason: reason,
          cancelBy: "Mechanic",
          mechanicsOffer,
        });
        await setTechnicianActiveJob(getExecutingTechnicianId(offer), null);
      },
      "Cancelled successfully",
      "Failed to cancel job"
    );
  };

  // Submit Rating
  const submitRating = async (params: SubmitRatingParams) => {
    const { jobId, userId, orderId, rating, review } = params;
    if (!currentUId) return;

    try {
      const ratingData = {
        rating,
        review,
        mId: currentUId,
        reviewSubmitted: true,
        orderId: orderId || jobId,
        timestamp: Timestamp.now(),
      };

      if (userId) {
        await setDoc(
          doc(db, "Users", userId, "ratings", orderId || jobId),
          ratingData
        );
        await updateDoc(doc(db, "Users", userId, "history", jobId), {
          mRating: rating,
          mReview: review,
          mId: currentUId,
          mReviewSubmitted: true,
          timestamp: Timestamp.now(),
        }).catch(() => {});
      }

      await updateDoc(doc(db, "jobs", jobId), {
        mRating: rating,
        mReview: review,
        mId: currentUId,
        mReviewSubmitted: true,
        timestamp: Timestamp.now(),
      });

      toast.success("Driver review submitted successfully!");
    } catch (err: any) {
      console.error("Error submitting rating:", err);
      toast.error(err.message || "Failed to submit review");
      throw err;
    }
  };

  return {
    user,
    mechanicProfile,
    currentUId,
    isMember,
    isOwner,
    hasActivePlan,
    isOnline,
    currentAddress,
    currentLat,
    currentLng,
    isUpdatingLocation,
    refreshLocation,
    toggleActive,
    allJobs,
    isLoadingJobs,
    upcomingJobs,
    ongoingJobs,
    historyJobs,
    completedJobs,
    cancelledJobs,
    totalCompletedJobsCount,
    ongoingJobsCount,
    totalNewJobsCount,
    selectedSortOption,
    setSelectedSortOption,
    filterOnlyNearby,
    setFilterOnlyNearby,
    cancelReasons,
    submitOffer,
    cancelJob,
    submitRating,
    markArrivedAtSite,
    submitInspectionAndQuote,
    markRepairFinished,
    requestEmergencyHandover,
    reassignJobMember,
  };
}
