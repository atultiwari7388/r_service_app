"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import {
  FaUser,
  FaBuilding,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaTruck,
  FaMapMarkerAlt,
  FaCity,
  FaGlobeAmericas,
} from "react-icons/fa";

const Signup: React.FC = () => {
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    numberOfVehicles: "",
    companyName: "",
    dot: "",
    mc: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const countryOptions = [
    "USA",
    "Canada",
    "England",
    "Australia",
    "Mexico",
  ];

  const vehicleOptions = [
    "1 to 5",
    "1 to 10",
    "1 to 20",
    "1 to 30",
    "1 to 50",
    "1 to 100",
    "1 to 200",
    "1 to 500",
    "above 500",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formValues.name.trim() ||
      !formValues.email.trim() ||
      !formValues.phoneNumber.trim() ||
      !formValues.password ||
      !formValues.numberOfVehicles ||
      !formValues.companyName.trim() ||
      !formValues.address.trim() ||
      !formValues.city.trim() ||
      !formValues.state.trim() ||
      !formValues.country.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (formValues.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Firebase Auth: Create a new user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formValues.email.trim(),
        formValues.password
      );
      const user = userCredential.user;

      if (!user) {
        throw new Error("User creation failed - no user returned");
      }

      // Check if email exists in collections
      const emailToCheck = formValues.email.trim().toLowerCase();
      let shouldDeleteUser = false;

      // Check Users collection
      const usersQuery = query(
        collection(db, "Users"),
        where("email", "==", emailToCheck)
      );
      const usersSnapshot = await getDocs(usersQuery);
      if (!usersSnapshot.empty) {
        shouldDeleteUser = true;
        toast.error("This email is already registered. Try to login.");
      }

      // Check Mechanics collection
      const mechanicsQuery = query(
        collection(db, "Mechanics"),
        where("email", "==", emailToCheck)
      );
      const mechanicsSnapshot = await getDocs(mechanicsQuery);
      if (!mechanicsSnapshot.empty) {
        shouldDeleteUser = true;
        toast.error("This email is registered with a mechanic account.");
      }

      // If email exists in any collection, delete the auth user we just created
      if (shouldDeleteUser) {
        await deleteUser(user);
        setLoading(false);
        return;
      }

      // Store additional user details in Firestore
      const uid = user.uid;
      const userData = {
        uid: uid,
        status: "active",
        email: formValues.email.trim(),
        email2: "",
        active: true,
        isAnonymous: false,
        isProfileComplete: true,
        userName: formValues.name.trim(),
        phoneNumber: formValues.phoneNumber.trim(),
        telephoneNumber: "",
        address: formValues.address.trim(),
        city: formValues.city.trim(),
        state: formValues.state.trim(),
        country: formValues.country.trim(),
        dot: formValues.dot.trim() || "",
        mc: formValues.mc.trim() || "",
        postalCode: "",
        licNumber: "",
        licExpDate: new Date(),
        dob: new Date(),
        lastDrugTest: new Date(),
        dateOfHire: new Date(),
        dateOfTermination: new Date(),
        socialSecurity: "",
        perMileCharge: "",
        companyName: formValues.companyName.trim(),
        vehicleRange: formValues.numberOfVehicles,
        profilePicture:
          "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
        wallet: 0,
        created_at: new Date(),
        updated_at: new Date(),
        createdBy: uid,
        isTeamMember: false,
        isMultiDeEnable: false,
        lastAddress: "",
        isNotificationOn: true,
        role: "Owner",
        teamMembers: [],
        isOwner: true,
        isManager: false,
        isDriver: false,
        isVendor: false,
        isView: true,
        isCheque: true,
        payMode: "",
        isEdit: true,
        isDelete: true,
        isAdd: true,
        currentDeviceId: null,
        createdFrom: "web",
        lastLogin: new Date(),
      };

      // Save user data in Firestore
      await setDoc(doc(db, "Users", uid), userData);

      // Save initial company in myCompanies subcollection
      if (formValues.companyName.trim()) {
        await addDoc(collection(db, "Users", uid, "myCompanies"), {
          companyName: formValues.companyName.trim(),
          dot: formValues.dot.trim() || "",
          mc: formValues.mc.trim() || "",
          address: formValues.address.trim(),
          city: formValues.city.trim(),
          state: formValues.state.trim(),
          country: formValues.country.trim(),
          isDefault: true,
          isActive: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // Send email verification
      await sendEmailVerification(user);

      // Sign out the user after creation
      await auth.signOut();

      setLoading(false);
      setShowEmailPopup(true);
    } catch (error: unknown | string) {
      console.error("Error during signup:", error);

      let errorMessage = "An error occurred during signup. Please try again.";

      if (typeof error === "object" && error !== null && "code" in error) {
        const err = error as { code: string; message?: string };
        switch (err.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email is already in use by another account.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
          case "auth/operation-not-allowed":
            errorMessage =
              "Email/password accounts are not enabled. Please contact support.";
            break;
          case "auth/weak-password":
            errorMessage =
              "The password is too weak (should be at least 6 characters).";
            break;
          case "auth/network-request-failed":
            errorMessage =
              "Network error. Please check your internet connection.";
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handlePopupClose = () => {
    setShowEmailPopup(false);
    router.push("/login");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign up as a Fleet Owner to manage vehicles, dispatch, and maintenance
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          <form onSubmit={handleSignup} className="space-y-8">
            {/* ================= 1. PERSONAL DETAILS SECTION ================= */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="p-2 rounded-lg bg-[#F96176]/10 text-[#F96176]">
                  <FaUser className="text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Personal Details
                  </h3>
                  <p className="text-xs text-gray-500">
                    Your personal profile and login credentials
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaUser className="text-sm" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formValues.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaEnvelope className="text-sm" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="john@example.com"
                      value={formValues.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaPhone className="text-sm" />
                    </div>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="1234567890"
                      value={formValues.phoneNumber}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaLock className="text-sm" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      value={formValues.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Number of Vehicles */}
                <div>
                  <label htmlFor="numberOfVehicles" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Number of Vehicles *
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaTruck className="text-sm" />
                    </div>
                    <select
                      id="numberOfVehicles"
                      name="numberOfVehicles"
                      value={formValues.numberOfVehicles}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                      required
                    >
                      <option value="">Select vehicle range</option>
                      {vehicleOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= 2. COMPANY DETAILS SECTION ================= */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="p-2 rounded-lg bg-[#F96176]/10 text-[#F96176]">
                  <FaBuilding className="text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Company Details
                  </h3>
                  <p className="text-xs text-gray-500">
                    Primary company information and credentials
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Company Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="companyName" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Company Name *
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaBuilding className="text-sm" />
                    </div>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      placeholder="Apex Freight Logistics LLC"
                      value={formValues.companyName}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* DOT (Optional) */}
                <div>
                  <label htmlFor="dot" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    DOT Number <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="dot"
                    name="dot"
                    placeholder="e.g. 1234567"
                    value={formValues.dot}
                    onChange={handleChange}
                    className="block w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                  />
                </div>

                {/* MC (Optional) */}
                <div>
                  <label htmlFor="mc" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    MC Number <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="mc"
                    name="mc"
                    placeholder="e.g. MC-987654"
                    value={formValues.mc}
                    onChange={handleChange}
                    className="block w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                  />
                </div>

                {/* Street Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Street Address *
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaMapMarkerAlt className="text-sm" />
                    </div>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      placeholder="123 Logistics Parkway"
                      value={formValues.address}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaCity className="text-sm" />
                    </div>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      placeholder="Dallas"
                      value={formValues.city}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    placeholder="TX"
                    value={formValues.state}
                    onChange={handleChange}
                    className="block w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                    required
                  />
                </div>

                {/* Country Dropdown */}
                <div className="sm:col-span-2">
                  <label htmlFor="country" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Country *
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaGlobeAmericas className="text-sm" />
                    </div>
                    <select
                      id="country"
                      name="country"
                      value={formValues.country}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                      required
                    >
                      <option value="">Select country</option>
                      {countryOptions.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                isLoading={loading}
                className="w-full py-3 px-4 bg-[#F96176] hover:bg-[#e05065] text-white font-bold rounded-xl shadow-md transition-colors"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold text-[#F96176] hover:underline"
              >
                Log In
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Email Verification Popup */}
      {showEmailPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              <FaEnvelope />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Verify Your Email
            </h3>
            <p className="text-sm text-gray-600">
              A verification email has been sent to{" "}
              <span className="font-semibold text-gray-900">
                {formValues.email}
              </span>
              . Please check your inbox and verify your email before logging in.
            </p>
            <Button
              onClick={handlePopupClose}
              className="w-full bg-[#F96176] hover:bg-[#e05065] text-white font-semibold rounded-xl"
            >
              Go to Login
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
