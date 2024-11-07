"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SignupFormValues } from "@/types/auth";

const Signup: React.FC = () => {
  // Step 1: Initialize form values state
  const [formValues, setFormValues] = useState<SignupFormValues>({
    name: "",
    email: "",
    address: "",
    phoneNumber: "",
    password: "",
  });

  // Step 2: Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  // Step 3: Handle form submission
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup Data:", formValues);
    // You can replace the console log with the API call to submit data to your backend
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
          Sign Up
        </h2>

        <form onSubmit={handleSignup} className="space-y-3">
          {/* Name Input */}
          <div className="form-control w-full">
            <label htmlFor="name" className="label text-sm">
              <span className="label-text text-gray-700">Name</span>
            </label>
            <input
              type="text"
              id="name"
              name="name" // Ensure 'name' is used for correct mapping
              value={formValues.name}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          {/* Email Input */}
          <div className="form-control w-full">
            <label htmlFor="email" className="label text-sm">
              <span className="label-text text-gray-700">Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email" // Ensure 'name' is used for correct mapping
              value={formValues.email}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          {/* Address Input */}
          <div className="form-control w-full">
            <label htmlFor="address" className="label text-sm">
              <span className="label-text text-gray-700">Address</span>
            </label>
            <input
              type="text"
              id="address"
              name="address" // Ensure 'name' is used for correct mapping
              value={formValues.address}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          {/* Phone Number Input */}
          <div className="form-control w-full">
            <label htmlFor="phone-number" className="label text-sm">
              <span className="label-text text-gray-700">Phone Number</span>
            </label>
            <input
              type="tel"
              id="phone-number"
              name="phoneNumber" // Ensure 'name' is used for correct mapping
              value={formValues.phoneNumber}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          {/* Password Input */}
          <div className="form-control w-full">
            <label htmlFor="password" className="label text-sm">
              <span className="label-text text-gray-700">Password</span>
            </label>
            <input
              type="password"
              id="password"
              name="password" // Ensure 'name' is used for correct mapping
              value={formValues.password}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          {/* Terms and Privacy */}
          <p className="text-xs text-center text-gray-600 mt-2">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-[#F96176] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#F96176] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn w-full mt-3"
            style={{
              backgroundColor: "#F96176",
              borderColor: "#F96176",
              color: "white",
            }}
          >
            Next
          </button>
        </form>

        {/* Login Link */}
        <p className="text-sm text-center text-gray-600 mt-4">
          Already have an account?{" "}
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

export default Signup;
