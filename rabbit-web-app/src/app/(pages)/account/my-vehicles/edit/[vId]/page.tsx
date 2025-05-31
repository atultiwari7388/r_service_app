"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { updateDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HashLoader } from "react-spinners";

interface DValue {
  brand: string;
  type: string;
  value: string;
}

interface Service {
  sId: string;
  sName: string;
  serviceId: string;
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number;
  subServices: { sName: string }[];
  vType: string;
  dValues: DValue[];
  type?: string;
}

interface ServicesDB {
  serviceId: string;
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number;
  subServices: { sName: string }[];
  type?: string;
}

interface VehicleData {
  active: boolean;
  tripAssign: boolean;
  vehicleType: string;
  companyName: string;
  engineName: string;
  vehicleNumber: string;
  vin: string;
  dot: string | null;
  iccms: string | null;
  licensePlate: string;
  year: string;
  isSet: boolean;
  uploadedDocuments: [];
  createdAt: unknown;
  updatedAt: unknown;
  currentMilesArray: { miles: number; date: string }[];
  hoursReadingArray: { hours: number; date: string }[];
  nextNotificationMiles: Service[];
  services: ServicesDB[];
  currentMiles?: string;
  prevMilesValue?: string;
  firstTimeMiles?: string;
  oilChangeDate?: string | null;
  hoursReading?: string;
  prevHoursReadingValue?: string;
  lastServiceDate?: string;
  lastServiceMiles?: number;
  lastServiceHours?: number;
}

export default function EditVehicleScreen() {
  const params = useParams();
  const vehicleId = params?.vId as string;

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
  const [servicesData, setServicesData] = useState<Service[]>([]);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!user || !vehicleId) return;

      try {
        setLoading(true);
        // Ensure consistent case in path
        const vehicleRef = doc(db, `Users/${user.uid}/Vehicles`, vehicleId);
        const vehicleSnap = await getDoc(vehicleRef);

        if (vehicleSnap.exists()) {
          const vehicleData = vehicleSnap.data() as VehicleData;

          // First set the vehicle type
          setSelectedVehicleType(vehicleData.vehicleType || "");

          // Then set other fields after a small delay to ensure vehicle type is set
          setTimeout(() => {
            setSelectedCompany(vehicleData.companyName?.toUpperCase() || "");
            setSelectedEngineName(vehicleData.engineName?.toUpperCase() || "");
            setVehicleNumber(vehicleData.vehicleNumber || "");
            setVin(vehicleData.vin || "");
            setLicensePlate(vehicleData.licensePlate || "");
            setYear(vehicleData.year || "");
            setDot(vehicleData.dot || "");
            setIccms(vehicleData.iccms || "");

            if (vehicleData.vehicleType === "Truck") {
              const latestMiles =
                vehicleData.currentMilesArray?.slice(-1)[0]?.miles;
              setCurrentReading(latestMiles?.toString() || "");
            }

            if (vehicleData.vehicleType === "Trailer") {
              const latestHours =
                vehicleData.hoursReadingArray?.slice(-1)[0]?.hours;
              setHoursReading(latestHours?.toString() || "");
              setOilChangeDate(vehicleData.oilChangeDate || "");
            }
          }, 100);
        } else {
          toast.error("Vehicle not found");
        }
      } catch (error) {
        toast.error("Error fetching vehicle data: " + error);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchVehicleData();
  }, [user, vehicleId, servicesData]);

  // Update the fetchCompanyList useEffect
  useEffect(() => {
    const fetchCompanyList = async () => {
      if (!selectedVehicleType) return;

      try {
        const companyDoc = await getDoc(doc(db, "metadata", "companyNameL"));
        if (companyDoc.exists()) {
          const companies = companyDoc.data()?.data || [];
          const filteredCompanies = companies
            .filter(
              (company: { type: string; cName: string }) =>
                company.type === selectedVehicleType
            )
            .map((company: { cName: string }) => company.cName.toUpperCase());

          setCompanyList(filteredCompanies);

          // For initial load, find and set the matching company
          if (initialLoad && selectedCompany) {
            const matchedCompany: string | undefined = filteredCompanies.find(
              (company: string): boolean =>
                company.toUpperCase() === selectedCompany.toUpperCase()
            );
            if (matchedCompany) {
              setSelectedCompany(matchedCompany);
            }
          }
        }
      } catch (error) {
        toast.error("Error fetching companies: " + error);
      }
    };

    fetchCompanyList();
  }, [selectedVehicleType, initialLoad, selectedCompany]);

  // Add this useEffect to debug the company selection
  useEffect(() => {
    console.log("Current company selection:", {
      selectedCompany,
      companyList,
      selectedVehicleType,
      initialLoad,
    });
  }, [selectedCompany, companyList]);

  // Fetch vehicle types and services data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch vehicle types
        const vehicleTypeDoc = await getDoc(doc(db, "metadata", "vehicleType"));
        if (vehicleTypeDoc.exists()) {
          setVehicleTypes(vehicleTypeDoc.data()?.type || []);
        }

        // Fetch services data
        const servicesDoc = await getDoc(doc(db, "metadata", "serviceData"));
        if (servicesDoc.exists()) {
          setServicesData(servicesDoc.data()?.data || []);
        }
      } catch (error) {
        toast.error("Error initializing data: " + error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchEngineNames = async () => {
      if (!selectedVehicleType || !selectedCompany) {
        setEngineNameList([]);
        if (!initialLoad) {
          setSelectedEngineName("");
        }
        return;
      }

      try {
        const engineDoc = await getDoc(doc(db, "metadata", "engineNameList"));
        if (engineDoc.exists()) {
          const engineData = engineDoc.data()?.data || [];
          const filteredEngines = engineData
            .filter(
              (engine: { type: string; cName: string }) =>
                engine.type === selectedVehicleType &&
                engine.cName.toUpperCase() === selectedCompany.toUpperCase() // Case-insensitive comparison
            )
            .map((engine: { eName: string }) => engine.eName.toUpperCase()); // Ensure uppercase

          setEngineNameList(filteredEngines);

          // Only reset if not initial load
          if (!initialLoad && !filteredEngines.includes(selectedEngineName)) {
            setSelectedEngineName("");
          } else {
            // During initial load, try to match the existing engine name
            const existingEngine: string | undefined = filteredEngines.find(
              (engine: string): boolean =>
                engine.toUpperCase() === selectedEngineName.toUpperCase()
            );
            if (existingEngine) {
              setSelectedEngineName(existingEngine);
              console.log("Existing engine name set:", existingEngine);
            }
          }
        }
      } catch (error) {
        toast.error("Error fetching engine names: " + error);
      }
    };

    fetchEngineNames();
  }, [selectedCompany, selectedVehicleType, initialLoad, selectedEngineName]);

  const validateForm = () => {
    if (
      !selectedVehicleType ||
      !selectedCompany ||
      !selectedEngineName ||
      !vehicleNumber ||
      !vin ||
      !licensePlate ||
      !year
    ) {
      toast.error("Please fill all required fields");
      return false;
    }

    if (selectedVehicleType === "Truck" && !currentReading) {
      toast.error("Please enter current reading for Truck");
      return false;
    }

    if (
      selectedVehicleType === "Trailer" &&
      (!oilChangeDate || !hoursReading)
    ) {
      toast.error("Please enter oil change date and hours reading for Trailer");
      return false;
    }

    return true;
  };

  const updateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user || !vehicleId) return;

    try {
      setLoading(true);

      const vehicleRef = doc(db, `Users/${user.uid}/Vehicles`, vehicleId);

      const updateData: {
        vehicleType: string;
        companyName: string;
        engineName: string;
        vehicleNumber: string;
        vin: string;
        licensePlate: string;
        year: string;
        dot?: string | null;
        iccms?: string | null;
        updatedAt: unknown;
        currentMiles?: string;
        currentMilesArray?: { miles: number; date: string }[];
        hoursReading?: string;
        oilChangeDate?: string;
        hoursReadingArray?: { hours: number; date: string }[];
      } = {
        vehicleType: selectedVehicleType,
        companyName: selectedCompany,
        engineName: selectedEngineName,
        vehicleNumber: vehicleNumber.toUpperCase(),
        vin: vin.toUpperCase(),
        licensePlate: licensePlate.toUpperCase(),
        year,
        dot: dot || null,
        iccms: iccms || null,
        updatedAt: serverTimestamp(),
      };

      if (selectedVehicleType === "Truck") {
        const miles = parseInt(currentReading);
        updateData.currentMiles = currentReading;
        updateData.currentMilesArray = [
          ...(updateData.currentMilesArray || []),
          { miles, date: new Date().toISOString() },
        ];
      }

      if (selectedVehicleType === "Trailer") {
        const hours = parseInt(hoursReading);
        updateData.hoursReading = hoursReading;
        updateData.oilChangeDate = oilChangeDate;
        updateData.hoursReadingArray = [
          ...(updateData.hoursReadingArray || []),
          { hours, date: new Date().toISOString() },
        ];
      }

      await updateDoc(vehicleRef, updateData);
      toast.success("Vehicle updated successfully!");
    } catch (error) {
      toast.error("Error updating vehicle: " + error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to access the edit vehicle page.</div>;
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
        Update Vehicle
      </h1>

      <div className="max-w-2xl mx-auto">
        <form className="space-y-6" onSubmit={updateVehicle}>
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
              disabled={loading}
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
              disabled={!selectedVehicleType || loading}
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
              disabled={!selectedCompany || loading}
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
                Current Miles *
              </label>
              <input
                type="number"
                id="currentReading"
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                placeholder="Enter current reading"
                disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              placeholder="Enter vehicle number"
              disabled={loading}
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
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              placeholder="Enter VIN"
              disabled={loading}
            />
          </div>

          {selectedVehicleType === "Truck" && (
            <div>
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
                  onChange={(e) => setDot(e.target.value.toUpperCase())}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                  placeholder="Enter DOT"
                  disabled={loading}
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
                  onChange={(e) => setIccms(e.target.value.toUpperCase())}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                  placeholder="Enter ICCMS"
                  disabled={loading}
                />
              </div>
            </div>
          )}

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
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              placeholder="Enter license plate number"
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="flex justify-between">
            <Link
              href={`/account/my-vehicles`}
              className="border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-300"
            >
              Back to Home
            </Link>

            <button
              type="submit"
              className="bg-[#F96176] text-white py-3 px-4 rounded-lg hover:bg-[#eb929e] transition duration-300"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
