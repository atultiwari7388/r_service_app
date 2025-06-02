/* eslint-disable @next/next/no-img-element */
"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Tab } from "@headlessui/react";
import { format } from "date-fns";
import { HashLoader } from "react-spinners";

interface Trip {
  companyName: string;
  vehicleNumber: string;
  tripName: string;
  tripStartDate: Timestamp;
  driverName: string;
  tripStatus: number;
  isOwnerTrip: boolean;
}

interface Vehicle {
  companyName: string;
  vehicleNumber: string;
  driverName: string;
}

const getStringFromTripStatus = (status: number): string => {
  switch (status) {
    case 0:
      return "Pending";
    case 1:
      return "Active";
    case 2:
      return "Completed";
    case 3:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

export default function TripWiseVehicleScreen() {
  const { user } = useAuth() || { user: null };

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Trip Wise Vehicle</h1>
        </div>

        <Tab.Group>
          <Tab.List className="flex border-b">
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium ${
                  selected
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`
              }
            >
              Assign Trip
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium ${
                  selected
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`
              }
            >
              Not Assign Trip
            </Tab>
          </Tab.List>
          <Tab.Panels className="p-4">
            <Tab.Panel>
              <AssignTripScreen ownerId={user.uid} />
            </Tab.Panel>
            <Tab.Panel>
              <NotAssignedTripScreen ownerId={user.uid} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}

function AssignTripScreen({ ownerId }: { ownerId: string }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const vehicleTrips: Record<string, Trip> = {};

        const ownerTripsQuery = query(
          collection(db, "Users", ownerId, "trips"),
          where("tripStatus", "==", 1)
        );
        const ownerTripsSnapshot = await getDocs(ownerTripsQuery);

        ownerTripsSnapshot.forEach((tripDoc) => {
          const tripData = tripDoc.data();
          const vehicleNumber = tripData.vehicleNumber as string;
          vehicleTrips[vehicleNumber] = {
            companyName: tripData.companyName,
            vehicleNumber,
            tripName: tripData.tripName,
            tripStartDate: tripData.tripStartDate,
            driverName: "You",
            tripStatus: tripData.tripStatus,
            isOwnerTrip: true,
          };
        });

        const teamMembersQuery = query(
          collection(db, "Users"),
          where("createdBy", "==", ownerId),
          where("isTeamMember", "==", true)
        );
        const teamMembersSnapshot = await getDocs(teamMembersQuery);

        for (const userDoc of teamMembersSnapshot.docs) {
          const driverTripsQuery = query(
            collection(db, "Users", userDoc.id, "trips"),
            where("tripStatus", "==", 1)
          );
          const driverTripsSnapshot = await getDocs(driverTripsQuery);

          for (const tripDoc of driverTripsSnapshot.docs) {
            const tripData = tripDoc.data();
            const vehicleNumber = tripData.vehicleNumber as string;

            if (vehicleTrips[vehicleNumber]) continue;

            const driverDoc = await getDoc(doc(db, "Users", userDoc.id));
            const driverName = driverDoc.data()?.userName as string;

            vehicleTrips[vehicleNumber] = {
              companyName: tripData.companyName,
              vehicleNumber,
              tripName: tripData.tripName,
              tripStartDate: tripData.tripStartDate,
              driverName,
              tripStatus: tripData.tripStatus,
              isOwnerTrip: false,
            };
          }
        }

        setTrips(
          Object.values(vehicleTrips).sort((a, b) =>
            a.vehicleNumber.localeCompare(b.vehicleNumber)
          )
        );
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [ownerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <HashLoader color="#3B82F6" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-bold text-gray-700">
          No Assigned Trips Found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map((trip, index) => {
        const formattedDate = format(trip.tripStartDate.toDate(), "yyyy-MM-dd");

        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
          >
            <div className="p-4">
              <h3 className="text-lg font-bold text-blue-600">
                {trip.vehicleNumber} - {trip.companyName}
              </h3>
              <p className="mt-1 text-gray-800">
                <span className="font-semibold">Trip:</span> {trip.tripName}
              </p>
              <p className="mt-1 text-gray-600">
                <span className="font-semibold">Driver:</span> {trip.driverName}
              </p>
              <p className="mt-1 text-orange-500 font-semibold">
                <span className="font-semibold">Status:</span>{" "}
                {getStringFromTripStatus(trip.tripStatus)}
              </p>
              <div className="mt-2 flex items-center text-gray-500">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotAssignedTripScreen({ ownerId }: { ownerId: string }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotAssignedVehicles = async () => {
      try {
        setLoading(true);
        const uniqueVehicles: Record<string, Vehicle> = {};

        const ownerVehiclesQuery = query(
          collection(db, "Users", ownerId, "Vehicles"),
          where("tripAssign", "==", false)
        );
        const ownerVehiclesSnapshot = await getDocs(ownerVehiclesQuery);

        ownerVehiclesSnapshot.forEach((vehicleDoc) => {
          const vehicleData = vehicleDoc.data();
          uniqueVehicles[vehicleDoc.id] = {
            companyName: vehicleData.companyName,
            vehicleNumber: vehicleData.vehicleNumber,
            driverName: "You",
          };
        });

        const teamMembersQuery = query(
          collection(db, "Users"),
          where("createdBy", "==", ownerId),
          where("isTeamMember", "==", true)
        );
        const teamMembersSnapshot = await getDocs(teamMembersQuery);

        for (const userDoc of teamMembersSnapshot.docs) {
          const driverName = userDoc.data().userName as string;

          const teamVehiclesQuery = query(
            collection(db, "Users", userDoc.id, "Vehicles"),
            where("tripAssign", "==", false)
          );
          const teamVehiclesSnapshot = await getDocs(teamVehiclesQuery);

          teamVehiclesSnapshot.forEach((vehicleDoc) => {
            const vehicleId = vehicleDoc.id;

            if (uniqueVehicles[vehicleId]) {
              uniqueVehicles[vehicleId].driverName = `You/${driverName}`;
            } else {
              uniqueVehicles[vehicleId] = {
                companyName: vehicleDoc.data().companyName,
                vehicleNumber: vehicleDoc.data().vehicleNumber,
                driverName,
              };
            }
          });
        }

        setVehicles(
          Object.values(uniqueVehicles).sort((a, b) =>
            a.vehicleNumber.localeCompare(b.vehicleNumber)
          )
        );
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotAssignedVehicles();
  }, [ownerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <HashLoader color="#3B82F6" />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-bold text-gray-700">
          No Unassigned Vehicles Found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
        >
          <div className="p-4">
            <h3 className="text-lg font-bold text-blue-600">
              {vehicle.vehicleNumber} - {vehicle.companyName}
            </h3>
            <p className="mt-1 text-gray-600">
              <span className="font-semibold">Driver:</span>{" "}
              {vehicle.driverName}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
