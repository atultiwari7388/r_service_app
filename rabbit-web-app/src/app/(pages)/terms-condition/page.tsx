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
                      Terms of Use Agreement - 20 December, 2024 Welcome to the
                      website for the Rabbit Mechanic Service, which is powered
                      by Regal Application LLC. YOU ACCEPT THE FOLLOWING TERMS
                      OF USE AND AGREE TO BE BOUND BY THEM BY USING THIS
                      WEBSITE. PLEASE READ THESE TERMS CAREFULLY. You should not
                      use this website in any way if you do not agree to these
                      terms. Rabbit Mechanic Service powered by Regal
                      Application LLC, the website&apos;s owner, is referred to
                      by the terms &quot;Rabbit Mechanic Service,&quot;
                      &quot;us,&quot; &quot;we,&quot; and &quot;our.&quot; The
                      user or viewer of this website is referred to as
                      &quot;you.&quot; Acceptance of Agreement Regarding our
                      website (the &quot;Site&quot;), you accept the terms and
                      conditions stated in this Terms of Use Agreement (the
                      &quot;Agreement&quot;). All previous or contemporaneous
                      agreements, representations, warranties, and
                      understandings regarding the Site, its content, any goods
                      or services offered by or through the Site, and the
                      subject matter of this Agreement are superseded by this
                      Agreement, which is the sole and comprehensive agreement
                      between you and us. This Agreement contains the following
                      terms and conditions: the Rating Policy, the Vendor Terms
                      and Conditions, the API Terms and Conditions, and the
                      Privacy Policy. All of these are available via links
                      within this Agreement and are hereby incorporated herein
                      by reference and constitute an essential part of it. We
                      reserve the right to amend this agreement at any time or
                      from time to time without giving you specific notice. You
                      should review any amended agreements before using the site
                      again. The most recent agreement will be posted on the
                      site (and appropriately date-stamped). You will be bound
                      by the terms of this agreement whether or not you read it
                      in its original form or any subsequent amendments.
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
