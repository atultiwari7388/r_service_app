"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HashLoader } from "react-spinners";

export default function AddVehiclePage() {
  const [companyList, setCompanyList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth() || { user: null };
  const [selectedCompany, setSelectedCompany] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [year, setYear] = useState("");

  const fetchCompanyList = async () => {
    setLoading(true);
    try {
      const companyNameRef = collection(db, "metadata");
      const companyNameDoc = await getDocs(companyNameRef);
      const companyNameData = companyNameDoc.docs.find(
        (doc) => doc.id === "companyName"
      );

      if (companyNameData) {
        const companies = companyNameData.data()?.data || [];
        if (Array.isArray(companies)) {
          setCompanyList(companies);
          console.log("Company List:", companies);
        } else {
          console.log("Companies field is not an array");
        }
      } else {
        console.log("Company name document not found");
      }
    } catch (error) {
      toast.error("Error fetching company list: " + error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyList();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error("Please login first");
        return;
      }

      if (!selectedCompany || !vehicleNumber) {
        toast.error("Company and Vehicle Number are required");
        return;
      }

      const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");

      // Step 1: Set isSet to false for all existing vehicles
      const existingVehicles = await getDocs(
        query(vehiclesRef, where("isSet", "==", true))
      );

      const updatePromises = existingVehicles.docs.map((doc) =>
        updateDoc(doc.ref, { isSet: false })
      );
      await Promise.all(updatePromises);

      // Step 2: Add new vehicle with isSet true
      await addDoc(vehiclesRef, {
        companyName: selectedCompany,
        vehicleNumber: vehicleNumber,
        vin: vin || null,
        licensePlate: licensePlate || null,
        year: year || null,
        isSet: true,
        createdAt: serverTimestamp(),
      });

      // toast.success("Vehicle added successfully!");
      // console.log("Vehicle added successfully!", vehiclesRef);
      // console.log("User ID:", user.uid);

      // Reset form
      setSelectedCompany("");
      setVehicleNumber("");
      setVin("");
      setLicensePlate("");
      setYear("");
    } catch (error) {
      toast.error("Error adding vehicle: " + error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to access the add vehicle page.</div>;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold text-center mb-8">
        Add New Vehicle
      </h1>

      <div className="max-w-2xl mx-auto">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Company Selection */}
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Company
            </label>
            <select
              id="company"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
            >
              <option value="">Select a company</option>
              {companyList.map((company, index) => (
                <option value={company} key={index}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Number */}
          <div>
            <label
              htmlFor="vehicleNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Vehicle Number
            </label>
            <input
              type="text"
              id="vehicleNumber"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              placeholder="Enter vehicle number"
            />
          </div>

          {/* VIN */}
          <div>
            <label
              htmlFor="vin"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              VIN (Optional)
            </label>
            <input
              type="text"
              id="vin"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              placeholder="Enter VIN"
            />
          </div>

          {/* License Plate */}
          <div>
            <label
              htmlFor="licensePlate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              License Plate (Optional)
            </label>
            <input
              type="text"
              id="licensePlate"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              placeholder="Enter license plate number"
            />
          </div>

          {/* Year */}
          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Year
            </label>
            <input
              type="date"
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
            />
          </div>

          <div className="flex justify-between">
            <Link
              href={`/`}
              className="border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-300"
            >
              Back to Home
            </Link>

            <button
              type="submit"
              className="bg-[#F96176] text-white py-3  px-4 rounded-lg hover:bg-[#eb929e] transition duration-300"
            >
              Add Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
