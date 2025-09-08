"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
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
const payTypes = ["Per Mile", "Per Trip", "Per Hour", "Monthly"];
const recordAccessOptions = ["View", "Edit", "Add"];
const chequeAccessOptions = ["Cheque"];

export default function CreateTeamMemberPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const { user } = useAuth() || { user: null };
  const currentUserId = user?.uid;
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<CreateTeamMemberForm>({
    memberName: "",
    memberEmail: "",
    memberEmail2: "",
    memberPhoneNumber: "",
    memberTelephone: "",
    // memberPassword: "12345678",
    memberPassword: "",
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
      // Check if email exists in Users collection
      const usersQuery = query(
        collection(db, "Users"),
        where("email", "==", formData.memberEmail)
      );
      const usersSnapshot = await getDocs(usersQuery);

      // Check if email exists in Mechanics collection
      const mechanicsQuery = query(
        collection(db, "Mechanics"),
        where("email", "==", formData.memberEmail)
      );
      const mechanicsSnapshot = await getDocs(mechanicsQuery);

      // If email exists in either collection, show error
      if (!usersSnapshot.empty || !mechanicsSnapshot.empty) {
        toast.error("This email is already registered with another account");
        setIsLoading(false);
        return;
      }

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

        // ✅ Fetch only active vehicles
        const q = query(vehiclesRef, where("active", "==", true));

        const snapshot = await getDocs(q);

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
              placeholder="Name*"
              name="memberName"
              value={formData.memberName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />

            <input
              type="email"
              placeholder="Email*"
              name="memberEmail"
              value={formData.memberEmail}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
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
              placeholder="Phone Number*"
              name="memberPhoneNumber"
              value={formData.memberPhoneNumber}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />

            <input
              type="tel"
              placeholder="Telephone"
              name="memberTelephone"
              value={formData.memberTelephone}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            {/* Vendor Specific Fields */}
            {formData.role === "Vendor" && (
              <>
                <input
                  type="text"
                  placeholder="Company Name"
                  name="companyName*"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />

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
                    placeholder="City*"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />

                  <input
                    type="text"
                    placeholder="State*"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Country*"
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
              </>
            )}

            {/* Fields for non-Vendor roles */}
            {formData.role !== "Vendor" && (
              <>
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
                    placeholder="City*"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />

                  <input
                    type="text"
                    placeholder="State*"
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
                      handleDateChange(
                        "dateOfTermination",
                        e.target.valueAsDate
                      )
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

                {/* Driver Specific Fields */}
                {formData.role === "Driver" &&
                  formData.payType === "Per Mile" && (
                    <input
                      type="number"
                      placeholder="Pay Per Mile"
                      name="perMileCharge"
                      value={formData.perMileCharge}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  )}

                {/* Vehicle Assignment */}
                {/* Vehicle Assignment */}
                {(formData.role === "Driver" ||
                  formData.role === "Manager" ||
                  formData.role === "Accountant" ||
                  formData.role === "Other Staff") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Vehicles
                    </label>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">
                        {formData.assignedVehicles.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            formData.assignedVehicles.length === vehicles.length
                          ) {
                            setFormData((prev) => ({
                              ...prev,
                              assignedVehicles: [],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              assignedVehicles: vehicles.map(
                                (vehicle) => vehicle.id
                              ),
                            }));
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {formData.assignedVehicles.length === vehicles.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                    <div className="space-y-2 border rounded p-2 max-h-60 overflow-y-auto">
                      {/* Sort vehicles alphabetically by vehicleNumber before mapping */}
                      {[...vehicles]
                        .sort((a, b) =>
                          a.vehicleNumber.localeCompare(b.vehicleNumber)
                        )
                        .map((vehicle) => (
                          <label
                            key={vehicle.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={formData.assignedVehicles.includes(
                                vehicle.id
                              )}
                              onChange={() =>
                                handleVehicleSelection(vehicle.id)
                              }
                            />
                            <span>
                              {vehicle.vehicleNumber} - {vehicle.companyName}
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
                      <label
                        key={access}
                        className="flex items-center space-x-2"
                      >
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

                {/* Cheque Access */}
                {(formData.role === "Manager" ||
                  formData.role === "Accountant") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cheque Access
                    </label>
                    <div className="space-y-2 border rounded p-2">
                      {chequeAccessOptions.map((access) => (
                        <label
                          key={access}
                          className="flex items-center space-x-2"
                        >
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
              </>
            )}

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password*"
                name="memberPassword"
                value={formData.memberPassword}
                onChange={handleInputChange}
                className="w-full p-2 border rounded pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                )}
              </button>
            </div>
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
