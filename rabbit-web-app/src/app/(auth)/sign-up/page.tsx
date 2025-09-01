"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContexts";

const Signup: React.FC = () => {
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    phoneNumber: "",
    password: "",
    companyName: "",
    numberOfVehicles: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  // Auth state check
  const { user } = useAuth() || { user: null };

  // useEffect(() => {
  //   if (!user?.emailVerified) {
  //     router.push("/login");
  //   } else {
  //     router.push("/");
  //   }
  // }, [router, user]);

  useEffect(() => {
    if (!user) return; // no user → stay on signup page

    if (user.emailVerified) {
      // already signed in & verified → send to home
      router.push("/");
    } else {
      // signed in but not verified → ask them to login and verify
      router.push("/login");
    }
  }, [user, router]);

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
      !formValues.name ||
      !formValues.email ||
      !formValues.address ||
      !formValues.city ||
      !formValues.state ||
      !formValues.country ||
      !formValues.phoneNumber ||
      !formValues.password ||
      !formValues.companyName ||
      !formValues.numberOfVehicles
    ) {
      setError("All fields are required.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Firebase Auth: Create a new user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formValues.email,
        formValues.password
      );
      const user = userCredential.user;

      if (!user) {
        throw new Error("User creation failed - no user returned");
      }

      // Now check if email exists in collections
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
        email: formValues.email,
        email2: "",
        active: true,
        isAnonymous: false,
        isProfileComplete: true,
        userName: formValues.name,
        phoneNumber: formValues.phoneNumber,
        telephoneNumber: "",
        address: formValues.address,
        city: formValues.city,
        state: formValues.state,
        country: formValues.country,
        postalCode: "",
        licNumber: "",
        licExpDate: new Date(),
        dob: new Date(),
        lastDrugTest: new Date(),
        dateOfHire: new Date(),
        dateOfTermination: new Date(),
        socialSecurity: "",
        perMileCharge: "",
        companyName: formValues.companyName,
        vehicleRange: formValues.numberOfVehicles,
        profilePicture:
          "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
        wallet: 0,
        created_at: new Date(),
        updated_at: new Date(),
        createdBy: uid,
        isTeamMember: false,
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
      };

      // Save user data in Firestore
      await setDoc(doc(db, "Users", uid), userData);
      // Send email verification
      await sendEmailVerification(user);
      router.push("/login");

      setLoading(false);
      alert(
        "Signup successful! Please check your email for verification. If you have not received the email, also check your spam folder."
      );
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
            errorMessage = "Email/password accounts are not enabled.";
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
          Sign Up
        </h2>

        <form onSubmit={handleSignup} className="space-y-3">
          <div className="form-control w-full">
            <label htmlFor="name" className="label text-sm">
              <span className="label-text text-gray-700">Name</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          <div className="form-control w-full">
            <label htmlFor="email" className="label text-sm">
              <span className="label-text text-gray-700">Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          <div className="form-control w-full">
            <label htmlFor="companyName" className="label text-sm">
              <span className="label-text text-gray-700">Company Name</span>
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formValues.companyName}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          <div className="form-control w-full">
            <label htmlFor="address" className="label text-sm">
              <span className="label-text text-gray-700">Address</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formValues.address}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          <div className="form-control w-full">
            <label htmlFor="city" className="label text-sm">
              <span className="label-text text-gray-700">City</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formValues.city}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          <div className="form-control w-full">
            <label htmlFor="state" className="label text-sm">
              <span className="label-text text-gray-700">State</span>
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formValues.state}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          <div className="form-control w-full">
            <label htmlFor="country" className="label text-sm">
              <span className="label-text text-gray-700">Country</span>
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formValues.country}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          <div className="form-control w-full">
            <label htmlFor="phone-number" className="label text-sm">
              <span className="label-text text-gray-700">Phone Number</span>
            </label>
            <input
              type="tel"
              id="phone-number"
              name="phoneNumber"
              value={formValues.phoneNumber}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          <div className="form-control w-full">
            <label htmlFor="numberOfVehicles" className="label text-sm">
              <span className="label-text text-gray-700">
                Number of Vehicles
              </span>
            </label>
            <select
              id="numberOfVehicles"
              name="numberOfVehicles"
              value={formValues.numberOfVehicles}
              onChange={handleChange}
              className="select select-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            >
              <option value="">Select range</option>
              {vehicleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control w-full">
            <label htmlFor="password" className="label text-sm">
              <span className="label-text text-gray-700">Password</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900 py-1.5"
              required
            />
          </div>

          <Button
            type="submit"
            className="btn w-full mt-3"
            style={{
              backgroundColor: "#F96176",
              borderColor: "#F96176",
              color: "white",
            }}
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default Signup;
