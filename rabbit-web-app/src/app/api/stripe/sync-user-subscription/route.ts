import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { recordAndActivateOwnerSubscription } from "@/lib/services/subscriptionActivation";
import { SubscriptionPlan } from "@/types/subscription";
import { checkHasActiveSubscription } from "@/lib/services/subscriptionService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ownerUid, email } = body || {};

    if (!ownerUid) {
      return NextResponse.json({ error: "ownerUid is required" }, { status: 400 });
    }

    const cleanEmail = (email || "").trim().toLowerCase();

    // 1. First, check if Firestore Users/{ownerUid} already has an active subscription
    const userDocRef = doc(db, "Users", ownerUid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const uData = userSnap.data();
      if (checkHasActiveSubscription(uData)) {
        return NextResponse.json({
          active: true,
          source: "user_doc",
          plan: uData.currentSubscription,
        });
      }
    }

    // 2. Check if subscriptionPurchases collection has an active record for this user
    try {
      const purchasesQ = query(
        collection(db, "subscriptionPurchases"),
        where("userId", "==", ownerUid)
      );
      const purchasesSnap = await getDocs(purchasesQ);

      let foundRecord: any = null;
      purchasesSnap.forEach((snap) => {
        const d = snap.data();
        if (d.status !== "cancelled" && d.status !== "expired") {
          foundRecord = d;
        }
      });

      if (foundRecord) {
        // Sync to Users/{ownerUid}
        await setDoc(
          userDocRef,
          {
            isSubscriptionPurchase: true,
            currentSubscription: {
              planId: foundRecord.planId || "direct_plan",
              planName: foundRecord.planName || "Fleet Plan",
              planType: foundRecord.planType || "trenoops",
              duration: foundRecord.duration || "Monthly",
              amountPaid: foundRecord.amountPaid || 0,
              currency: foundRecord.currency || "USD",
              status: "active",
              purchasedAt: foundRecord.purchasedAt || new Date().toISOString(),
              purchasedTimestamp: foundRecord.purchasedTimestamp || Date.now(),
              currentPeriodEnd: foundRecord.currentPeriodEnd || null,
              vehicleRange: foundRecord.vehicleRange || "1 to 5",
              trucksCount: foundRecord.trucksCount || 0,
              trailersCount: foundRecord.trailersCount || 0,
              autoPay: foundRecord.autoPay ?? true,
            },
            updated_at: serverTimestamp(),
          },
          { merge: true }
        );

        return NextResponse.json({
          active: true,
          source: "subscription_purchases",
        });
      }
    } catch (purchasesErr) {
      console.warn("Could not check subscriptionPurchases:", purchasesErr);
    }

    // 3. Check Stripe directly:
    // A) Search recent paid checkout sessions matching this ownerUid or email
    try {
      const sessions = await stripe.checkout.sessions.list({ limit: 25 });
      const matchedSession = sessions.data.find(
        (s) =>
          (s.metadata?.ownerUid === ownerUid ||
            (cleanEmail && s.customer_details?.email?.toLowerCase() === cleanEmail)) &&
          (s.payment_status === "paid" || s.status === "complete")
      );

      if (matchedSession) {
        const planId = matchedSession.metadata?.planId || "plan";
        const planName = matchedSession.metadata?.planName || "Fleet Membership Plan";
        const duration = (matchedSession.metadata?.duration as any) || "Monthly";
        const vehicleRange = matchedSession.metadata?.vehicleRange || "1 to 5";
        const trucksCount = parseInt(matchedSession.metadata?.trucksCount || "0", 10);
        const trailersCount = parseInt(matchedSession.metadata?.trailersCount || "0", 10);
        const amountPaid = (matchedSession.amount_total || 0) / 100;

        let currentPeriodEnd: string | undefined = undefined;
        let currentPeriodStart: string | undefined = undefined;

        if (matchedSession.subscription) {
          const subId =
            typeof matchedSession.subscription === "string"
              ? matchedSession.subscription
              : matchedSession.subscription.id;
          try {
            const subObj: any = await stripe.subscriptions.retrieve(subId);
            if (subObj?.current_period_end) {
              currentPeriodEnd = new Date(subObj.current_period_end * 1000).toISOString();
            }
            if (subObj?.current_period_start) {
              currentPeriodStart = new Date(subObj.current_period_start * 1000).toISOString();
            }
          } catch (e) {
            console.warn("Error fetching subObj:", e);
          }
        }

        const planObj: SubscriptionPlan = {
          id: planId,
          name: planName,
          type: "trenoops",
          duration,
          price: amountPaid,
          currency: (matchedSession.currency || "USD").toUpperCase(),
          isActive: true,
          features: [],
          termsAndConditions: [],
        };

        // Activate and save to Firestore
        await recordAndActivateOwnerSubscription({
          ownerUid,
          userEmail: cleanEmail || matchedSession.customer_details?.email || "",
          plan: planObj,
          vehicleRange,
          trucksCount,
          trailersCount,
          amountPaid,
          currency: (matchedSession.currency || "USD").toUpperCase(),
          stripeCustomerId:
            typeof matchedSession.customer === "string"
              ? matchedSession.customer
              : matchedSession.customer?.id,
          stripeSubscriptionId:
            typeof matchedSession.subscription === "string"
              ? matchedSession.subscription
              : matchedSession.subscription?.id,
          stripeSessionId: matchedSession.id,
          currentPeriodStart,
          currentPeriodEnd,
          autoPay: true,
        });

        return NextResponse.json({
          active: true,
          source: "stripe_recovered_session",
          sessionId: matchedSession.id,
        });
      }
    } catch (stripeErr) {
      console.warn("Stripe session sync error:", stripeErr);
    }

    // 4. B) Check Stripe active subscriptions for this customer email
    if (cleanEmail) {
      try {
        const customers = await stripe.customers.list({ email: cleanEmail, limit: 5 });
        for (const customer of customers.data) {
          const subs = await stripe.subscriptions.list({
            customer: customer.id,
            status: "active",
            limit: 5,
          });

          if (subs.data.length > 0) {
            const activeSub: any = subs.data[0];
            const currentPeriodEnd = activeSub.current_period_end
              ? new Date(activeSub.current_period_end * 1000).toISOString()
              : undefined;
            const currentPeriodStart = activeSub.current_period_start
              ? new Date(activeSub.current_period_start * 1000).toISOString()
              : undefined;

            const planObj: SubscriptionPlan = {
              id: activeSub.metadata?.planId || "stripe_sub",
              name: activeSub.metadata?.planName || "Fleet Subscription Plan",
              type: "trenoops",
              duration: (activeSub.metadata?.duration as any) || "Monthly",
              price: (activeSub.items.data[0]?.price.unit_amount || 0) / 100,
              currency: activeSub.currency.toUpperCase(),
              isActive: true,
              features: [],
              termsAndConditions: [],
            };

            await recordAndActivateOwnerSubscription({
              ownerUid,
              userEmail: cleanEmail,
              plan: planObj,
              vehicleRange: activeSub.metadata?.vehicleRange || "1 to 5",
              trucksCount: parseInt(activeSub.metadata?.trucksCount || "0", 10),
              trailersCount: parseInt(activeSub.metadata?.trailersCount || "0", 10),
              amountPaid: (activeSub.items.data[0]?.price.unit_amount || 0) / 100,
              currency: activeSub.currency.toUpperCase(),
              stripeCustomerId: customer.id,
              stripeSubscriptionId: activeSub.id,
              currentPeriodStart,
              currentPeriodEnd,
              autoPay: true,
            });

            return NextResponse.json({
              active: true,
              source: "stripe_customer_subscription",
              subscriptionId: activeSub.id,
            });
          }
        }
      } catch (custErr) {
        console.warn("Stripe customer sub sync error:", custErr);
      }
    }

    return NextResponse.json({ active: false });
  } catch (err: any) {
    console.error("sync-user-subscription endpoint error:", err);
    return NextResponse.json({ error: err?.message || "Sync failed" }, { status: 500 });
  }
}
