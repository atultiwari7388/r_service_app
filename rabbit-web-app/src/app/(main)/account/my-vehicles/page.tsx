"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import PopupModal from "@/components/PopupModal";
import { Switch } from "@headlessui/react";
import toast from "react-hot-toast";

interface Vehicle {
  id: string;
  companyName: string;
  vehicleNumber: string;
  image: string;
  active?: boolean;
  vehicleType: string;
  myCompany?: string;
  mycomId?: string;
}

interface UserData {
  role?: string;
  createdBy?: string;
}

interface RedirectProps {
  path: string;
}

export default function MyVehiclesPage() {
  const [masterVehicles, setMasterVehicles] = useState<Vehicle[]>([]);
  const [assignedVehicles, setAssignedVehicles] = useState<Vehicle[]>([]);
  const [highlightedVehicleId, setHighlightedVehicleId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth() || { user: null };
  const [showPopup, setShowPopup] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [role, setRole] = useState("");
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");

  // Displayed vehicles: for SubOwner, strictly limited to assigned vehicles; for Owner, all vehicles
  const vehicles = useMemo(() => {
    if (role === "SubOwner") {
      const assignedIds = new Set(assignedVehicles.map((v) => v.id));
      const assignedNumbers = new Set(
        assignedVehicles
          .map((v) => (v.vehicleNumber || "").toLowerCase().trim())
          .filter(Boolean)
      );

      // Match against masterVehicles from the owner collection (live updates, master fields)
      const matched = masterVehicles.filter(
        (v) =>
          assignedIds.has(v.id) ||
          assignedNumbers.has((v.vehicleNumber || "").toLowerCase().trim())
      );

      if (matched.length > 0) {
        return matched;
      }
      return assignedVehicles;
    }
    return masterVehicles;
  }, [role, assignedVehicles, masterVehicles]);

  // Sort vehicles alphabetically by vehicleNumber
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      const numA = a.vehicleNumber || "";
      const numB = b.vehicleNumber || "";
      return numA.localeCompare(numB);
    });
  }, [vehicles]);

  // Restore scroll position & highlight vehicle when returning from details or edit page
  useEffect(() => {
    if (loading || sortedVehicles.length === 0) return;
    const targetId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("lastViewedVehicleId")
        : null;
    if (!targetId) return;

    const timer = setTimeout(() => {
      const rowElement = document.getElementById(`vehicle-row-${targetId}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedVehicleId(targetId);

        const highlightTimer = setTimeout(() => {
          setHighlightedVehicleId(null);
          sessionStorage.removeItem("lastViewedVehicleId");
        }, 2500);

        return () => clearTimeout(highlightTimer);
      } else {
        sessionStorage.removeItem("lastViewedVehicleId");
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [sortedVehicles, loading]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribeVehicles: (() => void) | undefined;
    let unsubscribeAssignedVehicles: (() => void) | undefined;

    // First: Fetch user data to determine role and effectiveUserId
    const userUnsubscribe = onSnapshot(
      doc(db, "Users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          setUserData(data);
          const currentRole = data.role || "";
          setRole(currentRole);

          // Determine effectiveUserId based on role
          const calculatedEffectiveUserId =
            currentRole === "SubOwner" && data.createdBy
              ? data.createdBy
              : user.uid;

          setEffectiveUserId(calculatedEffectiveUserId);

          if (unsubscribeVehicles) unsubscribeVehicles();
          if (unsubscribeAssignedVehicles) unsubscribeAssignedVehicles();

          // Second: Now fetch master vehicles using the effectiveUserId
          const vehiclesRef = collection(
            db,
            "Users",
            calculatedEffectiveUserId,
            "Vehicles"
          );
          unsubscribeVehicles = onSnapshot(
            vehiclesRef,
            (snapshot) => {
              const vehiclesData: Vehicle[] = [];
              snapshot.forEach((d) => {
                vehiclesData.push({ id: d.id, ...d.data() } as Vehicle);
              });
              setMasterVehicles(vehiclesData);
              setLoading(false);
            },
            (error) => {
              console.error("Error fetching vehicles: ", error);
              setLoading(false);
            }
          );

          // Third: If user is SubOwner with their own assigned vehicles collection
          if (
            currentRole === "SubOwner" &&
            user.uid !== calculatedEffectiveUserId
          ) {
            const assignedRef = collection(db, "Users", user.uid, "Vehicles");
            unsubscribeAssignedVehicles = onSnapshot(
              assignedRef,
              (snapshot) => {
                const assignedData: Vehicle[] = [];
                snapshot.forEach((d) => {
                  assignedData.push({ id: d.id, ...d.data() } as Vehicle);
                });
                setAssignedVehicles(assignedData);
              },
              (error) => {
                console.error("Error fetching assigned vehicles: ", error);
              }
            );
          } else {
            setAssignedVehicles([]);
          }
        } else {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching user data: ", error);
        setLoading(false);
      }
    );

    // Return cleanup function for all listeners
    return () => {
      userUnsubscribe();
      if (unsubscribeVehicles) unsubscribeVehicles();
      if (unsubscribeAssignedVehicles) unsubscribeAssignedVehicles();
    };
  }, [user]);

  const handleRedirect = ({ path }: RedirectProps): void => {
    setShowPopup(false);
    window.location.href = path;
  };

  const handleToggleActive = async (vehicleId: string, newValue: boolean) => {
    if (!user || !effectiveUserId) return;

    try {
      const batch = writeBatch(db);

      // Use effectiveUserId for all operations
      const ownerVehicleRef = doc(
        db,
        "Users",
        effectiveUserId,
        "Vehicles",
        vehicleId
      );
      batch.update(ownerVehicleRef, { active: newValue });

      // Update owner's DataServices using effectiveUserId
      const ownerDataServices = await getDocs(
        query(
          collection(db, "Users", effectiveUserId, "DataServices"),
          where("vehicleId", "==", vehicleId)
        )
      );

      ownerDataServices.forEach((doc) => {
        batch.update(doc.ref, { active: newValue });
      });

      // Also ensure current user's vehicle doc is updated if user.uid !== effectiveUserId
      if (user.uid !== effectiveUserId) {
        const userVehicleRef = doc(
          db,
          "Users",
          user.uid,
          "Vehicles",
          vehicleId
        );
        const userVehicleSnap = await getDoc(userVehicleRef);
        if (userVehicleSnap.exists()) {
          batch.update(userVehicleRef, { active: newValue });
        }
      }

      // Check if owner has any team members using effectiveUserId
      const teamCheck = await getDocs(
        query(
          collection(db, "Users"),
          where("createdBy", "==", effectiveUserId),
          where("isTeamMember", "==", true),
          limit(1)
        )
      );

      if (!teamCheck.empty) {
        const teamMembers = await getDocs(
          query(
            collection(db, "Users"),
            where("createdBy", "==", effectiveUserId),
            where("isTeamMember", "==", true)
          )
        );

        for (const member of teamMembers.docs) {
          const memberId = member.id;

          try {
            const memberVehicleRef = doc(
              db,
              "Users",
              memberId,
              "Vehicles",
              vehicleId
            );
            const memberVehicleDoc = await getDoc(memberVehicleRef);

            if (memberVehicleDoc.exists()) {
              batch.update(memberVehicleRef, { active: newValue });

              const memberDataServices = await getDocs(
                query(
                  collection(db, "Users", memberId, "DataServices"),
                  where("vehicleId", "==", vehicleId)
                )
              );

              memberDataServices.forEach((doc) => {
                batch.update(doc.ref, { active: newValue });
              });
            }
          } catch (e) {
            console.error(`Team member ${memberId} error:`, e);
            continue;
          }
        }
      }

      await batch.commit();
      toast.success("Vehicle status updated successfully");
    } catch (e) {
      console.error("Error updating vehicle status:", e);
      toast.error("Failed to update vehicle status");
      setMasterVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, active: !newValue } : v))
      );
      setAssignedVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, active: !newValue } : v))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full max-w-full overflow-hidden">
      {/* Header Row with Flexbox */}
      <div className="flex items-center justify-between w-full mb-4 sm:mb-6 flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          My Vehicles
        </h1>
        <button
          className="bg-[#F96176] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#eb929e] transition shadow-xs cursor-pointer active:scale-95"
          title="Add Vehicle"
          onClick={(e) => {
            e.preventDefault();
            setShowPopup(true);
          }}
        >
          + Add Vehicle
        </button>
      </div>

      {/* Reusable Popup Component */}
      <PopupModal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title="Select Option"
        options={[
          {
            label: "Add Vehicle",
            onClick: () => handleRedirect({ path: "/add-vehicle" }),
          },
          {
            label: "Import Vehicle",
            onClick: () => handleRedirect({ path: "/import-vehicle" }),
            bgColor: "blue",
          },
        ]}
      />

      {sortedVehicles.length === 0 ? (
        <p className="text-center text-gray-500">No vehicles found</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#F96176] text-white">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Vehicle Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Vehicle Number
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Company Name
                </th>
                {(userData?.role === "Owner" ||
                  userData?.role === "SubOwner") && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Active
                  </th>
                )}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  id={`vehicle-row-${vehicle.id}`}
                  className={`transition-all duration-700 ${
                    highlightedVehicleId === vehicle.id
                      ? "bg-amber-100/75 ring-2 ring-amber-400 shadow-sm"
                      : "hover:bg-gray-50"
                  }`}
                  style={{
                    transition:
                      "background-color 0.8s ease, box-shadow 0.8s ease",
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex-shrink-0 h-10 w-10">
                      {vehicle.vehicleType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle.vehicleNumber || "Unknown Vehicle"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-700">
                      {vehicle.companyName || "Unknown Company"}
                    </div>
                    {vehicle.myCompany && (
                      <div className="text-xs text-gray-500">
                        {vehicle.myCompany}
                      </div>
                    )}
                  </td>
                  {(userData?.role === "Owner" ||
                    userData?.role === "SubOwner") && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Switch
                        checked={vehicle.active || false}
                        onChange={(value) => {
                          setMasterVehicles((prev) =>
                            prev.map((v) =>
                              v.id === vehicle.id
                                ? { ...v, active: value }
                                : v
                            )
                          );
                          setAssignedVehicles((prev) =>
                            prev.map((v) =>
                              v.id === vehicle.id
                                ? { ...v, active: value }
                                : v
                            )
                          );
                          handleToggleActive(vehicle.id, value);
                        }}
                        className={`${
                          vehicle.active ? "bg-[#F96176]" : "bg-gray-200"
                        }
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F96176]`}
                      >
                        <span
                          className={`${
                            vehicle.active ? "translate-x-6" : "translate-x-1"
                          }
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <Link
                      href={`/account/my-vehicles/${vehicle.id}`}
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          sessionStorage.setItem(
                            "lastViewedVehicleId",
                            vehicle.id
                          );
                        }
                      }}
                      className="text-[#F96176] hover:text-[#eb929e] font-medium"
                    >
                      View
                    </Link>
                    {(role === "Owner" || role === "SubOwner") && (
                      <Link
                        href={`/account/my-vehicles/edit/${vehicle.id}`}
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            sessionStorage.setItem(
                              "lastViewedVehicleId",
                              vehicle.id
                            );
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
