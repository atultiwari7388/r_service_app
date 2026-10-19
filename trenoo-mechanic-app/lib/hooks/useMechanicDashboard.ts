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
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [currentAddress, setCurrentAddress] = useState<string>(
    "Loading terminal location..."
  );
  const [currentLat, setCurrentLat] = useState<number>(0);
  const [currentLng, setCurrentLng] = useState<number>(0);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOnline(mechanicProfile.active);
      }
      if (mechanicProfile.address) {
        setCurrentAddress(mechanicProfile.address);
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

  // Request browser geolocation ONLY if mechanic profile does not have saved coordinates,
  // or when explicitly triggered by the user via refreshLocation()
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
        let resolvedAddress =
          mechanicProfile?.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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
          // fallback to lat/lng or profile address
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
        if (mechanicProfile?.address) {
          setCurrentAddress(mechanicProfile.address);
        } else {
          setCurrentAddress("Depot Terminal (Location access disabled)");
        }
        setIsUpdatingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [currentUId, mechanicProfile?.address]);

  // If mechanic does not have coordinates saved yet, initialize location
  useEffect(() => {
    if (
      !mechanicProfile?.location?.latitude &&
      !mechanicProfile?.location?.longitude
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshLocation();
    }
  }, [
    mechanicProfile?.location?.latitude,
    mechanicProfile?.location?.longitude,
    refreshLocation,
  ]);

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
    setIsOnline(newVal);
    if (!currentUId) return;
    try {
      await updateDoc(doc(db, "Mechanics", currentUId), {
        active: newVal,
      });
      toast.success(
        newVal ? "You are now ONLINE & accepting jobs" : "You are now OFFLINE"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update online status");
      setIsOnline(!newVal); // revert
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
    const filtered = allJobs
      .filter((job) => {
        // Status must be 0 (new)
        if (job.status !== 0) return false;

        // Check if current mechanic already made an offer with status == 1 (accepted/interested)
        if (currentUId && job.mechanicsOffer && job.mechanicsOffer.length > 0) {
          const myOffer = job.mechanicsOffer.find((o) => o.mId === currentUId);
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
  const ongoingJobs = useMemo(() => {
    if (!currentUId) return [];

    return allJobs
      .filter((job) => {
        if (job.status === 5 || job.status === -1) return false;
        const myOffer = job.mechanicsOffer?.find((o) => o.mId === currentUId);
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
    if (!currentUId) return [];

    return allJobs.filter((job) => {
      const myOffer = job.mechanicsOffer?.find((o) => o.mId === currentUId);
      if (!myOffer) return false;
      return (
        myOffer.status === 5 ||
        myOffer.status === -1 ||
        job.status === 5 ||
        job.status === -1
      );
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
    } = params;

    const offer: MechanicOffer = {
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
    };

    try {
      const jobDocRef = doc(db, "jobs", jobId);
      await updateDoc(jobDocRef, {
        mechanicsOffer: arrayUnion(offer),
      });

      if (userId) {
        const historyRef = doc(db, "Users", userId, "history", jobId);
        const historySnap = await getDoc(historyRef);
        if (historySnap.exists()) {
          await updateDoc(historyRef, {
            mechanicsOffer: arrayUnion(offer),
          });
        } else {
          await setDoc(historyRef, {
            mechanicsOffer: [offer],
            orderId: jobId,
            status: 0,
          });
        }
      }

      toast.success("Offer submitted to driver successfully!");
    } catch (err: any) {
      console.error("Error submitting offer:", err);
      toast.error(err.message || "Failed to submit offer");
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

      if (userId) {
        const historyRef = doc(db, "Users", userId, "history", jobId);
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

      if (userId) {
        const historyRef = doc(db, "Users", userId, "history", jobId);
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
  };
}
