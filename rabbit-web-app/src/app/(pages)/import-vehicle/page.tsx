"use client";

import { useEffect, useState } from "react";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";

import { read, utils } from "xlsx";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  FieldValue,
  Timestamp,
  updateDoc,
  query,
  where,
  getDocs,
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
import { format } from "date-fns";

export interface Vehicle {
  firstTimeVehicle: boolean;
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
  nextNotificationMiles?: NextNotificationMile[];
  vehicleId?: string;
}

export interface Service {
  serviceId: string;
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number;
  type: string;
  subServices: string[];
}

export interface NextNotificationMile {
  serviceId: string;
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number;
  type: string;
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
    type: string;
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
        type: string;
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
  const router = useRouter();

  const sampleFiles = {
    truck:
      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/sample_vehicle_data_rabbit_vehicle_type_truck.xlsx?alt=media&token=01e2f94e-6f57-45c4-a32c-64b9c8856a3f",
    trailer:
      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/sample_trailer_vehicle_data_rabbit.xlsx?alt=media&token=e76d4dce-31fa-4051-9f3a-7bf851ce8d9c",
    truckCompanies:
      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/truck_company_name_and_engine_name_29_april.xlsx?alt=media&token=a163409a-a60f-4bbe-b2ac-882b97bd60b3",
    trailerCompanies:
      "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/trailer_company_name_and_engine_name_29_april.xlsx?alt=media&token=63e5fb03-1dce-4ec0-bf91-2aed82ddabb1",
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
        toast.error("Error fetching services data: " + error);
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
  ): NextNotificationMile[] => {
    const nextNotificationMiles: NextNotificationMile[] = [];

    servicesData.forEach((service) => {
      if (service.vType === vehicleType) {
        const serviceName = service.sName;
        const serviceId = service.sId || "";
        const subServices = service.subServices || [];
        const defaultValues = service.dValues || [];

        let foundMatch = false;

        defaultValues.forEach((defaultValue) => {
          if (
            defaultValue.brand.toString().toLowerCase() ===
            engineName.toLowerCase()
          ) {
            foundMatch = true;

            const type = defaultValue.type.toString().toLowerCase();
            const value = parseInt(defaultValue.value.toString()) || 0;
            let notificationValue;

            if (type === "reading") {
              notificationValue = value * 1000;
            } else if (type === "day") {
              notificationValue = value;
            } else if (type === "hour") {
              notificationValue = value;
            } else {
              notificationValue = value;
            }

            nextNotificationMiles.push({
              serviceId: serviceId,
              serviceName: serviceName,
              defaultNotificationValue: notificationValue,
              nextNotificationValue: notificationValue,
              type: type,
              subServices: subServices.map((s) => s.sName.toString()),
            });
          }
        });

        if (!foundMatch) {
          console.log(`No brand match found for service: ${serviceName}`);
        }
      } else {
        console.log(
          `Skipping service: ${service.sName} due to unmatched vehicle type.`
        );
      }
    });

    return nextNotificationMiles;
  };

  const convertExcelDate = (excelDate: number): string => {
    // Excel dates are based on 1900-01-01 (with 1900 incorrectly treated as a leap year)
    const utcDays = Math.floor(excelDate - 25569);
    const utcValue = utcDays * 86400 * 1000;
    const dateInfo = new Date(utcValue);

    // Adjust for timezone offset
    const timezoneOffset = dateInfo.getTimezoneOffset() * 60000;
    const localDate = new Date(utcValue + timezoneOffset);

    return format(localDate, "yyyy-MM-dd");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setIsParsing(true);
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: "array", cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const jsonData = utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: "yyyy-mm-dd",
        }) as Partial<Vehicle>[];

        // Process dates to ensure proper format
        const processedData = jsonData.map((item) => {
          // Handle year field
          if (item.year) {
            if (typeof item.year === "number") {
              item.year = convertExcelDate(item.year);
            } else if (typeof item.year === "string") {
              try {
                // Try to parse the string date
                const parsedDate = new Date(item.year);
                if (!isNaN(parsedDate.getTime())) {
                  item.year = format(parsedDate, "yyyy-MM-dd");
                }
              } catch (eroor) {
                console.warn(
                  `Could not parse year date: ${item.year} - ${eroor}`
                );
              }
            }
          }

          // Handle oilChangeDate field
          if (item.oilChangeDate) {
            if (typeof item.oilChangeDate === "number") {
              item.oilChangeDate = convertExcelDate(item.oilChangeDate);
            } else if (typeof item.oilChangeDate === "string") {
              try {
                const parsedDate = new Date(item.oilChangeDate);
                if (!isNaN(parsedDate.getTime())) {
                  item.oilChangeDate = format(parsedDate, "yyyy-MM-dd");
                }
              } catch (error) {
                console.warn(
                  `Could not parse oil change date: ${item.oilChangeDate} - ${error}`
                );
              }
            }
          }

          return item;
        });

        setExcelData(processedData);
      } catch (error) {
        toast.error("Failed to parse Excel file: " + error);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // const saveVehicle = async (data: Partial<Vehicle>) => {
  //   if (!user?.uid) throw new Error("User not authenticated");

  //   try {
  //     // 1. Validate required fields
  //     const vehicleType = data.vehicleType;
  //     const companyName = data.companyName?.toString().trim().toUpperCase();
  //     const engineName = data.engineName?.toString().trim().toUpperCase();
  //     const vehicleNumber = data.vehicleNumber?.toString().trim() || "";

  //     if (!vehicleType || !companyName || !engineName || !vehicleNumber) {
  //       throw new Error("Missing required vehicle properties");
  //     }

  //     // 2. Vehicle type specific validation
  //     if (vehicleType === "Truck") {
  //       if (!data.currentMiles?.toString().trim()) {
  //         throw new Error("Truck requires current miles");
  //       }
  //     } else if (vehicleType === "Trailer") {
  //       if (!data.hoursReading?.toString().trim()) {
  //         throw new Error("Trailer requires hours reading");
  //       }
  //       if (!data.oilChangeDate?.toString().trim()) {
  //         throw new Error("Trailer requires oil change date");
  //       }
  //     }

  //     // 3. Check for duplicate vehicle
  //     const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
  //     const duplicateQuery = await getDocs(
  //       query(
  //         vehiclesRef,
  //         where("vehicleNumber", "==", vehicleNumber),
  //         where("vehicleType", "==", vehicleType),
  //         where("companyName", "==", companyName),
  //         where("engineName", "==", engineName)
  //       )
  //     );

  //     if (!duplicateQuery.empty) {
  //       throw new Error("Vehicle already exists");
  //     }

  //     // 4. Parse dates - they should already be in correct format from the upload processing
  //     const yearDate: string | undefined = data.year;
  //     const oilChangeDate: string | undefined = data.oilChangeDate;

  //     // 5. Calculate next notification miles
  //     const nextNotificationMiles = calculateNextNotificationMiles(
  //       vehicleType === "Truck"
  //         ? parseInt(data.currentMiles || "0")
  //         : parseInt(data.hoursReading || "0"),
  //       vehicleType,
  //       engineName
  //     );

  //     // 6. Prepare vehicle data
  //     const vehicleData: Vehicle = {
  //       firstTimeVehicle: true,
  //       active: true,
  //       tripAssign: false,
  //       vehicleType,
  //       companyName,
  //       engineName,
  //       vehicleNumber,
  //       vin: data.vin?.toString().trim() || "",
  //       dot: data.dot?.toString().trim() || "",
  //       iccms: data.iccms?.toString().trim() || "",
  //       licensePlate: data.licensePlate?.toString().trim() || "",
  //       year: yearDate,
  //       isSet: true,
  //       uploadedDocuments: [],
  //       createdAt: serverTimestamp() as FieldValue,
  //       currentMilesArray: [
  //         {
  //           miles:
  //             vehicleType === "Truck" ? parseInt(data.currentMiles || "0") : 0,
  //           date: new Date().toISOString(),
  //         },
  //       ],
  //       nextNotificationMiles,
  //       services: nextNotificationMiles.map((service) => ({
  //         defaultNotificationValue: service.defaultNotificationValue,
  //         nextNotificationValue: service.nextNotificationValue,
  //         serviceId: service.serviceId,
  //         serviceName: service.serviceName,
  //         type: service.type,
  //         subServices: service.subServices,
  //       })),
  //       ...(vehicleType === "Truck"
  //         ? {
  //             currentMiles: data.currentMiles?.toString(),
  //             prevMilesValue: data.currentMiles?.toString(),
  //             firstTimeMiles: data.currentMiles?.toString(),
  //             oilChangeDate: "2025-04-12", // Default value as in Flutter
  //             hoursReading: "",
  //             prevHoursReadingValue: "",
  //           }
  //         : {
  //             currentMiles: "",
  //             prevMilesValue: "",
  //             firstTimeMiles: "",
  //             oilChangeDate: oilChangeDate,
  //             hoursReading: data.hoursReading?.toString() || "",
  //             prevHoursReadingValue: data.hoursReading?.toString() || "",
  //           }),
  //     };

  //     // 7. Save to Firestore
  //     const docRef = await addDoc(vehiclesRef, vehicleData);
  //     await updateDoc(docRef, { vehicleId: docRef.id });

  //     // 8. Trigger cloud function
  //     const callable = httpsCallable(
  //       functions,
  //       "checkAndNotifyUserForVehicleService"
  //     );
  //     await callable({
  //       userId: user.uid,
  //       vehicleId: docRef.id,
  //     });

  //     return true;
  //   } catch (error) {
  //     console.error("Error saving vehicle data:", error);
  //     throw error;
  //   }
  // };

  const saveVehicle = async (data: Partial<Vehicle>) => {
    if (!user?.uid) throw new Error("User not authenticated");

    try {
      // 1. Validate required fields
      const vehicleType = data.vehicleType;
      const companyName = data.companyName?.toString().trim().toUpperCase();
      const engineName = data.engineName?.toString().trim().toUpperCase();
      const vehicleNumber = data.vehicleNumber?.toString().trim() || "";

      if (!vehicleType || !companyName || !engineName || !vehicleNumber) {
        throw new Error("Missing required vehicle properties");
      }

      // 2. Vehicle type specific validation and default values
      if (vehicleType === "Truck") {
        if (!data.currentMiles?.toString().trim()) {
          throw new Error("Truck requires current miles");
        }
      } else if (vehicleType === "Trailer") {
        // Set default values for trailer if not provided
        data.hoursReading = data.hoursReading?.toString() || "1000";
        data.dot = data.dot?.toString() || "RB123";
        data.iccms = data.iccms?.toString() || "RB123";

        // Set oil change date to current date if not provided
        const currentDate = format(new Date(), "yyyy-MM-dd");
        data.oilChangeDate = data.oilChangeDate?.toString() || currentDate;
      }

      // 3. Check for duplicate vehicle
      const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
      const duplicateQuery = await getDocs(
        query(
          vehiclesRef,
          where("vehicleNumber", "==", vehicleNumber),
          where("vehicleType", "==", vehicleType),
          where("companyName", "==", companyName),
          where("engineName", "==", engineName)
        )
      );

      if (!duplicateQuery.empty) {
        throw new Error("Vehicle already exists");
      }

      // 4. Calculate next notification miles
      const nextNotificationMiles = calculateNextNotificationMiles(
        vehicleType === "Truck"
          ? parseInt(data.currentMiles || "0")
          : parseInt(data.hoursReading || "0"),
        vehicleType,
        engineName
      );

      // 5. Prepare vehicle data
      const vehicleData: Vehicle = {
        firstTimeVehicle: true,
        active: true,
        tripAssign: false,
        vehicleType,
        companyName,
        engineName,
        vehicleNumber,
        vin: data.vin?.toString().trim() || "",
        dot:
          data.dot?.toString().trim() ||
          (vehicleType === "Trailer" ? "RB123" : ""),
        iccms:
          data.iccms?.toString().trim() ||
          (vehicleType === "Trailer" ? "RB123" : ""),
        licensePlate: data.licensePlate?.toString().trim() || "",
        year: data.year?.toString(),
        isSet: true,
        uploadedDocuments: [],
        createdAt: serverTimestamp() as FieldValue,
        currentMilesArray: [
          {
            miles:
              vehicleType === "Truck"
                ? parseInt(data.currentMiles || "0")
                : parseInt(data.hoursReading || "1000"),
            date: new Date().toISOString(),
          },
        ],
        nextNotificationMiles,
        services: nextNotificationMiles.map((service) => ({
          defaultNotificationValue: service.defaultNotificationValue,
          nextNotificationValue: service.nextNotificationValue,
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          type: service.type,
          subServices: service.subServices,
        })),
        ...(vehicleType === "Truck"
          ? {
              currentMiles: data.currentMiles?.toString(),
              prevMilesValue: data.currentMiles?.toString(),
              firstTimeMiles: data.currentMiles?.toString(),
              oilChangeDate: "2025-04-12", // Default value as in mobile
              hoursReading: "",
              prevHoursReadingValue: "",
              hoursReadingArray: [],
            }
          : {
              currentMiles: "",
              prevMilesValue: "",
              firstTimeMiles: "",
              oilChangeDate:
                data.oilChangeDate || format(new Date(), "yyyy-MM-dd"),
              hoursReading: data.hoursReading?.toString() || "1000",
              prevHoursReadingValue: data.hoursReading?.toString() || "1000",
              hoursReadingArray: [
                {
                  hours: parseInt(data.hoursReading?.toString() || "1000"),
                  date: new Date().toISOString(),
                },
              ],
            }),
      };

      // 6. Save to Firestore
      const docRef = await addDoc(vehiclesRef, vehicleData);
      await updateDoc(docRef, { vehicleId: docRef.id });

      // 7. Trigger cloud function
      const callable = httpsCallable(
        functions,
        "checkAndNotifyUserForVehicleService"
      );
      await callable({
        userId: user.uid,
        vehicleId: docRef.id,
      });

      return true;
    } catch (error) {
      console.error("Error saving vehicle data:", error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!excelData.length) return;

    setIsSaving(true);
    setUploadErrors([]);
    const errors: string[] = [];
    let successCount = 0;

    for (const data of excelData) {
      try {
        await saveVehicle(data);
        successCount++;
      } catch (error) {
        const rowNumber = excelData.indexOf(data) + 1;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Row ${rowNumber}: ${errorMessage}`);
      }
    }

    setUploadErrors(errors);
    setIsSaving(false);

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} vehicles`, {
        autoClose: 5000,
      });
      router.push("/account/my-vehicles");
    }

    if (errors.length > 0) {
      toast.error(
        `${errors.length} error(s) occurred during upload. See details below.`,
        { autoClose: 5000 }
      );
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
                <Link href={sampleFiles.truckCompanies} target="_blank">
                  Truck Companies & Engines
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={sampleFiles.trailerCompanies} target="_blank">
                  Trailer Companies & Engines
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {excelData.length > 0 && (
        <>
          <Card className="p-4 mb-6">
            <div className="overflow-x-auto">
              <h2 className="text-xl font-bold mb-4">Preview Data</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {Object.keys(excelData[0])
                      .filter((key) => {
                        // Always show these fields for both vehicle types
                        const commonFields = [
                          "vehicleNumber",
                          "vehicleType",
                          "companyName",
                          "engineName",
                          "vin",
                          "licensePlate",
                          "year",
                        ];

                        if (commonFields.includes(key)) return true;

                        // For trucks, show all fields
                        if (excelData[0]?.vehicleType === "Truck") return true;

                        // For trailers, hide these specific fields
                        if (excelData[0]?.vehicleType === "Trailer") {
                          return ![
                            "currentMiles",
                            "dot",
                            "iccms",
                            "oilChangeDate",
                          ].includes(key);
                        }

                        return true;
                      })
                      .map((key) => (
                        <th key={key} className="px-4 py-2 text-left">
                          {key === "currentMiles" ? "Miles" : key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row, index) => (
                    <tr key={index}>
                      {Object.entries(row)
                        .filter(([key]) => {
                          // Always show these fields for both vehicle types
                          const commonFields = [
                            "vehicleNumber",
                            "vehicleType",
                            "companyName",
                            "engineName",
                            "vin",
                            "licensePlate",
                            "year",
                          ];

                          if (commonFields.includes(key)) return true;

                          // For trucks, show all fields
                          if (row.vehicleType === "Truck") return true;

                          // For trailers, hide these specific fields
                          if (row.vehicleType === "Trailer") {
                            return ![
                              "currentMiles",
                              "dot",
                              "iccms",
                              "oilChangeDate",
                            ].includes(key);
                          }

                          return true;
                        })
                        .map(([key, value]) => (
                          <td key={key} className="px-4 py-2">
                            {String(value)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Button onClick={handleUpload} disabled={isSaving} className="w-full">
            {isSaving ? "Uploading..." : "Upload Vehicles"}
          </Button>
        </>
      )}

      {uploadErrors.length > 0 && (
        <Card className="p-4 mt-6">
          <h2 className="text-xl font-bold mb-4 text-red-600">Upload Errors</h2>
          <div className="space-y-2">
            {uploadErrors.map((error, index) => (
              <p key={index} className="text-red-500">
                {error}
              </p>
            ))}
          </div>
        </Card>
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
