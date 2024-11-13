"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContexts";

const Signup: React.FC = () => {
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    address: "",
    phoneNumber: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Auth state check
  const { user } = useAuth() || { user: null };

  useEffect(() => {
    if (user) {
      if (user.emailVerified) {
        router.push("/"); // Redirect if user is already verified
      } else {
        router.push("/login"); // Redirect if user is not verified
      }
    }
  }, [router, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      !formValues.phoneNumber ||
      !formValues.password
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

      if (user) {
        // Store additional user details in Firestore
        const uid = user.uid;
        const userData = {
          uid: uid,
          email: formValues.email,
          active: true,
          userName: formValues.name,
          phoneNumber: formValues.phoneNumber,
          address: formValues.address,
          profilePicture:
            "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
          wallet: 0,
          created_at: new Date(),
          updated_at: new Date(),
          createdBy: uid,
          role: "Owner",
        };

        // Save user data in Firestore (replace with your Firestore collection name)
        await setDoc(doc(db, "Users", uid), userData);

        // Send email verification
        await sendEmailVerification(user);

        setLoading(false);
        alert("Signup successful! Please check your email for verification.");
        router.push("/login"); 
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setError("An error occurred during signup. Please try again.");
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
