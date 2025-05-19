"use client";

import { use, useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
// import {
//   Card,
//   CardContent,
//   Typography,
//   List,
//   ListItem,
//   ListItemText,
// } from "@mui/material";
import { useAuth } from "@/contexts/AuthContexts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FaPrint } from "react-icons/fa";

interface ServiceRecord {
  id: string;
  vehicleDetails: {
    vehicleNumber: string;
    vehicleType: string;
    companyName: string;
    engineNumber: string;
    currentMiles?: string;
    nextNotificationMiles?: Array<{
      serviceName: string;
      nextNotificationValue: number;
      subServices: string[];
    }>;
  };
  services: Array<{
    serviceId: string;
    serviceName: string;
    defaultNotificationValue: number;
    nextNotificationValue: number;
    subServices: Array<{ name: string; id: string }>;
  }>;
  date: string;
  hours: number;
  miles: number;
  totalMiles: number;
  createdAt: string;
  workshopName: string;
  invoice?: string;
  description?: string;
}

interface RecordData extends ServiceRecord {
  id: string;
  vehicle: string;
}

export default function RecordsDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const { user } = useAuth() || { user: null };
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid || !id) return;

    const recordsQuery = query(
      collection(db, "Users", user.uid, "DataServices")
    );

    const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
      const recordsData: RecordData[] = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        vehicle: doc.data().vehicleDetails.companyName,
      })) as RecordData[];

      const matchedRecord = recordsData.find((record) => record.id === id);
      setRecord(matchedRecord || null);
    });

    return () => unsubscribe();
  }, [user, id]);

  //print details
  const handlePrint = async () => {
    if (!printRef.current) return;

    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`Record_details${record?.invoice}.pdf`);
  };

  if (!record) {
    return <div className="p-6 text-red-500">No record found.</div>;
  }

  return (
    <div
      className="p-6 flex justify-center items-center min-h-screen bg-gray-100"
      ref={printRef}
    >
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 mb-4">
          Record Details
        </h2>

        <div className="space-y-3 text-gray-700">
          <p className="flex justify-between">
            <span className="font-medium">Invoice Number:</span>
            <span>{record.invoice || "N/A"}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-medium">Date:</span>
            <span>{new Date(record.date).toLocaleDateString()}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-medium">Workshop Name:</span>
            <span>{record.workshopName}</span>
          </p>
          <p className="flex justify-between">
            <span className="font-medium">Miles:</span>
            <span>{record.miles}</span>
          </p>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mt-5">Services</h3>
        <div className="mt-3 border rounded-lg p-3 bg-gray-50">
          {record.services.map((service) => (
            <div
              key={service.serviceId}
              className="p-3 border-b last:border-none flex justify-between"
            >
              <span className="font-medium">{service.serviceName}</span>
              <span className="text-gray-600 text-sm">
                Next: {service.nextNotificationValue}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handlePrint}
          className="mt-6 w-full bg-red-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-md hover:bg-red-600 transition"
        >
          <FaPrint /> Print
        </button>
      </div>
    </div>
  );
}
