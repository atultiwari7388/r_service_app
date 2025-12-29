/* eslint-disable @next/next/no-img-element */
"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  where,
  query,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import HashLoader from "react-spinners/HashLoader";
import {
  FiSearch,
  FiFilter,
  FiX,
  FiMoreVertical,
  FiEdit,
  FiCalendar,
  FiTruck,
  FiBriefcase,
  FiUser,
} from "react-icons/fi";
import { Menu, Switch, Transition } from "@headlessui/react";

interface TeamMember {
  uid: string;
  userName: string;
  email: string;
  phoneNumber: string;
  role: string;
  active: boolean;
  profilePicture: string;
  createdBy: string;
  vehicles: {
    id: string;
    companyName: string;
    vehicleNumber: string;
  }[];
  perMileCharge: string;
}

export default function ManageTeam(): JSX.Element {
  const { user: authUser } = useAuth() || { user: null };
  const [currentUserId, setCurrentUserId] = useState("");
  const [role, setRole] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [currentUserVehicleIds, setCurrentUserVehicleIds] = useState<string[]>(
    []
  );

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState(["All"]);
  const [availableRoles, setAvailableRoles] = useState([
    "All",
    "Manager",
    "Driver",
    "Vendor",
    "Accountant",
    "Other Staff",
  ]);
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [showFilters, setShowFilters] = useState(false);
  const [effectiveUserId, setEffectiveUserId] = useState("");

  // Step 1: Fetch user data and determine effectiveUserId
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser) return;

      try {
        setLoading(true);
        setErrorMessage("");

        const userSnapshot = await getDoc(doc(db, "Users", authUser.uid));
        if (!userSnapshot.exists()) {
          setErrorMessage("User not found");
          setLoading(false);
          return;
        }

        const userData = userSnapshot.data();
        const userRole = userData.role || "";
        const createdBy = userData.createdBy || "";

        setCurrentUserId(authUser.uid);
        setRole(userRole);
        setOwnerId(createdBy);

        // Determine effectiveUserId based on role
        // let effectiveOwnerId = authUser.uid;
        if (userRole === "SubOwner" && createdBy) {
          // effectiveOwnerId = createdBy;
          setEffectiveUserId(createdBy);
          console.log("SubOwner detected, using effectiveUserId:", createdBy);
        } else {
          setEffectiveUserId(authUser.uid);
          console.log("Regular user, using own uid:", authUser.uid);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setErrorMessage("Error loading user data");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser]);

  useEffect(() => {
    const fetchData = async () => {
      if (!effectiveUserId) return;

      try {
        setLoading(true);
        setErrorMessage("");

        // 1. First fetch user details
        const userSnapshot = await getDoc(doc(db, "Users", effectiveUserId));
        if (!userSnapshot.exists()) {
          setErrorMessage("User not found");
          setLoading(false);
          return;
        }

        const userData = userSnapshot.data();
        const userRole = userData.role || "";
        const createdBy = userData.createdBy || "";

        setCurrentUserId(effectiveUserId);
        setRole(userRole);
        setOwnerId(createdBy);
        console.log("user id is ", currentUserId);
        console.log("Owner id is ", ownerId);

        // 2. Fetch current user's vehicles
        const vehiclesSnapshot = await getDocs(
          collection(db, "Users", effectiveUserId, "Vehicles")
        );
        const vehicleIds = vehiclesSnapshot.docs.map((doc) => doc.id);

        setCurrentUserVehicleIds(vehicleIds);
        console.log("Current user vehicle IDs:", currentUserVehicleIds); // For debugging

        // 3. Now fetch team members with proper vehicle checks
        let effectiveOwnerId = effectiveUserId;
        const membersWithVehicles: TeamMember[] = [];

        if (userRole !== "Owner" && createdBy) {
          effectiveOwnerId = createdBy;
        }

        const teamSnapshot = await getDocs(
          query(
            collection(db, "Users"),
            where("createdBy", "==", effectiveOwnerId)
          )
        );

        for (const member of teamSnapshot.docs) {
          const memberData = member.data();
          const memberId = member.id;
          const memberRole = memberData.role || "";

          if (memberId === effectiveUserId) continue;

          if (userRole !== "Owner" && memberRole !== "Driver") continue;

          const vehicleSnapshot = await getDocs(
            collection(db, "Users", memberId, "Vehicles")
          );
          const memberVehicles = vehicleSnapshot.docs.map((doc) => ({
            id: doc.id,
            companyName: doc.data().companyName || "No Company",
            vehicleNumber: doc.data().vehicleNumber || "No Number",
          }));

          // For non-owners, check vehicle sharing
          if (userRole !== "Owner") {
            const hasSharedVehicle = memberVehicles.some((vehicle) =>
              vehicleIds.includes(vehicle.id)
            );
            if (!hasSharedVehicle) continue;
          }

          membersWithVehicles.push({
            uid: memberId,
            userName: memberData.userName || "No Name",
            email: memberData.email || "No Email",
            phoneNumber: memberData.phoneNumber || "",
            role: memberRole,
            active: memberData.active || false,
            profilePicture: memberData.profilePicture || "/default-avatar.png",
            createdBy: memberData.createdBy || "",
            vehicles: memberVehicles,
            perMileCharge: memberData.perMileCharge || "0",
          });
        }

        membersWithVehicles.sort((a, b) =>
          a.userName.toLowerCase().localeCompare(b.userName.toLowerCase())
        );

        setTeamMembers(membersWithVehicles);
        setAvailableRoles([
          "All",
          ...Array.from(new Set(membersWithVehicles.map((m) => m.role))),
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        // setErrorMessage(`Error loading data: ${error}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [effectiveUserId]);

  const filterMembers = () => {
    const query = searchQuery.toLowerCase();
    let results = teamMembers.filter((member) =>
      activeTab === "active" ? member.active : !member.active
    );

    if (!selectedRoles.includes("All")) {
      results = results.filter((member) => selectedRoles.includes(member.role));
    }

    if (query) {
      results = results.filter(
        (member) =>
          member.userName.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.phoneNumber.toLowerCase().includes(query) ||
          member.role.toLowerCase().includes(query) ||
          member.vehicles.some(
            (vehicle) =>
              vehicle.vehicleNumber.toLowerCase().includes(query) ||
              vehicle.companyName.toLowerCase().includes(query)
          )
      );
    }

    return results.sort((a, b) =>
      a.userName.toLowerCase().localeCompare(b.userName.toLowerCase())
    );
  };

  const handleToggleActive = async (
    memberId: string,
    currentActive: boolean
  ) => {
    try {
      await updateDoc(doc(db, "Users", memberId), {
        active: !currentActive,
      });
      toast.success(`Member ${currentActive ? "deactivated" : "activated"}`);
      setTeamMembers((prev) =>
        prev.map((member) =>
          member.uid === memberId
            ? { ...member, active: !currentActive }
            : member
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedRoles(["All"]);
    setActiveTab("active");
  };

  if (!authUser) {
    return <div>Please log in to access this page</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {errorMessage}
      </div>
    );
  }

  const filteredMembers = filterMembers();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6 p-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl text-gray-800 font-bold mb-4 sm:mb-0">
            Manage Team
          </h1>
          {role === "Owner" || role === "SubOwner" ? (
            <Link href="/account/manage-team/create-team-member">
              <button className="bg-[#F96176] hover:bg-[#e54d62] text-white py-2 px-6 rounded-lg shadow-md flex items-center">
                <span className="mr-2">+</span>
                Add Member
              </button>
            </Link>
          ) : (
            <div></div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, phone or role..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {role === "Owner" || role === "SubOwner" ? (
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors"
                >
                  <FiFilter />
                  <span>Filter</span>
                </button>

                {showFilters && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Filter by Role</h3>
                      <button onClick={() => setShowFilters(false)}>
                        <FiX />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {availableRoles.map((role) => (
                        <div key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`role-${role}`}
                            checked={selectedRoles.includes(role)}
                            onChange={() => {
                              if (role === "All") {
                                setSelectedRoles(["All"]);
                              } else {
                                const newSelected = selectedRoles.includes(role)
                                  ? selectedRoles.filter((r) => r !== role)
                                  : [
                                      ...selectedRoles.filter(
                                        (r) => r !== "All"
                                      ),
                                      role,
                                    ];
                                setSelectedRoles(
                                  newSelected.length > 0 ? newSelected : ["All"]
                                );
                              }
                            }}
                            className="h-4 w-4 text-[#F96176] focus:ring-[#F96176] border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`role-${role}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            {role}
                          </label>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={resetFilters}
                      className="mt-3 text-sm text-[#F96176] hover:text-[#e54d62]"
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === "active"
                ? "border-b-2 border-[#F96176] text-[#F96176]"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("active")}
          >
            Active Members
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === "inactive"
                ? "border-b-2 border-[#F96176] text-[#F96176]"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("inactive")}
          >
            Inactive Members
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-visible">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={member.profilePicture}
                          alt={member.userName}
                          className="h-10 w-10 rounded-full mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.userName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.role === "SubOwner" ? "Co-Owner" : member.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.role === "SubOwner" ? (
                        <span className="text-gray-400">-</span>
                      ) : member.vehicles.length > 0 ? (
                        <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs">
                          {member.vehicles.length} vehicles
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {member.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {role === "Owner" && (
                          <Switch
                            checked={member.active}
                            onChange={() =>
                              handleToggleActive(member.uid, member.active)
                            }
                            className={`${
                              member.active ? "bg-[#F96176]" : "bg-gray-200"
                            } relative inline-flex h-6 w-11 items-center rounded-full`}
                          >
                            <span
                              className={`${
                                member.active
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                            />
                          </Switch>
                        )}

                        <Menu as="div" className="relative">
                          <Menu.Button className="inline-flex justify-center w-8 h-8 p-1 text-gray-400 hover:text-gray-500">
                            <FiMoreVertical className="h-5 w-5" />
                          </Menu.Button>
                          <Transition
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                {member.role === "SubOwner" ? (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <Link
                                        href={`/account/manage-team/member-profile/${member.uid}`}
                                        className={`${
                                          active
                                            ? "bg-gray-100 text-gray-900"
                                            : "text-gray-700"
                                        } flex items-center px-4 py-2 text-sm`}
                                      >
                                        <FiUser className="mr-3 h-5 w-5 text-gray-400" />
                                        View Profile
                                      </Link>
                                    )}
                                  </Menu.Item>
                                ) : (
                                  <>
                                    {role === "Owner" && (
                                      <Menu.Item>
                                        {({ active }) => (
                                          <Link
                                            href={`/account/manage-team/edit/${member.uid}`}
                                            className={`${
                                              active
                                                ? "bg-gray-100 text-gray-900"
                                                : "text-gray-700"
                                            } flex items-center px-4 py-2 text-sm`}
                                          >
                                            <FiEdit className="mr-3 h-5 w-5 text-gray-400" />
                                            Edit
                                          </Link>
                                        )}
                                      </Menu.Item>
                                    )}
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Link
                                          href={`/account/manage-team/member-trips/${member.uid}?ownerId=${member.createdBy}&perMileCharge=${member.perMileCharge}`}
                                          className={`${
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700"
                                          } flex items-center px-4 py-2 text-sm`}
                                        >
                                          <FiCalendar className="mr-3 h-5 w-5 text-gray-400" />
                                          View Trips
                                        </Link>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Link
                                          href={`/account/manage-team/member-vehicles/${member.uid}`}
                                          className={`${
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700"
                                          } flex items-center px-4 py-2 text-sm`}
                                        >
                                          <FiTruck className="mr-3 h-5 w-5 text-gray-400" />
                                          View Vehicles
                                        </Link>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Link
                                          href={`/account/manage-team/member-jobs/${member.uid}?ownerId=${member.createdBy}`}
                                          className={`${
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700"
                                          } flex items-center px-4 py-2 text-sm`}
                                        >
                                          <FiBriefcase className="mr-3 h-5 w-5 text-gray-400" />
                                          View Jobs
                                        </Link>
                                      )}
                                    </Menu.Item>
                                  </>
                                )}
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No {activeTab === "active" ? "active" : "inactive"} members
                    found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div
                key={member.uid}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={member.profilePicture}
                    alt={member.userName}
                    className="h-12 w-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {member.userName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {member.role === "SubOwner" ? "Co-Owner" : member.role}
                    </p>
                    <span
                      className={`px-2 text-xs leading-5 font-semibold rounded-full ${
                        member.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {member.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Email:</span> {member.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Phone:</span>{" "}
                    {member.phoneNumber}
                  </p>
                  {/* <p className="text-sm text-gray-500">
                    <span className="font-medium">Vehicles:</span>{" "}
                    {member.vehicles.length}
                  </p> */}
                  {member.role !== "SubOwner" && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Vehicles:</span>{" "}
                      {member.vehicles.length}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  {role === "Owner" && (
                    <Switch
                      checked={member.active}
                      onChange={() =>
                        handleToggleActive(member.uid, member.active)
                      }
                      className={`${
                        member.active ? "bg-[#F96176]" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span
                        className={`${
                          member.active ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </Switch>
                  )}
                  <Link
                    href={`/account/manage-team/member-vehicles/${member.uid}`}
                    className="text-sm text-[#F96176] hover:text-[#e54d62]"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
              No {activeTab === "active" ? "active" : "inactive"} members found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
