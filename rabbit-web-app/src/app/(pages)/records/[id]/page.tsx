"use client";

import { use, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContexts";

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

export default function RecordsDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const { user } = useAuth() || { user: null };

  useEffect(() => {
    if (!user?.uid || !id) return;

    const recordsQuery = query(
      collection(db, "Users", user.uid, "DataServices")
    );

    const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
      const recordsData: RecordData[] = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        vehicle: doc.data().vehicleDetails.companyName,
      })) as RecordData[];

      const matchedRecord = recordsData.find((record) => record.id === id);
      setRecord(matchedRecord || null);
    });

    return () => unsubscribe();
  }, [user, id]);

  if (!record) {
    return <div className="p-6 text-red-500">No record found.</div>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardContent>
          <Typography variant="h5" component="div">
            Record Details
          </Typography>
          <Typography variant="body1">
            <strong>Invoice Number:</strong> {record.invoice || "N/A"}
          </Typography>
          <Typography variant="body1">
            <strong>Date:</strong> {new Date(record.date).toLocaleDateString()}
          </Typography>
          <Typography variant="body1">
            <strong>Workshop Name:</strong> {record.workshopName}
          </Typography>
          <Typography variant="body1">
            <strong>Miles:</strong> {record.miles}
          </Typography>
          <Typography variant="body1">
            <strong>Services:</strong>
          </Typography>
          <List>
            {record.services.map((service) => (
              <ListItem key={service.serviceId}>
                <ListItemText
                  primary={service.serviceName}
                  secondary={`Next Notification: ${service.nextNotificationValue}`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </div>
  );
}
