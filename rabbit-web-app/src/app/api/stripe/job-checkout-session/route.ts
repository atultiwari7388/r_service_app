import { NextResponse } from "next/server";
import { stripe, getAppBaseUrl } from "@/lib/stripe";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { canPay, getAcceptedOffer, type WorkflowJob } from "@/lib/jobWorkflow";
import { roundMoney } from "@/lib/commission";

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

    let numAmount = typeof amount === "number" ? amount : parseFloat(String(amount || "0"));

    // The charge must equal the technician's verified final work order.
    // Re-read the job server-side so a tampered client amount is never charged.
    {
      const rawId = jobId.replace(/^#/, "");
      let jobData: (WorkflowJob & Record<string, any>) | null = null;
      for (const candidate of [`#${rawId}`, rawId]) {
        try {
          const snap = await getDoc(doc(db, "jobs", candidate));
          if (snap.exists()) {
            jobData = snap.data() as WorkflowJob & Record<string, any>;
            break;
          }
        } catch (readErr) {
          console.warn(`job-checkout-session: could not read jobs/${candidate}:`, readErr);
        }
      }

      if (jobData) {
        if (!canPay(jobData)) {
          return NextResponse.json(
            {
              error: jobData.isPaid
                ? "This work order is already paid."
                : "Payment unlocks after the technician submits the on-site inspection.",
            },
            { status: 409 }
          );
        }
        const accepted = getAcceptedOffer(jobData);
        if (!accepted || accepted.mId !== mechanicId) {
          return NextResponse.json(
            { error: "Mechanic does not match the accepted work order." },
            { status: 409 }
          );
        }
        // Verified work order + the plan service fee locked on the job just before checkout
        const lockedFee = Number(jobData.customerServiceFee);
        numAmount = roundMoney(
          Number(jobData.finalDiagnosedAmount) +
            (Number.isFinite(lockedFee) && lockedFee > 0 ? lockedFee : 0)
        );
      } else {
        console.warn(
          "job-checkout-session: job not readable server-side; using client amount for",
          jobId
        );
      }
    }

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
