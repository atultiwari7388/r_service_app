"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyVehiclesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account/my-vehicles");
  }, [router]);

  return (
    <div className="py-24 text-center text-gray-400">
      Redirecting to My Vehicles...
    </div>
  );
}
