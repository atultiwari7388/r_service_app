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
                    TrenoOps was founded by logistics professionals and built
                    with real truckers in mind. TrenoOps is a smart, all-in-one
                    service application and website built exclusively for Semi
                    Trucks and Trailers, featuring an intelligent Automatic
                    Service Alert System that keeps your fleet fully maintained
                    and always road-ready. With TrenoOps , you can effortlessly
                    track detailed service records for every vehicle, ensuring
                    you stay updated on all past maintenance and upcoming tasks.
                    The system sends real-time service reminders so you never
                    miss critical upkeep—including engine oil changes, wheel
                    alignment (truck and trailer), filter replacements (air,
                    fuel, DEF, cabin), tire rotations/replacements, tune-ups,
                    transmission fluid, and differential oil changes. It also
                    delivers scheduled alerts for full inspections, including
                    brake checks and DOT compliance, helping prevent breakdowns
                    and costly regulatory issues. Designed for both
                    owner-operators and fleet managers, TrenoOps offers a
                    powerful suite of tools like maintenance history tracking,
                    service scheduling, a fleet dashboard, and access to on-site
                    or mobile mechanics. Whether you’re managing a single truck
                    or an entire fleet, TrenoOps helps maximize uptime, reduce
                    unexpected repairs, and extend the life of your rigs—all
                    from one easy-to-use platform. Need a mechanic fast? Use
                    TrenoOps to find and connect with nearby verified mechanics,
                    perfect for both emergency fixes and scheduled work. You can
                    also track trips, monitor mileage, and manage your driver
                    team for full operational visibility. TrenoOps Mechanic is
                    your trusted digital co-pilot, making predictive maintenance
                    and smart fleet management simple, efficient, and
                    stress-free.
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
