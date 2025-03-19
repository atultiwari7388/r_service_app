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
// import { Modal } from "@/components/Modal";
import { GlobalToastError, GlobalToastSuccess } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";

interface TripDetails {
  id: string;
  tripName: string;
  vehicleId: string;
  currentUID: string;
  role: string;
  companyName?: string;
  vehicleNumber?: string;
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

  // UI states
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTripEdit, setCurrentTripEdit] = useState<TripDetails | null>(
    null
  );

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

    const unsubscribeVehicles = onSnapshot(
      collection(db, "Users", user.uid, "Vehicles"),
      (snapshot) => {
        const vehiclesData: VehicleTypes[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as VehicleTypes[];
        setVehicles(vehiclesData);
      }
    );

    const unsubscribeTrips = onSnapshot(
      collection(db, "Users", user.uid, "trips"),
      (snapshot) => {
        const tripsData: TripDetails[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TripDetails[];
        setTrips(tripsData);
      }
    );

    fetchUserData();
    return () => {
      unsubscribeVehicles();
      unsubscribeTrips();
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

      const tripData = {
        tripName,
        vehicleId: selectedVehicle,
        currentUID: user!.uid,
        role,
        companyName: vehicles.find((v) => v.id === selectedVehicle)
          ?.companyName,
        vehicleNumber: vehicles.find((v) => v.id === selectedVehicle)
          ?.vehicleNumber,
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

      // Update vehicle status
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

        driversSnapshot.forEach((driverDoc) => {
          const driverVehicleRef = doc(
            db,
            "Users",
            driverDoc.id,
            "Vehicles",
            selectedVehicle
          );
          batch.update(driverVehicleRef, { tripAssign: true });
        });
      }

      await batch.commit();
      GlobalToastSuccess("Trip added successfully");
      resetTripForm();
    } catch (error) {
      GlobalToastError(error);
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

  const filteredTrips = trips.filter((trip) => {
    const startDate = trip.tripStartDate.toDate();
    const endDate = trip.tripEndDate.toDate();
    return (
      (!fromDate || endDate >= fromDate) && (!toDate || startDate <= toDate)
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

  if (!user) return <div>Please login to view this page</div>;
  if (isLoading) return <LoadingIndicator />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowAddTrip(!showAddTrip)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {showAddTrip ? "Cancel" : "Add Trip"}
        </button>
        <button
          onClick={() => setShowAddExpense(!showAddExpense)}
          className="bg-green-500 text-white px-4 py-2 rounded"
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
                placeholder="Owner Earnings"
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
            <select
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
          </div>
          <button
            onClick={handleAddTrip}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
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
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Save Expense
          </button>
        </div>
      )}

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrips.map((trip) => (
          <div key={trip.id} className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-2">{trip.tripName}</h3>
            <div className="space-y-2">
              <p>
                Start Date: {trip.tripStartDate.toDate().toLocaleDateString()}
              </p>
              <p>Start Miles: {trip.tripStartMiles}</p>
              {trip.tripStatus === 2 && (
                <>
                  <p>
                    End Date: {trip.tripEndDate.toDate().toLocaleDateString()}
                  </p>
                  <p>End Miles: {trip.tripEndMiles}</p>
                  <p>Total Miles: {trip.tripEndMiles - trip.tripStartMiles}</p>
                </>
              )}
              <div className="flex justify-between items-center">
                <span
                  className={`badge ${
                    trip.isPaid ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {trip.isPaid ? "Paid" : "Unpaid"}
                </span>
                <select
                  value={trip.tripStatus}
                  onChange={(e) =>
                    handleUpdateTripStatus(trip, parseInt(e.target.value))
                  }
                  className="border p-1 rounded"
                >
                  <option value={1}>Started</option>
                  <option value={2}>Completed</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setCurrentTripEdit(trip);
                  setShowEditModal(true);
                }}
                className="text-blue-500 hover:underline"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
        {currentTripEdit && (
          <TripDetailsModal
            trip={currentTripEdit}
            onClose={() => setShowEditModal(false)}
            userId={user.uid}
          />
        )}
      </Modal> */}
    </div>
  );
}
