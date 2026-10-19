"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import LoginTextField from "@/components/auth/LoginTextField";
import { UseMechanicLoginReturn } from "@/lib/hooks/useMechanicLogin";

export interface MechanicLoginViewProps {
  loginState: UseMechanicLoginReturn;
}

export function MechanicLoginView({ loginState }: MechanicLoginViewProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    isLoading,
    loginSuccess,
    handleLogin,
  } = loginState;

  if (loginSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="w-10 h-10 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-700">
          Login Successful! Redirecting...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white overflow-hidden flex flex-col justify-center">
      {/* Background Decorative Circles matching Flutter Stack Positioned */}
      <div
        className="pointer-events-none absolute -top-[100px] -left-[100px] w-[300px] h-[300px] rounded-full"
        style={{
          backgroundColor: "rgba(249, 97, 118, 0.3)", // kPrimary withOpacity(0.3)
          filter: "blur(20px)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-[100px] -right-[100px] w-[300px] h-[300px] rounded-full"
        style={{
          backgroundColor: "rgba(88, 187, 135, 0.3)", // kSecondary withOpacity(0.3)
          filter: "blur(20px)",
        }}
      />

      {/* Main Scrollable Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-10 flex flex-col items-center">
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-48 h-36 sm:w-56 sm:h-44 flex items-center justify-center">
            <Image
              src="/assets/new_mechanic_splash.png"
              alt="Treno Mechanic Splash Logo"
              width={220}
              height={170}
              priority
              className="object-contain max-h-[170px] w-auto drop-shadow-sm"
              onError={(e) => {
                // Fallback to logo-new.png if splash fails to render
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes("logo-new.png")) {
                  target.src = "/logo-new.png";
                }
              }}
            />
          </div>

          <h1 className="mt-4 text-2xl font-medium text-[#F96176] tracking-tight">
            Mechanic Login
          </h1>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleLogin}
          className="w-full bg-white/80 backdrop-blur-xs rounded-t-[30px] px-2 sm:px-4 pt-2 pb-6 flex flex-col"
        >
          {/* Email ID Field */}
          <div className="space-y-1">
            <LoginTextField
              id="mechanic-email"
              type="email"
              hintText="Email ID"
              value={email}
              onChange={setEmail}
              icon="email"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1 mt-3">
            <LoginTextField
              id="mechanic-password"
              type="password"
              hintText="Password"
              value={password}
              onChange={setPassword}
              icon="security"
              isPass
              obscureText={!showPassword}
              onToggleObscureText={toggleShowPassword}
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end mt-2">
            <Link
              href="/forgot-password"
              className="text-sm font-bold text-[#F96176] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <div className="mt-8 px-0 sm:px-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-medium text-base shadow-md shadow-[#F96176]/20 transition-all flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Logging in...</span>
                </div>
              ) : (
                "Login"
              )}
            </button>
          </div>

          {/* New to Treno Mechanic? Register */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-sm">
            <span className="text-gray-900 font-medium">
              New to Treno Mechanic?
            </span>
            <Link
              href="/sign-up"
              className="font-bold text-[#F96176] hover:underline cursor-pointer"
            >
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MechanicLoginView;
