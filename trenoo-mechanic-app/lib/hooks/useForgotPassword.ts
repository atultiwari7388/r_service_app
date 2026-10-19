"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { resetPasswordWithEmail } from "@/lib/services/authService";

export interface UseForgotPasswordReturn {
  email: string;
  setEmail: (v: string) => void;
  isLoading: boolean;
  isSent: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<boolean>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useForgotPassword(): UseForgotPasswordReturn {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      if (e) e.preventDefault();

      const trimmed = email.trim();
      if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
        toast.error("Please enter a valid email");
        return false;
      }

      setIsLoading(true);
      try {
        const res = await resetPasswordWithEmail(trimmed);
        if (res.success) {
          setIsSent(true);
          toast.success(res.message);
          return true;
        } else {
          toast.error(res.message);
          return false;
        }
      } catch (err: any) {
        console.error("Forgot password error:", err);
        toast.error(err?.message || "Failed to send reset email");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [email]
  );

  return {
    email,
    setEmail,
    isLoading,
    isSent,
    handleSubmit,
  };
}
