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
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
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
        const vehiclesSnapshot = await getDocs(
          collection(db, "Users", user?.uid as string, "Vehicles")
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
        const addressesSnapshot = await getDocs(
          collection(db, "Users", user?.uid as string, "Addresses")
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

    const fetchUserData = async (): Promise<ProfileValues | null> => {
      try {
        const userDocRef = doc(db, "Users", user?.uid as string);
        console.log("Fetching user data for uid:", user?.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data() as ProfileValues;
          console.log("User data fetched successfully:", userData);
          return userData;
        } else {
          console.log("No user document found for uid:", user?.uid);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      return null;
    };

    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesData, vehicleData, locationData, userProfileData] =
          await Promise.all([
            fetchServices(),
            fetchUserVehicles(),
            fetchUserAddress(),
            fetchUserData(),
          ]);
        setServices(servicesData);
        setVehicles(vehicleData);
        setLocation(locationData);
        setUserData(userProfileData);
      } catch (error) {
        console.error("Error loading data:", error);
        // toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      loadData();
    }
  }, [user]);

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
        vehicleNumber: selectedVehicle,
        userPhoneNumber: userData.phoneNumber,
        userDeliveryAddress: selectedLocation,
        userLat: selectedLocationData.location.latitude,
        userLong: selectedLocationData.location.longitude,
        isImageSelected: Boolean(imageUrls.length > 0),
        fixPriceEnabled: Boolean(selectedServiceData?.price_type === 1),
        images: imageUrls,
        orderDate: new Date(),
        role: userData.role,
        ownerId: user.uid,
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

      // Store in Users/uid/history
      await setDoc(doc(db, "Users", user.uid, "history", orderId), jobData);

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

  const downloadButtons = [
    {
      icon: <FaApple className="text-2xl" />,
      text: "iOS App",
      color: "bg-[#F96176] hover:bg-[#F96176]",
      link: "https://apps.apple.com/us/app/rabbit-mechanic-service/id6739995003",
    },
    {
      icon: <FaAndroid className="text-2xl" />,
      text: "Android",
      color: "bg-green-600 hover:bg-green-700",
      link: "https://play.google.com/store/apps/details?id=com.rabbit_u_d_app.rabbit_services_app",
    },
    {
      icon: <FaChrome className="text-2xl" />,
      text: "Web App",
      color: "bg-[#F96176] hover:bg-[#F96176]",
      link: "https://www.rabbitmechanic.com/",
    },
  ];

  if (loading) {
    return <LoadingIndicator />;
  }

  // return (
  //   <div className="min-h-screen relative overflow-hidden">
  //     {/* Background Image with Overlay */}
  //     <div className="absolute inset-0 z-0">
  //       <Image
  //         src="/n_f_m.jpg"
  //         alt="Truck on highway"
  //         layout="fill"
  //         objectFit="cover"
  //         quality={100}
  //         priority
  //       />
  //     </div>

  //     <div className="container mx-auto px-6 lg:px-24 relative z-10">
  //       <div className="flex flex-col lg:flex-row gap-16 items-center py-24">
  //         {/* Left Section (Text Content) */}
  //         <motion.div
  //           className="lg:w-1/2 space-y-8"
  //           initial="hidden"
  //           animate="visible"
  //           variants={containerVariants}
  //         >
  //           <motion.h3
  //             className="text-4xl sm:text-5xl font-extrabold leading-tight text-white"
  //             variants={itemVariants}
  //           >
  //             <span>Drive Smart,</span> Maintain Smarter
  //           </motion.h3>

  //           <motion.h1
  //             className="text-2xl sm:text-3xl font-bold text-gray-200"
  //             variants={itemVariants}
  //           >
  //             The Ultimate App for Semi Trucks & Trailers
  //           </motion.h1>

  //           <motion.p
  //             className="text-lg sm:text-xl text-gray-200/90 leading-relaxed"
  //             variants={itemVariants}
  //           >
  //             Rabbit Mechanic is a smart service platform built specifically for
  //             semi trucks and trailers across USA, Canada & Mexico. Whether
  //             you&apos;re a fleet owner, single truck driver, or roadside
  //             mechanic, we help you manage, maintain, and move with confidence.
  //           </motion.p>

  //           <motion.div
  //             className="flex flex-col sm:flex-row gap-4 pt-4"
  //             variants={itemVariants}
  //           >
  //             {downloadButtons.map((button, index) => (
  //               <motion.a
  //                 key={index}
  //                 href={button.link}
  //                 className={`${button.color} text-white px-6 py-3 rounded-lg flex items-center gap-2 justify-center font-medium shadow-lg`}
  //                 variants={buttonVariants}
  //                 whileHover="hover"
  //                 whileTap="tap"
  //               >
  //                 {button.icon}
  //                 {button.text}
  //               </motion.a>
  //             ))}
  //           </motion.div>

  //           {/* Trust Badges */}
  //           <motion.div
  //             className="flex flex-wrap gap-4 items-center pt-6"
  //             variants={itemVariants}
  //           >
  //             <div className="flex items-center gap-2">
  //               <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
  //                 <FaCheckCircle className="text-green-500" />
  //               </div>
  //               <span className="text-gray-200">Trusted by 500+ fleets</span>
  //             </div>
  //             <div className="flex items-center gap-2">
  //               <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
  //                 <FaAward className="text-yellow-500" />
  //               </div>
  //               <span className="text-gray-200">4.9/5 Rating</span>
  //             </div>
  //           </motion.div>
  //         </motion.div>

  //         {/* Right Section (Booking Form) - Keep your existing form code */}

  //         <div className="lg:w-[420px] bg-white rounded-xl shadow-lg p-4 sm:p-12 flex flex-col justify-center space-y-6 m-8">
  //           <h1 className="text-3xl font-semibold text-center text-gray-800">
  //             Find Mechanic
  //           </h1>
  //           <form className="space-y-6">
  //             {/* Vehicle Select */}
  //             <div className="flex gap-2">
  //               <select
  //                 onChange={handleVehicleChange}
  //                 className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
  //               >
  //                 <option value="">Select A Vehicle</option>
  //                 {vehicles.map((vehicle, index) => (
  //                   <option key={index} value={vehicle.vehicleNumber}>
  //                     {vehicle.vehicleNumber}({vehicle.companyName})
  //                   </option>
  //                 ))}
  //               </select>

  //               <button
  //                 className="btn bg-[#F96176] text-white text-2xl text-center rounded-md hover:bg-[#eb929e] tooltip"
  //                 title="Add Vehicle"
  //                 onClick={(e) => {
  //                   e.preventDefault();
  //                   setShowPopup(true);
  //                 }}
  //               >
  //                 +
  //               </button>

  //               {/* Reusable Popup Component */}
  //               <PopupModal
  //                 isOpen={showPopup}
  //                 onClose={() => setShowPopup(false)}
  //                 title="Select Option"
  //                 options={[
  //                   {
  //                     label: "Add Vehicle",
  //                     onClick: () => handleRedirect({ path: "/add-vehicle" }),
  //                   },
  //                   {
  //                     label: "Import Vehicle",
  //                     onClick: () =>
  //                       handleRedirect({ path: "/import-vehicle" }),
  //                     bgColor: "blue",
  //                   },
  //                 ]}
  //               />
  //             </div>

  //             {/* Service Select */}
  //             <div>
  //               <select
  //                 onChange={handleServiceChange}
  //                 className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
  //               >
  //                 <option value="">Select A Service</option>
  //                 {services
  //                   .slice()
  //                   .sort((a, b) => a.title.localeCompare(b.title))
  //                   .map((service, index) => (
  //                     <option key={index} value={service.title}>
  //                       {service.title}
  //                     </option>
  //                   ))}
  //               </select>
  //             </div>

  //             {/* Select Location */}
  //             <div className="flex gap-2">
  //               <select
  //                 onChange={handleLocationChange}
  //                 className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
  //               >
  //                 <option value="">Select Your Location</option>
  //                 {location.map((location, index) => (
  //                   <option key={index} value={location.address}>
  //                     {location.address}
  //                   </option>
  //                 ))}
  //               </select>
  //               <Link href="/add-location">
  //                 <button
  //                   className="btn bg-[#F96176] text-white text-2xl text-center rounded-md hover:bg-[#eb929e] tooltip"
  //                   title="Add Vehicle"
  //                 >
  //                   +
  //                 </button>
  //               </Link>
  //             </div>

  //             {/* Select Image */}
  //             <div>
  //               <input
  //                 type="file"
  //                 className="file-input w-full rounded-lg
  //                bg-[#F96176]/20 text-[#F96176] border border-[#F96176]
  //                file:bg-[#F96176] file:text-white file:border-0
  //                file:rounded-lg file:mr-2 file:font-medium
  //                hover:file:bg-[#F96176]/90
  //                focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]
  //                transition-all"
  //                 accept="image/*"
  //                 onChange={(e) => {
  //                   if (e.target.files && e.target.files[0]) {
  //                     setSelectedImage(e.target.files[0]);
  //                   }
  //                 }}
  //                 required={selectedServiceData?.image_type === 1}
  //               />
  //               {selectedServiceData?.image_type === 1 && (
  //                 <p className="text-red-500 text-sm mt-1">
  //                   * Image upload is mandatory for this service
  //                 </p>
  //               )}
  //             </div>

  //             {/* Special Request Textarea */}
  //             <div>
  //               <textarea
  //                 className="w-full p-4 h-32 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
  //                 placeholder="Description"
  //                 value={description}
  //                 onChange={(e) => setDescription(e.target.value)}
  //               ></textarea>
  //             </div>

  //             {/* Book Now Button */}
  //             <div>
  //               <button
  //                 className="w-full bg-[#58BB87] text-white py-3 px-6 rounded-lg hover:from-[#58BB87] hover:to-[#58BB87] transition duration-300 ease-in-out transform hover:scale-105"
  //                 onClick={handleFindMechanicClick}
  //               >
  //                 Find Mechanic
  //               </button>
  //             </div>
  //           </form>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Floating Truck Animation */}
  //     <motion.div
  //       className="absolute bottom-10 left-10 hidden lg:block"
  //       animate={{
  //         x: [0, 20, 0],
  //         y: [0, -10, 0],
  //       }}
  //       transition={{
  //         duration: 8,
  //         repeat: Infinity,
  //         ease: "easeInOut",
  //       }}
  //     >
  //       {/* <Image
  //         src="/truck-icon.png"
  //         alt="Floating truck"
  //         width={80}
  //         height={80}
  //       /> */}
  //     </motion.div>
  //   </div>
  // );

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
                  <span>Drive Smart,</span> Maintain Smarter
                </motion.h6>
              </motion.div>
              <motion.div className="space-y-2 " variants={itemVariants}>
                <motion.h1
                  className="text-1xl sm:text-2xl font-bold text-gray-200 gap-1"
                  variants={itemVariants}
                >
                  The Ultimate App for Semi Trucks & Trailers
                </motion.h1>
              </motion.div>

              <div className="max-w-[500px] ">
                <motion.p
                  className="text-lg sm:text-xl text-gray-200 font-bold leading-relaxed"
                  variants={itemVariants}
                >
                  Rabbit Mechanic is a smart service platform built specifically
                  for semi trucks and trailers across USA, Canada & Mexico.
                  Whether you&apos;re a fleet owner, single truck driver, or
                  roadside mechanic, we help you manage, maintain, and move with
                  confidence.
                </motion.p>
              </div>
              <motion.div className="mb-24"></motion.div>
              {/* Download Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 pt-4"
                variants={itemVariants}
              >
                {downloadButtons.map((button, index) => (
                  <motion.a
                    key={index}
                    href={button.link}
                    className={`${button.color} text-white px-6 py-3 rounded-lg flex items-center gap-2 justify-center font-medium shadow-md hover:shadow-xl transition-all duration-300`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {button.icon}
                    {button.text}
                  </motion.a>
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
          <div className="lg:w-[420px] bg-white/90 backdrop-blur-md border border-gray-300 rounded-xl shadow-xl p-4 sm:p-8 space-y-1">
            <h1 className="text-3xl font-semibold text-center text-gray-800">
              Find Mechanic
            </h1>

            <form className="space-y-6">
              {/* Vehicle Select */}
              <div className="flex gap-2">
                <select
                  onChange={handleVehicleChange}
                  className="w-full h-14 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
                >
                  <option value="">Select A Vehicle</option>
                  {vehicles.map((vehicle, index) => (
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSection;
