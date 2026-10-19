"use client";

import React from "react";
import { useMechanicRegistration } from "@/lib/hooks/useMechanicRegistration";
import MechanicRegistrationView from "@/components/auth/MechanicRegistrationView";

/**
 * SignUpPage
 * Clean orchestrator combining UI View (`MechanicRegistrationView`) and
 * Backend Logic Hook (`useMechanicRegistration`).
 * Replicates `rabbit_shop_app/lib/views/auth/registration_screen.dart`.
 */
export default function SignUpPage() {
  const registrationState = useMechanicRegistration();

  return <MechanicRegistrationView registrationState={registrationState} />;
}
