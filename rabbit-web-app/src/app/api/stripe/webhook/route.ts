import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { recordAndActivateOwnerSubscription } from "@/lib/services/subscriptionActivation";
import { SubscriptionPlan } from "@/types/subscription";
import Stripe from "stripe";
import { getAcceptedOffer, type WorkflowJob } from "@/lib/jobWorkflow";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is missing.");
    return NextResponse.json(
      { error: "Webhook secret not configured on server" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err?.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err?.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // 1. One-Time Job Payment Fulfillment
        if (
          session.metadata?.type === "job_payment" ||
          session.metadata?.jobDocId ||
          (session.metadata?.jobId && !session.metadata?.planId)
        ) {
          const rawJobId = session.metadata?.jobId || "";
          const jobDocId =
            session.metadata?.jobDocId ||
            (rawJobId ? (rawJobId.startsWith("#") ? rawJobId : `#${rawJobId}`) : "");
          const targetUserId =
            session.metadata?.effectiveUserId || session.client_reference_id;
          const targetMechanicId = session.metadata?.mechanicId;

          if (jobDocId) {
            const jobRef = doc(db, "jobs", jobDocId);
            const jobSnap = await getDoc(jobRef);
            const jobData = jobSnap.exists()
              ? (jobSnap.data() as WorkflowJob & Record<string, any>)
              : null;

            // Idempotent: payment only flips isPaid; `status` stays 4 (work order)
            // so the job never regresses to the on-site/diagnosing phase.
            if (jobData && !jobData.isPaid) {
              const accepted = getAcceptedOffer(jobData);
              if (accepted && targetMechanicId && accepted.mId !== targetMechanicId) {
                console.warn(
                  `Webhook: paid mechanic ${targetMechanicId} differs from accepted offer ${accepted.mId} on ${jobDocId}`
                );
              }
              const paidAmount = (session.amount_total || 0) / 100;
              const updatedMechanicsOffer = (jobData.mechanicsOffer || []).map((offer) =>
                offer === accepted
                  ? { ...offer, isPaid: true, paidAmount, assignmentStatus: "repairing" }
                  : offer
              );

              const updates: Record<string, any> = {
                payMode: "online",
                isPaid: true,
                paidAmount: (session.amount_total || 0) / 100,
                paidCurrency: (session.currency || "usd").toUpperCase(),
                stripeSessionId: session.id,
                stripePaymentIntentId:
                  typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : session.payment_intent?.id || null,
                paidAt: new Date().toISOString(),
                assignmentStatus: "repairing",
                activeJobStartedAt: new Date(),
                mechanicsOffer: updatedMechanicsOffer,
              };

              await updateDoc(jobRef, updates);

              if (targetUserId) {
                const userHistoryRef = doc(
                  db,
                  "Users",
                  targetUserId,
                  "history",
                  jobDocId
                );
                const userHistorySnap = await getDoc(userHistoryRef);
                if (userHistorySnap.exists()) {
                  await updateDoc(userHistoryRef, updates);
                }
              }

              // Secondary sync for owner / driver if applicable
              const otherIds = Array.from(
                new Set([jobData.ownerId, jobData.userId, jobData.createdBy])
              ).filter((uid) => uid && uid !== targetUserId);

              for (const otherId of otherIds) {
                try {
                  const otherRef = doc(
                    db,
                    "Users",
                    otherId as string,
                    "history",
                    jobDocId
                  );
                  const otherSnap = await getDoc(otherRef);
                  if (otherSnap.exists()) {
                    await updateDoc(otherRef, updates);
                  }
                } catch (e) {
                  console.warn(`Webhook sync error for ${otherId}:`, e);
                }
              }
            }
          }
          break;
        }

        // 2. Subscription Membership Plan Fulfillment
        const ownerUid =
          session.metadata?.ownerUid || session.client_reference_id;
        const planId = session.metadata?.planId;
        const userEmail = session.customer_details?.email || session.metadata?.userEmail;
        const vehicleRange = session.metadata?.vehicleRange || "1 to 5";
        const trucksCount = parseInt(session.metadata?.trucksCount || "0", 10);
        const trailersCount = parseInt(session.metadata?.trailersCount || "0", 10);
        const amountPaid = parseFloat(session.metadata?.amountPaid || String((session.amount_total || 0) / 100));

        if (ownerUid && planId) {
          // Fetch plan details from Firestore
          const planSnap = await getDoc(doc(db, "subscriptionPlans", planId));
          if (planSnap.exists()) {
            const planData = planSnap.data();
            const plan: SubscriptionPlan = {
              id: planSnap.id,
              name: planData.name || "Fleet Plan",
              type: planData.type || "trenoops",
              duration: planData.duration || "Monthly",
              price: Number(planData.price || 0),
              discountPrice: planData.discountPrice ? Number(planData.discountPrice) : null,
              currency: planData.currency || "USD",
              isActive: planData.isActive ?? true,
              features: planData.features || [],
              termsAndConditions: planData.termsAndConditions || [],
              fleetVehicleTiers: planData.fleetVehicleTiers || [],
            };

            let currentPeriodEnd: string | undefined = undefined;
            let currentPeriodStart: string | undefined = undefined;

            if (session.subscription) {
              const subId =
                typeof session.subscription === "string"
                  ? session.subscription
                  : session.subscription.id;
              const subObj: any = await stripe.subscriptions.retrieve(subId);
              if (subObj?.current_period_end) {
                currentPeriodEnd = new Date(
                  subObj.current_period_end * 1000
                ).toISOString();
              }
              if (subObj?.current_period_start) {
                currentPeriodStart = new Date(
                  subObj.current_period_start * 1000
                ).toISOString();
              }
            }

            await recordAndActivateOwnerSubscription({
              ownerUid,
              userEmail: userEmail || "",
              plan,
              vehicleRange,
              trucksCount,
              trailersCount,
              amountPaid,
              currency: session.currency || "USD",
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id,
              stripeSubscriptionId:
                typeof session.subscription === "string"
                  ? session.subscription
                  : session.subscription?.id,
              stripeSessionId: session.id,
              currentPeriodStart,
              currentPeriodEnd,
              autoPay: true,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription: any = event.data.object;
        const ownerUid = subscription.metadata?.ownerUid;
        if (ownerUid) {
          // Mark subscription as cancelled in Firestore
          await updateDoc(doc(db, "Users", ownerUid), {
            isSubscriptionPurchase: false,
            "currentSubscription.status": "cancelled",
            updated_at: new Date(),
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing Stripe webhook event:", err);
    return NextResponse.json(
      { error: "Error handling webhook event: " + err?.message },
      { status: 500 }
    );
  }
}
