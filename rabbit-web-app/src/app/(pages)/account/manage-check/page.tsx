"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { GlobalToastError, GlobalToastSuccess } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import {
  FiPlus,
  FiX,
  FiFilter,
  FiPrinter,
  FiUser,
  FiCalendar,
  FiClock,
  FiList,
  FiEdit2,
  FiFileText,
  FiTrash2,
  FiSave,
  FiHash,
} from "react-icons/fi";
import { FaFileAlt } from "react-icons/fa";

interface ServiceDetail {
  serviceName: string;
  amount: number;
}

interface Trip {
  id: string;
  tripName: string;
  oEarnings: number;
}

interface Member {
  name: string;
  email: string;
  isActive: boolean;
  memberId: string;
  ownerId: string;
  vehicles: { companyName: string; vehicleNumber: string }[];
  perMileCharge: number;
  role: string;
}

interface Check {
  id: string;
  checkNumber: number;
  type: string;
  userId: string;
  userName: string;
  serviceDetails: ServiceDetail[];
  totalAmount: number;
  memoNumber?: string;
  date: Date;
  createdBy: string;
  createdAt: string;
}

interface CheckSeries {
  id: string;
  userId: string;
  startNumber: string;
  endNumber: string;
  totalChecks: number;
  createdAt: Date;
}

export default function ManageCheckScreen() {
  const [role, setUserRole] = useState<string>("");
  const [isCheque, setIsCheque] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [loadingChecks, setLoadingChecks] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showWriteCheck, setShowWriteCheck] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>([]);
  const [memoNumber, setMemoNumber] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [showAddDetail, setShowAddDetail] = useState<boolean>(false);
  const [serviceName, setServiceName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [unpaidTrips, setUnpaidTrips] = useState<Trip[]>([]);
  const [driverUnpaidTotal, setDriverUnpaidTotal] = useState<number>(0);
  const [checkNumber, setCheckNumber] = useState<string>("");
  const [currentCheckNumber, setCurrentCheckNumber] = useState<string | null>(
    null
  );
  const [checkSeries, setCheckSeries] = useState<CheckSeries[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [effectiveUserId, setEffectiveUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [showAddSeries, setShowAddSeries] = useState<boolean>(false);
  const [startSeriesNumber, setStartSeriesNumber] = useState<string>("");
  const [endSeriesNumber, setEndSeriesNumber] = useState<string>("");
  const [addingSeries, setAddingSeries] = useState<boolean>(false);

  const { user } = useAuth() || { user: null };

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const userRef = doc(db, "Users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userProfile = docSnap.data();
          setUserRole(userProfile.role || "");
          setCurrentUserRole(userProfile.role || "");

          // Determine effectiveUserId based on role
          if (userProfile.role === "SubOwner" && userProfile.createdBy) {
            setEffectiveUserId(userProfile.createdBy);
            console.log(
              `SubOwner detected, using createdBy as effectiveUserId ${userProfile.createdBy} ${currentUserRole}`
            );
          } else {
            setEffectiveUserId(user.uid);
          }

          setIsCheque(userProfile.isCheque || false);
          setCurrentCheckNumber(userProfile.currentCheckNumber || null);
          setIsAnonymous(userProfile.isAnonymous || true);
          setIsProfileComplete(userProfile.isProfileComplete || false);
        } else {
          GlobalToastError("User document not found");
        }
        setIsLoading(false);
      },
      (error: Error) => {
        GlobalToastError(error.message || "Error fetching user data");
        console.error("Error fetching user data:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (effectiveUserId && isCheque) {
      fetchTeamMembersWithVehicles();
      fetchChecks();
      fetchCheckSeries();
    }
  }, [effectiveUserId, isCheque]);

  const fetchTeamMembersWithVehicles = async () => {
    try {
      if (!effectiveUserId) return;

      const teamQuery = query(
        collection(db, "Users"),
        where("createdBy", "==", effectiveUserId),
        where("uid", "!=", effectiveUserId)
      );

      const teamSnapshot = await getDocs(teamQuery);
      const members: Member[] = [];

      for (const memberDoc of teamSnapshot.docs) {
        const memberData = memberDoc.data();
        const memberId = memberData.uid;

        const vehiclesQuery = query(
          collection(db, "Users", memberId, "Vehicles")
        );
        const vehiclesSnapshot = await getDocs(vehiclesQuery);

        const vehicles = vehiclesSnapshot.docs
          .map((vehicleDoc) => ({
            companyName: vehicleDoc.data().companyName || "No Company",
            vehicleNumber: vehicleDoc.data().vehicleNumber || "No Number",
          }))
          .sort((a, b) =>
            a.vehicleNumber
              .toLowerCase()
              .localeCompare(b.vehicleNumber.toLowerCase())
          );

        members.push({
          name: memberData.userName || "No Name",
          email: memberData.email || "No Email",
          isActive: memberData.active || false,
          memberId: memberId,
          ownerId: memberData.createdBy,
          vehicles: vehicles,
          perMileCharge: memberData.perMileCharge || 0,
          role: memberData.role || "",
        });
      }

      setAllMembers(members);
    } catch (error) {
      console.error(error);
    }
  };

  // const fetchChecks = async () => {
  //   try {
  //     if (!effectiveUserId) return;

  //     setLoadingChecks(true);
  //     let checksQuery = query(
  //       collection(db, "Checks"),
  //       where("createdBy", "==", effectiveUserId),
  //       orderBy("date", "desc")
  //     );

  //     if (filterType) {
  //       checksQuery = query(checksQuery, where("type", "==", filterType));
  //     }

  //     if (startDate && endDate) {
  //       checksQuery = query(
  //         checksQuery,
  //         where("date", ">=", Timestamp.fromDate(startDate)),
  //         where("date", "<=", Timestamp.fromDate(endDate))
  //       );
  //     }

  //     const snapshot = await getDocs(checksQuery);
  //     const checksData: Check[] = snapshot.docs.map((doc) => {
  //       const data = doc.data();
  //       return {
  //         id: doc.id,
  //         checkNumber: data.checkNumber || 0,
  //         type: data.type || "",
  //         userId: effectiveUserId || "",
  //         userName: data.userName || "",
  //         serviceDetails: data.serviceDetails || [],
  //         totalAmount: data.totalAmount || 0,
  //         memoNumber: data.memoNumber || undefined,
  //         date: data.date?.toDate() || new Date(),
  //         createdBy: data.createdBy || "",
  //         createdAt: data.createdAt,
  //       };
  //     });

  //     setChecks(checksData);
  //     setLoadingChecks(false);
  //   } catch (error) {
  //     setLoadingChecks(false);
  //     console.error(error);
  //   }
  // };

  const fetchChecks = async () => {
    try {
      if (!effectiveUserId) return;

      setLoadingChecks(true);
      let checksQuery = query(
        collection(db, "Checks"),
        where("createdBy", "==", effectiveUserId),
        orderBy("date", "desc")
      );

      if (filterType) {
        checksQuery = query(checksQuery, where("type", "==", filterType));
      }

      if (startDate && endDate) {
        checksQuery = query(
          checksQuery,
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate))
        );
      }

      const snapshot = await getDocs(checksQuery);
      const checksData: Check[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          checkNumber: data.checkNumber || 0,
          type: data.type || "",
          userId: effectiveUserId || "",
          userName: data.userName || "",
          serviceDetails: data.serviceDetails || [],
          totalAmount: data.totalAmount || 0,
          memoNumber: data.memoNumber || undefined,
          date: data.date?.toDate() || new Date(),
          createdBy: data.createdBy || "",
          createdAt: data.createdAt,
        };
      });

      setChecks(checksData);
    } catch (error) {
      console.error(error);
      GlobalToastError("Error loading checks");
    } finally {
      setLoadingChecks(false);
    }
  };

  const fetchCheckSeries = async () => {
    try {
      if (!effectiveUserId) return;

      const seriesQuery = query(
        collection(db, "CheckSeries"),
        where("userId", "==", effectiveUserId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(seriesQuery);
      const seriesData: CheckSeries[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          startNumber: data.startNumber,
          endNumber: data.endNumber,
          totalChecks: data.totalChecks || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      setCheckSeries(seriesData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (effectiveUserId && isCheque) {
      fetchChecks();
    }
  }, [filterType, startDate, endDate, effectiveUserId, isCheque]);

  const generateCheckNumbers = (start: string, end: string): string[] => {
    const checkNumbers: string[] = [];

    try {
      // Extract prefix and numeric parts
      const prefix = start.replace(/\d/g, "");
      const endPrefix = end.replace(/\d/g, "");

      // Verify prefixes match
      if (prefix !== endPrefix) {
        GlobalToastError("Number prefixes must match");
        return [];
      }

      // Extract numeric parts
      const startNumStr = start.replace(prefix, "");
      const endNumStr = end.replace(prefix, "");

      const startNum = parseInt(startNumStr);
      const endNum = parseInt(endNumStr);

      if (startNum >= endNum) {
        GlobalToastError("End number must be greater than start number");
        return [];
      }

      // Generate all numbers in the range
      for (let i = startNum; i <= endNum; i++) {
        // Format number with leading zeros to match the original format
        let numStr = i.toString();
        if (startNumStr.length > numStr.length) {
          numStr = numStr.padStart(startNumStr.length, "0");
        }

        checkNumbers.push(`${prefix}${numStr}`);
      }
    } catch (error) {
      GlobalToastError("Error generating check numbers");
      console.error(error);
      return [];
    }

    return checkNumbers;
  };

  const handleAddCheckSeries = async () => {
    if (!startSeriesNumber || !endSeriesNumber) {
      GlobalToastError("Please enter both start and end numbers");
      return;
    }

    setAddingSeries(true);

    try {
      // Generate the check numbers
      const checkNumbers = generateCheckNumbers(
        startSeriesNumber,
        endSeriesNumber
      );

      if (checkNumbers.length === 0) {
        return;
      }

      // Save the series to Firestore
      const seriesRef = await addDoc(collection(db, "CheckSeries"), {
        userId: effectiveUserId,
        startNumber: startSeriesNumber,
        endNumber: endSeriesNumber,
        createdAt: serverTimestamp(),
        totalChecks: checkNumbers.length,
      });

      // Save individual check numbers to a subcollection
      const batch = writeBatch(db);

      for (const checkNumber of checkNumbers) {
        const docRef = doc(
          collection(db, "CheckSeries", seriesRef.id, "Checks")
        );
        batch.set(docRef, {
          checkNumber: checkNumber,
          isUsed: false,
          seriesId: seriesRef.id,
          userId: effectiveUserId,
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();

      // Update current check number if not set
      if (!currentCheckNumber) {
        await updateDoc(doc(db, "Users", effectiveUserId), {
          currentCheckNumber: startSeriesNumber,
        });
        setCurrentCheckNumber(startSeriesNumber);
      }

      GlobalToastSuccess("Check series saved successfully!");

      // Reset form and close
      setStartSeriesNumber("");
      setEndSeriesNumber("");
      setShowAddSeries(false);

      // Refresh data
      await fetchCheckSeries();
    } catch (error) {
      GlobalToastError("Error saving check series");
      console.error(error);
    } finally {
      setAddingSeries(false);
    }
  };

  const getNextAvailableCheckNumber = async (): Promise<string | null> => {
    if (!currentCheckNumber) return null;

    try {
      const seriesQuery = query(
        collection(db, "CheckSeries"),
        where("userId", "==", effectiveUserId)
      );
      const seriesSnapshot = await getDocs(seriesQuery);

      let allCheckNumbers: string[] = [];

      for (const seriesDoc of seriesSnapshot.docs) {
        const checksQuery = query(
          collection(db, "CheckSeries", seriesDoc.id, "Checks")
        );
        const checksSnapshot = await getDocs(checksQuery);

        const checkNumbers = checksSnapshot.docs.map(
          (doc) => doc.data().checkNumber as string
        );
        allCheckNumbers = [...allCheckNumbers, ...checkNumbers];
      }

      allCheckNumbers.sort((a, b) => {
        const prefixA = a.replace(/\d/g, "");
        const prefixB = b.replace(/\d/g, "");

        if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);

        const numA = parseInt(a.replace(prefixA, ""));
        const numB = parseInt(b.replace(prefixB, ""));
        return numA - numB;
      });

      for (const checkNumber of allCheckNumbers) {
        const usedCheckQuery = query(
          collection(db, "Checks"),
          where("checkNumber", "==", checkNumber),
          where("createdBy", "==", effectiveUserId)
        );
        const usedCheckSnapshot = await getDocs(usedCheckQuery);

        if (usedCheckSnapshot.empty) {
          return checkNumber;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting next check number:", error);
      return null;
    }
  };

  const updateCheckNumberUsage = async (checkNumber: string) => {
    try {
      const seriesQuery = query(
        collection(db, "CheckSeries"),
        where("userId", "==", effectiveUserId)
      );
      const seriesSnapshot = await getDocs(seriesQuery);

      for (const seriesDoc of seriesSnapshot.docs) {
        const checksQuery = query(
          collection(db, "CheckSeries", seriesDoc.id, "Checks"),
          where("checkNumber", "==", checkNumber)
        );
        const checksSnapshot = await getDocs(checksQuery);

        if (!checksSnapshot.empty) {
          await updateDoc(
            doc(
              db,
              "CheckSeries",
              seriesDoc.id,
              "Checks",
              checksSnapshot.docs[0].id
            ),
            {
              isUsed: true,
              usedAt: serverTimestamp(),
              usedBy: effectiveUserId,
            }
          );
          break;
        }
      }

      if (user) {
        await updateDoc(doc(db, "Users", effectiveUserId), {
          currentCheckNumber: checkNumber,
        });
      }
    } catch (error) {
      console.error("Error updating check number usage:", error);
    }
  };

  const handleWriteCheck = async () => {
    if (isAnonymous && !isProfileComplete) {
      GlobalToastError("Please create an account to write checks.");
      return;
    }

    setSelectedType(null);
    setSelectedUserId(null);
    setSelectedUserName(null);
    setServiceDetails([]);
    setMemoNumber("");
    setSelectedDate(new Date());
    setTotalAmount(0);

    const nextCheckNumber = await getNextAvailableCheckNumber();
    if (nextCheckNumber) {
      setCheckNumber(nextCheckNumber);
      setShowWriteCheck(true);
    } else {
      GlobalToastError(
        "No available check numbers. Please add a check series first."
      );
    }
  };

  const handleCancelWriteCheck = () => {
    setShowWriteCheck(false);
    setSelectedType(null);
    setSelectedUserId(null);
    setSelectedUserName(null);
    setServiceDetails([]);
    setMemoNumber("");
    setSelectedDate(new Date());
    setTotalAmount(0);
    setShowAddDetail(false);
  };

  const handleAddDetail = () => {
    setServiceName("");
    setAmount("");
    setUnpaidTrips([]);
    setDriverUnpaidTotal(0);

    if (selectedType === "Driver" && selectedUserId) {
      fetchUnpaidTrips();
    }

    setShowAddDetail(true);
  };

  const fetchUnpaidTrips = async () => {
    try {
      if (!selectedUserId) return;

      const tripsQuery = query(
        collection(db, "Users", selectedUserId, "trips"),
        where("isPaid", "==", false)
      );

      const snapshot = await getDocs(tripsQuery);
      const trips: Trip[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        tripName: doc.data().tripName || "Unnamed Trip",
        oEarnings: doc.data().oEarnings || 0,
      }));

      const total = trips.reduce((sum, trip) => sum + trip.oEarnings, 0);
      setUnpaidTrips(trips);
      setDriverUnpaidTotal(total);
      setAmount(total.toFixed(2));
    } catch (error) {
      console.error(error);
    }
  };

  const saveDetail = () => {
    if (!serviceName || !amount) {
      GlobalToastError("Please fill all fields");
      return;
    }

    const newDetail: ServiceDetail = {
      serviceName,
      amount: parseFloat(amount),
    };

    setServiceDetails([...serviceDetails, newDetail]);
    calculateTotal([...serviceDetails, newDetail]);
    setShowAddDetail(false);
  };

  const calculateTotal = (details: ServiceDetail[]) => {
    const total = details.reduce((sum, detail) => sum + detail.amount, 0);
    setTotalAmount(total);
  };

  const saveCheck = async () => {
    if (
      !selectedUserId ||
      serviceDetails.length === 0 ||
      !effectiveUserId ||
      !checkNumber
    ) {
      GlobalToastError("Please fill all required fields");
      return;
    }

    try {
      const checkData = {
        checkNumber: checkNumber,
        type: selectedType,
        userId: selectedUserId,
        userName: selectedUserName,
        serviceDetails: serviceDetails,
        totalAmount: totalAmount,
        memoNumber: memoNumber || null,
        date: Timestamp.fromDate(selectedDate),
        createdBy: effectiveUserId,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "Checks"), checkData);

      await updateCheckNumberUsage(checkNumber);

      if (selectedType === "Driver") {
        const batch = writeBatch(db);
        unpaidTrips.forEach((trip) => {
          const tripRef = doc(db, "Users", selectedUserId, "trips", trip.id);
          batch.update(tripRef, { isPaid: true });
        });
        await batch.commit();
      }

      GlobalToastSuccess("Check created successfully!");
      handleCancelWriteCheck();
      fetchChecks();
    } catch (error) {
      console.error(error);
      GlobalToastError("Error saving check");
    }
  };

  const removeServiceDetail = (index: number) => {
    const newDetails = [...serviceDetails];
    newDetails.splice(index, 1);
    setServiceDetails(newDetails);
    calculateTotal(newDetails);
  };

  const amountToWords = (amount: number): string => {
    const wholePart = Math.floor(amount);
    const decimalPart = Math.round((amount - wholePart) * 100);

    const units = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "Ten",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const numberToWords = (num: number): string => {
      if (num === 0) return "Zero";

      let words = "";

      if (Math.floor(num / 1000) > 0) {
        words += numberToWords(Math.floor(num / 1000)) + " Thousand ";
        num %= 1000;
      }

      if (Math.floor(num / 100) > 0) {
        words += numberToWords(Math.floor(num / 100)) + " Hundred ";
        num %= 100;
      }

      if (num > 0) {
        if (num < 10) {
          words += units[num];
        } else if (num < 20) {
          words += teens[num - 10];
        } else {
          words += tens[Math.floor(num / 10)];
          if (num % 10 > 0) {
            words += " " + units[num % 10];
          }
        }
      }

      return words.trim();
    };

    let result = numberToWords(wholePart);
    if (decimalPart > 0) {
      result += " and " + numberToWords(decimalPart) + " Cents";
    }

    return result + " Only";
  };

  const handlePrint = (check: Check) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Check #${check.checkNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 40px;
            background: white;
            line-height: 1.2;
          }
          .check-page {
            width: 100%;
            height: 100vh;
            position: relative;
          }
          .date-section {
            text-align: right;
            margin-bottom: 60px;
            padding-right: 200px;
          }
          .payee-section {
            display: flex;
            margin-bottom: 60px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .payee-spacing {
            width: 200px;
          }
          .payee-name {
            flex: 1;
            font-weight: bold;
            font-size: 16px;
          }
          .payee-amount {
            font-weight: bold;
            font-size: 16px;
            margin-left: 20px;
          }
          .amount-words {
            margin-left: 50px;
            margin-bottom: 100px;
            font-size: 14px;
            font-style: italic;
          }
          .memo-section {
            margin-left: 200px;
            margin-bottom: 200px;
            font-size: 14px;
          }
          .divider {
            border-top: 2px solid #000;
            margin: 40px 0;
          }
          .details-section {
            margin-top: 60px;
          }
          .check-number {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 15px;
          }
          .service-line {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 14px;
          }
          .total-line {
            display: flex;
            justify-content: flex-end;
            margin-top: 30px;
            font-size: 16px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .duplicate {
            margin-top: 100px;
            border-top: 2px solid #000;
            padding-top: 60px;
          }
          @media print {
            body {
              padding: 20px;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="check-page">
          <!-- Original Check -->
          <div class="date-section">
            ${format(check.date, "MM/dd/yyyy")}
          </div>
          
          <div class="payee-section">
            <div class="payee-spacing"></div>
            <div class="payee-name">${check.userName}</div>
            <div class="payee-amount">$${check.totalAmount.toFixed(2)}</div>
          </div>
          
          <div class="amount-words">
            ${amountToWords(check.totalAmount)}
          </div>
          
          ${
            check.memoNumber
              ? `
            <div class="memo-section">
              ${check.memoNumber}
            </div>
          `
              : '<div class="memo-section"></div>'
          }
          
          <div class="divider"></div>
          
          <div class="details-section">
            <div class="check-number">
              <div>Check No. #${check.checkNumber}</div>
              <div>${format(check.date, "MM/dd/yyyy")}</div>
            </div>
            
            ${check.serviceDetails
              .map(
                (detail) => `
              <div class="service-line">
                <div>${detail.serviceName}</div>
                <div>$${detail.amount.toFixed(2)}</div>
              </div>
            `
              )
              .join("")}
            
            <div class="total-line">
              <div>$${check.totalAmount.toFixed(2)}</div>
            </div>
          </div>
          
          <!-- Duplicate Copy -->
          <div class="duplicate">
            <div class="date-section">
              ${format(check.date, "MM/dd/yyyy")}
            </div>
            
            <div class="payee-section">
              <div class="payee-spacing"></div>
              <div class="payee-name">${check.userName}</div>
              <div class="payee-amount">$${check.totalAmount.toFixed(2)}</div>
            </div>
            
            <div class="amount-words">
              ${amountToWords(check.totalAmount)}
            </div>
            
            ${
              check.memoNumber
                ? `
              <div class="memo-section">
                ${check.memoNumber}
              </div>
            `
                : '<div class="memo-section"></div>'
            }
            
            <div class="divider"></div>
            
            <div class="details-section">
              <div class="check-number">
                <div>Check No. #${check.checkNumber}</div>
                <div>${format(check.date, "MM/dd/yyyy")}</div>
              </div>
              
              ${check.serviceDetails
                .map(
                  (detail) => `
                <div class="service-line">
                  <div>${detail.serviceName}</div>
                  <div>$${detail.amount.toFixed(2)}</div>
                </div>
              `
                )
                .join("")}
              
              <div class="total-line">
                <div>$${check.totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (!user) {
    return <div>Please log in to access the manage team page.</div>;
  }

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (!isCheque) {
    return <div>You do not have permission to access this page.</div>;
  }

  return (
    <div
      key={role}
      className="container py-4 mx-auto"
      style={{ maxWidth: "1200px" }}
    >
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center bg-white p-4 rounded-full shadow-lg mb-4">
          <FaFileAlt className="text-[#F96176] mr-3" size={32} />
          <h1 className="text-3xl font-serif font-bold text-gray-800">
            Check Management
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-6 italic">
          &quot;Track and manage all check transactions with precision&quot;
        </p>

        {isAnonymous && !isProfileComplete ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-700 font-medium">
              Please create an account to write checks.
            </p>
          </div>
        ) : (
          <div className="flex justify-center space-x-4">
            <button
              onClick={
                showWriteCheck ? handleCancelWriteCheck : handleWriteCheck
              }
              className="flex items-center px-6 py-2.5 bg-[#F96176] rounded-full shadow-md hover:bg-[#F96176] transition-all duration-300 text-white"
            >
              <FiPlus className="mr-2" />
              {showWriteCheck ? "Cancel Write Check" : "Write Check"}
            </button>

            <button
              onClick={() => setShowAddSeries(true)}
              className="flex items-center px-6 py-2.5 bg-[#58BB87] rounded-full shadow-md hover:bg-[#58BB87] transition-all duration-300 text-white"
            >
              <FiHash className="mr-2" />
              Add Check Series
            </button>
          </div>
        )}
      </div>

      {/* Current Check Number Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
        <p className="text-lg font-semibold text-blue-800">
          Current Check Number: {currentCheckNumber || "Not set"}
        </p>
      </div>

      {/* Add Check Series Modal */}
      {showAddSeries && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <FiHash className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-gray-800">
                    Add Check Series
                  </h3>
                  <p className="text-gray-600">
                    Create a new range of check numbers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddSeries(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Number (e.g., RMS001)
                </label>
                <input
                  type="text"
                  value={startSeriesNumber}
                  onChange={(e) => setStartSeriesNumber(e.target.value)}
                  placeholder="Enter start number"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Number (e.g., RMS050)
                </label>
                <input
                  type="text"
                  value={endSeriesNumber}
                  onChange={(e) => setEndSeriesNumber(e.target.value)}
                  placeholder="Enter end number"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Make sure the prefix (e.g.,
                  &quot;RMS&quot;) matches for both numbers. The end number must
                  be greater than the start number.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddSeries(false)}
                className="px-6 py-2.5 bg-white border border-gray-300 rounded-full shadow-sm text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCheckSeries}
                disabled={addingSeries}
                className={`px-8 py-2.5 rounded-full shadow-sm transition-all flex items-center ${
                  addingSeries
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#58BB87] hover:bg-[#58BB87]"
                } text-white`}
              >
                {addingSeries ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    Save Series
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check Series List */}
      {checkSeries.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <FiHash className="text-green-600" size={20} />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-800">
                Check Series
              </h3>
            </div>
            <span className="text-sm text-gray-500">
              {checkSeries.length} series
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkSeries.map((series) => (
              <div
                key={series.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-300 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800">
                    {series.startNumber} - {series.endNumber}
                  </h4>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {series.totalChecks} checks
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Created: {format(series.createdAt, "MMM dd, yyyy")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Check Section */}
      {showWriteCheck && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiEdit2 className="text-[#F96176]" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-gray-800">
                  Write New Check
                </h3>
                <p className="text-gray-600">Fill in the check details below</p>
              </div>
            </div>
            <button
              onClick={handleCancelWriteCheck}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check Number
              </label>
              <input
                type="text"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176] bg-gray-50"
                readOnly
              />
              <p className="mt-2 text-sm text-gray-500">
                Next available check number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) =>
                  setSelectedDate(date || new Date())
                }
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                dateFormat="MMMM d, yyyy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Type
              </label>
              <select
                value={selectedType || ""}
                onChange={(e) => {
                  setSelectedType(e.target.value || null);
                  setSelectedUserId(null);
                  setSelectedUserName(null);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
              >
                <option value="">Select Type</option>
                <option value="Manager">Manager</option>
                <option value="Accountant">Accountant</option>
                <option value="Driver">Driver</option>
                <option value="Vendor">Vendor</option>
                <option value="Other Staff">Other Staff</option>
              </select>
            </div>
          </div>

          {selectedType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name
                </label>
                <select
                  value={selectedUserId || ""}
                  onChange={(e) => {
                    const member = allMembers.find(
                      (m) => m.memberId === e.target.value
                    );
                    setSelectedUserId(e.target.value || null);
                    setSelectedUserName(member?.name || null);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                >
                  <option value="">Select Recipient</option>
                  {allMembers
                    .filter((member) => member.role === selectedType)
                    .map((member) => (
                      <option key={member.memberId} value={member.memberId}>
                        {member.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Memo (Optional)
                </label>
                <input
                  type="text"
                  value={memoNumber}
                  onChange={(e) => setMemoNumber(e.target.value)}
                  placeholder="Enter memo"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                />
              </div>
            </div>
          )}

          {selectedUserId && (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleAddDetail}
                  className="flex items-center px-5 py-2.5 bg-white border border-[#F96176] text-[#F96176] rounded-full shadow-sm hover:bg-[#F96176]/10 transition-all"
                >
                  <FiPlus className="mr-2" />
                  Add Service Detail
                </button>
              </div>

              {serviceDetails.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-[#F96176]/10 p-2 rounded-full mr-3">
                      <FiList className="text-[#F96176]" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      Service Details
                    </h4>
                  </div>

                  <div className="space-y-3 mb-6">
                    {serviceDetails.map((detail, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {detail.serviceName}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${detail.amount.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeServiceDetail(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-lg font-semibold text-gray-800">
                      Total:
                    </span>
                    <span className="text-2xl font-bold text-[#F96176]">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {showAddDetail && (
                <div className="bg-gray-50 rounded-lg p-6 mt-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      Add Service Detail
                    </h4>
                    <button
                      onClick={() => setShowAddDetail(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                    >
                      <FiX size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Name
                      </label>
                      <input
                        type="text"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="Enter service description"
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                      />
                    </div>
                  </div>

                  {selectedType === "Driver" && unpaidTrips.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center mb-3">
                        <div className="bg-yellow-100 p-2 rounded-full mr-3">
                          <FiClock className="text-yellow-600" />
                        </div>
                        <h5 className="text-md font-semibold text-gray-800">
                          Unpaid Trips
                        </h5>
                      </div>

                      <div className="space-y-2 mb-4">
                        {unpaidTrips.map((trip, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg"
                          >
                            <span className="text-gray-700">
                              {trip.tripName}
                            </span>
                            <span className="font-semibold text-gray-800">
                              ${trip.oEarnings.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-yellow-100 rounded-lg text-yellow-800">
                        <span className="font-semibold">Total Unpaid:</span> $
                        {driverUnpaidTotal.toFixed(2)}
                      </div>

                      {/* Add this button to use the unpaid trips total */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() =>
                            setAmount(driverUnpaidTotal.toFixed(2))
                          }
                          className="px-4 py-2 bg-[#F96176] text-white rounded-lg hover:bg-[#F96176]/80 transition-all"
                        >
                          Use Unpaid Total
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowAddDetail(false)}
                      className="px-6 py-2.5 bg-white border border-gray-300 rounded-full shadow-sm text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveDetail}
                      className="px-8 py-2.5 bg-[#F96176] rounded-full shadow-sm text-white hover:bg-[#F96176]/80 transition-all"
                    >
                      Add Detail
                    </button>
                  </div>
                </div>
              )}

              {/* Save Check Button */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancelWriteCheck}
                  className="px-6 py-2.5 bg-white border border-gray-300 rounded-full shadow-sm text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCheck}
                  disabled={serviceDetails.length === 0}
                  className={`px-8 py-2.5 rounded-full shadow-sm transition-all flex items-center ${
                    serviceDetails.length === 0
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#F96176] hover:bg-[#F96176]/80"
                  } text-white`}
                >
                  <FiSave className="mr-2" />
                  Save Check
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <FiFilter className="text-[#F96176]" size={20} />
          </div>
          <h3 className="text-xl font-serif font-bold text-gray-800">
            Filter Checks
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Filter by Type
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {["Manager", "Accountant", "Driver", "Vendor", "Other Staff"].map(
                (type) => (
                  <button
                    key={type}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all ${
                      filterType === type
                        ? "bg-[#F96176] text-white border border-[#F96176]"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      const newFilterType = filterType === type ? null : type;
                      setFilterType(newFilterType);
                      setLoadingChecks(true);
                      fetchChecks();
                    }}
                  >
                    {type}
                    {filterType === type && <FiX className="ml-2 inline" />}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Date Range
            </label>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`flex items-center px-4 py-1.5 rounded-full shadow-sm transition-all ${
                  startDate
                    ? "bg-[#F96176] text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <FiCalendar className="mr-2" />
                {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
                {endDate && ` - ${format(endDate, "MMM dd, yyyy")}`}
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate(null);
                    setEndDate(null);
                    fetchChecks();
                  }}
                  className="flex items-center px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                >
                  <FiX className="mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker */}
      {showDatePicker && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                dateFormat="MMMM d, yyyy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || undefined}
                className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                dateFormat="MMMM d, yyyy"
              />
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                setShowDatePicker(false);
                fetchChecks();
              }}
              className="px-6 py-2 bg-[#F96176] text-white rounded-full shadow-md hover:bg-[#F96176] transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Checks List */}
      {loadingChecks ? (
        <div className="text-center my-12 py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F96176] mb-4"></div>
          <p className="text-gray-600 italic">Loading your checks...</p>
        </div>
      ) : checks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <FiFileText size={40} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">
            No Checks Found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {isAnonymous && !isProfileComplete
              ? "Please create an account to write checks."
              : "It looks like you haven't written any checks yet. Get started by creating your first check."}
          </p>
          {!(isAnonymous && !isProfileComplete) && !showWriteCheck && (
            <div className="space-x-4">
              <button
                onClick={handleWriteCheck}
                className="px-8 py-3 bg-[#F96176] text-white rounded-full shadow-lg hover:bg-[#F96176] transition-all"
              >
                Write First Check
              </button>
              <button
                onClick={() => setShowAddSeries(true)}
                className="px-8 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all"
              >
                Add Check Series
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {checks.map((check) => (
            <div
              key={check.id}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="p-6">
                {/* Check Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        check.type === "Manager"
                          ? "bg-purple-100 text-purple-800"
                          : check.type === "Accountant"
                          ? "bg-green-100 text-green-800"
                          : check.type === "Driver"
                          ? "bg-yellow-100 text-yellow-800"
                          : check.type === "Vendor"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {check.type}
                    </span>
                    <h3 className="text-xl font-bold mt-2 text-gray-800">
                      Check #{check.checkNumber}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(check.date, "MMM dd, yyyy")}
                  </span>
                </div>

                {/* Recipient */}
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <FiUser className="text-[#F96176]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Paid To</p>
                    <p className="font-medium text-gray-800">
                      {check.userName}
                    </p>
                  </div>
                </div>

                {/* Services */}
                <div className="mb-6">
                  {check.serviceDetails.map((detail, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                    >
                      <p className="text-gray-700">{detail.serviceName}</p>
                      <p className="font-semibold text-gray-800">
                        ${detail.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-800">Total Amount</h4>
                      {check.memoNumber && (
                        <p className="text-sm text-gray-500">
                          Memo: {check.memoNumber}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-[#F96176] mr-4">
                        ${check.totalAmount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handlePrint(check)}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
                        title="Print Check"
                      >
                        <FiPrinter className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden print content */}
      <div id="print-check-content" style={{ display: "none" }}></div>
    </div>
  );
}
