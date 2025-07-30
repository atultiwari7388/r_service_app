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
import { Modal } from "@/components/Modal"; // You'll need a modal component

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
  googleMiles?: number;
  googleTotalEarning?: number;
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
  googleMiles?: number;
  googleTotalEarning?: number;
}

export default function MemberTripsPage() {
  const params = useParams();
  const memberId = params?.mId as string;

  const [userData, setUserData] = useState<ProfileValues | null>(null);
  const [memberData, setMemberData] = useState<ProfileValues | null>(null);
  const [trips, setTrips] = useState<TripDetails[]>([]);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [totals, setTotals] = useState({
    totalExpenses: 0,
    totalEarnings: 0,
    totalPaid: 0,
    totalGoogleEarnings: 0,
  });
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [role, setRole] = useState("");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGoogleMilesModal, setShowGoogleMilesModal] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<TripDetails | null>(null);
  const [editForm, setEditForm] = useState({
    tripName: "",
    tripStartMiles: "",
    tripEndMiles: "",
    tripStartDate: null as Date | null,
    tripEndDate: null as Date | null,
  });
  const [googleMiles, setGoogleMiles] = useState("");

  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortType, setSortType] = useState<
    "date" | "truck" | "tripname" | null
  >(null);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [tempFromDate, setTempFromDate] = useState<Date | null>(null);
  const [tempToDate, setTempToDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth() || { user: null };

  useEffect(() => {
    if (!memberId) {
      console.log("No memberId available yet");
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", memberId));
        if (userDoc.exists()) {
          const data = userDoc.data() as ProfileValues;
          setMemberData(data);
          console.log("Current Member Data", memberData);

          // setRole(data.role);
        } else {
          console.error("User document not found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchCurrentUserData = async () => {
      try {
        if (!user) {
          console.error("No user is currently authenticated");
          return;
        }
        const userDoc = await getDoc(doc(db, "Users", user?.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as ProfileValues;
          setUserData(data);

          setRole(data.role);
          console.log("Current user data fetched:", data);
          console.log("Current user role:", data.role);
          console.log("Current User Data", userData);
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
        const tripsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TripDetails[];
        setTrips(tripsData);
        if (tripsData.length > 0) {
          setFromDate(tripsData[0].tripStartDate.toDate());
          setToDate(tripsData[tripsData.length - 1].tripEndDate.toDate());
        }
        // calculateTotals();
      },
      (error) => {
        console.error("Trips listener error:", error);
      }
    );
    fetchCurrentUserData();
    fetchUserData();
    return () => {
      unsubscribeVehicles();
      unsubscribeTrips();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, user]);

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
    try {
      let totalExpenses = 0;
      let totalEarnings = 0;
      let totalPaid = 0;
      let totalGoogleEarnings = 0;

      // Ensure we have the perMileCharge value
      const perMile = parseFloat(memberData?.perMileCharge || "0");
      console.log("Per mile charge:", perMile); // Debug log

      // Process each trip
      for (const trip of filteredTrips) {
        // Calculate expenses
        try {
          const expensesSnapshot = await getDocs(
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

          const tripExpenses = expensesSnapshot.docs.reduce(
            (sum, doc) => sum + (doc.data().amount || 0),
            0
          );
          totalExpenses += tripExpenses;

          // Calculate earnings for completed trips
          if (trip.tripStatus === 2) {
            const startMiles = trip.tripStartMiles || 0;
            const endMiles = trip.tripEndMiles || 0;
            const miles = endMiles - startMiles;

            console.log(`Trip ${trip.id}:`, {
              startMiles,
              endMiles,
              miles,
              perMile,
            }); // Debug log

            const earnings = miles * perMile;
            totalEarnings += earnings;
          }

          // Add Google earnings if they exist
          if (trip.googleTotalEarning) {
            totalGoogleEarnings += trip.googleTotalEarning;
          }

          // Count paid trips
          if (trip.isPaid) {
            totalPaid += 1;
          }
        } catch (error) {
          console.error(`Error processing trip ${trip.id}:`, error);
        }
      }

      console.log("Calculated totals:", {
        totalExpenses: totalExpenses,
        totalEarnings: totalEarnings,
        totalPaid: totalPaid,
        totalGoogleEarnings: totalGoogleEarnings,
      }); // Debug log

      setTotals({
        totalExpenses: Math.max(totalExpenses, 0),
        totalEarnings: Math.max(totalEarnings, 0),
        totalPaid: totalPaid,
        totalGoogleEarnings: Math.max(totalGoogleEarnings, 0),
      });
    } catch (error) {
      console.error("Calculation error:", error);
    }
  };

  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTrips, memberData?.perMileCharge.toString()]);

  const handleEditTrip = (trip: TripDetails) => {
    setCurrentTrip(trip);
    setEditForm({
      tripName: trip.tripName,
      tripStartMiles: trip.tripStartMiles.toString(),
      tripEndMiles: trip.tripEndMiles.toString(),
      tripStartDate: trip.tripStartDate.toDate(),
      tripEndDate: trip.tripEndDate.toDate(),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (
      !currentTrip ||
      !editForm.tripName ||
      !editForm.tripStartMiles ||
      !editForm.tripEndMiles ||
      !editForm.tripStartDate ||
      !editForm.tripEndDate
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      await updateDoc(doc(db, "Users", memberId, "trips", currentTrip.id), {
        tripName: editForm.tripName,
        tripStartMiles: parseInt(editForm.tripStartMiles),
        tripEndMiles: parseInt(editForm.tripEndMiles),
        tripStartDate: Timestamp.fromDate(editForm.tripStartDate!),
        tripEndDate: Timestamp.fromDate(editForm.tripEndDate!),
        updatedAt: Timestamp.now(),
      });
      setShowEditModal(false);
      alert("Trip updated successfully");
    } catch (error) {
      console.error("Error updating trip:", error);
      alert("Failed to update trip");
    }
  };

  const handleGoogleMiles = (trip: TripDetails) => {
    setCurrentTrip(trip);
    setGoogleMiles(trip.googleMiles?.toString() || "");
    setShowGoogleMilesModal(true);
  };

  const handleSaveGoogleMiles = async () => {
    if (!currentTrip || !googleMiles || isNaN(parseFloat(googleMiles))) {
      alert("Please enter valid Google Miles");
      return;
    }

    try {
      const miles = parseFloat(googleMiles);
      const perMile = memberData?.perMileCharge || "0";
      const totalEarning = miles * parseFloat(perMile);

      await updateDoc(doc(db, "Users", memberId, "trips", currentTrip.id), {
        googleMiles: miles,
        googleTotalEarning: totalEarning,
        updatedAt: Timestamp.now(),
      });
      setShowGoogleMilesModal(false);
      alert("Google Miles saved successfully");
    } catch (error) {
      console.error("Error saving Google Miles:", error);
      alert("Failed to save Google Miles");
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
    try {
      await updateDoc(doc(db, "Users", memberId, "trips", tripId), {
        isPaid: true,
        updatedAt: Timestamp.now(),
      });
      alert("Trip marked as paid successfully");
    } catch (error) {
      console.error("Error paying trip:", error);
      alert("Failed to mark trip as paid");
    }
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
          {memberData?.userName || "Member"}&apos;s Trips
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

      {/** Total Expenses and Earnings */}
      <div className="w-full flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ml-10">
          {/* Total Expenses */}
          <div className="bg-[#58BB87] p-4 rounded-xl shadow-md text-white">
            <h3 className="text-lg font-bold">Total Expenses</h3>
            <p className="text-xl font-semibold">
              ${totals.totalExpenses.toFixed(0)}
            </p>
          </div>

          {/* Total Earnings */}
          <div className="bg-[#F96176] p-4 rounded-xl shadow-md text-white">
            <h3 className="text-lg font-bold">Total Earnings</h3>
            <p className="text-xl font-semibold">
              ${totals.totalEarnings.toFixed(0)}
            </p>
          </div>

          {/* Total Paid */}
          <div className="bg-purple-500 p-4 rounded-xl shadow-md text-white">
            <h3 className="text-lg font-bold">Total Paid</h3>
            <p className="text-xl font-semibold">
              ${totals.totalPaid.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Trip List Table */}
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
            <div className="col-span-2">Trip Name</div>
            <div className="col-span-2">Dates</div>
            <div className="col-span-1">Miles</div>
            <div className="col-span-1">G.Miles</div>
            <div className="col-span-1">G.Earnings</div>
            <div className="col-span-2">T&apos;Status</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Table Rows */}
          {sortedTrips.map((trip) => (
            <div
              key={trip.id}
              className="grid grid-cols-12 p-4 border-b hover:bg-gray-50 items-center"
            >
              {/* Trip Name */}
              <div className="col-span-2 font-medium">{trip.tripName}</div>

              {/* Dates */}
              <div className="col-span-2 text-sm">
                <div>
                  Start: {trip.tripStartDate.toDate().toLocaleDateString()}
                </div>
                {trip.tripStatus === 2 && (
                  <div>
                    End: {trip.tripEndDate.toDate().toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Miles */}
              <div className="col-span-1">
                {trip.tripStatus === 2 && (
                  <div className="font-semibold">
                    {trip.tripEndMiles - trip.tripStartMiles}
                  </div>
                )}
              </div>

              {/* Google Miles */}
              <div className="col-span-1">
                {trip.googleMiles ? trip.googleMiles : "-"}
              </div>

              {/* Google Earnings */}
              <div className="col-span-1">
                {trip.googleTotalEarning
                  ? `$${trip.googleTotalEarning.toFixed(0)}`
                  : "-"}
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
                {trip.tripStatus === 2 && (
                  <>
                    {!trip.isPaid && (
                      <button
                        onClick={() => handlePayTrip(trip.id)}
                        className="bg-[#F96176] text-white px-3 py-1 rounded text-sm"
                      >
                        Pay
                      </button>
                    )}
                    <button
                      onClick={() => handleEditTrip(trip)}
                      className="bg-orange-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    {(role === "Accountant" || role === "Owner") && (
                      <button
                        onClick={() => handleGoogleMiles(trip)}
                        className="bg-[#F96176] text-white px-3 py-1 rounded text-sm"
                      >
                        Add G.Miles
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Trip Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
        <h2 className="text-xl font-bold mb-4">Edit Trip Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Trip Name</label>
            <input
              type="text"
              value={editForm.tripName}
              onChange={(e) =>
                setEditForm({ ...editForm, tripName: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Miles
              </label>
              <input
                type="number"
                value={editForm.tripStartMiles}
                onChange={(e) =>
                  setEditForm({ ...editForm, tripStartMiles: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End Miles
              </label>
              <input
                type="number"
                value={editForm.tripEndMiles}
                onChange={(e) =>
                  setEditForm({ ...editForm, tripEndMiles: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={
                  editForm.tripStartDate?.toISOString().split("T")[0] || ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    tripStartDate: e.target.value
                      ? new Date(e.target.value)
                      : null,
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={editForm.tripEndDate?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    tripEndDate: e.target.value
                      ? new Date(e.target.value)
                      : null,
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-[#F96176] text-white rounded"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Google Miles Modal */}
      <Modal
        show={showGoogleMilesModal}
        onClose={() => setShowGoogleMilesModal(false)}
      >
        <h2 className="text-xl font-bold mb-4">Add Google Miles</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Google Miles
            </label>
            <input
              type="number"
              value={googleMiles}
              onChange={(e) => setGoogleMiles(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter miles from Google Maps"
            />
          </div>
          {googleMiles && !isNaN(parseFloat(googleMiles)) && (
            <div className="bg-gray-100 p-4 rounded">
              <p className="font-medium">
                Per Mile Charge: ${memberData?.perMileCharge || 0}
              </p>
              <p className="font-bold text-green-600">
                Total Earning: $
                {parseFloat(googleMiles) *
                  parseFloat(memberData?.perMileCharge || "0")}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setShowGoogleMilesModal(false)}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGoogleMiles}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
