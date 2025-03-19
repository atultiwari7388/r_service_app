"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";

interface TripDetailsModalProps {
  trip: Trip;
  userId: string;
  onClose: () => void;
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

export const TripDetailsModal = ({
  trip,
  userId,
  onClose,
}: TripDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<"expenses" | "miles">("expenses");
  const [details, setDetails] = useState<TripDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const q = query(
          collection(db, "Users", userId, "trips", trip.id, "tripDetails"),
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
  }, [activeTab, trip.id, userId]);

  const formatDate = (timestamp: Timestamp) => {
    return new Date(timestamp.toDate()).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{trip.tripName} Details</h2>

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
        <button
          className={`pb-2 px-4 ${
            activeTab === "miles"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("miles")}
        >
          Mileage
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

      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};
