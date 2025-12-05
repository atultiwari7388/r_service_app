// "use client";

// import { useAuth } from "@/contexts/AuthContexts";
// import { db } from "@/lib/firebase";
// import { GlobalToastError, GlobalToastSuccess } from "@/utils/globalErrorToast";
// import { LoadingIndicator } from "@/utils/LoadinIndicator";
// import {
//   addDoc,
//   collection,
//   doc,
//   getDocs,
//   onSnapshot,
//   query,
//   serverTimestamp,
//   Timestamp,
//   where,
//   writeBatch,
//   orderBy,
//   updateDoc,
//   getDoc,
// } from "firebase/firestore";
// import React, { useEffect, useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { format } from "date-fns";
// import {
//   FiPlus,
//   FiX,
//   FiFilter,
//   FiPrinter,
//   FiUser,
//   FiCalendar,
//   // FiClock,
//   FiList,
//   FiEdit2,
//   FiFileText,
//   // FiTrash2,
//   FiSave,
//   FiHash,
// } from "react-icons/fi";
// import { FaFileAlt } from "react-icons/fa";

// interface ServiceDetail {
//   serviceName: string;
//   amount: number;
// }

// interface Trip {
//   id: string;
//   tripName: string;
//   oEarnings: number;
// }

// interface Member {
//   name: string;
//   email: string;
//   isActive: boolean;
//   memberId: string;
//   ownerId: string;
//   vehicles: { companyName: string; vehicleNumber: string }[];
//   perMileCharge: number;
//   role: string;
// }

// interface Check {
//   id: string;
//   checkNumber: number;
//   type: string;
//   userId: string;
//   userName: string;
//   serviceDetails: ServiceDetail[];
//   totalAmount: number;
//   memoNumber?: string;
//   date: Date;
//   address: string;
//   city: string;
//   state: string;
//   country: string;
//   postalCode: string;
//   createdBy: string;
//   createdAt: string;
// }

// interface CheckSeries {
//   id: string;
//   userId: string;
//   startNumber: string;
//   endNumber: string;
//   totalChecks: number;
//   createdAt: Date;
// }

// export default function ManageCheckScreen() {
//   const [role, setUserRole] = useState<string>("");
//   const [isCheque, setIsCheque] = useState<boolean>(false);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [allMembers, setAllMembers] = useState<Member[]>([]);
//   const [checks, setChecks] = useState<Check[]>([]);
//   const [loadingChecks, setLoadingChecks] = useState<boolean>(true);
//   const [filterType, setFilterType] = useState<string | null>(null);
//   const [startDate, setStartDate] = useState<Date | null>(null);
//   const [endDate, setEndDate] = useState<Date | null>(null);
//   const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
//   const [showWriteCheck, setShowWriteCheck] = useState<boolean>(false);
//   const [selectedType, setSelectedType] = useState<string | null>(null);
//   const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
//   const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
//   const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>([]);
//   const [memoNumber, setMemoNumber] = useState<string>("");
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
//   const [totalAmount, setTotalAmount] = useState<number>(0);
//   const [showAddDetail, setShowAddDetail] = useState<boolean>(false);
//   const [unpaidTrips, setUnpaidTrips] = useState<Trip[]>([]);
//   const [checkNumber, setCheckNumber] = useState<string>("");
//   const [currentCheckNumber, setCurrentCheckNumber] = useState<string | null>(
//     null
//   );
//   const [checkSeries, setCheckSeries] = useState<CheckSeries[]>([]);
//   const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
//   const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
//   const [effectiveUserId, setEffectiveUserId] = useState("");
//   const [currentUserRole, setCurrentUserRole] = useState("");
//   const [showAddSeries, setShowAddSeries] = useState<boolean>(false);
//   const [showCheckSeries, setShowCheckSeries] = useState<boolean>(false);
//   const [startSeriesNumber, setStartSeriesNumber] = useState<string>("");
//   const [endSeriesNumber, setEndSeriesNumber] = useState<string>("");
//   const [addingSeries, setAddingSeries] = useState<boolean>(false);

//   const { user } = useAuth() || { user: null };

//   useEffect(() => {
//     if (!user) return;

//     setIsLoading(true);
//     const userRef = doc(db, "Users", user.uid);
//     const unsubscribe = onSnapshot(
//       userRef,
//       (docSnap) => {
//         if (docSnap.exists()) {
//           const userProfile = docSnap.data();
//           setUserRole(userProfile.role || "");
//           setCurrentUserRole(userProfile.role || "");

//           // Determine effectiveUserId based on role
//           if (userProfile.role === "SubOwner" && userProfile.createdBy) {
//             setEffectiveUserId(userProfile.createdBy);
//             console.log(
//               `SubOwner detected, using createdBy as effectiveUserId ${userProfile.createdBy} ${currentUserRole}`
//             );
//           } else {
//             setEffectiveUserId(user.uid);
//           }

//           setIsCheque(userProfile.isCheque || false);
//           setCurrentCheckNumber(userProfile.currentCheckNumber || null);
//           setIsAnonymous(userProfile.isAnonymous || true);
//           setIsProfileComplete(userProfile.isProfileComplete || false);
//         } else {
//           GlobalToastError("User document not found");
//         }
//         setIsLoading(false);
//       },
//       (error: Error) => {
//         GlobalToastError(error.message || "Error fetching user data");
//         console.error("Error fetching user data:", error);
//         setIsLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [user]);

//   useEffect(() => {
//     if (effectiveUserId && isCheque) {
//       fetchTeamMembersWithVehicles();
//       fetchChecks();
//       fetchCheckSeries();
//     }
//   }, [effectiveUserId, isCheque]);

//   const fetchTeamMembersWithVehicles = async () => {
//     try {
//       if (!effectiveUserId) return;

//       const teamQuery = query(
//         collection(db, "Users"),
//         where("active", "==", true),
//         where("createdBy", "==", effectiveUserId),
//         where("uid", "!=", effectiveUserId)
//       );

//       const teamSnapshot = await getDocs(teamQuery);
//       const members: Member[] = [];

//       for (const memberDoc of teamSnapshot.docs) {
//         const memberData = memberDoc.data();
//         const memberId = memberData.uid;

//         const vehiclesQuery = query(
//           collection(db, "Users", memberId, "Vehicles")
//         );
//         const vehiclesSnapshot = await getDocs(vehiclesQuery);

//         const vehicles = vehiclesSnapshot.docs
//           .map((vehicleDoc) => ({
//             companyName: vehicleDoc.data().companyName || "No Company",
//             vehicleNumber: vehicleDoc.data().vehicleNumber || "No Number",
//           }))
//           .sort((a, b) =>
//             a.vehicleNumber
//               .toLowerCase()
//               .localeCompare(b.vehicleNumber.toLowerCase())
//           );

//         members.push({
//           name: memberData.userName || "No Name",
//           email: memberData.email || "No Email",
//           isActive: memberData.active || false,
//           memberId: memberId,
//           ownerId: memberData.createdBy,
//           vehicles: vehicles,
//           perMileCharge: memberData.perMileCharge || 0,
//           role: memberData.role || "",
//         });
//       }

//       setAllMembers(members);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const fetchChecks = async () => {
//     try {
//       if (!effectiveUserId) return;

//       setLoadingChecks(true);
//       let checksQuery = query(
//         collection(db, "Checks"),
//         where("createdBy", "==", effectiveUserId),
//         orderBy("date", "desc")
//       );

//       if (filterType) {
//         checksQuery = query(checksQuery, where("type", "==", filterType));
//       }

//       if (startDate && endDate) {
//         checksQuery = query(
//           checksQuery,
//           where("date", ">=", Timestamp.fromDate(startDate)),
//           where("date", "<=", Timestamp.fromDate(endDate))
//         );
//       }

//       const snapshot = await getDocs(checksQuery);
//       const checksData: Check[] = snapshot.docs.map((doc) => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           checkNumber: data.checkNumber || 0,
//           type: data.type || "",
//           userId: effectiveUserId || "",
//           userName: data.userName || "",
//           serviceDetails: data.serviceDetails || [],
//           totalAmount: data.totalAmount || 0,
//           memoNumber: data.memoNumber || undefined,
//           date: data.date?.toDate() || new Date(),
//           createdBy: data.createdBy || "",
//           createdAt: data.createdAt,
//           address: data.address || "",
//           city: data.city || "",
//           state: data.state || "",
//           country: data.country || "",
//           postalCode: data.postalCode || "",
//         };
//       });

//       setChecks(checksData);
//     } catch (error) {
//       console.error(error);
//       GlobalToastError("Error loading checks");
//     } finally {
//       setLoadingChecks(false);
//     }
//   };

//   const fetchCheckSeries = async () => {
//     try {
//       if (!effectiveUserId) return;

//       const seriesQuery = query(
//         collection(db, "CheckSeries"),
//         where("userId", "==", effectiveUserId),
//         orderBy("createdAt", "desc")
//       );

//       const snapshot = await getDocs(seriesQuery);
//       const seriesData: CheckSeries[] = snapshot.docs.map((doc) => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           userId: data.userId,
//           startNumber: data.startNumber,
//           endNumber: data.endNumber,
//           totalChecks: data.totalChecks || 0,
//           createdAt: data.createdAt?.toDate() || new Date(),
//         };
//       });

//       setCheckSeries(seriesData);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   useEffect(() => {
//     if (effectiveUserId && isCheque) {
//       fetchChecks();
//     }
//   }, [filterType, startDate, endDate, effectiveUserId, isCheque]);

//   useEffect(() => {
//     // Calculate total whenever serviceDetails changes
//     const total = serviceDetails.reduce((sum, detail, index) => {
//       // First row: must have service name (amount can be 0, positive, or negative)
//       if (index === 0) {
//         if (detail.serviceName.trim() !== "") {
//           // For first row, include the amount even if it's 0 or negative
//           return sum + (isNaN(detail.amount) ? 0 : detail.amount);
//         }
//         return sum;
//       }
//       // Other rows: include amount if it's entered (can be 0, positive, or negative)
//       // Service name is optional for other rows
//       else if (detail.amount !== 0 || detail.serviceName.trim() !== "") {
//         return sum + (isNaN(detail.amount) ? 0 : detail.amount);
//       }
//       return sum;
//     }, 0);
//     setTotalAmount(total);
//   }, [serviceDetails]);

//   const calculateTotal = (details: ServiceDetail[]) => {
//     const total = details.reduce((sum, detail, index) => {
//       // First row: must have service name (amount can be 0, positive, or negative)
//       if (index === 0) {
//         if (detail.serviceName.trim() !== "") {
//           // For first row, include the amount even if it's 0 or negative
//           return sum + (isNaN(detail.amount) ? 0 : detail.amount);
//         }
//         return sum;
//       }
//       // Other rows: include amount if it's entered OR if service name exists
//       else if (detail.amount !== 0 || detail.serviceName.trim() !== "") {
//         return sum + (isNaN(detail.amount) ? 0 : detail.amount);
//       }
//       return sum;
//     }, 0);
//     setTotalAmount(total);
//   };

//   const generateCheckNumbers = (start: string, end: string): string[] => {
//     const checkNumbers: string[] = [];

//     try {
//       // Extract prefix and numeric parts
//       const prefix = start.replace(/\d/g, "");
//       const endPrefix = end.replace(/\d/g, "");

//       // Verify prefixes match
//       if (prefix !== endPrefix) {
//         GlobalToastError("Number prefixes must match");
//         return [];
//       }

//       // Extract numeric parts
//       const startNumStr = start.replace(prefix, "");
//       const endNumStr = end.replace(prefix, "");

//       const startNum = parseInt(startNumStr);
//       const endNum = parseInt(endNumStr);

//       if (startNum >= endNum) {
//         GlobalToastError("End number must be greater than start number");
//         return [];
//       }

//       // Generate all numbers in the range
//       for (let i = startNum; i <= endNum; i++) {
//         // Format number with leading zeros to match the original format
//         let numStr = i.toString();
//         if (startNumStr.length > numStr.length) {
//           numStr = numStr.padStart(startNumStr.length, "0");
//         }

//         checkNumbers.push(`${prefix}${numStr}`);
//       }
//     } catch (error) {
//       GlobalToastError("Error generating check numbers");
//       console.error(error);
//       return [];
//     }

//     return checkNumbers;
//   };

//   const handleAddCheckSeries = async () => {
//     if (!startSeriesNumber || !endSeriesNumber) {
//       GlobalToastError("Please enter both start and end numbers");
//       return;
//     }

//     setAddingSeries(true);

//     try {
//       // Generate the check numbers
//       const checkNumbers = generateCheckNumbers(
//         startSeriesNumber,
//         endSeriesNumber
//       );

//       if (checkNumbers.length === 0) {
//         return;
//       }

//       // Save the series to Firestore
//       const seriesRef = await addDoc(collection(db, "CheckSeries"), {
//         userId: effectiveUserId,
//         startNumber: startSeriesNumber,
//         endNumber: endSeriesNumber,
//         createdAt: serverTimestamp(),
//         totalChecks: checkNumbers.length,
//       });

//       // Save individual check numbers to a subcollection
//       const batch = writeBatch(db);

//       for (const checkNumber of checkNumbers) {
//         const docRef = doc(
//           collection(db, "CheckSeries", seriesRef.id, "Checks")
//         );
//         batch.set(docRef, {
//           checkNumber: checkNumber,
//           isUsed: false,
//           seriesId: seriesRef.id,
//           userId: effectiveUserId,
//           createdAt: serverTimestamp(),
//         });
//       }

//       await batch.commit();

//       // Update current check number if not set
//       if (!currentCheckNumber) {
//         await updateDoc(doc(db, "Users", effectiveUserId), {
//           currentCheckNumber: startSeriesNumber,
//         });
//         setCurrentCheckNumber(startSeriesNumber);
//       }

//       GlobalToastSuccess("Check series saved successfully!");

//       // Reset form and close
//       setStartSeriesNumber("");
//       setEndSeriesNumber("");
//       setShowAddSeries(false);

//       // Refresh data
//       await fetchCheckSeries();
//     } catch (error) {
//       GlobalToastError("Error saving check series");
//       console.error(error);
//     } finally {
//       setAddingSeries(false);
//     }
//   };

//   const getNextAvailableCheckNumber = async (): Promise<string | null> => {
//     if (!currentCheckNumber) return null;

//     try {
//       const seriesQuery = query(
//         collection(db, "CheckSeries"),
//         where("userId", "==", effectiveUserId)
//       );
//       const seriesSnapshot = await getDocs(seriesQuery);

//       let allCheckNumbers: string[] = [];

//       for (const seriesDoc of seriesSnapshot.docs) {
//         const checksQuery = query(
//           collection(db, "CheckSeries", seriesDoc.id, "Checks")
//         );
//         const checksSnapshot = await getDocs(checksQuery);

//         const checkNumbers = checksSnapshot.docs.map(
//           (doc) => doc.data().checkNumber as string
//         );
//         allCheckNumbers = [...allCheckNumbers, ...checkNumbers];
//       }

//       allCheckNumbers.sort((a, b) => {
//         const prefixA = a.replace(/\d/g, "");
//         const prefixB = b.replace(/\d/g, "");

//         if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);

//         const numA = parseInt(a.replace(prefixA, ""));
//         const numB = parseInt(b.replace(prefixB, ""));
//         return numA - numB;
//       });

//       for (const checkNumber of allCheckNumbers) {
//         const usedCheckQuery = query(
//           collection(db, "Checks"),
//           where("checkNumber", "==", checkNumber),
//           where("createdBy", "==", effectiveUserId)
//         );
//         const usedCheckSnapshot = await getDocs(usedCheckQuery);

//         if (usedCheckSnapshot.empty) {
//           return checkNumber;
//         }
//       }

//       return null;
//     } catch (error) {
//       console.error("Error getting next check number:", error);
//       return null;
//     }
//   };

//   const updateCheckNumberUsage = async (checkNumber: string) => {
//     try {
//       const seriesQuery = query(
//         collection(db, "CheckSeries"),
//         where("userId", "==", effectiveUserId)
//       );
//       const seriesSnapshot = await getDocs(seriesQuery);

//       for (const seriesDoc of seriesSnapshot.docs) {
//         const checksQuery = query(
//           collection(db, "CheckSeries", seriesDoc.id, "Checks"),
//           where("checkNumber", "==", checkNumber)
//         );
//         const checksSnapshot = await getDocs(checksQuery);

//         if (!checksSnapshot.empty) {
//           await updateDoc(
//             doc(
//               db,
//               "CheckSeries",
//               seriesDoc.id,
//               "Checks",
//               checksSnapshot.docs[0].id
//             ),
//             {
//               isUsed: true,
//               usedAt: serverTimestamp(),
//               usedBy: effectiveUserId,
//             }
//           );
//           break;
//         }
//       }

//       if (user) {
//         await updateDoc(doc(db, "Users", effectiveUserId), {
//           currentCheckNumber: checkNumber,
//         });
//       }
//     } catch (error) {
//       console.error("Error updating check number usage:", error);
//     }
//   };

//   const handleWriteCheck = async () => {
//     if (isAnonymous && !isProfileComplete) {
//       GlobalToastError("Please create an account to write checks.");
//       return;
//     }

//     setSelectedType(null);
//     setSelectedUserId(null);
//     setSelectedUserName(null);
//     // Initialize with 5 empty service details
//     setServiceDetails([
//       { serviceName: "", amount: 0 },
//       { serviceName: "", amount: 0 },
//       { serviceName: "", amount: 0 },
//       { serviceName: "", amount: 0 },
//       { serviceName: "", amount: 0 },
//     ]);
//     setMemoNumber("");
//     setSelectedDate(new Date());
//     setTotalAmount(0);

//     const nextCheckNumber = await getNextAvailableCheckNumber();
//     if (nextCheckNumber) {
//       setCheckNumber(nextCheckNumber);
//       setShowWriteCheck(true);
//       console.log(`Next check number: ${showAddDetail}`);
//       console.log(`Service details initialized: ${setUnpaidTrips}`);
//     } else {
//       GlobalToastError(
//         "No available check numbers. Please add a check series first."
//       );
//     }
//   };

//   const handleCancelWriteCheck = () => {
//     setShowWriteCheck(false);
//     setSelectedType(null);
//     setSelectedUserId(null);
//     setSelectedUserName(null);
//     setServiceDetails([]);
//     setMemoNumber("");
//     setSelectedDate(new Date());
//     setTotalAmount(0);
//     setShowAddDetail(false);
//   };

//   const saveCheck = async () => {
//     // Filter out service details based on the new logic
//     const nonEmptyDetails = serviceDetails.filter((detail, index) => {
//       // First row: must have service name (amount can be 0 or negative)
//       if (index === 0) {
//         return detail.serviceName.trim() !== "";
//       }
//       // Other rows: can have either service name OR amount (amount can be 0 or negative)
//       return detail.serviceName.trim() !== "" || detail.amount !== 0;
//     });

//     if (
//       !selectedUserId ||
//       nonEmptyDetails.length === 0 ||
//       !effectiveUserId ||
//       !checkNumber
//     ) {
//       GlobalToastError("Please fill at least the first service detail");
//       return;
//     }

//     // Ensure we include 0 amounts properly
//     const detailsToSave = nonEmptyDetails.map((detail) => ({
//       serviceName: detail.serviceName,
//       amount: isNaN(detail.amount) ? 0 : detail.amount,
//     }));

//     try {
//       const checkData = {
//         checkNumber: checkNumber,
//         type: selectedType,
//         userId: selectedUserId,
//         userName: selectedUserName,
//         serviceDetails: detailsToSave,
//         totalAmount: totalAmount,
//         memoNumber: memoNumber || null,
//         date: Timestamp.fromDate(selectedDate),
//         createdBy: effectiveUserId,
//         createdAt: serverTimestamp(),
//       };

//       await addDoc(collection(db, "Checks"), checkData);

//       await updateCheckNumberUsage(checkNumber);

//       if (selectedType === "Driver") {
//         const batch = writeBatch(db);
//         unpaidTrips.forEach((trip) => {
//           const tripRef = doc(db, "Users", selectedUserId, "trips", trip.id);
//           batch.update(tripRef, { isPaid: true });
//         });
//         await batch.commit();
//       }

//       GlobalToastSuccess("Check created successfully!");
//       handleCancelWriteCheck();
//       fetchChecks();
//     } catch (error) {
//       console.error(error);
//       GlobalToastError("Error saving check");
//     }
//   };

//   const handlePrint = async (check: Check) => {
//     // Fetch address if missing
//     let printCheck = { ...check };
//     if (!check.address || !check.city || !check.state) {
//       try {
//         const userAddress = await fetchUserAddress(check.userId);
//         printCheck = {
//           ...check,
//           address: userAddress.street || "",
//           city: userAddress.city || "",
//           state: userAddress.state || "",
//           postalCode: userAddress.postalCode || "",
//           country: userAddress.country || "",
//         };
//       } catch (error) {
//         console.error("Error fetching user address:", error);
//       }
//     }

//     /* -----------------------------
//       Words conversion functions
//      ----------------------------- */
//     function numberToWords(num: number): string {
//       if (num === 0) return "Zero";

//       const units = [
//         "",
//         "One",
//         "Two",
//         "Three",
//         "Four",
//         "Five",
//         "Six",
//         "Seven",
//         "Eight",
//         "Nine",
//       ];

//       const teens = [
//         "Ten",
//         "Eleven",
//         "Twelve",
//         "Thirteen",
//         "Fourteen",
//         "Fifteen",
//         "Sixteen",
//         "Seventeen",
//         "Eighteen",
//         "Nineteen",
//       ];

//       const tens = [
//         "",
//         "",
//         "Twenty",
//         "Thirty",
//         "Forty",
//         "Fifty",
//         "Sixty",
//         "Seventy",
//         "Eighty",
//         "Ninety",
//       ];

//       function underThousand(n: number): string {
//         let w = "";

//         if (Math.floor(n / 100) > 0) {
//           w += units[Math.floor(n / 100)] + " Hundred ";
//           n %= 100;
//         }

//         if (n > 0) {
//           if (n < 10) w += units[n];
//           else if (n < 20) w += teens[n - 10];
//           else {
//             w += tens[Math.floor(n / 10)];
//             if (n % 10 > 0) w += " " + units[n % 10];
//           }
//         }

//         return w.trim();
//       }

//       let words = "";

//       const billions = Math.floor(num / 1_000_000_000);
//       if (billions > 0) {
//         words += underThousand(billions) + " Billion ";
//         num %= 1_000_000_000;
//       }

//       const millions = Math.floor(num / 1_000_000);
//       if (millions > 0) {
//         words += underThousand(millions) + " Million ";
//         num %= 1_000_000;
//       }

//       const thousands = Math.floor(num / 1000);
//       if (thousands > 0) {
//         words += underThousand(thousands) + " Thousand ";
//         num %= 1000;
//       }

//       if (num > 0) {
//         words += underThousand(num);
//       }

//       return words.trim();
//     }

//     function amountToWords(amount: number): string {
//       const whole = Math.floor(amount);
//       const cents = Math.round((amount - whole) * 100);
//       const words = numberToWords(whole);
//       const centsText = `${cents.toString().padStart(2, "0")}/100`;
//       return `${words} and ${centsText}`;
//     }

//     /* -----------------------------
//       ADDRESS LINES
//      ----------------------------- */
//     const addressLines: string[] = [];

//     if (printCheck.address)
//       addressLines.push(printCheck.address.toString().toUpperCase());

//     if (printCheck.city || printCheck.state) {
//       const parts = [];
//       if (printCheck.city) parts.push(printCheck.city.toUpperCase());
//       if (printCheck.state) parts.push(printCheck.state.toUpperCase());
//       addressLines.push(parts.join(", "));
//     }

//     if (printCheck.country || printCheck.postalCode) {
//       const parts = [];
//       if (printCheck.country) parts.push(printCheck.country.toUpperCase());
//       if (printCheck.postalCode)
//         parts.push(printCheck.postalCode.toUpperCase());
//       addressLines.push(parts.join(", "));
//     }

//     // Dynamic space below address (converted from Flutter)
//     let extraMm = 0;
//     const lineCount = addressLines.length;
//     if (lineCount === 0) extraMm = 4;
//     else if (lineCount === 1) extraMm = 7;
//     else if (lineCount === 2) extraMm = 4;
//     else extraMm = 2.5;

//     /* -----------------------------
//       TOP OFFSET (you chose 10mm)
//      ----------------------------- */
//     const globalTop = 9;

//     const dateTopMm = globalTop + 8;
//     const payeeTopMm = globalTop + 23;
//     const wordsTopMm = globalTop + 32;
//     const addressTopMm = globalTop + 42;
//     const memoTopMm = globalTop + 57 + extraMm;
//     const detailsTopMm = globalTop + 90 + extraMm;
//     const duplicateTopMm = globalTop + 190 + extraMm;

//     /* -----------------------------
//       Prepare values
//      ----------------------------- */
//     const formattedDate = format(printCheck.date, "MM/dd/yyyy");
//     const totalFormatted = Number(printCheck.totalAmount).toFixed(2);
//     const amountWordsFormatted = `****${amountToWords(
//       Number(printCheck.totalAmount)
//     )}*******************`;

//     /* -----------------------------
//       Open Print Window
//      ----------------------------- */
//     const printWindow = window.open("", "_blank");
//     if (!printWindow) return;

//     const html = `
// <!doctype html>
// <html>
//   <head>
//     <meta charset="utf-8" />
//     <title>Check</title>

//     <style>
//       @page { size: A4; margin: 0; }

//       /* LOAD UNIVERSE FONT */
//       @font-face {
//         font-family: "Univers";
//         src: url("/fonts/UniversRegular.ttf") format("truetype");
//         font-weight: normal;
//         font-style: normal;
//       }

//       body {
//         margin: 0;
//         padding: 0;
//         background: white;
//         font-family: "Univers", sans-serif;
//         line-height: 1.1;
//         padding-top: 3mm;
//       }

//       .check-container {
//         width: 210mm;
//         height: 297mm;
//         position: relative;
//         font-family: "Univers", sans-serif;
//         margin-left: -3mm;
//         margin-top: 0.7mm; /** adjust as needed */
//       }

//       /* DATE — MOVED RIGHT BY 6mm */
//       .date-row {
//         position: absolute;
//         top: ${dateTopMm}mm;
//         right: 10mm;   /* was 9mm → moved 1mm more right */
//         font-size: 11pt;
//         font-weight: 400;
//         font-family: "Univers", sans-serif;
//       }

//       /* PAYEE + AMOUNT */
//       .payee-row {
//         position: absolute;
//         top: ${payeeTopMm}mm;
//         left: 35mm;     /* 25 was 15mm → moved 10mm more left */
//         right: 10mm;    /* was 10mm → moved 2mm left */
//         font-size: 11pt;
//         text-transform: uppercase;
//         display: flex;
//         justify-content: space-between;
//         font-weight: 400;
//         font-family: "Univers", sans-serif;
//       }


//       /* AMOUNT IN WORDS */
//       .amount-words {
//         position: absolute;
//         top: ${wordsTopMm}mm;
//         left: 15mm;
//         font-size: 11pt;
//         font-weight: 400;
//         font-family: "Univers", sans-serif;
//       }

//       /* ADDRESS */
//       .address-section {
//         position: absolute;
//         top: ${addressTopMm}mm;
//         left: 20mm; /** was 15mm → moved 5mm more right */
//         font-size: 11pt;
//         text-transform: uppercase;
//         font-weight: 400;
//         font-family: "Univers", sans-serif;
//       }
//       .address-line {
//         margin: 2px 0;
//         font-family: "Univers", sans-serif;
//       }

//       /* MEMO */
//       .memo-section {
//         position: absolute;
//         top: ${memoTopMm + 3}mm;
//         left: 20mm; /** was 15mm → moved 5mm more right */
//         font-size: 11pt;
//         font-weight: 400;
//         font-family: "Univers", sans-serif;
//       }

//       /* DETAILS SECTION */
//       .details-section {
//         position: absolute;
//         top: ${detailsTopMm}mm;
//         left: 15mm;
//         right: 9mm;
//         font-family: "Univers", sans-serif;
//       }

//       .check-header {
//         display: flex;
//         justify-content: space-between;
//         text-transform: uppercase;
//         margin-bottom: 5px;
//         font-size: 12pt;
//         font-weight: 400;
//         font-family: "Univers", sans-serif;
//       }

//       .service-line {
//         display: flex;
//         justify-content: space-between;
//         font-size: 13pt;
//         margin: 0;
//         font-weight: 400;
//         font-family: "Univers", sans-serif;
//       }

//       .total-line {
//         font-size: 13pt;
//         display: flex;
//         justify-content: flex-end;
//         margin-top: 4px;
//         font-weight: 400;
//         font-family: "Univers", sans-serif;
//       }

//       /* DUPLICATE SECTION */
//       .duplicate-section {
//         position: absolute;
//         top: ${duplicateTopMm}mm;
//         left: 15mm;
//         right: 9mm;
//         font-size: 12pt;
//         font-weight: 400;
//         font-family: "Univers", sans-serif;
//       }
//     </style>
//   </head>

//   <body>
//     <div class="check-container">

//       <div class="date-row">${formattedDate}</div>

//       <div class="payee-row">
//         <div>${String(printCheck.userName).toUpperCase()}</div>
//         <div>**${totalFormatted}</div>
//       </div>

//       <div class="amount-words">${amountWordsFormatted}</div>

//       <div class="address-section">
//         ${addressLines
//           .map((l) => `<div class="address-line">${l}</div>`)
//           .join("")}
//       </div>

//       <div class="memo-section">${printCheck.memoNumber || ""}</div>

//       <div class="details-section">
//         <div class="check-header">
//           <div>${String(printCheck.userName).toUpperCase()}</div>
//           <div>${formattedDate}</div>
//         </div>

//         ${printCheck.serviceDetails
//           .map(
//             (s: ServiceDetail) => `
//           <div class="service-line">
//             <div>${s.serviceName}</div>
//             <div>$${Number(s.amount).toFixed(2)}</div>
//           </div>`
//           )
//           .join("")}
//           ${
//             printCheck.memoNumber
//               ? `
//         <div class="service-line">
//           <div>${printCheck.memoNumber}</div>
//         </div>
// `
//               : ""
//           }


//         <div class="total-line">$${totalFormatted}</div>
//       </div>

//       <div class="duplicate-section">
//         <div class="check-header">
//           <div>${String(printCheck.userName).toUpperCase()}</div>
//           <div>${formattedDate}</div>
//         </div>

//         ${printCheck.serviceDetails
//           .map(
//             (s: ServiceDetail) => `
//           <div class="service-line">
//             <div>${s.serviceName}</div>
//             <div>$${Number(s.amount).toFixed(2)}</div>
//           </div>`
//           )
//           .join("")}
//           ${
//             printCheck.memoNumber
//               ? `
//       <div class="service-line">
//         <div>${printCheck.memoNumber}</div>
//          </div>
// `
//               : ""
//           }


//         <div class="total-line">$${totalFormatted}</div>
//       </div>

//     </div>

//     <script>
//       window.onload = function() {
//         setTimeout(() => window.print(), 300);
//       };
//     </script>
//   </body>
// </html>
// `;

//     printWindow.document.write(html);
//     printWindow.document.close();
//   };

//   const fetchUserAddress = async (userId: string) => {
//     try {
//       const userDoc = await getDoc(doc(db, "Users", userId));
//       if (userDoc.exists()) {
//         const userData = userDoc.data();
//         return {
//           street: userData.address || userData.street || "",
//           city: userData.city || "",
//           state: userData.state || "",
//           postalCode:
//             userData.zipCode || userData.zip || userData.postalCode || "",
//           country: userData.country || "",
//         };
//       }
//       throw new Error("User not found");
//     } catch (error) {
//       console.error("Error fetching user address:", error);
//       return {
//         street: "",
//         city: "",
//         state: "",
//         postalCode: "",
//         country: "",
//       };
//     }
//   };

//   if (!user) {
//     return <div>Please log in to access the manage team page.</div>;
//   }

//   if (isLoading) {
//     return <LoadingIndicator />;
//   }

//   if (!isCheque) {
//     return <div>You do not have permission to access this page.</div>;
//   }

//   return (
//     <div
//       key={role}
//       className="container py-4 mx-auto"
//       style={{ maxWidth: "1200px" }}
//     >
//       {/* Header Section */}
//       <div className="text-center mb-8">
//         <div className="inline-flex items-center justify-center bg-white p-4 rounded-full shadow-lg mb-4">
//           <FaFileAlt className="text-[#F96176] mr-3" size={32} />
//           <h1 className="text-3xl font-serif font-bold text-gray-800">
//             Check Management
//           </h1>
//         </div>
//         <p className="text-lg text-gray-600 mb-6 italic">
//           &quot;Track and manage all check transactions with precision&quot;
//         </p>

//         {isAnonymous && !isProfileComplete ? (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
//             <p className="text-red-700 font-medium">
//               Please create an account to write checks.
//             </p>
//           </div>
//         ) : (
//           <div className="flex justify-center space-x-4">
//             <button
//               onClick={
//                 showWriteCheck ? handleCancelWriteCheck : handleWriteCheck
//               }
//               className="flex items-center px-6 py-2.5 bg-[#F96176] rounded-full shadow-md hover:bg-[#F96176] transition-all duration-300 text-white"
//             >
//               <FiPlus className="mr-2" />
//               {showWriteCheck ? "Cancel Write Check" : "Write Check"}
//             </button>

//             <button
//               onClick={() => setShowAddSeries(true)}
//               className="flex items-center px-6 py-2.5 bg-[#58BB87] rounded-full shadow-md hover:bg-[#58BB87] transition-all duration-300 text-white"
//             >
//               <FiHash className="mr-2" />
//               Add Check Series
//             </button>

//             <button
//               onClick={() => setShowCheckSeries(!showCheckSeries)}
//               className="flex items-center justify-center px-6 py-2.5 bg-gray-100 rounded-full shadow-md hover:bg-gray-200 transition-all duration-300 text-gray-700 mx-auto"
//             >
//               <FiHash className="mr-2" />
//               {showCheckSeries ? "Hide Check Series" : "Show Check Series"}
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Add Check Series Modal */}
//       {showAddSeries && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center">
//                 <div className="bg-green-100 p-3 rounded-full mr-4">
//                   <FiHash className="text-green-600" size={24} />
//                 </div>
//                 <div>
//                   <h3 className="text-2xl font-serif font-bold text-gray-800">
//                     Add Check Series
//                   </h3>
//                   <p className="text-gray-600">
//                     Create a new range of check numbers
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowAddSeries(false)}
//                 className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
//               >
//                 <FiX size={20} />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Start Number (e.g., RMS001)
//                 </label>
//                 <input
//                   type="text"
//                   value={startSeriesNumber}
//                   onChange={(e) => setStartSeriesNumber(e.target.value)}
//                   placeholder="Enter start number"
//                   className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   End Number (e.g., RMS050)
//                 </label>
//                 <input
//                   type="text"
//                   value={endSeriesNumber}
//                   onChange={(e) => setEndSeriesNumber(e.target.value)}
//                   placeholder="Enter end number"
//                   className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
//                 />
//               </div>

//               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
//                 <p className="text-sm text-yellow-800">
//                   <strong>Note:</strong> Make sure the prefix (e.g.,
//                   &quot;RMS&quot;) matches for both numbers. The end number must
//                   be greater than the start number.
//                 </p>
//               </div>
//             </div>

//             <div className="flex justify-end space-x-3 mt-6">
//               <button
//                 onClick={() => setShowAddSeries(false)}
//                 className="px-6 py-2.5 bg-white border border-gray-300 rounded-full shadow-sm text-gray-700 hover:bg-gray-50 transition-all"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddCheckSeries}
//                 disabled={addingSeries}
//                 className={`px-8 py-2.5 rounded-full shadow-sm transition-all flex items-center ${
//                   addingSeries
//                     ? "bg-gray-300 cursor-not-allowed"
//                     : "bg-[#58BB87] hover:bg-[#58BB87]"
//                 } text-white`}
//               >
//                 {addingSeries ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                     Adding...
//                   </>
//                 ) : (
//                   <>
//                     <FiSave className="mr-2" />
//                     Save Series
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showCheckSeries && (
//         <>
//           {/* Current Check Number Display */}
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
//             <p className="text-lg font-semibold text-blue-800">
//               Current Check Number: {currentCheckNumber || "Not set"}
//             </p>
//           </div>
//           {/* Check Series List */}
//           {checkSeries.length > 0 && (
//             <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
//               <div className="flex items-center justify-between mb-6">
//                 <div className="flex items-center">
//                   <div className="bg-green-100 p-2 rounded-full mr-3">
//                     <FiHash className="text-green-600" size={20} />
//                   </div>
//                   <h3 className="text-xl font-serif font-bold text-gray-800">
//                     Check Series
//                   </h3>
//                 </div>
//                 <span className="text-sm text-gray-500">
//                   {checkSeries.length} series
//                 </span>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {checkSeries.map((series) => (
//                   <div
//                     key={series.id}
//                     className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-300 transition-all"
//                   >
//                     <div className="flex justify-between items-start mb-2">
//                       <h4 className="font-semibold text-gray-800">
//                         {series.startNumber} - {series.endNumber}
//                       </h4>
//                       <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
//                         {series.totalChecks} checks
//                       </span>
//                     </div>
//                     <p className="text-sm text-gray-600">
//                       Created: {format(series.createdAt, "MMM dd, yyyy")}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}
//       {/* Write Check Section */}
//       {showWriteCheck && (
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200 transition-all duration-300">
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center">
//               <div className="bg-blue-100 p-3 rounded-full mr-4">
//                 <FiEdit2 className="text-[#F96176]" size={24} />
//               </div>
//               <div>
//                 <h3 className="text-2xl font-serif font-bold text-gray-800">
//                   Write New Check
//                 </h3>
//                 <p className="text-gray-600">Fill in the check details below</p>
//               </div>
//             </div>
//             <button
//               onClick={handleCancelWriteCheck}
//               className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
//             >
//               <FiX size={20} />
//             </button>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Check Number
//               </label>
//               <input
//                 type="text"
//                 value={checkNumber}
//                 onChange={(e) => setCheckNumber(e.target.value)}
//                 className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176] bg-gray-50"
//                 readOnly
//               />
//               <p className="mt-2 text-sm text-gray-500">
//                 Next available check number
//               </p>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Date
//               </label>
//               <DatePicker
//                 selected={selectedDate}
//                 onChange={(date: Date | null) =>
//                   setSelectedDate(date || new Date())
//                 }
//                 className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
//                 dateFormat="MMMM d, yyyy"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Recipient Type
//               </label>
//               <select
//                 value={selectedType || ""}
//                 onChange={(e) => {
//                   setSelectedType(e.target.value || null);
//                   setSelectedUserId(null);
//                   setSelectedUserName(null);
//                 }}
//                 className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
//               >
//                 <option value="">Select Type</option>
//                 <option value="Manager">Manager</option>
//                 <option value="Accountant">Accountant</option>
//                 <option value="Driver">Driver</option>
//                 <option value="Vendor">Vendor</option>
//                 <option value="Other Staff">Other Staff</option>
//               </select>
//             </div>
//           </div>

//           {selectedType && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Recipient Name
//                 </label>
//                 <select
//                   value={selectedUserId || ""}
//                   onChange={(e) => {
//                     const member = allMembers.find(
//                       (m) => m.memberId === e.target.value
//                     );
//                     setSelectedUserId(e.target.value || null);
//                     setSelectedUserName(member?.name || null);
//                   }}
//                   className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
//                 >
//                   <option value="">Select Recipient</option>
//                   {allMembers
//                     .filter((member) => member.role === selectedType)
//                     .map((member) => (
//                       <option key={member.memberId} value={member.memberId}>
//                         {member.name}
//                       </option>
//                     ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Memo (Optional)
//                 </label>
//                 <input
//                   type="text"
//                   value={memoNumber}
//                   onChange={(e) => setMemoNumber(e.target.value)}
//                   placeholder="Enter memo"
//                   className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
//                 />
//               </div>
//             </div>
//           )}

//           {selectedUserId && (
//             <>
//               <div className="mb-6">
//                 <div className="flex items-center mb-4">
//                   <div className="bg-[#F96176]/10 p-2 rounded-full mr-3">
//                     <FiList className="text-[#F96176]" />
//                   </div>
//                   <h4 className="text-lg font-semibold text-gray-800">
//                     Service Details
//                   </h4>
//                 </div>

//                 <div className="space-y-4 mb-6">
//                   {serviceDetails.map((detail, index) => (
//                     <div
//                       key={index}
//                       className="grid grid-cols-1 md:grid-cols-2 gap-4"
//                     >
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Service Name{" "}
//                           {index === 0 && (
//                             <span className="text-red-500">*</span>
//                           )}
//                         </label>
//                         <input
//                           type="text"
//                           value={detail.serviceName}
//                           onChange={(e) => {
//                             const newDetails = [...serviceDetails];
//                             const text = e.target.value;
//                             const words = text.trim().split(/\s+/);

//                             // Limit to 70 words
//                             if (words.length <= 70) {
//                               newDetails[index].serviceName = text;
//                               setServiceDetails(newDetails);

//                               // Recalculate total
//                               calculateTotal(newDetails);
//                             }
//                           }}
//                           placeholder={`Enter service description`}
//                           className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
//                         />
//                         <p className="text-sm text-gray-500 mt-1">
//                           {detail.serviceName.trim() === ""
//                             ? 0
//                             : detail.serviceName.trim().split(/\s+/).length}
//                           /70 words
//                         </p>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Amount{" "}
//                           {index === 0 && (
//                             <span className="text-red-500">*</span>
//                           )}
//                         </label>
//                         <input
//                           type="number"
//                           step="0.01"
//                           value={detail.amount === 0 ? "" : detail.amount}
//                           onChange={(e) => {
//                             const newDetails = [...serviceDetails];
//                             const value = e.target.value;

//                             // Handle empty string, "-", and valid numbers
//                             if (value === "" || value === "-") {
//                               newDetails[index].amount = 0;
//                             } else {
//                               const numValue = parseFloat(value);
//                               // Allow any number including 0
//                               newDetails[index].amount = isNaN(numValue)
//                                 ? 0
//                                 : numValue;
//                             }

//                             setServiceDetails(newDetails);
//                           }}
//                           placeholder="Enter amount"
//                           className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
//                         />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Show total amount */}
//               {totalAmount !== 0 && (
//                 <div className="flex justify-between items-center pt-4 border-t border-gray-200 mb-6">
//                   <span className="text-lg font-semibold text-gray-800">
//                     Total Amount:
//                   </span>
//                   <span
//                     className={`text-2xl font-bold ${
//                       totalAmount >= 0 ? "text-[#F96176]" : "text-red-600"
//                     }`}
//                   >
//                     ${totalAmount.toFixed(2)}
//                   </span>
//                 </div>
//               )}

//               {/* Save Check Button */}
//               <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
//                 <button
//                   onClick={handleCancelWriteCheck}
//                   className="px-6 py-2.5 bg-white border border-gray-300 rounded-full shadow-sm text-gray-700 hover:bg-gray-50 transition-all"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={saveCheck}
//                   disabled={
//                     // First row must have service name (amount can be 0)
//                     serviceDetails[0].serviceName.trim() === ""
//                   }
//                   className={`px-8 py-2.5 rounded-full shadow-sm transition-all flex items-center ${
//                     serviceDetails[0].serviceName.trim() === ""
//                       ? "bg-gray-300 cursor-not-allowed"
//                       : "bg-[#F96176] hover:bg-[#F96176]/80"
//                   } text-white`}
//                 >
//                   <FiSave className="mr-2" />
//                   Save Check
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       )}

//       {/* Filters Section */}
//       <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
//         <div className="flex items-center justify-center mb-6">
//           <div className="bg-blue-100 p-2 rounded-full mr-3">
//             <FiFilter className="text-[#F96176]" size={20} />
//           </div>
//           <h3 className="text-xl font-serif font-bold text-gray-800">
//             Filter Checks
//           </h3>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* Type Filter */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
//               Filter by Type
//             </label>
//             <div className="flex flex-wrap justify-center gap-2">
//               {["Manager", "Accountant", "Driver", "Vendor", "Other Staff"].map(
//                 (type) => (
//                   <button
//                     key={type}
//                     className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all ${
//                       filterType === type
//                         ? "bg-[#F96176] text-white border border-[#F96176]"
//                         : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
//                     }`}
//                     onClick={() => {
//                       const newFilterType = filterType === type ? null : type;
//                       setFilterType(newFilterType);
//                       setLoadingChecks(true);
//                       fetchChecks();
//                     }}
//                   >
//                     {type}
//                     {filterType === type && <FiX className="ml-2 inline" />}
//                   </button>
//                 )
//               )}
//             </div>
//           </div>

//           {/* Date Filter */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
//               Date Range
//             </label>
//             <div className="flex items-center justify-center space-x-2">
//               <button
//                 onClick={() => setShowDatePicker(!showDatePicker)}
//                 className={`flex items-center px-4 py-1.5 rounded-full shadow-sm transition-all ${
//                   startDate
//                     ? "bg-[#F96176] text-white"
//                     : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 <FiCalendar className="mr-2" />
//                 {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
//                 {endDate && ` - ${format(endDate, "MMM dd, yyyy")}`}
//               </button>
//               {(startDate || endDate) && (
//                 <button
//                   onClick={() => {
//                     setStartDate(null);
//                     setEndDate(null);
//                     fetchChecks();
//                   }}
//                   className="flex items-center px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all"
//                 >
//                   <FiX className="mr-1" />
//                   Clear
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Date Picker */}
//       {showDatePicker && (
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Start Date
//               </label>
//               <DatePicker
//                 selected={startDate}
//                 onChange={(date: Date | null) => setStartDate(date)}
//                 selectsStart
//                 startDate={startDate}
//                 endDate={endDate}
//                 className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
//                 dateFormat="MMMM d, yyyy"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 End Date
//               </label>
//               <DatePicker
//                 selected={endDate}
//                 onChange={(date: Date | null) => setEndDate(date)}
//                 selectsEnd
//                 startDate={startDate}
//                 endDate={endDate}
//                 minDate={startDate || undefined}
//                 className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
//                 dateFormat="MMMM d, yyyy"
//               />
//             </div>
//           </div>
//           <div className="flex justify-center mt-6">
//             <button
//               onClick={() => {
//                 setShowDatePicker(false);
//                 fetchChecks();
//               }}
//               className="px-6 py-2 bg-[#F96176] text-white rounded-full shadow-md hover:bg-[#F96176] transition-all"
//             >
//               Apply Filters
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Checks List */}
//       {loadingChecks ? (
//         <div className="text-center my-12 py-12">
//           <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F96176] mb-4"></div>
//           <p className="text-gray-600 italic">Loading your checks...</p>
//         </div>
//       ) : checks.length === 0 ? (
//         <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
//           <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
//             <FiFileText size={40} className="text-gray-400" />
//           </div>
//           <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">
//             No Checks Found
//           </h3>
//           <p className="text-gray-600 mb-6 max-w-md mx-auto">
//             {isAnonymous && !isProfileComplete
//               ? "Please create an account to write checks."
//               : "It looks like you haven't written any checks yet. Get started by creating your first check."}
//           </p>
//           {!(isAnonymous && !isProfileComplete) && !showWriteCheck && (
//             <div className="space-x-4">
//               <button
//                 onClick={handleWriteCheck}
//                 className="px-8 py-3 bg-[#F96176] text-white rounded-full shadow-lg hover:bg-[#F96176] transition-all"
//               >
//                 Write First Check
//               </button>
//               <button
//                 onClick={() => setShowAddSeries(true)}
//                 className="px-8 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all"
//               >
//                 Add Check Series
//               </button>
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
//           {checks.map((check) => (
//             <div
//               key={check.id}
//               className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
//             >
//               <div className="p-6">
//                 {/* Check Header */}
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <span
//                       className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
//                         check.type === "Manager"
//                           ? "bg-purple-100 text-purple-800"
//                           : check.type === "Accountant"
//                           ? "bg-green-100 text-green-800"
//                           : check.type === "Driver"
//                           ? "bg-yellow-100 text-yellow-800"
//                           : check.type === "Vendor"
//                           ? "bg-red-100 text-red-800"
//                           : "bg-gray-100 text-gray-800"
//                       }`}
//                     >
//                       {check.type}
//                     </span>
//                     <h3 className="text-xl font-bold mt-2 text-gray-800">
//                       Check #{check.checkNumber}
//                     </h3>
//                   </div>
//                   <span className="text-sm text-gray-500">
//                     {format(check.date, "MMM dd, yyyy")}
//                   </span>
//                 </div>

//                 {/* Recipient */}
//                 <div className="flex items-center mb-6">
//                   <div className="bg-blue-100 p-2 rounded-full mr-3">
//                     <FiUser className="text-[#F96176]" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Paid To</p>
//                     <p className="font-medium text-gray-800">
//                       {check.userName}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Services */}
//                 <div className="mb-6">
//                   {check.serviceDetails.map((detail, index) => (
//                     <div
//                       key={index}
//                       className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
//                     >
//                       <p className="text-gray-700">{detail.serviceName}</p>
//                       <p className="font-semibold text-gray-800">
//                         ${detail.amount.toFixed(2)}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Footer */}
//                 <div className="pt-4 border-t border-gray-100">
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <h4 className="font-bold text-gray-800">Total Amount</h4>
//                       {check.memoNumber && (
//                         <p className="text-sm text-gray-500">
//                           Memo: {check.memoNumber}
//                         </p>
//                       )}
//                     </div>
//                     <div className="flex items-center">
//                       <span className="text-2xl font-bold text-[#F96176] mr-4">
//                         ${check.totalAmount.toFixed(2)}
//                       </span>
//                       <button
//                         onClick={() => handlePrint(check)}
//                         className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
//                         title="Print Check"
//                       >
//                         <FiPrinter className="text-gray-600" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Hidden print content */}
//       <div id="print-check-content" style={{ display: "none" }}></div>
//     </div>
//   );
// }
