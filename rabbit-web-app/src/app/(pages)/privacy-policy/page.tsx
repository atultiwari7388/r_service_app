"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
import { LoadingIndicator } from "@/utils/LoadinIndicator";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function PrivacyPolicy(): JSX.Element {
  const [loading, setIsLoading] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState<string>("");

  const { user } = useAuth() || { user: null };

  const fetchPrivacyPolicy = async () => {
    setIsLoading(true);
    try {
      const privacyPolicyRef = doc(db, "metadata", "privacyPolicy");
      const privacyPolicySnapshot = await getDoc(privacyPolicyRef);

      if (privacyPolicySnapshot.exists()) {
        const privacyPolicyData =
          privacyPolicySnapshot.data()?.description || "";
        setPrivacyPolicy(privacyPolicyData);
        console.log(privacyPolicy);
        return privacyPolicyData;
      }
    } catch (error) {
      console.error("Error fetching privacy policy:", error);
      // GlobalToastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPrivacyPolicy();
    }
  }, [user]);

  if (loading) {
    return <LoadingIndicator />;
  }

  const staticPrivacyPolicy = `
    <h2 class="text-2xl font-bold text-gray-800 mb-4">Privacy Policy – December, 2024</h2>
    
    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">1. Preamble</h3>
    <p>We are hereby providing you the Rabbit Mechanic Service for dedicating to protect your privacy online and understand that you necessitate dealing with and protecting any identifiable personal information to be provided to us by you or on your behalf.</p>
    <p>In order to assist you understand as to how we arrange to handle your personal information, Rabbit Mechanic Service has been creating this policy of privacy online.</p>
    <p>Any of the information whichever can be used in order to identify a person to be considered personal information. It includes, but is unlimited to, a person's name either first or the last with address of home either physically or the email and other details including contacts, either at work place or at home, as well as any of other information necessary about such person.</p>
    <p>We have reserve our right to make any changes in this online Privacy policy at any stage as we think fit to change it from time to time without serving any prior notice upon you or your representatives. You will have to review any of the updated policy online before using the same again, however the most current version will be posted here (and suitably date-stamped). You will remain bound from the terms of this online privacy policy, whether it has been read over originally or any updates, by you and any of the representatives on your behalf.</p>
    
    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">2. Cookies</h3>
    <p>"Cookies" are the small data files that your browser saves the same to the hard drive of your computer or in any other way. They agree with right to us to track when you or a computer user shall visit our website again. Through the identification of exclusive deals or connections, cookies enhance the personalization of your visit. Although most web browsers accept cookies by default, you can choose to reject them in your browser's settings. But you will have aware satisfactory that in case you disable cookies, our website might not function as well as it can do.</p>
    
    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">3. Our right of Use Your Personal Information</h3>
    <p>If you opted to provide us your personal information, then the Rabbit Mechanic Service may hold the same in the ways as follows to:</p>
    <ol class="list-decimal pl-6 space-y-2">
      <li>Identify or recognize you;</li>
      <li>Comply with the lawful and regulatory requirements.</li>
      <li>Manufacture and protect a linkage of responsibility with you;</li>
      <li>Manage and grow up Rabbit Mechanic Service's operations and its businesses;</li>
      <li>Safeguard you as well as Rabbit Mechanic Service from any kind of scams or fraud and errors;</li>
      <li>Get to know you in the other ways so that Rabbit Mechanic Service may better understand your needs and the goods and/or services, which you might need or be in the business of providing, depending on your situation;</li>
    </ol>
    
    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">4. Our revelations towards Your Personal Information</h3>
    <p>If you choose to provide to us, then the Rabbit Mechanic Service will have right to disclose your personal information to the parties as follows:</p>
    <ol class="list-disc pl-6 space-y-2">
      <li>To a third party, who needs for such information to help Rabbit Mechanic Service with its general administration and/or for the purpose of business operations;</li>
      <li>To that of a third party if the information was given via a website that of a third party owns;</li>
      <li>To a third party indicates interest in purchasing all or any part of Rabbit Mechanic Service's business operations;</li>
      <li>To a third party where such revelation is predetermined by law.</li>
    </ol>
    <p>Rabbit Mechanic Service shall have at its option publish just the Names of company of the User Pass Account holders, but it never "sells" or otherwise gives away Personal Information regarding User Pass Account holders to outside parties.</p>
    <p>Rabbit Mechanic Service shall have at its discretion further to provide a third party the contact details of all or some/partly of its listed vendors if Rabbit Mechanic Service, acting realistically, is convinced that the third party will only use the information to offer those listed vendors a product or service that may be of interest to some or all of them.</p>
    <p>If a User Pass Account holder provides Rabbit Mechanic Service input about a vendor they dealt with on the list, Rabbit Mechanic Service will have right to share the all of that information or partly with that vendor/s, but only with prior express approval of the user's.</p>
    
    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">5. Maintenance and protection Safeguards</h3>
    <p>If you decide to provide us your personal information, we shall have right:</p>
    <ol class="list-disc pl-6 space-y-2">
      <li>To keep it for as long as is required to fulfill the purposes for which it was provided;</li>
      <li>To keep it using security measures that's appropriated for the information's level of kindliness.</li>
    </ol>
    
    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">6. Approval</h3>
    <p>If you decide to provide us your personal information, you agree that we shall have right to collect, use, disclose, and keep it for the purposes of outlining in this online privacy policy.</p>
    
    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">7. Relevant Law whichever is applicable</h3>
    <p>As Rabbit Mechanic Service's corporate headquarters are in Fresno, so this online privacy statement will be subjected to the privacy and personal data safety system that may intermittently shall be applicable from time to time as effective in Fresno.</p>
  `;

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
                {/* {user ? (
                  privacyPolicy ? (
                    <div dangerouslySetInnerHTML={{ __html: privacyPolicy }} />
                  ) : (
                    <p>No privacy policy content available.</p>
                  )
                ) : (
                  <div
                    dangerouslySetInnerHTML={{ __html: staticPrivacyPolicy }}
                  />
                )} */}

                <div
                  dangerouslySetInnerHTML={{ __html: staticPrivacyPolicy }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
