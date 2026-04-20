"use client";

import { useAuth } from "@/contexts/AuthContexts";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ServiceType,
  VehicleTypes,
  AddressType,
  ProfileValues,
} from "@/types/types";
import { db, storage } from "@/lib/firebase";
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

interface RedirectProps {
  path: string;
}

const BookingSection: React.FC = () => {
  const { user } = useAuth() || { user: null };
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [location, setLocation] = useState<AddressType[]>([]);
  const [userData, setUserData] = useState<ProfileValues | null>(null);
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedServiceData, setSelectedServiceData] =
    useState<ServiceType | null>(null);

  // State for selected values
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

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

  // Fetch user data and determine effectiveUserId
  useEffect(() => {
    const fetchUserDataAndDetermineEffectiveUserId = async () => {
      if (!user?.uid) return;

      try {
        const userDocRef = doc(db, "Users", user.uid);
        console.log("Fetching user data for uid:", user.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data() as ProfileValues;
          console.log("User data fetched successfully:", userData);
          setUserData(userData);
          setRole(userData.role);

          // Determine effectiveUserId based on role
          if (userData.role === "SubOwner" && userData.createdBy) {
            setEffectiveUserId(userData.createdBy);
            console.log(
              "SubOwner detected, using effectiveUserId:",
              userData.createdBy
            );
          } else {
            setEffectiveUserId(user.uid);
            console.log("Regular user, using own uid:", user.uid);
          }
        } else {
          console.log("No user document found for uid:", user.uid);
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

  // Fetch data using effectiveUserId
  useEffect(() => {
    const fetchServices = async (): Promise<ServiceType[]> => {
      try {
        const metadataDocRef = doc(db, "metadata", "servicesList");
        const metadataSnapshot = await getDoc(metadataDocRef);

        if (metadataSnapshot.exists()) {
          const servicesList = metadataSnapshot.data()?.data || [];
          return servicesList.map((service: ServiceType) => ({
            title: service.title || "",
            image_type: service.image_type || 0,
            price_type: service.price_type || 0,
            image: service.image || "",
            priority: service.priority || 0,
            isFeatured: service.isFeatured || false,
          }));
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
      return [];
    };

    const fetchUserVehicles = async (): Promise<VehicleTypes[]> => {
      try {
        if (!effectiveUserId) return [];

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
        if (!effectiveUserId) return [];

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

    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesData, vehicleData, locationData] = await Promise.all([
          fetchServices(),
          fetchUserVehicles(),
          fetchUserAddress(),
        ]);
        setServices(servicesData);
        setVehicles(vehicleData);
        setLocation(locationData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (effectiveUserId) {
      loadData();
    }
  }, [effectiveUserId]);

  const handleFindMechanicClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in first to book your service");
      router.push("/login");
      return;
    }

    if (!selectedService || !selectedVehicle || !selectedLocation) {
      toast.error("Please select all required fields");
      return;
    }

    // Check if image is required but not selected
    if (selectedServiceData?.image_type === 1 && !selectedImage) {
      toast.error("Image upload is mandatory for this service");
      return;
    }

    try {
      setLoading(true);

      // Generate order ID
      const orderId = await generateOrderId();

      // Get selected location details
      const selectedLocationData = location.find(
        (loc) => loc.address === selectedLocation
      );

      // Get selected vehicle details
      const selectedVehicleData = vehicles.find(
        (v) => v.vehicleNumber === selectedVehicle
      );

      if (!userData || !selectedLocationData || !selectedVehicleData) {
        throw new Error("Required data missing");
      }

      const imageUrls: string[] = [];

      // Upload image if selected
      if (selectedImage) {
        const imageRef = ref(storage, `jobs/${orderId}/${selectedImage.name}`);
        await uploadBytes(imageRef, selectedImage);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }

      // Prepare job data
      const jobData = {
        orderId: orderId,
        cancelReason: "",
        cancelBy: "",
        userId: user.uid,
        userPhoto: userData.profilePicture,
        userName: userData.userName,
        selectedService: selectedService,
        companyName: selectedVehicleData.companyName,
        description: description,
        vehicleNumber: `${selectedVehicle} (${selectedVehicleData.companyName})`,
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
        nearByDistance: 5,
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

      // Store in jobs collection
      await setDoc(doc(db, "jobs", orderId), jobData);

      toast.success("Service booked successfully!");
      router.push("/my-jobs");
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("Failed to book service");
    } finally {
      setLoading(false);
    }
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
          {/* Right Section: Form */}
          <div className="lg:w-[420px] bg-white/90 backdrop-blur-md border border-gray-300 rounded-xl shadow-xl p-4 sm:p-8 space-y-1">
            <h1 className="text-3xl font-semibold text-center text-gray-800">
              Find Nearby Mechanics in Seconds
            </h1>

            <form className="space-y-6">
              {/* Vehicle Select */}
              <div className="flex gap-2">
                <select
                  onChange={handleVehicleChange}
                  className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
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
                      onClick: () => handleRedirect({ path: "/add-vehicle" }),
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

              {/* Service Select */}
              <div>
                <select
                  onChange={handleServiceChange}
                  className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
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

              {/* Location Select */}
              <div className="flex gap-2">
                <select
                  onChange={handleLocationChange}
                  className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
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
                    className="bg-[#F96176] text-white text-2xl rounded-md hover:bg-[#eb929e] px-3"
                    title="Add Location"
                  >
                    +
                  </button>
                </Link>
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
                  className="w-full p-4 h-32 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              {/* Find Mechanic Button */}
              <div>
                <button
                  className="w-full bg-[#58BB87] text-white py-3 px-6 rounded-lg hover:bg-[#4ca877] transition duration-300 ease-in-out transform hover:scale-105"
                  onClick={handleFindMechanicClick}
                >
                  Find Mechanic
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
