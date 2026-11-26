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
  const isMember =
    mechanicProfile?.role === "member" ||
    !!mechanicProfile?.ownerId ||
    mechanicProfile?.isTeamMember === true;

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

  // Upcoming Jobs (Filtered according to Flutter dashboard_screen.dart rules)
  // Strictly enforces:
  // 1. Mechanic must have registered workshop services (selected_services)
  // 2. Job's selectedService must match mechanic's registered services
  // 3. Job is only visible for 5 minutes (300s) from creation time; auto-hidden afterwards
  // 4. Excluded if mechanic already made an offer (status == 1)
  // 5. Excluded if beyond nearby dispatch radius
  const upcomingJobs = useMemo(() => {
    if (!isOnline) return [];

    // Flutter dashboard_screen.dart lines 89-120:
    // If mechanic has not selected any services yet, show 0 jobs until they add services!
    if (mechanicServices.length === 0) return [];

    // Filter by status, offers, services, and distance
    const isMember = mechanicProfile?.role === "member" || !!mechanicProfile?.ownerId;
    const allowDirect = mechanicProfile?.allowDirectJobAcceptance === true;

    const filtered = allJobs
      .filter((job) => {
        // Status must be 0 (new)
        if (job.status !== 0) return false;

        // Autonomous Direct-Accept Gate for Members:
        // If technician is a Member without direct accept permission,
        // they ONLY see jobs directly assigned to them by their workshop owner!
        if (isMember && !allowDirect) {
          if (job.assignedMemberId !== currentUId) {
            return false;
          }
        }

        // Check if current mechanic already made an offer with status == 1 (accepted/interested)
        if (currentUId && job.mechanicsOffer && job.mechanicsOffer.length > 0) {
          const myOffer = job.mechanicsOffer.find(
            (o) => o.mId === currentUId || o.assignedMemberId === currentUId
          );
          if (myOffer && myOffer.status === 1) {
            return false; // already interested/accepted
          }
        }

        // Flutter dashboard_screen.dart lines 278-286:
        // Service match check: job's selectedService must be in mechanicServices
        if (!mechanicServices.includes(job.selectedService)) {
          return false;
        }

        // Flutter dashboard_screen.dart lines 288-305:
        // 5-MINUTE AUTO-HIDE: Hide the job if 5 minutes (300 seconds) have passed since creation!
        let jobTimeMs = 0;
        if (job.orderDate?.toMillis) {
          jobTimeMs = job.orderDate.toMillis();
        } else if (job.orderDate?.seconds) {
          jobTimeMs = job.orderDate.seconds * 1000;
        } else if (job.orderDate instanceof Date) {
          jobTimeMs = job.orderDate.getTime();
        } else if (typeof job.orderDate === "string") {
          jobTimeMs = new Date(job.orderDate).getTime();
        }

        if (jobTimeMs > 0) {
          const elapsedSeconds = Math.floor((currentTime - jobTimeMs) / 1000);
          if (elapsedSeconds >= 300) {
            return false;
          }
        }

        // 2. NEARBY DISTANCE FILTERING (Exact Flutter logic from dashboard_screen.dart line 369-371)
        // Flutter: if (distance <= (job['nearByDistance'] ?? 0))
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
              : 50; // Fallback radius if unconfigured

          if (dist > maxAllowedDistance) {
            // HIDE this job because it is outside the nearby dispatch radius!
            return false;
          }
        }

        return true;
      })
      .map((job) => {
        const dist = calculateDistance(
          job.userLat || 0,
          job.userLong || 0,
          currentLat,
          currentLng
        );
        return {
          ...job,
          calculatedDistance: dist,
        };
      });

    // 3. SORTING (matching Flutter dashboard_screen.dart lines 170-204)
    if (selectedSortOption === "Near by") {
      filtered.sort(
        (a, b) => (a.calculatedDistance || 0) - (b.calculatedDistance || 0)
      );
    } else if (selectedSortOption === "Rating") {
      filtered.sort((a, b) => (b.mRating || 4.5) - (a.mRating || 4.5));
    } else if (selectedSortOption === "Newest") {
      filtered.sort((a, b) => {
        const dateA = a.orderDate?.seconds || 0;
        const dateB = b.orderDate?.seconds || 0;
        return dateB - dateA;
      });
    }

    return filtered;
  }, [
    allJobs,
    isOnline,
    currentUId,
    mechanicServices,
    mechanicProfile,
    currentTime,
    currentLat,
    currentLng,
    filterOnlyNearby,
    selectedSortOption,
  ]);

  // Ongoing Jobs (current mechanic has offer with status 1, 2, 3, or 4 and job not completed/cancelled)
  // Or technician is assignedMemberId on the job
  const ongoingJobs = useMemo(() => {
    if (!currentUId) return [];

    return allJobs
      .filter((job) => {
        if (job.status === 5 || job.status === -1) return false;
        // Direct assignment match
        if (job.assignedMemberId === currentUId) return true;

        const myOffer = job.mechanicsOffer?.find(
          (o) => o.mId === currentUId || o.assignedMemberId === currentUId
        );
        if (!myOffer) return false;
        return [1, 2, 3, 4].includes(myOffer.status);
      })
      .map((job) => {
        const dist = calculateDistance(
          job.userLat || 0,
          job.userLong || 0,
          currentLat,
          currentLng
        );
        return {
          ...job,
          calculatedDistance: dist,
        };
      });
  }, [allJobs, currentUId, currentLat, currentLng]);

  // Completed / Cancelled Jobs (History)
  // Strictly matches Flutter rabbit_shop_app history_screen.dart & completed_history_screen.dart
  // A newly registered mechanic with no offers or assignments will see 0 jobs.
  const historyJobs = useMemo(() => {
    if (!currentUId) return [];

    return allJobs.filter((job) => {
      const isAssigned =
        job.assignedMemberId === currentUId ||
        job.mechanicId === currentUId ||
        (job as any).mId === currentUId;

      const myOffer = job.mechanicsOffer?.find(
        (o) => o.mId === currentUId || o.assignedMemberId === currentUId
      );

      // Exclude completely if current mechanic has no offer and is not assigned
      if (!isAssigned && !myOffer) return false;

      // Direct assignment completed or cancelled
      if (isAssigned && (job.status === 5 || job.status === -1)) {
        return true;
      }

      // Check mechanic's offer
      if (myOffer) {
        // Direct offer completion or cancellation
        if (myOffer.status === 5 || myOffer.status === -1) {
          return true;
        }

        // If overall job is completed (5) and this mechanic was the accepted mechanic (status 2..5)
        if (job.status === 5 && myOffer.status >= 2 && myOffer.status <= 5) {
          return true;
        }

        // If overall job was cancelled (-1) and this mechanic was actively engaged
        if (job.status === -1 && myOffer.status >= 1) {
          return true;
        }
      }

      return false;
    });
  }, [allJobs, currentUId]);

  // Distinct Completed Jobs (status == 5)
  // Strictly matches Flutter completed_history_screen.dart: mechanicsOffer.any((offer) => offer['mId'] == currentUId)
  const completedJobs = useMemo(() => {
    if (!currentUId) return [];

    return allJobs.filter((job) => {
      const isAssigned =
        job.assignedMemberId === currentUId ||
        job.mechanicId === currentUId ||
        (job as any).mId === currentUId;

      const myOffer = job.mechanicsOffer?.find(
        (o) => o.mId === currentUId || o.assignedMemberId === currentUId
      );

      if (!isAssigned && !myOffer) return false;

      if (isAssigned && job.status === 5) return true;

      if (myOffer) {
        if (myOffer.status === 5) return true;
        if (job.status === 5 && myOffer.status >= 2 && myOffer.status <= 5) {
          return true;
        }
      }

      return false;
    });
  }, [allJobs, currentUId]);

  // Distinct Cancelled Jobs (status == -1)
  // Strictly matches Flutter cancelled jobs logic where offer belongs to current mechanic
  const cancelledJobs = useMemo(() => {
    if (!currentUId) return [];

    return allJobs.filter((job) => {
      const isAssigned =
        job.assignedMemberId === currentUId ||
        job.mechanicId === currentUId ||
        (job as any).mId === currentUId;

      const myOffer = job.mechanicsOffer?.find(
        (o) => o.mId === currentUId || o.assignedMemberId === currentUId
      );

      if (!isAssigned && !myOffer) return false;

      if (isAssigned && job.status === -1) return true;

      if (myOffer) {
        if (myOffer.status === -1) return true;
        if (job.status === -1 && myOffer.status >= 1) return true;
      }

      return false;
    });
  }, [allJobs, currentUId]);

  // Counters matching Flutter DashboardController (dashboard_controller.dart lines 92-97)
  const totalCompletedJobsCount = useMemo(() => {
    return completedJobs.length;
  }, [completedJobs]);

  const ongoingJobsCount = useMemo(() => {
    return ongoingJobs.length;
  }, [ongoingJobs]);

  // Total count of all new jobs in system vs nearby (within 5-minute active window)
  const totalNewJobsCount = useMemo(() => {
    return allJobs.filter((j) => {
      if (j.status !== 0) return false;
      let jobTimeMs = 0;
      if (j.orderDate?.toMillis) {
        jobTimeMs = j.orderDate.toMillis();
      } else if (j.orderDate?.seconds) {
        jobTimeMs = j.orderDate.seconds * 1000;
      } else if (j.orderDate instanceof Date) {
        jobTimeMs = j.orderDate.getTime();
      } else if (typeof j.orderDate === "string") {
        jobTimeMs = new Date(j.orderDate).getTime();
      }
      if (jobTimeMs > 0) {
        const elapsedSeconds = Math.floor((currentTime - jobTimeMs) / 1000);
        if (elapsedSeconds >= 300) return false;
      }
      return true;
    }).length;
  }, [allJobs, currentTime]);

  // Submit Offer / "Interested" Action
  const submitOffer = async (params: SubmitOfferParams) => {
    if (!currentUId) {
      toast.error("Please sign in as a mechanic first");
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
      assignedMemberId && assignedMemberId.trim() !== "" && assignedMemberId !== "self"
    );

    const offerPayload: Record<string, any> = {
      mId: currentUId,
      mName:
        (isAssigned ? assignedMemberName : "") ||
        mechanicProfile?.workshopName ||
        mechanicProfile?.userName ||
        "Mechanic",
      mNumber:
        (isAssigned ? assignedMemberPhone : "") ||
        mechanicProfile?.cellPhone ||
        mechanicProfile?.telephone ||
        "",
      mDp: mechanicProfile?.profilePicture || mechanicProfile?.mDp || "",
      arrivalCharges: arrivalCharges || 0,
      perHourCharges: perHourCharges || mechanicProfile?.perHourCharge || 0,
      fixPrice: fixPrice || 0,
      time: String(arrivalTime || "15"),
      latitude: currentLat || 0,
      longitude: currentLng || 0,
      status: 1, // 1 = Offered / waiting for driver acceptance
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

    try {
      const jobDocRef = doc(db, "jobs", jobId);
      const jobSnap = await getDoc(jobDocRef);
      const jobData = jobSnap.exists() ? jobSnap.data() : null;

      const jobUpdatePayload: Record<string, any> = {
        mechanicsOffer: arrayUnion(cleanOffer),
        ownerId: currentUId,
      };

      if (isAssigned) {
        jobUpdatePayload.assignedMemberId = assignedMemberId;
        jobUpdatePayload.assignedMemberName = (assignedMemberName || "").trim();
        jobUpdatePayload.assignedMemberCity = (assignedMemberCity || "").trim();
        jobUpdatePayload.assignedMemberPhone = (assignedMemberPhone || "").trim();
        jobUpdatePayload.isAssignedByOwner = true;
      }

      await updateDoc(jobDocRef, sanitizeFirestoreData(jobUpdatePayload));

      // Target all related user histories (creator, fleet owner, user)
      const targetUids = new Set<string>();
      if (userId) targetUids.add(userId);
      if (jobData?.userId) targetUids.add(jobData.userId);
      if (jobData?.ownerId) targetUids.add(jobData.ownerId);
      if (jobData?.createdBy) targetUids.add(jobData.createdBy);
      if (jobData?.creatorId) targetUids.add(jobData.creatorId);

      for (const targetUid of targetUids) {
        if (!targetUid) continue;
        const historyRef = doc(db, "Users", targetUid, "history", jobId);
        const historySnap = await getDoc(historyRef);
        if (historySnap.exists()) {
          await updateDoc(historyRef, {
            mechanicsOffer: arrayUnion(cleanOffer),
          });
        } else {
          const rawHistoryData = {
            ...(jobData || {}),
            mechanicsOffer: [cleanOffer],
            orderId: jobId,
            status: 0,
          };
          await setDoc(historyRef, sanitizeFirestoreData(rawHistoryData));
        }
      }

      toast.success(
        isAssigned && assignedMemberName
          ? `Offer submitted and dispatched to ${assignedMemberName}!`
          : "Offer submitted to driver successfully!"
      );
    } catch (err: any) {
      console.error("Error submitting offer:", err);
      toast.error(err.message || "Failed to submit offer");
      throw err;
    }
  };

  // Helper to reliably sync updates across jobs doc and user histories
  const syncJobAndHistories = async (
    jobId: string,
    userId: string,
    jobData: any,
    updates: Record<string, any>
  ) => {
    const rawId = jobId.replace(/^#/, "");
    const hashId = `#${rawId}`;

    // Update jobs doc
    for (const jId of [jobId, rawId, hashId]) {
      try {
        const jRef = doc(db, "jobs", jId);
        const jSnap = await getDoc(jRef);
        if (jSnap.exists()) {
          await updateDoc(jRef, sanitizeFirestoreData(updates));
        }
      } catch (e) {
        // ignore if id variant doesn't exist
      }
    }

    // Target user histories
    const targetUids = new Set<string>();
    if (userId) targetUids.add(userId);
    if (jobData?.userId) targetUids.add(jobData.userId);
    if (jobData?.ownerId) targetUids.add(jobData.ownerId);
    if (jobData?.createdBy) targetUids.add(jobData.createdBy);
    if (jobData?.creatorId) targetUids.add(jobData.creatorId);

    for (const targetUid of targetUids) {
      if (!targetUid) continue;
      for (const hId of [jobId, rawId, hashId]) {
        try {
          const hRef = doc(db, "Users", targetUid, "history", hId);
          const hSnap = await getDoc(hRef);
          if (hSnap.exists()) {
            await updateDoc(hRef, sanitizeFirestoreData(updates));
          }
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // Step 2 -> 3: Mark Technician Arrived at Breakdown Site (Begins on-site diagnosis)
  const markArrivedAtSite = async (jobId: string, userId: string) => {
    try {
      const rawId = jobId.replace(/^#/, "");
      let jobSnap = await getDoc(doc(db, "jobs", jobId));
      if (!jobSnap.exists()) {
        jobSnap = await getDoc(doc(db, "jobs", `#${rawId}`));
      }
      const jobData = jobSnap.exists() ? jobSnap.data() : null;

      const now = Timestamp.now();
      const offers = (jobData?.mechanicsOffer || []) as MechanicOffer[];
      const updatedOffers = offers.map((offer) => {
        if (offer.mId === currentUId || offer.assignedMemberId === currentUId) {
          return { ...offer, status: 3, arrivedAt: now };
        }
        return offer;
      });

      const updates = {
        status: 3,
        arrivedAtLocation: true,
        arrivedAt: now,
        mechanicsOffer: updatedOffers,
      };

      await syncJobAndHistories(jobId, userId, jobData, updates);
      toast.success("Arrived at breakdown site! Please conduct on-site vehicle inspection.");
    } catch (err: any) {
      console.error("Error marking arrival:", err);
      toast.error(err.message || "Failed to mark arrival");
      throw err;
    }
  };

  // Step 3 -> 4: Submit On-site Inspection & Final Diagnosed Work Order Amount
  const submitInspectionAndQuote = async (
    jobId: string,
    userId: string,
    params: {
      finalAmount: number;
      inspectionNotes: string;
      estimatedMinutes?: number;
    }
  ) => {
    try {
      const { finalAmount, inspectionNotes, estimatedMinutes = 45 } = params;
      const rawId = jobId.replace(/^#/, "");
      let jobSnap = await getDoc(doc(db, "jobs", jobId));
      if (!jobSnap.exists()) {
        jobSnap = await getDoc(doc(db, "jobs", `#${rawId}`));
      }
      const jobData = jobSnap.exists() ? jobSnap.data() : null;

      const now = Timestamp.now();
      const offers = (jobData?.mechanicsOffer || []) as MechanicOffer[];
      const updatedOffers = offers.map((offer) => {
        if (offer.mId === currentUId || offer.assignedMemberId === currentUId) {
          return {
            ...offer,
            status: 4,
            finalDiagnosedAmount: finalAmount,
            inspectionNotes: inspectionNotes.trim(),
            inspectionCompletedAt: now,
          };
        }
        return offer;
      });

      const updates = {
        status: 4,
        finalDiagnosedAmount: finalAmount,
        inspectionNotes: inspectionNotes.trim(),
        inspectionCompletedAt: now,
        estimatedRepairMinutes: estimatedMinutes,
        activeJobStartedAt: now,
        mechanicsOffer: updatedOffers,
      };

      await syncJobAndHistories(jobId, userId, jobData, updates);

      // Update technician's active job timer
      const targetTechUid = jobData?.assignedMemberId || currentUId;
      try {
        const techRef = doc(db, "Mechanics", targetTechUid);
        await updateDoc(techRef, {
          currentActiveJobId: jobId,
          activeJobStartedAt: now,
          activeJobEstimatedMinutes: estimatedMinutes,
        });
      } catch (techErr) {
        console.warn("Could not update technician active timer:", techErr);
      }

      toast.success("Inspection submitted! Final invoice sent to customer for payment.");
    } catch (err: any) {
      console.error("Error submitting inspection:", err);
      toast.error(err.message || "Failed to submit inspection");
      throw err;
    }
  };

  // Step 4 (Execution): Mark Physical Repair Finished & Request Customer Sign-Off
  const markRepairFinished = async (jobId: string, userId: string) => {
    try {
      const rawId = jobId.replace(/^#/, "");
      let jobSnap = await getDoc(doc(db, "jobs", jobId));
      if (!jobSnap.exists()) {
        jobSnap = await getDoc(doc(db, "jobs", `#${rawId}`));
      }
      const jobData = jobSnap.exists() ? jobSnap.data() : null;

      const now = Timestamp.now();
      const offers = (jobData?.mechanicsOffer || []) as MechanicOffer[];
      const updatedOffers = offers.map((offer) => {
        if (offer.mId === currentUId || offer.assignedMemberId === currentUId) {
          return {
            ...offer,
            repairCompletedByTechnician: true,
            repairFinishedAt: now,
          };
        }
        return offer;
      });

      const updates = {
        repairCompletedByTechnician: true,
        repairFinishedAt: now,
        mechanicsOffer: updatedOffers,
      };

      await syncJobAndHistories(jobId, userId, jobData, updates);
      toast.success(
        "Repair marked finished! Work order submitted for customer quality sign-off."
      );
    } catch (err: any) {
      console.error("Error marking repair finished:", err);
      toast.error(err.message || "Failed to mark repair finished");
      throw err;
    }
  };

  // Backward-compatible Start Job with Duration
  const startJobWithDuration = async (
    jobId: string,
    userId: string,
    estimatedMinutes: number
  ) => {
    return submitInspectionAndQuote(jobId, userId, {
      finalAmount: 150,
      inspectionNotes: "Standard on-site diagnostic and repair execution.",
      estimatedMinutes,
    });
  };

  // Request Emergency Handover (Scenario 3)
  const requestEmergencyHandover = async (jobId: string, reason: string) => {
    try {
      const jobDocRef = doc(db, "jobs", jobId);
      await updateDoc(jobDocRef, {
        handoverRequested: true,
        handoverReason: reason,
        handoverRequestedAt: Timestamp.now(),
      });
      toast.success("Emergency handover requested. Owner notified.");
    } catch (err: any) {
      console.error("Error requesting handover:", err);
      toast.error(err?.message || "Failed to request handover");
      throw err;
    }
  };

  // Reassign Job Member (Scenario 3 - Owner action)
  const reassignJobMember = async (
    jobId: string,
    newMemberId: string | null,
    newMemberName: string
  ) => {
    try {
      const jobDocRef = doc(db, "jobs", jobId);
      const jobSnap = await getDoc(jobDocRef);
      const oldMemberId = jobSnap.exists() ? jobSnap.data()?.assignedMemberId : null;

      // Clear old member's active job
      if (oldMemberId) {
        try {
          await updateDoc(doc(db, "Mechanics", oldMemberId), {
            currentActiveJobId: null,
            activeJobStartedAt: null,
            activeJobEstimatedMinutes: null,
          });
        } catch (e) {
          console.warn("Could not clear old member timer:", e);
        }
      }

      // Assign to new member or self
      if (newMemberId) {
        try {
          await updateDoc(doc(db, "Mechanics", newMemberId), {
            currentActiveJobId: jobId,
            activeJobStartedAt: Timestamp.now(),
            activeJobEstimatedMinutes:
              jobSnap.data()?.estimatedRepairMinutes || 45,
          });
        } catch (e) {
          console.warn("Could not set new member timer:", e);
        }
      }

      await updateDoc(jobDocRef, {
        assignedMemberId: newMemberId || null,
        assignedMemberName: newMemberName,
        handoverRequested: false,
        reassignedFromMemberId: oldMemberId || null,
        reassignedAt: Timestamp.now(),
      });

      toast.success(`Job successfully reassigned to ${newMemberName}!`);
    } catch (err: any) {
      console.error("Error reassigning job:", err);
      toast.error(err?.message || "Failed to reassign job");
      throw err;
    }
  };

  // Update Status
  const updateJobStatus = async (
    jobId: string,
    userId: string,
    newStatus: number
  ) => {
    try {
      const jobDocRef = doc(db, "jobs", jobId);
      const jobSnap = await getDoc(jobDocRef);

      if (jobSnap.exists()) {
        const data = jobSnap.data();
        const offers = (data.mechanicsOffer || []) as MechanicOffer[];
        const updatedOffers = offers.map((offer) => {
          if (offer.mId === currentUId || offer.assignedMemberId === currentUId) {
            return { ...offer, status: newStatus };
          }
          return offer;
        });

        await updateDoc(
          jobDocRef,
          sanitizeFirestoreData({
            status: newStatus,
            mechanicsOffer: updatedOffers,
          })
        );
      }

      const targetUids = new Set<string>();
      if (userId) targetUids.add(userId);
      const data = jobSnap.exists() ? jobSnap.data() : null;
      if (data?.userId) targetUids.add(data.userId);
      if (data?.ownerId) targetUids.add(data.ownerId);
      if (data?.createdBy) targetUids.add(data.createdBy);
      if (data?.creatorId) targetUids.add(data.creatorId);

      for (const targetUid of targetUids) {
        if (!targetUid) continue;
        const historyRef = doc(db, "Users", targetUid, "history", jobId);
        const histSnap = await getDoc(historyRef);
        if (histSnap.exists()) {
          const hData = histSnap.data();
          const offers = (hData.mechanicsOffer || []) as MechanicOffer[];
          const updatedOffers = offers.map((offer) => {
            if (offer.mId === currentUId || offer.assignedMemberId === currentUId) {
              return { ...offer, status: newStatus };
            }
            return offer;
          });
          await updateDoc(
            historyRef,
            sanitizeFirestoreData({
              status: newStatus,
              mechanicsOffer: updatedOffers,
            })
          );
        }
      }

      if (newStatus === 5) {
        const targetTechUid = jobSnap.exists()
          ? jobSnap.data()?.assignedMemberId || currentUId
          : currentUId;
        try {
          await updateDoc(doc(db, "Mechanics", targetTechUid), {
            currentActiveJobId: null,
            activeJobStartedAt: null,
            activeJobEstimatedMinutes: null,
          });
        } catch (techErr) {
          console.warn("Could not reset technician timer upon completion:", techErr);
        }
        toast.success("Job marked as COMPLETED! Great work.");
      } else {
        toast.success(`Job status updated to Step ${newStatus}`);
      }
    } catch (err: any) {
      console.error("Error updating job status:", err);
      toast.error(err.message || "Failed to update status");
      throw err;
    }
  };

  // Cancel Job
  const cancelJob = async (params: CancelJobParams) => {
    const { jobId, userId, reason } = params;
    try {
      const cancelData = {
        status: -1,
        cancelReason: reason,
        cancelBy: "Mechanic",
      };

      const jobRef = doc(db, "jobs", jobId);
      const jobSnap = await getDoc(jobRef);
      if (jobSnap.exists()) {
        const offers = (jobSnap.data().mechanicsOffer || []) as MechanicOffer[];
        const updatedOffers = offers.map((offer) =>
          offer.mId === currentUId || offer.assignedMemberId === currentUId
            ? { ...offer, status: -1 }
            : offer
        );
        await updateDoc(
          jobRef,
          sanitizeFirestoreData({
            ...cancelData,
            mechanicsOffer: updatedOffers,
          })
        );
      }

      const cancelTargetUids = new Set<string>();
      if (userId) cancelTargetUids.add(userId);
      const cancelJobData = jobSnap.exists() ? jobSnap.data() : null;
      if (cancelJobData?.userId) cancelTargetUids.add(cancelJobData.userId);
      if (cancelJobData?.ownerId) cancelTargetUids.add(cancelJobData.ownerId);
      if (cancelJobData?.createdBy) cancelTargetUids.add(cancelJobData.createdBy);
      if (cancelJobData?.creatorId) cancelTargetUids.add(cancelJobData.creatorId);

      for (const targetUid of cancelTargetUids) {
        if (!targetUid) continue;
        const historyRef = doc(db, "Users", targetUid, "history", jobId);
        const histSnap = await getDoc(historyRef);
        if (histSnap.exists()) {
          const offers = (histSnap.data().mechanicsOffer ||
            []) as MechanicOffer[];
          const updatedOffers = offers.map((offer) =>
            offer.mId === currentUId || offer.assignedMemberId === currentUId
              ? { ...offer, status: -1 }
              : offer
          );
          await updateDoc(
            historyRef,
            sanitizeFirestoreData({
              ...cancelData,
              mechanicsOffer: updatedOffers,
            })
          );
        }
      }

      toast.success("Job cancelled successfully");
    } catch (err: any) {
      console.error("Error cancelling job:", err);
      toast.error(err.message || "Failed to cancel job");
      throw err;
    }
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
    updateJobStatus,
    cancelJob,
    submitRating,
    startJobWithDuration,
    markArrivedAtSite,
    submitInspectionAndQuote,
    markRepairFinished,
    requestEmergencyHandover,
    reassignJobMember,
  };
}
