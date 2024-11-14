"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { HistoryItem } from "@/types/types";
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  startAfter,
  endBefore,
} from "firebase/firestore";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import HistoryCard from "./components/HistoryCard";
import { HashLoader } from "react-spinners";

export default function HistoryPage(): JSX.Element {
  const { user } = useAuth() || { user: null };
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstDoc, setFirstDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const itemsPerPage = 5;

  const fetchUserHistory = async (direction: "next" | "prev" | "initial") => {
    setLoading(true);
    if (user) {
      try {
        const historyRef = collection(db, "Users", user.uid, "history");
        let q;

        if (direction === "next" && lastDoc) {
          q = query(
            historyRef,
            orderBy("orderDate", "desc"),
            startAfter(lastDoc),
            limit(itemsPerPage)
          );
        } else if (direction === "prev" && firstDoc) {
          q = query(
            historyRef,
            orderBy("orderDate", "desc"),
            endBefore(firstDoc),
            limit(itemsPerPage)
          );
        } else {
          // Initial load or reset to first page
          q = query(
            historyRef,
            orderBy("orderDate", "desc"),
            limit(itemsPerPage)
          );
        }

        const querySnapshot = await getDocs(q);
        console.log("Query Snapshot Size:", querySnapshot.size);

        if (!querySnapshot.empty) {
          const fetchedData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as HistoryItem[];

          setHistoryItems(fetchedData);

          // Set first and last documents for pagination
          setFirstDoc(querySnapshot.docs[0]);
          setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);

          console.log("Fetched data:", fetchedData);
        } else if (direction === "next") {
          toast.error("No more history items.");
        } else {
          console.log("No history items found for initial load.");
        }
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
    fetchUserHistory("initial");
  }, [user]);

  const handleNext = () => fetchUserHistory("next");
  const handlePrevious = () => fetchUserHistory("prev");

  if (!user) {
    return <div>Please log in to access the history page.</div>;
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

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4 gap-4">
        <button
          onClick={handlePrevious}
          disabled={!firstDoc}
          className="bg-[#F96176] text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!lastDoc}
          className="bg-[#F96176] text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
