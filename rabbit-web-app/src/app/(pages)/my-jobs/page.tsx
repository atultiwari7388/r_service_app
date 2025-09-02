"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { HistoryItem } from "@/types/types";
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HashLoader } from "react-spinners";
import HistoryCard from "../history/components/HistoryCard";
// import { GlobalToastError } from "@/utils/globalErrorToast";
import Link from "next/link";

export default function MyJobsPage() {
  const { user } = useAuth() || { user: null };
  const [loading, setLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [distanceOptions, setDistanceOptions] = useState<number[]>([]);

  //handle distance change
  const handleDistanceChange = async (jobId: string, newDistance: number) => {
    try {
      // Update history collection
      const jobRef = doc(db, "Users", user!.uid, "history", jobId);
      await updateDoc(jobRef, {
        nearByDistance: newDistance,
      });

      // Update jobs collection
      const historyDoc = historyItems.find((item) => item.id === jobId);
      if (historyDoc?.orderId) {
        const jobsRef = doc(db, "jobs", historyDoc.orderId);
        await updateDoc(jobsRef, {
          nearByDistance: newDistance,
        });
      }

      toast.success("Distance updated successfully");
    } catch (error) {
      toast.error("Failed to update distance");
      console.error(error);
    }
  };

  //fetch user ongoing history with real-time updates
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const historyRef = collection(db, "Users", user.uid, "history");
    const q = query(
      historyRef,
      where("status", ">=", 0),
      where("status", "<=", 4)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const historyData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HistoryItem[];

        setHistoryItems(historyData);
        setLoading(false);
      },
      (error) => {
        // toast.error(
        //   `Something went wrong. Error: ${
        //     error instanceof Error ? error.message : String(error)
        //   }`
        // );
        console.log(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  //fetch distance options with real-time updates
  useEffect(() => {
    const distanceRef = doc(db, "metadata", "nearByDisstanceList");

    const unsubscribe = onSnapshot(
      distanceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const distanceData = snapshot.data()?.value;
          setDistanceOptions(distanceData);
        }
      },
      (error) => {
        // GlobalToastError(error);
        console.log(error);
      }
    );

    return () => unsubscribe();
  }, []);

  //show reason dialog
  const handleCancelClick = (orderId: string) => {
    if (window.confirm("Are you sure you want to cancel this job?")) {
      showReasonDialog(orderId);
    }
  };

  const showReasonDialog = (orderId: string) => {
    const reasons = [
      "Driver Late",
      "Mis-Communication",
      "Language Problem",
      "Other",
    ];
    const selectedReason = prompt("Select a reason:\n" + reasons.join("\n"));

    if (selectedReason && reasons.includes(selectedReason)) {
      updateJobStatus(orderId, selectedReason);
    } else {
      alert("Invalid reason selected.");
    }
  };

  const updateJobStatus = async (orderId: string, reason: string) => {
    try {
      const jobRef = doc(db, "jobs", orderId);
      const jobSnapshot = await getDoc(jobRef);

      if (jobSnapshot.exists()) {
        const jobData = jobSnapshot.data();
        let mechanicsOffer = jobData.mechanicsOffer || [];

        interface MechanicsOffer {
          status: number;
          fixPrice?: number;
          arrivalCharges?: number;
          // [key: string]: any; // for other potential properties we want to preserve
        }

        mechanicsOffer = mechanicsOffer.map(
          (offer: MechanicsOffer): MechanicsOffer => ({
            ...offer,
            status: -1,
          })
        );

        const updateData = {
          status: -1,
          cancelReason: reason,
          cancelBy: "Driver",
          mechanicsOffer: mechanicsOffer,
        };

        await updateDoc(jobRef, updateData);

        // Update in User's History
        if (user?.uid) {
          const userHistoryRef = doc(db, "Users", user.uid, "history", orderId);
          await updateDoc(userHistoryRef, updateData);
        }

        alert(`Job Cancelled due to: ${reason}`);
      }
    } catch (error) {
      alert(
        `Failed to cancel job: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <h1 className="text-xl font-semibold text-gray-700">
          Please Login to access the page..
        </h1>
      </div>
    );
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
              <th className="px-4 py-2 border-b bg-green-100">ID</th>
              <th className="px-4 py-2 border-b bg-green-100">Date & Time</th>
              <th className="px-4 py-2 border-b bg-green-100">Distance</th>
              <th className="px-4 py-2 border-b bg-green-100">Name</th>
              <th className="px-4 py-2 border-b bg-green-100">Address</th>
              <th className="px-4 py-2 border-b bg-green-100">Service</th>
              <th className="px-4 py-2 border-b bg-green-100">Vehicle</th>
              <th className="px-4 py-2 border-b bg-green-100">Charges</th>
              <th className="px-4 py-2 border-b bg-green-100">Payment Mode</th>
              <th className="px-4 py-2 border-b bg-green-100">Status</th>
              <th className="px-4 py-2 border-b bg-green-100">Action</th>
            </tr>
          </thead>
          <tbody className="text-center bg-gray-100">
            {historyItems.length > 0 ? (
              historyItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-red-50"}
                >
                  <td className="px-4 py-2 border-b">{item.id}</td>
                  <td className="px-4 py-2 border-b">
                    {item.orderDate?.toDate().toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border-b">
                    <div className="flex items-center justify-center gap-2">
                      <span>{item.nearByDistance} miles</span>
                      <select
                        className="ml-2 border rounded p-1"
                        value={item.nearByDistance}
                        onChange={(e) =>
                          handleDistanceChange(item.id, Number(e.target.value))
                        }
                      >
                        {distanceOptions.map((distance) => (
                          <option key={distance} value={distance}>
                            {distance} miles
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">{item.userName}</td>
                  <td className="px-4 py-2 border-b">
                    {item.userDeliveryAddress}
                  </td>
                  <td className="px-4 py-2 border-b">{item.selectedService}</td>
                  <td className="px-4 py-2 border-b">{item.vehicleNumber}</td>
                  <td className="px-4 py-2 border-b">
                    {item.mechanicsOffer.some((offer) => offer.status === 1)
                      ? item.fixPriceEnabled
                        ? `$${item.mechanicsOffer[0]?.fixPrice} (Fix Price)`
                        : `$${item.mechanicsOffer[0]?.arrivalCharges} (Arrival Charges) $${item.mechanicsOffer[0]?.perHourCharges} (Per Hour Charges) `
                      : "0"}
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
                  {/* <td className="px-4 py-2 border-b">
                    {item.status === 0 ? (
                      <button
                        onClick={() => handleCancelClick(item.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded-sm"
                      >
                        Cancel
                      </button>
                    ) : item.mechanicsOffer.some(
                        (offer) => offer.status === 1
                      ) ? (
                      <Link
                        href={`/my-jobs/${item.id.replace("#", "")}`}
                        className="bg-[#F96176] text-white px-2 py-2 rounded-sm"
                      >
                        View
                      </Link>
                    ) : (
                      ""
                    )}
                  </td> */}

                  <td className="px-4 py-2 border-b">
                    {item.mechanicsOffer.some((offer) => offer.status === 1) ? (
                      <Link
                        href={`/my-jobs/${item.id.replace("#", "")}`}
                        className="bg-[#F96176] text-white px-2 py-2 rounded-sm"
                      >
                        View
                      </Link>
                    ) : item.status === 0 ? (
                      <button
                        onClick={() => handleCancelClick(item.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded-sm"
                      >
                        Cancel
                      </button>
                    ) : (
                      ""
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
      <div className="lg:hidden space-y-4">
        {historyItems.length > 0 ? (
          historyItems.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow">
              <HistoryCard items={item} />
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-sm font-medium">Distance:</span>
                <div className="flex items-center gap-4">
                  <select
                    className="border rounded p-2 bg-white"
                    value={item.nearByDistance}
                    onChange={(e) =>
                      handleDistanceChange(item.id, Number(e.target.value))
                    }
                  >
                    {distanceOptions.map((distance) => (
                      <option key={distance} value={distance}>
                        {distance} miles
                      </option>
                    ))}
                  </select>
                  {item.mechanicsOffer.some((offer) => offer.status === 1) && (
                    <Link
                      href={`/my-jobs/${item.id.replace("#", "")}`}
                      className="bg-[#F96176] text-white px-4 py-2 rounded-sm"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No history items found.</p>
        )}
      </div>
    </div>
  );
}
