import { useAuth } from "@/contexts/AuthContexts";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ServiceType } from "@/types/services";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import SelectService from "./SelectService";
import FetchSelectVehicle from "./FetchSelectVehicle";
import { VehicleTypes } from "@/types/vehicles";

interface Service {
  title: string;
  image_type: number;
  price_type: number;
  image: string;
  isFeatured: boolean;
}

const BookingSection: React.FC = () => {
  const { user } = useAuth() || { user: null };
  const router = useRouter();

  console.log(user?.uid);

  const [services, setServices] = useState<ServiceType[]>([]);
  const [vehicles, setVehicles] = useState<VehicleTypes[]>([]);

  useEffect(() => {
    const fetchServices = async (): Promise<ServiceType[]> => {
      try {
        const metadataDocRef = doc(db, "metadata", "servicesList");
        const metadataSnapshot = await getDoc(metadataDocRef);

        if (metadataSnapshot.exists()) {
          const servicesList = metadataSnapshot.data()?.data || [];
          return servicesList.map((service: Service) => ({
            title: service.title || "",
            imageType: service.image_type || 0,
            priceType: service.price_type || 0,
            image: service.image || "",
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

    const loadData = async () => {
      const [servicesData, vehicleData] = await Promise.all([
        fetchServices(),
        fetchUserVehicles(),
      ]);
      setServices(servicesData);
      setVehicles(vehicleData);
    };

    if (user?.uid) loadData();
  }, [user]);

  const handleFindMechanicClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in first to book your service");
      router.push("/login");
      return;
    } else {
    }
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
          {/* Left Section (Booking Form) */}
          <div className="lg:w-1/2 bg-white rounded-xl shadow-lg p-8 sm:p-12 flex flex-col justify-center space-y-6">
            <h1 className="text-3xl font-semibold text-center text-gray-800">
              Book a Service
            </h1>
            <form>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Vehicle Select */}
                <div className="col-span-1">
                  <FetchSelectVehicle vehicles={vehicles} />
                </div>

                {/* Service Select */}
                <div className="col-span-1">
                  <SelectService services={services} />
                </div>

                {/* Select Location */}
                <div className="col-span-1">
                  <select className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition">
                    <option defaultValue={"Select Your Location"}>
                      Select Your Location
                    </option>
                    <option value="1">Location 1</option>
                    <option value="2">Location 2</option>
                    <option value="3">Location 3</option>
                  </select>
                </div>

                {/* Select Image */}
                <div className="col-span-1">
                  <input
                    type="file"
                    className="file-input w-full border border-gray-700 focus:ring-2 focus:ring-[#F96176] transition text-black"
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
                    className="w-full bg-[#F96176] text-white py-3 px-6 rounded-lg hover:from-[#F96176] hover:to-[#58BB87] transition duration-300 ease-in-out transform hover:scale-105"
                    onClick={handleFindMechanicClick}
                  >
                    Find Mechanic
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Section (Text Content) */}
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
        </div>
      </div>
    </div>
  );
};

export default BookingSection;
