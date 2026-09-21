import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not defined in environment variables");
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 500 }
      );
    }

    const { name, companyName, email, phone, truckCount, message } =
      await req.json();

    if (!name || !companyName || !email || !phone || !truckCount) {
      return NextResponse.json(
        { success: false, error: "Missing required demo request fields" },
        { status: 400 }
      );
    }

    const resend = new Resend(resendApiKey);
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "TrenoOps Demo <onboarding@resend.dev>";
    const toEmail = process.env.DEMO_NOTIFICATION_EMAIL || "team@trenoops.com";

    const data = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: email,
      subject: `🚀 New Demo Request: ${name} (${companyName})`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>New Demo Request</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #111827; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
              .header { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 24px; text-align: center; color: #ffffff; }
              .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
              .header p { margin: 6px 0 0; font-size: 13px; color: #9ca3af; }
              .content { padding: 24px; }
              .badge { display: inline-block; background-color: #fee2e2; color: #dc2626; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
              .grid { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; }
              .grid td { padding: 12px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
              .label { font-weight: 600; color: #4b5563; width: 35%; }
              .value { color: #111827; font-weight: 500; }
              .message-box { background-color: #f9fafb; border-left: 4px solid #F96176; padding: 14px; border-radius: 4px; font-size: 14px; color: #374151; line-height: 1.5; }
              .footer { background-color: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>TrenoOps Platform</h1>
                <p>New Demo & Consultation Request Received</p>
              </div>
              <div class="content">
                <span class="badge">Demo Booking</span>
                <table class="grid">
                  <tr>
                    <td class="label">Client Name</td>
                    <td class="value">${name}</td>
                  </tr>
                  <tr>
                    <td class="label">Company Name</td>
                    <td class="value">${companyName}</td>
                  </tr>
                  <tr>
                    <td class="label">Email Address</td>
                    <td class="value"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td>
                  </tr>
                  <tr>
                    <td class="label">Phone Number</td>
                    <td class="value"><a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a></td>
                  </tr>
                  <tr>
                    <td class="label">Fleet Size (Trucks)</td>
                    <td class="value">${truckCount}</td>
                  </tr>
                </table>
                <p style="font-size: 13px; font-weight: 600; color: #4b5563; margin-bottom: 6px;">Message / Additional Details:</p>
                <div class="message-box">
                  ${
                    message
                      ? message.replace(/\n/g, "<br/>")
                      : "<i>No additional message provided.</i>"
                  }
                </div>
              </div>
              <div class="footer">
                This request was sent automatically from <a href="https://www.trenoops.com" style="color: #F96176; text-decoration: none; font-weight: 600;">TrenoOps</a>.
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Error sending demo request email via Resend:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send email";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
