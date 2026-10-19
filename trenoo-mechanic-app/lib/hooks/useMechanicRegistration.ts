"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  registerMechanic,
  fetchMetadataLanguages,
} from "@/lib/services/authService";
import { MechanicRegistrationData } from "@/types/auth";

export interface UseMechanicRegistrationReturn {
  // Form fields
  name: string;
  setName: (v: string) => void;
  workshopName: string;
  setWorkshopName: (v: string) => void;
  cellPhone: string;
  setCellPhone: (v: string) => void;
  telephone: string;
  setTelephone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  experience: string;
  setExperience: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;

  // Password visibility
  showPassword: boolean;
  toggleShowPassword: () => void;

  // Languages
  languages: string[];
  selectedLanguages: Record<string, boolean>;
  toggleLanguage: (lang: string) => void;

  // State
  isLoading: boolean;
  isSuccess: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<boolean>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useMechanicRegistration(): UseMechanicRegistrationReturn {
  const router = useRouter();

  const [name, setName] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [cellPhone, setCellPhone] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Languages list and selections
  const [languages, setLanguages] = useState<string[]>([
    "English",
    "Hindi",
    "Punjabi",
    "Spanish",
  ]);
  const [selectedLanguages, setSelectedLanguages] = useState<
    Record<string, boolean>
  >({
    English: true,
  });

  useEffect(() => {
    let isMounted = true;
    fetchMetadataLanguages().then((fetched) => {
      if (isMounted && fetched && fetched.length > 0) {
        setLanguages(fetched);
        setSelectedLanguages((prev) => {
          const updated: Record<string, boolean> = { ...prev };
          fetched.forEach((lang) => {
            if (updated[lang] === undefined) {
              updated[lang] = lang.toLowerCase() === "english";
            }
          });
          return updated;
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleLanguage = useCallback((lang: string) => {
    setSelectedLanguages((prev) => ({
      ...prev,
      [lang]: !prev[lang],
    }));
  }, []);

  const validate = useCallback((): boolean => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!workshopName.trim()) {
      toast.error("Please enter workshop name");
      return false;
    }
    if (!cellPhone.trim()) {
      toast.error("Please enter cell phone number");
      return false;
    }
    if (cellPhone.trim().replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      toast.error("Please enter a valid email");
      return false;
    }
    if (!city.trim()) {
      toast.error("Please enter your city");
      return false;
    }
    if (!state.trim()) {
      toast.error("Please enter your state");
      return false;
    }
    if (!country.trim()) {
      toast.error("Please enter your country");
      return false;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    const hasLanguage = Object.values(selectedLanguages).some(Boolean);
    if (!hasLanguage) {
      toast.error("Please select at least one language");
      return false;
    }

    return true;
  }, [
    name,
    workshopName,
    cellPhone,
    email,
    city,
    state,
    country,
    password,
    selectedLanguages,
  ]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      if (e) e.preventDefault();

      if (!validate()) {
        return false;
      }

      setIsLoading(true);
      try {
        const payload: MechanicRegistrationData = {
          name: name.trim(),
          workshopName: workshopName.trim(),
          cellPhone: cellPhone.trim(),
          telephone: telephone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          postalCode: postalCode.trim(),
          dateOfBirth: dateOfBirth.trim(),
          experience: experience.trim(),
          description: description.trim(),
          password,
          languages: selectedLanguages,
        };

        const result = await registerMechanic(payload);

        if (result.success) {
          setIsSuccess(true);
          toast.success(
            result.message ||
              "A verification email has been sent. Please verify before logging in.",
            { duration: 5000 }
          );
          setTimeout(() => {
            router.push("/login");
          }, 2000);
          return true;
        } else {
          toast.error(result.message || "Registration failed. Please try again.");
          return false;
        }
      } catch (err: any) {
        console.error("Registration submit error:", err);
        toast.error(err?.message || "Registration failed");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      validate,
      name,
      workshopName,
      cellPhone,
      telephone,
      email,
      address,
      city,
      state,
      country,
      postalCode,
      dateOfBirth,
      experience,
      description,
      password,
      selectedLanguages,
      router,
    ]
  );

  return {
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
  };
}
