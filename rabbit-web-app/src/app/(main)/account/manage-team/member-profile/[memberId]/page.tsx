// app/account/manage-team/member-profile/[memberId]/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import HashLoader from "react-spinners/HashLoader";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiHome,
  FiGlobe,
  FiCreditCard,
} from "react-icons/fi";

interface MemberData {
  userName: string;
  email: string;
  phoneNumber: string;
  telephoneNumber: string;
  email2: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  licNumber: string;
  role: string;
  profilePicture: string;
}

export default function ViewMemberProfile() {
  const { user: authUser } = useAuth() || { user: null };
  const params = useParams();
  const memberId = params.memberId as string;

  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!authUser || !memberId) return;

      try {
        setIsLoading(true);
        const docRef = doc(db, "Users", memberId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as MemberData;
          setMemberData(data);
          setHasError(false);
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error("Error fetching member data:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberData();
  }, [authUser, memberId]);

  const InfoCard = ({
    title,
    value,
    icon: Icon,
  }: {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
      <div className="flex items-start">
        <Icon className="h-5 w-5 text-[#F96176] mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-gray-900 font-medium">{value || "Not provided"}</p>
        </div>
      </div>
    </div>
  );

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access this page</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <HashLoader color="#F96176" />
      </div>
    );
  }

  if (hasError || !memberData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load profile
          </h3>
          <p className="text-gray-500 mb-4">
            Unable to load the member profile information.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#F96176] text-white px-4 py-2 rounded-lg hover:bg-[#e54d62] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#F96176] text-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Member Profile</h1>
              <p className="text-[#F96176] text-sm bg-white/20 px-2 py-1 rounded-full inline-block mt-1">
                Team Member
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-[#F96176] bg-opacity-10 rounded-full flex items-center justify-center mr-6">
              {memberData.profilePicture &&
              memberData.profilePicture !== "/default-avatar.png" ? (
                <img
                  src={memberData.profilePicture}
                  alt={memberData.userName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <svg
                  className="w-10 h-10 text-[#F96176]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {memberData.userName}
              </h2>
              <p className="text-gray-600">Co-Owner</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Contact Information
          </h3>
          <InfoCard
            title="Phone Number"
            value={memberData.phoneNumber}
            icon={FiPhone}
          />
          <InfoCard
            title="Telephone Number"
            value={memberData.telephoneNumber}
            icon={FiPhone}
          />
          <InfoCard
            title="Email Address"
            value={memberData.email}
            icon={FiMail}
          />
          {memberData.email2 && (
            <InfoCard
              title="Secondary Email"
              value={memberData.email2}
              icon={FiMail}
            />
          )}
        </div>

        {/* Address Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Address Information
          </h3>
          <InfoCard title="Address" value={memberData.address} icon={FiHome} />
          <InfoCard title="City" value={memberData.city} icon={FiMapPin} />
          <InfoCard title="State" value={memberData.state} icon={FiMapPin} />
          <InfoCard title="Country" value={memberData.country} icon={FiGlobe} />
          {memberData.postalCode && (
            <InfoCard
              title="Postal Code"
              value={memberData.postalCode}
              icon={FiMapPin}
            />
          )}
        </div>

        {/* License Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            License Information
          </h3>
          <InfoCard
            title="License Number"
            value={memberData.licNumber}
            icon={FiCreditCard}
          />
        </div>
      </div>
    </div>
  );
}
