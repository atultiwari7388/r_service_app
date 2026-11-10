import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { recordAndActivateSubscription } from "@/lib/services/subscriptionActivation";
import { SubscriptionPlan } from "@/types/subscription";
import Stripe from "stripe";

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
        const mechanicId =
          session.metadata?.mechanicId || session.client_reference_id;
        const planId = session.metadata?.planId;
        const userEmail = session.customer_details?.email || session.metadata?.email;

        if (mechanicId && planId) {
          // Fetch plan details from Firestore
          const planSnap = await getDoc(doc(db, "subscriptionPlans", planId));
          if (planSnap.exists()) {
            const planData = planSnap.data();
            const plan: SubscriptionPlan = {
              id: planSnap.id,
              name: planData.name || "Mechanic Plan",
              type: planData.type || "treno_mechanic",
              duration: planData.duration || "Monthly",
              price: Number(planData.price || 0),
              discountPrice: planData.discountPrice ? Number(planData.discountPrice) : null,
              currency: planData.currency || "USD",
              isActive: planData.isActive ?? true,
              features: planData.features || [],
              termsAndConditions: planData.termsAndConditions || [],
              maxBays: planData.maxBays,
              serviceRadiusMiles: planData.serviceRadiusMiles,
              priorityJobLeads: planData.priorityJobLeads,
              directCarrierInvoicing: planData.directCarrierInvoicing,
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

            await recordAndActivateSubscription({
              mechanicId,
              userEmail: userEmail || "",
              plan,
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

      case "invoice.payment_succeeded": {
        const invoice: any = event.data.object;
        // Handles automatic recurring renewal payment
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const subObj: any = await stripe.subscriptions.retrieve(subscriptionId);
          const mechanicId = subObj.metadata?.mechanicId;
          const planId = subObj.metadata?.planId;

          if (mechanicId && planId) {
            const planSnap = await getDoc(doc(db, "subscriptionPlans", planId));
            if (planSnap.exists()) {
              const plan = {
                id: planSnap.id,
                ...planSnap.data(),
              } as SubscriptionPlan;

              await recordAndActivateSubscription({
                mechanicId,
                userEmail: invoice.customer_email || subObj.metadata?.userEmail || "",
                plan,
                stripeCustomerId: invoice.customer,
                stripeSubscriptionId: subscriptionId,
                stripeInvoiceId: invoice.id,
                currentPeriodStart: subObj.current_period_start
                  ? new Date(subObj.current_period_start * 1000).toISOString()
                  : undefined,
                currentPeriodEnd: subObj.current_period_end
                  ? new Date(subObj.current_period_end * 1000).toISOString()
                  : undefined,
                autoPay: true,
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription: any = event.data.object;
        const mechanicId = subscription.metadata?.mechanicId;
        if (mechanicId) {
          // Mark subscription as cancelled in Firestore
          await updateDoc(doc(db, "Mechanics", mechanicId), {
            isSubscriptionPurchase: false,
            "currentSubscription.status": "cancelled",
            updated_at: new Date(),
          });
        }
        break;
      }

      default:
        // Other events ignored
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
