"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authenticateMechanic } from "@/lib/services/authService";
import { LoginCredentials, LoginResult } from "@/types/auth";

export interface UseMechanicLoginReturn {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  isLoading: boolean;
  loginSuccess: boolean;
  errorMessage: string | null;
  handleLogin: (e?: React.FormEvent) => Promise<LoginResult | void>;
  validateInputs: () => boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useMechanicLogin(): UseMechanicLoginReturn {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const validateInputs = useCallback((): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      toast.error("Please enter a valid email");
      return false;
    }

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    return true;
  }, [email, password]);

  const handleLogin = useCallback(
    async (e?: React.FormEvent): Promise<LoginResult | void> => {
      if (e) e.preventDefault();
      setErrorMessage(null);

      if (!validateInputs()) {
        return;
      }

      setIsLoading(true);

      try {
        const credentials: LoginCredentials = {
          email: email.trim(),
          password,
        };

        const result = await authenticateMechanic(credentials);

        switch (result.status) {
          case "success":
            setLoginSuccess(true);
            toast.success("Login Successful");
            setTimeout(() => {
              router.push("/");
            }, 600);
            return result;

          case "email_not_verified":
            toast.error(
              result.message || "Please verify your email before logging in."
            );
            setErrorMessage(result.message || null);
            return result;

          case "customer_app_email":
            toast.error(
              result.message || "This email is already registered with the customer app."
            );
            setErrorMessage(result.message || null);
            return result;

          case "account_not_registered":
            toast.error("Mechanic profile not found. Redirecting to registration...");
            setTimeout(() => {
              router.push("/sign-up");
            }, 1200);
            return result;

          case "account_deactivated":
            toast.error("Your account is deactivated. Please contact admin.");
            setTimeout(() => {
              router.push("/admin-contact");
            }, 1200);
            return result;

          case "multi_device_restricted":
            toast.error(result.message || "Access restricted.");
            setErrorMessage(result.message || null);
            return result;

          case "error":
          default:
            toast.error(result.message || "Please enter valid inputs");
            setErrorMessage(result.message || null);
            return result;
        }
      } catch (err: any) {
        console.error("Login unexpected error:", err);
        const msg = err?.message || "Something went wrong. Please try again.";
        toast.error(msg);
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, validateInputs, router]
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    isLoading,
    loginSuccess,
    errorMessage,
    handleLogin,
    validateInputs,
  };
}
