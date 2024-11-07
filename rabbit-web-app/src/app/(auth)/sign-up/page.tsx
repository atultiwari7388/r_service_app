"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SignupFormValues } from "@/types/auth";

const Signup: React.FC = () => {
  const [formValues, setFormValues] = useState<SignupFormValues>({
    name: "",
    email: "",
    address: "",
    phoneNumber: "",
    password: "",
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup Data:", formValues);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
          Sign Up
        </h2>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Each input field with `name` matching the interface keys */}
          <input
            type="text"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            placeholder="Name"
            required
          />
          {/* Repeat for each field */}

          <button
            type="submit"
            className="btn w-full mt-4"
            style={{
              backgroundColor: "#F96176",
              borderColor: "#F96176",
              color: "white",
            }}
          >
            Sign Up
          </button>
        </form>

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
