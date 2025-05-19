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
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Button, Card, Form, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import {
  FiPlus,
  FiX,
  FiFilter,
  FiPrinter,
  FiDollarSign,
  FiUser,
  FiCalendar,
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
          setIsCheque(userProfile.isCheque || false);

          if (userProfile.isCheque) {
            fetchTeamMembersWithVehicles();
            fetchChecks();
          }
        } else {
          GlobalToastError("User document not found");
        }
        setIsLoading(false);
      },
      (error: Error) => {
        GlobalToastError(error.message || "Error fetching user data");
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
      console.log("Team members with vehicles:", members);
      console.log("Role:", role);
    } catch (error) {
      setErrorMessage(
        `Error loading team members: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      console.error(error);
      console.log("Error Message:", errorMessage);
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
      setErrorMessage(
        `Error loading checks: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setLoadingChecks(false);
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
      GlobalToastError(
        `Error fetching unpaid trips: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
    if (!selectedUserId || serviceDetails.length === 0 || !user) {
      GlobalToastError("Please fill all required fields");
      return;
    }

    try {
      const checkData = {
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
      GlobalToastError(
        `Error saving check: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      console.error(error);
    }
  };

  const removeServiceDetail = (index: number) => {
    const newDetails = [...serviceDetails];
    newDetails.splice(index, 1);
    setServiceDetails(newDetails);
    calculateTotal(newDetails);
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
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaFileAlt className="me-2 text-primary" />
          Manage Checks
        </h2>
        <Button
          variant="primary"
          onClick={handleAddCheck}
          className="d-flex align-items-center"
        >
          <FiPlus className="me-2" />
          Write Check
        </Button>
      </div>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h5 className="card-title d-flex align-items-center">
            <FiFilter className="me-2" />
            Filters
          </h5>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Filter by Type</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    "Manager",
                    "Accountant",
                    "Driver",
                    "Vendor",
                    "Other Staff",
                  ].map((type) => (
                    <Button
                      key={type}
                      variant={
                        filterType === type ? "primary" : "outline-secondary"
                      }
                      size="sm"
                      onClick={() => {
                        setFilterType(filterType === type ? null : type);
                        fetchChecks();
                      }}
                    >
                      {type}
                      {filterType === type && <FiX className="ms-2" />}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Date Range</Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant={startDate ? "primary" : "outline-primary"}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="d-flex align-items-center"
                  >
                    <FiCalendar className="me-2" />
                    {startDate
                      ? format(startDate, "MMM dd, yyyy")
                      : "Start Date"}
                    {endDate && ` - ${format(endDate, "MMM dd, yyyy")}`}
                  </Button>
                  {(startDate || endDate) && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setStartDate(null);
                        setEndDate(null);
                        fetchChecks();
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </Form.Group>
            </div>
          </div>
        </Card.Body>
      </Card>

      {showDatePicker && (
        <Card className="mb-3 shadow">
          <Card.Body>
            <div className="row">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Start Date</Form.Label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="form-control"
                    dateFormat="MMMM d, yyyy"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>End Date</Form.Label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || undefined}
                    className="form-control"
                    dateFormat="MMMM d, yyyy"
                  />
                </Form.Group>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <Button
                variant="primary"
                onClick={() => {
                  setShowDatePicker(false);
                  fetchChecks();
                }}
              >
                Apply Filters
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {loadingChecks ? (
        <div className="text-center my-5">
          <LoadingIndicator />
          <p className="mt-2">Loading checks...</p>
        </div>
      ) : checks.length === 0 ? (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <h4>No checks found</h4>
            <p className="text-muted">
              Create your first check by clicking Write Check
            </p>
            <Button variant="primary" onClick={handleAddCheck}>
              Write First Check
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {checks.map((check) => (
            <div className="col" key={check.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Card.Title className="mb-0">
                      <span className="badge bg-primary me-2">
                        {check.type}
                      </span>
                      Check #{check.id.substring(0, 6)}
                    </Card.Title>
                    <small className="text-muted">
                      {format(check.date, "MMM dd, yyyy")}
                    </small>
                  </div>

                  <Card.Subtitle className="mb-3">
                    <FiUser className="me-1" />
                    Paid To: {check.userName}
                  </Card.Subtitle>

                  <div className="mb-3 flex-grow-1">
                    {check.serviceDetails.map((detail, index) => (
                      <div
                        key={index}
                        className="d-flex justify-content-between mb-2"
                      >
                        <span>{detail.serviceName}</span>
                        <span className="fw-semibold">
                          <FiDollarSign className="me-1" />
                          {detail.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-top pt-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0">Total:</h5>
                        {check.memoNumber && (
                          <small className="text-muted">
                            Memo: {check.memoNumber}
                          </small>
                        )}
                      </div>
                      <div className="d-flex align-items-center">
                        <h4 className="text-primary mb-0">
                          <FiDollarSign className="me-1" />
                          {check.totalAmount.toFixed(2)}
                        </h4>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="ms-3 d-flex align-items-center"
                        >
                          <FiPrinter className="me-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal
        show={showAddCheck}
        onHide={() => setShowAddCheck(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>
            <h4 className="fw-bold">Write New Check</h4>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Recipient Type</Form.Label>
                  <Form.Select
                    value={selectedType || ""}
                    onChange={(e) => {
                      setSelectedType(e.target.value || null);
                      setSelectedUserId(null);
                      setSelectedUserName(null);
                    }}
                    className="form-select-lg"
                  >
                    <option value="">Select Type</option>
                    <option value="Manager">Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Driver">Driver</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Other Staff">Other Staff</option>
                  </Form.Select>
                </Form.Group>
              </div>

              {selectedType && (
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Recipient Name</Form.Label>
                    <Form.Select
                      value={selectedUserId || ""}
                      onChange={(e) => {
                        const member = allMembers.find(
                          (m) => m.memberId === e.target.value
                        );
                        setSelectedUserId(e.target.value || null);
                        setSelectedUserName(member?.name || null);
                      }}
                      className="form-select-lg"
                    >
                      <option value="">Select Recipient</option>
                      {allMembers
                        .filter((member) => member.role === selectedType)
                        .map((member) => (
                          <option key={member.memberId} value={member.memberId}>
                            {member.name}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              )}
            </div>

            {selectedUserId && (
              <>
                <div className="mt-4">
                  <Button
                    variant="outline-primary"
                    onClick={handleAddDetail}
                    className="d-flex align-items-center"
                  >
                    <FiPlus className="me-2" />
                    Add Service Detail
                  </Button>
                </div>

                {serviceDetails.length > 0 && (
                  <div className="mt-3">
                    <h6 className="fw-bold mb-3">Service Details</h6>
                    <div className="list-group">
                      {serviceDetails.map((detail, index) => (
                        <div
                          key={index}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <div className="fw-semibold">
                              {detail.serviceName}
                            </div>
                            <small className="text-muted">
                              ${detail.amount.toFixed(2)}
                            </small>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeServiceDetail(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="d-flex justify-content-between mt-3 fw-bold fs-5">
                      <span>Total:</span>
                      <span className="text-primary">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="row g-3 mt-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Memo Number (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={memoNumber}
                    onChange={(e) => setMemoNumber(e.target.value)}
                    placeholder="Enter reference number"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Date</Form.Label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) =>
                      setSelectedDate(date || new Date())
                    }
                    className="form-control"
                    dateFormat="MMMM d, yyyy"
                  />
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowAddCheck(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={saveCheck}
            disabled={serviceDetails.length === 0 || !selectedUserId}
            className="px-4"
          >
            Save Check
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showAddDetail}
        onHide={() => setShowAddDetail(false)}
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Add Service Detail</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Service Name</Form.Label>
              <Form.Control
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Enter service description"
              />
            </Form.Group>

            {selectedType === "Driver" && unpaidTrips.length > 0 && (
              <div className="mb-3">
                <h6 className="fw-bold">Unpaid Trips</h6>
                <div className="list-group mb-2">
                  {unpaidTrips.map((trip, index) => (
                    <div key={index} className="list-group-item py-2">
                      <div className="d-flex justify-content-between">
                        <span>{trip.tripName}</span>
                        <span>${trip.oEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="alert alert-info py-2">
                  <span className="fw-bold">Total Unpaid:</span> $
                  {driverUnpaidTotal.toFixed(2)}
                </div>
              </div>
            )}

            <Form.Group>
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={selectedType === "Driver"}
                placeholder="Enter amount"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowAddDetail(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveDetail}>
            Add Detail
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
