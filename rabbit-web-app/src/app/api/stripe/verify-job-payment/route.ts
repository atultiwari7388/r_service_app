import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAcceptedOffer, type WorkflowJob } from "@/lib/jobWorkflow";

export async function POST(req: Request) {
  try {
    const { sessionId, jobId, effectiveUserId, mechanicId } = await req.json();

    if (!sessionId || !jobId) {
      return NextResponse.json(
        { error: "sessionId and jobId are required" },
        { status: 400 }
      );
    }

    // 1. Verify payment status directly with Stripe API
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json(
        { error: "Payment not completed yet", status: session.status },
        { status: 400 }
      );
    }

    const rawJobId = jobId.replace(/^#/, "");
    const jobDocId = jobId.startsWith("#") ? jobId : `#${jobId}`;
    const targetUserId =
      effectiveUserId ||
      session.metadata?.effectiveUserId ||
      session.client_reference_id;
    const targetMechanicId = mechanicId || session.metadata?.mechanicId;
    const amount = (session.amount_total || 0) / 100;
    const currency = (session.currency || "usd").toUpperCase();

    // 2. Best-effort server write (won't fail verification if client handles permissions)
    try {
      const jobRef = doc(db, "jobs", jobDocId);
      const jobSnap = await getDoc(jobRef);
      if (jobSnap.exists()) {
        const jobData = jobSnap.data() as WorkflowJob & Record<string, any>;
        // Payment never changes `status` (stays 4 = work order); it only flips
        // isPaid so the technician can start the repair. Idempotent.
        if (!jobData.isPaid) {
          const accepted = getAcceptedOffer(jobData);
          const updatedMechanicsOffer = (jobData.mechanicsOffer || []).map((offer) =>
            offer === accepted
              ? { ...offer, isPaid: true, paidAmount: amount, assignmentStatus: "repairing" }
              : offer
          );

          await updateDoc(jobRef, {
            payMode: "online",
            isPaid: true,
            paidAmount: amount,
            paidCurrency: currency,
            stripeSessionId: session.id,
            paidAt: new Date().toISOString(),
            assignmentStatus: "repairing",
            activeJobStartedAt: new Date(),
            mechanicsOffer: updatedMechanicsOffer,
          });
        }
      }
    } catch (serverErr) {
      console.warn("Server Firestore sync warning (client will finalize):", serverErr);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      jobId: rawJobId,
      jobDocId,
      targetUserId,
      targetMechanicId,
      status: 4,
      payMode: "online",
      isPaid: true,
      amount,
      currency,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null,
      paidAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Error verifying job payment:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to verify job payment" },
      { status: 500 }
    );
  }
}
