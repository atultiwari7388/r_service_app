import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    const {
      requestId,
      toEmail,
      companyName,
      quotedAmount,
      quotedDuration = "Monthly",
      currency = "USD",
      paymentLink,
      adminNotes,
      requestedFleet,
    } = await req.json();

    if (!toEmail || !quotedAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required quote details (toEmail, quotedAmount)" },
        { status: 400 }
      );
    }

    const trucks = requestedFleet?.trucks || 0;
    const trailers = requestedFleet?.trailers || 0;
    const totalUnits = requestedFleet?.totalUnits || trucks + trailers;

    // Format currency symbol
    const sym = currency === "USD" ? "$" : currency === "CAD" ? "C$" : currency === "MXN" ? "Mex$" : "$";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Custom Fleet Plan Quote</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #F96176 0%, #e04f63 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.95; font-weight: 500; }
            .content { padding: 32px 24px; }
            .badge { display: inline-block; background-color: #ffe4e6; color: #e11d48; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 20px; }
            .quote-card { background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 16px; padding: 24px; margin: 20px 0; text-align: center; }
            .price { font-size: 38px; font-weight: 900; color: #0f172a; margin: 8px 0; }
            .billing { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; }
            .fleet-pill { display: inline-block; background: #ffffff; border: 1px solid #fecdd3; padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; color: #e11d48; margin-top: 10px; }
            .btn { display: inline-block; background-color: #58BB87; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; margin: 24px 0 12px; box-shadow: 0 4px 12px rgba(88, 187, 135, 0.3); }
            .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Custom Fleet Coverage Quote</h1>
              <p>Prepared especially for ${companyName || "Your Fleet"}</p>
            </div>
            <div class="content">
              <span class="badge">Official Enterprise Offer</span>
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 0;">
                Hello <strong>${companyName}</strong>,
                <br /><br />
                Our dispatch and fleet operations team has reviewed your requested fleet requirements for 
                <strong>${totalUnits} commercial units</strong> (${trucks} Trucks &bull; ${trailers} Trailers).
              </p>

              <div class="quote-card">
                <div class="billing">${quotedDuration} Invoicing</div>
                <div class="price">${sym}${Number(quotedAmount).toFixed(2)}</div>
                <div class="fleet-pill">${totalUnits} Units Fleet Limit (${trucks} Trucks + ${trailers} Trailers)</div>
              </div>

              ${
                adminNotes
                  ? `
                <div style="background: #f8fafc; border-left: 4px solid #58BB87; padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #475569;">
                  <strong>Note from your Fleet Account Manager:</strong><br />
                  ${adminNotes.replace(/\n/g, "<br />")}
                </div>
              `
                  : ""
              }

              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                This custom plan includes full access to dispatch management, roadside service dispatching, GPS tracking, and multi-user driver seats.
              </p>

              ${
                paymentLink
                  ? `
                <div style="text-align: center;">
                  <a href="${paymentLink}" class="btn" target="_blank">
                    Accept Quote & Activate Fleet Plan &rarr;
                  </a>
                  <p style="font-size: 11px; color: #94a3b8;">Secure payment powered by Stripe. Plan activates instantly upon checkout.</p>
                </div>
              `
                  : `
                <p style="font-size: 13px; color: #58BB87; font-weight: 700;">
                  To accept this quote, simply reply to this email or contact your fleet coordinator.
                </p>
              `
              }
            </div>

            <div class="footer">
              &copy; ${new Date().getFullYear()} TrenoOps Fleet Management. Reference ID: ${requestId || "CUSTOM-QUOTE"}
            </div>
          </div>
        </body>
      </html>
    `;

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "TrenoOps Fleet <onboarding@resend.dev>";

      await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: `🚚 Your Custom Fleet Coverage Quote: ${sym}${Number(quotedAmount).toFixed(2)} / ${quotedDuration}`,
        html: emailHtml,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Quote email sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending custom plan quote email:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send quote email" },
      { status: 500 }
    );
  }
}
