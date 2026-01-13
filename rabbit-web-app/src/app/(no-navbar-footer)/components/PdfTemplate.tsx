/* eslint-disable @next/next/no-img-element */
// components/pdf/PdfTemplates.tsx
"use client";

import React from "react";
import { LoadData } from "../interface/loaddata";

// --- Common PDF Layout Component ---
interface PdfLayoutProps {
  title: string;
  children: React.ReactNode;
  logoUrl?: string;
  footerText?: string;
}

export const PdfLayout = ({
  title,
  children,
  logoUrl,
  footerText,
}: PdfLayoutProps) => {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  return (
    <div className="pdf-container p-8 min-h-screen bg-white text-gray-900">
      {/* Header */}
      <div className="pdf-header border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">
              Document ID: {Date.now().toString().slice(-8)}
            </p>
          </div>
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" className="h-16" />
          ) : (
            <div className="text-right">
              <p className="font-bold text-lg">WESTERN ENTERPRISES</p>
              <p className="text-sm">BROKERAGE INC</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 text-sm">
          <div>
            <p>
              <strong>Generated:</strong> {currentDate} at {currentTime}
            </p>
          </div>
          <div className="text-right">
            <p>
              <strong>Page:</strong> 1 of 1
            </p>
            <p className="text-xs text-gray-500">CONFIDENTIAL</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pdf-content">{children}</div>

      {/* Footer */}
      <div className="pdf-footer border-t-2 border-gray-800 pt-4 mt-8 fixed bottom-0 left-0 right-0 bg-white p-8">
        <div className="flex justify-between text-xs text-gray-600">
          <div>
            <p>Western Enterprises Brokerage Inc</p>
            <p>5374 North Barcus Avenue, Fresno, CA 93722</p>
            <p>Phone: 559-824-2380 | Email: brokerage@westernert.com</p>
          </div>
          <div className="text-right">
            <p>MC#: 1417403 | DOT Number: 3871269</p>
            <p>
              {footerText || "© 2025 Western Enterprises. All rights reserved."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- BOL (Bill of Lading) PDF ---
export const BolPdfTemplate = ({ loadData }: { loadData: LoadData }) => {
  return (
    <PdfLayout title="BILL OF LADING" footerText="ORIGINAL - NOT NEGOTIABLE">
      <div className="space-y-6">
        {/* Shipper and Consignee Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-300 p-4 rounded">
            <h3 className="font-bold text-lg border-b pb-2 mb-3">SHIPPER</h3>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> FREEZE N STORE
              </p>
              <p>
                <strong>Address:</strong> 311 West Sunset Avenue
              </p>
              <p>
                <strong>City, State, ZIP:</strong> Springdale, AR 72764
              </p>
              <p>
                <strong>Contact:</strong> Warehouse Manager
              </p>
            </div>
          </div>

          <div className="border border-gray-300 p-4 rounded">
            <h3 className="font-bold text-lg border-b pb-2 mb-3">CONSIGNEE</h3>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> Sysco Food Service - Las Vegas
              </p>
              <p>
                <strong>Address:</strong> 6201 East Centennial Parkway
              </p>
              <p>
                <strong>City, State, ZIP:</strong> Las Vegas, NV 89115
              </p>
              <p>
                <strong>Contact:</strong> Receiving Department
              </p>
            </div>
          </div>
        </div>

        {/* Load Information */}
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="font-bold text-lg border-b pb-2 mb-3">
            LOAD INFORMATION
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p>
                <strong>BOL #:</strong> {loadData.bolNumber || "1495378"}
              </p>
              <p>
                <strong>Load #:</strong> {loadData.loadNumber}
              </p>
              <p>
                <strong>PO #:</strong>{" "}
                {loadData.poNumbers?.join(", ") || "26420580, 26437650"}
              </p>
            </div>
            <div>
              <p>
                <strong>Pickup Date:</strong>{" "}
                {loadData.pickupDate || "11/15/2025"}
              </p>
              <p>
                <strong>Delivery Date:</strong>{" "}
                {loadData.deliveryDate || "11/17/2025"}
              </p>
              <p>
                <strong>Trailer #:</strong> {loadData.trailer}
              </p>
            </div>
            <div>
              <p>
                <strong>Seal #:</strong> {Math.random().toString().slice(2, 10)}
              </p>
              <p>
                <strong>Temperature:</strong> {loadData.temperature || "0.00°F"}
              </p>
              <p>
                <strong>Equipment:</strong>{" "}
                {loadData.equipmentType || "Reefer - Continuous"}
              </p>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="font-bold text-lg border-b pb-2 mb-3">
            SHIPMENT DETAILS
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">
                  Description
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Quantity
                </th>
                <th className="border border-gray-300 p-2 text-left">Weight</th>
                <th className="border border-gray-300 p-2 text-left">
                  Packaging
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">
                  {loadData.commodity || "Pallets"}
                </td>
                <td className="border border-gray-300 p-2">
                  {loadData.quantity}
                </td>
                <td className="border border-gray-300 p-2">
                  {loadData.weight} lbs
                </td>
                <td className="border border-gray-300 p-2">Palletized</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 font-bold">Total</td>
                <td className="border border-gray-300 p-2 font-bold">
                  {loadData.quantity}
                </td>
                <td className="border border-gray-300 p-2 font-bold">
                  {loadData.weight} lbs
                </td>
                <td className="border border-gray-300 p-2">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Special Instructions */}
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="font-bold text-lg border-b pb-2 mb-3">
            SPECIAL INSTRUCTIONS
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{loadData.pickupInstructions || "Live Unload at delivery"}</li>
            <li>
              Temperature must be maintained at{" "}
              {loadData.temperature || "0.00°F"}
            </li>
            <li>Single chute on all produce loads</li>
            <li>Trailer must be clean and odorless</li>
            <li>Secure with at least 4 load lock bars</li>
            <li>Only receiver may break seal</li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t">
          <div className="text-center">
            <div className="h-20 border-b border-gray-400 mb-2"></div>
            <p className="font-bold">SHIPPER SIGNATURE</p>
            <p className="text-sm text-gray-600">Date: ______________</p>
          </div>
          <div className="text-center">
            <div className="h-20 border-b border-gray-400 mb-2"></div>
            <p className="font-bold">CARRIER SIGNATURE</p>
            <p className="text-sm text-gray-600">Date: ______________</p>
          </div>
        </div>
      </div>
    </PdfLayout>
  );
};

// --- Rate Confirmation PDF ---
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
      <div className="space-y-6">
        {/* Carrier Information */}
        <div className="border border-gray-300 p-4 rounded bg-blue-50">
          <h3 className="font-bold text-lg border-b pb-2 mb-3">
            CARRIER INFORMATION
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Carrier:</strong> {loadData.carrier}
              </p>
              <p>
                <strong>MC #:</strong> MC464064
              </p>
              <p>
                <strong>DOT #:</strong> 1145681
              </p>
            </div>
            <div>
              <p>
                <strong>Primary Contact:</strong> Satbir Rai
              </p>
              <p>
                <strong>Phone:</strong> 661-487-3531
              </p>
              <p>
                <strong>Email:</strong> Ssbtransportinc661@yahoo.com
              </p>
              <p>
                <strong>Driver:</strong> {loadData.driver}
              </p>
            </div>
          </div>
        </div>

        {/* Rate Details */}
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="font-bold text-lg border-b pb-2 mb-3">RATE DETAILS</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">
                  Description
                </th>
                <th className="border border-gray-300 p-2 text-left">Type</th>
                <th className="border border-gray-300 p-2 text-left">Rate</th>
                <th className="border border-gray-300 p-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">Freight Charges</td>
                <td className="border border-gray-300 p-2">
                  {loadData.feeType}
                </td>
                <td className="border border-gray-300 p-2">
                  {loadData.primaryFees}
                </td>
                <td className="border border-gray-300 p-2">
                  {loadData.primaryFees}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2" colSpan={3}>
                  <strong>GRAND TOTAL</strong>
                </td>
                <td className="border border-gray-300 p-2 font-bold">
                  {loadData.primaryFees}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terms and Conditions */}
        <div className="border border-gray-300 p-4 rounded mt-6">
          <h3 className="font-bold text-lg border-b pb-2 mb-3">
            TERMS & CONDITIONS
          </h3>
          <div className="text-sm space-y-2">
            <p>
              <strong>Payment Terms:</strong> Standard 30 days after receiving
              paperwork
            </p>
            <p>
              <strong>Quick Pay:</strong> 3% discount for next day ACH
            </p>
            <p>
              <strong>Late Fee:</strong> $1000 for late truck
            </p>
            <p>
              <strong>Brokerage Fee:</strong> $1000 for loads brokered out
            </p>
            <p>
              <strong>Early Delivery:</strong> $1000 fine for delivery earlier
              than date on rate con
            </p>
            <p>
              <strong>Detention:</strong> NO Detention for any loads
            </p>
          </div>
        </div>
      </div>
    </PdfLayout>
  );
};

// --- Load Sheet PDF ---
export const LoadSheetPdfTemplate = ({ loadData }: { loadData: LoadData }) => {
  return (
    <PdfLayout title="LOAD SHEET" footerText="FOR INTERNAL USE ONLY">
      <div className="space-y-6">
        {/* Quick Info Banner */}
        <div className="bg-gray-800 text-white p-4 rounded">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs">LOAD #</p>
              <p className="font-bold text-lg">{loadData.loadNumber}</p>
            </div>
            <div>
              <p className="text-xs">STATUS</p>
              <p className="font-bold text-lg text-green-400">
                {loadData.status}
              </p>
            </div>
            <div>
              <p className="text-xs">REVENUE</p>
              <p className="font-bold text-lg">{loadData.revenue}</p>
            </div>
            <div>
              <p className="text-xs">PROFIT</p>
              <p className="font-bold text-lg text-green-400">
                {loadData.profit}
              </p>
            </div>
          </div>
        </div>

        {/* Dispatch Information */}
        <div className="grid grid-cols-3 gap-6">
          <div className="border border-gray-300 p-4 rounded">
            <h3 className="font-bold text-lg border-b pb-2 mb-3">
              DISPATCH INFO
            </h3>
            <div className="space-y-2">
              <p>
                <strong>Carrier:</strong> {loadData.carrier}
              </p>
              <p>
                <strong>Truck:</strong> {loadData.truck}
              </p>
              <p>
                <strong>Trailer:</strong> {loadData.trailer}
              </p>
              <p>
                <strong>Driver:</strong> {loadData.driver}
              </p>
              <p>
                <strong>Dispatcher:</strong> {loadData.dispatcher}
              </p>
            </div>
          </div>

          <div className="border border-gray-300 p-4 rounded">
            <h3 className="font-bold text-lg border-b pb-2 mb-3">
              LOAD DETAILS
            </h3>
            <div className="space-y-2">
              <p>
                <strong>Customer:</strong> {loadData.customer}
              </p>
              <p>
                <strong>Commodity:</strong> {loadData.commodity}
              </p>
              <p>
                <strong>Van Type:</strong> {loadData.vanType}
              </p>
              <p>
                <strong>Length:</strong> {loadData.length}
              </p>
              <p>
                <strong>Weight:</strong> {loadData.weight} lbs
              </p>
              <p>
                <strong>Quantity:</strong> {loadData.quantity}
              </p>
            </div>
          </div>

          <div className="border border-gray-300 p-4 rounded">
            <h3 className="font-bold text-lg border-b pb-2 mb-3">FINANCIALS</h3>
            <div className="space-y-3">
              <div>
                <p>
                  <strong>Rate:</strong> {loadData.primaryFees}
                </p>
                <p>
                  <strong>Rate Type:</strong> {loadData.feeType}
                </p>
                <p>
                  <strong>Rate/Mile:</strong> {loadData.ratePerMile}
                </p>
              </div>
              <div>
                <p>
                  <strong>Loaded Miles:</strong> {loadData.loadedMiles}
                </p>
                <p>
                  <strong>Tendered Miles:</strong> {loadData.tenderedMiles}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PdfLayout>
  );
};

// --- Driver Sheet PDF ---
export const DriverSheetPdfTemplate = ({
  loadData,
}: {
  loadData: LoadData;
}) => {
  return (
    <PdfLayout title="DRIVER SHEET" footerText="DRIVER COPY - KEEP IN TRUCK">
      <div className="space-y-6">
        {/* Driver Information Banner */}
        <div className="bg-blue-600 text-white p-4 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs">DRIVER NAME</p>
              <p className="font-bold text-xl">{loadData.driver}</p>
            </div>
            <div>
              <p className="text-xs">LOAD #</p>
              <p className="font-bold text-xl">{loadData.loadNumber}</p>
            </div>
          </div>
        </div>

        {/* Equipment Details */}
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="font-bold text-lg border-b pb-2 mb-3">
            EQUIPMENT DETAILS
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p>
                <strong>Truck #:</strong> {loadData.truck}
              </p>
              <p>
                <strong>Trailer #:</strong> {loadData.trailer}
              </p>
            </div>
            <div>
              <p>
                <strong>Type:</strong> {loadData.vanType}
              </p>
              <p>
                <strong>Length:</strong> {loadData.length}
              </p>
            </div>
            <div>
              <p>
                <strong>Weight:</strong> {loadData.weight} lbs
              </p>
              <p>
                <strong>Seal #:</strong> {Math.random().toString().slice(2, 10)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PdfLayout>
  );
};
