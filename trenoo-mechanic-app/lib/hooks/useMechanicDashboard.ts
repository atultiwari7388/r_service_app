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
  const upcomingJobs = useMemo(() => {
    if (!isOnline) return [];

    // 1. Filter by status, offers, services, and distance
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

        // Service match check (if mechanic has selected_services specified)
        if (
          mechanicServices.length > 0 &&
          !mechanicServices.includes(job.selectedService)
        ) {
          return false;
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

  // Completed / Cancelled Jobs
  const historyJobs = useMemo(() => {
    if (!currentUId) {
      return allJobs.filter((job) => job.status === 5 || job.status === -1);
    }

    return allJobs.filter((job) => {
      if (job.assignedMemberId === currentUId) {
        return job.status === 5 || job.status === -1;
      }
      const myOffer = job.mechanicsOffer?.find(
        (o) => o.mId === currentUId || o.assignedMemberId === currentUId
      );
      if (!myOffer) return job.status === 5 || job.status === -1;
      return (
        myOffer.status === 5 ||
        myOffer.status === -1 ||
        job.status === 5 ||
        job.status === -1
      );
    });
  }, [allJobs, currentUId]);

  // Distinct Completed Jobs (status == 5)
  const completedJobs = useMemo(() => {
    if (!currentUId) {
      return allJobs.filter((job) => job.status === 5);
    }
    return allJobs.filter((job) => {
      const myOffer = job.mechanicsOffer?.find((o) => o.mId === currentUId);
      if (myOffer && myOffer.status === 5) return true;
      return job.status === 5;
    });
  }, [allJobs, currentUId]);

  // Distinct Cancelled Jobs (status == -1)
  const cancelledJobs = useMemo(() => {
    if (!currentUId) {
      return allJobs.filter((job) => job.status === -1);
    }
    return allJobs.filter((job) => {
      const myOffer = job.mechanicsOffer?.find((o) => o.mId === currentUId);
      if (myOffer && myOffer.status === -1) return true;
      return job.status === -1;
    });
  }, [allJobs, currentUId]);

  // Counters matching Flutter DashboardController
  const totalCompletedJobsCount = useMemo(() => {
    if (!currentUId) return 0;
    return allJobs.filter((job) => {
      const myOffer = job.mechanicsOffer?.find((o) => o.mId === currentUId);
      return myOffer && myOffer.status === 5;
    }).length;
  }, [allJobs, currentUId]);

  const ongoingJobsCount = useMemo(() => {
    return ongoingJobs.length;
  }, [ongoingJobs]);

  // Total count of all new jobs in system vs nearby
  const totalNewJobsCount = useMemo(() => {
    return allJobs.filter((j) => j.status === 0).length;
  }, [allJobs]);

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

    const offer: MechanicOffer = {
      mId: currentUId,
      mName:
        assignedMemberName ||
        mechanicProfile?.workshopName ||
        mechanicProfile?.userName ||
        "Mechanic",
      mNumber:
        assignedMemberPhone ||
        mechanicProfile?.cellPhone ||
        mechanicProfile?.telephone ||
        "",
      mDp: mechanicProfile?.profilePicture || mechanicProfile?.mDp || "",
      arrivalCharges: arrivalCharges || 0,
      perHourCharges: perHourCharges || mechanicProfile?.perHourCharge || 0,
      fixPrice: fixPrice || 0,
      time: arrivalTime || "15",
      latitude: currentLat,
      longitude: currentLng,
      status: 1, // 1 = Offered / waiting for driver acceptance
      rating: "4.8",
      reviewSubmitted: false,
      languages: mechanicProfile?.languages
        ? Object.entries(mechanicProfile.languages)
            .filter(([, v]) => v)
            .map(([k]) => k)
        : ["English"],
      mechanicAddress: currentAddress,
      offerAcceptedDate: Timestamp.now(),
      assignedMemberId,
      assignedMemberName,
      assignedMemberCity,
      assignedMemberPhone,
      isAssignedByOwner: Boolean(assignedMemberId),
    };

    try {
      const jobDocRef = doc(db, "jobs", jobId);
      const jobSnap = await getDoc(jobDocRef);
      const jobData = jobSnap.exists() ? jobSnap.data() : null;

      const jobUpdatePayload: any = {
        mechanicsOffer: arrayUnion(offer),
        ownerId: currentUId,
      };

      if (assignedMemberId) {
        jobUpdatePayload.assignedMemberId = assignedMemberId;
        jobUpdatePayload.assignedMemberName = assignedMemberName || "";
        jobUpdatePayload.assignedMemberCity = assignedMemberCity || "";
        jobUpdatePayload.assignedMemberPhone = assignedMemberPhone || "";
        jobUpdatePayload.isAssignedByOwner = true;
      }

      await updateDoc(jobDocRef, jobUpdatePayload);

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
            mechanicsOffer: arrayUnion(offer),
          });
        } else {
          await setDoc(historyRef, {
            ...(jobData || {}),
            mechanicsOffer: [offer],
            orderId: jobId,
            status: 0,
          });
        }
      }

      toast.success(
        assignedMemberName
          ? `Offer submitted and dispatched to ${assignedMemberName}!`
          : "Offer submitted to driver successfully!"
      );
    } catch (err: any) {
      console.error("Error submitting offer:", err);
      toast.error(err.message || "Failed to submit offer");
      throw err;
    }
  };

  // Start Job with Estimated Duration (Scenario 1 & 2)
  const startJobWithDuration = async (
    jobId: string,
    userId: string,
    estimatedMinutes: number
  ) => {
    try {
      const now = Timestamp.now();
      const jobDocRef = doc(db, "jobs", jobId);
      const jobSnap = await getDoc(jobDocRef);
      const jobData = jobSnap.exists() ? jobSnap.data() : null;

      const offers = (jobData?.mechanicsOffer || []) as MechanicOffer[];
      const updatedOffers = offers.map((offer) => {
        if (offer.mId === currentUId || offer.assignedMemberId === currentUId) {
          return { ...offer, status: 4 };
        }
        return offer;
      });

      await updateDoc(jobDocRef, {
        status: 4,
        mechanicsOffer: updatedOffers,
        estimatedRepairMinutes: estimatedMinutes,
        activeJobStartedAt: now,
      });

      // Update the technician's profile with active job & progress timer
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

      toast.success(`Job started! Estimated repair timer set to ${estimatedMinutes} mins.`);
    } catch (err: any) {
      console.error("Error starting job with duration:", err);
      toast.error(err.message || "Failed to start repair job");
      throw err;
    }
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
          if (offer.mId === currentUId) {
            return { ...offer, status: newStatus };
          }
          return offer;
        });

        await updateDoc(jobDocRef, {
          status: newStatus,
          mechanicsOffer: updatedOffers,
        });
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
            if (offer.mId === currentUId) {
              return { ...offer, status: newStatus };
            }
            return offer;
          });
          await updateDoc(historyRef, {
            status: newStatus,
            mechanicsOffer: updatedOffers,
          });
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
          offer.mId === currentUId ? { ...offer, status: -1 } : offer
        );
        await updateDoc(jobRef, {
          ...cancelData,
          mechanicsOffer: updatedOffers,
        });
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
            offer.mId === currentUId ? { ...offer, status: -1 } : offer
          );
          await updateDoc(historyRef, {
            ...cancelData,
            mechanicsOffer: updatedOffers,
          });
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
    requestEmergencyHandover,
    reassignJobMember,
  };
}
