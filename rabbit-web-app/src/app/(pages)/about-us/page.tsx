"use client";

import { db } from "@/lib/firebase";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";

const AboutUs: React.FC = () => {
  const [loading, setIsLoading] = useState(false);
  const [aboutUs, setAboutUs] = useState();

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
      GlobalToastError(error);
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
                {aboutUs}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AboutUs;
