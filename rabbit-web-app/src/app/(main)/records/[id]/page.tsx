"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContexts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  FaPrint,
  FaTimes,
  FaSearchPlus,
  FaSearchMinus,
  FaFilePdf,
  FaDownload,
  FaExternalLinkAlt,
  FaArrowLeft,
} from "react-icons/fa";
import Image from "next/image";
import { parseISO, format } from "date-fns";

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
  documentName?: string;
  fileType?: string;
  uploadedDocuments?: Array<{
    imageUrl: string;
    text: string;
    fileType?: string;
  }>;
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
  const router = useRouter();

  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const { user } = useAuth() || { user: null };
  const printRef = useRef<HTMLDivElement>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [activePdfDoc, setActivePdfDoc] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [activeImageDoc, setActiveImageDoc] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [effectiveUserId, setEffectiveUserId] = useState(""); // Add effectiveUserId state
  const [userRole, setUserRole] = useState(""); // Add user role state
  const [loading, setLoading] = useState(true); // Add loading state

  // Fetch user data and determine effectiveUserId
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || "");

          // Determine effectiveUserId based on role
          if (userData.role === "SubOwner" && userData.createdBy) {
            setEffectiveUserId(userData.createdBy);
            console.log(
              "SubOwner detected, using effectiveUserId:",
              userData.createdBy
            );
          } else {
            setEffectiveUserId(user.uid);
            console.log("Regular user, using own uid:", user.uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  // Update the records useEffect to use effectiveUserId
  useEffect(() => {
    if (!effectiveUserId || !id) return;

    const recordsQuery = query(
      collection(db, "Users", effectiveUserId, "DataServices") // Use effectiveUserId
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
  }, [effectiveUserId, id]); // Change dependency to effectiveUserId

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

  const allDocuments = useMemo(() => {
    if (!record) return [];
    if (record.uploadedDocuments && record.uploadedDocuments.length > 0) {
      return record.uploadedDocuments;
    }
    if (record.imageUrl) {
      const isPdf =
        record.imageUrl.toLowerCase().includes(".pdf") ||
        record.imageUrl.toLowerCase().includes("application%2fpdf") ||
        record.fileType === "pdf";
      return [
        {
          imageUrl: record.imageUrl,
          text:
            record.documentName ||
            (record.invoice ? `Invoice #${record.invoice}` : "Service Document"),
          fileType: isPdf ? "pdf" : "image",
        },
      ];
    }
    return [];
  }, [record]);

  const openImageModal = (url?: string, title?: string) => {
    const targetUrl = url || record?.imageUrl || "";
    if (!targetUrl) return;
    setActiveImageDoc({
      url: targetUrl,
      title:
        title ||
        (record?.invoice ? `Invoice #${record.invoice}` : "Service Document"),
    });
    setImageScale(1);
    setIsImageModalOpen(true);
  };

  const openPdfModal = (url: string, title?: string) => {
    setActivePdfDoc({
      url,
      title: title || "Document.pdf",
    });
    setIsPdfModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setActiveImageDoc(null);
  };

  const closePdfModal = () => {
    setIsPdfModalOpen(false);
    setActivePdfDoc(null);
  };

  const zoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.25, 3)); // Limit zoom to 3x
  };

  const zoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.25, 0.5)); // Limit zoom out to 0.5x
  };

  const getPdfFileName = (docTitle?: string) => {
    if (docTitle && docTitle.trim() !== "") {
      return docTitle.toLowerCase().endsWith(".pdf") ? docTitle : `${docTitle}.pdf`;
    }
    if (record?.documentName && record.documentName.trim() !== "") {
      return record.documentName.toLowerCase().endsWith(".pdf")
        ? record.documentName
        : `${record.documentName}.pdf`;
    }
    return record?.invoice
      ? `invoice_${record.invoice}.pdf`
      : "service_document.pdf";
  };

  const handleDownloadFile = async (
    url: string,
    filename: string,
    isPdf: boolean
  ) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const downloadName =
        filename.toLowerCase().endsWith(".pdf") ||
        filename.toLowerCase().endsWith(".jpg") ||
        filename.toLowerCase().endsWith(".png")
          ? filename
          : isPdf
          ? `${filename}.pdf`
          : `${filename}.jpg`;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      console.error("Direct download fetch failed, trying download anchor:", e);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handlePrintImage = (imageUrl?: string) => {
    if (!imageUrl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Document</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #fff;
            }
            img {
              max-width: 100%;
              max-height: 98vh;
              object-fit: contain;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" onload="setTimeout(function(){ window.focus(); window.print(); window.close(); }, 300);" onerror="window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Update loading checks
  if (!user) {
    return (
      <div className="p-6 text-red-500">
        Please log in to view record details.
      </div>
    );
  }

  // Add loading check for effectiveUserId
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading record details...</div>
      </div>
    );
  }

  if (!record) {
    return <div className="p-6 text-red-500">No record found.</div>;
  }

  const formatDateSafe = (dateStr?: string | null): string => {
    if (!dateStr) return "";
    try {
      const trimmed = String(dateStr).trim();
      if (!trimmed) return "";

      if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
        const parts = trimmed.includes("-") ? trimmed.split("-") : trimmed.split("/");
        const p0 = Number(parts[0]);
        const p1 = Number(parts[1]);
        const yyyy = parts[2];
        if (p0 > 12) {
          return `${String(p1).padStart(2, "0")}-${String(p0).padStart(2, "0")}-${yyyy}`;
        }
        return `${String(p0).padStart(2, "0")}-${String(p1).padStart(2, "0")}-${yyyy}`;
      }

      // Try parseISO
      const isoParsed = parseISO(trimmed);
      if (!isNaN(isoParsed.getTime())) {
        return format(isoParsed, "MM-dd-yyyy");
      }

      // Try new Date
      const fallback = new Date(trimmed);
      if (!isNaN(fallback.getTime())) {
        return format(fallback, "MM-dd-yyyy");
      }

      return trimmed;
    } catch {
      return dateStr ? String(dateStr) : "";
    }
  };

  return (
    <div
      className="p-12 flex justify-center items-center min-h-screen"
      ref={printRef}
    >
      {/* Role Indicator */}
      {userRole === "SubOwner" && (
        <div className="absolute top-4 left-4 no-print p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            Viewing record as Co-Owner (Owner&apos;s data)
          </p>
        </div>
      )}

      <div className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-between border-b pb-3 mb-4 no-print">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Back to Records"
          >
            <FaArrowLeft className="text-xs" /> Back to Records
          </button>
          <h2 className="text-3xl font-semibold text-gray-800 flex-1 text-center pr-32">
            Record Details
          </h2>
        </div>

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
                {formatDateSafe(record.date)}
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
          Next Due
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
                      ? formatDateSafe(service.nextNotificationValue)
                      : `${service.nextNotificationValue}`}
                  </span>
                </div>

                {/* Subservices section */}
                {service.subServices && service.subServices.length > 0 && (
                  <div className="mt-2 ml-4">
                    {/* <div className="text-sm font-medium text-gray-500 mb-1">
                      Subservices:
                    </div> */}
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

        {/* Documents Section (Images or PDFs) */}
        {allDocuments.length > 0 && (
          <div className="mt-8 m-8">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                Service Documents / Attachments
                <span className="text-sm font-normal bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full">
                  {allDocuments.length}
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allDocuments.map((docItem, index) => {
                const isPdf =
                  docItem.fileType === "pdf" ||
                  docItem.imageUrl.toLowerCase().includes(".pdf") ||
                  docItem.imageUrl.toLowerCase().includes("application%2fpdf");
                const docTitle =
                  docItem.text ||
                  (isPdf
                    ? `Document_${index + 1}.pdf`
                    : `Attachment_${index + 1}`);

                return (
                  <div
                    key={index}
                    className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    {/* Card Header / Preview */}
                    {isPdf ? (
                      <div
                        className="bg-gradient-to-br from-red-50 to-orange-50 p-6 flex flex-col items-center justify-center text-center cursor-pointer border-b"
                        onClick={() => openPdfModal(docItem.imageUrl, docTitle)}
                      >
                        <FaFilePdf className="text-red-500 text-5xl mb-2 hover:scale-105 transition-transform" />
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded">
                          PDF Document
                        </span>
                      </div>
                    ) : (
                      <div
                        className="relative w-full h-44 bg-gray-100 cursor-pointer overflow-hidden group border-b flex items-center justify-center"
                        onClick={() =>
                          openImageModal(docItem.imageUrl, docTitle)
                        }
                      >
                        <img
                          src={docItem.imageUrl}
                          alt={docTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
                            Image
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <div className="bg-white/90 text-gray-900 p-2.5 rounded-full shadow-lg">
                            <FaSearchPlus size={18} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4
                          className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2"
                          title={docTitle}
                        >
                          {docTitle}
                        </h4>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                        <button
                          onClick={() =>
                            isPdf
                              ? openPdfModal(docItem.imageUrl, docTitle)
                              : openImageModal(docItem.imageUrl, docTitle)
                          }
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <FaExternalLinkAlt size={11} /> View
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadFile(
                              docItem.imageUrl,
                              docTitle,
                              isPdf
                            )
                          }
                          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition border cursor-pointer"
                        >
                          <FaDownload size={11} /> Download
                        </button>
                        <button
                          onClick={() => handlePrintImage(docItem.imageUrl)}
                          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition border cursor-pointer"
                          title="Print Document"
                        >
                          <FaPrint size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handlePrint}
            className="w-full max-w-sm no-print mt-6 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center justify-center content-center gap-2 shadow-md hover:bg-red-600 transition"
          >
            <FaPrint /> Print Report
          </button>
        </div>
      </div>

      {/* In-Page PDF Preview Modal */}
      {isPdfModalOpen && activePdfDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-6 no-print">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-900 text-white border-b border-gray-800">
              <div className="flex items-center gap-3 min-w-0">
                <FaFilePdf className="text-red-500 text-2xl flex-shrink-0" />
                <div className="truncate">
                  <h3
                    className="font-semibold text-base truncate"
                    title={activePdfDoc.title}
                  >
                    {activePdfDoc.title}
                  </h3>
                  <p className="text-xs text-gray-400">PDF Preview</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handlePrintImage(activePdfDoc.url)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition cursor-pointer"
                  title="Print PDF"
                >
                  <FaPrint size={11} /> Print
                </button>
                <button
                  onClick={() =>
                    handleDownloadFile(
                      activePdfDoc.url,
                      getPdfFileName(activePdfDoc.title),
                      true
                    )
                  }
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition cursor-pointer"
                  title="Download PDF"
                >
                  <FaDownload size={11} /> Download
                </button>
                <button
                  onClick={() => window.open(activePdfDoc.url, "_blank")}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition cursor-pointer"
                  title="Open in new tab"
                >
                  <FaExternalLinkAlt size={11} /> New Tab
                </button>
                <button
                  onClick={closePdfModal}
                  className="bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-lg transition ml-1 cursor-pointer"
                  title="Close"
                >
                  <FaTimes size={15} />
                </button>
              </div>
            </div>

            {/* Modal Body / PDF Viewer */}
            <div className="flex-1 w-full h-full bg-gray-100 relative">
              <iframe
                src={`${activePdfDoc.url}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title={activePdfDoc.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && activeImageDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center">
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-900/90 text-white rounded-t-xl mb-2 backdrop-blur-md">
              <span className="text-sm font-medium text-gray-200 truncate max-w-md">
                {activeImageDoc.title}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintImage(activeImageDoc.url)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition cursor-pointer"
                  title="Print Image"
                >
                  <FaPrint size={12} /> Print
                </button>
                <button
                  onClick={() =>
                    handleDownloadFile(
                      activeImageDoc.url,
                      activeImageDoc.title,
                      false
                    )
                  }
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition cursor-pointer"
                  title="Download Image"
                >
                  <FaDownload size={12} /> Download
                </button>
                <button
                  onClick={zoomIn}
                  className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg text-xs transition cursor-pointer"
                  title="Zoom In"
                >
                  <FaSearchPlus size={14} />
                </button>
                <button
                  onClick={zoomOut}
                  className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg text-xs transition cursor-pointer"
                  title="Zoom Out"
                >
                  <FaSearchMinus size={14} />
                </button>
                <button
                  onClick={closeImageModal}
                  className="bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-lg transition ml-1 cursor-pointer"
                  title="Close"
                >
                  <FaTimes size={15} />
                </button>
              </div>
            </div>

            {/* Image Viewer */}
            <div className="w-full flex items-center justify-center overflow-auto max-h-[78vh] p-2 bg-black/40 rounded-b-xl">
              <img
                src={activeImageDoc.url}
                alt={activeImageDoc.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg transition-transform duration-150"
                style={{ transform: `scale(${imageScale})` }}
              />
            </div>

            <div className="mt-2 text-center text-gray-300 text-xs">
              <p>Zoom: {(imageScale * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
