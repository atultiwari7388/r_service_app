"use client";

// import { useAuth } from "@/contexts/AuthContexts";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function MyVehicleDetailsScreen() {
  // const { user } = useAuth() || { user: null };
  const params = useParams();

  const vehicleId = params?.vehicleId;

  useEffect(() => {
    console.log("My Vehicle Id is ", vehicleId);
  }, [vehicleId]);

  if (!vehicleId) {
    return <LoadingIndicator />;
  }

  return <div>My Vehicle Details Screen: {vehicleId}</div>;
}
