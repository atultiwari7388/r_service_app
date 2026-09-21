"use client";

import { useAuth } from "@/contexts/AuthContexts";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ServiceType,
  VehicleTypes,
  AddressType,
  ProfileValues,
} from "@/types/types";
import { db, storage, auth } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import Link from "next/link";
import { generateOrderId } from "@/utils/generateOrderId";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import PopupModal from "@/components/PopupModal";
import {
  FaAndroid,
  FaApple,
  FaAward,
  FaCheckCircle,
  FaChrome,
} from "react-icons/fa";
import Image from "next/image";
import { motion } from "framer-motion";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

interface RedirectProps {
  path: string;
}

interface CompanyMetadataItem {
  type: string;
  cName: string;
}

interface EngineMetadataItem {
  type: string;
  cName: string;
  eName: string;
}

// Default Fallback Services List so dropdown is NEVER blank for unauthenticated users
const DEFAULT_SERVICES: ServiceType[] = [
  {
    title: "Air Leak truck",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 1,
    isFeatured: true,
  },
  {
    title: "Battery",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 2,
    isFeatured: true,
  },
  {
    title: "Brake Service",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 3,
    isFeatured: true,
  },
  {
    title: "Electrical",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 4,
    isFeatured: true,
  },
  {
    title: "Engine Diagnostic",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 5,
    isFeatured: true,
  },
  {
    title: "Engine Sign",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 6,
    isFeatured: true,
  },
  {
    title: "Fuel Delivery / DEF",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 7,
    isFeatured: true,
  },
  {
    title: "Jump Start",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 8,
    isFeatured: true,
  },
  {
    title: "Lockout Service",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 9,
    isFeatured: true,
  },
  {
    title: "Oil & Fluid Leak",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 10,
    isFeatured: true,
  },
  {
    title: "Reefer Repair",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 11,
    isFeatured: true,
  },
  {
    title: "Suspension & Steering",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 12,
    isFeatured: true,
  },
  {
    title: "Tire Steer",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 13,
    isFeatured: true,
  },
  {
    title: "Tire Drive / Trailer",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 14,
    isFeatured: true,
  },
  {
    title: "Towing",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 15,
    isFeatured: true,
  },
  {
    title: "Transmission & Clutch",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 16,
    isFeatured: true,
  },
  {
    title: "Welding & Fabrication",
    image_type: 0,
    price_type: 0,
    image: "",
    priority: 17,
    isFeatured: true,
  },
];

const DEFAULT_TRUCK_COMPANIES = [
  "FREIGHTLINER",
  "KENWORTH",
  "PETERBILT",
  "VOLVO",
  "MACK",
  "INTERNATIONAL",
  "WESTERN STAR",
  "FORD",
  "ISUZU",
  "HINO",
];

const DEFAULT_TRAILER_COMPANIES = [
  "GREAT DANE",
  "UTILITY",
  "WABASH",
  "HYUNDAI",
  "VANGUARD",
  "STOUGHTON",
];

const DEFAULT_ENGINES: Record<string, string[]> = {
  FREIGHTLINER: [
    "DETROIT DD13",
    "DETROIT DD15",
    "DETROIT DD16",
    "CUMMINS ISX",
    "CUMMINS X15",
  ],
  KENWORTH: ["PACCAR MX-11", "PACCAR MX-13", "CUMMINS ISX", "CUMMINS X15"],
  PETERBILT: ["PACCAR MX-11", "PACCAR MX-13", "CUMMINS ISX", "CUMMINS X15"],
  VOLVO: ["VOLVO D11", "VOLVO D13", "CUMMINS X15"],
  MACK: ["MACK MP7", "MACK MP8", "MACK MP10"],
  INTERNATIONAL: ["INTERNATIONAL A26", "CUMMINS ISX", "CUMMINS X15"],
  "WESTERN STAR": [
    "DETROIT DD13",
    "DETROIT DD15",
    "DETROIT DD16",
    "CUMMINS X15",
  ],
};

const COUNTRY_CODES = [
  { code: "+1", label: "+1 (USA/CA)" },
  { code: "+52", label: "+52 (MX)" },
  { code: "+91", label: "+91 (IN)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+61", label: "+61 (AU)" },
];

const BookingSection: React.FC = () => {
  const { user } = useAuth() || { user: null };
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceType[]>(DEFAULT_SERVICES);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [location, setLocation] = useState<AddressType[]>([]);
  const [userData, setUserData] = useState<ProfileValues | null>(null);
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedServiceData, setSelectedServiceData] =
    useState<ServiceType | null>(null);

  // Dynamic Metadata from Firestore (metadata/vehicleType, metadata/companyNameL, metadata/engineNameList)
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([
    "Truck",
    "Trailer",
    "Van",
    "Bus",
  ]);
  const [allCompaniesRaw, setAllCompaniesRaw] = useState<CompanyMetadataItem[]>(
    []
  );
  const [companyList, setCompanyList] = useState<string[]>(
    DEFAULT_TRUCK_COMPANIES
  );
  const [allEnginesRaw, setAllEnginesRaw] = useState<EngineMetadataItem[]>([]);
  const [engineNameList, setEngineNameList] = useState<string[]>([]);

  // State for registered user selection
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // State for Guest Booking
  const [guestVehicleType, setGuestVehicleType] = useState("Truck");
  const [guestVehicleNumber, setGuestVehicleNumber] = useState("");
  const [guestVehicleCompany, setGuestVehicleCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [guestEngineName, setGuestEngineName] = useState("");
  const [customEngine, setCustomEngine] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [guestLat, setGuestLat] = useState<number | null>(null);
  const [guestLng, setGuestLng] = useState<number | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [guestCountryCode, setGuestCountryCode] = useState("+1");
  const [guestPhoneNumber, setGuestPhoneNumber] = useState("");

  // OTP Authentication State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    truckCount: "",
    message: "",
  });

  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [role, setRole] = useState("");

  const isGuestMode =
    !user || userData?.role === "Guest" || userData?.isGuest === true;

  // OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  // Fetch user data and determine effectiveUserId
  useEffect(() => {
    const fetchUserDataAndDetermineEffectiveUserId = async () => {
      if (!user?.uid) return;

      try {
        const userDocRef = doc(db, "Users", user.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          const uData = userSnapshot.data() as ProfileValues;
          setUserData(uData);
          setRole(uData.role || "");

          if (uData.role === "SubOwner" && uData.createdBy) {
            setEffectiveUserId(uData.createdBy);
          } else {
            setEffectiveUserId(user.uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserDataAndDetermineEffectiveUserId();
  }, [user?.uid]);

  useEffect(() => {
    if (!userData) return;
    setDemoForm((prev) => ({
      ...prev,
      name: prev.name || userData.userName || "",
      email: prev.email || userData.email || "",
      phone: prev.phone || userData.phoneNumber || "",
      companyName: prev.companyName || "",
    }));
  }, [userData]);

  // Fetch dynamic metadata from Firestore (vehicleType, companyNameL, engineNameList, servicesList)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [vTypeDoc, companyDoc, engineDoc, servicesDoc] =
          await Promise.all([
            getDoc(doc(db, "metadata", "vehicleType")),
            getDoc(doc(db, "metadata", "companyNameL")),
            getDoc(doc(db, "metadata", "engineNameList")),
            getDoc(doc(db, "metadata", "servicesList")),
          ]);

        if (vTypeDoc.exists()) {
          const types = vTypeDoc.data()?.type || [];
          if (Array.isArray(types) && types.length > 0) {
            setVehicleTypes(types);
          }
        }

        if (companyDoc.exists()) {
          const cData = companyDoc.data()?.data || [];
          if (Array.isArray(cData) && cData.length > 0) {
            setAllCompaniesRaw(cData);
          }
        }

        if (engineDoc.exists()) {
          const eData = engineDoc.data()?.data || [];
          if (Array.isArray(eData) && eData.length > 0) {
            setAllEnginesRaw(eData);
          }
        }

        if (servicesDoc.exists()) {
          const servicesList = servicesDoc.data()?.data || [];
          if (Array.isArray(servicesList) && servicesList.length > 0) {
            const mapped = servicesList.map((service: ServiceType) => ({
              title: service.title || "",
              image_type: Number(service.image_type) || 0,
              price_type: Number(service.price_type) || 0,
              image: service.image || "",
              priority: service.priority || 0,
              isFeatured: service.isFeatured || false,
            }));
            setServices(mapped);
          }
        }
      } catch (err) {
        console.warn("Could not load dynamic metadata from Firestore:", err);
      }
    };

    fetchMetadata();
  }, []);

  // Filter Company List dynamically when guestVehicleType changes
  useEffect(() => {
    if (!guestVehicleType) {
      setCompanyList([]);
      return;
    }

    if (allCompaniesRaw.length > 0) {
      const filtered = allCompaniesRaw
        .filter((c) => c.type?.toLowerCase() === guestVehicleType.toLowerCase())
        .map((c) => c.cName.toString().toUpperCase());

      // Deduplicate
      const uniqueCompanies = Array.from(new Set(filtered));
      if (uniqueCompanies.length > 0) {
        setCompanyList(uniqueCompanies);
      } else {
        if (guestVehicleType.toLowerCase() === "trailer") {
          setCompanyList(DEFAULT_TRAILER_COMPANIES);
        } else {
          setCompanyList(DEFAULT_TRUCK_COMPANIES);
        }
      }
    } else {
      if (guestVehicleType.toLowerCase() === "trailer") {
        setCompanyList(DEFAULT_TRAILER_COMPANIES);
      } else {
        setCompanyList(DEFAULT_TRUCK_COMPANIES);
      }
    }

    setGuestVehicleCompany("");
    setGuestEngineName("");
  }, [guestVehicleType, allCompaniesRaw]);

  // Filter Engine Name List dynamically when guestVehicleCompany changes
  useEffect(() => {
    if (!guestVehicleType || !guestVehicleCompany) {
      setEngineNameList([]);
      return;
    }

    if (guestVehicleType.toLowerCase() === "trailer") {
      setEngineNameList(["N/A (Trailer)", "THERMO KING", "CARRIER REEFER"]);
      return;
    }

    if (guestVehicleCompany === "Other") {
      setEngineNameList(["Other"]);
      return;
    }

    if (allEnginesRaw.length > 0) {
      const filtered = allEnginesRaw
        .filter(
          (e) =>
            e.type?.toLowerCase() === guestVehicleType.toLowerCase() &&
            e.cName?.toUpperCase() === guestVehicleCompany.toUpperCase()
        )
        .map((e) => e.eName.toString().toUpperCase());

      const uniqueEngines = Array.from(new Set(filtered));
      if (uniqueEngines.length > 0) {
        setEngineNameList(uniqueEngines);
      } else if (DEFAULT_ENGINES[guestVehicleCompany.toUpperCase()]) {
        setEngineNameList(DEFAULT_ENGINES[guestVehicleCompany.toUpperCase()]);
      } else {
        setEngineNameList([
          "CUMMINS ISX",
          "CUMMINS X15",
          "DETROIT DD13",
          "DETROIT DD15",
          "DETROIT DD16",
          "PACCAR MX-11",
          "PACCAR MX-13",
          "VOLVO D11",
          "VOLVO D13",
          "MACK MP8",
          "CAT C12 / C15",
        ]);
      }
    } else if (DEFAULT_ENGINES[guestVehicleCompany.toUpperCase()]) {
      setEngineNameList(DEFAULT_ENGINES[guestVehicleCompany.toUpperCase()]);
    } else {
      setEngineNameList([
        "CUMMINS ISX",
        "CUMMINS X15",
        "DETROIT DD13",
        "DETROIT DD15",
        "DETROIT DD16",
        "PACCAR MX-11",
        "PACCAR MX-13",
        "VOLVO D11",
        "VOLVO D13",
        "MACK MP8",
        "CAT C12 / C15",
      ]);
    }

    setGuestEngineName("");
  }, [guestVehicleType, guestVehicleCompany, allEnginesRaw]);

  // Fetch vehicles and addresses for registered fleet accounts
  useEffect(() => {
    if (!effectiveUserId || userData?.role === "Guest" || userData?.isGuest)
      return;

    const fetchUserVehicles = async (): Promise<VehicleTypes[]> => {
      try {
        const vehiclesSnapshot = await getDocs(
          collection(db, "Users", effectiveUserId, "Vehicles")
        );
        if (!vehiclesSnapshot.empty) {
          return vehiclesSnapshot.docs
            .map((doc) => {
              const data = doc.data() as VehicleTypes;
              return {
                id: doc.id,
                vehicleNumber: data.vehicleNumber,
                companyName: data.companyName,
                engineName: data.engineName,
                createdAt: data.createdAt,
                isSet: data.isSet,
                licensePlate: data.licensePlate,
                vin: data.vin,
                year: data.year,
                currentReading: data.currentReading,
                dot: data.dot,
                engineNumber: data.engineNumber,
                iccms: data.iccms,
                vehicleType: data.vehicleType,
                active: data.active,
                currentMiles: data.currentMiles || "0",
                hoursReading: data.hoursReading || "0",
                currentMilesArray: data.currentMilesArray || [],
                myCompany: data.myCompany || "",
                mycomId: data.mycomId || "",
              };
            })
            .filter((vehicle) => vehicle.active === true);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
      return [];
    };

    const fetchUserAddress = async (): Promise<AddressType[]> => {
      try {
        const addressesSnapshot = await getDocs(
          collection(db, "Users", effectiveUserId, "Addresses")
        );
        if (!addressesSnapshot.empty) {
          return addressesSnapshot.docs.map((doc) => {
            const data = doc.data() as AddressType;
            return {
              address: data.address,
              addressType: data.addressType,
              date: data.date,
              id: data.id,
              isAddressSelected: data.isAddressSelected,
              location: {
                latitude: data.location.latitude,
                longitude: data.location.longitude,
              },
            };
          });
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
      return [];
    };

    const loadRegisteredUserData = async () => {
      try {
        setLoading(true);
        const [vehicleData, locationData] = await Promise.all([
          fetchUserVehicles(),
          fetchUserAddress(),
        ]);
        setVehicles(vehicleData);
        setLocation(locationData);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRegisteredUserData();
  }, [effectiveUserId, userData?.role, userData?.isGuest]);

  // Handle selection changes
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const service = e.target.value;
    setSelectedService(service);
    const serviceData = services.find((s) => s.title === service);
    setSelectedServiceData(serviceData || null);
    console.log("Selected Service:", service);
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicle = e.target.value;
    setSelectedVehicle(vehicle);
    console.log("Selected Vehicle:", vehicle);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const location = e.target.value;
    setSelectedLocation(location);
    console.log("Selected Location:", location);
  };

  const handleDemoInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setDemoForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDemoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedData = {
      name: demoForm.name.trim(),
      companyName: demoForm.companyName.trim(),
      email: demoForm.email.trim(),
      phone: demoForm.phone.trim(),
      truckCount: demoForm.truckCount.trim(),
      message: demoForm.message.trim(),
    };

    if (
      !trimmedData.name ||
      !trimmedData.companyName ||
      !trimmedData.email ||
      !trimmedData.phone ||
      !trimmedData.truckCount ||
      !trimmedData.message
    ) {
      toast.error("Please fill all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedData.email)) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      setDemoSubmitting(true);
      await addDoc(collection(db, "demoRequests"), {
        ...trimmedData,
        userId: user?.uid || "",
        ownerId: effectiveUserId || "",
        createdAt: serverTimestamp(),
      });
      toast.success("Demo request sent successfully!");
      setShowDemoModal(false);
      setDemoForm({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        truckCount: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting demo request:", error);
      toast.error("Failed to submit demo request");
    } finally {
      setDemoSubmitting(false);
    }
  };

  // Browser GPS auto-detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGuestLat(lat);
        setGuestLng(lng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setGuestAddress(data.display_name);
          } else {
            setGuestAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          }
          toast.success("Location detected!");
        } catch {
          setGuestAddress(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          toast.success("Coordinates acquired!");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        console.error("Geolocation error:", err);
        toast.error(
          "Could not fetch GPS. Please enter your location manually."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Setup reCAPTCHA verifier for Phone Auth
  const setupRecaptcha = async (): Promise<RecaptchaVerifier> => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn("Error clearing previous recaptcha verifier:", e);
      }
      window.recaptchaVerifier = undefined;
    }

    const container = document.getElementById("guest-recaptcha-container");
    if (container) {
      container.innerHTML = "";
    }

    const verifier = new RecaptchaVerifier(auth, "guest-recaptcha-container", {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        toast.error("reCAPTCHA expired. Please try again.");
      },
    });

    await verifier.render();
    window.recaptchaVerifier = verifier;
    return verifier;
  };

  // Trigger Phone OTP
  const handleSendOtp = async (phone: string) => {
    setIsSendingOtp(true);
    try {
      const appVerifier = await setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(
        auth,
        phone,
        appVerifier
      );
      setConfirmationResult(confirmation);
      window.confirmationResult = confirmation;
      setShowOtpModal(true);
      setOtpTimer(30);
      toast.success(`OTP sent to ${phone}`);
    } catch (error: unknown) {
      console.error("Error sending OTP:", error);
      let errMsg = "Failed to send OTP. Please try again.";

      if (typeof error === "object" && error !== null && "code" in error) {
        const err = error as { code: string; message?: string };
        if (err.code === "auth/invalid-app-credential") {
          errMsg =
            "Phone Authentication is not enabled or domain is unauthorized in Firebase Console. Please verify Firebase Console settings.";
        } else if (err.code === "auth/too-many-requests") {
          errMsg = "Too many requests. Please wait a moment and try again.";
        } else if (err.code === "auth/invalid-phone-number") {
          errMsg = "Invalid phone number format. Please check country code.";
        } else if (err.code === "auth/captcha-check-failed") {
          errMsg =
            "reCAPTCHA verification failed. Please refresh and try again.";
        } else if (err.message) {
          errMsg = err.message;
        }
      } else if (error instanceof Error) {
        errMsg = error.message;
      }

      toast.error(errMsg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Dispatch Job creation
  const dispatchJobRequest = async (
    targetUserId: string,
    phoneToUse: string
  ) => {
    setLoading(true);
    try {
      const orderId = await generateOrderId();
      const imageUrls: string[] = [];

      if (selectedImage) {
        const imageRef = ref(storage, `jobs/${orderId}/${selectedImage.name}`);
        await uploadBytes(imageRef, selectedImage);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }

      const finalCompanyName =
        guestVehicleCompany === "Other"
          ? customCompany.trim() || "Commercial Vehicle"
          : guestVehicleCompany || "Commercial Vehicle";

      const finalEngineName =
        guestEngineName === "Other"
          ? customEngine.trim() || "Standard Engine"
          : guestEngineName || "Standard Engine";

      const finalVehicleNumber = guestVehicleNumber.trim() || "L101";
      const finalLat = guestLat || 40.7128;
      const finalLng = guestLng || -74.006;

      const jobData = {
        orderId: orderId,
        cancelReason: "",
        cancelBy: "",
        userId: targetUserId,
        userPhoto:
          "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
        userName: "Guest Driver",
        selectedService: selectedService,
        companyName: finalCompanyName,
        engineName: finalEngineName,
        vehicleType: guestVehicleType || "Truck",
        myCompany: finalCompanyName,
        mycomId: "",
        description: description,
        vehicleNumber: `${finalVehicleNumber} (${finalCompanyName})`,
        userPhoneNumber: phoneToUse,
        userDeliveryAddress: guestAddress,
        userLat: finalLat,
        userLong: finalLng,
        isImageSelected: Boolean(imageUrls.length > 0),
        fixPriceEnabled: Boolean(selectedServiceData?.price_type === 1),
        images: imageUrls,
        orderDate: new Date(),
        role: "Guest",
        ownerId: targetUserId,
        payMode: "",
        status: 0,
        rating: "4.3",
        review: "",
        reviewSubmitted: false,
        mRating: "4.3",
        mReview: "",
        mReviewSubmitted: false,
        nearByDistance: 25,
        mechanicsOffer: [],
        isGuest: true,
      };

      await setDoc(doc(db, "Users", targetUserId, "history", orderId), jobData);
      await setDoc(doc(db, "jobs", orderId), jobData);

      toast.success("Request broadcasted! Finding nearby mechanics...");
      setShowOtpModal(false);
      router.push("/my-jobs");
    } catch (error) {
      console.error("Error creating guest job:", error);
      toast.error("Failed to book service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete booking
  const handleVerifyOtpAndBook = async () => {
    if (!otpCode || otpCode.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    if (!confirmationResult && !window.confirmationResult) {
      toast.error("Session expired. Please request OTP again.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const activeConfirmation =
        confirmationResult || window.confirmationResult!;
      const userCredential = await activeConfirmation.confirm(otpCode.trim());
      const guestUser = userCredential.user;

      const fullPhone =
        guestUser.phoneNumber ||
        `${guestCountryCode}${guestPhoneNumber.replace(/\D/g, "")}`;

      await setDoc(
        doc(db, "Users", guestUser.uid),
        {
          uid: guestUser.uid,
          phoneNumber: fullPhone,
          role: "Guest",
          isGuest: true,
          isProfileComplete: false,
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
          createdFrom: "web-guest",
        },
        { merge: true }
      );

      await dispatchJobRequest(guestUser.uid, fullPhone);
    } catch (error: unknown) {
      console.error("Error verifying OTP:", error);
      const errMsg =
        error instanceof Error
          ? error.message
          : "Invalid OTP code. Please check and try again.";
      toast.error(errMsg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleFindMechanicClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    // 1. Registered User Flow
    if (user && !isGuestMode) {
      if (!selectedService || !selectedVehicle || !selectedLocation) {
        toast.error("Please select all required fields");
        return;
      }

      if (selectedServiceData?.image_type === 1 && !selectedImage) {
        toast.error("Image upload is mandatory for this service");
        return;
      }

      try {
        setLoading(true);

        const orderId = await generateOrderId();

        const selectedLocationData = location.find(
          (loc) => loc.address === selectedLocation
        );

        const selectedVehicleData = vehicles.find(
          (v) => v.vehicleNumber === selectedVehicle
        );

        if (!userData || !selectedLocationData || !selectedVehicleData) {
          throw new Error("Required data missing");
        }

        const imageUrls: string[] = [];

        if (selectedImage) {
          const imageRef = ref(
            storage,
            `jobs/${orderId}/${selectedImage.name}`
          );
          await uploadBytes(imageRef, selectedImage);
          const imageUrl = await getDownloadURL(imageRef);
          imageUrls.push(imageUrl);
        }

        const cleanVehicleNumber = (
          selectedVehicleData.vehicleNumber || selectedVehicle
        ).trim();

        const jobData = {
          orderId: orderId,
          cancelReason: "",
          cancelBy: "",
          userId: user.uid,
          userPhoto: userData.profilePicture,
          userName: userData.userName,
          selectedService: selectedService,
          companyName: selectedVehicleData.companyName,
          myCompany: selectedVehicleData.myCompany || "",
          mycomId: selectedVehicleData.mycomId || "",
          description: description,
          vehicleNumber: cleanVehicleNumber,
          userPhoneNumber: userData.phoneNumber,
          userDeliveryAddress: selectedLocation,
          userLat: selectedLocationData.location.latitude,
          userLong: selectedLocationData.location.longitude,
          isImageSelected: Boolean(imageUrls.length > 0),
          fixPriceEnabled: Boolean(selectedServiceData?.price_type === 1),
          images: imageUrls,
          orderDate: new Date(),
          role: userData.role,
          ownerId: effectiveUserId,
          payMode: "",
          status: 0,
          rating: "4.3",
          review: "",
          reviewSubmitted: false,
          mRating: "4.3",
          mReview: "",
          mReviewSubmitted: false,
          nearByDistance: 25,
          mechanicsOffer: [],
        };

        await setDoc(
          doc(db, "Users", effectiveUserId, "history", orderId),
          jobData
        );

        if (role === "SubOwner" && user.uid !== effectiveUserId) {
          await setDoc(doc(db, "Users", user.uid, "history", orderId), {
            ...jobData,
            isSubOwnerBooking: true,
            ownerId: effectiveUserId,
          });
        }

        await setDoc(doc(db, "jobs", orderId), jobData);

        toast.success("Service booked successfully!");
        router.push("/my-jobs");
      } catch (error) {
        console.error("Error creating job:", error);
        toast.error("Failed to book service");
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Guest User Flow
    if (!guestVehicleNumber.trim()) {
      toast.error("Please enter your Vehicle Number (e.g. L101)");
      return;
    }

    if (!guestVehicleCompany) {
      toast.error("Please select a Vehicle Company");
      return;
    }

    if (guestVehicleCompany === "Other" && !customCompany.trim()) {
      toast.error("Please enter your vehicle company name");
      return;
    }

    if (!guestEngineName) {
      toast.error("Please select an Engine Name");
      return;
    }

    if (guestEngineName === "Other" && !customEngine.trim()) {
      toast.error("Please enter your engine model");
      return;
    }

    if (!selectedService) {
      toast.error("Please select a required service");
      return;
    }

    if (!guestAddress.trim()) {
      toast.error("Please provide your current location");
      return;
    }

    if (selectedServiceData?.image_type === 1 && !selectedImage) {
      toast.error("Image upload is mandatory for this service");
      return;
    }

    // If user is already authenticated with phone as guest
    if (user && user.phoneNumber) {
      await dispatchJobRequest(user.uid, user.phoneNumber);
      return;
    }

    // Validate phone number
    const cleanPhone = guestPhoneNumber.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 7) {
      toast.error("Please enter a valid mobile number to receive OTP");
      return;
    }

    const fullPhone = `${guestCountryCode}${cleanPhone}`;
    await handleSendOtp(fullPhone);
  };

  const handleRedirect = ({ path }: RedirectProps): void => {
    setShowPopup(false);
    window.location.href = path;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        yoyo: Infinity,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  const ctaRows = [
    [
      {
        icon: null,
        text: "Book a Demo",
        color: "bg-[#58BB87] hover:bg-[#4ca877]",
        link: "",
        isBookDemo: true,
      },
      {
        icon: <FaChrome className="text-2xl" />,
        text: "Access Web Dashboard",
        color: "bg-[#F96176] hover:bg-[#e95067]",
        link: "https://www.rabbitmechanic.com/",
        isBookDemo: false,
      },
    ],
    [
      {
        icon: <FaApple className="text-2xl" />,
        text: "Download iOS App",
        color: "bg-[#F96176] hover:bg-[#e95067]",
        link: "https://apps.apple.com/us/app/rabbit-mechanic-service/id6739995003",
        isBookDemo: false,
      },
      {
        icon: <FaAndroid className="text-2xl" />,
        text: "Download Android App",
        color: "bg-[#58BB87] hover:bg-[#4ca877]",
        link: "https://play.google.com/store/apps/details?id=com.rabbit_u_d_app.rabbit_services_app",
        isBookDemo: false,
      },
    ],
  ];

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Left Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/find_mec_new.jpg"
          alt="Truck on highway"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
        />
        {/* <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div> */}
      </div>

      {/* Hidden container for Firebase invisible reCAPTCHA */}
      <div id="guest-recaptcha-container" ref={recaptchaContainerRef}></div>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-12 relative z-20">
        <div className="flex flex-col lg:flex-row gap-16 items-center justify-between">
          {/* Left Section: Text Content */}
          <div className="py-16 lg:py-24 flex flex-col lg:flex-row gap-10 items-center justify-between">
            <motion.div
              className="lg:w-1/1 text-white mt-5"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div className="space-y-10 mb-7" variants={itemVariants}>
                <motion.h6
                  className="text-4xl sm:text-4xl font-bold leading-tight"
                  variants={itemVariants}
                >
                  <span>
                    TrenoOps – The Operating System for Trucking Companies
                  </span>
                </motion.h6>
              </motion.div>

              <div className="max-w-[500px] mb-10 ">
                <motion.p
                  className="text-lg sm:text-xl text-gray-200 font-bold leading-relaxed"
                  variants={itemVariants}
                >
                  TrenoOps is a unified platform that helps trucking companies
                  dispatch loads, track maintenance, manage compliance, and find
                  roadside mechanics — all in one place.
                </motion.p>
              </div>
              {/* Action Buttons: 2 in first row, 2 in second row */}
              <motion.div
                className="pt-4 space-y-4 max-w-[560px]"
                variants={itemVariants}
              >
                {ctaRows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {row.map((button, index) =>
                      button.isBookDemo ? (
                        <motion.button
                          key={`${rowIndex}-${index}`}
                          type="button"
                          onClick={() => setShowDemoModal(true)}
                          className={`${button.color} text-white px-4 py-3 rounded-lg flex items-center gap-2 justify-center font-medium shadow-md hover:shadow-xl transition-all duration-300`}
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          {button.icon}
                          {button.text}
                        </motion.button>
                      ) : (
                        <motion.a
                          key={`${rowIndex}-${index}`}
                          href={button.link}
                          className={`${button.color} text-white px-4 py-3 rounded-lg flex items-center gap-2 justify-center font-medium shadow-md hover:shadow-xl transition-all duration-300`}
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          {button.icon}
                          {button.text}
                        </motion.a>
                      )
                    )}
                  </div>
                ))}
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                className="flex flex-wrap gap-4 items-center pt-6 "
                variants={itemVariants}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <FaCheckCircle className="text-green-500" />
                  </div>
                  <span className="text-gray-200">Trusted by 500+ fleets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <FaAward className="text-yellow-500" />
                  </div>
                  <span className="text-gray-200">4.9/5 Rating</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Section: Form */}
          <div className="lg:w-[420px] bg-white/90 backdrop-blur-md border border-gray-300 rounded-xl shadow-xl p-4 sm:p-8 space-y-1 mt-5">
            <h1 className="text-xl font-semibold text-center text-gray-800 mb-5">
              Find Nearby Mechanics in Seconds
            </h1>

            <form className="space-y-6">
              {!isGuestMode ? (
                /* Registered User Form */
                <>
                  {/* Vehicle Select */}
                  <div className="flex gap-2">
                    <select
                      onChange={handleVehicleChange}
                      value={selectedVehicle || ""}
                      className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition text-gray-800 bg-white"
                    >
                      <option value="">Select A Vehicle</option>
                      {vehicles
                        .slice()
                        .sort((a, b) =>
                          a.vehicleNumber.localeCompare(b.vehicleNumber)
                        )
                        .map((vehicle, index) => (
                          <option key={index} value={vehicle.vehicleNumber}>
                            {vehicle.vehicleNumber} ({vehicle.companyName})
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      className="bg-[#F96176] text-white text-2xl rounded-md hover:bg-[#eb929e] px-3"
                      title="Add Vehicle"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPopup(true);
                      }}
                    >
                      +
                    </button>

                    <PopupModal
                      isOpen={showPopup}
                      onClose={() => setShowPopup(false)}
                      title="Select Option"
                      options={[
                        {
                          label: "Add Vehicle",
                          onClick: () =>
                            handleRedirect({ path: "/add-vehicle" }),
                        },
                        {
                          label: "Import Vehicle",
                          onClick: () =>
                            handleRedirect({ path: "/import-vehicle" }),
                          bgColor: "blue",
                        },
                      ]}
                    />
                  </div>

                  {/* Location Select */}
                  <div className="flex gap-2">
                    <select
                      onChange={handleLocationChange}
                      value={selectedLocation || ""}
                      className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition text-gray-800 bg-white"
                    >
                      <option value="">Select Your Location</option>
                      {location.map((loc, index) => (
                        <option key={index} value={loc.address}>
                          {loc.address}
                        </option>
                      ))}
                    </select>

                    <Link href="/add-location">
                      <button
                        type="button"
                        className="bg-[#F96176] text-white text-2xl rounded-md hover:bg-[#eb929e] px-3 h-full flex items-center justify-center"
                        title="Add Location"
                      >
                        +
                      </button>
                    </Link>
                  </div>
                </>
              ) : (
                /* Guest User Breakdown Form with Dynamic Lists */
                <>
                  {/* Dynamic Vehicle Type & Vehicle Number Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <select
                        value={guestVehicleType}
                        onChange={(e) => setGuestVehicleType(e.target.value)}
                        className="w-full h-14 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition text-sm text-gray-800 bg-white"
                      >
                        <option value="">Vehicle Type</option>
                        {vehicleTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Vehicle No (e.g. L101)"
                        value={guestVehicleNumber}
                        onChange={(e) => setGuestVehicleNumber(e.target.value)}
                        className="w-full h-14 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition text-sm text-gray-800 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Dynamic Vehicle Company Name */}
                  <div>
                    <select
                      value={guestVehicleCompany}
                      onChange={(e) => setGuestVehicleCompany(e.target.value)}
                      className="w-full h-14 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition text-sm text-gray-800 bg-white"
                    >
                      <option value="">Select Vehicle Company</option>
                      {companyList
                        .slice()
                        .sort((a, b) => a.localeCompare(b))
                        .map((company) => (
                          <option key={company} value={company}>
                            {company}
                          </option>
                        ))}
                      <option value="Other">Other (Custom)</option>
                    </select>
                    {guestVehicleCompany === "Other" && (
                      <input
                        type="text"
                        placeholder="Enter Company Name"
                        value={customCompany}
                        onChange={(e) => setCustomCompany(e.target.value)}
                        className="mt-2 w-full h-12 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm text-gray-800 bg-white"
                      />
                    )}
                  </div>

                  {/* Dynamic Engine Model */}
                  <div>
                    <select
                      value={guestEngineName}
                      onChange={(e) => setGuestEngineName(e.target.value)}
                      className="w-full h-14 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition text-sm text-gray-800 bg-white"
                    >
                      <option value="">Select Engine Model</option>
                      {engineNameList
                        .slice()
                        .sort((a, b) => a.localeCompare(b))
                        .map((engine) => (
                          <option key={engine} value={engine}>
                            {engine}
                          </option>
                        ))}
                      <option value="Other">Other (Custom)</option>
                    </select>
                    {guestEngineName === "Other" && (
                      <input
                        type="text"
                        placeholder="Enter Engine Model"
                        value={customEngine}
                        onChange={(e) => setCustomEngine(e.target.value)}
                        className="mt-2 w-full h-12 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-sm text-gray-800 bg-white"
                      />
                    )}
                  </div>

                  {/* Location with GPS */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Current Location / Address"
                      value={guestAddress}
                      onChange={(e) => setGuestAddress(e.target.value)}
                      className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition text-sm text-gray-800 bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="bg-[#F96176] text-white text-xs font-semibold rounded-md hover:bg-[#eb929e] px-3 whitespace-nowrap flex items-center justify-center gap-1"
                      title="Get Current Location via GPS"
                    >
                      {isDetectingLocation ? "..." : "📍 GPS"}
                    </button>
                  </div>

                  {/* Mobile Number with Country Code (if unauthenticated) */}
                  {(!user || !user.phoneNumber) && (
                    <div className="flex gap-2">
                      <select
                        value={guestCountryCode}
                        onChange={(e) => setGuestCountryCode(e.target.value)}
                        className="w-36 h-14 px-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] text-xs text-gray-800 bg-white font-medium"
                      >
                        {COUNTRY_CODES.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={guestPhoneNumber}
                        onChange={(e) => setGuestPhoneNumber(e.target.value)}
                        className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition text-sm text-gray-800 bg-white"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {/* Service Select */}
              <div>
                <select
                  onChange={handleServiceChange}
                  value={selectedService || ""}
                  className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition text-gray-800 bg-white"
                >
                  <option value="">Select A Service</option>
                  {services
                    .slice()
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((service, index) => (
                      <option key={index} value={service.title}>
                        {service.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <input
                  type="file"
                  className="file-input w-full rounded-lg bg-[#F96176]/20 text-[#F96176] border border-[#F96176]
        file:bg-[#F96176] file:text-white file:border-0
        file:rounded-lg file:mr-2 file:font-medium
        hover:file:bg-[#F96176]/90 transition-all"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedImage(e.target.files[0]);
                    }
                  }}
                  required={selectedServiceData?.image_type === 1}
                />
                {selectedServiceData?.image_type === 1 && (
                  <p className="text-red-500 text-sm mt-1">
                    * Image upload is mandatory for this service
                  </p>
                )}
              </div>

              {/* Description Textarea */}
              <div>
                <textarea
                  className="w-full p-4 h-32 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition text-gray-800 bg-white"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              {/* Find Mechanic Button */}
              <div>
                <button
                  type="button"
                  disabled={loading || isSendingOtp}
                  className="w-full bg-[#58BB87] text-white py-3 px-6 rounded-lg hover:bg-[#4ca877] transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-60"
                  onClick={handleFindMechanicClick}
                >
                  {loading || isSendingOtp ? "Processing..." : "Find Mechanic"}
                </button>
              </div>

              {/* Subtitle Text */}
              <p className="text-center text-sm text-gray-600 mt-2">
                Get Roadside Help Fast — Anytime, Anywhere
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Verify Mobile Number
            </h3>
            <p className="text-xs text-gray-600">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-gray-900">
                {guestCountryCode} {guestPhoneNumber}
              </span>
            </p>

            <div>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center tracking-[0.4em] font-mono text-2xl py-2.5 rounded-lg border-2 border-gray-300 focus:border-[#58BB87] focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>Didn&apos;t get code?</span>
              {otpTimer > 0 ? (
                <span className="text-gray-400">Resend in {otpTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleSendOtp(
                      `${guestCountryCode}${guestPhoneNumber.replace(
                        /\D/g,
                        ""
                      )}`
                    )
                  }
                  className="text-[#58BB87] font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="w-1/2 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtpAndBook}
                disabled={isVerifyingOtp || otpCode.length < 6}
                className="w-1/2 py-2.5 rounded-lg bg-[#58BB87] hover:bg-[#4ca877] text-white font-semibold text-sm disabled:opacity-50 transition"
              >
                {isVerifyingOtp ? "Verifying..." : "Confirm & Book"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book a Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800">
                Book a Demo
              </h2>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
              >
                X
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleDemoSubmit}>
              <input
                name="name"
                value={demoForm.name}
                onChange={handleDemoInputChange}
                placeholder="Name"
                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#F96176]"
              />
              <input
                name="companyName"
                value={demoForm.companyName}
                onChange={handleDemoInputChange}
                placeholder="Company Name"
                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#F96176]"
              />
              <input
                name="email"
                type="email"
                value={demoForm.email}
                onChange={handleDemoInputChange}
                placeholder="Email"
                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#F96176]"
              />
              <input
                name="phone"
                value={demoForm.phone}
                onChange={handleDemoInputChange}
                placeholder="Phone"
                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#F96176]"
              />
              <select
                name="truckCount"
                value={demoForm.truckCount}
                onChange={handleDemoInputChange}
                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#F96176]"
              >
                <option value="">Number of Truck</option>
                <option value="1-5">1-5</option>
                <option value="5-10">5-10</option>
                <option value="10-20">10-20</option>
                <option value="20-30">20-30</option>
                <option value="30+">30+</option>
              </select>
              <textarea
                name="message"
                value={demoForm.message}
                onChange={handleDemoInputChange}
                placeholder="Message"
                className="h-28 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#F96176]"
              />

              <button
                type="submit"
                disabled={demoSubmitting}
                className="w-full rounded-lg bg-[#58BB87] px-6 py-3 text-white transition hover:bg-[#4ca877] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {demoSubmitting ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingSection;
