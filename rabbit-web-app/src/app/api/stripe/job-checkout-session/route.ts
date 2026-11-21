import { NextResponse } from "next/server";
import { stripe, getAppBaseUrl } from "@/lib/stripe";

interface JobCheckoutRequestBody {
  jobId: string;
  effectiveUserId: string;
  mechanicId: string;
  mechanicName?: string;
  serviceName?: string;
  amount: number;
  currency?: string;
  userEmail?: string;
  originUrl?: string;
}

export async function POST(req: Request) {
  try {
    const body: JobCheckoutRequestBody = await req.json();
    const {
      jobId,
      effectiveUserId,
      mechanicId,
      mechanicName = "Assigned Mechanic",
      serviceName = "Roadside Assistance",
      amount,
      currency = "USD",
      userEmail,
      originUrl,
    } = body;

    if (!jobId || !effectiveUserId || !mechanicId) {
      return NextResponse.json(
        { error: "jobId, effectiveUserId, and mechanicId are required" },
        { status: 400 }
      );
    }

    const numAmount = typeof amount === "number" ? amount : parseFloat(String(amount || "0"));
    const unitAmountCents = Math.round(numAmount * 100);

    if (isNaN(unitAmountCents) || unitAmountCents <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount. Amount must be greater than $0.00." },
        { status: 400 }
      );
    }

    const cleanEmail = (userEmail || "").trim();
    const rawJobId = jobId.replace(/^#/, "");
    const jobDocId = jobId.startsWith("#") ? jobId : `#${jobId}`;

    // Dynamic base app URL resolution (supports live deployed domains and localhost)
    const appUrl =
      originUrl && !originUrl.includes("localhost")
        ? originUrl.replace(/\/+$/, "")
        : getAppBaseUrl(req);

    // Look up or create customer if email provided
    let customerId: string | undefined = undefined;
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
              userId: effectiveUserId,
              platform: "Treno Fleet - Road Service",
            },
          });
          customerId = newCust.id;
        }
      } catch (custErr) {
        console.warn("Stripe customer creation/lookup warning for job payment:", custErr);
      }
    }

    // Create ONE-TIME Payment Checkout Session (Non-recurring, mode: "payment")
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : cleanEmail || undefined,
      client_reference_id: effectiveUserId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Service: ${serviceName}`,
              description: `Job #${rawJobId} • Mechanic: ${mechanicName}`,
            },
            unit_amount: unitAmountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "job_payment",
        jobId: rawJobId,
        jobDocId: jobDocId,
        effectiveUserId: effectiveUserId,
        mechanicId: mechanicId,
        mechanicName: mechanicName,
        serviceName: serviceName,
        amountPaid: String(numAmount),
        currency: currency.toUpperCase(),
        payMode: "online",
      },
      success_url: `${appUrl}/my-jobs/${rawJobId}?payment_success=true&session_id={CHECKOUT_SESSION_ID}&mechanicId=${mechanicId}`,
      cancel_url: `${appUrl}/my-jobs/${rawJobId}?payment_cancelled=true`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error("Stripe job-checkout-session creation error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error creating job checkout session" },
      { status: 500 }
    );
  }
}
