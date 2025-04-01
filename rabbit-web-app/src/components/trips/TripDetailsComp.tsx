"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { FaPrint } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface TripDetailsCompProps {
  tripId: string;
  userId: string;
  // onClose: () => void;
}

export interface Trip {
  id: string;
  tripName: string;
  vehicleId: string;
  companyName: string;
  vehicleNumber: string;
  totalMiles: number;
  tripStartMiles: number;
  tripEndMiles: number;
  currentMiles: number;
  previousMiles: number;
  milesArray: Array<{
    mile: number;
    date: Timestamp;
  }>;
  isPaid: boolean;
  tripStatus: number;
  tripStartDate: Timestamp;
  tripEndDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  oEarnings?: number;
}

export interface TripDetails {
  id?: string;
  type: "Expenses" | "Miles";
  amount?: number;
  miles?: number;
  description?: string;
  imageUrl?: string;
  createdAt: Timestamp;
}

export const TripDetailsComp = ({
  tripId,
  userId,
}: // onClose,
TripDetailsCompProps) => {
  const [activeTab, setActiveTab] = useState<"expenses">("expenses");
  const [details, setDetails] = useState<TripDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const q = query(
          collection(db, "Users", userId, "trips", tripId, "tripDetails"),
          where("type", "==", activeTab === "expenses" ? "Expenses" : "Miles")
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TripDetails[];

        setDetails(data);
      } catch (error) {
        GlobalToastError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [activeTab, tripId, userId]);

  const formatDate = (timestamp: Timestamp) => {
    return new Date(timestamp.toDate()).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  //print vehicle details
  const handlePrint = async () => {
    if (!printRef.current) return;

    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`Trip_details${tripId}.pdf`);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Trip Details</h1>
        <button
          onClick={handlePrint}
          className="bg-[#F96176] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#F96176]"
        >
          <FaPrint /> Print
        </button>
      </div>

      <div ref={printRef}>
        <div className="flex gap-4 mb-6 border-b">
          <button
            className={`pb-2 px-4 ${
              activeTab === "expenses"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("expenses")}
          >
            Expenses
          </button>
        </div>

        {isLoading ? (
          <LoadingIndicator />
        ) : details.length === 0 ? (
          <p className="text-gray-500">No {activeTab} found</p>
        ) : (
          <div className="space-y-4">
            {details.map((detail) => (
              <div
                key={detail.id}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                {activeTab === "expenses" ? (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          ${detail.amount?.toFixed(2)}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {detail.description}
                        </p>
                        {detail.imageUrl && (
                          <div className="mt-2">
                            <Image
                              src={detail.imageUrl}
                              alt="Expense receipt"
                              width={200}
                              height={150}
                              className="rounded-lg object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(detail.createdAt)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{detail.miles} miles</p>
                        <p className="text-sm text-gray-500">
                          Recorded at: {formatDate(detail.createdAt)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
