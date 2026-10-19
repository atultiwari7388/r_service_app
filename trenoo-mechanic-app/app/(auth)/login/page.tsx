"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Truck,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"mechanic" | "customer">("mechanic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleFillDemo = (type: "mechanic" | "customer") => {
    if (type === "mechanic") {
      setRole("mechanic");
      setEmail("tech.alex@trenoo-mechanic.com");
      setPassword("MasterTech2026!");
    } else {
      setRole("customer");
      setEmail("fleet.manager@midwestlogistics.com");
      setPassword("FleetOwner2026!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login response
    setTimeout(() => {
      setIsLoading(false);
      setLoginSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1000);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] text-gray-900">
      {/* TopBar matching rabbit-web-app */}
      <TopBar />

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Background gradient decorative glows */}
        <div className="absolute top-1/4 left-1/4 -ml-20 w-80 h-80 rounded-full bg-[#FFEBF3]/70 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 -mr-20 w-80 h-80 rounded-full bg-[#58BB87]/15 blur-3xl pointer-events-none" />

        {/* Back to Home Link */}
        <div className="w-full max-w-md mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-[#F96176] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs text-gray-400 font-medium">
            Trenoo Auth Portal
          </span>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 relative z-10">
          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link href="/" className="mb-3 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#0B132B] to-[#1C2541] flex items-center justify-center p-2 shadow-md group-hover:scale-105 transition-transform">
                <Image
                  src="/logo-new.png"
                  alt="Trenoo Logo"
                  width={38}
                  height={38}
                  className="object-contain"
                />
              </div>
            </Link>

            <h2 className="text-2xl sm:text-3xl font-black text-[#0B132B] tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Sign in to your Trenoo Mechanic account
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F3F4F8] rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setRole("mechanic")}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                role === "mechanic"
                  ? "bg-white text-[#F96176] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Wrench size={16} />
              <span>Technician</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                role === "customer"
                  ? "bg-white text-[#0B132B] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Truck size={16} />
              <span>Vehicle / Fleet</span>
            </button>
          </div>

          {/* Quick Demo Autofill Pill */}
          <div className="mb-6 p-2.5 rounded-xl bg-[#FFEBF3]/60 border border-[#F96176]/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F96176]">
              <Sparkles size={15} />
              <span>Quick UI Demo Fill:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleFillDemo("mechanic")}
                className="px-2 py-1 rounded-lg bg-white border border-[#F96176]/30 text-[11px] font-bold text-[#F96176] hover:bg-[#F96176] hover:text-white transition"
              >
                Mechanic
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("customer")}
                className="px-2 py-1 rounded-lg bg-white border border-gray-300 text-[11px] font-bold text-gray-700 hover:bg-gray-800 hover:text-white transition"
              >
                Fleet
              </button>
            </div>
          </div>

          {/* Success Message Banner */}
          {loginSuccess && (
            <div className="mb-5 p-3 rounded-xl bg-[#EAF8F1] border border-[#58BB87] text-[#58BB87] text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle size={18} />
              <span>Login authorized! Redirecting to dashboard...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                />
                <Mail
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("A password reset link will be sent to your email.");
                  }}
                  className="text-xs font-semibold text-[#F96176] hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                />
                <Lock
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#F96176] focus:ring-[#F96176]"
                />
                <span className="text-xs text-gray-600 font-medium">
                  Remember this device for 30 days
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-[#F96176]/30 hover:shadow-xl hover:shadow-[#F96176]/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In as {role === "mechanic" ? "Technician" : "Customer"}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Social Sign-In Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-semibold tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          {/* Alternative One-Click Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => alert("Google Auth integration ready.")}
              className="py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center justify-center gap-2 transition"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => alert("Phone SMS OTP ready.")}
              className="py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center justify-center gap-2 transition"
            >
              <span>📱 Phone OTP</span>
            </button>
          </div>

          {/* Footer Link to Register */}
          <div className="mt-8 text-center pt-4 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/sign-up"
                className="font-bold text-[#F96176] hover:underline"
              >
                Sign up as Mechanic or Fleet
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge at bottom */}
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck size={16} className="text-[#58BB87]" />
          <span>256-bit SSL Encrypted & Verified ASE Provider Network</span>
        </div>
      </div>
    </div>
  );
}
