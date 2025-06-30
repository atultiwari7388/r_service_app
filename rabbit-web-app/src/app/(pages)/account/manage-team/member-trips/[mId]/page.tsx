"use client";

import { db } from "@/lib/firebase";
import { ProfileValues, VehicleTypes } from "@/types/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

interface TripDetails {
  id: string;
  tripName: string;
  vehicleId: string;
  currentUID: string;
  role: string;
  companyName: string;
  vehicleNumber: string;
  totalMiles: number;
  tripStartMiles: number;
  tripEndMiles: number;
  currentMiles: number;
  previousMiles: number;
  milesArray: { mile: number; date: Timestamp }[];
  isPaid: boolean;
  tripStatus: number;
  tripStartDate: Timestamp;
  tripEndDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  oEarnings?: number;
}

export default function MemberTripsPage() {
  const params = useParams();
  const memberId = params?.mId as string;

  const [userData, setUserData] = useState<ProfileValues | null>(null);
  const [trips, setTrips] = useState<TripDetails[]>([]);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [totals, setTotals] = useState({ totalExpenses: 0, totalEarnings: 0 });
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!memberId) {
      console.log("No memberId available yet");
      return;
    }

    console.log("Fetching data for member:", memberId); // Debug log

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", memberId));
        if (userDoc.exists()) {
          console.log("Found user document");
          const data = userDoc.data() as ProfileValues;
          setUserData(data);
          setRole(data.role);
        } else {
          console.error("User document not found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const vehiclesRef = collection(db, "Users", memberId, "Vehicles");
    const q = query(vehiclesRef, where("active", "==", true));

    const unsubscribeVehicles = onSnapshot(
      q,
      (snapshot) => {
        console.log(`Found ${snapshot.docs.length} vehicles`);
        const vehiclesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as VehicleTypes[];
        setVehicles(vehiclesData);
      },
      (error) => {
        console.error("Vehicles listener error:", error);
      }
    );

    const unsubscribeTrips = onSnapshot(
      collection(db, "Users", memberId, "trips"),
      (snapshot) => {
        console.log(`Found ${snapshot.docs.length} trips`);
        const tripsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TripDetails[];
        setTrips(tripsData);
        if (tripsData.length > 0) {
          setFromDate(tripsData[0].tripStartDate.toDate());
          setToDate(tripsData[tripsData.length - 1].tripEndDate.toDate());
        }
        calculateTotals();
      },
      (error) => {
        console.error("Trips listener error:", error);
      }
    );

    fetchUserData();
    return () => {
      unsubscribeVehicles();
      unsubscribeTrips();
    };
  }, [memberId]);

  const filteredTrips = trips.filter((trip) => {
    const startDate = trip.tripStartDate.toDate();
    const endDate = trip.tripEndDate.toDate();
    const isVehicleActive = vehicles.some(
      (v) => v.id === trip.vehicleId && v.active
    );

    return (
      (!fromDate || endDate >= fromDate) &&
      (!toDate || startDate <= toDate) &&
      isVehicleActive
    );
  });

  const calculateTotals = async () => {
    // setIsCalculatingTotals(true);
    try {
      // Parallel expense calculations
      const expensesPromises = filteredTrips.map(async (trip) => {
        try {
          const snapshot = await getDocs(
            query(
              collection(
                db,
                "Users",
                memberId,
                "trips",
                trip.id,
                "tripDetails"
              ),
              where("type", "==", "Expenses")
            )
          );
          return snapshot.docs.reduce(
            (sum, doc) => sum + (doc.data().amount || 0),
            0
          );
        } catch (error) {
          console.error(`Error processing trip ${trip.id}:`, error);
          return 0;
        }
      });

      // Earnings calculations
      const perMile = userData?.perMileCharge || 0;
      const earnings = filteredTrips.reduce((sum, trip) => {
        if (role === "Driver") {
          const miles = (trip.tripEndMiles || 0) - (trip.tripStartMiles || 0);
          return sum + Math.max(miles, 0) * Number(perMile);
        }
        return sum + (trip.oEarnings || 0);
      }, 0);

      const expenses = (await Promise.all(expensesPromises)).reduce(
        (a, b) => a + b,
        0
      );

      setTotals({
        totalExpenses: Math.max(expenses, 0),
        totalEarnings: Math.max(earnings, 0),
      });
    } catch (error) {
      console.error("Calculation error:", error);
    } finally {
      // setIsCalculatingTotals(false);
    }
  };

  const handleUpdateTripStatus = async (trip: Trip, newStatus: number) => {
    // Implement your status update logic here
    console.log(`Updating trip ${trip.id} to status ${newStatus}`);
  };

  const handlePayTrip = async (tripId: string) => {
    // Implement your payment logic here
    console.log(`Paying for trip ${tripId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold mb-4">
          {userData?.userName || "Member"}&apos;s Trips
        </h2>
      </div>

      {/** Total Expenses and Total Loads */}
      <div className="flex justify-center gap-4 mb-6">
        {/* Total Expenses */}
        <div className="w-60 bg-[#58BB87] p-4 rounded-xl shadow-md text-white">
          <h3 className="text-lg font-bold">Total Expenses</h3>
          <p className="text-xl font-semibold">
            ${totals.totalExpenses.toFixed(2)}
          </p>
        </div>

        {/* Total Loads */}
        <div className="w-60 bg-[#F96176] p-4 rounded-xl shadow-md text-white">
          <h3 className="text-lg font-bold">Total Earnings</h3>
          <p className="text-xl font-semibold">
            ${totals.totalEarnings.toFixed(2)}
          </p>
        </div>
      </div>

      {filteredTrips.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">
            No trips found for the selected criteria
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-10">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-[#F96176] p-4 font-bold text-white border-b">
            <div className="col-span-3">Trip Name</div>
            <div className="col-span-2">Dates</div>
            <div className="col-span-1">Miles</div>
            <div className="col-span-2">Earnings</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Table Rows */}
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="grid grid-cols-12 p-4 border-b hover:bg-gray-50"
            >
              {/* Trip Name */}
              <div className="col-span-3 font-medium">{trip.tripName}</div>

              {/* Dates */}
              <div className="col-span-2">
                <div className="text-sm">
                  Start: {trip.tripStartDate.toDate().toLocaleDateString()}
                </div>
                {trip.tripStatus === 2 && (
                  <div className="text-sm">
                    End: {trip.tripEndDate.toDate().toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Miles */}
              <div className="col-span-1">
                <div className="text-sm">Start: {trip.tripStartMiles}</div>
                {trip.tripStatus === 2 && (
                  <>
                    <div className="text-sm">End: {trip.tripEndMiles}</div>
                    <div className="font-semibold text-secondary">
                      Total: {trip.tripEndMiles - trip.tripStartMiles}
                    </div>
                  </>
                )}
              </div>

              {/* Earnings */}
              <div className="col-span-2">
                {trip.tripStatus === 2 ? (
                  userData?.perMileCharge ? (
                    <span className="font-semibold">
                      $
                      {((trip.tripEndMiles || 0) - (trip.tripStartMiles || 0)) *
                        parseFloat(userData.perMileCharge)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                  )
                ) : (
                  <span className="text-gray-400 text-sm">Pending</span>
                )}
              </div>

              {/* Status */}
              <div className="col-span-2">
                {trip.tripStatus === 1 ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={trip.tripStatus}
                      onChange={(e) =>
                        handleUpdateTripStatus(trip, parseInt(e.target.value))
                      }
                      className="border p-1 rounded text-sm"
                    >
                      <option value={1}>Started</option>
                      <option value={2}>Completed</option>
                    </select>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        trip.isPaid
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {trip.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span>Completed</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex gap-2">
                {trip.tripStatus === 2 && !trip.isPaid && (
                  <button
                    onClick={() => handlePayTrip(trip.id)}
                    className="bg-[#F96176] text-white px-3 py-1 rounded text-sm"
                  >
                    Pay
                  </button>
                )}
                <button className="bg-[#F96176] text-white px-3 py-1 rounded text-sm">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
