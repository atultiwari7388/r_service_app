"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import {
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  UpdateData,
  DocumentData,
} from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  isNotification?: boolean;
}

interface ServicesDB {
  serviceId: string;
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number;
  subServices: { sName: string }[];
  type?: string;
  isNotification?: boolean;
}

interface VehicleData {
  active: boolean;
  tripAssign: boolean;
  vehicleType: string;
  companyName: string;
  engineName: string;
  vehicleNumber: string;
  vin: string;
  dot?: string | null;
  iccms?: string | null;
  licensePlate: string;
  year?: string | null;
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
  myCompany?: string;
  mycomId?: string;
}

interface MyCompanyItem {
  id: string;
  companyName: string;
}

export default function EditVehicleScreen() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params?.vId as string;

  const [companyList, setCompanyList] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [engineNameList, setEngineNameList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth() || { user: null };
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");

  const [myCompaniesList, setMyCompaniesList] = useState<MyCompanyItem[]>([]);
  const [selectedMyCompanyId, setSelectedMyCompanyId] = useState<string>("");
  const [selectedMyCompanyName, setSelectedMyCompanyName] = useState<string>("");

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
  const [originalVehicleData, setOriginalVehicleData] =
    useState<VehicleData | null>(null);

  const fetchMyCompanies = async (effId: string) => {
    try {
      const snap = await getDocs(
        collection(db, "Users", effId, "myCompanies")
      );
      const loaded: MyCompanyItem[] = [];
      snap.forEach((docSnap) => {
        const cData = docSnap.data();
        if (cData.companyName) {
          loaded.push({
            id: docSnap.id,
            companyName: cData.companyName.toString().trim(),
          });
        }
      });

      // Fallback to root user document companyName if none found
      const userDoc = await getDoc(doc(db, "Users", effId));
      if (userDoc.exists()) {
        const rootComp = (userDoc.data().companyName || "").toString().trim();
        if (
          rootComp &&
          !loaded.some(
            (c) => c.companyName.toLowerCase() === rootComp.toLowerCase()
          )
        ) {
          loaded.unshift({ id: "default", companyName: rootComp });
        }
      }

      // Sort A to Z
      loaded.sort((a, b) => a.companyName.localeCompare(b.companyName));
      setMyCompaniesList(loaded);
      return loaded;
    } catch (error) {
      console.error("Error fetching myCompanies:", error);
      return [];
    }
  };

  // 1. Determine effectiveUserId based on user role (SubOwner support)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          const effectiveId =
            uData?.role === "SubOwner" && uData?.createdBy
              ? uData.createdBy
              : user.uid;
          setEffectiveUserId(effectiveId);
          await fetchMyCompanies(effectiveId);
        } else {
          setEffectiveUserId(user.uid);
          await fetchMyCompanies(user.uid);
        }
      } catch (err) {
        console.error("Error fetching user doc:", err);
        setEffectiveUserId(user.uid);
      }
    };

    fetchUserData();
  }, [user]);

  // 2. Fetch metadata (vehicle types, services)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [vehicleTypeDoc, servicesDoc] = await Promise.all([
          getDoc(doc(db, "metadata", "vehicleType")),
          getDoc(doc(db, "metadata", "serviceData")),
        ]);

        if (vehicleTypeDoc.exists()) {
          setVehicleTypes(vehicleTypeDoc.data()?.type || []);
        }

        if (servicesDoc.exists()) {
          setServicesData(servicesDoc.data()?.data || []);
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };

    fetchMetadata();
  }, []);

  // 3. Fetch Vehicle Data once effectiveUserId is ready
  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!effectiveUserId || !vehicleId) return;

      try {
        setLoading(true);
        const vehicleRef = doc(
          db,
          `Users/${effectiveUserId}/Vehicles`,
          vehicleId
        );
        const vehicleSnap = await getDoc(vehicleRef);

        if (vehicleSnap.exists()) {
          const vData = vehicleSnap.data() as VehicleData;
          setOriginalVehicleData(vData);

          const vType = vData.vehicleType || "";
          const compName = (vData.companyName || "").toUpperCase();
          const engName = (vData.engineName || "").toUpperCase();

          setSelectedVehicleType(vType);
          setSelectedCompany(compName);
          setSelectedEngineName(engName);
          setVehicleNumber(vData.vehicleNumber || "");
          setVin(vData.vin || "");
          setLicensePlate(vData.licensePlate || "");
          setYear(vData.year || "");
          setDot(vData.dot || "");
          setIccms(vData.iccms || "");

          if (vType === "Truck") {
            const latestMiles =
              vData.currentMiles ||
              vData.currentMilesArray?.slice(-1)[0]?.miles?.toString() ||
              "";
            setCurrentReading(latestMiles);
          } else if (vType === "Trailer") {
            const latestHours =
              vData.hoursReading ||
              vData.hoursReadingArray?.slice(-1)[0]?.hours?.toString() ||
              "";
            setHoursReading(latestHours);
            setOilChangeDate(vData.oilChangeDate || "");
          }

          // Fetch myCompanies and match
          const myComps = await fetchMyCompanies(effectiveUserId);
          const vMyCompany = (vData.myCompany || "").toString().trim();
          const vMyComId = (vData.mycomId || "").toString().trim();

          if (vMyComId) {
            setSelectedMyCompanyId(vMyComId);
            setSelectedMyCompanyName(vMyCompany);
          } else if (vMyCompany) {
            const matched = myComps.find(
              (c) => c.companyName.toLowerCase() === vMyCompany.toLowerCase()
            );
            if (matched) {
              setSelectedMyCompanyId(matched.id);
              setSelectedMyCompanyName(matched.companyName);
            } else {
              setSelectedMyCompanyId("default");
              setSelectedMyCompanyName(vMyCompany);
            }
          } else if (myComps.length > 0) {
            setSelectedMyCompanyId(myComps[0].id);
            setSelectedMyCompanyName(myComps[0].companyName);
          }

          // Fetch company list for this vehicle type
          if (vType) {
            const companyDoc = await getDoc(
              doc(db, "metadata", "companyNameL")
            );
            if (companyDoc.exists()) {
              const companies = companyDoc.data()?.data || [];
              const filteredCompanies = companies
                .filter(
                  (company: { type: string; cName: string }) =>
                    company.type === vType
                )
                .map((company: { cName: string }) =>
                  company.cName.toUpperCase()
                );
              setCompanyList(filteredCompanies);
            }
          }

          // Fetch engine list for this company and vehicle type
          if (vType && compName) {
            const engineDoc = await getDoc(
              doc(db, "metadata", "engineNameList")
            );
            if (engineDoc.exists()) {
              const engineData = engineDoc.data()?.data || [];
              const filteredEngines = engineData
                .filter(
                  (engine: { type: string; cName: string }) =>
                    engine.type === vType &&
                    engine.cName.toUpperCase() === compName
                )
                .map((engine: { eName: string }) =>
                  engine.eName.toUpperCase()
                );
              setEngineNameList(filteredEngines);
            }
          }
        } else {
          toast.error("Vehicle not found");
        }
      } catch (error) {
        toast.error("Error fetching vehicle data: " + error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [effectiveUserId, vehicleId]);

  // Handle vehicle type change
  const handleVehicleTypeChange = async (vType: string) => {
    setSelectedVehicleType(vType);
    setSelectedCompany("");
    setSelectedEngineName("");
    setEngineNameList([]);

    if (!vType) {
      setCompanyList([]);
      return;
    }

    try {
      const companyDoc = await getDoc(doc(db, "metadata", "companyNameL"));
      if (companyDoc.exists()) {
        const companies = companyDoc.data()?.data || [];
        const filteredCompanies = companies
          .filter(
            (company: { type: string; cName: string }) =>
              company.type === vType
          )
          .map((company: { cName: string }) => company.cName.toUpperCase());
        setCompanyList(filteredCompanies);
      }
    } catch (error) {
      toast.error("Error fetching companies: " + error);
    }
  };

  // Handle company change
  const handleCompanyChange = async (comp: string) => {
    setSelectedCompany(comp);
    setSelectedEngineName("");

    if (!comp || !selectedVehicleType) {
      setEngineNameList([]);
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
              engine.cName.toUpperCase() === comp.toUpperCase()
          )
          .map((engine: { eName: string }) => engine.eName.toUpperCase());
        setEngineNameList(filteredEngines);
      }
    } catch (error) {
      toast.error("Error fetching engine names: " + error);
    }
  };

  const calculateNextNotificationMiles = (): Service[] => {
    const nextNotificationMiles: Service[] = [];
    const currentMiles = parseInt(currentReading) || 0;

    for (const service of servicesData) {
      if (service.vType === selectedVehicleType) {
        const serName = service.sName;
        const serId = service.sId || "";
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
            }

            nextNotificationMiles.push({
              sId: serId,
              sName: serName,
              serviceId: serId,
              serviceName: serName,
              defaultNotificationValue: notificationValue,
              nextNotificationValue:
                type === "reading"
                  ? currentMiles + notificationValue
                  : notificationValue,
              type: type,
              vType: service.vType,
              dValues: service.dValues,
              isNotification: true,
              subServices: subServices.map((s: { sName: string }) => ({
                sName: s.sName,
              })),
            });
          }
        }

        if (!foundMatch) {
          console.log(`No brand match found for service: ${serName}`);
        }
      }
    }

    return nextNotificationMiles;
  };

  const validateForm = () => {
    if (
      !selectedVehicleType ||
      !selectedCompany ||
      !selectedEngineName ||
      !vehicleNumber
    ) {
      toast.error("Please fill all required fields");
      return false;
    }

    const isVinRequired =
      selectedVehicleType !== "Truck" && selectedVehicleType !== "Trailer";
    if (isVinRequired && !vin) {
      toast.error("Please enter VIN");
      return false;
    }

    const isYearRequired =
      selectedVehicleType !== "Truck" && selectedVehicleType !== "Trailer";
    if (isYearRequired && !year) {
      toast.error("Please enter year");
      return false;
    }

    const isLicensePlateRequired =
      selectedVehicleType !== "Truck" && selectedVehicleType !== "Trailer";
    if (isLicensePlateRequired && !licensePlate) {
      toast.error("Please enter license plate");
      return false;
    }

    return true;
  };

  const updateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !effectiveUserId || !vehicleId) return;

    try {
      setLoading(true);

      const isCompanyOrEngineChanged =
        originalVehicleData?.companyName?.toUpperCase() !==
          selectedCompany.toUpperCase() ||
        originalVehicleData?.engineName?.toUpperCase() !==
          selectedEngineName.toUpperCase() ||
        originalVehicleData?.vehicleType !== selectedVehicleType;

      let nextNotificationMiles = originalVehicleData?.nextNotificationMiles || [];
      let services = originalVehicleData?.services || [];

      if (isCompanyOrEngineChanged && servicesData.length > 0) {
        const computedServices = calculateNextNotificationMiles();
        if (computedServices.length > 0) {
          nextNotificationMiles = computedServices;
          services = computedServices.map((service) => ({
            defaultNotificationValue: service.defaultNotificationValue || 0,
            nextNotificationValue: service.nextNotificationValue || 0,
            serviceId: service.sId || service.serviceId || "",
            serviceName: service.sName || service.serviceName || "",
            subServices: service.subServices || [],
            type: service.type || "",
            isNotification: service.isNotification ?? true,
          }));
        }
      }

      const currentMilesArray = originalVehicleData?.currentMilesArray || [];
      const hoursReadingArray = originalVehicleData?.hoursReadingArray || [];

      if (selectedVehicleType === "Truck" && currentReading) {
        const milesNum = parseInt(currentReading);
        if (!isNaN(milesNum)) {
          const lastMiles = currentMilesArray.slice(-1)[0]?.miles;
          if (lastMiles !== milesNum) {
            currentMilesArray.push({
              miles: milesNum,
              date: new Date().toISOString(),
            });
          }
        }
      }

      if (selectedVehicleType === "Trailer" && hoursReading) {
        const hoursNum = parseInt(hoursReading);
        if (!isNaN(hoursNum)) {
          const lastHours = hoursReadingArray.slice(-1)[0]?.hours;
          if (lastHours !== hoursNum) {
            hoursReadingArray.push({
              hours: hoursNum,
              date: new Date().toISOString(),
            });
          }
        }
      }

      const updateData: UpdateData<DocumentData> = {
        vehicleType: selectedVehicleType,
        companyName: selectedCompany.toUpperCase(),
        engineName: selectedEngineName.toUpperCase(),
        vehicleNumber: vehicleNumber.toUpperCase(),
        vin: vin.toUpperCase(),
        licensePlate: licensePlate.toUpperCase(),
        year: year || null,
        dot: dot || null,
        iccms: iccms || null,
        updatedAt: serverTimestamp(),
        nextNotificationMiles,
        services,
        currentMilesArray,
        hoursReadingArray,
        myCompany: selectedMyCompanyName || "",
        mycomId: selectedMyCompanyId || "",
      };

      if (selectedVehicleType === "Truck") {
        updateData.currentMiles = currentReading || "";
        updateData.prevMilesValue = currentReading || "";
        updateData.oilChangeDate = null;
        updateData.hoursReading = "";
      } else if (selectedVehicleType === "Trailer") {
        updateData.currentMiles = "";
        updateData.oilChangeDate = oilChangeDate || "";
        updateData.hoursReading = hoursReading || "";
      }

      const batch = writeBatch(db);

      // 1. Update in owner's Vehicles collection
      const ownerVehicleRef = doc(
        db,
        "Users",
        effectiveUserId,
        "Vehicles",
        vehicleId
      );
      batch.update(ownerVehicleRef, updateData);

      // 2. Sync to any assigned team members
      const teamMembers = await getDocs(
        query(
          collection(db, "Users"),
          where("createdBy", "==", effectiveUserId),
          where("isTeamMember", "==", true)
        )
      );

      for (const member of teamMembers.docs) {
        const memberVehicleRef = doc(
          db,
          "Users",
          member.id,
          "Vehicles",
          vehicleId
        );
        const memberVehicleSnap = await getDoc(memberVehicleRef);
        if (memberVehicleSnap.exists()) {
          batch.update(memberVehicleRef, updateData);
        }
      }

      await batch.commit();

      toast.success("Vehicle updated successfully!");
      router.push("/account/my-vehicles");
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast.error("Error updating vehicle: " + error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center text-gray-600">
        Please log in to access the edit vehicle page.
      </div>
    );
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
        Edit Vehicle
      </h1>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-100">
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
              onChange={(e) => handleVehicleTypeChange(e.target.value)}
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
              Company Name (Make/Brand) *
            </label>
            <select
              id="company"
              value={selectedCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
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

          {/* My Company Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="myCompany"
                className="block text-sm font-medium text-gray-700"
              >
                My Company *
              </label>
              <Link
                href="/my-companies"
                className="text-xs font-semibold text-[#F96176] hover:underline"
              >
                + Add / Manage Companies
              </Link>
            </div>
            <div className="flex gap-2 items-center">
              <select
                id="myCompany"
                value={selectedMyCompanyId}
                onChange={(e) => {
                  const compId = e.target.value;
                  setSelectedMyCompanyId(compId);
                  const matched = myCompaniesList.find((c) => c.id === compId);
                  setSelectedMyCompanyName(matched?.companyName || "");
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent bg-white"
                disabled={loading}
              >
                <option value="">Select your company</option>
                {myCompaniesList.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.companyName}
                  </option>
                ))}
              </select>
              <Link
                href="/my-companies"
                title="Add / Manage Companies"
                className="p-3 bg-[#F96176] text-white rounded-lg hover:bg-[#e05065] transition-colors shrink-0 flex items-center justify-center h-[48px] w-[48px]"
              >
                <span className="text-xl font-bold leading-none">+</span>
              </Link>
            </div>
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

          {/* Current Miles for Truck */}
          {selectedVehicleType === "Truck" && (
            <div>
              <label
                htmlFor="currentReading"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Current Miles (Optional)
              </label>
              <input
                type="number"
                id="currentReading"
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                placeholder="Enter current miles"
                disabled={loading}
              />
            </div>
          )}

          {/* Hours Reading for Trailer */}
          {selectedVehicleType === "Trailer" && (
            <div>
              <label
                htmlFor="hoursReading"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Hours Reading (Optional)
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
          )}

          {/* VIN */}
          <div>
            <label
              htmlFor="vin"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {selectedVehicleType === "Truck" ||
              selectedVehicleType === "Trailer"
                ? "VIN (Optional)"
                : "VIN *"}
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

          {/* License Plate */}
          <div>
            <label
              htmlFor="licensePlate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {selectedVehicleType === "Truck" ||
              selectedVehicleType === "Trailer"
                ? "License Plate (Optional)"
                : "License Plate *"}
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
              Year (Optional)
            </label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select year</option>
              {Array.from(
                { length: 50 },
                (_, i) => (new Date().getFullYear() + 1 - i).toString()
              ).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Link
              href="/account/my-vehicles"
              className="border border-gray-300 py-2.5 px-5 rounded-lg hover:bg-gray-100 transition duration-200 text-gray-700 font-medium"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="bg-[#F96176] text-white py-2.5 px-6 rounded-lg hover:bg-[#eb929e] transition duration-200 font-medium"
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
