"use client";

import { use, useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
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

  const handlePrint = async () => {
    if (!printRef.current) return;

    // Hide elements with "no-print" class
    const elementsToHide = printRef.current.querySelectorAll(".no-print");
    elementsToHide.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    // Capture the canvas
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
    });

    // Restore hidden elements
    elementsToHide.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Record_details${record?.invoice}.pdf`);
  };

  if (!record) {
    return <div className="p-6 text-red-500">No record found.</div>;
  }

  // return (
  //   <div
  //     className="p-12 flex justify-center  items-center min-h-screen "
  //     ref={printRef}
  //   >
  //     {/* <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6"> */}
  //     <div className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-6">
  //       <h2 className="text-4xl flex items-center justify-center font-semibold text-gray-800 border-b pb-3 mb-4">
  //         Record Details
  //       </h2>

  //       <div className="space-y-3 text-gray-700 m-8">
  //         <p className="flex justify-between">
  //           <span className="font-medium text-xl">Vehicle Number:</span>
  //           <span className="text-xl">
  //             {record.vehicleDetails.vehicleNumber || "N/A"}
  //           </span>
  //         </p>
  //         <p className="flex justify-between">
  //           <span className="font-medium text-xl">Company Name:</span>
  //           <span className="text-xl">
  //             {record.vehicleDetails.companyName || "N/A"}
  //           </span>
  //         </p>

  //         <p className="flex justify-between">
  //           <span className="font-medium text-xl">Invoice Number:</span>
  //           <span className="text-xl">{record.invoice || "N/A"}</span>
  //         </p>
  //         <p className="flex justify-between">
  //           <span className="font-medium text-xl">Date:</span>
  //           <span className="text-xl">
  //             {new Date(record.date).toLocaleDateString()}
  //           </span>
  //         </p>
  //         <p className="flex justify-between">
  //           <span className="font-medium text-xl">Workshop Name:</span>
  //           <span className="text-xl">{record.workshopName}</span>
  //         </p>
  //         <p className="flex justify-between">
  //           <span className="font-medium text-xl">Miles/Hours:</span>
  //           <span className="text-xl">{record.miles}</span>
  //         </p>
  //       </div>

  //       <h3 className="text-lg font-semibold text-gray-800 mt-5 m-8">
  //         Services
  //       </h3>
  //       <div className="mt-3 border rounded-lg p-3 bg-gray-50 m-8">
  //         {record.services
  //           .sort((a, b) => a.serviceName.localeCompare(b.serviceName))
  //           .map((service) => (
  //             <div
  //               key={service.serviceId}
  //               className="p-3 border-b last:border-none flex justify-between"
  //             >
  //               <span className="font-medium">{service.serviceName}</span>
  //               {service.nextNotificationValue !== 0 ? (
  //                 <span className="text-gray-600 text-sm">
  //                   {service.nextNotificationValue}
  //                 </span>
  //               ) : (
  //                 <span className="text-gray-400 text-sm">—</span> // or leave it empty
  //               )}
  //             </div>
  //           ))}
  //       </div>

  //       <div className="flex justify-center">
  //         <button
  //           onClick={handlePrint}
  //           className="w-full max-w-sm no-print mt-6 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center justify-center content-center gap-2 shadow-md hover:bg-red-600 transition"
  //         >
  //           <FaPrint /> Print
  //         </button>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <div
      className="p-12 flex justify-center items-center min-h-screen"
      ref={printRef}
    >
      <div className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-4xl flex items-center justify-center font-semibold text-gray-800 border-b pb-3 mb-4">
          Record Details
        </h2>

        <div className="space-y-3 text-gray-700 m-8">
          <div className="pb-3 border-b">
            <p className="flex justify-between">
              <span className="font-medium text-xl">Vehicle Number:</span>
              <span className="text-xl">
                {record.vehicleDetails.vehicleNumber || "N/A"}
              </span>
            </p>
          </div>

          <div className="pb-3 border-b">
            <p className="flex justify-between">
              <span className="font-medium text-xl">Company Name:</span>
              <span className="text-xl">
                {record.vehicleDetails.companyName || "N/A"}
              </span>
            </p>
          </div>

          <div className="pb-3 border-b">
            <p className="flex justify-between">
              <span className="font-medium text-xl">Invoice Number:</span>
              <span className="text-xl">{record.invoice || "N/A"}</span>
            </p>
          </div>

          <div className="pb-3 border-b">
            <p className="flex justify-between">
              <span className="font-medium text-xl">Date:</span>
              <span className="text-xl">
                {new Date(record.date).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="pb-3 border-b">
            <p className="flex justify-between">
              <span className="font-medium text-xl">Workshop Name:</span>
              <span className="text-xl">{record.workshopName}</span>
            </p>
          </div>

          <div className="pb-3 border-b">
            <p className="flex justify-between">
              <span className="font-medium text-xl">Miles/Hours:</span>
              <span className="text-xl">{record.miles}</span>
            </p>
          </div>
        </div>

        <h3 className="text-2xl font-semibold text-gray-800 mt-8 m-8 border-b pb-2">
          Services
        </h3>
        <div className="mt-3 border rounded-lg p-3 bg-gray-50 m-8">
          {record.services
            .sort((a, b) => a.serviceName.localeCompare(b.serviceName))
            .map((service) => (
              <div
                key={service.serviceId}
                className="p-3 border-b last:border-none flex justify-between"
              >
                <span className="font-medium text-lg">
                  {service.serviceName}
                </span>
                {service.nextNotificationValue !== 0 ? (
                  <span className="text-gray-600">
                    {service.nextNotificationValue}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            ))}
        </div>

        {/* Added Description Section */}
        {record.description ? (
          <div className="mt-8 m-8">
            <h3 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">
              Description
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg border">
              {record.description ? (
                <p className="text-gray-700 text-lg">{record.description}</p>
              ) : (
                <p className="text-gray-400 italic">No description provided</p>
              )}
            </div>
          </div>
        ) : (
          <div></div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handlePrint}
            className="w-full max-w-sm no-print mt-6 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center justify-center content-center gap-2 shadow-md hover:bg-red-600 transition"
          >
            <FaPrint /> Print
          </button>
        </div>
      </div>
    </div>
  );
}
