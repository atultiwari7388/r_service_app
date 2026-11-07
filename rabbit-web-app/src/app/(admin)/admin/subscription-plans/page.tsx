"use client";

import React from "react";
import SubscriptionPlansManager from "@/components/admin/SubscriptionPlansManager";

export default function AdminSubscriptionPlansHubPage() {
  return (
    <SubscriptionPlansManager
      title="Subscription Plans Catalog"
      subtitle="Manage, create, and configure membership pricing packages for both Owners/Drivers (TrenoOps) and Mechanics."
    />
  );
}
