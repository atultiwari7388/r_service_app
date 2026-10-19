"use client";

import React from "react";
import Link from "next/link";
import FormTextField from "@/components/auth/FormTextField";
import { UseMechanicRegistrationReturn } from "@/lib/hooks/useMechanicRegistration";

export interface MechanicRegistrationViewProps {
  registrationState: UseMechanicRegistrationReturn;
}

/**
 * MechanicRegistrationView
 * Recreates the Flutter registration_screen.dart:
 * - Two circular decorative blur curves (top-left kPrimary 0.3, bottom-right kSecondary 0.3)
 * - Centered "Sign up" title in kPrimary (#F96176)
 * - Fields with exact Flutter MaterialCommunityIcons equivalents:
 *   - Your Name* (account)
 *   - Workshop Name* (store)
 *   - Cell Phone* (phone)
 *   - Telephone (phone_classic)
 *   - Your Email* (email)
 *   - Address (home)
 *   - City* (city)
 *   - State* (map_marker)
 *   - Country* (earth)
 *   - Postal / Zip Code (zip_box)
 *   - Date of Birth (cake) with DOB format: (DD/MM/YYYY) hint
 *   - Experience (in years) (briefcase)
 *   - Description (text)
 *   - Password (security) with toggle visibility
 * - "Select Languages You Speak" scrollable checkbox list (English, Hindi, Punjabi, Spanish, etc.)
 * - "By continuing, you agree to our Terms of Services and Privacy Policy."
 * - "Create Account" button (kPrimary) with loading state
 * - "Joined us before? Login" redirect row
 */
export function MechanicRegistrationView({
  registrationState,
}: MechanicRegistrationViewProps) {
  const {
    name,
    setName,
    workshopName,
    setWorkshopName,
    cellPhone,
    setCellPhone,
    telephone,
    setTelephone,
    email,
    setEmail,
    address,
    setAddress,
    city,
    setCity,
    state,
    setState,
    country,
    setCountry,
    postalCode,
    setPostalCode,
    dateOfBirth,
    setDateOfBirth,
    experience,
    setExperience,
    description,
    setDescription,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    languages,
    selectedLanguages,
    toggleLanguage,
    isLoading,
    isSuccess,
    handleSubmit,
  } = registrationState;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
        <div className="w-12 h-12 border-3 border-[#F96176] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Registration Successful!</h2>
        <p className="mt-2 text-xs text-gray-500 max-w-sm">
          A verification link has been sent to your email. Please verify your email before logging in.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex px-6 py-2.5 rounded-xl bg-[#F96176] text-white text-xs font-semibold shadow-xs hover:bg-[#e0485d] transition"
        >
          Proceed to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white overflow-hidden py-10">
      {/* Decorative Stack Circles */}
      <div
        className="pointer-events-none fixed -top-[100px] -left-[100px] w-[300px] h-[300px] rounded-full"
        style={{
          backgroundColor: "rgba(249, 97, 118, 0.3)",
          filter: "blur(20px)",
        }}
      />
      <div
        className="pointer-events-none fixed -bottom-[100px] -right-[100px] w-[300px] h-[300px] rounded-full"
        style={{
          backgroundColor: "rgba(88, 187, 135, 0.3)",
          filter: "blur(20px)",
        }}
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-normal text-[#F96176] tracking-tight">
            Sign up
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Register your workshop or mobile mechanic service
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-xs p-5 sm:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-4"
        >
          {/* Row 1: Name & Workshop Name (2 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <FormTextField
                id="reg-name"
                hintText="Your Name*"
                value={name}
                onChange={setName}
                icon="account"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <FormTextField
                id="reg-workshop"
                hintText="Workshop Name*"
                value={workshopName}
                onChange={setWorkshopName}
                icon="store"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Row 2: Cell Phone, Telephone & Email (3 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <FormTextField
                id="reg-cellphone"
                type="tel"
                hintText="Cell Phone*"
                value={cellPhone}
                onChange={setCellPhone}
                icon="phone"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <FormTextField
                id="reg-telephone"
                type="tel"
                hintText="Telephone"
                value={telephone}
                onChange={setTelephone}
                icon="phone_classic"
                disabled={isLoading}
              />
            </div>
            <div>
              <FormTextField
                id="reg-email"
                type="email"
                hintText="Your Email*"
                value={email}
                onChange={setEmail}
                icon="email"
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Row 3: Address & Postal Code (2 cols - 2/3 and 1/3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="md:col-span-2">
              <FormTextField
                id="reg-address"
                hintText="Address"
                value={address}
                onChange={setAddress}
                icon="home"
                disabled={isLoading}
              />
            </div>
            <div>
              <FormTextField
                id="reg-postal"
                hintText="Postal / Zip Code"
                value={postalCode}
                onChange={setPostalCode}
                icon="zip_box"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Row 4: City, State & Country (3 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <FormTextField
                id="reg-city"
                hintText="City*"
                value={city}
                onChange={setCity}
                icon="city"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <FormTextField
                id="reg-state"
                hintText="State*"
                value={state}
                onChange={setState}
                icon="map_marker"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <FormTextField
                id="reg-country"
                hintText="Country*"
                value={country}
                onChange={setCountry}
                icon="earth"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Row 5: Date of Birth, Experience & Password (3 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <FormTextField
                id="reg-dob"
                hintText="Date of Birth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                icon="cake"
                disabled={isLoading}
              />
              <span className="block text-[11px] text-[#83829A] pl-2 mt-0.5">
                DOB format: (DD/MM/YYYY)
              </span>
            </div>
            <div>
              <FormTextField
                id="reg-experience"
                type="number"
                hintText="Experience (in years)"
                value={experience}
                onChange={setExperience}
                icon="briefcase"
                disabled={isLoading}
              />
            </div>
            <div>
              <FormTextField
                id="reg-password"
                type="password"
                hintText="Password*"
                value={password}
                onChange={setPassword}
                icon="security"
                isPass
                obscureText={!showPassword}
                onToggleObscureText={toggleShowPassword}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Row 6: Description & Languages (2 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Description
              </label>
              <FormTextField
                id="reg-description"
                isMultiline
                rows={4}
                hintText="Describe your business in a few words"
                value={description}
                onChange={setDescription}
                icon="text"
                disabled={isLoading}
              />
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select Languages You Speak*
              </label>
              <div className="h-[120px] overflow-y-auto border border-gray-300 rounded-xl bg-white p-3 space-y-2">
                {languages.map((lang) => {
                  const checked = Boolean(selectedLanguages[lang]);
                  return (
                    <label
                      key={lang}
                      className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer select-none hover:text-gray-900"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLanguage(lang)}
                        className="w-4 h-4 rounded text-[#F96176] focus:ring-[#F96176] border-gray-300 cursor-pointer"
                      />
                      <span>{lang}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="pt-2 text-center">
            <p className="text-xs text-gray-700 leading-relaxed max-w-md mx-auto">
              By continuing, you agree to our{" "}
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Terms of Services: Treno Mechanic platform usage policies.");
                }}
                className="font-medium text-[#F96176] hover:underline cursor-pointer"
              >
                Terms of Services
              </a>{" "}
              and{" "}
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Privacy Policy: We protect your personal and location data.");
                }}
                className="font-medium text-[#F96176] hover:underline cursor-pointer"
              >
                Privacy Policy.
              </a>
            </p>
          </div>

          {/* Create Account Button */}
          <div className="pt-2 max-w-md mx-auto">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] rounded-xl bg-[#F96176] hover:bg-[#e0485d] text-white font-medium text-base shadow-md shadow-[#F96176]/20 transition-all flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>

          {/* Joined us before? Login */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-sm">
            <span className="text-gray-900 font-medium">Joined us before?</span>
            <Link
              href="/login"
              className="font-bold text-[#F96176] hover:underline cursor-pointer"
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MechanicRegistrationView;
