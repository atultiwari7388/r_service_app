"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { HistoryItem } from "@/types/types";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HashLoader } from "react-spinners";
import HistoryCard from "../history/components/HistoryCard";

export default function MyJobsPage() {
  const { user } = useAuth() || { user: null };
  const [loading, setLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const fetchUserOngoingHistory = async () => {
    setLoading(true);
    if (user) {
      try {
        const historyRef = collection(db, "Users", user.uid, "history");
        const historySnapshot = await getDocs(historyRef);
        const historyData = historySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HistoryItem[];
        // Filter for only ongoing jobs (status 0-4)
        const ongoingJobs = historyData.filter(
          (job) => job.status >= 0 && job.status <= 4
        );
        console.log(ongoingJobs);
        setHistoryItems(ongoingJobs);
      } catch (error) {
        toast.error(
          `Something went wrong. Error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUserOngoingHistory();
  }, [user]);

  if (!user) {
    return <h1 className="">Please Login to access the page..</h1>;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Table Layout for larger screens */}
      <div className="hidden lg:block">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b bg-blue-100">ID</th>
              <th className="px-4 py-2 border-b bg-blue-100">Distance</th>
              <th className="px-4 py-2 border-b bg-blue-100">Rating</th>
              <th className="px-4 py-2 border-b bg-blue-100">Name</th>
              <th className="px-4 py-2 border-b bg-blue-100">Address</th>
              <th className="px-4 py-2 border-b bg-blue-100">Service</th>
              <th className="px-4 py-2 border-b bg-blue-100">Vehicle</th>
              <th className="px-4 py-2 border-b bg-blue-100">
                Arrival Charges
              </th>
              <th className="px-4 py-2 border-b bg-blue-100">
                Per Hour Charges
              </th>
              <th className="px-4 py-2 border-b bg-blue-100">Payment Mode</th>
              <th className="px-4 py-2 border-b bg-blue-100">Status</th>
            </tr>
          </thead>
          <tbody className="text-center bg-gray-100">
            {historyItems.length > 0 ? (
              historyItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-red-100" : "bg-green-100"}
                >
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
                  <td className="px-4 py-2 border-b">
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
              ))
            ) : (
              <tr>
                <td colSpan={11} className="text-center py-4">
                  No history items found.
                </td>
              </tr>
            )}
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
