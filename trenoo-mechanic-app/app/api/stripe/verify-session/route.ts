import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id parameter is required" },
        { status: 400 }
      );
    }

    // 1. Retrieve session directly from Stripe API
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json(
        { error: "Payment not completed yet", status: session.status },
        { status: 400 }
      );
    }

    const mechanicId =
      session.metadata?.mechanicId || session.client_reference_id;
    const planId = session.metadata?.planId;
    const planName = session.metadata?.planName || "Mechanic Plan";
    const duration = session.metadata?.duration || "Monthly";
    const userEmail =
      session.customer_details?.email || session.metadata?.userEmail || "";

    let currentPeriodEnd: string | undefined = undefined;
    let currentPeriodStart: string | undefined = undefined;

    if (session.subscription) {
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
      try {
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
      } catch (subErr) {
        console.warn("Could not retrieve subscription details from Stripe:", subErr);
      }
    }

    // 2. Return verified session data to the client
    return NextResponse.json({
      verified: true,
      mechanicId: mechanicId || "",
      userEmail: userEmail || "",
      planId: planId || "",
      planName: planName || "Mechanic Subscription Plan",
      duration: duration || "Monthly",
      amountPaid: (session.amount_total || 0) / 100,
      currency: (session.currency || "usd").toUpperCase(),
      stripeCustomerId:
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id || null,
      stripeSubscriptionId:
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id || null,
      stripeSessionId: session.id || null,
      currentPeriodStart: currentPeriodStart || null,
      currentPeriodEnd: currentPeriodEnd || null,
      autoPay: true,
    });
  } catch (err: any) {
    console.error("Session verification error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to verify session" },
      { status: 500 }
    );
  }
}
