"use client";

import React from "react";
import SubscriptionPlansManager from "@/components/admin/SubscriptionPlansManager";

export default function MechanicsPlansPage() {
  return (
    <SubscriptionPlansManager
      forcedType="treno_mechanic"
      title="Subscription Plans — For Mechanics & Workshops"
      subtitle="Repair station, mobile technician, and service bay subscriptions (stored as type: 'treno_mechanic')."
    />
  );
}
