"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function PrivacyPolicy(): JSX.Element {
  const [loading, setIsLoading] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState();

  const { user } = useAuth() || { user: null };

  const fetchPrivacyPolicy = async () => {
    setIsLoading(true);
    try {
      const privacyPolicyRef = doc(db, "metadata", "privacyPolicy");
      const privacyPolicySnapshot = await getDoc(privacyPolicyRef);

      if (privacyPolicySnapshot.exists()) {
        const privacyPolicyData =
          privacyPolicySnapshot.data()?.description || [];
        console.log(privacyPolicyData);
        setPrivacyPolicy(privacyPolicyData);
        return privacyPolicyData;
      }
    } catch (error) {
      GlobalToastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 text-center">
            Privacy Policy
          </h1>
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed space-y-6">
                {user ? (
                  <div className="text-gray-700 leading-relaxed space-y-6">
                    {privacyPolicy}
                  </div>
                ) : (
                  <div className="text-gray-700 leading-relaxed space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Privacy Policy
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
