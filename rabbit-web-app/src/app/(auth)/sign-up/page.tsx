"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useLoadScript } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode } from "use-places-autocomplete";
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
  FaInfoCircle,
  FaCheckCircle,
} from "react-icons/fa";

const GOOGLE_LIBRARIES: "places"[] = ["places"];

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressSelect: (details: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }) => void;
  disabled?: boolean;
}

const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  value,
  onChange,
  onAddressSelect,
  disabled,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    ready,
    suggestions: { status, data },
    setValue: setPlacesValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: ["us", "ca", "gb", "au", "mx"] },
    },
    debounce: 300,
    defaultValue: value,
  });

  // Sync external value
  useEffect(() => {
    setPlacesValue(value, false);
  }, [value, setPlacesValue]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    setPlacesValue(e.target.value);
    setShowDropdown(true);
  };

  const handleSelect = async (description: string) => {
    setShowDropdown(false);
    clearSuggestions();
    setPlacesValue(description, false);

    try {
      const results = await getGeocode({ address: description });
      if (results && results[0]) {
        const components = results[0].address_components;
        let streetNumber = "";
        let route = "";
        let city = "";
        let state = "";
        let country = "";
        let postalCode = "";

        components.forEach((c) => {
          const types = c.types;
          if (types.includes("street_number")) {
            streetNumber = c.long_name;
          }
          if (types.includes("route")) {
            route = c.long_name;
          }
          if (
            types.includes("locality") ||
            types.includes("sublocality") ||
            types.includes("postal_town")
          ) {
            city = c.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = c.short_name; // e.g. "TX", "CA"
          }
          if (types.includes("country")) {
            if (c.short_name === "US" || c.long_name === "United States") {
              country = "USA";
            } else if (c.short_name === "CA" || c.long_name === "Canada") {
              country = "Canada";
            } else if (c.short_name === "GB" || c.long_name === "United Kingdom") {
              country = "England";
            } else if (c.short_name === "AU" || c.long_name === "Australia") {
              country = "Australia";
            } else if (c.short_name === "MX" || c.long_name === "Mexico") {
              country = "Mexico";
            } else {
              country = c.long_name;
            }
          }
          if (types.includes("postal_code")) {
            postalCode = c.long_name;
          }
        });

        const fullStreet = streetNumber
          ? `${streetNumber} ${route}`
          : route || description.split(",")[0];

        onAddressSelect({
          address: fullStreet || description,
          city,
          state,
          country,
          postalCode,
        });
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      onAddressSelect({
        address: description,
        city: "",
        state: "",
        country: "",
        postalCode: "",
      });
    }
  };

  return (
    <div ref={containerRef} className="relative rounded-lg shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
        <FaMapMarkerAlt className="text-sm" />
      </div>
      <input
        type="text"
        id="address"
        name="address"
        placeholder="Start typing street address (e.g. 123 Main St...)"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        disabled={disabled || !ready}
        className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent transition"
        required
      />

      {/* Autocomplete Dropdown */}
      {showDropdown && status === "OK" && data.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
          {data.map(({ place_id, description, structured_formatting }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="px-4 py-2.5 hover:bg-red-50/60 cursor-pointer flex items-start gap-2.5 text-xs transition"
            >
              <FaMapMarkerAlt className="text-[#F96176] mt-0.5 shrink-0 text-sm" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-gray-900">
                  {structured_formatting?.main_text || description}
                </span>
                <span className="text-gray-500 text-[11px]">
                  {structured_formatting?.secondary_text || ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

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
    postalCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGuestUpgrade, setIsGuestUpgrade] = useState(false);
  const router = useRouter();

  // Load Google Maps Places script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey:
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "",
    libraries: GOOGLE_LIBRARIES,
  });

  const handleAddressSelect = (details: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }) => {
    setFormValues((prev) => ({
      ...prev,
      address: details.address || prev.address,
      city: details.city || prev.city,
      state: details.state || prev.state,
      country: details.country || prev.country,
      postalCode: details.postalCode || prev.postalCode,
    }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        let phone = currentUser.phoneNumber || "";

        // Fallback to Firestore Users/{uid} if not on auth object
        if (!phone) {
          try {
            const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
            if (userDoc.exists()) {
              phone = userDoc.data()?.phoneNumber || "";
            }
          } catch (err) {
            console.warn("Could not fetch user document for phone number:", err);
          }
        }

        if (phone || currentUser.isAnonymous) {
          setIsGuestUpgrade(true);
          if (phone) {
            setFormValues((prev) => ({
              ...prev,
              phoneNumber: phone,
            }));
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

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
      let user = auth.currentUser;

      // If user is currently logged in via Guest Phone Auth, link credentials
      if (user && (user.isAnonymous || user.phoneNumber)) {
        try {
          const credential = EmailAuthProvider.credential(
            formValues.email.trim(),
            formValues.password
          );
          const userCredential = await linkWithCredential(user, credential);
          user = userCredential.user;
        } catch (linkErr: unknown) {
          console.warn("Account link error, falling back to new account:", linkErr);
          // If already linked or error, create fresh user
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formValues.email.trim(),
            formValues.password
          );
          user = userCredential.user;
        }
      } else {
        // Create fresh user with email and password
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formValues.email.trim(),
          formValues.password
        );
        user = userCredential.user;
      }

      if (!user) {
        throw new Error("User creation failed - no user returned");
      }

      // Check if UID is already registered as a Mechanic
      try {
        const mechanicDoc = await getDoc(doc(db, "Mechanics", user.uid));
        if (mechanicDoc.exists()) {
          await auth.signOut();
          setError("This email is registered with a mechanic account. Please try with another email.");
          setLoading(false);
          return;
        }
      } catch (mechanicCheckErr) {
        console.warn("Mechanic check skipped or not found:", mechanicCheckErr);
      }

      // Store / update user details in Firestore
      const uid = user.uid;
      const userData = {
        uid: uid,
        status: "active",
        email: formValues.email.trim(),
        email2: "",
        active: true,
        isAnonymous: false,
        isGuest: false,
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
        postalCode: formValues.postalCode.trim() || "",
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

      // Save user data in Firestore (merge in case guest data existed)
      await setDoc(doc(db, "Users", uid), userData, { merge: true });

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
          postalCode: formValues.postalCode.trim() || "",
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
          case "auth/credential-already-in-use":
            errorMessage = "An account already exists with this email.";
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
            {isGuestUpgrade ? "Upgrade to Fleet Owner" : "Create Your Account"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isGuestUpgrade
              ? "Complete your profile to unlock full fleet management, live dispatch, and vehicle tracking"
              : "Sign up as a Fleet Owner to manage vehicles, dispatch, and maintenance"}
          </p>
        </div>

        {isGuestUpgrade && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-sm">
            <FaInfoCircle className="text-amber-500 text-lg mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-amber-900">
              <span className="font-bold">Guest Account Detected:</span> We will link your verified phone number (<strong>{formValues.phoneNumber}</strong>) so all your previous jobs and breakdown history are preserved.
            </div>
          </div>
        )}

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
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="phoneNumber"
                      className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      Phone Number *
                    </label>
                    {isGuestUpgrade && formValues.phoneNumber && (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <FaCheckCircle className="text-xs" /> Verified (Linked)
                      </span>
                    )}
                  </div>
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

                {/* Street Address with Google Places Autocomplete */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="address" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Street Address *
                    </label>
                    {isLoaded && (
                      <span className="text-[10px] text-gray-400 font-normal flex items-center gap-1">
                        <FaMapMarkerAlt className="text-[#F96176]" /> Powered by Google Places
                      </span>
                    )}
                  </div>
                  {isLoaded ? (
                    <AddressAutocompleteInput
                      value={formValues.address}
                      onChange={handleChange}
                      onAddressSelect={handleAddressSelect}
                    />
                  ) : (
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
                  )}
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

                {/* Postal / Zip Code */}
                <div>
                  <label htmlFor="postalCode" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Postal / Zip Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    placeholder="e.g. 75201"
                    value={formValues.postalCode}
                    onChange={handleChange}
                    className="block w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F96176] focus:border-transparent"
                  />
                </div>

                {/* Country Dropdown */}
                <div>
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
