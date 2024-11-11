"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@nextui-org/react";
import { auth, db } from "../../../lib/firebase";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContexts";
import { LoginFormValues } from "@/types/auth";

const Login: React.FC = () => {
  const [formValues, setFormValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { email, password } = formValues;
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (user) {
        if (!user.emailVerified) {
          alert("Email not verified. Please verify your email.");
          await sendEmailVerification(user);
          await signOut(auth);
          setIsLoading(false);
          return;
        }

        // Check both 'Mechanics' and 'Users' collections
        const mechanicsDocRef = doc(db, "Mechanics", user.uid);
        const usersDocRef = doc(db, "Users", user.uid);

        const [mechanicDoc, userDoc] = await Promise.all([
          getDoc(mechanicsDocRef),
          getDoc(usersDocRef),
        ]);

        if (mechanicDoc.exists()) {
          alert(
            "This email already exists with the Mechanic app. Please try with another email."
          );
          toast.error(
            "This email already exists with the Mechanic app. Please try with another email."
          );
          await signOut(auth);
          setIsLoading(false);
          return;
        }

        if (userDoc.exists()) {
          router.push("/");
          toast.success("Login Successfull");
        } else {
          router.push("/sign-up");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  {
    /** Auth State check */
  }
  const { user } = useAuth() || { user: null };
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [router, user]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div className="form-control w-full">
            <label htmlFor="email" className="label">
              <span className="label-text text-gray-700">Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900"
              required
            />
          </div>

          {/* Password Input */}
          <div className="form-control w-full">
            <label htmlFor="password" className="label">
              <span className="label-text text-gray-700">Password</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-900"
              required
            />
            <div className="text-right mt-2">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#F96176] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="btn w-full"
            isLoading={isLoading}
            isDisabled={isLoading}
            style={{
              backgroundColor: "#F96176",
              borderColor: "#F96176",
              color: "white",
            }}
          >
            Login
          </Button>
        </form>

        {/* Sign-up Link */}
        <p className="text-sm text-center text-gray-600 mt-4">
          Don’t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-[#F96176] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
