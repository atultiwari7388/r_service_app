"use client";

import React from "react";
import { useForgotPassword } from "@/lib/hooks/useForgotPassword";
import ForgotPasswordView from "@/components/auth/ForgotPasswordView";

/**
 * ForgotPasswordPage
 * Clean orchestrator combining UI View (`ForgotPasswordView`) and
 * Backend Logic Hook (`useForgotPassword`).
 * Replicates `rabbit_shop_app/lib/views/auth/forgot_password.dart`.
 */
export default function ForgotPasswordPage() {
  const forgotState = useForgotPassword();

  return <ForgotPasswordView forgotState={forgotState} />;
}
