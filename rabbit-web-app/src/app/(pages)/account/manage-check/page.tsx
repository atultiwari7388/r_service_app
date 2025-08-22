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
import { Modal } from "react-bootstrap";
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
  FiChevronRight,
  FiInbox,
  FiArchive,
  FiInfo,
  FiHash,
  FiPlusCircle,
  FiClock,
  FiList,
  FiEdit2,
  FiFileText,
  FiTrash2,
} from "react-icons/fi";
import { FaFileAlt } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

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
  startNumber: number;
  endNumber: number;
  createdAt: Date;
}

export default function ManageCheckScreen() {
  const [role, setUserRole] = useState<string>("");
  const [isCheque, setIsCheque] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [loadingChecks, setLoadingChecks] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showAddCheck, setShowAddCheck] = useState<boolean>(false);
  const [showManageSeries, setShowManageSeries] = useState<boolean>(false);
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
  const [checkSeries, setCheckSeries] = useState<CheckSeries[]>([]);
  const [newSeriesStart, setNewSeriesStart] = useState<string>("");
  const [newSeriesEnd, setNewSeriesEnd] = useState<string>("");
  const [currentCheckNumber, setCurrentCheckNumber] = useState<number | null>(
    null
  );

  const { user } = useAuth() || { user: null };
  const printRef = useRef<HTMLDivElement>(null);

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
          setIsCheque(userProfile.isCheque || false);
          setCurrentCheckNumber(userProfile.currentCheckNumber || null);

          if (userProfile.isCheque) {
            fetchTeamMembersWithVehicles();
            fetchChecks();
            fetchCheckSeries();
          }
        } else {
          // GlobalToastError("User document not found");
        }
        setIsLoading(false);
      },
      (error: Error) => {
        // GlobalToastError(error.message || "Error fetching user data");
        console.error("Error fetching user data:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const fetchTeamMembersWithVehicles = async () => {
    try {
      if (!user) return;

      const teamQuery = query(
        collection(db, "Users"),
        where("createdBy", "==", user.uid),
        where("uid", "!=", user.uid)
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
      setErrorMessage(
        `Error loading team members: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      console.error(error);
    }
  };

  const fetchChecks = async () => {
    try {
      if (!user) return;

      setLoadingChecks(true);
      let checksQuery = query(
        collection(db, "Checks"),
        where("createdBy", "==", user.uid),
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
          userId: data.userId || "",
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
      setLoadingChecks(false);
    } catch (error) {
      // setErrorMessage(
      //   `Error loading checks: ${
      //     error instanceof Error ? error.message : String(error)
      //   }`
      // );
      setLoadingChecks(false);
      console.error(error);
    }
  };

  const fetchCheckSeries = async () => {
    try {
      if (!user) return;

      const seriesQuery = query(
        collection(db, "CheckSeries"),
        where("userId", "==", user.uid),
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
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      setCheckSeries(seriesData);
    } catch (error) {
      // GlobalToastError(
      //   `Error loading check series: ${
      //     error instanceof Error ? error.message : String(error)
      //   }`
      // );
      console.error(error);
    }
  };

  const handleAddCheck = () => {
    setSelectedType(null);
    setSelectedUserId(null);
    setSelectedUserName(null);
    setServiceDetails([]);
    setMemoNumber("");
    setSelectedDate(new Date());
    setTotalAmount(0);
    setCheckNumber(currentCheckNumber?.toString() || "");
    setShowAddCheck(true);
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
      // GlobalToastError(
      //   `Error fetching unpaid trips: ${
      //     error instanceof Error ? error.message : String(error)
      //   }`
      // );
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
      !user ||
      !checkNumber
    ) {
      GlobalToastError("Please fill all required fields");
      return;
    }

    try {
      const checkNum = parseInt(checkNumber);
      if (isNaN(checkNum)) {
        GlobalToastError("Please enter a valid check number");
        return;
      }

      const checkData = {
        checkNumber: checkNum,
        type: selectedType,
        userId: selectedUserId,
        userName: selectedUserName,
        serviceDetails: serviceDetails,
        totalAmount: totalAmount,
        memoNumber: memoNumber || null,
        date: Timestamp.fromDate(selectedDate),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "Checks"), checkData);

      // Update current check number
      await updateDoc(doc(db, "Users", user.uid), {
        currentCheckNumber: checkNum + 1,
      });
      setCurrentCheckNumber(checkNum + 1);

      if (selectedType === "Driver") {
        const batch = writeBatch(db);
        unpaidTrips.forEach((trip) => {
          const tripRef = doc(db, "Users", selectedUserId, "trips", trip.id);
          batch.update(tripRef, { isPaid: true });
        });
        await batch.commit();
      }

      GlobalToastSuccess("Check created successfully!");
      setShowAddCheck(false);
      fetchChecks();
    } catch (error) {
      // GlobalToastError(
      //   `Error saving check: ${
      //     error instanceof Error ? error.message : String(error)
      //   }`
      // );
      console.error(error);
      GlobalToastError(errorMessage);
    }
  };

  const addCheckSeries = async () => {
    if (!newSeriesStart || !newSeriesEnd || !user) {
      GlobalToastError("Please enter both start and end numbers");
      return;
    }

    const startNum = parseInt(newSeriesStart);
    const endNum = parseInt(newSeriesEnd);

    if (isNaN(startNum) || isNaN(endNum)) {
      GlobalToastError("Please enter valid numbers");
      return;
    }

    if (startNum >= endNum) {
      GlobalToastError("End number must be greater than start number");
      return;
    }

    try {
      await addDoc(collection(db, "CheckSeries"), {
        userId: user.uid,
        startNumber: startNum,
        endNumber: endNum,
        createdAt: serverTimestamp(),
      });

      // If this is the first series, set the current check number
      if (currentCheckNumber === null) {
        await updateDoc(doc(db, "Users", user.uid), {
          currentCheckNumber: startNum,
        });
        setCurrentCheckNumber(startNum);
      }

      GlobalToastSuccess("Check series added successfully!");
      setNewSeriesStart("");
      setNewSeriesEnd("");
      fetchCheckSeries();
    } catch (error) {
      // GlobalToastError(
      //   `Error adding check series: ${
      //     error instanceof Error ? error.message : String(error)
      //   }`
      // );

      console.error(error);
    }
  };

  const removeServiceDetail = (index: number) => {
    const newDetails = [...serviceDetails];
    newDetails.splice(index, 1);
    setServiceDetails(newDetails);
    calculateTotal(newDetails);
  };

  const handlePrint = useReactToPrint({
    // contentRef: () => printRef.current,
    pageStyle: `
      @page {
        size: 3.5in 8.5in;
        margin: 0;
      }
      @media print {
        body {
          padding: 0;
          margin: 0;
          font-family: Arial, sans-serif;
        }
      }
    `,
  });

  const printCheck = (check: Check) => {
    return (
      <div
        ref={printRef}
        className="p-3"
        style={{ width: "3.5in", height: "8.5in" }}
      >
        <div className="text-center mb-2">
          <h5 className="mb-0">Western Truck & Trailer Maintenance</h5>
          <p className="mb-0 small">5250 N. Barcus Ave</p>
          <p className="mb-0 small">Fresno, CA 93722</p>
          <p className="mb-0 small">559-271-7275</p>
        </div>
        <hr className="my-2" />
        <div className="mb-2">
          <p className="mb-0 small">JPMORGAN CHASE BANK, NA</p>
          <p className="mb-0 small">376 W SHAW AVE</p>
          <p className="mb-0 small">FRESNO, CA 92711</p>
          <p className="mb-0 small">90-7162/3222</p>
        </div>
        <hr className="my-2" />
        <div className="mb-3">
          <p className="mb-1 fw-bold">PAY TO THE ORDER OF {check.userName}</p>
          <p className="mb-0 fs-5">${check.totalAmount.toFixed(2)}</p>
        </div>
        <hr className="my-2" />
        <div className="d-flex justify-content-between small">
          <span>Check #{check.checkNumber}</span>
          <span>{format(check.date, "MM/dd/yyyy")}</span>
        </div>
        {check.memoNumber && (
          <div className="small">
            <span>Memo: {check.memoNumber}</span>
          </div>
        )}
      </div>
    );
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
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowManageSeries(true)}
            className="flex items-center px-5 py-2.5 bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-50 transition-all duration-300 text-gray-700 hover:text-gray-900"
          >
            <FiChevronRight className="mr-2" />
            Manage Check Numbers
          </button>
          <button
            onClick={handleAddCheck}
            className="flex items-center px-6 py-2.5 bg-[#F96176] rounded-full shadow-md hover:bg-[#F96176] transition-all duration-300 text-white"
          >
            <FiPlus className="mr-2" />
            Write Check
          </button>
        </div>
      </div>

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
                      setFilterType(filterType === type ? null : type);
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
                className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176] "
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
          <div className="mx-auto w-24 h-24 bg-[#F96176] rounded-full flex items-center justify-center mb-6">
            <FiFileText size={40} className="text-[#F96176]" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">
            No Checks Found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            It looks like you haven&apos;t written any checks yet. Get started
            by creating your first check.
          </p>
          <button
            onClick={handleAddCheck}
            className="px-8 py-3 bg-[#F96176] text-white rounded-full shadow-lg hover:bg-[#F96176] transition-all"
          >
            Write First Check
          </button>
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
                        onClick={() => handlePrint()}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
                        title="Print Check"
                      >
                        <FiPrinter className="text-gray-600" />
                      </button>
                      {/* Hidden print content */}
                      <div style={{ display: "none" }}>{printCheck(check)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Check Modal */}
      <Modal
        show={showAddCheck}
        onHide={() => setShowAddCheck(false)}
        size="lg"
        centered
        backdrop="static"
        className="font-sans"
      >
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
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
          </div>

          <div className="p-6">
            <form>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check Number
                  </label>
                  <input
                    type="number"
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    placeholder="Enter check number"
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Next check number:{" "}
                    <span className="font-semibold">{currentCheckNumber}</span>
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
                </>
              )}
            </form>
          </div>

          <div className="p-6 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={() => setShowAddCheck(false)}
              className="px-6 py-2.5 bg-white border border-gray-300 rounded-full shadow-sm text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveCheck}
              disabled={
                serviceDetails.length === 0 || !selectedUserId || !checkNumber
              }
              className={`px-8 py-2.5 rounded-full shadow-sm transition-all ${
                serviceDetails.length === 0 || !selectedUserId || !checkNumber
                  ? "bg-[#F96176]/10 cursor-not-allowed"
                  : "bg-[#F96176] hover:bg-[#F96176]/80"
              } text-white`}
            >
              Save Check
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Detail Modal */}
      <Modal
        show={showAddDetail}
        onHide={() => setShowAddDetail(false)}
        centered
        backdrop="static"
        className="font-sans"
      >
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiPlusCircle className="text-[#F96176]" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Add Service Detail
              </h3>
            </div>
          </div>

          <div className="p-6">
            <form>
              <div className="mb-6">
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

              {selectedType === "Driver" && unpaidTrips.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="bg-yellow-100 p-2 rounded-full mr-3">
                      <FiClock className="text-yellow-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      Unpaid Trips
                    </h4>
                  </div>

                  <div className="space-y-2 mb-4">
                    {unpaidTrips.map((trip, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg"
                      >
                        <span className="text-gray-700">{trip.tripName}</span>
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
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={selectedType === "Driver"}
                  placeholder="Enter amount"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                />
              </div>
            </form>
          </div>

          <div className="p-6 bg-gray-50 flex justify-end space-x-3">
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
      </Modal>

      {/* Manage Check Series Modal */}
      <Modal
        show={showManageSeries}
        onHide={() => setShowManageSeries(false)}
        size="lg"
        centered
        backdrop="static"
        className="font-sans"
      >
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-[#F96176]/10 p-3 rounded-full mr-4">
                <FiHash className="text-[#F96176]" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-gray-800">
                  Manage Check Numbers
                </h3>
                <p className="text-gray-600">
                  Add and track check number series
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <FiInfo className="text-[#F96176] mr-3" />
                <div>
                  <p className="font-semibold text-gray-800">
                    Current Check Number
                  </p>
                  <p className="text-2xl font-bold text-[#F96176]">
                    {currentCheckNumber || "Not set"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <FiPlus className="text-[#F96176]" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">
                  Add New Check Series
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Number
                  </label>
                  <input
                    type="number"
                    value={newSeriesStart}
                    onChange={(e) => setNewSeriesStart(e.target.value)}
                    placeholder="Enter start number"
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Number
                  </label>
                  <input
                    type="number"
                    value={newSeriesEnd}
                    onChange={(e) => setNewSeriesEnd(e.target.value)}
                    placeholder="Enter end number"
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#F96176] focus:border-[#F96176]"
                  />
                </div>
              </div>

              <button
                onClick={addCheckSeries}
                disabled={!newSeriesStart || !newSeriesEnd}
                className={`px-6 py-2.5 rounded-full shadow-sm transition-all ${
                  !newSeriesStart || !newSeriesEnd
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-[#F96176] hover:bg-[#F96176]"
                } text-white`}
              >
                Add Check Series
              </button>
            </div>

            <div>
              <div className="flex items-center mb-4">
                <div className="bg-[#F96176]/10 p-2 rounded-full mr-3">
                  <FiArchive className="text-[#F96176]" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">
                  Check Series History
                </h4>
              </div>

              {checkSeries.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <FiInbox className="mx-auto text-gray-400 mb-3" size={32} />
                  <p className="text-gray-500">No check series found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkSeries.map((series) => (
                    <div
                      key={series.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {series.startNumber} - {series.endNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          Added: {format(series.createdAt, "MMM dd, yyyy")}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-white rounded-full text-sm font-medium shadow-sm">
                        {series.endNumber - series.startNumber + 1} checks
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-gray-50 flex justify-end">
            <button
              onClick={() => setShowManageSeries(false)}
              className="px-6 py-2.5 bg-white border border-gray-300 rounded-full shadow-sm text-gray-700 hover:bg-gray-50 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
