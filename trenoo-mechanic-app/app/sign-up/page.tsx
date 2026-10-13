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
  User,
  Phone,
  Building,
  ShieldCheck,
  CheckCircle,
  Truck,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Award,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<"mechanic" | "customer">("mechanic");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [specialty, setSpecialty] = useState("mobile-auto");
  const [aseCert, setAseCert] = useState("");
  const [serviceRadius, setServiceRadius] = useState("25");
  const [fleetSize, setFleetSize] = useState("1-5");
  const [cityState, setCityState] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const strength = getPasswordStrength();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] text-gray-900">
      {/* TopBar matching rabbit-web-app */}
      <TopBar />

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-1/6 right-1/4 -mr-20 w-96 h-96 rounded-full bg-[#FFEBF3]/80 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/6 left-1/4 -ml-20 w-96 h-96 rounded-full bg-[#58BB87]/15 blur-3xl pointer-events-none" />

        {/* Back Link */}
        <div className="w-full max-w-2xl mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-[#F96176] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs text-gray-400 font-medium">
            New Account Onboarding
          </span>
        </div>

        {/* Registration Card */}
        <div className="w-full max-w-2xl bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-100 relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-3 group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#0B132B] to-[#1C2541] flex items-center justify-center p-2 shadow-md group-hover:scale-105 transition-transform mx-auto">
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
              Create Your Trenoo Account
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Join thousands of certified mechanics, private drivers, and commercial fleets
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#F3F4F8] rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => setRole("mechanic")}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                role === "mechanic"
                  ? "bg-white text-[#F96176] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Wrench size={18} />
              <div className="text-left">
                <div className="font-extrabold">Service Technician</div>
                <div className="text-[10px] font-normal text-gray-500 hidden sm:block">
                  Earn up to $120/hr
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                role === "customer"
                  ? "bg-white text-[#0B132B] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Truck size={18} />
              <div className="text-left">
                <div className="font-extrabold">Driver / Fleet Manager</div>
                <div className="text-[10px] font-normal text-gray-500 hidden sm:block">
                  24/7 Mobile Dispatch
                </div>
              </div>
            </button>
          </div>

          {/* Success State Screen */}
          {isSuccess ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="h-16 w-16 rounded-full bg-[#EAF8F1] text-[#58BB87] flex items-center justify-center mx-auto shadow-md">
                <CheckCircle size={36} />
              </div>
              <h3 className="text-2xl font-black text-[#0B132B]">
                Account Successfully Created!
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Welcome to Trenoo Mechanic. Redirecting you to the sign-in portal...
              </p>
              <div className="pt-2">
                <span className="h-2 w-24 rounded-full bg-[#58BB87] inline-block animate-pulse" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Mercer"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                    />
                    <User
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="alex@trenoo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                    />
                    <Mail
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Phone Number & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Mobile Phone *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                    />
                    <Phone
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    City & State *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chicago, IL"
                      value={cityState}
                      onChange={(e) => setCityState(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                    />
                    <MapPin
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* ROLE SPECIFIC FIELDS */}
              {role === "mechanic" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Shop / Mobile Rig Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. Mercer Mobile Auto Repair"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                        />
                        <Building
                          size={18}
                          className="absolute left-3 top-3.5 text-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Primary Repair Specialty
                      </label>
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                      >
                        <option value="mobile-auto">General Mobile Auto Repair</option>
                        <option value="heavyduty-diesel">
                          Heavy-Duty Commercial Diesel / Semi
                        </option>
                        <option value="diagnostics-electrical">
                          Computer Diagnostics & Electrical
                        </option>
                        <option value="brakes-suspension">
                          Brakes, Suspension & Alignment
                        </option>
                        <option value="transmission-engine">
                          Engine Overhaul & Transmission
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        ASE Certification ID (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. ASE-A1-884920"
                          value={aseCert}
                          onChange={(e) => setAseCert(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                        />
                        <Award
                          size={18}
                          className="absolute left-3 top-3.5 text-[#58BB87]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Mobile Dispatch Radius
                      </label>
                      <select
                        value={serviceRadius}
                        onChange={(e) => setServiceRadius(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                      >
                        <option value="15">Within 15 Miles</option>
                        <option value="25">Within 25 Miles (Recommended)</option>
                        <option value="50">Within 50 Miles</option>
                        <option value="100">Highway Corridor / Regional</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                /* Customer / Fleet Fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Company / Fleet Name (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Midwest Freight Logistics"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                      />
                      <Building
                        size={18}
                        className="absolute left-3 top-3.5 text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Number of Vehicles
                    </label>
                    <select
                      value={fleetSize}
                      onChange={(e) => setFleetSize(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                    >
                      <option value="1">1 Vehicle (Personal)</option>
                      <option value="2-5">2 to 5 Vehicles</option>
                      <option value="6-20">6 to 20 Fleet Commercial</option>
                      <option value="20+">20+ Heavy Duty / Transport</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Create Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
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

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F96176] focus:bg-white transition"
                    />
                    <Lock
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                    <span>Password Strength:</span>
                    <span
                      className={
                        strength >= 3
                          ? "text-[#58BB87]"
                          : strength >= 2
                          ? "text-yellow-600"
                          : "text-red-500"
                      }
                    >
                      {strength >= 3 ? "Strong" : strength >= 2 ? "Medium" : "Weak"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full flex-1 rounded-full ${
                        strength >= 1 ? "bg-red-500" : "bg-transparent"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full ${
                        strength >= 2 ? "bg-yellow-500" : "bg-transparent"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full ${
                        strength >= 3 ? "bg-[#58BB87]" : "bg-transparent"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#F96176] focus:ring-[#F96176]"
                  />
                  <span className="text-xs text-gray-600 leading-normal">
                    I agree to the Trenoo Mechanic{" "}
                    <a href="#terms" className="text-[#F96176] font-bold hover:underline">
                      Terms of Service
                    </a>
                    ,{" "}
                    <a href="#privacy" className="text-[#F96176] font-bold hover:underline">
                      Privacy Policy
                    </a>
                    , and acknowledge the dispatch code of conduct.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F96176] to-[#e0485d] hover:from-[#e0485d] hover:to-[#DE4258] text-white font-extrabold text-base shadow-lg shadow-[#F96176]/30 hover:shadow-xl hover:shadow-[#F96176]/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-6"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Setting Up Your Account...</span>
                  </div>
                ) : (
                  <>
                    <span>
                      {role === "mechanic"
                        ? "Register as Certified Mechanic"
                        : "Create Driver / Fleet Account"}
                    </span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Link back to Login */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-[#F96176] hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* ASE Trust Note */}
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck size={16} className="text-[#58BB87]" />
          <span>ASE Certified & Background-Checked Mobile Network</span>
        </div>
      </div>
    </div>
  );
}
