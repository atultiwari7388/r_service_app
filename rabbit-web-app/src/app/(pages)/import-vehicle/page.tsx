"use client";

import { useEffect, useState } from "react";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { read, utils } from "xlsx";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  FieldValue,
  Timestamp,
} from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContexts";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HashLoader } from "react-spinners";

export interface Vehicle {
  id?: string;
  active: boolean;
  tripAssign: boolean;
  vehicleType: "Truck" | "Trailer";
  companyName: string;
  engineName: string;
  vehicleNumber: string;
  vin: string;
  dot: string;
  iccms: string;
  licensePlate: string;
  year?: string;
  isSet: boolean;
  uploadedDocuments: string[];
  createdAt: Timestamp | FieldValue | Date;
  currentMilesArray: Array<{
    miles: number;
    date: string;
  }>;
  services: Service[];
  currentMiles?: string;
  prevMilesValue?: string;
  firstTimeMiles?: string;
  oilChangeDate?: string;
  hoursReading?: string;
  prevHoursReadingValue?: string;
}

export interface Service {
  serviceId: string;
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number;
  subServices: string[];
}

export interface ServiceData {
  sId: string;
  sName: string;
  vType: string;
  subServices: Array<{
    sName: string;
    [key: string]: string | number | boolean | undefined;
  }>;
  dValues: Array<{
    brand: string;
    value: number;
    [key: string]: string | number | boolean | undefined;
  }>;
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | Array<{
        sName: string;
        [key: string]: string | number | boolean | undefined;
      }>
    | Array<{
        brand: string;
        value: number;
        [key: string]: string | number | boolean | undefined;
      }>;
}

export default function ImportVehicle() {
  const { user } = useAuth() || { user: null };
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [excelData, setExcelData] = useState<Partial<Vehicle>[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [servicesData, setServicesData] = useState<ServiceData[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  // const [selectedVehicleType, setSelectedVehicleType] = useState<string>("");

  const sampleFiles = {
    truck:
      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/sample_vehicle_data_rabbit_vehicle_type_truck.xlsx?alt=media&token=c1851f45-3865-4052-89f8-0b5d0ab6e02e",
    trailer:
      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/sample_trailer_vehicle_data_rabbit.xlsx?alt=media&token=fec03351-8645-4697-a914-35c4596062e8",
    companies:
      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/vehicle_companies_list.xlsx?alt=media&token=79ec36cb-2d0c-44fc-a714-847995a9f3fd",
    engines:
      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/vehicle_engines_list.xlsx?alt=media&token=8cf23d67-bf85-42ff-9b6b-5f2be177d5ee",
  };

  useEffect(() => {
    const fetchServicesData = async () => {
      if (!user?.uid) return;

      try {
        const docRef = doc(db, "metadata", "serviceData");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setServicesData(data.data || []);
        }
      } catch (error) {
        toast.error("Error fetching services data" + error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServicesData();
  }, [user]);

  const calculateNextNotificationMiles = (
    currentMiles: number,
    vehicleType: string,
    engineName: string
  ) => {
    return servicesData
      .filter(
        (service) =>
          service.vType === vehicleType &&
          service.dValues.some(
            (dv: { brand: string; value: number }) =>
              dv.brand.toLowerCase() === engineName.toLowerCase()
          )
      )
      .map((service) => ({
        serviceId: service.sId,
        serviceName: service.sName,
        defaultNotificationValue:
          (service.dValues.find(
            (dv: { brand: string; value: number }) =>
              dv.brand.toLowerCase() === engineName.toLowerCase()
          )?.value ?? 0) * 1000,
        nextNotificationValue: currentMiles,
        subServices: service.subServices.map(
          (ss: { sName: string }) => ss.sName
        ),
      }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setIsParsing(true);
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet) as Partial<Vehicle>[];
      setExcelData(jsonData);
      setIsParsing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const saveVehicle = async (data: Vehicle) => {
    if (!user?.uid) throw new Error("User not authenticated");

    const vehicleData: Vehicle = {
      active: true,
      tripAssign: false,
      vehicleType: data.vehicleType,
      companyName: data.companyName.toUpperCase(),
      engineName: data.engineName.toUpperCase(),
      vehicleNumber: data.vehicleNumber,
      vin: data.vin || "",
      dot: data.dot || "",
      iccms: data.iccms || "",
      licensePlate: data.licensePlate || "",
      year: data.year ? new Date(data.year).toISOString() : undefined,
      isSet: true,
      uploadedDocuments: [],
      createdAt: serverTimestamp() as FieldValue,
      currentMilesArray: [
        {
          miles:
            data.vehicleType === "Truck"
              ? parseInt(data.currentMiles || "0")
              : 0,
          date: new Date().toISOString(),
        },
      ],
      services: calculateNextNotificationMiles(
        data.vehicleType === "Truck"
          ? parseInt(data.currentMiles || "0")
          : parseInt(data.hoursReading || "0"),
        data.vehicleType,
        data.engineName
      ),
      ...(data.vehicleType === "Truck"
        ? {
            currentMiles: data.currentMiles,
            prevMilesValue: data.currentMiles,
            firstTimeMiles: data.currentMiles,
            oilChangeDate: "",
            hoursReading: "",
            prevHoursReadingValue: "",
          }
        : {
            currentMiles: "",
            prevMilesValue: "",
            firstTimeMiles: "",
            oilChangeDate: data.oilChangeDate
              ? new Date(data.oilChangeDate).toISOString()
              : "",
            hoursReading: data.hoursReading,
            prevHoursReadingValue: data.hoursReading,
          }),
    };

    const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
    const docRef = await addDoc(vehiclesRef, vehicleData);
    await httpsCallable(
      functions,
      "checkAndNotifyUserForVehicleService"
    )({
      userId: user.uid,
      vehicleId: docRef.id,
    });
  };

  const handleUpload = async () => {
    if (!excelData.length) return;

    setIsSaving(true);
    setUploadErrors([]);
    const errors: string[] = [];
    let successCount = 0;

    for (const data of excelData) {
      try {
        if (
          !data.vehicleType ||
          !data.companyName ||
          !data.engineName ||
          !data.vehicleNumber
        ) {
          throw new Error("Missing required vehicle properties");
        }
        await saveVehicle(data as Vehicle);
        successCount++;
      } catch (error) {
        errors.push(
          `Row ${excelData.indexOf(data) + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    setUploadErrors(errors);
    setIsSaving(false);

    toast.success(`Successfully uploaded ${successCount} vehicles`, {
      autoClose: 5000,
    });

    if (errors.length) {
      toast.error(`${errors.length} errors occurred during upload`, {
        autoClose: 5000,
      });
      toast.error(`Errors: ${uploadErrors}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  // if (uploadErrors) {
  //   return <div></div>;
  // }

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-6">Import Vehicles</h1>

      <Card className="p-4 mb-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="excelFile">Upload Excel File</Label>
            <Input
              id="excelFile"
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              disabled={isParsing || isSaving}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Sample Files</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInstructions(true)}
              >
                Download Vehicle Template
              </Button>
              <Button variant="outline" asChild>
                <Link href={sampleFiles.companies} target="_blank">
                  Companies List
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={sampleFiles.engines} target="_blank">
                  Engines List
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {excelData.length > 0 && (
        <Card className="p-4 mb-6">
          <div className="overflow-x-auto">
            <h2 className="text-xl font-bold mb-4">Preview Data</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {Object.keys(excelData[0]).map((key) => (
                    <th key={key} className="px-4 py-2 text-left">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="px-4 py-2">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {excelData.length > 0 && (
        <Button onClick={handleUpload} disabled={isSaving} className="w-full">
          {isSaving ? "Uploading..." : "Upload Vehicles"}
        </Button>
      )}

      <Modal show={showInstructions} onClose={() => setShowInstructions(false)}>
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4">Select Vehicle Type</h3>
          <div className="space-y-2">
            <Button asChild>
              <Link href={sampleFiles.truck} target="_blank">
                Download Truck Template
              </Link>
            </Button>
            <Button asChild>
              <Link href={sampleFiles.trailer} target="_blank">
                Download Trailer Template
              </Link>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
