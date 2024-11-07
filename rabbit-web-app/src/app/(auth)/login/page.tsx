"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LoginFormValues } from "./../../../types/auth";

const Login: React.FC = () => {
  const [formValues, setFormValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login Data:", formValues);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="form-control w-full">
            <label htmlFor="email" className="label">
              <span className="label-text text-gray-700">Email</span>
            </label>
            <input
              type="email"
              id="email"
              value={formValues.email}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900"
              required
            />
          </div>

          <div className="form-control w-full">
            <label htmlFor="password" className="label">
              <span className="label-text text-gray-700">Password</span>
            </label>
            <input
              type="password"
              id="password"
              value={formValues.password}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900"
              required
            />
            <div className="text-right mt-2">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#F96176] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="btn w-full"
            style={{
              backgroundColor: "#F96176",
              borderColor: "#F96176",
              color: "white",
            }}
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-4">
          Don’t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-[#F96176] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
