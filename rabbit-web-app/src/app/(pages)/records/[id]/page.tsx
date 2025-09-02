"use client";

import { use, useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContexts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FaPrint, FaTimes, FaSearchPlus, FaSearchMinus } from "react-icons/fa";
import Image from "next/image";
// import { parseISO, format } from "date-fns";

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
    nextNotificationValue: string;
    subServices: Array<{ name: string; id: string }>;
    type: string;
  }>;
  date: string;
  hours: number;
  miles: number;
  totalMiles: number;
  createdAt: string;
  workshopName: string;
  invoice?: string;
  description?: string;
  imageUrl?: string;
}

interface RecordData extends ServiceRecord {
  id: string;
  vehicle: string;
}

interface FormatDateFn {
  (value: string): string;
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageScale, setImageScale] = useState(1);

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

  const openImageModal = () => {
    setIsImageModalOpen(true);
    setImageScale(1);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const zoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.25, 3)); // Limit zoom to 3x
  };

  const zoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.25, 0.5)); // Limit zoom out to 0.5x
  };

  if (!record) {
    return <div className="p-6 text-red-500">No record found.</div>;
  }

  const formatDate: FormatDateFn = (value) => {
    if (!value || !value.includes("/")) return value;
    const [dd, mm, yyyy] = value.split("/");
    return `${mm}/${dd}/${yyyy}`;
  };

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
                {/* {new Date(record.date).toLocaleDateString()} */}
                {/* {format(parseISO(record.date), "MM/dd/yyyy")} */}
                {record.date}
              </span>
            </p>
          </div>

          <div className="pb-3 border-b">
            <p className="flex justify-between">
              <span className="font-medium text-xl">Workshop Name:</span>
              <span className="text-xl">{record.workshopName}</span>
            </p>
          </div>

          {record.vehicleDetails.companyName === "DRY VAN" ? (
            <div></div>
          ) : (
            <>
              <div className="pb-3 border-b">
                <p className="flex justify-between">
                  <span className="font-medium text-xl">Miles/Hours:</span>
                  <span className="text-xl">
                    {record.vehicleDetails.vehicleType == "Truck"
                      ? record.miles
                      : record.hours}
                  </span>
                </p>
              </div>
            </>
          )}
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
                className="p-3 border-b last:border-none"
              >
                <div className="flex justify-between">
                  <span className="font-medium text-lg">
                    {service.serviceName}
                  </span>
                  <span className="text-gray-400">
                    {service.defaultNotificationValue === 0
                      ? ""
                      : service.type === "day"
                      ? formatDate(service.nextNotificationValue)
                      : `${service.nextNotificationValue}`}
                  </span>
                </div>

                {/* Subservices section */}
                {service.subServices && service.subServices.length > 0 && (
                  <div className="mt-2 ml-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Subservices:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {service.subServices.map((subService) => (
                        <div
                          key={subService.id}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {subService.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Description Section */}
        {record.description && (
          <div className="mt-8 m-8">
            <h3 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">
              Description
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-gray-700 text-lg">{record.description}</p>
            </div>
          </div>
        )}

        {/* Image Display Section */}
        {record.imageUrl && (
          <div className="mt-8 m-8">
            <h3 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">
              Service Image
            </h3>
            <div
              className="relative w-full max-w-md mx-auto cursor-pointer hover:opacity-90 transition"
              onClick={openImageModal}
            >
              <Image
                src={record.imageUrl}
                alt="Service record"
                width={800}
                height={600}
                className="w-full h-auto rounded-lg border shadow-sm"
                objectFit="contain"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <div className="bg-black bg-opacity-50 text-white p-2 rounded-full">
                  <FaSearchPlus size={24} />
                </div>
              </div>
            </div>
          </div>
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

      {/* Image Modal */}
      {isImageModalOpen && record.imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-full max-h-full">
            <Image
              src={record.imageUrl}
              alt="Service record zoomed"
              width={1200}
              height={900}
              className="max-w-full max-h-[90vh]"
              style={{ transform: `scale(${imageScale})` }}
            />

            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={zoomIn}
                className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
                title="Zoom In"
              >
                <FaSearchPlus size={20} />
              </button>
              <button
                onClick={zoomOut}
                className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
                title="Zoom Out"
              >
                <FaSearchMinus size={20} />
              </button>
              <button
                onClick={closeImageModal}
                className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
                title="Close"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center text-white">
              <p>Zoom: {(imageScale * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
