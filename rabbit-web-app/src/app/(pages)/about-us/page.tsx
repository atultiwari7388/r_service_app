"use client";

import { db } from "@/lib/firebase";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
      toast.error("Something went wrong", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAboutUs();
  }, []);

  if (loading) {
    return LoadingIndicator();
  }

  return <div>AboutUs</div>;
};
export default AboutUs;
