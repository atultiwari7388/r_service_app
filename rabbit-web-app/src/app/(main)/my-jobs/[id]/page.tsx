/* eslint-disable @next/next/no-img-element */
"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { HistoryItem, MechanicsOffer } from "@/types/types";
import {
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import {
  PlanCommissionConfig,
  resolveCommission,
  roundMoney,
} from "@/lib/commission";
import {
  loadCustomerCommissionConfig,
  recordJobSettlement,
} from "@/lib/services/commissionService";
import {
  JOB_STATUS,
  canCustomerSignOff,
  canPay,
  getAcceptedOffer,
  getCustomerPhaseLabel,
  getJobPhase,
  isDelegatedOffer,
} from "@/lib/jobWorkflow";
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
  // Customer's plan-based service fee settings (added on top of the work order)
  const [customerFeeConfig, setCustomerFeeConfig] =
    useState<PlanCommissionConfig | null>(null);

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
            // Apply authenticated client-side Firestore update.
            // Status stays 4 (work order); payment only flips isPaid → repair starts.
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
                ? (currentHistorySnap.data() as HistoryItem)
                : null;

              if (historyData && !historyData.isPaid) {
                const accepted = getAcceptedOffer(historyData);
                const updatedMechanicsOffer = (historyData.mechanicsOffer || []).map(
                  (offer) =>
                    offer === accepted
                      ? {
                          ...offer,
                          isPaid: true,
                          paidAmount: data.amount,
                          assignmentStatus: "repairing",
                        }
                      : offer
                );

                const clientUpdates = {
                  payMode: "online",
                  isPaid: true,
                  paidAmount: data.amount,
                  paidCurrency: data.currency || "USD",
                  stripeSessionId: sessionId,
                  paidAt: data.paidAt || new Date().toISOString(),
                  assignmentStatus: "repairing",
                  activeJobStartedAt: new Date(),
                  mechanicsOffer: updatedMechanicsOffer,
                };

                await updateDoc(userHistoryRef, clientUpdates);
                try {
                  await updateDoc(jobRef, clientUpdates);
                } catch (jobDocErr) {
                  console.warn("Global jobDoc update handled:", jobDocErr);
                }
              }
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
    let cancelled = false;
    loadCustomerCommissionConfig(effectiveUserId).then((cfg) => {
      if (!cancelled) setCustomerFeeConfig(cfg);
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveUserId]);

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

  // ─── Firestore helpers ──────────────────────────────────────────────────────
  const jobDocId = id.startsWith("#") ? id : `#${id}`;
  const rawJobId = id.replace(/^#/, "");

  // Authoritative state: the global jobs doc (falls back to the user's history copy)
  const loadLatestJob = async (): Promise<HistoryItem | null> => {
    for (const candidate of [jobDocId, rawJobId]) {
      try {
        const snap = await getDoc(doc(db, "jobs", candidate));
        if (snap.exists()) return snap.data() as HistoryItem;
      } catch (e) {
        console.warn(`jobs/${candidate} read skipped:`, e);
      }
    }
    if (!effectiveUserId) return null;
    const hSnap = await getDoc(doc(db, "Users", effectiveUserId, "history", jobDocId));
    return hSnap.exists() ? (hSnap.data() as HistoryItem) : null;
  };

  // Write the same update to the user's history doc and the global jobs doc
  const writeJobEverywhere = async (updates: Record<string, any>) => {
    await updateDoc(doc(db, "Users", effectiveUserId, "history", jobDocId), updates);
    let jobDocWritten = false;
    for (const candidate of [jobDocId, rawJobId]) {
      try {
        const ref = doc(db, "jobs", candidate);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, updates);
          jobDocWritten = true;
          break;
        }
      } catch (e) {
        console.warn(`jobs/${candidate} update skipped:`, e);
      }
    }
    if (!jobDocWritten) {
      console.warn("Global jobs doc not updated for", jobDocId);
    }
  };

  // Patch ONLY the accepted offer; losing bids are never touched
  const patchAcceptedOffer = (
    job: HistoryItem,
    patch: Partial<MechanicsOffer>
  ): MechanicsOffer[] => {
    const accepted = getAcceptedOffer(job);
    return (job.mechanicsOffer || []).map((o) =>
      o === accepted ? { ...o, ...patch } : o
    );
  };

  // ─── Phase 2: Accept offer & dispatch (NO payment here) ─────────────────────
  const handleAcceptOffer = async (mechanicId: string) => {
    if (!effectiveUserId) return;
    if (!window.confirm("Accept this offer and dispatch the technician?")) return;

    try {
      const latest = await loadLatestJob();
      if (!latest) throw new Error("Job not found.");
      if (getJobPhase(latest) !== "open") {
        throw new Error("An offer has already been accepted for this job.");
      }

      const selectedOffer = latest.mechanicsOffer?.find(
        (o) => o.mId === mechanicId && o.status === JOB_STATUS.QUOTED
      );
      if (!selectedOffer) {
        throw new Error("This offer is no longer available.");
      }

      const delegated = isDelegatedOffer(selectedOffer);
      const updates: Record<string, any> = {
        status: JOB_STATUS.DISPATCHED,
        assignmentStatus: "en_route",
        mechanicsOffer: (latest.mechanicsOffer || []).map((o) =>
          o === selectedOffer
            ? { ...o, status: JOB_STATUS.DISPATCHED, assignmentStatus: "en_route" }
            : o
        ),
        // Top-level dispatch fields always mirror the ACCEPTED offer, so stale
        // values written by other bidders can never leak through.
        isAssignedByOwner: delegated,
        assignedMemberId: delegated ? selectedOffer.assignedMemberId : deleteField(),
        assignedMemberName: delegated
          ? selectedOffer.assignedMemberName || ""
          : deleteField(),
        assignedMemberPhone: delegated
          ? selectedOffer.assignedMemberPhone || ""
          : deleteField(),
        assignedMemberCity: delegated
          ? selectedOffer.assignedMemberCity || ""
          : deleteField(),
      };

      await writeJobEverywhere(updates);
      toast.success("Offer accepted. Technician dispatched!");
    } catch (error: any) {
      console.error("Error accepting offer:", error);
      toast.error(error?.message || "Failed to accept offer.");
    }
  };

  // ─── Phase 4: Pay the verified final work order ─────────────────────────────
  const handlePayment = async (mechanicId: string) => {
    if (!effectiveUserId || isProcessingPayment) return;

    setIsProcessingPayment(true);
    try {
      const latest = await loadLatestJob();
      if (!latest) throw new Error("Job not found.");
      const accepted = getAcceptedOffer(latest);
      if (!accepted || accepted.mId !== mechanicId) {
        throw new Error("This offer is not the accepted work order.");
      }
      if (!canPay(latest)) {
        throw new Error(
          latest.isPaid
            ? "This work order is already paid."
            : "Payment unlocks after the technician submits the on-site inspection."
        );
      }

      // Verified work order + the customer's plan service fee (re-read fresh so
      // the charged fee always matches the plan at the moment of payment)
      const workOrderAmount = roundMoney(Number(latest.finalDiagnosedAmount));
      const feeRule = resolveCommission(
        await loadCustomerCommissionConfig(effectiveUserId),
        latest.selectedService,
        workOrderAmount
      );
      const amount = roundMoney(workOrderAmount + feeRule.amount);
      const feeLock = {
        customerServiceFee: feeRule.amount,
        customerServiceFeeRule: feeRule,
        totalAmountDue: amount,
      };

      if (selectedPaymentMode === "online") {
        // Lock the fee on the job before redirecting; the checkout route checks it
        await writeJobEverywhere(feeLock);
        const res = await fetch("/api/stripe/job-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: id,
            effectiveUserId,
            mechanicId,
            mechanicName:
              accepted.workshopName || accepted.mName || "Assigned Mechanic",
            serviceName: latest.selectedService || "Roadside Service",
            amount,
            workOrderAmount,
            serviceFee: feeRule.amount,
            currency: "USD",
            userEmail: user?.email || "",
            originUrl:
              typeof window !== "undefined" ? window.location.origin : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Failed to initialize Stripe checkout");
        }
        window.location.href = data.url;
        return; // keep spinner while redirecting
      }

      if (selectedPaymentMode !== "cash") {
        throw new Error("Select a payment method.");
      }

      const paidAt = new Date().toISOString();
      await writeJobEverywhere({
        ...feeLock,
        payMode: "cash",
        isPaid: true,
        paidAmount: amount,
        paidAt,
        assignmentStatus: "repairing",
        activeJobStartedAt: new Date(),
        mechanicsOffer: patchAcceptedOffer(latest, {
          isPaid: true,
          paidAmount: amount,
          assignmentStatus: "repairing",
        }),
      });
      toast.success(
        `Cash payment of $${amount.toFixed(2)} confirmed. The technician can start the repair.`
      );
      setIsProcessingPayment(false);
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error?.message || "Failed to process payment.");
      setIsProcessingPayment(false);
    }
  };

  // ─── Phase 6: Customer quality sign-off → completed ─────────────────────────
  const handleCustomerSignOff = async () => {
    if (!effectiveUserId) return;
    try {
      const latest = await loadLatestJob();
      if (!latest) throw new Error("Job not found.");
      if (!canCustomerSignOff(latest)) {
        throw new Error(
          "Sign-off is available once the work order is paid and the technician has marked the repair finished."
        );
      }

      const now = new Date();
      await writeJobEverywhere({
        status: JOB_STATUS.COMPLETED,
        assignmentStatus: "completed",
        customerSignOff: true,
        customerSignOffAt: now,
        mechanicsOffer: patchAcceptedOffer(latest, {
          status: JOB_STATUS.COMPLETED,
          assignmentStatus: "completed",
          customerSignOff: true,
          customerSignOffAt: now,
        }),
      });
      toast.success("Work order signed off. Job completed. You can now rate the technician.");

      // Commission ledger entry (customer fee + workshop commission for this job)
      try {
        await recordJobSettlement({
          jobId: rawJobId,
          job: { ...latest, status: JOB_STATUS.COMPLETED, payMode: latest.payMode },
          customerId: effectiveUserId,
          completedAt: now.toISOString(),
        });
      } catch (settleErr) {
        // Sign-off stands; admin can regenerate missing settlements
        console.error("Settlement record failed:", settleErr);
      }
    } catch (err: any) {
      console.error("Error signing off work order:", err);
      toast.error(err?.message || "Failed to complete vehicle quality sign-off.");
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

  // Once an offer is accepted only that work order is shown; before that,
  // every live quote (withdrawn quotes are hidden).
  const acceptedMechanic = getAcceptedOffer(jobDetails);
  const visibleOffers = (jobDetails.mechanicsOffer || []).filter((mechanic) =>
    acceptedMechanic
      ? mechanic === acceptedMechanic
      : mechanic.status === JOB_STATUS.QUOTED
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
            {getCustomerPhaseLabel(jobDetails)}
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
          {acceptedMechanic ? "Your Work Order" : "Mechanic Offers"}
        </h2>
        {visibleOffers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 text-lg">No Mechanic Offers Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleOffers.map((mechanic, index) => (
                <div
                  key={`${mechanic.mId}-${index}`}
                  className="transform hover:scale-[1.02] transition-transform duration-300"
                >
                  <RequestAcceptHistoryCard
                    mechanic={mechanic}
                    jobDetails={jobDetails}
                    isAcceptedOffer={mechanic === acceptedMechanic}
                    serviceFeePreview={
                      mechanic === acceptedMechanic &&
                      jobDetails.status === JOB_STATUS.WORK_ORDER &&
                      !jobDetails.isPaid
                        ? resolveCommission(
                            customerFeeConfig,
                            jobDetails.selectedService,
                            Number(jobDetails.finalDiagnosedAmount) || 0
                          )
                        : null
                    }
                    onAcceptOffer={() => handleAcceptOffer(mechanic.mId)}
                    onPayment={() => handlePayment(mechanic.mId)}
                    onCustomerSignOff={handleCustomerSignOff}
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
