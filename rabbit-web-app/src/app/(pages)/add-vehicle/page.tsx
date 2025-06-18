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
import { getFunctions, httpsCallable } from "firebase/functions";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  firstTimeVehicle: boolean;
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
  const [servicesData, setServicesData] = useState<Service[]>([]);

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
        const companies = companyDoc.data()?.data || [];
        const filteredCompanies = companies
          .filter(
            (company: { type: string; cName: string }) =>
              company.type === selectedVehicleType
          )
          .map((company: { cName: string }) =>
            company.cName.toString().toUpperCase()
          );
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
        const filteredEngines = engineData
          .filter(
            (engine: { type: string; cName: string }) =>
              engine.type === selectedVehicleType &&
              engine.cName.toUpperCase() === selectedCompany.toUpperCase()
          )
          .map((engine: { eName: string }) =>
            engine.eName.toString().toUpperCase()
          );
        setEngineNameList(filteredEngines);
        if (!filteredEngines.includes(selectedEngineName)) {
          setSelectedEngineName("");
        }
      }
    } catch (error) {
      toast.error("Error fetching engine names: " + error);
    }
  };

  const fetchServicesData = async () => {
    try {
      const servicesDoc = await getDoc(doc(db, "metadata", "serviceData"));
      if (servicesDoc.exists()) {
        const services = servicesDoc.data()?.data || [];
        // console.log("services: ", services);
        setServicesData(services);
      }
    } catch (error) {
      toast.error("Error fetching services data: " + error);
    }
  };

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

    // if (
    //   selectedVehicleType === "Trailer" &&
    //   (!oilChangeDate || !hoursReading)
    // ) {
    //   toast.error("Please enter oil change date and hours reading for Trailer");
    //   return false;
    // }

    return true;
  };

  const calculateNextNotificationMiles = (): Service[] => {
    const nextNotificationMiles: Service[] = [];
    const currentMiles = parseInt(currentReading) || 0;

    for (const service of servicesData) {
      if (service.vType === selectedVehicleType) {
        const serName = service.sName;
        const serId = service.sId || "";
        // const serviceId = service.sId || ""; // Renamed from serId
        const serviceName = service.sName; // Renamed from serName
        const subServices = service.subServices || [];
        const defaultValues = service.dValues || [];
        let foundMatch = false;

        for (const defaultValue of defaultValues) {
          if (
            defaultValue.brand.toString().toLowerCase() ===
            selectedEngineName.toLowerCase()
          ) {
            foundMatch = true;

            const type = defaultValue.type.toString().toLowerCase();
            const value = parseInt(defaultValue.value.toString()) || 0;
            let notificationValue = value;

            if (type === "reading") {
              notificationValue = value * 1000;
            } // day/hour remain as-is

            nextNotificationMiles.push({
              sId: "",
              sName: "",
              serviceId: serId,
              serviceName: serName,
              defaultNotificationValue: notificationValue,
              nextNotificationValue:
                type == "reading"
                  ? currentMiles + notificationValue
                  : notificationValue,
              type: type,
              vType: service.vType,
              dValues: service.dValues,
              subServices: subServices.map((s: { sName: string }) => ({
                sName: s.sName,
              })), // Array of strings
            });
          }
        }

        if (!foundMatch) {
          console.log(`No brand match found for service: ${serviceName}`);
        }
      }
    }

    return nextNotificationMiles;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error("Please login first");
        return;
      }

      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");

      const existingVehicles = await getDocs(
        query(
          vehiclesRef,
          where("vehicleNumber", "==", vehicleNumber),
          where("vehicleType", "==", selectedVehicleType),
          where("companyName", "==", selectedCompany.toUpperCase()),
          where("engineName", "==", selectedEngineName.toUpperCase())
        )
      );

      if (!existingVehicles.empty) {
        toast.error("Vehicle already added");
        return;
      }

      const updatePromises = (await getDocs(vehiclesRef)).docs.map((doc) =>
        updateDoc(doc.ref, { isSet: false })
      );
      await Promise.all(updatePromises);

      const nextNotificationMiles = calculateNextNotificationMiles();

      const vehicleData: VehicleData = {
        active: true,
        firstTimeVehicle: true,
        tripAssign: false,
        vehicleType: selectedVehicleType,
        companyName: selectedCompany.toUpperCase(),
        engineName: selectedEngineName.toUpperCase(),
        vehicleNumber,
        vin,
        dot: dot || "",
        iccms: iccms || "",
        licensePlate,
        year,
        isSet: true,
        uploadedDocuments: [],
        createdAt: serverTimestamp(),
        hoursReadingArray: [
          {
            hours: hoursReading ? parseInt(hoursReading) : 0,
            date: new Date().toISOString(),
          },
        ],
        currentMilesArray: [
          {
            miles: currentReading ? parseInt(currentReading) : 0,
            date: new Date().toISOString(),
          },
        ],
        nextNotificationMiles,
        services:
          nextNotificationMiles?.map((service) => ({
            defaultNotificationValue: service.defaultNotificationValue || 0,
            nextNotificationValue: service.nextNotificationValue || 0,
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            subServices: service.subServices || [],
            // vType: service.vType || "",
            type: service.type || "",
            // dValues: service.dValues || [],
          })) || [],

        lastServiceMiles: currentReading ? parseInt(currentReading) : 0,
        lastServiceHours: hoursReading ? parseInt(hoursReading) : 0,
      };

      if (selectedVehicleType === "Truck") {
        vehicleData.hoursReadingArray = [];
        vehicleData.currentMiles = currentReading || "";
        vehicleData.prevMilesValue = currentReading || "";
        vehicleData.firstTimeMiles = currentReading || "";
        vehicleData.oilChangeDate = "";
        vehicleData.hoursReading = "";
        vehicleData.prevHoursReadingValue = "";
      }

      if (selectedVehicleType === "Trailer") {
        vehicleData.currentMiles = "";
        vehicleData.prevMilesValue = "";
        vehicleData.firstTimeMiles = "";
        vehicleData.oilChangeDate =
          selectedEngineName == "DRY VAN"
            ? "2025-06-20"
            : oilChangeDate || null;
        vehicleData.hoursReading =
          selectedEngineName == "DRY VAN" ? "1000" : hoursReading || "";
        vehicleData.prevHoursReadingValue = hoursReading || "";
      }

      const vehicleDocRef = await addDoc(vehiclesRef, vehicleData);
      await updateDoc(vehicleDocRef, { vehicleId: vehicleDocRef.id });

      // ✅ Call the Firebase Cloud Function
      const functions = getFunctions();
      const checkAndNotifyUser = httpsCallable(
        functions,
        "checkAndNotifyUserForVehicleService"
      );

      await checkAndNotifyUser({
        userId: user.uid, // Pass userId
        vehicleId: vehicleDocRef.id, // Pass the vehicleId
      });

      toast.success("Vehicle added successfully!");
      router.push("/account/my-profile");
      console.log(
        "My Current Miles is : ",
        currentReading,
        "And my User id is : ",
        user.uid,
        "and my vehicle id is : ",
        vehicleDocRef.id
      );
    } catch (error) {
      toast.error("Error adding vehicle: " + error);
      console.log("Error adding vehicle: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleTypes();
    fetchServicesData();
  }, []);

  useEffect(() => {
    fetchCompanyList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleType]);

  useEffect(() => {
    fetchEngineNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, selectedVehicleType]);

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
                Current Miles *
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
              {selectedCompany === "DRY VAN" ? (
                ""
              ) : (
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
                      onChange={(e) =>
                        setHoursReading(e.target.value.toUpperCase())
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                      placeholder="Enter hours reading"
                    />
                  </div>
                </>
              )}
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
