// components/pdf/PdfTemplates.tsx
"use client";

import React, { forwardRef } from "react";
import { LoadData } from "../interface/loaddata";

// ============================================================================
// PDF PRINT WRAPPER COMPONENT
// ============================================================================

export const PdfPrintWrapper = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    className?: string;
  }
>(({ children, className = "" }, ref) => {
  return (
    <div
      ref={ref}
      className={`pdf-print-wrapper ${className}`}
      style={{
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        lineHeight: "1.4",
        padding: "20mm",
        width: "210mm", // A4 width
        minHeight: "297mm", // A4 height
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
});

PdfPrintWrapper.displayName = "PdfPrintWrapper";

// ============================================================================
// COMMON PDF LAYOUT COMPONENT
// ============================================================================

interface PdfLayoutProps {
  title: string;
  children: React.ReactNode;
  logoUrl?: string;
  footerText?: string;
  className?: string;
  showPageNumber?: boolean;
}

export const PdfLayout = ({
  title,
  children,
  logoUrl,
  footerText,
  className = "",
  showPageNumber = true,
}: PdfLayoutProps) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`pdf-container ${className}`}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "2px solid #000000",
          paddingBottom: "10px",
          marginBottom: "20px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "10px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#000000",
                margin: "0 0 5px 0",
              }}
            >
              {title}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                fontSize: "11px",
                color: "#666666",
              }}
            >
              <span>
                <strong>Generated:</strong> {currentDate} at {currentTime}
              </span>
              <span>
                <strong>Document ID:</strong> {Date.now().toString().slice(-8)}
              </span>
            </div>
          </div>
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" style={{ height: "50px" }} />
          ) : (
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0",
                  color: "#000000",
                }}
              >
                WESTERN ENTERPRISES
              </p>
              <p
                style={{
                  fontSize: "14px",
                  margin: "2px 0 0 0",
                  color: "#666666",
                }}
              >
                BROKERAGE INC
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: "1",
          overflow: "hidden",
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "2px solid #000000",
          paddingTop: "10px",
          marginTop: "20px",
          fontSize: "10px",
          color: "#666666",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <p style={{ margin: "0 0 2px 0" }}>
              <strong>Western Enterprises Brokerage Inc</strong>
            </p>
            <p style={{ margin: "0 0 2px 0" }}>
              5374 North Barcus Avenue, Fresno, CA 93722
            </p>
            <p style={{ margin: "0" }}>
              Phone: 559-824-2380 | Email: brokerage@westernert.com
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 2px 0" }}>
              MC#: 1417403 | DOT Number: 3871269
            </p>
            <p style={{ margin: "0 0 2px 0" }}>
              {footerText || "© 2025 Western Enterprises. All rights reserved."}
            </p>
            {showPageNumber && (
              <p style={{ margin: "2px 0 0 0", fontSize: "9px" }}>
                Page 1 of 1
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// RATE CONFIRMATION PDF TEMPLATE
// ============================================================================

export const RateConfirmationPdfTemplate = ({
  loadData,
}: {
  loadData: LoadData;
}) => {
  return (
    <PdfLayout
      title="RATE CONFIRMATION"
      footerText={`RATE CONFIRMATION #${loadData.loadNumber}`}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Company and Carrier Information */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
            marginBottom: "10px",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                margin: "0 0 8px 0",
                color: "#000000",
              }}
            >
              Western Enterprises Brokerage Inc
            </h3>
            <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
              5374 North Barcus Avenue
            </p>
            <p style={{ fontSize: "12px", margin: "0 0 10px 0" }}>
              Fresno CA 93722
            </p>
            <div>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>MC#:</strong> 1417403
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>DOT Number:</strong> 3871269
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Phone:</strong> 559-824-2380
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Email:</strong> brokerage@westernert.com
              </p>
            </div>
          </div>

          <div
            style={{
              borderLeft: "2px solid #cccccc",
              paddingLeft: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                margin: "0 0 8px 0",
                color: "#000000",
              }}
            >
              Carrier Information
            </h3>
            <p
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                margin: "0 0 2px 0",
              }}
            >
              {loadData.carrier || "S. S. B TRANSPORT INC."}
            </p>
            <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
              4203 WATERFALL CANYON DR
            </p>
            <p style={{ fontSize: "12px", margin: "0 0 10px 0" }}>
              BAKERSFIELD CA 93313
            </p>
            <div>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>MC Number:</strong> MC464064
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>DOT Number:</strong> 1145681
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Primary Contact:</strong> Satbir Rai
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Email:</strong> Ssbtransportinc661@yahoo.com
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Phone:</strong> 661-487-3531
              </p>
            </div>
            <div style={{ marginTop: "8px" }}>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Driver:</strong> Swarn Singh
              </p>
              <p style={{ fontSize: "12px", margin: "0" }}>
                <strong>Cell phone:</strong> 661-869-7165
              </p>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div
          style={{
            borderTop: "1px solid #cccccc",
            paddingTop: "10px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              margin: "0 0 5px 0",
              color: "#000000",
            }}
          >
            Comments
          </h3>
          <p style={{ fontSize: "12px", margin: "0" }}>
            Contact Information: Akash Gill
          </p>
        </div>

        {/* Equipment / Temperature */}
        <div
          style={{
            borderTop: "1px solid #cccccc",
            paddingTop: "10px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              margin: "0 0 5px 0",
              color: "#000000",
            }}
          >
            Equipment / Temperature
          </h3>
          <p style={{ fontSize: "12px", margin: "0" }}>
            Reefer - Continuous - Temp: 0.00
          </p>
        </div>

        {/* Stops Information */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {/* Stop 1 - Pickup */}
          <div
            style={{
              borderTop: "1px solid #cccccc",
              paddingTop: "10px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                margin: "0 0 8px 0",
                color: "#000000",
              }}
            >
              Stop # 1 (Pickup)
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginBottom: "10px",
              }}
            >
              <div>
                <p style={{ fontSize: "12px", margin: "0 0 3px 0" }}>
                  <strong>Date/Time:</strong> 11/15/2025 08:00 - 11/15/2025
                  13:00
                </p>
                <p style={{ fontSize: "12px", margin: "0" }}>
                  <strong>Pickup Type:</strong> Live Load
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    margin: "0 0 3px 0",
                  }}
                >
                  FREEZE N STORE
                </p>
                <p style={{ fontSize: "12px", margin: "0" }}>
                  311 West Sunset Avenue, Springdale, AR, 72764
                </p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#f5f5f5",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e0e0e0",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  margin: "0 0 5px 0",
                  color: "#000000",
                }}
              >
                Location Notes:
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Pickup #:</strong> 1495378
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Qty:</strong> 2343 Pallets
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Weight:</strong> 28975 lbs
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Shipment BOL:</strong> 1495378
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>PO Number:</strong> 26420580, 26437650
              </p>
              <p style={{ fontSize: "12px", margin: "0" }}>
                <strong>Instructions:</strong> PU/SO #: 143547, 143597
              </p>
            </div>
          </div>

          {/* Stop 2 - Delivery */}
          <div
            style={{
              borderTop: "1px solid #cccccc",
              paddingTop: "10px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                margin: "0 0 8px 0",
                color: "#000000",
              }}
            >
              Stop # 2 (Delivery)
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginBottom: "10px",
              }}
            >
              <div>
                <p style={{ fontSize: "12px", margin: "0 0 3px 0" }}>
                  <strong>Date/Time:</strong> 11/17/2025 09:00 - 11/17/2025
                  09:00
                </p>
                <p style={{ fontSize: "12px", margin: "0" }}>
                  <strong>Delivery Type:</strong> Live Unload
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    margin: "0 0 3px 0",
                  }}
                >
                  Sysco Food Service - Las Vegas
                </p>
                <p style={{ fontSize: "12px", margin: "0" }}>
                  6201 East Centennial Parkway, Las Vegas, NV, 89115
                </p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#f5f5f5",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e0e0e0",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  margin: "0 0 5px 0",
                  color: "#000000",
                }}
              >
                Location Notes:
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Qty:</strong> 2343 Pallets
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Weight:</strong> 28975 lbs
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>Shipment BOL:</strong> 1495378
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                <strong>PO Number:</strong> 26420580, 26437650
              </p>
              <p style={{ fontSize: "12px", margin: "0" }}>
                <strong>Instructions:</strong> Delivery Conf. #:
                CHK5551729519nov25 ApptRef# PU/SO #: 143547, 143597
              </p>
            </div>
          </div>
        </div>

        {/* Pay Items Table */}
        <div
          style={{
            borderTop: "1px solid #cccccc",
            paddingTop: "10px",
            marginTop: "10px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              color: "#000000",
            }}
          >
            Pay Items
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #cccccc",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  Notes
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    fontSize: "11px",
                  }}
                >
                  Pay Type
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    fontSize: "11px",
                  }}
                >
                  -
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    fontSize: "11px",
                  }}
                >
                  Unit Rate
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    fontSize: "11px",
                  }}
                >
                  Units
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    fontSize: "11px",
                  }}
                >
                  Flat
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    fontSize: "11px",
                  }}
                >
                  -
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    fontSize: "11px",
                  }}
                >
                  -
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  $3,000.00
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f9f9f9" }}>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                  colSpan={3}
                >
                  Grand Total
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "6px 8px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  $3,000.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Page 2 Content (Terms and Conditions) */}
        <div
          style={{
            borderTop: "2px solid #000000",
            paddingTop: "15px",
            marginTop: "20px",
            pageBreakBefore: "always",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              margin: "0 0 10px 0",
              color: "#000000",
            }}
          >
            Terms & Conditions
          </h3>
          <div
            style={{
              fontSize: "10px",
              lineHeight: "1.5",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <p style={{ margin: "0" }}>
              <strong>Mailings Address:</strong> 6569 N Riverside Dr Ste 102
              #207, Fresno, CA 93722
            </p>
            <p style={{ margin: "0" }}>
              <strong>Daily Check Call:</strong> Must be provided by 9AM PST or
              $50 will be deducted from the rate daily
            </p>
            <p style={{ margin: "0" }}>
              <strong>Brokered Loads:</strong> Any loads brokered out will be
              charged a fee of $1000
            </p>
            <p style={{ margin: "0" }}>
              <strong>Late Fee:</strong> There will be a $1000 late fee for late
              truck
            </p>
            <p style={{ margin: "0" }}>
              <strong>Early Delivery:</strong> Cannot deliver earlier than date
              on RATECON, will result in a $1000 fine
            </p>
            <p style={{ margin: "0" }}>
              <strong>Late Pickup:</strong> If the load picks up after date on
              RATECON and truck is late that is carrier&apos;s responsibility
              and late fee will be applied
            </p>
            <p style={{ margin: "0" }}>
              <strong>Payment Terms:</strong> Standard 30 days after receiving
              paperwork (Invoice, Bills, and Signed Rate con)
            </p>
            <p style={{ margin: "0" }}>
              <strong>Quick Pay:</strong> 3% after receiving paperwork, next day
              ACH (Make sure Quick pay is listed on invoice and subject line of
              email)
            </p>
            <p style={{ margin: "0" }}>
              <strong>Detention:</strong> NO Detention for any loads!
            </p>
            <p style={{ margin: "0" }}>
              <strong>Equipment Requirements:</strong> SINGLE CHUTE ON ALL
              PRODUCE LOADS, NO DOUBLE CHUTE, TRAILER MUST BE CLEAN AND ODORLESS
              OR SUBJECT TO FINE
            </p>
            <p style={{ margin: "0" }}>
              <strong>Seals:</strong> MAKE SURE ALL TRAILERS ARE SEALED AND ONLY
              RECEIVER BREAKS SEAL
            </p>
            <p style={{ margin: "0" }}>
              <strong>Load Security:</strong> ALL LOADS MUST BE SECURED WITH AT
              LEAST 4 LOAD LOCK BARS
            </p>
            <p style={{ margin: "0" }}>
              <strong>Re-consignment:</strong> $1.50 rpm
            </p>
            <p style={{ margin: "0" }}>
              <strong>Paperwork Submission:</strong> Send all Paperwork to:
              accounting@westernert.com
            </p>
          </div>
        </div>
      </div>
    </PdfLayout>
  );
};

// ============================================================================
// BILL OF LADING PDF TEMPLATE
// ============================================================================

export const BolPdfTemplate = ({ loadData }: { loadData: LoadData }) => {
  return (
    <PdfLayout title="BILL OF LADING" footerText="ORIGINAL - NOT NEGOTIABLE">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Shipper and Consignee Information */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              border: "1px solid #cccccc",
              padding: "12px",
              borderRadius: "4px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                borderBottom: "2px solid #000000",
                paddingBottom: "5px",
                margin: "0 0 10px 0",
              }}
            >
              SHIPPER
            </h3>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Name:</strong> FREEZE N STORE
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Address:</strong> 311 West Sunset Avenue
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>City, State, ZIP:</strong> Springdale, AR 72764
              </p>
              <p style={{ margin: "0" }}>
                <strong>Contact:</strong> Warehouse Manager
              </p>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #cccccc",
              padding: "12px",
              borderRadius: "4px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                borderBottom: "2px solid #000000",
                paddingBottom: "5px",
                margin: "0 0 10px 0",
              }}
            >
              CONSIGNEE
            </h3>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Name:</strong> Sysco Food Service - Las Vegas
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Address:</strong> 6201 East Centennial Parkway
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>City, State, ZIP:</strong> Las Vegas, NV 89115
              </p>
              <p style={{ margin: "0" }}>
                <strong>Contact:</strong> Receiving Department
              </p>
            </div>
          </div>
        </div>

        {/* Load Information */}
        <div
          style={{
            border: "1px solid #cccccc",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "2px solid #000000",
              paddingBottom: "5px",
              margin: "0 0 15px 0",
            }}
          >
            LOAD INFORMATION
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "15px",
              fontSize: "12px",
            }}
          >
            <div>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>BOL #:</strong> {loadData.bolNumber || "1495378"}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Load #:</strong> {loadData.loadNumber}
              </p>
              <p style={{ margin: "0" }}>
                <strong>PO #:</strong>{" "}
                {loadData.poNumbers?.join(", ") || "26420580, 26437650"}
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Pickup Date:</strong>{" "}
                {loadData.pickupDate || "11/15/2025"}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Delivery Date:</strong>{" "}
                {loadData.deliveryDate || "11/17/2025"}
              </p>
              <p style={{ margin: "0" }}>
                <strong>Trailer #:</strong> {loadData.trailer}
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Seal #:</strong> {Math.random().toString().slice(2, 10)}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Temperature:</strong> {loadData.temperature || "0.00°F"}
              </p>
              <p style={{ margin: "0" }}>
                <strong>Equipment:</strong>{" "}
                {loadData.equipmentType || "Reefer - Continuous"}
              </p>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div
          style={{
            border: "1px solid #cccccc",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "2px solid #000000",
              paddingBottom: "5px",
              margin: "0 0 15px 0",
            }}
          >
            SHIPMENT DETAILS
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Quantity
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Weight
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Packaging
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                  }}
                >
                  {loadData.commodity || "Pallets"}
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                  }}
                >
                  {loadData.quantity}
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                  }}
                >
                  {loadData.weight} lbs
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                  }}
                >
                  Palletized
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f9f9f9" }}>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Total
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    fontWeight: "bold",
                  }}
                >
                  {loadData.quantity}
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    fontWeight: "bold",
                  }}
                >
                  {loadData.weight} lbs
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                  }}
                >
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Special Instructions */}
        <div
          style={{
            border: "1px solid #cccccc",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "2px solid #000000",
              paddingBottom: "5px",
              margin: "0 0 10px 0",
            }}
          >
            SPECIAL INSTRUCTIONS
          </h3>
          <ul
            style={{
              fontSize: "12px",
              paddingLeft: "20px",
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            <li style={{ marginBottom: "3px" }}>
              {loadData.pickupInstructions || "Live Unload at delivery"}
            </li>
            <li style={{ marginBottom: "3px" }}>
              Temperature must be maintained at{" "}
              {loadData.temperature || "0.00°F"}
            </li>
            <li style={{ marginBottom: "3px" }}>
              Single chute on all produce loads
            </li>
            <li style={{ marginBottom: "3px" }}>
              Trailer must be clean and odorless
            </li>
            <li style={{ marginBottom: "3px" }}>
              Secure with at least 4 load lock bars
            </li>
            <li style={{ marginBottom: "0" }}>Only receiver may break seal</li>
          </ul>
        </div>

        {/* Signatures */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid #cccccc",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                height: "60px",
                borderBottom: "1px solid #000000",
                marginBottom: "10px",
              }}
            ></div>
            <p
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                margin: "0 0 5px 0",
              }}
            >
              SHIPPER SIGNATURE
            </p>
            <p style={{ fontSize: "11px", color: "#666666", margin: "0" }}>
              Date: ______________
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                height: "60px",
                borderBottom: "1px solid #000000",
                marginBottom: "10px",
              }}
            ></div>
            <p
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                margin: "0 0 5px 0",
              }}
            >
              CARRIER SIGNATURE
            </p>
            <p style={{ fontSize: "11px", color: "#666666", margin: "0" }}>
              Date: ______________
            </p>
          </div>
        </div>
      </div>
    </PdfLayout>
  );
};

// ============================================================================
// LOAD SHEET PDF TEMPLATE
// ============================================================================

export const LoadSheetPdfTemplate = ({ loadData }: { loadData: LoadData }) => {
  return (
    <PdfLayout
      title="LOAD SHEET"
      footerText="FOR INTERNAL USE ONLY"
      showPageNumber={false}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Quick Info Banner */}
        <div
          style={{
            backgroundColor: "#1f2937",
            color: "#ffffff",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              textAlign: "center",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  margin: "0 0 3px 0",
                  opacity: "0.8",
                }}
              >
                LOAD #
              </p>
              <p style={{ fontSize: "18px", fontWeight: "bold", margin: "0" }}>
                {loadData.loadNumber}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  margin: "0 0 3px 0",
                  opacity: "0.8",
                }}
              >
                STATUS
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0",
                  color: "#10b981",
                }}
              >
                {loadData.status}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  margin: "0 0 3px 0",
                  opacity: "0.8",
                }}
              >
                REVENUE
              </p>
              <p style={{ fontSize: "18px", fontWeight: "bold", margin: "0" }}>
                {loadData.revenue}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  margin: "0 0 3px 0",
                  opacity: "0.8",
                }}
              >
                PROFIT
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0",
                  color: "#10b981",
                }}
              >
                {loadData.profit}
              </p>
            </div>
          </div>
        </div>

        {/* Dispatch Information Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "15px",
          }}
        >
          {/* Dispatch Info */}
          <div
            style={{
              border: "1px solid #cccccc",
              padding: "12px",
              borderRadius: "4px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                borderBottom: "1px solid #cccccc",
                paddingBottom: "5px",
                margin: "0 0 10px 0",
              }}
            >
              DISPATCH INFO
            </h3>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Carrier:</strong> {loadData.carrier}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Truck:</strong> {loadData.truck}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Trailer:</strong> {loadData.trailer}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Driver:</strong> {loadData.driver}
              </p>
              <p style={{ margin: "0" }}>
                <strong>Dispatcher:</strong> {loadData.dispatcher}
              </p>
            </div>
          </div>

          {/* Load Details */}
          <div
            style={{
              border: "1px solid #cccccc",
              padding: "12px",
              borderRadius: "4px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                borderBottom: "1px solid #cccccc",
                paddingBottom: "5px",
                margin: "0 0 10px 0",
              }}
            >
              LOAD DETAILS
            </h3>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Customer:</strong> {loadData.customer}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Commodity:</strong> {loadData.commodity}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Van Type:</strong> {loadData.vanType}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Length:</strong> {loadData.length}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Weight:</strong> {loadData.weight} lbs
              </p>
              <p style={{ margin: "0" }}>
                <strong>Quantity:</strong> {loadData.quantity}
              </p>
            </div>
          </div>

          {/* Financials */}
          <div
            style={{
              border: "1px solid #cccccc",
              padding: "12px",
              borderRadius: "4px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                borderBottom: "1px solid #cccccc",
                paddingBottom: "5px",
                margin: "0 0 10px 0",
              }}
            >
              FINANCIALS
            </h3>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Rate:</strong> {loadData.primaryFees}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Rate Type:</strong> {loadData.feeType}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Rate/Mile:</strong> {loadData.ratePerMile}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Loaded Miles:</strong> {loadData.loadedMiles}
              </p>
              <p style={{ margin: "0" }}>
                <strong>Tendered Miles:</strong> {loadData.tenderedMiles}
              </p>
            </div>
          </div>
        </div>

        {/* Stops Timeline */}
        <div
          style={{
            border: "1px solid #cccccc",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              borderBottom: "1px solid #cccccc",
              paddingBottom: "5px",
              margin: "0 0 15px 0",
            }}
          >
            STOPS TIMELINE
          </h3>
          <div style={{ position: "relative" }}>
            {/* Timeline line */}
            <div
              style={{
                position: "absolute",
                left: "25px",
                top: "0",
                bottom: "0",
                width: "2px",
                backgroundColor: "#3b82f6",
                zIndex: "1",
              }}
            ></div>

            {/* Stop 1 - Pickup */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                marginBottom: "20px",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: "10",
                  flexShrink: "0",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>1</span>
              </div>
              <div
                style={{
                  marginLeft: "15px",
                  flex: "1",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  padding: "12px",
                  backgroundColor: "#f0fdf4",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#065f46",
                      margin: "0",
                    }}
                  >
                    PICKUP
                  </h4>
                  <span
                    style={{
                      backgroundColor: "#d1fae5",
                      color: "#065f46",
                      fontSize: "10px",
                      fontWeight: "bold",
                      padding: "3px 8px",
                      borderRadius: "12px",
                    }}
                  >
                    COMPLETED
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    margin: "0 0 5px 0",
                  }}
                >
                  FREEZE N STORE
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    margin: "0 0 10px 0",
                    color: "#666666",
                  }}
                >
                  311 West Sunset Avenue, Springdale, AR 72764
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    fontSize: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <div>
                    <p style={{ color: "#666666", margin: "0 0 2px 0" }}>
                      Date/Time:
                    </p>
                    <p style={{ fontWeight: "bold", margin: "0" }}>
                      01/17/2025 09:00-21:00
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#666666", margin: "0 0 2px 0" }}>
                      Contact:
                    </p>
                    <p style={{ fontWeight: "bold", margin: "0" }}>
                      Warehouse Manager
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#666666", margin: "0 0 2px 0" }}>
                      Temperature:
                    </p>
                    <p
                      style={{
                        fontWeight: "bold",
                        margin: "0",
                        color: "#dc2626",
                      }}
                    >
                      -10°F
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      margin: "0 0 3px 0",
                    }}
                  >
                    Instructions:
                  </p>
                  <p style={{ fontSize: "10px", margin: "0" }}>
                    Check in at Guard Shack. PU/SO #: 143547, 143597
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PdfLayout>
  );
};

// ============================================================================
// DRIVER SHEET PDF TEMPLATE
// ============================================================================

export const DriverSheetPdfTemplate = ({
  loadData,
}: {
  loadData: LoadData;
}) => {
  return (
    <PdfLayout
      title="DRIVER SHEET"
      footerText="DRIVER COPY - KEEP IN TRUCK"
      showPageNumber={false}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* Driver Information Banner */}
        <div
          style={{
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  margin: "0 0 3px 0",
                  opacity: "0.8",
                }}
              >
                DRIVER NAME
              </p>
              <p style={{ fontSize: "20px", fontWeight: "bold", margin: "0" }}>
                {loadData.driver}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  margin: "0 0 3px 0",
                  opacity: "0.8",
                }}
              >
                LOAD #
              </p>
              <p style={{ fontSize: "20px", fontWeight: "bold", margin: "0" }}>
                {loadData.loadNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Reference Card */}
        <div
          style={{
            backgroundColor: "#fef3c7",
            border: "2px solid #f59e0b",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              textAlign: "center",
              margin: "0 0 10px 0",
              color: "#92400e",
            }}
          >
            QUICK REFERENCE
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              textAlign: "center",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  margin: "0 0 3px 0",
                  color: "#92400e",
                }}
              >
                LOAD #
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0",
                  color: "#000000",
                }}
              >
                {loadData.loadNumber}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  margin: "0 0 3px 0",
                  color: "#92400e",
                }}
              >
                TRAILER #
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0",
                  color: "#000000",
                }}
              >
                {loadData.trailer}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  margin: "0 0 3px 0",
                  color: "#92400e",
                }}
              >
                SEAL #
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0",
                  color: "#000000",
                }}
              >
                {Math.random().toString().slice(2, 10)}
              </p>
            </div>
          </div>
        </div>

        {/* Equipment Details */}
        <div
          style={{
            border: "1px solid #cccccc",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              borderBottom: "1px solid #cccccc",
              paddingBottom: "5px",
              margin: "0 0 10px 0",
            }}
          >
            EQUIPMENT DETAILS
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "15px",
              fontSize: "12px",
            }}
          >
            <div>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Truck #:</strong> {loadData.truck}
              </p>
              <p style={{ margin: "0" }}>
                <strong>Trailer #:</strong> {loadData.trailer}
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Type:</strong> {loadData.vanType}
              </p>
              <p style={{ margin: "0" }}>
                <strong>Length:</strong> {loadData.length}
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Weight:</strong> {loadData.weight} lbs
              </p>
              <p style={{ margin: "0" }}>
                <strong>Temperature:</strong> {loadData.temperature || "0.00°F"}
              </p>
            </div>
          </div>
        </div>

        {/* Emergency & Contacts */}
        <div
          style={{
            border: "1px solid #cccccc",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              borderBottom: "1px solid #cccccc",
              paddingBottom: "5px",
              margin: "0 0 10px 0",
            }}
          >
            EMERGENCY & CONTACTS
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              fontSize: "12px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#dc2626",
                  margin: "0 0 5px 0",
                }}
              >
                DISPATCH
              </p>
              <p style={{ margin: "0 0 3px 0" }}>{loadData.dispatcher}</p>
              <p style={{ margin: "0 0 3px 0" }}>Phone: (XXX) XXX-XXXX</p>
              <p style={{ margin: "0" }}>Available: 24/7</p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#dc2626",
                  margin: "0 0 5px 0",
                }}
              >
                CARRIER
              </p>
              <p style={{ margin: "0 0 3px 0" }}>{loadData.carrier}</p>
              <p style={{ margin: "0 0 3px 0" }}>Satbir Rai: 661-487-3531</p>
              <p style={{ margin: "0" }}>Emergency: 911</p>
            </div>
          </div>
        </div>
      </div>
    </PdfLayout>
  );
};

// ============================================================================
// PROOF OF DELIVERY PDF TEMPLATE
// ============================================================================

export const ProofOfDeliveryPdfTemplate = ({
  loadData,
}: {
  loadData: LoadData;
}) => {
  return (
    <PdfLayout
      title="PROOF OF DELIVERY"
      footerText={`POD #${loadData.loadNumber}`}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Delivery Confirmation */}
        <div
          style={{
            border: "2px solid #10b981",
            padding: "20px",
            borderRadius: "4px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#10b981",
              margin: "0 0 10px 0",
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#065f46",
              margin: "0 0 5px 0",
            }}
          >
            DELIVERY CONFIRMED
          </h2>
          <p style={{ fontSize: "14px", color: "#666666", margin: "0" }}>
            Load #{loadData.loadNumber} successfully delivered
          </p>
        </div>

        {/* Delivery Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div
            style={{
              border: "1px solid #cccccc",
              padding: "12px",
              borderRadius: "4px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                borderBottom: "1px solid #cccccc",
                paddingBottom: "5px",
                margin: "0 0 10px 0",
              }}
            >
              DELIVERY INFORMATION
            </h3>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Receiver:</strong> Technology Center
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Address:</strong> Technology Drive, Future Products, CA
                90210
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Date Received:</strong> 01/17/2025
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Time Received:</strong> 09:15 AM
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Received By:</strong> John Doe
              </p>
              <p style={{ margin: "0" }}>
                <strong>Receiver Title:</strong> Warehouse Supervisor
              </p>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #cccccc",
              padding: "12px",
              borderRadius: "4px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                borderBottom: "1px solid #cccccc",
                paddingBottom: "5px",
                margin: "0 0 10px 0",
              }}
            >
              LOAD DETAILS
            </h3>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Load #:</strong> {loadData.loadNumber}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>BOL #:</strong> {loadData.bolNumber || "1495378"}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Carrier:</strong> {loadData.carrier}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Driver:</strong> {loadData.driver}
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Trailer #:</strong> {loadData.trailer}
              </p>
              <p style={{ margin: "0" }}>
                <strong>Seal #:</strong> {Math.random().toString().slice(2, 10)}
              </p>
            </div>
          </div>
        </div>

        {/* Product Received Table */}
        <div
          style={{
            border: "1px solid #cccccc",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              borderBottom: "1px solid #cccccc",
              paddingBottom: "5px",
              margin: "0 0 10px 0",
            }}
          >
            PRODUCT RECEIVED
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Quantity Ordered
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Quantity Received
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Condition
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  {loadData.commodity || "Pallets"}
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  {loadData.quantity}
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  {loadData.quantity}
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  Good
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  All pallets received
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f9f9f9" }}>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Total
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    fontWeight: "bold",
                  }}
                >
                  {loadData.quantity}
                </td>
                <td
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    fontWeight: "bold",
                  }}
                >
                  {loadData.quantity}
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  -
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div
          style={{
            border: "1px solid #cccccc",
            padding: "20px",
            borderRadius: "4px",
            marginTop: "20px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "1px solid #cccccc",
              paddingBottom: "10px",
              margin: "0 0 20px 0",
              textAlign: "center",
            }}
          >
            SIGNATURES
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "40px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  margin: "0 0 15px 0",
                }}
              >
                RECEIVER SIGNATURE
              </h4>
              <div
                style={{
                  height: "80px",
                  borderBottom: "1px solid #000000",
                  marginBottom: "10px",
                }}
              ></div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  margin: "0 0 5px 0",
                }}
              >
                John Doe
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "#666666",
                  margin: "0 0 5px 0",
                }}
              >
                Warehouse Supervisor
              </p>
              <p style={{ fontSize: "11px", color: "#666666", margin: "0" }}>
                Date: 01/17/2025 Time: 09:15 AM
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  margin: "0 0 15px 0",
                }}
              >
                CARRIER SIGNATURE
              </h4>
              <div
                style={{
                  height: "80px",
                  borderBottom: "1px solid #000000",
                  marginBottom: "10px",
                }}
              ></div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  margin: "0 0 5px 0",
                }}
              >
                {loadData.driver}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "#666666",
                  margin: "0 0 5px 0",
                }}
              >
                Driver
              </p>
              <p style={{ fontSize: "11px", color: "#666666", margin: "0" }}>
                Date: 01/17/2025 Time: 09:15 AM
              </p>
            </div>
          </div>
        </div>
      </div>
    </PdfLayout>
  );
};

// ============================================================================
// INSURANCE CERTIFICATE PDF TEMPLATE
// ============================================================================

export const InsuranceCertificatePdfTemplate = ({
  loadData,
}: {
  loadData: LoadData;
}) => {
  return (
    <PdfLayout
      title="CERTIFICATE OF INSURANCE"
      footerText={`COI #INS-2025-${loadData.loadNumber}`}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Insurance Header */}
        <div
          style={{
            border: "4px solid #3b82f6",
            padding: "20px",
            borderRadius: "4px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1d4ed8",
              margin: "0 0 10px 0",
            }}
          >
            CERTIFICATE OF INSURANCE
          </h2>
          <p style={{ fontSize: "14px", color: "#666666", margin: "0" }}>
            This certificate is issued as a matter of information only
          </p>
        </div>

        {/* Parties Information */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div
            style={{
              border: "1px solid #cccccc",
              padding: "12px",
              borderRadius: "4px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                borderBottom: "1px solid #cccccc",
                paddingBottom: "5px",
                margin: "0 0 10px 0",
              }}
            >
              INSURED
            </h3>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Name:</strong> S. S. B TRANSPORT INC.
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Address:</strong> 4203 Waterfall Canyon Dr
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>City, State, ZIP:</strong> Bakersfield, CA 93313
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>MC #:</strong> MC464064
              </p>
              <p style={{ margin: "0" }}>
                <strong>DOT #:</strong> 1145681
              </p>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #cccccc",
              padding: "12px",
              borderRadius: "4px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                borderBottom: "1px solid #cccccc",
                paddingBottom: "5px",
                margin: "0 0 10px 0",
              }}
            >
              ADDITIONAL INSURED
            </h3>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Name:</strong> Western Enterprises Brokerage Inc
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>Address:</strong> 5374 North Barcus Avenue
              </p>
              <p style={{ margin: "0 0 5px 0" }}>
                <strong>City, State, ZIP:</strong> Fresno, CA 93722
              </p>
              <p style={{ margin: "0" }}>
                <strong>Certificate Holder:</strong> Yes
              </p>
            </div>
          </div>
        </div>

        {/* Coverage Summary */}
        <div
          style={{
            border: "1px solid #cccccc",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              borderBottom: "1px solid #cccccc",
              paddingBottom: "5px",
              margin: "0 0 10px 0",
            }}
          >
            COVERAGES PROVIDED
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Type of Insurance
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Policy Number
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Effective Date
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Expiration Date
                </th>
                <th
                  style={{
                    border: "1px solid #cccccc",
                    padding: "8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Limits
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  Auto Liability
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  AUTO-2025-464064
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  01/01/2025
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  12/31/2025
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  $1,000,000
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  Cargo Insurance
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  CARGO-2025-464064
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  01/01/2025
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  12/31/2025
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  $100,000
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  General Liability
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  GL-2025-464064
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  01/01/2025
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  12/31/2025
                </td>
                <td style={{ border: "1px solid #cccccc", padding: "8px" }}>
                  $1,000,000
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            border: "1px solid #cccccc",
            padding: "12px",
            borderRadius: "4px",
            backgroundColor: "#fef3c7",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              borderBottom: "1px solid #cccccc",
              paddingBottom: "5px",
              margin: "0 0 10px 0",
            }}
          >
            DISCLAIMER
          </h3>
          <p
            style={{
              fontSize: "10px",
              fontStyle: "italic",
              lineHeight: "1.5",
              margin: "0",
            }}
          >
            This certificate is issued as a matter of information only and
            confers no rights upon the certificate holder. This certificate does
            not amend, extend or alter the coverage afforded by the policies
            below. The insurance afforded by the policies described herein is
            subject to all the terms, exclusions and conditions of such
            policies.
          </p>
        </div>
      </div>
    </PdfLayout>
  );
};
