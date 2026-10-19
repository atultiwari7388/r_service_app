"use client";

import React from "react";
import { useMechanicLogin } from "@/lib/hooks/useMechanicLogin";
import MechanicLoginView from "@/components/auth/MechanicLoginView";

export default function LoginPage() {
  const loginState = useMechanicLogin();

  return <MechanicLoginView loginState={loginState} />;
}
