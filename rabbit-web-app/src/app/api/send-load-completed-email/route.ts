import { NextResponse } from "next/server";
import { Resend } from "resend";

export interface LoadDocumentItem {
  id?: string;
  name: string;
  type?: string;
  url: string;
  size?: number;
  uploadedByName?: string;
}

export async function POST(req: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not defined in environment variables");
      return NextResponse.json(
        { success: false, error: "Email service not configured (RESEND_API_KEY missing)" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      loadNumber,
      customerName,
      origin,
      destination,
      deliveryDate,
      driverEmail,
      driverName,
      consigneeEmail,
      consigneeName,
      dispatcherEmail,
      documents = [],
    } = body;

    // Collect all valid recipient emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const intendedRecipients: string[] = [];

    if (driverEmail && emailRegex.test(driverEmail.trim())) {
      intendedRecipients.push(driverEmail.trim());
    }
    if (consigneeEmail && emailRegex.test(consigneeEmail.trim())) {
      const trimmed = consigneeEmail.trim();
      if (!intendedRecipients.includes(trimmed)) {
        intendedRecipients.push(trimmed);
      }
    }
    if (dispatcherEmail && emailRegex.test(dispatcherEmail.trim())) {
      const trimmed = dispatcherEmail.trim();
      if (!intendedRecipients.includes(trimmed)) {
        intendedRecipients.push(trimmed);
      }
    }

    if (intendedRecipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No valid recipient email address found for Assigned Driver or Consignee.",
        },
        { status: 400 }
      );
    }

    const resend = new Resend(resendApiKey);
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "TrenoOps Dispatch <onboarding@resend.dev>";
    const testOwnerEmail =
      process.env.DEMO_NOTIFICATION_EMAIL || "regalapp7@gmail.com";

    // Detect if Resend is in free onboarding sandbox mode
    const isSandboxMode = fromEmail.includes("onboarding@resend.dev");

    // In Resend sandbox mode, emails can ONLY be sent to the verified account owner (e.g. regalapp7@gmail.com)
    let actualRecipients = intendedRecipients;
    let wasReroutedForTesting = false;

    if (isSandboxMode) {
      // Check if any recipient is external (not the test owner email)
      const hasExternalRecipients = intendedRecipients.some(
        (r) => r.toLowerCase() !== testOwnerEmail.toLowerCase()
      );

      if (hasExternalRecipients) {
        wasReroutedForTesting = true;
        actualRecipients = [testOwnerEmail];
      }
    }

    // Build Document Rows HTML
    const docsListHtml =
      Array.isArray(documents) && documents.length > 0
        ? documents
            .map((doc: LoadDocumentItem, index: number) => {
              const docName = doc.name || `Document ${index + 1}`;
              const docType = (doc.type || "Document").toUpperCase();
              const docUrl = doc.url || "#";
              return `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px 14px; font-size: 14px; color: #111827; font-weight: 600;">
                  <span style="display: inline-block; background-color: #f3f4f6; color: #4b5563; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-right: 8px; font-weight: 700;">${docType}</span>
                  ${docName}
                  ${
                    doc.uploadedByName
                      ? `<div style="font-size: 11px; color: #9ca3af; font-weight: 400; margin-top: 2px;">Uploaded by: ${doc.uploadedByName}</div>`
                      : ""
                  }
                </td>
                <td style="padding: 12px 14px; text-align: right;">
                  <a href="${docUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #F96176; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 6px;">
                    Download / View 📄
                  </a>
                </td>
              </tr>
            `;
            })
            .join("")
        : `
          <tr>
            <td colspan="2" style="padding: 16px; text-align: center; color: #9ca3af; font-size: 13px; font-style: italic;">
              No documents attached to this load.
            </td>
          </tr>
        `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Load Completed - Delivery Documents</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
            .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
            .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
            .content { padding: 28px 24px; }
            .status-badge { display: inline-block; background-color: #dcfce7; color: #15803d; font-weight: 700; font-size: 12px; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
            .test-banner { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #92400e; line-height: 1.5; }
            .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 24px; margin-bottom: 10px; }
            .grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
            .grid td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .label { font-weight: 600; color: #64748b; width: 35%; }
            .value { color: #0f172a; font-weight: 600; }
            .docs-table { width: 100%; border-collapse: collapse; margin-top: 10px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            .footer { background-color: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TrenoOps Dispatch</h1>
              <p>Load Delivery Confirmation & Document Package</p>
            </div>
            <div class="content">
              ${
                wasReroutedForTesting
                  ? `
                <div class="test-banner">
                  ⚠️ <strong>Resend Test Mode:</strong> This email was delivered to your registered email (<code>${testOwnerEmail}</code>) because a custom domain has not been verified on Resend yet.
                  <br /><strong>Intended Recipients:</strong> ${intendedRecipients.join(", ")}
                </div>
              `
                  : ""
              }

              <div style="text-align: center;">
                <span class="status-badge">✔ Load Completed</span>
              </div>

              <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-top: 0;">
                Hello,
                <br /><br />
                The following load has been marked as <strong>COMPLETED</strong>. All associated documents, including Proof of Delivery (POD), Bill of Lading (BOL), and receipts uploaded for this shipment, are provided below for your records.
              </p>

              <div class="section-title">📦 Load Summary</div>
              <table class="grid">
                <tr>
                  <td class="label">Load Number</td>
                  <td class="value" style="color: #F96176; font-size: 15px; font-weight: 800;">#${loadNumber || "N/A"}</td>
                </tr>
                ${
                  customerName
                    ? `
                <tr>
                  <td class="label">Customer / Broker</td>
                  <td class="value">${customerName}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td class="label">Origin / Pickup</td>
                  <td class="value">${origin || "N/A"}</td>
                </tr>
                <tr>
                  <td class="label">Destination / Drop</td>
                  <td class="value">${destination || "N/A"}</td>
                </tr>
                ${
                  deliveryDate
                    ? `
                <tr>
                  <td class="label">Completion Date</td>
                  <td class="value">${deliveryDate}</td>
                </tr>`
                    : ""
                }
                ${
                  driverName
                    ? `
                <tr>
                  <td class="label">Assigned Driver</td>
                  <td class="value">${driverName}</td>
                </tr>`
                    : ""
                }
                ${
                  consigneeName
                    ? `
                <tr>
                  <td class="label">Consignee</td>
                  <td class="value">${consigneeName}</td>
                </tr>`
                    : ""
                }
              </table>

              <div class="section-title">📄 Shipment Documents (${documents.length})</div>
              <table class="docs-table">
                ${docsListHtml}
              </table>

              <p style="font-size: 13px; color: #64748b; margin-top: 24px; line-height: 1.5;">
                If you have any questions regarding this shipment or require additional paperwork, please reply directly to this email or contact your dispatch coordinator.
              </p>
            </div>
            <div class="footer">
              This automated shipment report was dispatched by 
              <a href="https://www.trenoops.com" style="color: #F96176; text-decoration: none; font-weight: 700;">TrenoOps</a>.
            </div>
          </div>
        </body>
      </html>
    `;

    const subject = `✅ Load #${loadNumber || ""} Completed - Shipment Documents & POD (${origin || "Origin"} ➔ ${destination || "Drop"})`;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: actualRecipients,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error("[Resend Load Completed Email Error]:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      recipients: intendedRecipients,
      actualRecipients,
      wasReroutedForTesting,
      data,
      message: wasReroutedForTesting
        ? `[Test Mode] Documents emailed to ${testOwnerEmail} (Intended for: ${intendedRecipients.join(", ")})`
        : `Documents successfully sent to ${actualRecipients.join(", ")}`,
    });
  } catch (error: unknown) {
    console.error("Error sending load completed documents email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send email";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
