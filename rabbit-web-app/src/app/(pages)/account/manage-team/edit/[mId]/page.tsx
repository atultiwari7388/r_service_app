"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContexts";
import toast from "react-hot-toast";
import HashLoader from "react-spinners/HashLoader";
import Link from "next/link";

interface Vehicle {
  // id: string;
  vehicleId: string;
  companyName: string;
  vehicleNumber: string;
  licensePlate: string | null;
  vin: string | null;
  year: string;
  isSet: boolean;
}

interface TeamMember {
  id: string;
  userName: string;
  email: string;
  email2: string;
  phoneNumber: string;
  telephone: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  licenseNumber: string;
  socialSecurityNumber: string;
  perMileCharge: string;
  role: string;
  payType: string;
  isView: boolean;
  isEdit: boolean;
  isAdd: boolean;
  isCheque: boolean;
  licenseExpiryDate: Date | Timestamp | null;
  dateOfBirth: Date | Timestamp | null;
  lastDrugTestDate: Date | Timestamp | null;
  dateOfHire: Date | Timestamp | null;
  dateOfTermination: Date | Timestamp | null;
}

const roles = ["Manager", "Driver", "Vendor", "Accountant", "Other Staff"];
const payTypes = ["Per Mile", "Per Trip", "Per Hour", "Monthly"];
const recordAccessOptions = ["View", "Edit", "Add"];
const chequeAccessOptions = ["Cheque"];

export default function EditTeamMemberPage() {
  const params = useParams();
  const memberId = params?.mId as string;
  const router = useRouter();
  const { user } = useAuth() || { user: null };
  const currentUserId = user?.uid;

  const [isLoading, setIsLoading] = useState(true);
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [memberVehicles, setMemberVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    userName: "",
    email: "",
    email2: "",
    phoneNumber: "",
    telephone: "",
    companyName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    licenseNumber: "",
    socialSecurityNumber: "",
    perMileCharge: "",
    role: "",
    payType: "",
    isView: false,
    isEdit: false,
    isAdd: false,
    isCheque: false,
    licenseExpiryDate: null,
    dateOfBirth: null,
    lastDrugTestDate: null,
    dateOfHire: null,
    dateOfTermination: null,
  });

  const [selectedRecordAccess, setSelectedRecordAccess] = useState<string[]>(
    []
  );
  const [selectedChequeAccess, setSelectedChequeAccess] = useState<string[]>(
    []
  );
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

  useEffect(() => {
    if (memberId && currentUserId) {
      fetchMemberData();
      fetchMemberVehicles();
      fetchVehicles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, currentUserId]);

  const fetchMemberData = async () => {
    try {
      setIsLoading(true);
      const memberDoc = await getDoc(doc(db, "Users", memberId));

      if (memberDoc.exists()) {
        const data = memberDoc.data() as TeamMember;
        setFormData(data);

        // Convert boolean access fields to array
        const recordAccess = [];
        if (data.isView) recordAccess.push("View");
        if (data.isEdit) recordAccess.push("Edit");
        if (data.isAdd) recordAccess.push("Add");
        setSelectedRecordAccess(recordAccess);

        const chequeAccess = [];
        if (data.isCheque) chequeAccess.push("Cheque");
        setSelectedChequeAccess(chequeAccess);
      } else {
        toast.error("Member not found");
        router.push("/account/manage-team");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch member data");
    } finally {
      setIsLoading(false);
    }
  };
  const fetchMemberVehicles = async () => {
    try {
      setIsVehiclesLoading(true);
      const vehiclesRef = collection(db, "Users", memberId, "Vehicles");
      const snapshot = await getDocs(vehiclesRef);
      const vehicleList = snapshot.docs.map((doc) => ({
        vehicleId: doc.id,
        ...doc.data(),
      })) as Vehicle[];
      setMemberVehicles(vehicleList);
      setSelectedVehicles(vehicleList.map((v) => v.vehicleId));
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch member vehicles");
    } finally {
      setIsVehiclesLoading(false);
    }
  };

  const fetchVehicles = async () => {
    if (user) {
      try {
        setIsVehiclesLoading(true);
        const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
        const snapshot = await getDocs(vehiclesRef);
        const vehicleList = snapshot.docs.map((doc) => ({
          vehicleId: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched vehicles:", vehicleList);
        setVehicles(vehicleList as Vehicle[]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch vehicles");
      } finally {
        setIsVehiclesLoading(false);
      }
    }
  };

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
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleAccessChange = (
    type: "recordAccess" | "chequeAccess",
    value: string
  ) => {
    if (type === "recordAccess") {
      setSelectedRecordAccess((prev) =>
        prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value]
      );
    } else {
      setSelectedChequeAccess((prev) =>
        prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value]
      );
    }
  };

  const formatDateForInput = (
    date: Date | Timestamp | null | undefined
  ): string => {
    if (!date) return "";
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (date && "toDate" in date && typeof date.toDate === "function") {
      d = date.toDate();
    } else {
      return "";
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const updateMember = async () => {
    if (
      !formData.userName ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.role
    ) {
      toast.error("Required fields missing");
      return;
    }

    if (formData.role === "Driver" && selectedVehicles.length === 0) {
      toast.error("Please assign at least one vehicle to the driver");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare update data
      const updateData: Partial<TeamMember> = {
        userName: formData.userName,
        email: formData.email,
        email2: formData.email2 || "",
        phoneNumber: formData.phoneNumber,
        telephone: formData.telephone || "",
        companyName: formData.companyName || "",
        address: formData.address || "",
        city: formData.city || "",
        state: formData.state || "",
        country: formData.country || "",
        postalCode: formData.postalCode || "",
        licenseNumber: formData.licenseNumber || "",
        socialSecurityNumber: formData.socialSecurityNumber || "",
        perMileCharge: formData.perMileCharge || "0",
        role: formData.role,
        payType: formData.payType || "",
        // assignedVehicles: selectedVehicles,
        isView: selectedRecordAccess.includes("View"),
        isEdit: selectedRecordAccess.includes("Edit"),
        isAdd: selectedRecordAccess.includes("Add"),
        isCheque: selectedChequeAccess.includes("Cheque"),
        licenseExpiryDate: formData.licenseExpiryDate || null,
        dateOfBirth: formData.dateOfBirth || null,
        lastDrugTestDate: formData.lastDrugTestDate || null,
        dateOfHire: formData.dateOfHire || null,
        dateOfTermination: formData.dateOfTermination || null,
      };

      // Update Firestore document
      await updateDoc(doc(db, "Users", memberId), updateData);

      // Update vehicle assignments
      await updateVehicleAssignments();

      toast.success("Team member updated successfully");
      router.push("/account/manage-team");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update team member: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateVehicleAssignments = async () => {
    if (!user) return;

    // Get current vehicle IDs from member's vehicles collection
    const currentVehicleIds = memberVehicles.map((v) => v.vehicleId);
    const toRemove = currentVehicleIds.filter(
      (id) => !selectedVehicles.includes(id)
    );
    const toAdd = selectedVehicles.filter(
      (id) => !currentVehicleIds.includes(id)
    );

    // Remove unselected vehicles
    const batch = writeBatch(db);
    for (const vehicleId of toRemove) {
      await deleteVehicleDataServices(vehicleId);
      const vehicleRef = doc(db, "Users", memberId, "Vehicles", vehicleId);
      batch.delete(vehicleRef);
    }
    await batch.commit();

    // Add new vehicles
    for (const vehicleId of toAdd) {
      // Copy the Vehicle document from owner to member
      const vehicleDoc = await getDoc(
        doc(db, "Users", user.uid, "Vehicles", vehicleId)
      );

      if (vehicleDoc.exists()) {
        const vehicleData = vehicleDoc.data();
        await setDoc(doc(db, "Users", memberId, "Vehicles", vehicleId), {
          ...vehicleData,
          assigned_at: new Date(),
        });
      }

      // Copy related DataServices
      const dataServicesQuery = query(
        collection(db, "Users", user.uid, "DataServices"),
        where("vehicleId", "==", vehicleId)
      );

      const dataServicesSnapshot = await getDocs(dataServicesQuery);
      const newBatch = writeBatch(db);

      dataServicesSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const newDocRef = doc(
          db,
          "Users",
          memberId,
          "DataServices",
          docSnapshot.id
        );
        newBatch.set(newDocRef, data);
      });

      if (dataServicesSnapshot.size > 0) {
        await newBatch.commit();
      }
    }
  };

  const deleteVehicleDataServices = async (vehicleId: string) => {
    try {
      // Get all DataServices documents for this vehicle
      const dataServicesQuery = query(
        collection(db, "Users", memberId, "DataServices"),
        where("vehicleId", "==", vehicleId)
      );

      const dataServicesSnapshot = await getDocs(dataServicesQuery);

      // Delete all matching documents in a batch
      const batch = writeBatch(db);
      dataServicesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(
        `Deleted ${dataServicesSnapshot.size} DataServices documents for vehicle ${vehicleId}`
      );
    } catch (error) {
      console.error(
        `Error deleting DataServices for vehicle ${vehicleId}:`,
        error
      );
      throw new Error("Failed to clean up vehicle data");
    }
  };

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
          Edit Team Member
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMember();
          }}
          className="space-y-6"
        >
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
              name="userName"
              value={formData.userName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />

            <input
              type="email"
              placeholder="Email*"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />

            <input
              type="email"
              placeholder="Secondary Email"
              name="email2"
              value={formData.email2 || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            <input
              type="tel"
              placeholder="Phone Number*"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />

            <input
              type="tel"
              placeholder="Telephone"
              name="telephone"
              value={formData.telephone || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />

            {/* Vendor Specific Fields */}
            {formData.role === "Vendor" && (
              <>
                <input
                  type="text"
                  placeholder="Company Name"
                  name="companyName"
                  value={formData.companyName || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />

                <input
                  type="text"
                  placeholder="Address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City*"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />

                  <input
                    type="text"
                    placeholder="State*"
                    name="state"
                    value={formData.state || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Country*"
                    name="country"
                    value={formData.country || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />

                  <input
                    type="text"
                    placeholder="Postal Code"
                    name="postalCode"
                    value={formData.postalCode || ""}
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
                  value={formData.licenseNumber || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />

                <input
                  type="text"
                  placeholder="Social Security Number"
                  name="socialSecurityNumber"
                  value={formData.socialSecurityNumber || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />

                <input
                  type="text"
                  placeholder="Address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City*"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />

                  <input
                    type="text"
                    placeholder="State*"
                    name="state"
                    value={formData.state || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Country"
                    name="country"
                    value={formData.country || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />

                  <input
                    type="text"
                    placeholder="Postal Code"
                    name="postalCode"
                    value={formData.postalCode || ""}
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
                      value={formatDateForInput(formData.licenseExpiryDate)}
                      onChange={(e) =>
                        handleDateChange(
                          "licenseExpiryDate",
                          e.target.valueAsDate
                        )
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
                      value={formatDateForInput(formData.dateOfBirth)}
                      onChange={(e) =>
                        handleDateChange("dateOfBirth", e.target.valueAsDate)
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
                      value={formatDateForInput(formData.lastDrugTestDate)}
                      onChange={(e) =>
                        handleDateChange(
                          "lastDrugTestDate",
                          e.target.valueAsDate
                        )
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
                      value={formatDateForInput(formData.dateOfHire)}
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
                    value={formatDateForInput(formData.dateOfTermination)}
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
                    value={formData.payType || ""}
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
                      value={formData.perMileCharge || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  )}

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
                        {selectedVehicles.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedVehicles.length === vehicles.length) {
                            setSelectedVehicles([]);
                          } else {
                            setSelectedVehicles(
                              vehicles.map((vehicle) => vehicle.vehicleId)
                            );
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {selectedVehicles.length === vehicles.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                    {isVehiclesLoading ? (
                      <div className="flex justify-center py-4">
                        <HashLoader size={20} color="#F96176" />
                      </div>
                    ) : (
                      <div className="space-y-2 border rounded p-2 max-h-60 overflow-y-auto">
                        {vehicles
                          .sort((a, b) =>
                            a.vehicleNumber.localeCompare(b.vehicleNumber)
                          )
                          .map((vehicle) => (
                            <label
                              key={vehicle.vehicleId}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="checkbox"
                                checked={selectedVehicles.includes(
                                  vehicle.vehicleId
                                )}
                                onChange={() =>
                                  handleVehicleSelection(vehicle.vehicleId)
                                }
                              />
                              <span>
                                {vehicle.vehicleNumber}- {vehicle.companyName}
                              </span>
                            </label>
                          ))}
                      </div>
                    )}
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
                          checked={selectedRecordAccess.includes(access)}
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
                            checked={selectedChequeAccess.includes(access)}
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
              Update Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
