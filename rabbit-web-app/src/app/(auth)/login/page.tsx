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
import { LoginFormValues } from "@/types/types";

const Login: React.FC = () => {
  const [formValues, setFormValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const { user } = useAuth() || { user: null };

  useEffect(() => {
    if (user && user.emailVerified) {
      router.push("/records");
    }
  }, [router, user]);

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
          alert(
            "Email not verified. Please verify your email. If you haven’t received the mail, please also check your Spam folder."
          );
          await sendEmailVerification(user);
          await signOut(auth);
          setIsLoading(false);
          return;
        }

        const mechanicsDocRef = doc(db, "Mechanics", user.uid);
        const usersDocRef = doc(db, "Users", user.uid);

        const [mechanicDoc, userDoc] = await Promise.all([
          getDoc(mechanicsDocRef),
          getDoc(usersDocRef),
        ]);

        // 🚫 Restrict Mechanic logins
        if (mechanicDoc.exists()) {
          toast.error(
            "This email is registered with the Mechanic app. Please try with another email."
          );
          await signOut(auth);
          setIsLoading(false);
          return;
        }

        // ✅ Check Users collection
        if (userDoc.exists()) {
          const userData = userDoc.data();

          if (userData.uid === user.uid) {
            // 🚫 Restrict Driver role
            if (userData.role === "Driver") {
              toast.error(
                "Access restricted! Drivers can only log in using the mobile app."
              );
              await signOut(auth);
              setIsLoading(false);
              return;
            }

            // ✅ Active user logic
            if (userData.active === true && userData.status === "active") {
              toast.success("Login Successful");
              router.push("/records");
            } else if (userData.status === "deactivated") {
              toast.error(
                "Your account is deactivated. Please contact your office."
              );
              router.push("/contact-us");
            } else {
              toast.error(
                "Your account is not active. Please contact your office."
              );
              router.push("/contact-us");
            }
          } else {
            toast.error("User mismatch. Please try again.");
            await signOut(auth);
          }
        } else {
          toast.error("User not found in system. Please sign up.");
          router.push("/sign-up");
        }
      }
    } catch (error) {
      toast.error("Invalid email or password. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex items-center justify-center mt-10 mb-5">
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formValues.password}
                onChange={handleChange}
                className="input input-bordered w-full bg-gray-50 text-gray-900 pr-10"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/** Forgot password link */}
          <div className="text-right mb-4">
            <Link
              href="/forgot-password"
              className="text-sm text-[#F96176] hover:underline"
            >
              Forgot password?
            </Link>
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
