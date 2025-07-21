"use client";

import { useAuth } from "@/contexts/AuthContexts";
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
  updateDoc,
  writeBatch,
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

  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortType, setSortType] = useState<
    "date" | "truck" | "tripname" | null
  >(null);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
  const [tempToDate, setTempToDate] = useState<Date | null>(null);

  // Add to your existing state declarations
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth() || { user: null };

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

  const applyFilters = () => {
    setFromDate(tempFromDate);
    setToDate(tempToDate);
    setShowSortOptions(false);
  };

  // Add this function to handle trip name filtering
  const filterByTripName = (trip: TripDetails, term: string) => {
    if (!term) return true;
    return trip.tripName.toLowerCase().includes(term.toLowerCase());
  };

  const filteredTrips = trips.filter((trip) => {
    const startDate = trip.tripStartDate.toDate();
    const endDate = trip.tripEndDate.toDate();
    const isVehicleActive = vehicles.some(
      (v) => v.id === trip.vehicleId && v.active
    );

    // Date filter
    const dateFilter =
      (!fromDate || endDate >= fromDate) && (!toDate || startDate <= toDate);

    // Truck filter
    const truckFilter = !selectedTruck || trip.vehicleId === selectedTruck;

    // Trip name filter
    const nameFilter = filterByTripName(trip, searchTerm);

    return isVehicleActive && dateFilter && truckFilter && nameFilter;
  });

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    if (sortType === "date") {
      return a.tripStartDate.toMillis() - b.tripStartDate.toMillis();
    } else if (sortType === "truck") {
      const vehicleA =
        vehicles.find((v) => v.id === a.vehicleId)?.vehicleNumber || "";
      const vehicleB =
        vehicles.find((v) => v.id === b.vehicleId)?.vehicleNumber || "";
      return vehicleA.localeCompare(vehicleB);
    } else if (sortType === "tripname") {
      return a.tripName.localeCompare(b.tripName);
    }
    return 0;
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

  const handleUpdateTripStatus = async (
    trip: TripDetails,
    newStatus: number
  ) => {
    try {
      if (newStatus === 2) {
        // Completing trip
        const currentMiles = prompt(
          "Enter current miles to complete the trip:"
        );
        if (!currentMiles || isNaN(Number(currentMiles))) {
          alert("Please enter valid current miles");
          return;
        }

        const batch = writeBatch(db);
        const numericMiles = Number(currentMiles);

        // 1. Update the current user's trip
        const userTripRef = doc(db, "Users", memberId, "trips", trip.id);
        batch.update(userTripRef, {
          tripStatus: newStatus,
          tripEndMiles: numericMiles,
          tripEndDate: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // 2. If owner is completing a driver's trip, we need additional updates
        if (role === "Owner") {
          // Find all assigned drivers
          const driversQuery = query(
            collection(db, "Users"),
            where("createdBy", "==", user?.uid),
            where("isDriver", "==", true),
            where("isTeamMember", "==", true)
          );

          const driverDocs = await getDocs(driversQuery);

          // Update each driver's vehicle and trip
          for (const driverDoc of driverDocs.docs) {
            const driverId = driverDoc.id;

            // Update driver's vehicle
            const driverVehicleRef = doc(
              db,
              "Users",
              driverId,
              "Vehicles",
              trip.vehicleId
            );
            const driverVehicleSnap = await getDoc(driverVehicleRef);
            if (driverVehicleSnap.exists()) {
              batch.update(driverVehicleRef, { tripAssign: false });
            }

            // Update driver's trip if not the current user
            if (driverId !== memberId) {
              const driverTripRef = doc(
                db,
                "Users",
                driverId,
                "trips",
                trip.id
              );
              const driverTripSnap = await getDoc(driverTripRef);
              if (driverTripSnap.exists()) {
                batch.update(driverTripRef, {
                  tripStatus: newStatus,
                  tripEndMiles: numericMiles,
                  tripEndDate: Timestamp.now(),
                  updatedAt: Timestamp.now(),
                });
              }
            }
          }

          // Update owner's vehicle
          const ownerVehicleRef = doc(
            db,
            "Users",
            memberId,
            "Vehicles",
            trip.vehicleId
          );
          const ownerVehicleSnap = await getDoc(ownerVehicleRef);
          if (ownerVehicleSnap.exists()) {
            batch.update(ownerVehicleRef, { tripAssign: false });
          }
        }

        await batch.commit();
        alert("Trip status updated successfully");
      } else {
        // For other status changes (simple update)
        await updateDoc(doc(db, "Users", memberId, "trips", trip.id), {
          tripStatus: newStatus,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error updating trip status:", error);
      alert("Failed to update trip status");
    }
  };

  const handlePayTrip = async (tripId: string) => {
    // Implement your payment logic here
    console.log(`Paying for trip ${tripId}`);
  };

  const resetFilters = () => {
    setSortType(null);
    setSelectedTruck(null);
    setTempFromDate(null);
    setTempToDate(null);
    setFromDate(null);
    setToDate(null);
    setSearchTerm("");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold mb-4">
          {userData?.userName || "Member"}&apos;s Trips
        </h2>
        <div className="relative">
          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="bg-[#F96176] text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>Filter & Sort</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showSortOptions && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 p-4 border border-gray-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSortType("date")}
                      className={`w-full text-left px-3 py-2 rounded ${
                        sortType === "date"
                          ? "bg-[#F96176] text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      Date
                    </button>
                    <button
                      onClick={() => setSortType("truck")}
                      className={`w-full text-left px-3 py-2 rounded ${
                        sortType === "truck"
                          ? "bg-[#F96176] text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      Truck
                    </button>
                    <button
                      onClick={() => setSortType("tripname")}
                      className={`w-full text-left px-3 py-2 rounded ${
                        sortType === "tripname"
                          ? "bg-[#F96176] text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      Trip Name
                    </button>
                  </div>
                </div>

                {sortType === "date" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        onChange={(e) =>
                          setTempFromDate(
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }
                        className="w-full p-2 border rounded"
                        placeholder="Start Date"
                      />
                      <input
                        type="date"
                        onChange={(e) =>
                          setTempToDate(
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }
                        className="w-full p-2 border rounded"
                        placeholder="End Date"
                      />
                    </div>
                  </div>
                )}

                {sortType === "truck" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Truck
                    </label>
                    <select
                      value={selectedTruck || ""}
                      onChange={(e) => setSelectedTruck(e.target.value || null)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">All Trucks</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicleNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {sortType === "tripname" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Trip Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border rounded pr-8"
                        placeholder="Enter trip name..."
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    onClick={resetFilters}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-[#F96176] text-white rounded-lg"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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

      {sortedTrips.length === 0 ? (
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
          {sortedTrips.map((trip) => (
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
                    {(role === "Driver" || role === "Owner") && (
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
                    )}
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
