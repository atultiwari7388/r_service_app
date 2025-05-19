"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";

interface Rating {
  orderId: string;
  rating: number;
  review: string;
  timestamp: Timestamp;
  mId: string;
  mechanicName?: string;
}

interface MechanicData {
  userName: string;
}

export default function RatingsPage() {
  const { user } = useAuth() || { user: null };
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);

  const formatDate = (timestamp: Timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-500";
    if (rating >= 3.0) return "text-yellow-500";
    return "text-red-500";
  };

  const fetchUserRatings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const ratingsRef = collection(db, "Users", user.uid, "ratings");
      const ratingsSnapshot = await getDocs(ratingsRef);

      if (!ratingsSnapshot.empty) {
        const ratingsPromises = ratingsSnapshot.docs.map(
          async (docSnapshot) => {
            const data = docSnapshot.data() as Rating;

            // Fetch mechanic name
            const mechanicRef = doc(db, "Mechanics", data.mId);
            const mechanicSnapshot = await getDoc(mechanicRef);
            const mechanicData = mechanicSnapshot.data() as MechanicData;
            const mechanicName = mechanicData?.userName || "Unknown Mechanic";

            return {
              ...data,
              mechanicName,
            };
          }
        );

        const fetchedRatings = await Promise.all(ratingsPromises);
        setRatings(fetchedRatings);
      } else {
        setRatings([]);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
      GlobalToastError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRatings();
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 bg-white p-8 rounded-lg shadow-md">
          Please Login to access this page.
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          My Ratings & Reviews
        </h1>

        {ratings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-md">
            <div className="text-gray-500 text-lg">No Ratings found</div>
          </div>
        ) : (
          <div className="space-y-6">
            {ratings.map((rating, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {rating.mechanicName?.charAt(0)}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-gray-800">
                      {rating.mechanicName}
                    </span>
                  </div>
                  <div className="flex items-center bg-gray-50 px-4 py-2 rounded-full">
                    <span className="text-amber-400 mr-2 text-xl">★</span>
                    <span
                      className={`font-bold ${getRatingColor(rating.rating)}`}
                    >
                      {rating.rating.toFixed(1)}
                    </span>
                    <span className="text-gray-400 ml-1">/5</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Order ID:</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">
                      {rating.orderId}
                    </span>
                  </div>

                  <div className="text-gray-700">
                    <p className="italic">&quot;{rating.review}&quot;</p>
                  </div>

                  <div className="text-sm text-gray-500 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatDate(rating.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
