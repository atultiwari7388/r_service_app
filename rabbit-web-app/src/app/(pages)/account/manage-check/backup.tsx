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
// } from "firebase/firestore";
// import React, { useEffect, useState } from "react";
// import { Button, Card, Form, Modal } from "react-bootstrap";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { format } from "date-fns";

// // Define types
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
//   type: string;
//   userId: string;
//   userName: string;
//   serviceDetails: ServiceDetail[];
//   totalAmount: number;
//   memoNumber?: string;
//   date: Date;
//   createdBy: string;
//   createdAt: string;
// }

// export default function ManageCheckScreen() {
//   const [role, setUserRole] = useState<string>("");
//   const [isCheque, setIsCheque] = useState<boolean>(false);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [errorMessage, setErrorMessage] = useState<string>("");

//   const [allMembers, setAllMembers] = useState<Member[]>([]);
//   const [checks, setChecks] = useState<Check[]>([]);
//   const [loadingChecks, setLoadingChecks] = useState<boolean>(true);
//   const [filterType, setFilterType] = useState<string | null>(null);

//   // Date range state
//   const [startDate, setStartDate] = useState<Date | null>(null);
//   const [endDate, setEndDate] = useState<Date | null>(null);
//   const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

//   // Add check dialog state
//   const [showAddCheck, setShowAddCheck] = useState<boolean>(false);
//   const [selectedType, setSelectedType] = useState<string | null>(null);
//   const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
//   const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
//   const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>([]);
//   const [memoNumber, setMemoNumber] = useState<string>("");
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
//   const [totalAmount, setTotalAmount] = useState<number>(0);

//   // Add detail dialog state
//   const [showAddDetail, setShowAddDetail] = useState<boolean>(false);
//   const [serviceName, setServiceName] = useState<string>("");
//   const [amount, setAmount] = useState<string>("");
//   const [unpaidTrips, setUnpaidTrips] = useState<Trip[]>([]);
//   const [driverUnpaidTotal, setDriverUnpaidTotal] = useState<number>(0);

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
//           setIsCheque(userProfile.isCheque || false);

//           if (userProfile.isCheque) {
//             fetchTeamMembersWithVehicles();
//             fetchChecks();
//           }
//         } else {
//           GlobalToastError("User document not found");
//         }
//         setIsLoading(false);
//       },
//       (error: Error) => {
//         GlobalToastError(error.message || "Error fetching user data");
//         setIsLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [user]);

//   const fetchTeamMembersWithVehicles = async () => {
//     try {
//       if (!user) return;

//       const teamQuery = query(
//         collection(db, "Users"),
//         where("createdBy", "==", user.uid),
//         where("uid", "!=", user.uid)
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
//       setErrorMessage(
//         `Error loading team members: ${
//           error instanceof Error ? error.message : String(error)
//         }`
//       );
//       console.error(error);
//     }
//   };

//   const fetchChecks = async () => {
//     try {
//       if (!user) return;

//       setLoadingChecks(true);

//       let checksQuery = query(
//         collection(db, "Checks"),
//         where("createdBy", "==", user.uid),
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
//           type: data.type || "",
//           userId: data.userId || "",
//           userName: data.userName || "",
//           serviceDetails: data.serviceDetails || [],
//           totalAmount: data.totalAmount || 0,
//           memoNumber: data.memoNumber || undefined,
//           date: data.date?.toDate() || new Date(),
//           createdBy: data.createdBy || "",
//           createdAt: data.createdAt,
//         };
//       });

//       setChecks(checksData);
//       setLoadingChecks(false);
//     } catch (error) {
//       setErrorMessage(
//         `Error loading checks: ${
//           error instanceof Error ? error.message : String(error)
//         }`
//       );
//       setLoadingChecks(false);
//       console.error(error);
//     }
//   };

//   const handleAddCheck = () => {
//     setSelectedType(null);
//     setSelectedUserId(null);
//     setSelectedUserName(null);
//     setServiceDetails([]);
//     setMemoNumber("");
//     setSelectedDate(new Date());
//     setTotalAmount(0);
//     setShowAddCheck(true);
//   };

//   const handleAddDetail = () => {
//     setServiceName("");
//     setAmount("");
//     setUnpaidTrips([]);
//     setDriverUnpaidTotal(0);

//     if (selectedType === "Driver" && selectedUserId) {
//       fetchUnpaidTrips();
//     }

//     setShowAddDetail(true);
//   };

//   const fetchUnpaidTrips = async () => {
//     try {
//       if (!selectedUserId) return;

//       const tripsQuery = query(
//         collection(db, "Users", selectedUserId, "trips"),
//         where("isPaid", "==", false)
//       );

//       const snapshot = await getDocs(tripsQuery);
//       const trips: Trip[] = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         tripName: doc.data().tripName || "Unnamed Trip",
//         oEarnings: doc.data().oEarnings || 0,
//       }));

//       const total = trips.reduce((sum, trip) => sum + trip.oEarnings, 0);

//       setUnpaidTrips(trips);
//       setDriverUnpaidTotal(total);
//       setAmount(total.toFixed(2));
//     } catch (error) {
//       GlobalToastError(
//         `Error fetching unpaid trips: ${
//           error instanceof Error ? error.message : String(error)
//         }`
//       );
//       console.error(error);
//     }
//   };

//   const saveDetail = () => {
//     if (!serviceName || !amount) {
//       GlobalToastError("Please fill all fields");
//       return;
//     }

//     const newDetail: ServiceDetail = {
//       serviceName,
//       amount: parseFloat(amount),
//     };

//     setServiceDetails([...serviceDetails, newDetail]);
//     calculateTotal([...serviceDetails, newDetail]);
//     setShowAddDetail(false);
//   };

//   const calculateTotal = (details: ServiceDetail[]) => {
//     const total = details.reduce((sum, detail) => sum + detail.amount, 0);
//     setTotalAmount(total);
//   };

//   const saveCheck = async () => {
//     if (!selectedUserId || serviceDetails.length === 0 || !user) {
//       GlobalToastError("Please fill all required fields");
//       return;
//     }

//     try {
//       await addDoc(collection(db, "Checks"), {
//         type: selectedType,
//         userId: selectedUserId,
//         userName: selectedUserName,
//         serviceDetails: serviceDetails,
//         totalAmount: totalAmount,
//         memoNumber: memoNumber || null,
//         date: Timestamp.fromDate(selectedDate),
//         createdBy: user.uid,
//         createdAt: serverTimestamp(),
//       });

//       if (selectedType === "Driver") {
//         const batch = writeBatch(db);

//         for (const trip of unpaidTrips) {
//           const tripRef = doc(db, "Users", selectedUserId, "trips", trip.id);
//           batch.update(tripRef, { isPaid: true });
//         }

//         await batch.commit();
//       }

//       GlobalToastSuccess("Check saved successfully");
//       setShowAddCheck(false);
//       fetchChecks();
//     } catch (error) {
//       GlobalToastError(
//         `Error saving check: ${
//           error instanceof Error ? error.message : String(error)
//         }`
//       );
//       console.error(error);
//     }
//   };

//   const removeServiceDetail = (index: number) => {
//     const newDetails = [...serviceDetails];
//     newDetails.splice(index, 1);
//     setServiceDetails(newDetails);
//     calculateTotal(newDetails);
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
//     <div className="container py-4">
//       <h2 className="mb-4">Manage Checks</h2>

//       <button className="btn btn-primary mb-4" onClick={handleAddCheck}>
//         Write Check
//       </button>

//       <div className="row mb-4">
//         <div className="col-md-4">
//           <Form.Group>
//             <Form.Label>Filter by Type</Form.Label>
//             <Form.Select
//               value={filterType || ""}
//               onChange={(e) => {
//                 setFilterType(e.target.value || null);
//                 fetchChecks();
//               }}
//             >
//               <option value="">All Types</option>
//               <option value="Manager">Manager</option>
//               <option value="Accountant">Accountant</option>
//               <option value="Driver">Driver</option>
//               <option value="Vendor">Vendor</option>
//               <option value="Other Staff">Other Staff</option>
//             </Form.Select>
//           </Form.Group>
//         </div>
//         <div className="col-md-6 d-flex align-items-end gap-2">
//           <Button
//             variant="outline-primary"
//             onClick={() => setShowDatePicker(!showDatePicker)}
//           >
//             Select Date Range
//           </Button>
//           {(startDate || endDate) && (
//             <Button
//               variant="outline-danger"
//               onClick={() => {
//                 setStartDate(null);
//                 setEndDate(null);
//                 fetchChecks();
//               }}
//             >
//               Clear
//             </Button>
//           )}
//         </div>
//       </div>

//       {showDatePicker && (
//         <div className="mb-3 p-3 border rounded">
//           <div className="row">
//             <div className="col-md-6">
//               <Form.Group>
//                 <Form.Label>Start Date</Form.Label>
//                 <DatePicker
//                   selected={startDate}
//                   onChange={(date: Date | null) => setStartDate(date)}
//                   selectsStart
//                   startDate={startDate}
//                   endDate={endDate}
//                   className="form-control"
//                 />
//               </Form.Group>
//             </div>
//             <div className="col-md-6">
//               <Form.Group>
//                 <Form.Label>End Date</Form.Label>
//                 <DatePicker
//                   selected={endDate}
//                   onChange={(date: Date | null) => setEndDate(date)}
//                   selectsEnd
//                   startDate={startDate}
//                   endDate={endDate}
//                   minDate={startDate ?? undefined}
//                   className="form-control"
//                 />
//               </Form.Group>
//             </div>
//           </div>
//           <Button
//             variant="primary"
//             onClick={() => {
//               setShowDatePicker(false);
//               fetchChecks();
//             }}
//             className="mt-2"
//           >
//             Apply
//           </Button>
//         </div>
//       )}

//       {(startDate || endDate) && (
//         <p className="text-muted mb-3">
//           Showing checks from{" "}
//           {startDate ? format(startDate, "MMM dd, yyyy") : "..."} to{" "}
//           {endDate ? format(endDate, "MMM dd, yyyy") : "..."}
//         </p>
//       )}

//       {loadingChecks ? (
//         <LoadingIndicator />
//       ) : checks.length === 0 ? (
//         <p>No checks found</p>
//       ) : (
//         <div className="row">
//           {checks.map((check) => (
//             <div className="col-md-6 mb-4" key={check.id}>
//               <Card>
//                 <Card.Body>
//                   <div className="d-flex justify-content-between align-items-center mb-3">
//                     <Card.Title>Check #{check.id.substring(0, 6)}</Card.Title>
//                     <small className="text-muted">
//                       {format(check.date, "MMM dd, yyyy")}
//                     </small>
//                   </div>

//                   <Card.Subtitle className="mb-3">
//                     Paid To: {check.userName} ({check.type})
//                   </Card.Subtitle>

//                   <hr />

//                   {check.serviceDetails.map((detail, index) => (
//                     <div
//                       key={index}
//                       className="d-flex justify-content-between mb-2"
//                     >
//                       <span>{detail.serviceName}</span>
//                       <span>${detail.amount.toFixed(2)}</span>
//                     </div>
//                   ))}

//                   <hr />

//                   <div className="d-flex justify-content-between fw-bold">
//                     <span>TOTAL:</span>
//                     <span className="text-primary">
//                       ${check.totalAmount.toFixed(2)}
//                     </span>
//                   </div>

//                   {check.memoNumber && (
//                     <small className="text-muted d-block mt-2">
//                       Memo: {check.memoNumber}
//                     </small>
//                   )}

//                   {/* <div className="d-flex justify-content-end mt-3">
//                     <PDFDownloadLink
//                       document={<CheckReceiptPDF check={check} />}
//                       fileName={`check_${check.id.substring(0, 6)}.pdf`}
//                     >
//                       {({ loading }) => (
//                         <Button
//                           variant="outline-primary"
//                           size="sm"
//                           disabled={loading}
//                         >
//                           {loading ? "Generating PDF..." : "Print"}
//                         </Button>
//                       )}
//                     </PDFDownloadLink>
//                   </div>
//                  */}
//                 </Card.Body>
//               </Card>
//             </div>
//           ))}
//         </div>
//       )}

//       <Modal
//         show={showAddCheck}
//         onHide={() => setShowAddCheck(false)}
//         size="lg"
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>Write Check</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group className="mb-3">
//               <Form.Label>Select Type</Form.Label>
//               <Form.Select
//                 value={selectedType || ""}
//                 onChange={(e) => {
//                   setSelectedType(e.target.value || null);
//                   setSelectedUserId(null);
//                   setSelectedUserName(null);
//                 }}
//               >
//                 <option value="">Select Type</option>
//                 <option value="Manager">Manager</option>
//                 <option value="Accountant">Accountant</option>
//                 <option value="Driver">Driver</option>
//                 <option value="Vendor">Vendor</option>
//                 <option value="Other Staff">Other Staff</option>
//               </Form.Select>
//             </Form.Group>

//             {selectedType && (
//               <Form.Group className="mb-3">
//                 <Form.Label>Select Name</Form.Label>
//                 <Form.Select
//                   value={selectedUserId || ""}
//                   onChange={(e) => {
//                     const member = allMembers.find(
//                       (m) => m.memberId === e.target.value
//                     );
//                     setSelectedUserId(e.target.value || null);
//                     setSelectedUserName(member?.name || null);
//                   }}
//                 >
//                   <option value="">Select Name</option>
//                   {allMembers
//                     .filter((member) => member.role === selectedType)
//                     .map((member) => (
//                       <option key={member.memberId} value={member.memberId}>
//                         {member.name}
//                       </option>
//                     ))}
//                 </Form.Select>
//               </Form.Group>
//             )}

//             {selectedUserId && (
//               <div className="mb-3">
//                 <Button variant="primary" onClick={handleAddDetail}>
//                   Add Detail
//                 </Button>
//               </div>
//             )}

//             {serviceDetails.length > 0 && (
//               <div className="mb-3">
//                 <h6>Service Details:</h6>
//                 <ul className="list-group">
//                   {serviceDetails.map((detail, index) => (
//                     <li
//                       key={index}
//                       className="list-group-item d-flex justify-content-between align-items-center"
//                     >
//                       <span>
//                         {detail.serviceName}: ${detail.amount.toFixed(2)}
//                       </span>
//                       <button
//                         className="btn btn-sm btn-outline-danger"
//                         onClick={() => removeServiceDetail(index)}
//                       >
//                         Remove
//                       </button>
//                     </li>
//                   ))}
//                 </ul>
//                 <div className="mt-2 fw-bold">
//                   Total: ${totalAmount.toFixed(2)}
//                 </div>
//               </div>
//             )}

//             <Form.Group className="mb-3">
//               <Form.Label>Memo Number (Optional)</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={memoNumber}
//                 onChange={(e) => setMemoNumber(e.target.value)}
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Date</Form.Label>
//               <div>
//                 <DatePicker
//                   selected={selectedDate}
//                   onChange={(date: Date | null) => {
//                     if (date) setSelectedDate(date);
//                   }}
//                   className="form-control"
//                 />
//               </div>
//             </Form.Group>
//           </Form>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowAddCheck(false)}>
//             Cancel
//           </Button>
//           <Button
//             variant="primary"
//             onClick={saveCheck}
//             disabled={serviceDetails.length === 0}
//           >
//             Save Check
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       <Modal show={showAddDetail} onHide={() => setShowAddDetail(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Add Service Detail</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group className="mb-3">
//               <Form.Label>Service Name</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={serviceName}
//                 onChange={(e) => setServiceName(e.target.value)}
//               />
//             </Form.Group>

//             {selectedType === "Driver" && unpaidTrips.length > 0 && (
//               <div className="mb-3">
//                 <h6>Unpaid Trips:</h6>
//                 <ul className="list-group mb-2">
//                   {unpaidTrips.map((trip, index) => (
//                     <li key={index} className="list-group-item">
//                       {trip.tripName}: ${trip.oEarnings.toFixed(2)}
//                     </li>
//                   ))}
//                 </ul>
//                 <div className="fw-bold">
//                   Total Unpaid Amount: ${driverUnpaidTotal.toFixed(2)}
//                 </div>
//               </div>
//             )}

//             <Form.Group className="mb-3">
//               <Form.Label>Amount</Form.Label>
//               <Form.Control
//                 type="number"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//                 disabled={selectedType === "Driver"}
//               />
//             </Form.Group>
//           </Form>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowAddDetail(false)}>
//             Cancel
//           </Button>
//           <Button variant="primary" onClick={saveDetail}>
//             Add Detail
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// }
