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
  doc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HashLoader } from "react-spinners";

export default function AddVehiclePage() {
  const [companyList, setCompanyList] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [engineNameList, setEngineNameList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth() || { user: null };
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("");
  const [selectedEngineName, setSelectedEngineName] = useState<string>("");
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [vin, setVin] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [currentReading, setCurrentReading] = useState<string>("");
  const [hoursReading, setHoursReading] = useState<string>("");
  const [oilChangeDate, setOilChangeDate] = useState<string>("");
  const [dot, setDot] = useState<string>("");
  const [iccms, setIccms] = useState<string>("");

  const router = useRouter();

  const fetchVehicleTypes = async () => {
    try {
      const vehicleTypeDoc = await getDoc(doc(db, "metadata", "vehicleType"));
      if (vehicleTypeDoc.exists()) {
        setVehicleTypes(vehicleTypeDoc.data()?.type || []);
      }
    } catch (error) {
      toast.error("Error fetching vehicle types: " + error);
    }
  };

  const fetchCompanyList = async () => {
    if (!selectedVehicleType) return;

    try {
      const companyDoc = await getDoc(doc(db, "metadata", "companyNameL"));
      if (companyDoc.exists()) {
        interface Company {
          type: string;
          cName: string;
        }
        const companies = companyDoc.data()?.data || [];
        const filteredCompanies = companies
          .filter((company: Company) => company.type === selectedVehicleType)
          .map((company: Company) => company.cName.toString().toUpperCase());
        setCompanyList(filteredCompanies);
        setSelectedCompany("");
        setSelectedEngineName("");
      }
    } catch (error) {
      toast.error("Error fetching companies: " + error);
    }
  };

  const fetchEngineNames = async () => {
    if (!selectedVehicleType || !selectedCompany) {
      setEngineNameList([]);
      setSelectedEngineName("");
      return;
    }

    try {
      const engineDoc = await getDoc(doc(db, "metadata", "engineNameList"));
      if (engineDoc.exists()) {
        const engineData = engineDoc.data()?.data || [];
        interface Engine {
          type: string;
          cName: string;
          eName: string;
        }
        const filteredEngines = engineData
          .filter(
            (engine: Engine) =>
              engine.type === selectedVehicleType &&
              engine.cName.toUpperCase() === selectedCompany.toUpperCase()
          )
          .map((engine: Engine) => engine.eName.toString().toUpperCase());
        setEngineNameList(filteredEngines);
        if (!filteredEngines.includes(selectedEngineName)) {
          setSelectedEngineName("");
        }
      }
    } catch (error) {
      toast.error("Error fetching engine names: " + error);
    }
  };

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  useEffect(() => {
    fetchCompanyList();
  }, [selectedVehicleType]);

  useEffect(() => {
    fetchEngineNames();
  }, [selectedVehicleType, selectedCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error("Please login first");
        return;
      }

      if (
        !selectedCompany ||
        !vehicleNumber ||
        !selectedVehicleType ||
        !selectedEngineName ||
        !vin ||
        !licensePlate ||
        !year
      ) {
        toast.error("Please fill all required fields");
        return;
      }

      const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");

      // Set isSet to false for all existing vehicles
      const existingVehicles = await getDocs(
        query(vehiclesRef, where("isSet", "==", true))
      );

      const updatePromises = existingVehicles.docs.map((doc) =>
        updateDoc(doc.ref, { isSet: false })
      );
      await Promise.all(updatePromises);

      const vehicleData = {
        vehicleType: selectedVehicleType,
        companyName: selectedCompany.toUpperCase(),
        engineName: selectedEngineName.toUpperCase(),
        vehicleNumber,
        vin,
        dot: dot || null,
        iccms: iccms || null,
        licensePlate,
        year,
        isSet: true,
        createdAt: serverTimestamp(),
        currentReading: "",
        oilChangeDate: "",
        hoursReading: "",
      };

      if (selectedVehicleType === "Truck") {
        vehicleData.currentReading = currentReading;
        vehicleData.oilChangeDate = "";
        vehicleData.hoursReading = "";
      }

      if (selectedVehicleType === "Trailer") {
        vehicleData.currentReading = "";
        vehicleData.oilChangeDate = oilChangeDate;
        vehicleData.hoursReading = hoursReading;
      }

      await addDoc(vehiclesRef, vehicleData);

      toast.success("Vehicle added successfully!");
      router.push("/account/my-profile");

      // Reset form
      setSelectedCompany("");
      setSelectedVehicleType("");
      setSelectedEngineName("");
      setVehicleNumber("");
      setVin("");
      setLicensePlate("");
      setYear("");
      setCurrentReading("");
      setHoursReading("");
      setOilChangeDate("");
      setDot("");
      setIccms("");
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
          {/* Vehicle Type Selection */}
          <div>
            <label
              htmlFor="vehicleType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Vehicle Type *
            </label>
            <select
              id="vehicleType"
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
            >
              <option value="">Select vehicle type</option>
              {vehicleTypes.map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Company Selection */}
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Company Name *
            </label>
            <select
              id="company"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              disabled={!selectedVehicleType}
            >
              <option value="">Select a company</option>
              {companyList.map((company, index) => (
                <option key={index} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          {/* Engine Name Selection */}
          <div>
            <label
              htmlFor="engineName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Engine Name *
            </label>
            <select
              id="engineName"
              value={selectedEngineName}
              onChange={(e) => setSelectedEngineName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              disabled={!selectedCompany}
            >
              <option value="">Select engine name</option>
              {engineNameList.map((engine, index) => (
                <option key={index} value={engine}>
                  {engine}
                </option>
              ))}
            </select>
          </div>

          {selectedVehicleType === "Truck" && (
            <div>
              <label
                htmlFor="currentReading"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Current Reading *
              </label>
              <input
                type="number"
                id="currentReading"
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                placeholder="Enter current reading"
              />
            </div>
          )}

          {selectedVehicleType === "Trailer" && (
            <>
              <div>
                <label
                  htmlFor="oilChangeDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Oil Change Date *
                </label>
                <input
                  type="date"
                  id="oilChangeDate"
                  value={oilChangeDate}
                  onChange={(e) => setOilChangeDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="hoursReading"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Hours Reading *
                </label>
                <input
                  type="number"
                  id="hoursReading"
                  value={hoursReading}
                  onChange={(e) => setHoursReading(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                  placeholder="Enter hours reading"
                />
              </div>
            </>
          )}

          {/* Vehicle Number */}
          <div>
            <label
              htmlFor="vehicleNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Vehicle Number *
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
              VIN *
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

          {/* DOT */}
          <div>
            <label
              htmlFor="dot"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              DOT (Optional)
            </label>
            <input
              type="text"
              id="dot"
              value={dot}
              onChange={(e) => setDot(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              placeholder="Enter DOT"
            />
          </div>

          {/* ICCMS */}
          <div>
            <label
              htmlFor="iccms"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              ICCMS (Optional)
            </label>
            <input
              type="text"
              id="iccms"
              value={iccms}
              onChange={(e) => setIccms(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              placeholder="Enter ICCMS"
            />
          </div>

          {/* License Plate */}
          <div>
            <label
              htmlFor="licensePlate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              License Plate *
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
              Year *
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
              className="bg-[#F96176] text-white py-3 px-4 rounded-lg hover:bg-[#eb929e] transition duration-300"
            >
              Add Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// End of Selection
