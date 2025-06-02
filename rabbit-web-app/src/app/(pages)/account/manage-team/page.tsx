// /* eslint-disable @next/next/no-img-element */
// "use client";

// import { useAuth } from "@/contexts/AuthContexts";
// import { db } from "@/lib/firebase";
// import {
//   collection,
//   getDocs,
//   where,
//   query,
//   limit,
//   startAfter,
//   endBefore,
//   Timestamp,
//   doc,
//   updateDoc,
// } from "firebase/firestore";
// import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
// import Link from "next/link";
// import { useEffect, useState } from "react";
// import toast from "react-hot-toast";
// import HashLoader from "react-spinners/HashLoader";
// import {
//   FiSearch,
//   FiFilter,
//   FiX,
//   FiMoreVertical,
//   FiEdit,
//   FiCalendar,
//   FiTruck,
//   FiBriefcase,
// } from "react-icons/fi";
// import { Menu, Switch, Transition } from "@headlessui/react";

// interface ManageTeamProps {
//   active: boolean;
//   createdBy: string;
//   created_at: Timestamp;
//   email: string;
//   isTeamMember: boolean;
//   phoneNumber: string;
//   profilePicture: string;
//   role: string;
//   uid: string;
//   updated_at: Timestamp;
//   userName: string;
// }

// export default function ManageTeam(): JSX.Element {
//   const [teamMembers, setTeamMembers] = useState<ManageTeamProps[]>([]);
//   const [loading, setLoading] = useState(false);
//   const { user } = useAuth() || { user: null };

//   const [lastDoc, setLastDoc] =
//     useState<QueryDocumentSnapshot<DocumentData> | null>(null);
//   const [firstDoc, setFirstDoc] =
//     useState<QueryDocumentSnapshot<DocumentData> | null>(null);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [showFilters, setShowFilters] = useState(false);
//   const [roleFilter, setRoleFilter] = useState<string>("All");
//   const [filteredMembers, setFilteredMembers] = useState<ManageTeamProps[]>([]);

//   const itemsPerPage = 5;

//   const roles = [
//     "All",
//     "Manager",
//     "Driver",
//     "Vendor",
//     "Accountant",
//     "Other staff",
//   ];

//   const handleToggleActive = async (
//     memberId: string,
//     currentActive: boolean
//   ) => {
//     if (!user) return;
//     try {
//       const memberRef = doc(db, "Users", memberId);
//       await updateDoc(memberRef, {
//         active: !currentActive,
//       });
//       toast.success(
//         `Team member ${
//           currentActive ? "deactivated" : "activated"
//         } successfully`
//       );
//       // Refresh the list
//       fetchTeamMembers("initial");
//     } catch (error) {
//       console.error("Error toggling member status:", error);
//       toast.error("Failed to update member status");
//     }
//   };

//   const fetchTeamMembers = async (direction: "next" | "prev" | "initial") => {
//     setLoading(true);
//     if (user) {
//       try {
//         const usersRef = collection(db, "Users");
//         let q;

//         if (direction === "next" && lastDoc) {
//           q = query(
//             usersRef,
//             where("createdBy", "==", user.uid),
//             where("uid", "!=", user.uid),
//             startAfter(lastDoc),
//             limit(itemsPerPage)
//           );
//         } else if (direction === "prev" && firstDoc) {
//           q = query(
//             usersRef,
//             where("createdBy", "==", user.uid),
//             where("uid", "!=", user.uid),
//             endBefore(firstDoc),
//             limit(itemsPerPage)
//           );
//         } else {
//           q = query(
//             usersRef,
//             where("createdBy", "==", user.uid),
//             where("uid", "!=", user.uid),
//             limit(itemsPerPage)
//           );
//         }

//         const querySnapshot = await getDocs(q);
//         console.log("Query Snapshot Size:", querySnapshot.size);
//         if (!querySnapshot.empty) {
//           const fetchedData = querySnapshot.docs.map((doc) => {
//             const data = doc.data();
//             return {
//               id: doc.id,
//               active: data.active,
//               createdBy: data.createdBy,
//               created_at: data.created_at,
//               email: data.email,
//               role: data.role,
//               uid: data.uid,
//               updated_at: data.updated_at,
//               userName: data.userName,
//               isTeamMember: data.isTeamMember,
//               phoneNumber: data.phoneNumber,
//               profilePicture: data.profilePicture,
//             } as ManageTeamProps;
//           });

//           setTeamMembers(fetchedData);
//           setFilteredMembers(fetchedData);

//           setFirstDoc(querySnapshot.docs[0]);
//           setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);

//           console.log("Fetched team members:", fetchedData);
//         } else if (direction === "next") {
//           toast.error("No more team members to show.");
//         } else {
//           console.log("No team members found for initial load.");
//         }
//       } catch (error) {
//         console.error("Error fetching team members:", error);
//         toast.error("Failed to fetch team members. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   useEffect(() => {
//     fetchTeamMembers("initial");
//   }, [user]);

//   useEffect(() => {
//     let results = teamMembers;

//     // Apply role filter
//     if (roleFilter !== "All") {
//       results = results.filter(
//         (member) => member.role.toLowerCase() === roleFilter.toLowerCase()
//       );
//     }

//     // Apply search filter
//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       results = results.filter(
//         (member) =>
//           member.userName.toLowerCase().includes(query) ||
//           member.email.toLowerCase().includes(query) ||
//           (member.phoneNumber && member.phoneNumber.includes(query)) ||
//           member.role.toLowerCase().includes(query)
//       );
//     }

//     setFilteredMembers(results);
//   }, [searchQuery, roleFilter, teamMembers]);

//   const handleNext = () => fetchTeamMembers("next");
//   const handlePrevious = () => fetchTeamMembers("prev");

//   const resetFilters = () => {
//     setSearchQuery("");
//     setRoleFilter("All");
//     setFilteredMembers(teamMembers);
//   };

//   if (!user) {
//     return <div>Please log in to access the manage team page.</div>;
//   }

//   if (loading) {
//     return (
//       <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
//         <HashLoader color="#F96176" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header Section */}
//         <div className="bg-white shadow-sm rounded-lg mb-6 p-4 flex flex-col sm:flex-row justify-between items-center">
//           <h1 className="text-2xl text-gray-800 font-bold mb-4 sm:mb-0">
//             Manage Team
//           </h1>
//           <Link href="/account/manage-team/create-team-member">
//             <button className="bg-[#F96176] hover:bg-[#e54d62] transition-colors text-white py-2 px-6 rounded-lg shadow-md flex items-center">
//               <span className="mr-2">+</span>
//               Create Member
//             </button>
//           </Link>
//         </div>

//         {/* Search and Filter Section */}
//         <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="relative flex-grow">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <FiSearch className="text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 placeholder="Search by name, email, phone or role..."
//                 className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>
//             <div className="relative">
//               <button
//                 onClick={() => setShowFilters(!showFilters)}
//                 className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors"
//               >
//                 <FiFilter />
//                 <span>Filter</span>
//               </button>

//               {showFilters && (
//                 <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 p-4 border border-gray-200">
//                   <div className="flex justify-between items-center mb-2">
//                     <h3 className="font-medium">Filter by Role</h3>
//                     <button onClick={() => setShowFilters(false)}>
//                       <FiX />
//                     </button>
//                   </div>
//                   <div className="space-y-2">
//                     {roles.map((role) => (
//                       <div key={role} className="flex items-center">
//                         <input
//                           type="radio"
//                           id={`role-${role}`}
//                           name="roleFilter"
//                           checked={roleFilter === role}
//                           onChange={() => setRoleFilter(role)}
//                           className="h-4 w-4 text-[#F96176] focus:ring-[#F96176] border-gray-300"
//                         />
//                         <label
//                           htmlFor={`role-${role}`}
//                           className="ml-2 text-sm text-gray-700"
//                         >
//                           {role}
//                         </label>
//                       </div>
//                     ))}
//                   </div>
//                   {(searchQuery || roleFilter !== "All") && (
//                     <button
//                       onClick={resetFilters}
//                       className="mt-3 text-sm text-[#F96176] hover:text-[#e54d62]"
//                     >
//                       Reset all filters
//                     </button>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>

//           {(searchQuery || roleFilter !== "All") && (
//             <div className="mt-3 text-sm text-gray-600">
//               Showing {filteredMembers.length} results
//               {(searchQuery || roleFilter !== "All") && (
//                 <button
//                   onClick={resetFilters}
//                   className="ml-2 text-[#F96176] hover:text-[#e54d62]"
//                 >
//                   Clear filters
//                 </button>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Desktop Table View */}
//         <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-visible">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead>
//               <tr className="bg-gray-50">
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Name
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Email
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Phone Number
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Role
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredMembers.length > 0 ? (
//                 [...filteredMembers]
//                   .sort((a, b) => a.userName.localeCompare(b.userName))
//                   .map((member) => (
//                     <tr
//                       key={member.uid}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <img
//                             src={member.profilePicture || "/default-avatar.png"}
//                             alt={member.userName}
//                             className="h-10 w-10 rounded-full mr-3"
//                           />
//                           <div className="text-sm font-medium text-gray-900">
//                             {member.userName} ({member.role})
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {member.email}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {member.phoneNumber}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {member.role}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             member.active
//                               ? "bg-green-100 text-green-800"
//                               : "bg-red-100 text-red-800"
//                           }`}
//                         >
//                           {member.active ? "Active" : "Inactive"}
//                         </span>
//                       </td>

//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative">
//                         <div className="flex items-center space-x-4">
//                           <Switch
//                             checked={member.active || false}
//                             onChange={() =>
//                               handleToggleActive(member.uid, member.active)
//                             }
//                             className={`${
//                               member.active ? "bg-[#F96176]" : "bg-gray-200"
//                             }
//         relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
//                           >
//                             <span
//                               className={`${
//                                 member.active
//                                   ? "translate-x-6"
//                                   : "translate-x-1"
//                               }
//           inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
//                             />
//                           </Switch>

//                           <Menu as="div" className="relative">
//                             <div>
//                               <Menu.Button className="inline-flex justify-center w-8 h-8 p-1 text-gray-400 hover:text-gray-500 focus:outline-none">
//                                 <FiMoreVertical className="h-5 w-5" />
//                               </Menu.Button>
//                             </div>

//                             <Transition
//                               enter="transition ease-out duration-100"
//                               enterFrom="transform opacity-0 scale-95"
//                               enterTo="transform opacity-100 scale-100"
//                               leave="transition ease-in duration-75"
//                               leaveFrom="transform opacity-100 scale-100"
//                               leaveTo="transform opacity-0 scale-95"
//                             >
//                               <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//                                 <div className="py-1">
//                                   <Menu.Item>
//                                     {({ active }) => (
//                                       <Link
//                                         href={`/account/manage-team/edit/${member.uid}`}
//                                         className={`${
//                                           active
//                                             ? "bg-gray-100 text-gray-900"
//                                             : "text-gray-700"
//                                         } flex items-center px-4 py-2 text-sm`}
//                                       >
//                                         <FiEdit className="mr-3 h-5 w-5 text-gray-400" />
//                                         Edit
//                                       </Link>
//                                     )}
//                                   </Menu.Item>
//                                   <Menu.Item>
//                                     {({ active }) => (
//                                       <Link
//                                         href={`/account/manage-team/member-trips/${member.uid}`}
//                                         className={`${
//                                           active
//                                             ? "bg-gray-100 text-gray-900"
//                                             : "text-gray-700"
//                                         } flex items-center px-4 py-2 text-sm`}
//                                       >
//                                         <FiCalendar className="mr-3 h-5 w-5 text-gray-400" />
//                                         View Trips
//                                       </Link>
//                                     )}
//                                   </Menu.Item>
//                                   <Menu.Item>
//                                     {({ active }) => (
//                                       <Link
//                                         href={`/account/manage-team/member-vehicles/${member.uid}`}
//                                         className={`${
//                                           active
//                                             ? "bg-gray-100 text-gray-900"
//                                             : "text-gray-700"
//                                         } flex items-center px-4 py-2 text-sm`}
//                                       >
//                                         <FiTruck className="mr-3 h-5 w-5 text-gray-400" />
//                                         View Vehicles
//                                       </Link>
//                                     )}
//                                   </Menu.Item>
//                                   <Menu.Item>
//                                     {({ active }) => (
//                                       <Link
//                                         href={`/account/manage-team/member-jobs/${member.uid}`}
//                                         className={`${
//                                           active
//                                             ? "bg-gray-100 text-gray-900"
//                                             : "text-gray-700"
//                                         } flex items-center px-4 py-2 text-sm`}
//                                       >
//                                         <FiBriefcase className="mr-3 h-5 w-5 text-gray-400" />
//                                         View Jobs
//                                       </Link>
//                                     )}
//                                   </Menu.Item>
//                                 </div>
//                               </Menu.Items>
//                             </Transition>
//                           </Menu>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan={6}
//                     className="px-6 py-4 text-center text-sm text-gray-500"
//                   >
//                     No team members found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Mobile Card View */}
//         <div className="lg:hidden space-y-4">
//           {filteredMembers.length > 0 ? (
//             filteredMembers.map((member) => (
//               <div
//                 key={member.uid}
//                 className="bg-white rounded-lg shadow-md p-4"
//               >
//                 <div className="flex items-center mb-4">
//                   <img
//                     src={
//                       member.profilePicture ||
//                       "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
//                     }
//                     alt={member.userName}
//                     className="h-12 w-12 rounded-full mr-4"
//                   />
//                   <div>
//                     <h3 className="text-lg font-medium text-gray-900">
//                       {member.userName}
//                     </h3>
//                     <p className="text-sm text-gray-500">{member.role}</p>
//                     <span
//                       className={`px-2 text-xs leading-5 font-semibold rounded-full ${
//                         member.active
//                           ? "bg-green-100 text-green-800"
//                           : "bg-red-100 text-red-800"
//                       }`}
//                     >
//                       {member.active ? "Active" : "Inactive"}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <p className="text-sm text-gray-500">
//                     <span className="font-medium">Email:</span> {member.email}
//                   </p>
//                   <p className="text-sm text-gray-500">
//                     <span className="font-medium">Phone:</span>{" "}
//                     {member.phoneNumber}
//                   </p>
//                 </div>
//                 <div className="mt-4 flex justify-end">
//                   <input
//                     type="checkbox"
//                     className="toggle toggle-success"
//                     checked={member.active}
//                     onChange={() =>
//                       handleToggleActive(member.uid, member.active)
//                     }
//                   />
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
//               No team members found
//             </div>
//           )}
//         </div>

//         {/* Pagination Controls */}
//         <div className="mt-6 flex justify-center gap-4">
//           <button
//             onClick={handlePrevious}
//             disabled={!firstDoc}
//             className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Previous
//           </button>
//           <button
//             onClick={handleNext}
//             disabled={!lastDoc}
//             className="bg-[#F96176] text-white px-4 py-2 rounded-md shadow-sm hover:bg-[#e54d62] disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

/* eslint-disable @next/next/no-img-element */
"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  where,
  query,
  limit,
  startAfter,
  endBefore,
  Timestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
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
} from "react-icons/fi";
import { Menu, Switch, Transition } from "@headlessui/react";

interface ManageTeamProps {
  active: boolean;
  createdBy: string;
  created_at: Timestamp;
  email: string;
  isTeamMember: boolean;
  phoneNumber: string;
  profilePicture: string;
  role: string;
  uid: string;
  updated_at: Timestamp;
  userName: string;
}

export default function ManageTeam(): JSX.Element {
  const [teamMembers, setTeamMembers] = useState<ManageTeamProps[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth() || { user: null };

  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstDoc, setFirstDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [filteredMembers, setFilteredMembers] = useState<ManageTeamProps[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");

  const itemsPerPage = 5;

  const roles = [
    "All",
    "Manager",
    "Driver",
    "Vendor",
    "Accountant",
    "Other staff",
  ];

  const handleToggleActive = async (
    memberId: string,
    currentActive: boolean
  ) => {
    if (!user) return;
    try {
      const memberRef = doc(db, "Users", memberId);
      await updateDoc(memberRef, {
        active: !currentActive,
      });
      toast.success(
        `Team member ${
          currentActive ? "deactivated" : "activated"
        } successfully`
      );
      // Refresh the list
      fetchTeamMembers("initial");
    } catch (error) {
      console.error("Error toggling member status:", error);
      toast.error("Failed to update member status");
    }
  };

  const fetchTeamMembers = async (direction: "next" | "prev" | "initial") => {
    setLoading(true);
    if (user) {
      try {
        const usersRef = collection(db, "Users");
        let q;

        if (direction === "next" && lastDoc) {
          q = query(
            usersRef,
            where("createdBy", "==", user.uid),
            where("uid", "!=", user.uid),
            startAfter(lastDoc),
            limit(itemsPerPage)
          );
        } else if (direction === "prev" && firstDoc) {
          q = query(
            usersRef,
            where("createdBy", "==", user.uid),
            where("uid", "!=", user.uid),
            endBefore(firstDoc),
            limit(itemsPerPage)
          );
        } else {
          q = query(
            usersRef,
            where("createdBy", "==", user.uid),
            where("uid", "!=", user.uid),
            limit(itemsPerPage)
          );
        }

        const querySnapshot = await getDocs(q);
        console.log("Query Snapshot Size:", querySnapshot.size);
        if (!querySnapshot.empty) {
          const fetchedData = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              active: data.active,
              createdBy: data.createdBy,
              created_at: data.created_at,
              email: data.email,
              role: data.role,
              uid: data.uid,
              updated_at: data.updated_at,
              userName: data.userName,
              isTeamMember: data.isTeamMember,
              phoneNumber: data.phoneNumber,
              profilePicture: data.profilePicture,
            } as ManageTeamProps;
          });

          setTeamMembers(fetchedData);
          setFilteredMembers(fetchedData.filter((member) => member.active));

          setFirstDoc(querySnapshot.docs[0]);
          setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);

          console.log("Fetched team members:", fetchedData);
        } else if (direction === "next") {
          toast.error("No more team members to show.");
        } else {
          console.log("No team members found for initial load.");
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast.error("Failed to fetch team members. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTeamMembers("initial");
  }, [user]);

  useEffect(() => {
    let results = teamMembers;

    // Apply active/inactive filter based on tab
    results = results.filter((member) =>
      activeTab === "active" ? member.active : !member.active
    );

    // Apply role filter
    if (roleFilter !== "All") {
      results = results.filter(
        (member) => member.role.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (member) =>
          member.userName.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          (member.phoneNumber && member.phoneNumber.includes(query)) ||
          member.role.toLowerCase().includes(query)
      );
    }

    setFilteredMembers(results);
  }, [searchQuery, roleFilter, teamMembers, activeTab]);

  const handleNext = () => fetchTeamMembers("next");
  const handlePrevious = () => fetchTeamMembers("prev");

  const resetFilters = () => {
    setSearchQuery("");
    setRoleFilter("All");
    setActiveTab("active");
    setFilteredMembers(teamMembers.filter((member) => member.active));
  };

  if (!user) {
    return <div>Please log in to access the manage team page.</div>;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white shadow-sm rounded-lg mb-6 p-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl text-gray-800 font-bold mb-4 sm:mb-0">
            Manage Team
          </h1>
          <Link href="/account/manage-team/create-team-member">
            <button className="bg-[#F96176] hover:bg-[#e54d62] transition-colors text-white py-2 px-6 rounded-lg shadow-md flex items-center">
              <span className="mr-2">+</span>
              Create Member
            </button>
          </Link>
        </div>

        {/* Search and Filter Section */}
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
                    {roles.map((role) => (
                      <div key={role} className="flex items-center">
                        <input
                          type="radio"
                          id={`role-${role}`}
                          name="roleFilter"
                          checked={roleFilter === role}
                          onChange={() => setRoleFilter(role)}
                          className="h-4 w-4 text-[#F96176] focus:ring-[#F96176] border-gray-300"
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
                  {(searchQuery || roleFilter !== "All") && (
                    <button
                      onClick={resetFilters}
                      className="mt-3 text-sm text-[#F96176] hover:text-[#e54d62]"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {(searchQuery || roleFilter !== "All") && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredMembers.length} results
              {(searchQuery || roleFilter !== "All") && (
                <button
                  onClick={resetFilters}
                  className="ml-2 text-[#F96176] hover:text-[#e54d62]"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === "active"
                ? "border-b-2 border-[#F96176] text-[#F96176]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("active")}
          >
            Active Members
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === "inactive"
                ? "border-b-2 border-[#F96176] text-[#F96176]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("inactive")}
          >
            Inactive Members
          </button>
        </div>

        {/* Desktop Table View */}
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
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
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
                [...filteredMembers]
                  .sort((a, b) => a.userName.localeCompare(b.userName))
                  .map((member) => (
                    <tr
                      key={member.uid}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={member.profilePicture || "/default-avatar.png"}
                            alt={member.userName}
                            className="h-10 w-10 rounded-full mr-3"
                          />
                          <div className="text-sm font-medium text-gray-900">
                            {member.userName} ({member.role})
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
                        {member.role}
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

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative">
                        <div className="flex items-center space-x-4">
                          <Switch
                            checked={member.active || false}
                            onChange={() =>
                              handleToggleActive(member.uid, member.active)
                            }
                            className={`${
                              member.active ? "bg-[#F96176]" : "bg-gray-200"
                            }
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                          >
                            <span
                              className={`${
                                member.active
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </Switch>

                          <Menu as="div" className="relative">
                            <div>
                              <Menu.Button className="inline-flex justify-center w-8 h-8 p-1 text-gray-400 hover:text-gray-500 focus:outline-none">
                                <FiMoreVertical className="h-5 w-5" />
                              </Menu.Button>
                            </div>

                            <Transition
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
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
                                  <Menu.Item>
                                    {({ active }) => (
                                      <Link
                                        href={`/account/manage-team/member-trips/${member.uid}`}
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
                                        href={`/account/manage-team/member-jobs/${member.uid}`}
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
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No {activeTab === "active" ? "active" : "inactive"} team
                    members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div
                key={member.uid}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={
                      member.profilePicture ||
                      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658"
                    }
                    alt={member.userName}
                    className="h-12 w-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {member.userName}
                    </h3>
                    <p className="text-sm text-gray-500">{member.role}</p>
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
                </div>
                <div className="mt-4 flex justify-end">
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={member.active}
                    onChange={() =>
                      handleToggleActive(member.uid, member.active)
                    }
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
              No {activeTab === "active" ? "active" : "inactive"} team members
              found
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={!firstDoc}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!lastDoc}
            className="bg-[#F96176] text-white px-4 py-2 rounded-md shadow-sm hover:bg-[#e54d62] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
