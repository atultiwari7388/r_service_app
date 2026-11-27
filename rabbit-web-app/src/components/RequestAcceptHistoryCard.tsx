/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateDistance } from "@/utils/calculateLatLng";
import { HistoryItem, MechanicsOffer } from "@/types/types";
import Link from "next/link";
import {
  CreditCard,
  Banknote,
  CheckCircle,
  Clock,
  Wrench,
  ShieldCheck,
  XCircle,
  Star,
} from "lucide-react";
import { JOB_STATUS, getJobPhase } from "@/lib/jobWorkflow";
import { AppliedCommission, describeCommission, roundMoney } from "@/lib/commission";

interface RequestAcceptHistoryCardProps {
  mechanic: MechanicsOffer;
  jobDetails: HistoryItem;
  onAcceptOffer: () => void;
  onPayment: () => void;
  onCustomerSignOff?: () => void | Promise<void>;
  /** True for the offer the customer accepted (drives all post-dispatch phases) */
  isAcceptedOffer?: boolean;
  /** Plan-based service fee preview (before payment); null when not applicable */
  serviceFeePreview?: AppliedCommission | null;
  selectedPaymentMode: string;
  setSelectedPaymentMode: (mode: string) => void;
  isProcessingPayment?: boolean;
}

export default function RequestAcceptHistoryCard({
  mechanic,
  jobDetails,
  onAcceptOffer,
  onPayment,
  onCustomerSignOff,
  isAcceptedOffer = false,
  serviceFeePreview = null,
  selectedPaymentMode,
  setSelectedPaymentMode,
  isProcessingPayment = false,
}: RequestAcceptHistoryCardProps) {
  const [workshopName, setWorkshopName] = useState<string>(
    mechanic.workshopName || ""
  );
  const [isSigningOff, setIsSigningOff] = useState(false);

  // Lifecycle phase only applies to the accepted work order
  const phase = isAcceptedOffer ? getJobPhase(jobDetails) : "open";
  const finalAmount = Number(jobDetails.finalDiagnosedAmount) || 0;
  // After payment the fee locked on the job is authoritative; before, the live preview
  const feeRule = jobDetails.isPaid
    ? jobDetails.customerServiceFeeRule ?? null
    : serviceFeePreview;
  const serviceFee = jobDetails.isPaid
    ? Number(jobDetails.customerServiceFee) || 0
    : serviceFeePreview?.amount || 0;
  const totalDue = roundMoney(finalAmount + serviceFee);
  const technicianName =
    jobDetails.assignedMemberName || mechanic.assignedMemberName || "";

  useEffect(() => {
    if (!mechanic.mId) return;

    const fetchMechanicDetails = async () => {
      try {
        const mechanicDoc = await getDoc(doc(db, "Mechanics", mechanic.mId));
        if (mechanicDoc.exists()) {
          const data = mechanicDoc.data();
          const wName = (data?.workshopName ?? "").toString().trim();
          if (wName) {
            setWorkshopName(wName);
          }
        }
      } catch (error) {
        console.error("Error fetching mechanic workshop details:", error);
      }
    };

    fetchMechanicDetails();
  }, [mechanic.mId]);

  const distance = calculateDistance(
    jobDetails.userLat,
    jobDetails.userLong,
    mechanic.latitude,
    mechanic.longitude
  );

  // Show workshopName if present, otherwise fallback to mName
  const displayName =
    workshopName && workshopName.trim().length > 0
      ? workshopName
      : mechanic.mName;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-6">
        <div className="relative">
          <img
            src={mechanic.mDp || "/profile.png"}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover border-4 border-pink-100"
          />
          <div className="absolute -bottom-2 -right-2 bg-green-500 p-1 rounded-full">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-xl text-gray-800">{displayName}</h3>

          <div className="flex flex-wrap gap-3 mt-2">
            <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
              <i className="fas fa-clock mr-1"></i>
              {mechanic.time} mins
            </span>
            <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
              <i className="fas fa-map-marker-alt mr-1"></i>
              {distance} miles
            </span>
            <span className="bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {mechanic.rating}
            </span>
            {mechanic.languages.map((lang, i) => (
              <span
                key={i}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-6 pt-2">
        <div className="flex-1">
          {/* Quote (before inspection) or Authorized Final Work Order (after) */}
          <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200/80">
            {isAcceptedOffer && finalAmount > 0 ? (
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                  Authorized Final Work Order
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
                    <Wrench size={15} className="text-[#58BB87]" />
                    Verified Amount (parts + labor):
                  </span>
                  <span className="text-2xl font-black text-[#58BB87]">
                    ${finalAmount.toFixed(2)}
                  </span>
                </div>
                {serviceFee > 0 && (
                  <>
                    <div className="flex justify-between items-center text-xs text-gray-700">
                      <span className="font-semibold">
                        Platform service fee ({describeCommission(feeRule)}
                        {feeRule?.planName ? ` · ${feeRule.planName}` : ""})
                      </span>
                      <span className="font-bold">+${serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-200 pt-1.5">
                      <span className="font-extrabold text-sm text-gray-900">
                        {jobDetails.isPaid ? "Total Paid" : "Total Due"}
                      </span>
                      <span className="text-lg font-black text-gray-900">
                        ${totalDue.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                {jobDetails.estimatedRepairMinutes ? (
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span className="font-semibold">Estimated repair time:</span>
                    <span className="font-bold">{jobDetails.estimatedRepairMinutes} min</span>
                  </div>
                ) : null}
                {jobDetails.inspectionNotes && (
                  <div className="pt-2 border-t border-gray-200 text-xs text-gray-700 bg-white/70 p-2.5 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-900 block mb-0.5">
                      Diagnostic Findings:
                    </span>
                    <span>{jobDetails.inspectionNotes}</span>
                  </div>
                )}
              </div>
            ) : jobDetails.fixPriceEnabled ? (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Estimated Flat Price</span>
                <span className="text-xl font-bold text-green-600">
                  ${mechanic.fixPrice}
                </span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">
                    Estimated Arrival Charges
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ${mechanic.arrivalCharges}
                  </span>
                </div>
                <div className="border-t border-gray-200 my-2.5" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">
                    Estimated Labor Rate
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ${mechanic.perHourCharges}/hr
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-gray-500">
                  Final amount is verified on site after inspection. No payment is taken before then.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action panel driven by the job state machine */}
        <div className="mt-4 flex flex-col justify-center items-end min-w-[260px]">
          {/* Phase 1: quote received */}
          {!isAcceptedOffer &&
            jobDetails.status === JOB_STATUS.OPEN &&
            mechanic.status === JOB_STATUS.QUOTED && (
              <button
                onClick={onAcceptOffer}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              >
                Accept Offer & Dispatch
              </button>
            )}

          {/* Phase 2: dispatched, en route (NO payment yet) */}
          {phase === "en_route" && (
            <div className="flex flex-col items-end gap-1.5 text-right bg-blue-50/80 border border-blue-200/80 p-3.5 rounded-2xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                Technician Dispatched • En Route
              </span>
              <p className="text-xs text-blue-900 font-semibold max-w-xs">
                {`Technician ${technicianName || displayName} is on the way to your breakdown location. Payment unlocks after the on-site inspection.`}
              </p>
            </div>
          )}

          {/* Phase 3: on site, diagnosing */}
          {phase === "on_site_inspecting" && (
            <div className="flex flex-col items-end gap-1.5 text-right bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-black shadow-xs">
                <Clock size={13} className="text-white" />
                Technician On-Site: Diagnosing Vehicle
              </span>
              <p className="text-xs text-amber-900 font-semibold max-w-xs">
                {technicianName || displayName} is inspecting your vehicle. The verified final work order will appear here shortly.
              </p>
            </div>
          )}

          {/* Phase 4: verified work order → payment */}
          {phase === "awaiting_payment" && finalAmount > 0 && (
            <div className="space-y-3 w-full max-w-xs bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
              <div className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                Authorize & Pay Final Work Order
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMode("cash")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedPaymentMode === "cash"
                      ? "bg-[#58BB87] text-white shadow-md shadow-[#58BB87]/20"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                  }`}
                >
                  <Banknote size={14} />
                  <span>Cash (COD)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMode("online")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedPaymentMode === "online"
                      ? "bg-[#F96176] text-white shadow-md shadow-[#F96176]/20"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                  }`}
                >
                  <CreditCard size={14} />
                  <span>Online (Stripe)</span>
                </button>
              </div>

              {selectedPaymentMode && (
                <button
                  type="button"
                  onClick={onPayment}
                  disabled={isProcessingPayment}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    selectedPaymentMode === "online"
                      ? "bg-[#F96176] hover:bg-[#e04f63] shadow-[#F96176]/25"
                      : "bg-[#58BB87] hover:bg-[#4ca877] shadow-[#58BB87]/25"
                  } disabled:opacity-50`}
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : selectedPaymentMode === "online" ? (
                    <>
                      <CreditCard size={14} />
                      <span>Pay Online ${totalDue.toFixed(2)} (Stripe)</span>
                    </>
                  ) : (
                    <>
                      <Banknote size={14} />
                      <span>Confirm Cash ${totalDue.toFixed(2)}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Phase 5: paid, repair in progress */}
          {phase === "repairing" && (
            <div className="flex flex-col items-end gap-1.5 text-right bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white border border-emerald-200 px-3 py-1 rounded-full shadow-xs">
                <CheckCircle size={13} className="text-emerald-600" />
                <span>
                  Paid ${Number(jobDetails.paidAmount || totalDue).toFixed(2)} (
                  {(jobDetails.payMode || "paid").toUpperCase()})
                </span>
              </span>
              <p className="text-xs text-emerald-900 font-medium">
                Repair in progress. You will be asked to sign off once the technician finishes.
              </p>
            </div>
          )}

          {/* Phase 6: quality sign-off */}
          {phase === "awaiting_signoff" && (
            <div className="w-full max-w-sm bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 p-4 rounded-2xl shadow-lg flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                <span>Vehicle Repair Quality Sign-Off & Release</span>
              </div>
              <p className="text-xs text-emerald-900 font-medium">
                Has the technician successfully completed all requested repairs to
                your satisfaction and is the vehicle roadworthy?
              </p>
              <button
                type="button"
                disabled={isSigningOff}
                onClick={async () => {
                  setIsSigningOff(true);
                  try {
                    await onCustomerSignOff?.();
                  } finally {
                    setIsSigningOff(false);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle size={15} />
                <span>{isSigningOff ? "Signing off..." : "Yes, Approve & Sign Off Work Order"}</span>
              </button>
            </div>
          )}

          {/* Completed: both parties can now rate each other */}
          {phase === "completed" && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-sm bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl">
                <CheckCircle size={18} className="text-emerald-600" />
                <span>Job Completed & Signed Off</span>
              </div>
              <Link
                href="/history"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-100"
              >
                <Star size={13} />
                <span>{jobDetails.reviewSubmitted ? "Edit Your Review" : "Rate the Technician"}</span>
              </Link>
            </div>
          )}

          {phase === "cancelled" && (
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-2xl">
              <XCircle size={18} />
              <span>
                Cancelled{jobDetails.cancelReason ? `: ${jobDetails.cancelReason}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
