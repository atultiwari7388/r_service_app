"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import HashLoader from "react-spinners/HashLoader";

interface Vehicle {
  id: string;
  companyName: string;
  vehicleNumber: string;
  licensePlate: string | null;
  vin: string | null;
  year: string;
  isSet: boolean;
}

interface CreateTeamMemberForm {
  memberName: string;
  memberEmail: string;
  memberPhoneNumber: string;
  memberPassword: string;
  assignedVehicle: string;
  role: string;
}

export default function CreateTeamMemberPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [assignVehicleList, setAssignVehicleList] = useState<Vehicle[]>([]);
  const { user } = useAuth() || { user: null };
  const currentUserId = user?.uid;
  const router = useRouter();
  const [formData, setFormData] = useState<CreateTeamMemberForm>({
    memberName: "",
    memberEmail: "",
    memberPhoneNumber: "",
    memberPassword: "",
    assignedVehicle: "",
    role: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.memberName ||
      !formData.memberEmail ||
      !formData.memberPhoneNumber ||
      !formData.memberPassword ||
      !formData.assignedVehicle
    ) {
      toast.error("All fields and vehicle selection are required");
      return;
    }

    // Validate email format
    const emailRegex =
      /^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]+\.[a-zA-Z]+/;
    if (!emailRegex.test(formData.memberEmail)) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.memberEmail,
        formData.memberPassword
      );

      await setDoc(doc(db, "Users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.memberEmail,
        active: true,
        isTeamMember: true,
        userName: formData.memberName,
        phoneNumber: formData.memberPhoneNumber,
        createdBy: currentUserId,
        profilePicture:
          "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
        role: "TMember",
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Get and store selected vehicle
      const vehicleDoc = await getDoc(
        doc(db, "Users", user!.uid, "Vehicles", formData.assignedVehicle)
      );

      if (vehicleDoc.exists()) {
        const vehicleData = vehicleDoc.data();
        await setDoc(
          doc(
            db,
            "Users",
            userCredential.user.uid,
            "Vehicles",
            formData.assignedVehicle
          ),
          {
            companyName: vehicleData.companyName,
            licensePlate: vehicleData.licensePlate,
            vehicleNumber: vehicleData.vehicleNumber,
            year: vehicleData.year,
            vin: vehicleData.vin,
            isSet: vehicleData.isSet,
            assigned_at: new Date(),
            createdAt: new Date(),
          }
        );
      }
      // Send verification email
      await sendEmailVerification(userCredential.user);
      toast.success(`Verification email sent to ${formData.memberEmail}`);

      // Redirect or show success message
      toast.success("Team member created successfully");
      // Reset form data after successful creation
      setFormData({
        memberName: "",
        memberEmail: "",
        memberPhoneNumber: "",
        assignedVehicle: "",
        memberPassword: "",
        role: "",
      });
      await auth.signOut();
      //go to login page
      router.push("/login");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create team member error: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVehicleList = async () => {
    setIsLoading(true);

    if (user) {
      try {
        const userVehicleref = collection(db, "Users", user.uid, "Vehicles");
        const querySnapshot = await getDocs(userVehicleref);
        const vehicleList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAssignVehicleList(vehicleList as Vehicle[]);
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch vehicle list");
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Please log in to access the manage team page.");
    }
  };

  useEffect(() => {
    fetchUserVehicleList();
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 fixed top-0 left-0 z-50">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Create Team Member
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="memberName"
                className="block text-sm font-medium text-gray-700"
              >
                Enter member Name
              </label>
              <input
                type="text"
                id="memberName"
                name="memberName"
                value={formData.memberName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-150 ease-in-out sm:text-sm"
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="memberEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Enter member Email
              </label>
              <input
                type="email"
                id="memberEmail"
                name="memberEmail"
                value={formData.memberEmail}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-150 ease-in-out sm:text-sm"
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <label
                htmlFor="memberPhoneNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Enter member Phone Number
              </label>
              <input
                type="tel"
                id="memberPhoneNumber"
                name="memberPhoneNumber"
                value={formData.memberPhoneNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-150 ease-in-out sm:text-sm"
                placeholder="Enter phone number"
                required
              />
            </div>

            <div>
              <label
                htmlFor="memberPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Enter member Password
              </label>
              <input
                type="password"
                id="memberPassword"
                name="memberPassword"
                value={formData.memberPassword}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-150 ease-in-out sm:text-sm"
                placeholder="Enter password"
                required
              />
            </div>

            <div>
              <label
                htmlFor="assignedVehicle"
                className="block text-sm font-medium text-gray-700"
              >
                Assign Vehicle
              </label>
              <select
                id="assignedVehicle"
                name="assignedVehicle"
                value={formData.assignedVehicle}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-[#F96176] focus:ring-2 focus:ring-[#F96176] focus:ring-opacity-50 transition duration-150 ease-in-out sm:text-sm"
              >
                <option value="">Select a vehicle</option>
                {assignVehicleList.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.companyName} - {vehicle.vehicleNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-4">
              <Link href="/account/manage-team">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F96176] transition duration-150 ease-in-out"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F96176] hover:bg-[#e54d62] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F96176] transition duration-150 ease-in-out"
              >
                Create Member
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
