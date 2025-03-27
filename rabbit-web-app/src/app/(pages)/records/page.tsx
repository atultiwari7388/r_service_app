"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
} from "firebase/firestore";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  Checkbox,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import toast from "react-hot-toast";
import { VehicleTypes } from "@/types/types";
import { useAuth } from "@/contexts/AuthContexts";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { CiSearch } from "react-icons/ci";
import { IoMdAdd } from "react-icons/io";
import Link from "next/link";

interface Vehicle {
  brand: string;
  type: string;
  value: string;
}

interface ServicePackage {
  name: string;
  type: string[];
}

interface ServiceData {
  sId: string;
  sName: string;
  vType: string;
  dValues: Vehicle[];
  subServices?: Array<{ sName: string[] }>;
  pName?: string[];
}

interface ServiceRecord {
  id: string;
  vehicleDetails: {
    vehicleNumber: string;
    vehicleType: string;
    companyName: string;
    engineNumber: string;
    currentMiles?: string;
    nextNotificationMiles?: Array<{
      serviceName: string;
      nextNotificationValue: number;
      subServices: string[];
    }>;
  };
  services: Array<{
    serviceId: string;
    serviceName: string;
    defaultNotificationValue: number;
    nextNotificationValue: number;
    subServices: Array<{ name: string; id: string }>;
  }>;
  date: string;
  hours: number;
  miles: number;
  totalMiles: number;
  createdAt: string;
  workshopName: string;
  invoice?: string;
  description?: string;
}

interface RecordData extends ServiceRecord {
  id: string;
  vehicle: string;
}

export default function RecordsPage() {
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const { user } = useAuth() || { user: null };

  // Add Records Form State
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set()
  );
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(
    new Set()
  );

  const [selectedSubServices, setSelectedSubServices] = useState<{
    [key: string]: string[];
  }>({});
  const [serviceDefaultValues, setServiceDefaultValues] = useState<{
    [key: string]: number;
  }>({});
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [miles, setMiles] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [invoice, setInvoice] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showAddRecords, setShowAddRecords] = useState(false);
  const [serviceSearchText, setServiceSearchText] = useState("");

  const [selectedVehicleData, setSelectedVehicleData] =
    useState<VehicleTypes | null>(null);

  // Add Miles Form State
  const [showAddMiles, setShowAddMiles] = useState(false);
  const [todayMiles, setTodayMiles] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");

  const fetchVehicles = async () => {
    if (!user) return;
    try {
      const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
      const vehiclesSnapshot = await getDocs(vehiclesRef);
      const vehiclesList = vehiclesSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as VehicleTypes)
      );
      setVehicles(vehiclesList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      GlobalToastError(error);
    }
  };

  const fetchServices = async () => {
    try {
      const servicesDoc = await getDoc(doc(db, "metadata", "serviceData"));
      if (servicesDoc.exists()) {
        const servicesData = servicesDoc.data().data || [];
        setServices(servicesData);

        // Extract unique package names
        const uniquePackages = new Set<string>();
        servicesData.forEach((service: ServiceData) => {
          if (service.pName) {
            service.pName.forEach((pkg) => uniquePackages.add(pkg));
          }
        });
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    }
  };

  const fetchServicePackages = async () => {
    try {
      const packagesDoc = await getDoc(
        doc(db, "metadata", "nServicesPackages")
      );
      if (packagesDoc.exists()) {
        const packagesData = packagesDoc.data().data || [];
        console.log("Fetched packages:", packagesData); // Debug log
        setServicePackages(packagesData);
      } else {
        console.log("No packages document found");
      }
    } catch (error) {
      console.error("Error fetching service packages:", error);
      toast.error("Failed to fetch service packages");
    }
  };

  const updateServiceDefaultValues = () => {
    if (selectedVehicle && selectedServices.size > 0 && selectedVehicleData) {
      const newDefaultValues: { [key: string]: number } = {};

      selectedServices.forEach((serviceId) => {
        const selectedService = services.find((s) => s.sId === serviceId);
        if (selectedService?.dValues) {
          for (const dValue of selectedService.dValues) {
            // Add null checks for dValue.brand and selectedVehicleData.engineNumber
            if (
              dValue?.brand &&
              selectedVehicleData?.engineNumber &&
              dValue.brand.toString().toUpperCase() ===
                selectedVehicleData.engineNumber.toString().toUpperCase()
            ) {
              // Add null check for dValue.value
              if (dValue.value) {
                newDefaultValues[serviceId] =
                  parseInt(dValue.value.toString().split(",")[0]) * 1000;
                break;
              }
            }
          }
        }
      });

      setServiceDefaultValues(newDefaultValues);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const newSelectedServices = new Set(selectedServices);

    if (newSelectedServices.has(serviceId)) {
      // Deselect the service
      newSelectedServices.delete(serviceId);

      const newSubServices = { ...selectedSubServices };
      delete newSubServices[serviceId];
      setSelectedSubServices(newSubServices);
    } else {
      // Select the service
      newSelectedServices.add(serviceId);

      const service = services.find((s) => s.sId === serviceId);

      if (service?.subServices) {
        // Flatten and filter the sub-services to ensure valid entries
        const subServiceNames = service.subServices
          .flatMap((subService) => subService.sName)
          .filter((name) => name.trim().length > 0); // Remove empty strings

        if (subServiceNames.length > 0) {
          setSelectedSubServices((prev) => ({
            ...prev,
            [serviceId]: subServiceNames, // Assign valid sub-services
          }));
        }
      }
    }

    setSelectedServices(newSelectedServices);
    updateServiceDefaultValues();
  };

  const handleAddMiles = async () => {
    if (!selectedVehicle || !todayMiles || !user?.uid) {
      toast.error("Please select a vehicle and enter miles/hours.");
      return;
    }

    const vehicleData = vehicles.find((v) => v.id === selectedVehicle);
    if (!vehicleData) {
      toast.error("Vehicle data not found.");
      return;
    }

    try {
      const vehicleRef = doc(
        db,
        "Users",
        user.uid,
        "Vehicles",
        selectedVehicle
      );
      const vehicleDoc = await getDoc(vehicleRef);

      if (!vehicleDoc.exists()) {
        toast.error("Vehicle data not found.");
        return;
      }

      const currentReadingField =
        selectedVehicleType === "Truck" ? "currentMiles" : "hoursReading";
      const currentReadingArrayField =
        selectedVehicleType === "Truck"
          ? "currentMilesArray"
          : "hoursReadingArray";

      const currentReading = parseInt(
        vehicleDoc.data()[currentReadingField] || "0"
      );
      const enteredValue = parseInt(todayMiles);

      if (enteredValue < currentReading) {
        toast.error(
          `${
            selectedVehicleType === "Truck" ? "Miles" : "Hours"
          } cannot be less than the current value.`
        );
        return;
      }

      await updateDoc(vehicleRef, {
        [currentReadingField]: enteredValue,
        [currentReadingArrayField]: arrayUnion({
          [selectedVehicleType === "Truck" ? "miles" : "hours"]: enteredValue,
          date: new Date().toISOString(),
        }),
      });

      toast.success(
        `${
          selectedVehicleType === "Truck" ? "Miles" : "Hours"
        } updated successfully!`
      );
      setTodayMiles("");
      setShowAddMiles(false);
    } catch (error) {
      console.error("Error updating miles/hours:", error);
      toast.error("Failed to save miles/hours.");
    }
  };

  const handleSaveRecords = async () => {
    try {
      if (!user || !selectedVehicle) {
        toast.error("Please select vehicle and services");
        return;
      }

      const vehicleData = vehicles.find((v) => v.id === selectedVehicle);
      if (!vehicleData) {
        toast.error("Vehicle data not found");
        return;
      }

      const currentMiles = Number(miles);

      const servicesData = Array.from(selectedServices).map((serviceId) => {
        const service = services.find((s) => s.sId === serviceId);
        const defaultValue = serviceDefaultValues[serviceId] || 0;
        const nextNotificationValue =
          defaultValue === 0 ? 0 : currentMiles + defaultValue;

        return {
          serviceId,
          serviceName: service?.sName || "",
          defaultNotificationValue: defaultValue,
          nextNotificationValue: nextNotificationValue,
          subServices:
            selectedSubServices[serviceId]?.map((subService, index) => ({
              name: subService,
              id: `${serviceId}_${subService.replace(/\s+/g, "_")}_${index}`, // Add index to make unique
            })) || [],
        };
      });

      const notificationData = servicesData.map((service) => ({
        serviceName: service.serviceName,
        nextNotificationValue: service.nextNotificationValue,
        subServices: selectedSubServices[service.serviceId] || [],
      }));

      const recordData = {
        userId: user.uid,
        vehicleId: selectedVehicle,
        vehicleDetails: {
          ...vehicleData,
          currentMiles: currentMiles.toString(),
          nextNotificationMiles: notificationData,
        },
        services: servicesData,
        currentMilesArray: [
          {
            miles: currentMiles,
            date: new Date().toISOString(),
          },
        ],
        miles: vehicleData.vehicleType === "Truck" ? currentMiles : 0,
        hours: vehicleData.vehicleType === "Trailer" ? Number(hours) : 0,
        totalMiles: currentMiles,
        date: date || new Date().toISOString(),
        workshopName,
        invoice,
        invoiceAmount,
        description,
        createdAt: new Date().toISOString(),
      };

      const batch = {
        newRecord: doc(collection(db, "Users", user.uid, "DataServices")),
        globalRecord: doc(collection(db, "DataServicesRecords")),
        vehicle: doc(db, "Users", user.uid, "Vehicles", selectedVehicle),
      };

      await Promise.all([
        setDoc(batch.newRecord, recordData),
        setDoc(batch.globalRecord, recordData),
        setDoc(
          batch.vehicle,
          {
            currentMiles: currentMiles.toString(),
            currentMilesArray: [
              {
                miles: currentMiles,
                date: new Date().toISOString(),
              },
            ],
            nextNotificationMiles: notificationData,
          },
          { merge: true }
        ),
      ]);

      toast.success("Record added successfully!");
      resetForm();
    } catch (error) {
      console.error("Error saving record:", error);
      toast.error("Failed to save record");
    }
  };

  const handleVehicleSelect = async (value: string) => {
    setSelectedVehicle(value);
    setSelectedVehicleData(null);
    setSelectedPackages(new Set());

    if (!user?.uid || !value) return;

    try {
      const vehicleRef = doc(db, "Users", user.uid, "Vehicles", value);
      const vehicleDoc = await getDoc(vehicleRef);

      if (vehicleDoc.exists()) {
        const vehicleData = vehicleDoc.data() as VehicleTypes;
        setSelectedVehicleData(vehicleData);
        setSelectedVehicleType(vehicleData.vehicleType);
        if (vehicleData.vehicleType) {
        }
      } else {
        toast.error("Vehicle data not found.");
      }
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      toast.error("Failed to fetch vehicle data.");
    }
  };

  const normalizePackageName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "");
  };

  const handlePackageSelect = (selectedPackages: string[]) => {
    const newSelectedServices = new Set(selectedServices);

    selectedPackages.forEach((pkg) => {
      services.forEach((service) => {
        if (
          service.pName &&
          service.pName.some(
            (p) => normalizePackageName(p) === normalizePackageName(pkg)
          )
        ) {
          newSelectedServices.add(service.sId);
        }
      });
    });

    setSelectedServices(newSelectedServices);
    setSelectedPackages(new Set(selectedPackages));
  };

  const resetForm = () => {
    setSelectedVehicle("");
    setSelectedServices(new Set());
    setSelectedPackages(new Set());
    setSelectedSubServices({});
    setServiceDefaultValues({});
    setMiles("");
    setHours("");
    setDate("");
    setWorkshopName("");
    setInvoice("");
    setDescription("");
    setShowAddRecords(false);
  };

  useEffect(() => {
    fetchVehicles();
    fetchServices();
    fetchServicePackages();
    if (!user?.uid) return;

    const recordsQuery = query(
      collection(db, "Users", user.uid, "DataServices")
    );

    const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
      const recordsData: RecordData[] = snapshot.docs.map((doc) => {
        const data = doc.data() as ServiceRecord;
        return {
          ...data,
          id: doc.id,
          vehicle: data.vehicleDetails.companyName,
        };
      });

      setRecords(recordsData);
      console.log(`Fetched ${recordsData.length} records`);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    updateServiceDefaultValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle, selectedServices]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <h1 className="text-xl font-semibold text-gray-700">
          Please Login to access the page..
        </h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center p-6 bg-gray-100 gap-8">
      {/* Button Container */}
      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant="contained"
          startIcon={<IoMdAdd />}
          onClick={() => setShowAddRecords(true)}
          className="bg-[#F96176] hover:bg-[#F96176] text-white transition duration-300"
        >
          Add Record
        </Button>

        <Button
          variant="contained"
          onClick={() => setShowAddMiles(true)}
          className="bg-[#58BB87] hover:bg-[#58BB87] text-white transition duration-300"
        >
          Add Miles/Hours
        </Button>
      </div>

      {/* Add Miles Dialog Box */}
      <Dialog
        open={showAddMiles}
        onClose={() => setShowAddMiles(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-[#58BB87] text-white">
          Add Miles/Hours
        </DialogTitle>
        <DialogContent>
          <Card className="mt-4 shadow-lg rounded-lg">
            <CardContent>
              <div className="mb-4">
                <FormControl fullWidth className="mb-4">
                  <InputLabel>Select Vehicle</InputLabel>
                  {/* <Select
                    value={selectedVehicle}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="rounded-lg"
                    sx={{ minHeight: "56px" }} // Adjust the minimum height and padding
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNumber} ({vehicle.companyName})
                      </MenuItem>
                    ))}
                  </Select> */}

                  <Select
                    value={selectedVehicle}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="rounded-lg"
                    sx={{ minHeight: "56px" }}
                    label="Select Vehicle"
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNumber} ({vehicle.companyName})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {selectedVehicleType && (
                <TextField
                  fullWidth
                  label={
                    selectedVehicleType === "Truck"
                      ? "Miles/Hours"
                      : "Hours/Miles"
                  }
                  type="number"
                  value={todayMiles}
                  onChange={(e) => setTodayMiles(e.target.value)}
                  className="mb-4 rounded-lg"
                />
              )}
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAddMiles(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMiles}
            variant="contained"
            color="primary"
            className="bg-[#58BB87] hover:bg-[#58BB87] transition duration-300"
          >
            Save {selectedVehicleType === "Truck" ? "Miles" : "Hours"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog
        open={showAddRecords}
        onClose={() => setShowAddRecords(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-[#F96176] text-white">
          Add Service Record
        </DialogTitle>
        <DialogContent>
          <Card className="mt-4 shadow-lg rounded-lg">
            <CardContent>
              <div className="mb-4">
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="select-vehicle-label">
                    Select Vehicle
                  </InputLabel>
                  <Select
                    labelId="select-vehicle-label"
                    value={selectedVehicle}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedVehicle(value);
                      const vehicleData =
                        vehicles.find((v) => v.id === value) || null;
                      setSelectedVehicleData(vehicleData);
                    }}
                    className="rounded-lg"
                    sx={{ minHeight: "56px" }} // Adjust the minimum height and padding
                    label="Select Vehicle" // Ensure the label is associated with the Select
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNumber} ({vehicle.companyName})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              {/** Select packages */}

              <div className="mb-4">
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="select-packages-label">
                    Select Packages
                  </InputLabel>
                  <Select
                    labelId="select-packages-label"
                    multiple
                    value={Array.from(selectedPackages)}
                    onChange={(e) =>
                      handlePackageSelect(e.target.value as string[])
                    }
                    renderValue={(selected) => selected.join(", ")}
                    label="Select Packages" // Ensure the label is associated with the Select
                    sx={{ minHeight: "56px" }} // Adjust the minimum height if needed
                  >
                    {servicePackages
                      .filter((pkg) =>
                        pkg.type.some(
                          (t) =>
                            t.toLowerCase() ===
                            selectedVehicleData?.vehicleType?.toLowerCase()
                        )
                      )
                      .map((pkg) => (
                        <MenuItem key={pkg.name} value={pkg.name}>
                          <Checkbox checked={selectedPackages.has(pkg.name)} />
                          {pkg.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </div>
              <div className="mb-4">
                <TextField
                  fullWidth
                  label="Search Services"
                  value={serviceSearchText}
                  onChange={(e) => setServiceSearchText(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <CiSearch />
                      </InputAdornment>
                    ),
                  }}
                  className="rounded-lg"
                />
              </div>
              {/** Select Services */}

              <div className="grid grid-cols-4 gap-3 mb-4">
                {services
                  .filter(
                    (service) =>
                      service.sName
                        .toLowerCase()
                        .includes(serviceSearchText.toLowerCase()) &&
                      (!selectedVehicleData ||
                        service.vType === selectedVehicleData.vehicleType)
                  )
                  .map((service) => (
                    <div key={service.sId} className="flex justify-center">
                      <Chip
                        label={service.sName}
                        onClick={(e) => {
                          e.preventDefault();
                          handleServiceSelect(service.sId);
                          setExpandedService(
                            expandedService === service.sId ? null : service.sId
                          );
                        }}
                        sx={{
                          backgroundColor: selectedServices.has(service.sId)
                            ? "#F96176"
                            : "default",
                          color: selectedServices.has(service.sId)
                            ? "white"
                            : "inherit",
                          "&:hover": {
                            backgroundColor: selectedServices.has(service.sId)
                              ? "#F96176"
                              : "#FFCDD2",
                          },
                        }}
                        variant={
                          selectedServices.has(service.sId)
                            ? "filled"
                            : "outlined"
                        }
                        className="w-full min-w-[120px] text-center transition duration-300 hover:shadow-lg"
                      />
                    </div>
                  ))}
              </div>

              <div className="mb-4 flex flex-col gap-4">
                {selectedVehicleData?.vehicleType === "Truck" && (
                  <TextField
                    fullWidth
                    label="Miles"
                    type="number"
                    value={miles}
                    onChange={(e) => setMiles(e.target.value)}
                    className="mb-4 rounded-lg"
                  />
                )}

                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  className="mb-4 rounded-lg mt-4"
                />

                {selectedVehicleData?.vehicleType === "Trailer" && (
                  <>
                    <TextField
                      fullWidth
                      label="Hours"
                      type="number"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="mb-4 rounded-lg"
                    />
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      className="mb-4 rounded-lg"
                    />
                  </>
                )}

                <TextField
                  fullWidth
                  label="Workshop Name"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  className="mb-4 rounded-lg"
                />
                <TextField
                  fullWidth
                  label="Invoice Number (Optional)"
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  className="mb-4 rounded-lg"
                />
                <TextField
                  fullWidth
                  label="Invoice Amount (Optional)"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="mb-4 rounded-lg"
                />
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAddRecords(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveRecords}
            variant="contained"
            color="primary"
            className="bg-[#F96176] hover:bg-[#F96176] transition duration-300"
          >
            Save Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Records Table */}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Workshop Name</TableCell>
              {records.some((record) => record.miles > 0) && (
                <TableCell>Miles</TableCell>
              )}
              {records.some((record) => record.hours > 0) && (
                <TableCell>Hours</TableCell>
              )}
              {records.some((record) => record.description) && (
                <TableCell>Description</TableCell>
              )}
              <TableCell>Services</TableCell>
              <TableCell>Invoice</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record.id}
                component={Link}
                href={`/records/${record.id}`}
              >
                <TableCell>
                  {new Date(record.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {record.vehicleDetails.companyName} ({" "}
                  {record.vehicleDetails.vehicleNumber})
                </TableCell>
                <TableCell>{record.workshopName}</TableCell>
                {record.miles > 0 && <TableCell>{record.miles}</TableCell>}
                {record.hours > 0 && <TableCell>{record.hours}</TableCell>}
                {record.description && (
                  <TableCell>{record.description}</TableCell>
                )}
                <TableCell>
                  {record.services
                    .map((service) => service.serviceName)
                    .join(", ")}{" "}
                </TableCell>
                <TableCell>{record.invoice}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
