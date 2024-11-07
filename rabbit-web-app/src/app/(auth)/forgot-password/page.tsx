"use client";

import React, { useState } from "react";
import { ForgotPasswordFormValues } from "@/types/auth";
import Link from "next/link";

const ForgotPassword: React.FC = () => {
  const [formValues, setFormValues] = useState<ForgotPasswordFormValues>({
    email: "",
  });

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Forgot Password Data:", formValues);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

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
              value={formValues.email}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          <button
            type="submit"
            className="btn w-full mt-4"
            style={{
              backgroundColor: "#F96176",
              borderColor: "#F96176",
              color: "white",
            }}
          >
            Send Reset Link
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
