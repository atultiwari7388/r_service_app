/* eslint-disable @next/next/no-img-element */
"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { HistoryItem } from "@/types/types";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { HashLoader } from "react-spinners";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import RequestAcceptHistoryCard from "@/components/RequestAcceptHistoryCard";

export default function JobIdDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth() || { user: null };
  const [loading, setLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState<HistoryItem | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("");
  const [effectiveUserId, setEffectiveUserId] = useState(""); // Add effectiveUserId state
  const [userRole, setUserRole] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { id } = use(params);

  // Handle Stripe return redirect (success or cancellation)
  const paymentSuccess = searchParams.get("payment_success");
  const sessionId = searchParams.get("session_id");
  const queryMechanicId = searchParams.get("mechanicId");
  const paymentCancelled = searchParams.get("payment_cancelled");

  useEffect(() => {
    if (paymentCancelled) {
      toast.error("Online payment was cancelled.");
      router.replace(`/my-jobs/${id}`);
      return;
    }

    if (paymentSuccess === "true" && sessionId && effectiveUserId) {
      let isSubscribed = true;

      const verifyPayment = async () => {
        try {
          const toastId = toast.loading(
            "Verifying online payment with Stripe..."
          );
          const res = await fetch("/api/stripe/verify-job-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              jobId: id,
              effectiveUserId,
              mechanicId: queryMechanicId,
            }),
          });
          const data = await res.json();
          toast.dismiss(toastId);

          if (res.ok && data.success) {
            // Apply authenticated client-side Firestore update (matching cash flow permissions)
            try {
              const jobDocId = id.startsWith("#") ? id : `#${id}`;
              const userHistoryRef = doc(
                db,
                "Users",
                effectiveUserId,
                "history",
                jobDocId
              );
              const jobRef = doc(db, "jobs", jobDocId);

              const currentHistorySnap = await getDoc(userHistoryRef);
              const historyData = currentHistorySnap.exists()
                ? currentHistorySnap.data()
                : null;
              const currentOffers: any[] =
                historyData?.mechanicsOffer || jobDetails?.mechanicsOffer || [];

              const targetMId = queryMechanicId || data.targetMechanicId;
              const updatedMechanicsOffer = currentOffers.map((offer: any) => ({
                ...offer,
                isPaid: true,
                paidAmount: data.amount,
                status: offer.status < 4 ? 4 : offer.status,
              }));

              const clientUpdates = {
                payMode: "online",
                isPaid: true,
                paidAmount: data.amount,
                paidCurrency: data.currency || "USD",
                stripeSessionId: sessionId,
                paidAt: data.paidAt || new Date().toISOString(),
                mechanicsOffer: updatedMechanicsOffer,
              };

              await updateDoc(userHistoryRef, clientUpdates);
              try {
                await updateDoc(jobRef, clientUpdates);
              } catch (jobDocErr) {
                console.warn("Global jobDoc update handled:", jobDocErr);
              }

              // Update local state immediately
              setJobDetails((prev: any) => ({
                ...prev,
                ...clientUpdates,
              }));
            } catch (fsErr) {
              console.error("Client Firestore update error:", fsErr);
            }

            toast.success(
              `Online payment of $${Number(data.amount || 0).toFixed(
                2
              )} completed! Mechanic has been notified.`
            );
          } else {
            toast.error(data.error || "Could not verify payment session.");
          }
        } catch (e: any) {
          console.error("Error verifying payment on return:", e);
          toast.error("Failed to verify payment with server.");
        } finally {
          if (isSubscribed) {
            router.replace(`/my-jobs/${id}`);
          }
        }
      };

      verifyPayment();

      return () => {
        isSubscribed = false;
      };
    }
  }, [
    paymentSuccess,
    sessionId,
    paymentCancelled,
    effectiveUserId,
    id,
    queryMechanicId,
    router,
  ]);

  // Fetch user data and determine effectiveUserId
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || "");

          // Determine effectiveUserId based on role
          if (userData.role === "SubOwner" && userData.createdBy) {
            setEffectiveUserId(userData.createdBy);
            console.log(
              "SubOwner detected, using effectiveUserId:",
              userData.createdBy
            );
          } else {
            setEffectiveUserId(user.uid);
            console.log("Regular user, using own uid:", user.uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  useEffect(() => {
    if (!effectiveUserId) return;

    const jobRef = doc(db, "Users", effectiveUserId, "history", `#${id}`);

    const unsubscribe = onSnapshot(jobRef, (jobSnap) => {
      if (jobSnap.exists()) {
        setJobDetails(jobSnap.data() as HistoryItem);
      } else {
        console.log("No such job!");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [effectiveUserId, id]);

  const handleAcceptOffer = async (mechanicId: string) => {
    if (!jobDetails || !effectiveUserId) return;

    const confirmAccept = window.confirm(
      "Are you sure you want to accept this offer?"
    );
    if (!confirmAccept) return;

    try {
      const selectedOffer = jobDetails.mechanicsOffer?.find(
        (offer) => offer.mId === mechanicId
      );

      const updates: any = {
        status: 2,
        mechanicsOffer: jobDetails.mechanicsOffer.map((offer) => ({
          ...offer,
          status: offer.mId === mechanicId ? 2 : offer.status,
        })),
      };

      if (selectedOffer?.assignedMemberId) {
        updates.assignedMemberId = selectedOffer.assignedMemberId;
        updates.assignedMemberName = selectedOffer.assignedMemberName || "";
        updates.assignedMemberPhone = selectedOffer.assignedMemberPhone || "";
        updates.assignedMemberCity = selectedOffer.assignedMemberCity || "";
        updates.isAssignedByOwner = true;
      }

      const jobDocId = id.startsWith("#") ? id : `#${id}`;
      const rawJobId = id.replace(/^#/, "");

      // Update user history document
      const userHistoryRef = doc(
        db,
        "Users",
        effectiveUserId,
        "history",
        jobDocId
      );
      await updateDoc(userHistoryRef, updates);

      // Update jobs document (support both #id and bare id)
      try {
        const jobRef = doc(db, "jobs", jobDocId);
        await updateDoc(jobRef, updates);
      } catch (jobErr) {
        try {
          const rawJobRef = doc(db, "jobs", rawJobId);
          await updateDoc(rawJobRef, updates);
        } catch (rawErr) {
          console.warn("Could not update bare jobs doc:", rawErr);
        }
      }

      // Refresh job details
      const updatedJobSnap = await getDoc(userHistoryRef);
      if (updatedJobSnap.exists()) {
        setJobDetails(updatedJobSnap.data() as HistoryItem);
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
    }
  };

  const handlePayment = async (mechanicId: string) => {
    if (!jobDetails || !effectiveUserId) return;

    const acceptedMech = jobDetails.mechanicsOffer?.find(
      (m) => m.mId === mechanicId
    );

    // Prioritize final diagnosed amount from on-site inspection
    const amount =
      Number(jobDetails.finalDiagnosedAmount) ||
      Number(acceptedMech?.finalDiagnosedAmount) ||
      (jobDetails.fixPriceEnabled
        ? Number(acceptedMech?.fixPrice || 0)
        : parseFloat(
            String(acceptedMech?.arrivalCharges || "0").replace(
              /[^0-9.]/g,
              ""
            ) || "0"
          ));

    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid payment amount for this work order.");
      return;
    }

    // 1. Online Stripe Payment Flow
    if (selectedPaymentMode === "online") {
      try {
        setIsProcessingPayment(true);
        const res = await fetch("/api/stripe/job-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: id,
            effectiveUserId,
            mechanicId,
            mechanicName:
              acceptedMech?.workshopName ||
              acceptedMech?.mName ||
              "Assigned Mechanic",
            serviceName: jobDetails.selectedService || "Roadside Service",
            amount,
            currency: "USD",
            userEmail: user?.email || "",
            originUrl:
              typeof window !== "undefined"
                ? window.location.origin
                : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Failed to initialize Stripe checkout");
        }

        // Redirect to Stripe Checkout page
        window.location.href = data.url;
      } catch (err: any) {
        console.error("Online payment error:", err);
        toast.error(err?.message || "Failed to start Stripe checkout.");
        setIsProcessingPayment(false);
      }
      return;
    }

    // 2. Cash Payment Flow
    try {
      setIsProcessingPayment(true);
      const updates = {
        payMode: "cash",
        isPaid: true,
        paidAmount: amount,
        paidAt: new Date().toISOString(),
        mechanicsOffer: jobDetails.mechanicsOffer.map((offer) => ({
          ...offer,
          isPaid: true,
          paidAmount: amount,
        })),
      };

      const userHistoryRef = doc(
        db,
        "Users",
        effectiveUserId,
        "history",
        `#${id}`
      );
      const jobRef = doc(db, "jobs", `#${id}`);

      await updateDoc(userHistoryRef, updates);
      try {
        await updateDoc(jobRef, updates);
      } catch (e) {
        console.warn("Global jobDoc update handled:", e);
      }

      const updatedJobSnap = await getDoc(userHistoryRef);
      if (updatedJobSnap.exists()) {
        setJobDetails(updatedJobSnap.data() as HistoryItem);
      }
      toast.success(
        `Cash payment of $${amount.toFixed(2)} confirmed! Mechanic has been notified to execute repairs.`
      );
    } catch (error) {
      console.error("Error processing cash payment:", error);
      toast.error("Failed to update payment status.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCustomerSignOff = async (mechanicId: string) => {
    if (!jobDetails || !effectiveUserId) return;

    const confirmSignOff = window.confirm(
      "Vehicle Repair Quality Sign-Off & Acceptance:\n\nHas the technician successfully completed all requested repairs to your satisfaction and is the vehicle roadworthy?"
    );
    if (!confirmSignOff) return;

    try {
      const now = new Date();
      const updates = {
        status: 5,
        customerSignOff: true,
        customerSignOffAt: now,
        mechanicsOffer: (jobDetails.mechanicsOffer || []).map((offer: any) => ({
          ...offer,
          status:
            offer.mId === mechanicId || offer.assignedMemberId === mechanicId
              ? 5
              : offer.status,
          customerSignOff: true,
          customerSignOffAt: now,
        })),
      };

      const userHistoryRef = doc(
        db,
        "Users",
        effectiveUserId,
        "history",
        `#${id}`
      );
      const jobRef = doc(db, "jobs", `#${id}`);

      await updateDoc(userHistoryRef, updates);
      try {
        await updateDoc(jobRef, updates);
      } catch (jobDocErr) {
        console.warn("Global jobDoc update handled:", jobDocErr);
      }

      setJobDetails((prev: any) => ({
        ...prev,
        ...updates,
      }));

      toast.success(
        "Commercial vehicle repair approved and signed off! Job is officially completed."
      );
    } catch (err: any) {
      console.error("Error signing off work order:", err);
      toast.error("Failed to complete vehicle quality sign-off.");
    }
  };

  const handleStartJob = async (mechanicId: string) => {
    if (!jobDetails || !effectiveUserId) return;

    try {
      const updates = {
        status: 4,
        mechanicsOffer: jobDetails.mechanicsOffer.map((offer) => ({
          ...offer,
          status: offer.mId === mechanicId ? 4 : offer.status,
        })),
      };

      const userHistoryRef = doc(
        db,
        "Users",
        effectiveUserId,
        "history",
        `#${id}`
      );
      const jobRef = doc(db, "jobs", `#${id}`);

      await updateDoc(userHistoryRef, updates);
      try {
        await updateDoc(jobRef, updates);
      } catch (e) {
        console.warn("Global jobDoc update handled:", e);
      }

      const updatedJobSnap = await getDoc(userHistoryRef);
      if (updatedJobSnap.exists()) {
        setJobDetails(updatedJobSnap.data() as HistoryItem);
      }
    } catch (error) {
      console.error("Error starting job:", error);
    }
  };

  if (!user) {
    return <div>Please login to view job details</div>;
  }

  if (!effectiveUserId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  if (!jobDetails) {
    return <div>Job not found</div>;
  }

  // Find if any mechanic has been accepted (status 2 or higher)
  const acceptedMechanic = jobDetails.mechanicsOffer?.find(
    (mechanic) => mechanic.status >= 2
  );

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      {/* Job Details Section */}
      {userRole === "SubOwner" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            Viewing job as Co-Owner (Owner&apos;s data)
          </p>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center mb-2 gap-2">
          {/** Top Section */}
          <div className="flex gap-4">
            <span className="bg-pink-100 text-pink-600 px-4 py-2 rounded-lg font-semibold">
              {jobDetails.orderId}
            </span>
            <span className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-semibold">
              {jobDetails.orderDate.toDate().toLocaleDateString()}
            </span>
          </div>
          <span
            className={`px-6 py-2 rounded-lg font-semibold ${
              jobDetails.status === 5
                ? "bg-green-100 text-green-600"
                : jobDetails.status === -1
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-600"
            }`}
          >
            {jobDetails.status === 5
              ? "Completed"
              : jobDetails.status === -1
              ? "Cancelled"
              : "In Progress"}
          </span>
        </div>

        {/** Image sectiion and vehicle details section */}

        <div className="flex gap-8">
          {/** Vehicle Details Section */}
          <div className="">
            <p className="text-gray-600 text-lg font-bold">
              Vehicle: {jobDetails.companyName} ({jobDetails.vehicleNumber})
            </p>
            <div className="grid grid-cols-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-black">
                  Service :{" "}
                  <span className="font-semibold">
                    {jobDetails.selectedService}
                  </span>
                </p>

                {jobDetails.description.length > 0 ? (
                  <p className="text-black ">
                    Description :{" "}
                    <span className="font-semibold">
                      {jobDetails.description}
                    </span>
                  </p>
                ) : null}

                <p className="text-black ">
                  Location :{" "}
                  <span className="font-semibold">
                    {jobDetails.userDeliveryAddress}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {jobDetails.images && jobDetails.images.length > 0 && (
            <div className="">
              <div className="grid grid-cols-3 gap-6">
                {jobDetails.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Job image ${index + 1}`}
                    height={100}
                    width={100}
                    className="rounded-xl hover:opacity-90 transition-opacity duration-300 shadow-md"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mechanics Offers Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Mechanic Offers
        </h2>
        {!jobDetails.mechanicsOffer ||
        jobDetails.mechanicsOffer.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 text-lg">No Mechanic Offers Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobDetails.mechanicsOffer
              .filter(
                (mechanic) =>
                  // Show all offers if no mechanic is accepted yet
                  // Otherwise only show the accepted mechanic
                  !acceptedMechanic || mechanic.mId === acceptedMechanic.mId
              )
              .map((mechanic, index) => (
                <div
                  key={index}
                  className="transform hover:scale-[1.02] transition-transform duration-300"
                >
                  <RequestAcceptHistoryCard
                    mechanic={mechanic}
                    jobDetails={jobDetails}
                    onAcceptOffer={() => handleAcceptOffer(mechanic.mId)}
                    onPayment={() => handlePayment(mechanic.mId)}
                    onCustomerSignOff={() => handleCustomerSignOff(mechanic.mId)}
                    onStartJob={() => handleStartJob(mechanic.mId)}
                    selectedPaymentMode={selectedPaymentMode}
                    setSelectedPaymentMode={setSelectedPaymentMode}
                    isProcessingPayment={isProcessingPayment}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
