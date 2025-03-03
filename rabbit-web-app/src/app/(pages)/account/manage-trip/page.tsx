// "use client";

// import { useAuth } from "@/contexts/AuthContexts";
// import { db } from "@/lib/firebase";
// import { ProfileValues } from "@/types/types";
// import { GlobalToastError } from "@/utils/globalErrorToast";
// import { LoadingIndicator } from "@/utils/LoadinIndicator";
// import {
//   addDoc,
//   collection,
//   doc,
//   onSnapshot,
//   Timestamp,
// } from "firebase/firestore";
// import { useEffect, useState } from "react";

// interface CustomRowButtonProps {
//   icon: string;
//   label: string;
//   color: string;
//   onClick: () => void;
// }

// export default function ManageTripPage() {
//   const { user } = useAuth() || { user: null };
//   const [showAddTrip, setShowAddTrip] = useState(false);
//   const [showAddMileageOrExpense, setShowAddMileageOrExpense] = useState(false);
//   const [showViewTrips, setShowViewTrips] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [userData, setUserData] = useState<ProfileValues | null>(null);
//   const [role, setRole] = useState("");
//   const [tripName, setTripName] = useState("");
//   const [currentMiles, setCurrentMiles] = useState("");
//   const [oEarnings, setOEarnings] = useState("");
//   const [selectedDate, setSelectedDate] = useState<Date | null>(null);

//   const handleAddTrip = async () => {
//     setIsLoading(true);
//     try {
//       if (!user?.uid) {
//         throw new Error("User not authenticated");
//       }
//       if (tripName && currentMiles) {
//         const tripData = {
//           tripName,
//           totalMiles: 0,
//           tripStartMiles: Number(currentMiles),
//           tripEndMiles: 0,
//           currentMiles: Number(currentMiles),
//           previousMiles: Number(currentMiles),
//           milesArray: [
//             {
//               mile: Number(currentMiles),
//               date: Timestamp.now(),
//             },
//           ],
//           isPaid: false,
//           tripStatus: 1,
//           tripStartDate: selectedDate || new Date(),
//           tripEndDate: new Date(),
//           createdAt: Timestamp.now(),
//           updatedAt: Timestamp.now(),
//           oEarnings: role === "Owner" ? Number(oEarnings) : 0,
//         };

//         await addDoc(collection(doc(db, "Users", user.uid), "trips"), tripData);

//         setTripName("");
//         setCurrentMiles("");
//         setOEarnings("");
//         setSelectedDate(null);
//       }
//     } catch (error) {
//       GlobalToastError(error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleAddExpense = () => {
//     setShowAddTrip(false);
//     setShowAddMileageOrExpense(!showAddMileageOrExpense);
//     setShowViewTrips(false);
//   };

//   useEffect(() => {
//     if (!user) return;

//     setIsLoading(true);

//     // Set up real-time listener for user profile
//     const userRef = doc(db, "Users", user?.uid);
//     const unsubscribe = onSnapshot(
//       userRef,
//       (doc) => {
//         if (doc.exists()) {
//           const userProfile = doc.data() as ProfileValues;
//           setUserData(userProfile);
//           setRole(userProfile.role);
//         } else {
//           GlobalToastError("User document not found");
//         }
//         setIsLoading(false);
//       },
//       (error) => {
//         GlobalToastError(error);
//         setIsLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [user]);

//   if (!user) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <h1 className="text-xl font-semibold text-gray-800">
//           Please login first to access this page
//         </h1>
//       </div>
//     );
//   }

//   if (isLoading) {
//     return <LoadingIndicator />;
//   }

//   return (
//     <div className="h-screen gap-y-4 ">
//       <div className="px-3 flex justify-center space-x-4 ">
//         <CustomRowButton
//           icon="+"
//           label="Add Trip"
//           color="bg-blue-500"
//           onClick={handleAddTrip}
//         />
//         <CustomRowButton
//           icon="+"
//           label="Add Expenses"
//           color="bg-[#F96176]"
//           onClick={handleAddExpense}
//         />
//       </div>

//       {showAddTrip && (
//         <div className="mt-4 p-4 bg-white shadow rounded">
//           <input
//             type="text"
//             value={tripName}
//             onChange={(e) => setTripName(e.target.value)}
//             placeholder="Trip Name"
//             className="border p-2 w-full mb-2"
//           />
//           <input
//             type="number"
//             value={currentMiles}
//             onChange={(e) => setCurrentMiles(e.target.value)}
//             placeholder="Current Miles"
//             className="border p-2 w-full mb-2"
//           />
//           {role === "Owner" && (
//             <input
//               type="number"
//               value={oEarnings}
//               onChange={(e) => setOEarnings(e.target.value)}
//               placeholder="Earnings"
//               className="border p-2 w-full mb-2"
//             />
//           )}
//           <input
//             type="date"
//             value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
//             onChange={(e) => setSelectedDate(new Date(e.target.value))}
//             className="border p-2 w-full mb-2"
//           />
//           <button
//             onClick={handleAddTrip}
//             className="bg-blue-500 text-white p-2 rounded"
//           >
//             Add Trip
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// const CustomRowButton: React.FC<CustomRowButtonProps> = ({
//   icon,
//   label,
//   color,
//   onClick,
// }) => {
//   return (
//     <button
//       onClick={onClick}
//       className={`${color} text-white px-4 py-2 rounded flex items-center gap-2`}
//     >
//       <span>{icon}</span>
//       <span>{label}</span>
//     </button>
//   );
// };
