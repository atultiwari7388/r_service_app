// "use client";

// import { useAuth } from "@/contexts/AuthContexts";
// import { auth, db } from "@/lib/firebase";
// import {
//   createUserWithEmailAndPassword,
//   sendEmailVerification,
// } from "firebase/auth";
// import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import toast from "react-hot-toast";
// import HashLoader from "react-spinners/HashLoader";

// interface Vehicle {
//   id: string;
//   companyName: string;
//   vehicleNumber: string;
//   licensePlate: string | null;
//   vin: string | null;
//   year: string;
//   isSet: boolean;
// }

// interface CreateTeamMemberForm {
//   memberName: string;
//   memberEmail: string;
//   memberPhoneNumber: string;
//   memberPassword: string;
//   assignedVehicle: string;
//   role: string;
// }

// export default function CreateTeamMemberPage() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [assignVehicleList, setAssignVehicleList] = useState<Vehicle[]>([]);
//   const { user } = useAuth() || { user: null };
//   const currentUserId = user?.uid;
//   const router = useRouter();
//   const [formData, setFormData] = useState<CreateTeamMemberForm>({
//     memberName: "",
//     memberEmail: "",
//     memberPhoneNumber: "",
//     memberPassword: "",
//     assignedVehicle: "",
//     role: "",
//   });

//   const handleInputChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validate required fields
//     if (
//       !formData.memberName ||
//       !formData.memberEmail ||
//       !formData.memberPhoneNumber ||
//       !formData.memberPassword ||
//       !formData.assignedVehicle
//     ) {
//       toast.error("All fields and vehicle selection are required");
//       return;
//     }

//     // Validate email format
//     const emailRegex =
//       /^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]+\.[a-zA-Z]+/;
//     if (!emailRegex.test(formData.memberEmail)) {
//       toast.error("Please enter a valid email");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         formData.memberEmail,
//         formData.memberPassword
//       );

//       await setDoc(doc(db, "Users", userCredential.user.uid), {
//         uid: userCredential.user.uid,
//         email: formData.memberEmail,
//         active: true,
//         isTeamMember: true,
//         userName: formData.memberName,
//         phoneNumber: formData.memberPhoneNumber,
//         createdBy: currentUserId,
//         profilePicture:
//           "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
//         role: "TMember",
//         created_at: new Date(),
//         updated_at: new Date(),
//       });

//       // Get and store selected vehicle
//       const vehicleDoc = await getDoc(
//         doc(db, "Users", user!.uid, "Vehicles", formData.assignedVehicle)
//       );

//       if (vehicleDoc.exists()) {
//         const vehicleData = vehicleDoc.data();
//         await setDoc(
//           doc(
//             db,
//             "Users",
//             userCredential.user.uid,
//             "Vehicles",
//             formData.assignedVehicle
//           ),
//           {
//             companyName: vehicleData.companyName,
//             licensePlate: vehicleData.licensePlate,
//             vehicleNumber: vehicleData.vehicleNumber,
//             year: vehicleData.year,
//             vin: vehicleData.vin,
//             isSet: vehicleData.isSet,
//             assigned_at: new Date(),
//             createdAt: new Date(),
//           }
//         );
//       }
//       // Send verification email
//       await sendEmailVerification(userCredential.user);
//       toast.success(`Verification email sent to ${formData.memberEmail}`);

//       // Redirect or show success message
//       toast.success("Team member created successfully");
//       // Reset form data after successful creation
//       setFormData({
//         memberName: "",
//         memberEmail: "",
//         memberPhoneNumber: "",
//         assignedVehicle: "",
//         memberPassword: "",
//         role: "",
//       });
//       await auth.signOut();
//       //go to login page
//       router.push("/login");
//     } catch (error) {
//       console.error(error);
//       toast.error("Failed to create team member error: " + error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchUserVehicleList = async () => {
//     setIsLoading(true);

//     if (user) {
//       try {
//         const userVehicleref = collection(db, "Users", user.uid, "Vehicles");
//         const querySnapshot = await getDocs(userVehicleref);
//         const vehicleList = querySnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setAssignVehicleList(vehicleList as Vehicle[]);
//       } catch (error) {
//         console.log(error);
//         toast.error("Failed to fetch vehicle list");
//       } finally {
//         setIsLoading(false);
//       }
//     } else {
//       toast.error("Please log in to access the manage team page.");
//     }
//   };

//   useEffect(() => {
//     fetchUserVehicleList();
//   }, [user]);

//   if (isLoading) {
//     return (
//       <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
//         <HashLoader color="#F96176" />
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="min-h-screen bg-gray-50 p-4">
//         <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
//           <h1 className="text-2xl font-bold text-gray-800 mb-6">
//             Create Team Member
//           </h1>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <label
//                 htmlFor="memberName"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Enter member Name
//               </label>
//               <input
//                 type="text"
//                 id="memberName"
//                 name="memberName"
//                 value={formData.memberName}
//                 onChange={handleInputChange}
//                 className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-150 ease-in-out sm:text-sm"
//                 placeholder="Enter full name"
//                 required
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="memberEmail"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Enter member Email
//               </label>
//               <input
//                 type="email"
//                 id="memberEmail"
//                 name="memberEmail"
//                 value={formData.memberEmail}
//                 onChange={handleInputChange}
//                 className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-150 ease-in-out sm:text-sm"
//                 placeholder="Enter email address"
//                 required
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="memberPhoneNumber"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Enter member Phone Number
//               </label>
//               <input
//                 type="tel"
//                 id="memberPhoneNumber"
//                 name="memberPhoneNumber"
//                 value={formData.memberPhoneNumber}
//                 onChange={handleInputChange}
//                 className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-150 ease-in-out sm:text-sm"
//                 placeholder="Enter phone number"
//                 required
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="memberPassword"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Enter member Password
//               </label>
//               <input
//                 type="password"
//                 id="memberPassword"
//                 name="memberPassword"
//                 value={formData.memberPassword}
//                 onChange={handleInputChange}
//                 className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-150 ease-in-out sm:text-sm"
//                 placeholder="Enter password"
//                 required
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="assignedVehicle"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Assign Vehicle
//               </label>
//               <select
//                 id="assignedVehicle"
//                 name="assignedVehicle"
//                 value={formData.assignedVehicle}
//                 onChange={handleInputChange}
//                 className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-150 ease-in-out sm:text-sm"
//               >
//                 <option value="">Select a vehicle</option>
//                 {assignVehicleList.map((vehicle) => (
//                   <option key={vehicle.id} value={vehicle.id}>
//                     {vehicle.companyName} - {vehicle.vehicleNumber}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="flex justify-end space-x-4">
//               <Link href="/account/manage-team">
//                 <button
//                   type="button"
//                   className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F96176] transition duration-150 ease-in-out"
//                 >
//                   Cancel
//                 </button>
//               </Link>
//               <button
//                 type="submit"
//                 className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F96176] hover:bg-[#e54d62] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F96176] transition duration-150 ease-in-out"
//               >
//                 Create Member
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import HashLoader from "react-spinners/HashLoader";

interface Vehicle {
  id: string;
  companyName: string;
  vehicleNumber: string;
  licensePlate: string | null;
  vin: string | null;
  year: string;
  isSet: boolean;
}

interface CreateTeamMemberForm {
  memberName: string;
  memberEmail: string;
  memberEmail2: string;
  memberPhoneNumber: string;
  memberTelephone: string;
  memberPassword: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal: string;
  licenseNumber: string;
  socialSecurity: string;
  perMileCharge: string;
  role: string;
  payType: string;
  assignedVehicles: string[];
  recordAccess: string[];
  chequeAccess: string[];
  licExpiryDate: Date | null;
  dob: Date | null;
  lastDrugTest: Date | null;
  dateOfHire: Date | null;
  dateOfTermination: Date | null;
}

const roles = ["Manager", "Driver", "Vendor", "Accountant", "Other Staff"];
const payTypes = ["Per Mile", "Per Trip", "Per Hour", "Per Month"];
const recordAccessOptions = ["View", "Edit", "Add"];
const chequeAccessOptions = ["Cheque"];

export default function CreateTeamMemberPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const { user } = useAuth() || { user: null };
  const currentUserId = user?.uid;
  const router = useRouter();

  const [formData, setFormData] = useState<CreateTeamMemberForm>({
    memberName: "",
    memberEmail: "",
    memberEmail2: "",
    memberPhoneNumber: "",
    memberTelephone: "",
    memberPassword: "12345678",
    companyName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal: "",
    licenseNumber: "",
    socialSecurity: "",
    perMileCharge: "",
    role: "",
    payType: "",
    assignedVehicles: [],
    recordAccess: [],
    chequeAccess: [],
    licExpiryDate: null,
    dob: null,
    lastDrugTest: null,
    dateOfHire: null,
    dateOfTermination: null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  const handleVehicleSelection = (vehicleId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedVehicles: prev.assignedVehicles.includes(vehicleId)
        ? prev.assignedVehicles.filter((id) => id !== vehicleId)
        : [...prev.assignedVehicles, vehicleId],
    }));
  };

  const handleAccessChange = (
    type: "recordAccess" | "chequeAccess",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((item) => item !== value)
        : [...prev[type], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.memberName ||
      !formData.memberEmail ||
      !formData.memberPhoneNumber
    ) {
      toast.error("Required fields missing");
      return;
    }

    if (formData.role === "Driver" && formData.assignedVehicles.length === 0) {
      toast.error("Please assign at least one vehicle to the driver");
      return;
    }

    setIsLoading(true);

    try {
      const createTeamMember = httpsCallable(functions, "createTeamMember");

      await createTeamMember({
        name: formData.memberName,
        email: formData.memberEmail,
        email2: formData.memberEmail2,
        phone: formData.memberPhoneNumber,
        telephone: formData.memberTelephone,
        password: formData.memberPassword,
        companyName: formData.companyName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal: formData.postal,
        licenseNum: formData.licenseNumber,
        socialSecurity: formData.socialSecurity,
        currentUId: currentUserId,
        selectedRole: formData.role,
        selectedPayType: formData.payType,
        selectedVehicles: formData.assignedVehicles,
        perMileCharge: formData.perMileCharge,
        selectedRecordAccess: formData.recordAccess,
        selectedChequeAccess: formData.chequeAccess,
        licExpiryDate: formData.licExpiryDate?.toISOString(),
        recordAccess: formData.recordAccess,
        chequeAccess: formData.chequeAccess,
        dob: formData.dob,
        lastDrugTest: formData.lastDrugTest,
        dateOfHire: formData.dateOfHire,
        dateOfTermination: formData.dateOfTermination,
        profilePicture:
          "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Assign vehicles if any selected
      for (const vehicleId of formData.assignedVehicles) {
        const vehicleDoc = await getDoc(
          doc(db, "Users", user!.uid, "Vehicles", vehicleId)
        );

        if (vehicleDoc.exists()) {
          const vehicleData = vehicleDoc.data();
          await setDoc(doc(db, "Users", user!.uid, "Vehicles", vehicleId), {
            ...vehicleData,
            assigned_at: new Date(),
            createdAt: new Date(),
          });
        }
      }

      toast.success("Team member created successfully");
      router.push("/account/manage-team");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create team member: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async () => {
    setIsLoading(true);
    if (user) {
      try {
        const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
        const snapshot = await getDocs(vehiclesRef);
        const vehicleList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVehicles(vehicleList as Vehicle[]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch vehicles");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Create Team Member
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Basic Info Fields */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              name="memberName"
              value={formData.memberName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            <input
              type="email"
              placeholder="Email"
              name="memberEmail"
              value={formData.memberEmail}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            <input
              type="email"
              placeholder="Secondary Email"
              name="memberEmail2"
              value={formData.memberEmail2}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              name="memberPhoneNumber"
              value={formData.memberPhoneNumber}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            <input
              type="tel"
              placeholder="Telephone"
              name="memberTelephone"
              value={formData.memberTelephone}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            {formData.role === "Vendor" && (
              <input
                type="text"
                placeholder="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            )}

            <input
              type="text"
              placeholder="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />

              <input
                type="text"
                placeholder="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />

              <input
                type="text"
                placeholder="Postal Code"
                name="postal"
                value={formData.postal}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <input
              type="text"
              placeholder="License Number"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            <input
              type="text"
              placeholder="Social Security Number"
              name="socialSecurity"
              value={formData.socialSecurity}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            {/* Date Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  License Expiry Date
                </label>
                <input
                  type="date"
                  onChange={(e) =>
                    handleDateChange("licExpiryDate", e.target.valueAsDate)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  onChange={(e) =>
                    handleDateChange("dob", e.target.valueAsDate)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Drug Test
                </label>
                <input
                  type="date"
                  onChange={(e) =>
                    handleDateChange("lastDrugTest", e.target.valueAsDate)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Hire
                </label>
                <input
                  type="date"
                  onChange={(e) =>
                    handleDateChange("dateOfHire", e.target.valueAsDate)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Termination
              </label>
              <input
                type="date"
                onChange={(e) =>
                  handleDateChange("dateOfTermination", e.target.valueAsDate)
                }
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Pay Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pay Type
              </label>
              <select
                name="payType"
                value={formData.payType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              >
                <option value="">Select pay type</option>
                {payTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {formData.role === "Driver" && (
              <input
                type="number"
                placeholder="Per Mile Charge"
                name="perMileCharge"
                value={formData.perMileCharge}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            )}

            {/* Vehicle Assignment */}
            {formData.role === "Driver" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Vehicles
                </label>
                <div className="space-y-2 border rounded p-2">
                  {vehicles.map((vehicle) => (
                    <label
                      key={vehicle.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignedVehicles.includes(vehicle.id)}
                        onChange={() => handleVehicleSelection(vehicle.id)}
                      />
                      <span>
                        {vehicle.companyName} - {vehicle.vehicleNumber}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Access Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Record Access
              </label>
              <div className="space-y-2 border rounded p-2">
                {recordAccessOptions.map((access) => (
                  <label key={access} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.recordAccess.includes(access)}
                      onChange={() =>
                        handleAccessChange("recordAccess", access)
                      }
                    />
                    <span>{access}</span>
                  </label>
                ))}
              </div>
            </div>

            {(formData.role === "Manager" ||
              formData.role === "Accountant") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cheque Access
                </label>
                <div className="space-y-2 border rounded p-2">
                  {chequeAccessOptions.map((access) => (
                    <label key={access} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.chequeAccess.includes(access)}
                        onChange={() =>
                          handleAccessChange("chequeAccess", access)
                        }
                      />
                      <span>{access}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/account/manage-team">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F96176] hover:bg-[#e54d62]"
            >
              Create Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
