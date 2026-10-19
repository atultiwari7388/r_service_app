"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import LoginTextField from "@/components/auth/LoginTextField";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setIsSent(true);
      toast.success("Password reset email sent successfully");
    } catch (err: any) {
      console.error("Password reset error:", err);
      toast.error(err?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white overflow-hidden flex flex-col justify-center">
      {/* Decorative Circles */}
      <div
        className="pointer-events-none absolute -top-[100px] -left-[100px] w-[300px] h-[300px] rounded-full"
        style={{
          backgroundColor: "rgba(249, 97, 118, 0.3)",
          filter: "blur(20px)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-[100px] -right-[100px] w-[300px] h-[300px] rounded-full"
        style={{
          backgroundColor: "rgba(88, 187, 135, 0.3)",
          filter: "blur(20px)",
        }}
      />

      {/* Back button */}
      <div className="absolute top-8 left-6 sm:left-12 z-20">
        <Link
          href="/login"
          className="p-2 rounded-full hover:bg-gray-100 transition inline-flex items-center text-gray-800"
          aria-label="Back to login"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-10">
        <h1 className="text-3xl font-normal text-[#F96176] leading-tight">
          Forgot <br /> Password?
        </h1>
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
          Don&apos;t worry it happens. Please enter the address associated with your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <LoginTextField
            id="forgot-email"
            type="email"
            hintText="Email ID"
            value={email}
            onChange={setEmail}
            icon="email"
            disabled={isLoading || isSent}
          />

          <button
            type="submit"
            disabled={isLoading || isSent}
            className="w-full h-[48px] rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-medium text-base shadow-md shadow-[#F96176]/20 transition-all flex items-center justify-center cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSent ? (
              "Email Sent!"
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
