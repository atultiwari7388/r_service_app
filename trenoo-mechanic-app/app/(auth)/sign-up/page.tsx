"use client";

import React from "react";
import { useMechanicRegistration } from "@/lib/hooks/useMechanicRegistration";
import MechanicRegistrationView from "@/components/auth/MechanicRegistrationView";

export default function SignUpPage() {
  const registrationState = useMechanicRegistration();

  return <MechanicRegistrationView registrationState={registrationState} />;
}
