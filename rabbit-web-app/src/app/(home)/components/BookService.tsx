import { useAuth } from "@/contexts/AuthContexts";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ServiceType, VehicleTypes, AddressType } from "@/types/types";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import Link from "next/link";

const BookingSection: React.FC = () => {
  const { user } = useAuth() || { user: null };
  const router = useRouter();

  console.log(user?.uid);

  const [services, setServices] = useState<ServiceType[]>([]);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);
  const [location, setLocation] = useState<AddressType[]>([]);

  // State for selected values
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Handle selection changes
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const service = e.target.value;
    setSelectedService(service);
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
            imageType: service.image_type || 0,
            priceType: service.price_type || 0,
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
              vehicleNumber: data.vehicleNumber,
              companyName: data.companyName,
              createdAt: data.createdAt,
              isSet: data.isSet,
              licensePlate: data.licensePlate,
              vin: data.vin,
              year: data.year,
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
        console.error("Error fetching vehicles:", error);
      }
      return [];
    };

    const loadData = async () => {
      const [servicesData, vehicleData, location] = await Promise.all([
        fetchServices(),
        fetchUserVehicles(),
        fetchUserAddress(),
      ]);
      setServices(servicesData);
      setVehicles(vehicleData);
      setLocation(location);
    };

    if (user?.uid) loadData();
  }, [user]);

  const handleFindMechanicClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in first to book your service");
      router.push("/login");
      return;
    }

    // Log selected values to console
    console.log("Selected Service:", selectedService);
    console.log("Selected Vehicle:", selectedVehicle);
    console.log("Selected Location:", selectedLocation);
    console.log("Selected Location:", selectedLocation);
  };

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
              Book a Service
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
                        {vehicle.vehicleNumber}
                      </option>
                    ))}
                  </select>

                  <Link href="/add-vehicle">
                    <button
                      className="btn bg-[#F96176] text-white text-2xl text-center rounded-md hover:bg-[#eb929e] tooltip mt-1"
                      title="Add Vehicle"
                    >
                      +
                    </button>
                  </Link>
                </div>

                {/* Service Select */}
                <div className="col-span-1">
                  <select
                    onChange={handleServiceChange}
                    className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
                  >
                    <option value="">Select A Service</option>
                    {services.map((service, index) => (
                      <option key={index} value={service.title}>
                        {service.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Location */}
                <div className="col-span-1">
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
                </div>

                {/* Select Image */}
                <div className="col-span-1">
                  <input
                    type="file"
                    className="file-input file-input-gray w-full max-w-xs bg-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
                    accept="image/*"
                    onChange={(e) => {
                      e.preventDefault();
                      // setImage(e.target.files[0]);
                    }}
                    required
                  />
                </div>

                {/* Special Request Textarea */}
                <div className="col-span-1">
                  <textarea
                    className="w-full p-4 h-22 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition"
                    placeholder="Description"
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
