"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MemberJobsCard from "@/components/memberJobsCard/memberJobsCard";

export interface Job {
  id: string;
  status: number;
  ownerId: string;
  userId: string;
  userName?: string;
  userPhoto?: string;
  vehicleNumber?: string;
  companyName?: string;
  userDeliveryAddress?: string;
  selectedService?: string;
  orderId?: string;
  orderDate?: Timestamp;
  arrivalCharges?: number;
  fixPrice?: number;
  isImageSelected?: boolean;
}

export default function MemberJobPage() {
  const params = useParams();
  const memberId = params?.id as string;
  const { user } = useAuth() || { user: null };
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("Member");

  useEffect(() => {
    if (!user?.uid || !memberId) return;

    // Fetch member name
    const fetchMemberName = async () => {
      try {
        const memberDoc = await getDoc(doc(db, "Users", memberId));
        if (memberDoc.exists()) {
          setMemberName(memberDoc.data().userName || "Member");
        }
      } catch (err) {
        console.error("Error fetching member name:", err);
      }
    };

    fetchMemberName();

    // Set up Firestore query
    const jobsQuery = query(
      collection(db, "jobs"),
      where("status", "in", [0, 1, 2, 3, 4, 5]),
      where("ownerId", "==", user.uid),
      where("userId", "==", memberId),
      orderBy("orderDate", "desc")
    );

    const unsubscribe = onSnapshot(
      jobsQuery,
      (querySnapshot) => {
        const jobsData: Job[] = [];
        querySnapshot.forEach((doc) => {
          jobsData.push({ id: doc.id, ...doc.data() } as Job);
        });
        setJobs(jobsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, memberId]);

  const getMonthName = (month: number): string => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[month - 1] || "";
  };

  const getStatusString = (status: number): string => {
    switch (status) {
      case 0:
        return "Pending";
      case 1:
        return "Mechanic Accepted";
      case 2:
        return "Driver Accepted";
      case 3:
        return "Paid";
      case 4:
        return "Ongoing";
      case 5:
        return "Completed";
      case -1:
        return "Cancelled";
      default:
        return "Unknown Status";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-900">
            {memberName} History
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No jobs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                let dateString = "";
                if (job.orderDate instanceof Timestamp) {
                  const dateTime = job.orderDate.toDate();
                  dateString = `${dateTime.getDate()} ${getMonthName(
                    dateTime.getMonth() + 1
                  )} ${dateTime.getFullYear()}`;
                }

                return (
                  <MemberJobsCard
                    key={job.id}
                    companyNameAndVehicleName={`${job.companyName} (${
                      job.vehicleNumber || "N/A"
                    })`}
                    address={job.userDeliveryAddress || "N/A"}
                    serviceName={job.selectedService || "N/A"}
                    jobId={job.orderId || "N/A"}
                    imagePath={
                      job.userPhoto ||
                      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                    }
                    dateTime={dateString}
                    status={getStatusString(job.status)}
                    charges={job.arrivalCharges?.toString() || "0"}
                    fixCharges={job.fixPrice?.toString() || "0"}
                    isImage={job.isImageSelected || false}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
