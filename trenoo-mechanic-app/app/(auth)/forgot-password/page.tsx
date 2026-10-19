"use client";

import React from "react";
import { useForgotPassword } from "@/lib/hooks/useForgotPassword";
import ForgotPasswordView from "@/components/auth/ForgotPasswordView";

export default function ForgotPasswordPage() {
  const forgotState = useForgotPassword();

  return <ForgotPasswordView forgotState={forgotState} />;
}
