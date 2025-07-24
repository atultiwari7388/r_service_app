"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
// import { GlobalToastError } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function AboutUsComponent() {
  const [loading, setIsLoading] = useState(false);
  const [aboutUs, setAboutUs] = useState();
  const { user } = useAuth() || { user: null };

  const fetchAboutUs = async () => {
    setIsLoading(true);
    try {
      const aboutUsRef = doc(db, "metadata", "aboutUs");
      const aboutUsSnapshot = await getDoc(aboutUsRef);

      if (aboutUsSnapshot.exists()) {
        const aboutUsData = aboutUsSnapshot.data()?.description || [];
        console.log(aboutUsData);
        setAboutUs(aboutUsData);
        return aboutUsData;
      }
    } catch (error) {
      // GlobalToastError(error);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAboutUs();
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 text-center">
            About Us
          </h1>
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed space-y-6">
                {user ? (
                  <div className="text-gray-700 leading-relaxed space-y-6">
                    {aboutUs}
                  </div>
                ) : (
                  <div className="text-gray-700 leading-relaxed space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Rabbit Mechanic stands at the forefront of the automotive
                      service industry, blending reliability with
                      cost-effectiveness for unparalleled Truck & Traler care.
                      We have expanded our presence across 50+ cities in USA,
                      offering comprehensive car servicing solutions tailored to
                      meet the diverse needs of our customers. Our dedicated
                      team of over 100 skilled technicians undergo meticulous
                      training to ensure expertise in the latest automotive
                      technologies.
                    </h2>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
