"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db, storage } from "@/lib/firebase";
import { ProfileValues, VehicleTypes } from "@/types/types";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { GlobalToastError, GlobalToastSuccess } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { useRouter } from "next/navigation";

export interface Trip {
  id: string;
  trailerId?: string;
  trailerCompanyName?: string;
  trailerNumber?: string;
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

export default function ManageTripPage() {
  const { user } = useAuth() || { user: null };
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<ProfileValues | null>(null);
  const [role, setRole] = useState("");
  const [ownerId, setOwnerId] = useState("");

  // Trip states
  const [trips, setTrips] = useState<TripDetails[]>([]);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Form states
  const [tripName, setTripName] = useState("");
  const [currentMiles, setCurrentMiles] = useState("");
  const [oEarnings, setOEarnings] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTrailer, setSelectedTrailer] = useState("");
  const [trailers, setTrailers] = useState<VehicleTypes[]>([]);

  // UI states
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTripEdit, setCurrentTripEdit] = useState<TripDetails | null>(
    null
  );
  const [totals, setTotals] = useState({ totalExpenses: 0, totalEarnings: 0 });

  const router = useRouter();

  // useEffect(() => {
  //   if (!user?.uid) return;

  //   const fetchUserData = async () => {
  //     const userDoc = await getDoc(doc(db, "Users", user.uid));
  //     if (userDoc.exists()) {
  //       const data = userDoc.data() as ProfileValues;
  //       setUserData(data);
  //       setRole(data.role);
  //       setOwnerId(data.createdBy || user.uid);
  //     }
  //   };

  //   const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
  //   const q = query(vehiclesRef, where("active", "==", true));

  //   const unsubscribeVehicles = onSnapshot(q, (snapshot) => {
  //     const vehiclesData: VehicleTypes[] = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     })) as VehicleTypes[];
  //     setVehicles(vehiclesData);
  //   });

  //   const unsubscribeTrips = onSnapshot(
  //     collection(db, "Users", user.uid, "trips"),
  //     (snapshot) => {
  //       const tripsData: TripDetails[] = snapshot.docs.map((doc) => ({
  //         id: doc.id,
  //         ...doc.data(),
  //       })) as TripDetails[];
  //       setTrips(tripsData);
  //     }
  //   );

  //   fetchUserData();
  //   return () => {
  //     unsubscribeVehicles();
  //     unsubscribeTrips();
  //   };
  // }, [user]);

  // Replace your current vehicles useEffect with this:
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, "Users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as ProfileValues;
        setUserData(data);
        setRole(data.role);
        setOwnerId(data.createdBy || user.uid);
      }
    };

    // Fetch trucks (vehicles)
    const trucksQuery = query(
      collection(db, "Users", user.uid, "Vehicles"),
      where("active", "==", true),
      where("vehicleType", "==", "Truck")
    );

    // Fetch trailers
    const trailersQuery = query(
      collection(db, "Users", user.uid, "Vehicles"),
      where("active", "==", true),
      where("vehicleType", "==", "Trailer")
    );

    const unsubscribeTrucks = onSnapshot(trucksQuery, (snapshot) => {
      const trucksData: VehicleTypes[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VehicleTypes[];
      setVehicles(trucksData);
    });

    const unsubscribeTrailers = onSnapshot(trailersQuery, (snapshot) => {
      const trailersData: VehicleTypes[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VehicleTypes[];
      setTrailers(trailersData);
    });

    fetchUserData();
    return () => {
      unsubscribeTrucks();
      unsubscribeTrailers();
    };
  }, [user]);

  const handleAddTrip = async () => {
    if (!tripName || !currentMiles || !selectedVehicle) {
      GlobalToastError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const tripRef = doc(collection(db, "trips"));
      const userTripRef = doc(
        collection(db, "Users", user!.uid, "trips"),
        tripRef.id
      );

      // Find selected vehicle and trailer (if any)
      const vehicle = vehicles.find((v) => v.id === selectedVehicle);
      const trailer = trailers.find((t) => t.id === selectedTrailer);

      const tripData = {
        tripName,
        vehicleId: selectedVehicle,
        currentUID: user!.uid,
        role,
        companyName: vehicle?.companyName,
        vehicleNumber: vehicle?.vehicleNumber,
        trailerId: selectedTrailer || "",
        trailerCompanyName: trailer?.companyName || "",
        trailerNumber: trailer?.vehicleNumber || "",
        totalMiles: 0,
        tripStartMiles: parseInt(currentMiles),
        tripEndMiles: 0,
        currentMiles: parseInt(currentMiles),
        previousMiles: parseInt(currentMiles),
        milesArray: [{ mile: parseInt(currentMiles), date: Timestamp.now() }],
        isPaid: false,
        tripStatus: 1,
        tripStartDate: selectedDate,
        tripEndDate: new Date(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        oEarnings: role === "Owner" ? parseInt(oEarnings) : 0,
      };

      batch.set(tripRef, tripData);
      batch.set(userTripRef, tripData);

      // Update vehicle status for owner
      const vehicleRef = doc(
        db,
        "Users",
        user!.uid,
        "Vehicles",
        selectedVehicle
      );
      batch.update(vehicleRef, { tripAssign: true });

      // Update driver vehicles if owner
      if (role === "Owner") {
        const driversSnapshot = await getDocs(
          query(
            collection(db, "Users"),
            where("createdBy", "==", ownerId),
            where("isDriver", "==", true),
            where("isTeamMember", "==", true)
          )
        );

        // Check if owner has any drivers
        if (!driversSnapshot.empty) {
          // For each driver, check if they have the vehicle before updating
          const updatePromises = driversSnapshot.docs.map(async (driverDoc) => {
            const driverVehicleRef = doc(
              db,
              "Users",
              driverDoc.id,
              "Vehicles",
              selectedVehicle
            );

            try {
              // Check if the vehicle exists for this driver
              const vehicleSnap = await getDoc(driverVehicleRef);
              if (vehicleSnap.exists()) {
                batch.update(driverVehicleRef, { tripAssign: true });
              }
              // If vehicle doesn't exist, skip silently
            } catch (error) {
              console.error(
                `Error checking vehicle for driver ${driverDoc.id}:`,
                error
              );
              // Skip this driver if there's an error
            }
          });

          await Promise.all(updatePromises);
        }
        // If no drivers, just continue with owner update
      }

      await batch.commit();
      GlobalToastSuccess("Trip added successfully");
      console.log("Set trips:", setTrips);
      resetTripForm();
    } catch (error) {
      GlobalToastError(error);
      console.error("Error adding trip:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!selectedTrip || !expenseAmount) {
      GlobalToastError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = "";
      if (selectedFile) {
        const storageRef = ref(
          storage,
          `trip_images/${Date.now()}_${selectedFile.name}`
        );
        await uploadBytes(storageRef, selectedFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const expenseData = {
        tripId: selectedTrip,
        type: "Expenses",
        amount: parseFloat(expenseAmount),
        description: expenseDescription,
        imageUrl,
        createdAt: Timestamp.now(),
      };

      await addDoc(
        collection(
          db,
          "Users",
          user!.uid,
          "trips",
          selectedTrip,
          "tripDetails"
        ),
        expenseData
      );

      await addDoc(
        collection(db, "trips", selectedTrip, "tripDetails"),
        expenseData
      );

      GlobalToastSuccess("Expense added successfully");
      resetExpenseForm();
    } catch (error) {
      GlobalToastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTripStatus = async (
    trip: TripDetails,
    newStatus: number
  ) => {
    if (newStatus === 2) {
      // Completed
      const endMiles = prompt("Enter trip end miles:");
      if (!endMiles || isNaN(parseInt(endMiles))) return;

      const batch = writeBatch(db);
      const tripRef = doc(db, "Users", user!.uid, "trips", trip.id);
      const globalTripRef = doc(db, "trips", trip.id);

      batch.update(tripRef, {
        tripStatus: newStatus,
        tripEndMiles: parseInt(endMiles),
        tripEndDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      batch.update(globalTripRef, {
        tripStatus: newStatus,
        tripEndMiles: parseInt(endMiles),
        tripEndDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update vehicle status
      const vehicleRef = doc(
        db,
        "Users",
        user!.uid,
        "Vehicles",
        trip.vehicleId
      );
      batch.update(vehicleRef, { tripAssign: false });

      if (role === "Driver") {
        const ownerVehicleRef = doc(
          db,
          "Users",
          ownerId,
          "Vehicles",
          trip.vehicleId
        );
        batch.update(ownerVehicleRef, { tripAssign: false });
      }

      await batch.commit();
    } else {
      await updateDoc(doc(db, "Users", user!.uid, "trips", trip.id), {
        tripStatus: newStatus,
        updatedAt: Timestamp.now(),
      });
    }
  };

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
                user!.uid,
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

  const resetTripForm = () => {
    setTripName("");
    setCurrentMiles("");
    setOEarnings("");
    setSelectedVehicle("");
    setSelectedDate(new Date());
    setShowAddTrip(false);
  };

  const resetExpenseForm = () => {
    setSelectedTrip("");
    setExpenseAmount("");
    setExpenseDescription("");
    setSelectedFile(null);
    setShowAddExpense(false);
  };

  useEffect(() => {
    const calculate = () => {
      if (filteredTrips.length > 0) {
        calculateTotals();
      } else {
        setTotals((prev) =>
          prev.totalExpenses === 0 && prev.totalEarnings === 0
            ? prev
            : { totalExpenses: 0, totalEarnings: 0 }
        );
      }
    };

    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTrips, userData?.perMileCharge, role]);

  useEffect(() => {
    // console.log("Updated userData:", userData);
    // console.log("Updated perMileCharge:", userData?.perMileCharge);
  }, [userData]);

  const handleUpdateTrip = async () => {
    if (!currentTripEdit) return;

    try {
      const batch = writeBatch(db);

      // Update user's trip
      const userTripRef = doc(
        db,
        "Users",
        user!.uid,
        "trips",
        currentTripEdit.id
      );
      batch.update(userTripRef, {
        tripStartDate: currentTripEdit.tripStartDate,
        tripStartMiles: currentTripEdit.tripStartMiles,
        updatedAt: Timestamp.now(),
        milesArray: [
          {
            mile: currentTripEdit.tripStartMiles,
            date: Timestamp.now(),
          },
          ...currentTripEdit.milesArray.slice(1),
        ],
      });

      // Update global trip
      const globalTripRef = doc(db, "trips", currentTripEdit.id);
      batch.update(globalTripRef, {
        tripStartDate: currentTripEdit.tripStartDate,
        tripStartMiles: currentTripEdit.tripStartMiles,
        updatedAt: Timestamp.now(),
      });

      await batch.commit();
      GlobalToastSuccess("Trip updated successfully");
      setShowEditModal(false);
    } catch (error) {
      GlobalToastError("Failed to update trip");
      console.error("Update error:", error);
    }
  };

  if (!user) return <div>Please login to view this page</div>;
  if (isLoading) return <LoadingIndicator />;
  if (userData === null) return <LoadingIndicator />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowAddTrip(!showAddTrip)}
          className="bg-[#F96176] text-white px-4 py-2 rounded"
        >
          {showAddTrip ? "Cancel" : "Add Trip"}
        </button>
        <button
          onClick={() => setShowAddExpense(!showAddExpense)}
          className="bg-[#58BB87] text-white px-4 py-2 rounded"
        >
          {showAddExpense ? "Cancel" : "Add Expense"}
        </button>
      </div>

      {showAddTrip && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Trip</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Trip Name"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Current Miles"
              value={currentMiles}
              onChange={(e) => setCurrentMiles(e.target.value)}
              className="border p-2 rounded"
            />
            {role === "Owner" && (
              <input
                type="number"
                placeholder="Load Price"
                value={oEarnings}
                onChange={(e) => setOEarnings(e.target.value)}
                className="border p-2 rounded"
              />
            )}
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => date && setSelectedDate(date)}
              className="border p-2 rounded w-full"
            />
            {/* <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicleNumber} ({vehicle.companyName})
                </option>
              ))}
            </select>
          */}

            {/* Vehicle (Truck) dropdown */}
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Truck</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicleNumber} ({vehicle.companyName})
                </option>
              ))}
            </select>

            {/* Trailer dropdown (optional) */}
            <select
              value={selectedTrailer}
              onChange={(e) => setSelectedTrailer(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Select Trailer (Optional)</option>
              {trailers.map((trailer) => (
                <option key={trailer.id} value={trailer.id}>
                  {trailer.vehicleNumber} ({trailer.companyName})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddTrip}
            className="mt-4 bg-[#F96176] text-white px-6 py-2 rounded hover:bg-[#F96176]"
          >
            Save Trip
          </button>
        </div>
      )}

      {showAddExpense && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Add Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedTrip}
              onChange={(e) => setSelectedTrip(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Select Trip</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.tripName}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="border p-2 rounded"
            />
            <textarea
              placeholder="Description"
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="border p-2 rounded"
            />
          </div>
          <button
            onClick={handleAddExpense}
            className="mt-4 bg-[#58BB87] text-white px-6 py-2 rounded hover:bg-[#58BB87]"
          >
            Save Expense
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold mb-4">Trip List</h2>
        <div className="mb-6 flex items-center gap-4">
          <DatePicker
            selectsRange
            startDate={fromDate}
            endDate={toDate}
            onChange={(update: [Date | null, Date | null]) => {
              setFromDate(update[0]);
              setToDate(update[1]);
            }}
            className="border p-2 rounded"
            placeholderText="Select date range"
          />
        </div>
      </div>

      {/** Total Expenses and Total Loads */}
      <div className="flex justify-center gap-4 mb-6">
        {/* Total Expenses */}
        <div className="w-60 bg-[#58BB87] p-4 rounded-xl shadow-md text-white">
          <h3 className="text-lg font-bold">Total Expenses</h3>
          <p className="text-xl font-semibold">
            ${totals.totalExpenses.toFixed(0)}
          </p>
        </div>

        {/* Total Loads */}
        <div className="w-60 bg-[#F96176] p-4 rounded-xl shadow-md text-white">
          <h3 className="text-lg font-bold">Total Loads</h3>
          <p className="text-xl font-semibold">
            ${totals.totalEarnings.toFixed(0)}
          </p>
        </div>
      </div>

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
                  <div className="font-semibold text-[#F96176]">
                    Total: {trip.tripEndMiles - trip.tripStartMiles}
                  </div>
                </>
              )}
            </div>

            {/* Earnings */}
            <div className="col-span-2">
              {trip.tripStatus === 2 ? (
                role === "Owner" ? (
                  <span className="font-semibold">${trip.oEarnings}</span>
                ) : userData?.perMileCharge ? (
                  <span className="font-semibold">
                    $
                    {((trip.tripEndMiles || 0) - (trip.tripStartMiles || 0)) *
                      Number(userData.perMileCharge)}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">N/A</span>
                )
              ) : (
                <span className="text-gray-400 text-sm">Pending</span>
              )}
            </div>

            {/* Status - Now with dropdown for active trips */}
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
                  {role === "Driver" && (
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        trip.isPaid
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {trip.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  )}
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
              {trip.tripStatus === 1 && (
                <button
                  onClick={() => {
                    setCurrentTripEdit(trip);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() =>
                  router.push(
                    `/account/manage-trip/${trip.id}?userId=${user?.uid}`
                  )
                }
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/** Edit Section */}

      {showEditModal && currentTripEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Trip</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Start Date</label>
                <DatePicker
                  selected={currentTripEdit.tripStartDate.toDate()}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setCurrentTripEdit({
                        ...currentTripEdit,
                        tripStartDate: Timestamp.fromDate(date),
                      });
                    }
                  }}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block mb-2">Start Miles</label>
                <input
                  type="number"
                  value={currentTripEdit.tripStartMiles}
                  onChange={(e) =>
                    setCurrentTripEdit({
                      ...currentTripEdit,
                      tripStartMiles: parseInt(e.target.value) || 0,
                    })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTrip}
                className="bg-[#F96176] text-white px-6 py-2 rounded hover:bg-[#F96176]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
