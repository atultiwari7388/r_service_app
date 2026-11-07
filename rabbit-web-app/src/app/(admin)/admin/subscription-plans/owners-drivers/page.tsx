"use client";

import React from "react";
import SubscriptionPlansManager from "@/components/admin/SubscriptionPlansManager";

export default function OwnersDriversPlansPage() {
  return (
    <SubscriptionPlansManager
      forcedType="trenoops"
      title="Subscription Plans — For Owners & Drivers"
      subtitle="Fleet management subscriptions for independent operators, motor carriers, and drivers (stored as type: 'trenoops')."
    />
  );
}
