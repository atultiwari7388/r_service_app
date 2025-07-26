"use client";

import { useAuth } from "@/contexts/AuthContexts";
import { db } from "@/lib/firebase";
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
          termsConditionSnapshot.data()?.description || "";
        setTermsCondition(termsConditionData);
        console.log(termsCondition);
        return termsConditionData;
      }
    } catch (error) {
      console.error("Error fetching terms and conditions:", error);
      // GlobalToastError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTermsCondition();
    }
  }, [user]);

  if (loading) {
    return <LoadingIndicator />;
  }

  const staticTermsAndConditions = `
    <h2 class="text-2xl font-bold text-gray-800 mb-4">Agreement – July 1st, 2025</h2>
    <p>In order to use this Website/App known as 'Rabbit Mechanic Service (RMS)', you hereby agreeing with undertaking to comply with terms and condition mentioned hereinafter and you shall remain bound for the same, failing which or not to agree any of the terms mentioned hereinafter, then you should not be able to use this Website/App in any manner whatsoever. The words "us", "we" and "our", all refer to RMS App in terms of this "RMS App", are powered by Regal Application LLC. The word "you" refers as terms to user or viewer of this website.</p>

    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">1. Approval of Terms vide this Agreement</h3>
    <p>You are hereby agreed to the terms and conditions outlined in this Terms of Use Agreement (the "Agreement") in respect to this site website (the "Website"), which constitutes the entire and only agreement between us/owner of this website and you (User) and take over from all priors or simultaneous agreements, demonstrations, warranties and considerate with respect to this Website, the substances as well as products or services to be provided by this Website, and the subject matter of this Agreement, which includes the Terms and Conditions of API as the Vendor, with Rating Policy, and Conditions and the Privacy Policy and the same are accessible through links in this Agreement, are hereby integrated herein by reference and form an essential part of the same. This Agreement further references the portal service for payment that this App shall make you available (despite of whether you are a Vendor or a User, as those terms are defined below) as a result this agreement with business schedule. We shall have right to amend this Agreement by use from time to time when we feel or consider it to amend even without serving any prior notice upon you and the same shall be delivered to you on this site, then you will have to accept the terms and conditions to be mentioned in the latest agreement by way of amendment therein and you will be bound for the same to reuse this website in its amended portion either you review this agreement or not.</p>

    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">2. The Limits permitted and licensed to use</h3>
    <p>You are hereby permitted and licensed to use this website without having a right to transfer the same and you will have not exclusive right and the same shall be revocable license to:</p>
    <ol class="list-decimal pl-6 space-y-2">
      <li>access and use this Website exactingly in accordance with this Agreement;</li>
      <li>use the Site to promote your products and/or services (if you are a Vendor of products and/or services who wishes to advertise the same to other users of the Site (a "Vendor") or to search for products and/or services that you or the person for whom you are searching (a "User") need to acquire from a Vendor);</li>
      <li>print out the detached information from this website solely for the purposes referred in forgoing clauses a & b of this Para 2 and provided that you will have to maintain all copyright with other notices contained therein. No print out or electronic version of any part of this website or the contents thereof shall be used by you in any litigation or arbitration matter whatsoever under any circumstances.</li>
    </ol>

    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">3. Prohibitions and Restrictions for Use</h3>
    <p>Your license for access and use of this website, despites of how you access this Website, which includes the superior confidence) and any information, resources or the documents provided herein or by this Website (communally defined as "Content") is subject to the following prohibitions and restrictions for use. You will have no right or lend a hand or facilitate others:</p>
    <ol class="list-disc pl-6 space-y-2">
      <li>to printout, forward, copy (except for the limited purpose permitted as mentioned in clause c of Para 2 mentioned hereinabove) publish again or demonstrate, hand out, convey, put up for sale, rent out, let out, credit or in any other manner, make obtainable in any of the form or the means all or any of the part/portion of this website or any content, which reclaimed from the same; or</li>
      <li>to use this Site or any of the contents obtained out of this Site to increase, of or as a constituent of, any information, storage and retrieval system, database, information base, or similar resource (in any of the media either in existing or developed later), that is offered for the purpose of marketable allocation of any kind, which includes by way of sale out, permit, lease out, rent out, contribution, or in any other manner, or made available to any other person publically in any manner whatsoever including on a non-commercial basis; or</li>
      <li>to create collection or unoriginal works of any of the contents of this Site; or</li>
      <li>to alter any of content thereof; or</li>
      <li>to generate or reveal anything about, or perform any arithmetical examination of, this Site or any of content thereof; or</li>
      <li>to exhibit any content in any manner that could logically engage an approval, relationship, funding or other affiliation between you or a third party and this App; or</li>
      <li>to use any of the contents out of this site in any manner that may breach any law of copyright, trademark or other academic belongings or our other rights or any third party; or</li>
      <li>to confiscate, modify or incomprehensible any copyright notice as well as other notice or the terms of the contained used in this Site; or</li>
      <li>to create any portion of this Site available through any time allocation organization, overhaul bureau, the Internet or the other technology either in existence or established later on, if any; or</li>
      <li>to eliminate, reduce, trim down or overturn persuade any software site or use any network observing or finding software to determine this Site planning; or</li>
      <li>to use any mechanical or physical course to collect information from this Site; or</li>
      <li>to use this Site for the purpose to collect information or broadcasting unwanted marketable mails and email that makes use of headers, illogical or missing sphere of influence names, or the other means of misleading addressing and further unwelcome telephonic calls or reproduction broadcasts; or</li>
      <li>to use this Site in any manner that violates any related position, centralized, local or any other law; or</li>
      <li>to sell abroad this Site, or any of its portion, or any software available on or through the Site, in violation of the sell overseas control laws or regulations of other country.</li>
    </ol>

    <!-- Continue with the rest of your terms and conditions sections -->
    <!-- I've shown the pattern - you would continue with sections 4 through 19 in the same way -->
    <!-- Each section would have its own heading and content -->

    <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-2">19. General Provisions</h3>
    <p>This Agreement shall be treated as despite the fact that it were executed and performed in FRESNO, CALIFORNIA, USA and shall be governed by and construed in accordance with the laws in force in the Province of California (without regard to conflict of law principles). Any cause of action by you with respect to this Site (and/or any Content or any products, services or information provided in or by the Site) must be instituted in the courts of the Province of California within one (1) year after arising cause of action or be forever waived and barred. All actions shall be subject to the disclaimers and other provisions set forth in this Agreement including, without limitation, the disclaimers in Para/s 7, 14 and 15. The language in this Agreement shall be interpreted as to its fair meaning and not strictly for or against any party. This Agreement and all incorporated agreements and your information may be automatically assigned by us in our sole discretion to a third party in the event of an acquisition, sale or merger. Should any part of this Agreement be held invalid or unenforceable, that portion shall be construed consistent with applicable law and the remaining portions shall remain in full force and effect. To the extent that anything in or associated with the Site is in conflict or inconsistent with this Agreement, this Agreement shall take precedence. Our failure to enforce any provision of this Agreement shall not be deemed a waiver of such provision nor of the right to enforce such provision. Our rights under this Agreement shall survive any termination of this Agreement for any reason whatsoever.</p>
  `;

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
                {/* {user ? (
                  termsCondition ? (
                    <div dangerouslySetInnerHTML={{ __html: termsCondition }} />
                  ) : (
                    <p>No terms and conditions content available.</p>
                  )
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: staticTermsAndConditions }} />
                )} */}

                <div
                  dangerouslySetInnerHTML={{ __html: staticTermsAndConditions }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
