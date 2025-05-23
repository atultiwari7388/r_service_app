// "use client";

// import { useAuth } from "@/contexts/AuthContexts";
// import { db, storage } from "@/lib/firebase";
// import { ProfileValues, VehicleTypes } from "@/types/types";
// import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
// import {
//   addDoc,
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   onSnapshot,
//   query,
//   Timestamp,
//   updateDoc,
//   where,
//   writeBatch,
// } from "firebase/firestore";
// import { useEffect, useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { GlobalToastError, GlobalToastSuccess } from "@/utils/globalErrorToast";
// import { LoadingIndicator } from "@/utils/LoadinIndicator";
// import { Button } from "@/components/ui/button";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { FileUpload } from "@/components/ui/file-upload";

// // ... (keep all your existing interfaces and types)

// export default function ManageTripPage() {
//   // ... (keep all your existing state and hooks)

//   return (
//     <div className="container mx-auto p-4 space-y-6">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <h1 className="text-2xl font-bold text-gray-800">Trip Management</h1>
//         <div className="flex flex-wrap gap-2">
//           <Button
//             onClick={() => setShowAddTrip(!showAddTrip)}
//             variant={showAddTrip ? "outline" : "default"}
//             className="gap-2"
//           >
//             {showAddTrip ? (
//               <>
//                 <X className="h-4 w-4" />
//                 Cancel
//               </>
//             ) : (
//               <>
//                 <Plus className="h-4 w-4" />
//                 Add Trip
//               </>
//             )}
//           </Button>
//           <Button
//             onClick={() => setShowAddExpense(!showAddExpense)}
//             variant={showAddExpense ? "outline" : "default"}
//             className="gap-2"
//           >
//             {showAddExpense ? (
//               <>
//                 <X className="h-4 w-4" />
//                 Cancel
//               </>
//             ) : (
//               <>
//                 <Plus className="h-4 w-4" />
//                 Add Expense
//               </>
//             )}
//           </Button>
//         </div>
//       </div>

//       {showAddTrip && (
//         <Card className="border-0 shadow-lg">
//           <CardHeader>
//             <CardTitle className="text-xl">Add New Trip</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="tripName">Trip Name</Label>
//                 <Input
//                   id="tripName"
//                   placeholder="Trip Name"
//                   value={tripName}
//                   onChange={(e) => setTripName(e.target.value)}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="currentMiles">Current Miles</Label>
//                 <Input
//                   id="currentMiles"
//                   type="number"
//                   placeholder="Current Miles"
//                   value={currentMiles}
//                   onChange={(e) => setCurrentMiles(e.target.value)}
//                 />
//               </div>
//               {role === "Owner" && (
//                 <div className="space-y-2">
//                   <Label htmlFor="oEarnings">Load Price</Label>
//                   <Input
//                     id="oEarnings"
//                     type="number"
//                     placeholder="Load Price"
//                     value={oEarnings}
//                     onChange={(e) => setOEarnings(e.target.value)}
//                   />
//                 </div>
//               )}
//               <div className="space-y-2">
//                 <Label>Start Date</Label>
//                 <DatePicker
//                   selected={selectedDate}
//                   onChange={(date: Date | null) => date && setSelectedDate(date)}
//                   className="border p-2 rounded-md w-full"
//                   dateFormat="MMMM d, yyyy"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="vehicle">Vehicle</Label>
//                 <Select
//                   value={selectedVehicle}
//                   onValueChange={(value) => setSelectedVehicle(value)}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select Vehicle" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {vehicles.map((vehicle) => (
//                       <SelectItem key={vehicle.id} value={vehicle.id}>
//                         {vehicle.vehicleNumber} ({vehicle.companyName})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <Button
//               onClick={handleAddTrip}
//               className="mt-6 w-full md:w-auto gap-2"
//             >
//               <Check className="h-4 w-4" />
//               Save Trip
//             </Button>
//           </CardContent>
//         </Card>
//       )}

//       {showAddExpense && (
//         <Card className="border-0 shadow-lg">
//           <CardHeader>
//             <CardTitle className="text-xl">Add Expense</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-1 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="trip">Trip</Label>
//                 <Select
//                   value={selectedTrip}
//                   onValueChange={(value) => setSelectedTrip(value)}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select Trip" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {trips.map((trip) => (
//                       <SelectItem key={trip.id} value={trip.id}>
//                         {trip.tripName}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="amount">Amount</Label>
//                 <Input
//                   id="amount"
//                   type="number"
//                   placeholder="Amount"
//                   value={expenseAmount}
//                   onChange={(e) => setExpenseAmount(e.target.value)}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="description">Description</Label>
//                 <Input
//                   id="description"
//                   placeholder="Description"
//                   value={expenseDescription}
//                   onChange={(e) => setExpenseDescription(e.target.value)}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="receipt">Receipt (Optional)</Label>
//                 <FileUpload
//                   id="receipt"
//                   onChange={(file) => setSelectedFile(file)}
//                 />
//               </div>
//             </div>
//             <Button
//               onClick={handleAddExpense}
//               className="mt-6 w-full md:w-auto gap-2"
//             >
//               <Check className="h-4 w-4" />
//               Save Expense
//             </Button>
//           </CardContent>
//         </Card>
//       )}

//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <h2 className="text-xl font-bold text-gray-800">Trip History</h2>
//         <div className="flex items-center gap-2">
//           <DatePicker
//             selectsRange
//             startDate={fromDate}
//             endDate={toDate}
//             onChange={(update: [Date | null, Date | null]) => {
//               setFromDate(update[0]);
//               setToDate(update[1]);
//             }}
//             className="border p-2 rounded-md"
//             placeholderText="Filter by date range"
//             isClearable
//           />
//           {fromDate && (
//             <Button
//               variant="ghost"
//               onClick={() => {
//                 setFromDate(null);
//                 setToDate(null);
//               }}
//               className="text-gray-500"
//             >
//               Clear
//             </Button>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         <Card className="bg-emerald-100 border-emerald-200">
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-emerald-800">
//               Total Earnings
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-emerald-800">
//               ${totals.totalEarnings.toFixed(2)}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="bg-rose-100 border-rose-200">
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-rose-800">
//               Total Expenses
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-rose-800">
//               ${totals.totalExpenses.toFixed(2)}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="bg-blue-100 border-blue-200">
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-blue-800">
//               Net Profit
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-blue-800">
//               ${(totals.totalEarnings - totals.totalExpenses).toFixed(2)}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {filteredTrips.length === 0 ? (
//         <Card className="text-center py-12">
//           <CardContent>
//             <div className="text-gray-500">
//               {fromDate || toDate
//                 ? "No trips found for selected date range"
//                 : "No trips available"}
//             </div>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredTrips.map((trip) => (
//             <Card key={trip.id} className="hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="flex justify-between items-start">
//                   <CardTitle className="text-lg">{trip.tripName}</CardTitle>
//                   <Badge
//                     variant={
//                       trip.tripStatus === 2
//                         ? "default"
//                         : trip.isPaid
//                         ? "success"
//                         : "warning"
//                     }
//                   >
//                     {trip.tripStatus === 2
//                       ? "Completed"
//                       : trip.isPaid
//                       ? "Paid"
//                       : "Active"}
//                   </Badge>
//                 </div>
//                 <div className="text-sm text-gray-500">
//                   {trip.vehicleNumber} • {trip.companyName}
//                 </div>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <div className="grid grid-cols-2 gap-2">
//                   <div>
//                     <p className="text-sm text-gray-500">Start Date</p>
//                     <p className="font-medium">
//                       {trip.tripStartDate.toDate().toLocaleDateString()}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Start Miles</p>
//                     <p className="font-medium">{trip.tripStartMiles}</p>
//                   </div>
//                 </div>

//                 {trip.tripStatus === 2 && (
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <p className="text-sm text-gray-500">End Date</p>
//                       <p className="font-medium">
//                         {trip.tripEndDate.toDate().toLocaleDateString()}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500">End Miles</p>
//                       <p className="font-medium">{trip.tripEndMiles}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500">Total Miles</p>
//                       <p className="font-medium">
//                         {trip.tripEndMiles - trip.tripStartMiles}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500">
//                         {role === "Owner" ? "Load Price" : "Earnings"}
//                       </p>
//                       <p className="font-medium">
//                         {role === "Owner"
//                           ? `$${trip.oEarnings}`
//                           : userData?.perMileCharge
//                           ? `$${
//                               ((trip.tripEndMiles || 0) -
//                                 (trip.tripStartMiles || 0)) *
//                               Number(userData.perMileCharge)
//                             }`
//                           : "N/A"}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex justify-between gap-2 pt-2">
//                   {trip.tripStatus === 1 && (
//                     <>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           setCurrentTripEdit(trip);
//                           setShowEditModal(true);
//                         }}
//                         className="flex-1"
//                       >
//                         Edit
//                       </Button>
//                       <Select
//                         value={trip.tripStatus.toString()}
//                         onValueChange={(value) =>
//                           handleUpdateTripStatus(trip, parseInt(value))
//                         }
//                       >
//                         <SelectTrigger className="flex-1">
//                           <SelectValue placeholder="Status" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="1">Active</SelectItem>
//                           <SelectItem value="2">Complete</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </>
//                   )}
//                   <Button
//                     variant="default"
//                     size="sm"
//                     onClick={() => {
//                       router.push(
//                         `/account/manage-trip/${trip.id}?userId=${user?.uid}`
//                       );
//                     }}
//                     className="flex-1"
//                   >
//                     Details
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {showEditModal && currentTripEdit && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <Card className="w-full max-w-md">
//             <CardHeader>
//               <CardTitle>Edit Trip</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-2">
//                 <Label>Start Date</Label>
//                 <DatePicker
//                   selected={currentTripEdit.tripStartDate.toDate()}
//                   onChange={(date: Date | null) => {
//                     if (date) {
//                       setCurrentTripEdit({
//                         ...currentTripEdit,
//                         tripStartDate: Timestamp.fromDate(date),
//                       });
//                     }
//                   }}
//                   className="border p-2 rounded-md w-full"
//                   dateFormat="MMMM d, yyyy"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label>Start Miles</Label>
//                 <Input
//                   type="number"
//                   value={currentTripEdit.tripStartMiles}
//                   onChange={(e) =>
//                     setCurrentTripEdit({
//                       ...currentTripEdit,
//                       tripStartMiles: parseInt(e.target.value) || 0,
//                     })
//                   }
//                 />
//               </div>
//               <div className="flex justify-end gap-2 pt-4">
//                 <Button
//                   variant="outline"
//                   onClick={() => setShowEditModal(false)}
//                 >
//                   Cancel
//                 </Button>
//                 <Button onClick={handleUpdateTrip}>Save Changes</Button>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// }
