/* eslint-disable @next/next/no-img-element */
"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { HistoryItem } from "@/types/types";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!user) return;

      try {
        const jobRef = doc(db, "Users", user.uid, "history", `#${id}`);
        const jobSnap = await getDoc(jobRef);

        if (jobSnap.exists()) {
          const data = jobSnap.data() as HistoryItem;
          setJobDetails(data);
        } else {
          console.log("No such job!");
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [user, id]);

  const handleAcceptOffer = async (mechanicId: string) => {
    if (!jobDetails || !user) return;

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
        payMode: selectedPaymentMode, // Add payment mode
        mechanicsOffer: jobDetails.mechanicsOffer.map((offer) => ({
          ...offer,
          status: offer.mId === mechanicId ? 3 : offer.status,
        })),
      };

      // Update both user history and jobs collection
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

  const handleCompleteJob = async (mechanicId: string) => {
    if (!jobDetails || !user) return;

    try {
      const updates = {
        status: 5,
        mechanicsOffer: jobDetails.mechanicsOffer.map((offer) => ({
          ...offer,
          status: offer.mId === mechanicId ? 5 : offer.status,
        })),
        reviewSubmitted: false, // Add review status
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
      console.error("Error completing job:", error);
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded">
            #{jobDetails.orderId}
          </span>
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded">
            {jobDetails.companyName} ({jobDetails.vehicleNumber})
          </span>
        </div>
      </div>

      {!jobDetails.mechanicsOffer || jobDetails.mechanicsOffer.length === 0 ? (
        <div className="text-center py-8">No Mechanic Found</div>
      ) : (
        <div className="space-y-4">
          {jobDetails.mechanicsOffer.map((mechanic, index) => (
            <RequestAcceptHistoryCard
              key={index}
              mechanic={mechanic}
              jobDetails={jobDetails}
              onAcceptOffer={() => handleAcceptOffer(mechanic.mId)}
              onPayment={() => handlePayment(mechanic.mId)}
              onStartJob={() => handleStartJob(mechanic.mId)}
              onCompleteJob={() => handleCompleteJob(mechanic.mId)}
              selectedPaymentMode={selectedPaymentMode}
              setSelectedPaymentMode={setSelectedPaymentMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
