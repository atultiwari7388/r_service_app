"use client";

import { TripDetailsComp } from "@/components/trips/TripDetailsComp";
import { useParams, useSearchParams } from "next/navigation";

export default function TripDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const tripId = params.tripId as string;
  const userId = searchParams.get("userId");

  console.log("tripId:", tripId);
  console.log("userId:", userId);

  return (
    <div>
      <TripDetailsComp tripId={tripId} userId={userId || ""} />
    </div>
  );
}
