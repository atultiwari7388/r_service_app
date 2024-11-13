"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { HistoryItem } from "@/types/types";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import HistoryCard from "./components/HistoryCard";

export default function HistoryPage() {
  const { user } = useAuth() || { user: null };
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's subcollection history data
  const fetchUserHistory = async () => {
    setLoading(true);
    if (user) {
      try {
        const historyRef = collection(db, "Users", user.uid, "history");
        const querySnapshot = await getDocs(historyRef);
        const historyData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HistoryItem[];
        setHistoryItems(historyData);
        console.log("History Items:", historyData);
      } catch (error) {
        toast.error(
          "Failed to fetch history. Please try again. Error: " + error
        );
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUserHistory();
  }, [user]);

  if (!user) {
    return <div>Please log in to access the history page.</div>;
  }

  if (loading) {
    return <div>Loading history...</div>;
  }

  return (
    <div className="container mx-auto p-4 mt-10 mb-10">
      {/* Table Layout for larger screens */}
      <div className="hidden lg:block">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">Distance</th>
              <th className="px-4 py-2 border-b">Rating</th>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Address</th>
              <th className="px-4 py-2 border-b">Service</th>
              <th className="px-4 py-2 border-b">Vehicle</th>
              <th className="px-4 py-2 border-b">Arrival Charges</th>
              <th className="px-4 py-2 border-b">Per Hour Charges</th>
              <th className="px-4 py-2 border-b">Payment Mode</th>
              <th className="px-4 py-2 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {historyItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 border-b">{item.id}</td>
                <td className="px-4 py-2 border-b">
                  {item.nearByDistance} miles
                </td>
                <td className="px-4 py-2 border-b">{item.rating}</td>
                <td className="px-4 py-2 border-b">{item.userName}</td>
                <td className="px-4 py-2 border-b">
                  {item.userDeliveryAddress}
                </td>
                <td className="px-4 py-2 border-b">{item.selectedService}</td>
                <td className="px-4 py-2 border-b">{item.vehicleNumber}</td>
                <td className="px-4 py-2 border-b items-center">
                  {item.mechanicsOffer &&
                    item.mechanicsOffer[0]?.arrivalCharges}
                </td>
                <td className="px-4 py-2 border-b">
                  {item.mechanicsOffer &&
                    item.mechanicsOffer[0]?.perHourCharges}
                </td>
                <td className="px-4 py-2 border-b">{item.payMode}</td>
                <td className="px-4 py-2 border-b">
                  {item.status === 5 ? (
                    <span className="text-green-500">Complete</span>
                  ) : item.status === -1 ? (
                    <span className="text-red-500">Cancelled</span>
                  ) : (
                    <span className="text-yellow-500">In Progress</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card Layout for mobile screens */}
      <div className="lg:hidden">
        {historyItems.length > 0 ? (
          historyItems.map((item) => <HistoryCard key={item.id} items={item} />)
        ) : (
          <p>No history items found.</p>
        )}
      </div>
    </div>
  );
}
