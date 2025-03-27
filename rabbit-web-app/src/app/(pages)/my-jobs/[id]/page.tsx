/* eslint-disable @next/next/no-img-element */
"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { HistoryItem } from "@/types/types";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { HashLoader } from "react-spinners";
import { use } from "react";
import RequestAcceptHistoryCard from "@/components/RequestAcceptHistoryCard";

export default function JobIdDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth() || { user: null };
  const [loading, setLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState<HistoryItem | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("");

  const { id } = use(params);

  // useEffect(() => {
  //   const fetchJobDetails = async () => {
  //     if (!user) return;

  //     try {
  //       const jobRef = doc(db, "Users", user.uid, "history", `#${id}`);
  //       const jobSnap = await getDoc(jobRef);

  //       if (jobSnap.exists()) {
  //         const data = jobSnap.data() as HistoryItem;
  //         setJobDetails(data);
  //       } else {
  //         console.log("No such job!");
  //       }
  //     } catch (error) {
  //       console.error("Error fetching job details:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchJobDetails();
  // }, [user, id]);

  useEffect(() => {
    if (!user) return;

    const jobRef = doc(db, "Users", user.uid, "history", `#${id}`);

    const unsubscribe = onSnapshot(jobRef, (jobSnap) => {
      if (jobSnap.exists()) {
        setJobDetails(jobSnap.data() as HistoryItem);
      } else {
        console.log("No such job!");
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [user, id]);

  const handleAcceptOffer = async (mechanicId: string) => {
    if (!jobDetails || !user) return;

    const confirmAccept = window.confirm(
      "Are you sure you want to accept this offer?"
    );
    if (!confirmAccept) return;

    try {
      const updates = {
        status: 2,
        mechanicsOffer: jobDetails.mechanicsOffer.map((offer) => ({
          ...offer,
          status: offer.mId === mechanicId ? 2 : offer.status,
        })),
      };

      // Update user history document
      const userHistoryRef = doc(db, "Users", user.uid, "history", `#${id}`);
      await updateDoc(userHistoryRef, updates);

      // Update jobs document
      const jobRef = doc(db, "jobs", `#${id}`);
      await updateDoc(jobRef, updates);

      // Refresh job details
      const updatedJobSnap = await getDoc(userHistoryRef);
      if (updatedJobSnap.exists()) {
        setJobDetails(updatedJobSnap.data() as HistoryItem);
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
    }
  };

  const handlePayment = async (mechanicId: string) => {
    if (!jobDetails || !user) return;

    try {
      const updates = {
        status: 3,
        payMode: selectedPaymentMode,
        mechanicsOffer: jobDetails.mechanicsOffer.map((offer) => ({
          ...offer,
          status: offer.mId === mechanicId ? 3 : offer.status,
        })),
      };

      const userHistoryRef = doc(db, "Users", user.uid, "history", `#${id}`);
      const jobRef = doc(db, "jobs", `#${id}`);

      await updateDoc(userHistoryRef, updates);
      await updateDoc(jobRef, updates);

      const updatedJobSnap = await getDoc(userHistoryRef);
      if (updatedJobSnap.exists()) {
        setJobDetails(updatedJobSnap.data() as HistoryItem);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
    }
  };

  const handleStartJob = async (mechanicId: string) => {
    if (!jobDetails || !user) return;

    const confirmAccept = window.confirm(
      "Are you sure the Mechanic has arrived and you want to start the job?"
    );
    if (!confirmAccept) return;

    try {
      const updates = {
        status: 4,
        mechanicsOffer: jobDetails.mechanicsOffer.map((offer) => ({
          ...offer,
          status: offer.mId === mechanicId ? 4 : offer.status,
        })),
      };

      const userHistoryRef = doc(db, "Users", user.uid, "history", `#${id}`);
      const jobRef = doc(db, "jobs", `#${id}`);

      await updateDoc(userHistoryRef, updates);
      await updateDoc(jobRef, updates);

      const updatedJobSnap = await getDoc(userHistoryRef);
      if (updatedJobSnap.exists()) {
        setJobDetails(updatedJobSnap.data() as HistoryItem);
      }
    } catch (error) {
      console.error("Error starting job:", error);
    }
  };

  if (!user) {
    return <div>Please login to view job details</div>;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  if (!jobDetails) {
    return <div>Job not found</div>;
  }

  // Find if any mechanic has been accepted (status 2 or higher)
  const acceptedMechanic = jobDetails.mechanicsOffer?.find(
    (mechanic) => mechanic.status >= 2
  );

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      {/* Job Details Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center mb-2 gap-2">
          {/** Top Section */}
          <div className="flex gap-4">
            <span className="bg-pink-100 text-pink-600 px-4 py-2 rounded-lg font-semibold">
              {jobDetails.orderId}
            </span>
            <span className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-semibold">
              {jobDetails.orderDate.toDate().toLocaleDateString()}
            </span>
          </div>
          <span
            className={`px-6 py-2 rounded-lg font-semibold ${
              jobDetails.status === 5
                ? "bg-green-100 text-green-600"
                : jobDetails.status === -1
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-600"
            }`}
          >
            {jobDetails.status === 5
              ? "Completed"
              : jobDetails.status === -1
              ? "Cancelled"
              : "In Progress"}
          </span>
        </div>

        {/** Image sectiion and vehicle details section */}

        <div className="flex gap-8">
          {/** Vehicle Details Section */}
          <div className="">
            <p className="text-gray-600 text-lg font-bold">
              Vehicle: {jobDetails.companyName} ({jobDetails.vehicleNumber})
            </p>
            <div className="grid grid-cols-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-black">
                  Service :{" "}
                  <span className="font-semibold">
                    {jobDetails.selectedService}
                  </span>
                </p>

                {jobDetails.description.length > 0 ? (
                  <p className="text-black ">
                    Description :{" "}
                    <span className="font-semibold">
                      {jobDetails.description}
                    </span>
                  </p>
                ) : null}

                <p className="text-black ">
                  Location :{" "}
                  <span className="font-semibold">
                    {jobDetails.userDeliveryAddress}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {jobDetails.images && jobDetails.images.length > 0 && (
            <div className="">
              <div className="grid grid-cols-3 gap-6">
                {jobDetails.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Job image ${index + 1}`}
                    height={100}
                    width={100}
                    className="rounded-xl hover:opacity-90 transition-opacity duration-300 shadow-md"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mechanics Offers Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Mechanic Offers
        </h2>
        {!jobDetails.mechanicsOffer ||
        jobDetails.mechanicsOffer.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 text-lg">No Mechanic Offers Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobDetails.mechanicsOffer
              .filter(
                (mechanic) =>
                  // Show all offers if no mechanic is accepted yet
                  // Otherwise only show the accepted mechanic
                  !acceptedMechanic || mechanic.mId === acceptedMechanic.mId
              )
              .map((mechanic, index) => (
                <div
                  key={index}
                  className="transform hover:scale-[1.02] transition-transform duration-300"
                >
                  <RequestAcceptHistoryCard
                    mechanic={mechanic}
                    jobDetails={jobDetails}
                    onAcceptOffer={() => handleAcceptOffer(mechanic.mId)}
                    onPayment={() => handlePayment(mechanic.mId)}
                    onStartJob={() => handleStartJob(mechanic.mId)}
                    selectedPaymentMode={selectedPaymentMode}
                    setSelectedPaymentMode={setSelectedPaymentMode}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
