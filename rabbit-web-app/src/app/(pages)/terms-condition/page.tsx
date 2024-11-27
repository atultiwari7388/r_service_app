"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { GlobalToastError } from "@/utils/globalErrorToast";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function TermsCondition() {
  const [loading, setLoading] = useState<boolean>(false);
  const [termsCondition, setTermsCondition] = useState<string>("");
  const { user } = useAuth() || { user: null };

  const fetchTermsCondition = async () => {
    setLoading(true);
    try {
      const termsConditionRef = doc(db, "metadata", "termsCond");
      const termsConditionSnapshot = await getDoc(termsConditionRef);

      if (termsConditionSnapshot.exists()) {
        const termsConditionData =
          termsConditionSnapshot.data()?.description || [];
        console.log(termsConditionData);
        setTermsCondition(termsConditionData);
        return termsConditionData;
      }
    } catch (error) {
      GlobalToastError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTermsCondition();
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 text-center">
            Terms & Conditions
          </h1>
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed space-y-6">
                {user ? (
                  <div className="text-gray-700 leading-relaxed space-y-6">
                    {termsCondition}
                  </div>
                ) : (
                  <div className="text-gray-700 leading-relaxed space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Terms and condition
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
