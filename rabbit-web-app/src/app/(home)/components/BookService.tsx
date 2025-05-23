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
          return vehiclesSnapshot.docs.map((doc) => {
            const data = doc.data() as VehicleTypes;
            return {
              id: doc.id,
              vehicleNumber: data.vehicleNumber,
              companyName: data.companyName,
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
            };
          });
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
        toast.error("Failed to load data");
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

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div
      className="py-24 bg-cover bg-center"
      style={{
        background: "url('/testimonial_bg_1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="container mx-auto px-6 lg:px-24">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left Section (Text Content) */}
          <div className="lg:w-1/2 text-white space-y-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Certified & Award-Winning Vehicle Repair Services
            </h1>
            <p className="text-lg sm:text-xl text-gray-200">
              Eirmod sed tempor lorem ut dolores. Aliquyam sit sadipscing kasd
              ipsum. Dolor ea et dolore et at sea ea at dolor, justo ipsum duo
              rebum sea invidunt voluptua. Eos vero eos vero ea et dolore eirmod
              et. Dolores diam duo invidunt lorem. Elitr ut dolores magna sit.
              Sea dolore sanctus sed et.
            </p>
          </div>

          {/* Right Section (Booking Form) */}
          <div className="lg:w-1/2 bg-white rounded-xl shadow-lg p-8 sm:p-12 flex flex-col justify-center space-y-6">
            <h1 className="text-3xl font-semibold text-center text-gray-800">
              Find Mechanic
            </h1>
            <form>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Vehicle Select */}
                <div className="col-span-1 flex gap-2">
                  <select
                    onChange={handleVehicleChange}
                    className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
                  >
                    <option value="">Select A Vehicle</option>
                    {vehicles.map((vehicle, index) => (
                      <option key={index} value={vehicle.vehicleNumber}>
                        {vehicle.vehicleNumber}({vehicle.companyName})
                      </option>
                    ))}
                  </select>

                  <button
                    className="btn bg-[#F96176] text-white text-2xl text-center rounded-md hover:bg-[#eb929e] tooltip mt-1"
                    title="Add Vehicle"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent default behavior
                      setShowPopup(true); // Open the popup
                    }}
                  >
                    +
                  </button>

                  {/* Reusable Popup Component */}
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
                <div className="col-span-1">
                  <select
                    onChange={handleServiceChange}
                    className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
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
                {/* Select Location */}
                <div className="col-span-1 flex gap-2">
                  <select
                    onChange={handleLocationChange}
                    className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
                  >
                    <option value="">Select Your Location</option>
                    {location.map((location, index) => (
                      <option key={index} value={location.address}>
                        {location.address}
                      </option>
                    ))}
                  </select>
                  <Link href="/add-location">
                    <button
                      className="btn bg-[#F96176] text-white text-2xl text-center rounded-md hover:bg-[#eb929e] tooltip mt-1"
                      title="Add Vehicle"
                    >
                      +
                    </button>
                  </Link>
                </div>
                {/* Select Image */}
                {/* <div className="col-span-1">
                  <input
                    type="file"
                    className="file-input file-input-gray w-full max-w-xs bg-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
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
                </div> */}
                {/* Select Image */}
                {/* <div className="col-span-1">
                  <input
                    type="file"
                    className="file-input w-full max-w-xs rounded-lg
             bg-[#F96176] text-white
             file:bg-[#F96176] file:text-white file:rounded-lg
             hover:file:bg-[#F96176]/90 focus:outline-none focus:ring-2 focus:ring-[#F96176] 
             transition-all"
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
                </div> */}

                {/* Select Image */}
                <div className="col-span-1">
                  <input
                    type="file"
                    className="file-input w-full max-w-xs rounded-lg
             bg-[#F96176]/20 text-[#F96176] border border-[#F96176]
             file:bg-[#F96176] file:text-white file:border-0
             file:rounded-lg file:mr-2 file:font-medium
             hover:file:bg-[#F96176]/90
             focus:outline-none focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176]
             transition-all"
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

                {/* Special Request Textarea */}
                <div className="col-span-1">
                  <textarea
                    className="w-full p-4 h-22 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
                {/* Book Now Button */}
                <div className="col-span-1">
                  <button
                    className="w-full bg-[#F96176] text-white py-3 px-6 rounded-lg hover:from-[#F96176] hover:to-[#58BB87] transition duration-300 ease-in-out transform hover:scale-105 mt-5"
                    onClick={handleFindMechanicClick}
                  >
                    Find Mechanic
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSection;
