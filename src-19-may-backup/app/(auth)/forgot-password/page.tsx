"use client";

import React, { useState, useEffect } from "react";
import { ForgotPasswordFormValues } from "@/types/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import toast from "react-hot-toast";

const ForgotPassword: React.FC = () => {
  const [formValues, setFormValues] = useState<ForgotPasswordFormValues>({
    email: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formValues.email) {
      setError("Email is required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      setError("Please enter a valid email.");
      return;
    }

    setError(null); // Clear previous errors
    setLoading(true); // Show loading state

    try {
      // Call the Firebase method to send the password reset email
      await sendPasswordResetEmail(auth, formValues.email);
      setLoading(false);
      alert("Password reset link sent to your email.");
      toast.success("Password reset link sent to your email.");
    } catch (error) {
      setLoading(false);
      setError("Failed to send reset email. Please try again.");
      toast.error("Failed to send reset email. Please try again.");
      console.error("Error resetting password: ", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  // Check if the user is already logged in and redirect them
  const { user } = useAuth() || { user: null };
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [router, user]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
          Forgot Password
        </h2>
        <p className="text-sm text-center text-gray-600 mb-6">
          Enter your email address and we’ll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="form-control w-full">
            <label htmlFor="email" className="label text-sm">
              <span className="label-text text-gray-700">Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <button
            type="submit"
            className="btn w-full mt-4"
            style={{
              backgroundColor: "#F96176",
              borderColor: "#F96176",
              color: "white",
            }}
            disabled={loading}
          >
            {loading ? "Sending Reset Link..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-4">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-medium text-[#F96176] hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
