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
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { GlobalToastError, GlobalToastSuccess } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import Link from "next/link";

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
  loadType?: string;
}

interface TripDetails {
  id: string;
  tripName: string;
  vehicleId: string;
  currentUID: string;
  role: string;
  companyName: string;
  vehicleNumber: string;
  trailerId?: string;
  trailerCompanyName?: string;
  trailerNumber?: string;
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
  loadType?: string;
}

export default function CreateMemberAddTripPageComponent({
  memberId,
  memberRole,
  memberName,
}: {
  memberId?: string;
  memberRole?: string;
  memberName?: string;
}) {
  const { user } = useAuth() || { user: null };
  const [isLoading, setIsLoading] = useState(false);

  const [ownerId, setOwnerId] = useState("");
  const [perMileCharge, setPerMileCharge] = useState("");

  // Trip states
  const [trips, setTrips] = useState<TripDetails[]>([]);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
  const [showAddTrip, setShowAddTrip] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const [selectLoadType, setSelectLoadType] = useState("Empty");

  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, "Users", memberId!));
      if (userDoc.exists()) {
        const data = userDoc.data() as ProfileValues;
        // setUserData(data);
        setOwnerId(data.createdBy || user.uid);
        setPerMileCharge(data.perMileCharge || "0");
      }
    };

    const unsubscribeTrips = onSnapshot(
      collection(db, "Users", memberId!, "trips"),
      (snapshot) => {
        const tripsData: TripDetails[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TripDetails[];
        setTrips(tripsData);
      }
    );

    // Fetch trucks (vehicles)
    const trucksQuery = query(
      collection(db, "Users", memberId!, "Vehicles"),
      where("active", "==", true),
      where("vehicleType", "==", "Truck")
    );

    // Fetch trailers
    const trailersQuery = query(
      collection(db, "Users", memberId!, "Vehicles"),
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
      // unsubscribeVehicles();
      unsubscribeTrips();
      unsubscribeTrucks();
      unsubscribeTrailers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, memberRole, memberName]);

  const resetTripForm = () => {
    setTripName("");
    setCurrentMiles("");
    setOEarnings("");
    setSelectedVehicle("");
    setSelectedDate(new Date());
    setShowAddTrip(false);
    setSelectLoadType("Empty");
  };

  const resetExpenseForm = () => {
    setSelectedTrip("");
    setExpenseAmount("");
    setExpenseDescription("");
    setSelectedFile(null);
    setShowAddExpense(false);
  };

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
        collection(db, "Users", memberId!, "trips"),
        tripRef.id
      );

      // Find selected vehicle and trailer (if any)
      const vehicle = vehicles.find((v) => v.id === selectedVehicle);
      const trailer = trailers.find((t) => t.id === selectedTrailer);

      const tripData = {
        tripName,
        vehicleId: selectedVehicle,
        currentUID: memberId,
        memberRole,
        companyName: vehicle?.companyName,
        vehicleNumber: vehicle?.vehicleNumber,
        trailerId: selectedTrailer || "",
        trailerCompanyName: trailer?.companyName || "",
        trailerNumber: trailer?.vehicleNumber || "",
        loadType: selectLoadType,
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
        oEarnings: memberRole === "Owner" ? parseInt(oEarnings) : 0,
      };

      batch.set(tripRef, tripData);
      batch.set(userTripRef, tripData);

      // Update vehicle status for owner
      const vehicleRef = doc(
        db,
        "Users",
        memberId!,
        "Vehicles",
        selectedVehicle
      );
      batch.update(vehicleRef, { tripAssign: true });

      // Update driver vehicles if owner
      if (memberRole === "Owner") {
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

  if (!user) return <div>Please login to view this page</div>;
  if (isLoading) return <LoadingIndicator />;

  return (
    <div>
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

          <Link
            href={`/account/manage-team/member-trips/${memberId}?ownerId=${ownerId}&perMileCharge=${perMileCharge}`}
            className="text-blue-500 hover:underline"
          >
            Back to Trips
          </Link>
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
              {memberRole === "Owner" && (
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

              {/* Vehicle (Truck) dropdown */}
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="border p-2 rounded"
                required
              >
                <option value="">Select Truck</option>
                {vehicles
                  .slice() // Create a copy to avoid mutating the original array
                  .sort((a, b) =>
                    a.vehicleNumber.localeCompare(b.vehicleNumber)
                  ) // Sort alphabetically by vehicleNumber
                  .map((vehicle) => (
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
                {trailers
                  .slice()
                  .sort((a, b) =>
                    a.vehicleNumber.localeCompare(b.vehicleNumber)
                  )
                  .map((trailer) => (
                    <option key={trailer.id} value={trailer.id}>
                      {trailer.vehicleNumber} ({trailer.companyName})
                    </option>
                  ))}
              </select>

              {/* Load Type dropdown */}
              <select
                value={selectLoadType}
                onChange={(e) => setSelectLoadType(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="Empty">Empty</option>
                <option value="Loaded">Loaded</option>
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
      </div>
    </div>
  );
}
