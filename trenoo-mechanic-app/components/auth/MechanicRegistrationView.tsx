"use client";

import React from "react";
import Link from "next/link";
import {
  Globe,
  Wrench,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import FormTextField from "@/components/auth/FormTextField";
import { UseMechanicRegistrationReturn } from "@/lib/hooks/useMechanicRegistration";
import { SUPPORTED_PLAN_COUNTRIES } from "@/types/subscription";
import {
  COUNTRY_REGISTRATION_FIELDS,
  normalizeCountry,
} from "@/lib/countryFields";

export interface MechanicRegistrationViewProps {
  registrationState: UseMechanicRegistrationReturn;
}

export function MechanicRegistrationView({
  registrationState,
}: MechanicRegistrationViewProps) {
  const {
    mechanicCategory,
    setMechanicCategory,
    companyName,
    setCompanyName,
    countryRegistrationFields,
    setCountryRegistrationField,
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
        <div className="w-12 h-12 border-3 border-[#58BB87] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900">
          Account Created!
        </h2>
        <p className="mt-2 text-xs text-gray-500 max-w-sm">
          Taking you to subscription plan selection...
        </p>
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
          {/* Service Category Selection: Roadside Mechanic vs Registered Company */}
          <div className="space-y-2 pb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Select Registration Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Roadside Mechanic */}
              <button
                type="button"
                onClick={() => setMechanicCategory("roadside")}
                disabled={isLoading}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  mechanicCategory === "roadside"
                    ? "border-[#58BB87] bg-emerald-50/50 shadow-xs"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        mechanicCategory === "roadside"
                          ? "bg-[#58BB87] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Roadside Mechanic
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        Mobile & Roadside Service
                      </span>
                    </div>
                  </div>
                  {mechanicCategory === "roadside" ? (
                    <CheckCircle2 className="w-5 h-5 text-[#58BB87] shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  Independent mobile technician handling on-demand roadside & highway breakdowns. Register directly without commercial DOT authority numbers.
                </p>
              </button>

              {/* Option 2: Registered Company */}
              <button
                type="button"
                onClick={() => setMechanicCategory("company")}
                disabled={isLoading}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  mechanicCategory === "company"
                    ? "border-[#58BB87] bg-emerald-50/50 shadow-xs"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        mechanicCategory === "company"
                          ? "bg-[#58BB87] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Registered Company
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        Licensed Repair Shop / Fleet
                      </span>
                    </div>
                  </div>
                  {mechanicCategory === "company" ? (
                    <CheckCircle2 className="w-5 h-5 text-[#58BB87] shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  Licensed repair company, garage facility, or fleet service workshop with registered authority IDs (DOT, MC, NSC, etc.).
                </p>
              </button>
            </div>
          </div>

          {/* Roadside Info Pill */}
          {mechanicCategory === "roadside" && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#58BB87] shrink-0" />
              <span>
                Roadside mechanic mode selected: Quick onboarding with your workshop/trade name. No corporate registration numbers required.
              </span>
            </div>
          )}

          {/* Company Details Section (Rendered when Registered Company is selected) */}
          {mechanicCategory === "company" && (
            <div className="bg-gray-50/90 rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Company Details & Authority Registrations
                  </h3>
                  <p className="text-xs text-gray-500">
                    Provide your legal corporate entity credentials and regional transport authority IDs
                  </p>
                </div>
              </div>

              {/* Row: Company Name & Country Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Company Name */}
                <div>
                  <label
                    htmlFor="company-name-input"
                    className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                  >
                    Company Name *
                  </label>
                  <div className="relative flex items-center bg-white rounded-xl border border-gray-300 focus-within:border-[#58BB87] focus-within:ring-1 focus-within:ring-[#58BB87] transition shadow-xs">
                    <div className="pl-3.5 pr-2 flex items-center justify-center text-[#58BB87] shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      id="company-name-input"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Fleet Repairs & Services LLC"
                      disabled={isLoading}
                      required={mechanicCategory === "company"}
                      className="w-full py-3 pr-3 text-sm font-medium text-gray-900 bg-transparent outline-none disabled:opacity-50 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Country Dropdown */}
                <div>
                  <label
                    htmlFor="company-country-select"
                    className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                  >
                    Country *
                  </label>
                  <div className="relative flex items-center bg-white rounded-xl border border-gray-300 focus-within:border-[#58BB87] focus-within:ring-1 focus-within:ring-[#58BB87] transition shadow-xs">
                    <div className="pl-3.5 pr-2 flex items-center justify-center text-[#58BB87] shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <select
                      id="company-country-select"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={isLoading}
                      required
                      className="w-full py-3 pr-3 text-sm font-semibold text-gray-800 bg-transparent outline-none disabled:opacity-50 cursor-pointer"
                    >
                      {SUPPORTED_PLAN_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} - {c.name} ({c.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Country-Specific Registration Fields */}
              {COUNTRY_REGISTRATION_FIELDS[normalizeCountry(country)] &&
                COUNTRY_REGISTRATION_FIELDS[normalizeCountry(country)].length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                        Authority Registration Numbers ({normalizeCountry(country)})
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Transport & regional authority credentials
                      </span>
                    </div>

                    <div
                      className={`grid grid-cols-1 ${
                        COUNTRY_REGISTRATION_FIELDS[normalizeCountry(country)].length === 1
                          ? "sm:grid-cols-1"
                          : "sm:grid-cols-2"
                      } gap-3`}
                    >
                      {COUNTRY_REGISTRATION_FIELDS[normalizeCountry(country)].map(
                        (field) => (
                          <div key={field.key}>
                            <label
                              htmlFor={`field-${field.key}`}
                              className="block text-xs font-semibold text-gray-700 mb-1"
                            >
                              <span>{field.label}</span>{" "}
                              <span className="text-gray-400 font-normal text-[11px]">
                                ({field.optional ? "Optional" : "Required"})
                              </span>
                            </label>
                            <div className="relative flex items-center bg-white rounded-xl border border-gray-300 focus-within:border-[#58BB87] focus-within:ring-1 focus-within:ring-[#58BB87] transition shadow-xs">
                              <div className="pl-3 pr-2 flex items-center justify-center shrink-0">
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-mono font-bold">
                                  {field.badgeLabel}
                                </span>
                              </div>
                              <input
                                id={`field-${field.key}`}
                                type="text"
                                value={countryRegistrationFields[field.key] || ""}
                                onChange={(e) =>
                                  setCountryRegistrationField(field.key, e.target.value)
                                }
                                placeholder={field.placeholder}
                                disabled={isLoading}
                                className="w-full py-2.5 pr-3 text-sm font-medium text-gray-900 bg-transparent outline-none disabled:opacity-50 placeholder:text-gray-400"
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

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

          {/* Row 4: City, State & Country */}
          {mechanicCategory === "roadside" ? (
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
                <div className="my-1.5 w-full">
                  <div className="relative flex items-center bg-white rounded-xl border border-gray-300 focus-within:border-[#F96176] focus-within:ring-1 focus-within:ring-[#F96176] transition shadow-xs">
                    <div className="pl-3.5 pr-2 flex items-center justify-center text-[#F96176] shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <select
                      id="reg-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={isLoading}
                      required
                      className="w-full py-3.5 pr-3 text-sm font-semibold text-gray-800 bg-transparent outline-none disabled:opacity-50 cursor-pointer"
                    >
                      {SUPPORTED_PLAN_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} - {c.name} ({c.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
            </div>
          )}

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
                  alert(
                    "Terms of Services: Treno Mechanic platform usage policies."
                  );
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
                  alert(
                    "Privacy Policy: We protect your personal and location data."
                  );
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
                  <span className="text-sm font-medium">
                    Creating Account...
                  </span>
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
