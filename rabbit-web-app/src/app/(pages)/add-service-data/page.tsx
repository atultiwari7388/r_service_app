"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  TextField,
  Button,
  Card,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { db } from "@/lib/firebase";
import { RiDeleteBack2Fill } from "react-icons/ri";

interface Vehicle {
  brand: string;
  type: string;
  value: string;
}

interface ServiceData {
  sId: string;
  sName: string;
  vType: string;
  dValues: Vehicle[];
}

export default function AddServiceData() {
  const [serviceData, setServiceData] = useState<ServiceData>({
    sId: "",
    sName: "",
    vType: "",
    dValues: [],
  });

  const [companyNames, setCompanyNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const maxVehicles = 10;

  const vehicleTypes = ["Reading", "Time", "Date"];

  useEffect(() => {
    fetchCompanyNames();
  }, []);

  const fetchCompanyNames = async () => {
    try {
      const docRef = doc(db, "metadata", "companyName");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompanyNames(data.data || []);
      }
      setIsLoading(false);
    } catch (e) {
      console.error("Error fetching company names:", e);
      setIsLoading(false);
    }
  };

  const addNewVehicle = () => {
    if (serviceData.dValues.length < maxVehicles) {
      setServiceData((prev) => ({
        ...prev,
        dValues: [...prev.dValues, { brand: "", type: "", value: "" }],
      }));
    } else {
      alert("Maximum limit of 10 vehicles reached!");
    }
  };

  const saveData = async () => {
    try {
      const docRef = doc(db, "metadata", "servicesData");
      const docSnap = await getDoc(docRef);
      let existingData = [];

      if (docSnap.exists()) {
        existingData = docSnap.data().data || [];
      }

      await setDoc(docRef, {
        data: [...existingData, serviceData],
      });

      alert("Service data added successfully!");
      setServiceData({
        sId: "",
        sName: "",
        vType: "",
        dValues: [],
      });
    } catch (e) {
      alert(`Error saving data: ${e}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Add Services Data</h1>

      <div className="space-y-4">
        <TextField
          fullWidth
          label="Service ID"
          value={serviceData.sId}
          onChange={(e) =>
            setServiceData((prev) => ({ ...prev, sId: e.target.value }))
          }
        />

        <TextField
          fullWidth
          label="Service Name"
          value={serviceData.sName}
          onChange={(e) =>
            setServiceData((prev) => ({ ...prev, sName: e.target.value }))
          }
        />

        <TextField
          fullWidth
          label="Value Type"
          value={serviceData.vType}
          onChange={(e) =>
            setServiceData((prev) => ({ ...prev, vType: e.target.value }))
          }
        />

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Vehicle Details</h2>
          <Button
            variant="contained"
            startIcon={<span>+</span>}
            onClick={addNewVehicle}
            disabled={serviceData.dValues.length >= maxVehicles}
          >
            Add Vehicle
          </Button>
        </div>

        {serviceData.dValues.map((vehicle, index) => (
          <Card key={index} className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Vehicle {index + 1}</h3>
              <IconButton
                onClick={() => {
                  setServiceData((prev) => ({
                    ...prev,
                    dValues: prev.dValues.filter((_, i) => i !== index),
                  }));
                }}
              >
                <RiDeleteBack2Fill />
              </IconButton>
            </div>

            <FormControl fullWidth>
              <InputLabel>Brand</InputLabel>
              <Select
                value={vehicle.brand}
                label="Brand"
                onChange={(e) => {
                  const newDValues = [...serviceData.dValues];
                  newDValues[index].brand = e.target.value;
                  setServiceData((prev) => ({ ...prev, dValues: newDValues }));
                }}
              >
                {companyNames.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={vehicle.type}
                label="Type"
                onChange={(e) => {
                  const newDValues = [...serviceData.dValues];
                  newDValues[index].type = e.target.value;
                  setServiceData((prev) => ({ ...prev, dValues: newDValues }));
                }}
              >
                {vehicleTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Value"
              value={vehicle.value}
              onChange={(e) => {
                const newDValues = [...serviceData.dValues];
                newDValues[index].value = e.target.value;
                setServiceData((prev) => ({ ...prev, dValues: newDValues }));
              }}
            />
          </Card>
        ))}

        <div className="flex justify-center">
          <Button
            variant="contained"
            onClick={saveData}
            className="px-8 py-3 text-lg"
          >
            Save to Firebase
          </Button>
        </div>
      </div>
    </div>
  );
}
