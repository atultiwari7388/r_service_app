import { NextResponse } from "next/server";
import { stripe, getAppBaseUrl } from "@/lib/stripe";

interface RequestBody {
  mechanicId: string;
  planId: string;
  email?: string;
  planName?: string;
  duration?: string;
  price?: number;
  discountPrice?: number | null;
  currency?: string;
}

function mapDurationToStripeInterval(durationStr: string): {
  interval: "day" | "week" | "month" | "year";
  interval_count: number;
} {
  const normalized = (durationStr || "").toLowerCase().trim();

  if (normalized.includes("year") || normalized.includes("annual")) {
    return { interval: "year", interval_count: 1 };
  }
  if (normalized.includes("quarter")) {
    return { interval: "month", interval_count: 3 };
  }
  if (normalized.includes("semi") || normalized.includes("6 month")) {
    return { interval: "month", interval_count: 6 };
  }
  if (normalized.includes("week")) {
    return { interval: "week", interval_count: 1 };
  }
  // Default to monthly
  return { interval: "month", interval_count: 1 };
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { mechanicId, planId, email } = body;

    if (!mechanicId || !planId) {
      return NextResponse.json(
        { error: "mechanicId and planId are required" },
        { status: 400 }
      );
    }

    const planName = body.planName || "Mechanic Subscription Plan";
    const planDuration = body.duration || "Monthly";
    const planPrice = typeof body.price === "number" ? body.price : 49.99;
    const planDiscountPrice =
      body.discountPrice !== undefined && body.discountPrice !== null
        ? Number(body.discountPrice)
        : null;
    const planCurrency = body.currency || "USD";

    // Calculate final charging price
    const finalAmount =
      planDiscountPrice !== null && planDiscountPrice !== undefined && planDiscountPrice > 0
        ? planDiscountPrice
        : planPrice;

    const unitAmountCents = Math.round(finalAmount * 100);

    if (unitAmountCents <= 0) {
      return NextResponse.json(
        { error: "Invalid plan price" },
        { status: 400 }
      );
    }

    // Check or provision Stripe Customer via Stripe API directly
    let customerId: string | undefined = undefined;
    const cleanEmail = (email || "").trim();

    if (cleanEmail) {
      try {
        const existingCustomers = await stripe.customers.list({
          email: cleanEmail,
          limit: 1,
        });
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        } else {
          const newCust = await stripe.customers.create({
            email: cleanEmail,
            metadata: {
              mechanicId,
              platform: "Treno Mechanic",
            },
          });
          customerId = newCust.id;
        }
      } catch (custErr) {
        console.warn("Stripe customer creation/lookup warning:", custErr);
      }
    }

    const { interval, interval_count } = mapDurationToStripeInterval(planDuration);
    const appUrl = getAppBaseUrl();

    // Create Stripe Checkout Session (Recurring Subscription with Auto-Pay)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : cleanEmail || undefined,
      client_reference_id: mechanicId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: planCurrency.toLowerCase(),
            product_data: {
              name: `Treno Mechanic — ${planName}`,
              description: `Commercial workshop & technician membership (${planDuration})`,
              metadata: {
                planId,
                mechanicId,
              },
            },
            unit_amount: unitAmountCents,
            recurring: {
              interval,
              interval_count,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          mechanicId,
          planId,
          planName,
          duration: planDuration,
          userEmail: cleanEmail,
        },
      },
      metadata: {
        mechanicId,
        planId,
        planName,
        duration: planDuration,
        userEmail: cleanEmail,
      },
      success_url: `${appUrl}/choose-plan/success?session_id={CHECKOUT_SESSION_ID}&mechanicId=${mechanicId}`,
      cancel_url: `${appUrl}/choose-plan?mechanicId=${mechanicId}&cancelled=true`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error("Stripe checkout-session creation error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error creating checkout session" },
      { status: 500 }
    );
  }
}
