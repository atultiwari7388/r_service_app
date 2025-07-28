export default function RatingPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Rating Policy</h1>
      <p className="text-gray-600 mb-6">Last Updated: July 1st, 2025</p>

      <div className="mb-8">
        <p className="mb-4">
          Rabbit Mechanic Service employs a dual-rating system that allows both
          Vendors and Users (Customers) to rate each other based on the service
          experience. This system is governed by a dedicated policy developed
          specifically by Rabbit Mechanic Service to ensure fairness and
          transparency.
        </p>
        <p className="mb-4">
          Ratings are user-driven and are intended to benefit both parties by
          promoting accountability and service excellence. Vendor ratings
          submitted by Users help Rabbit Mechanic Service generate Quality
          Rating Scores, which are used to highlight top-performing Vendors and
          guide Users in selecting reliable service providers.
        </p>
        <p className="mb-4">
          At the same time, Vendors can also rate Users, helping maintain a
          respectful and efficient platform. Outstanding Vendors who
          consistently receive positive ratings are more likely to attract
          additional business, while Users benefit from better service
          experiences based on trusted feedback.
        </p>
        <p>
          The Vendor and User Rating Policy is based on the principle that each
          rating and corresponding feedback—whether provided by a User or a
          Vendor—must be directly related to a specific service exchanged
          between the two parties.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Rating Sharing</h2>
        <p>
          Rabbit Mechanic Service will share the ratings exchanged between the
          Vendor and the User with both parties. This allows each party to
          provide direct feedback to the other, and ensures that the owner of
          the listing is informed of any relevant issues.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Vendor Rating Policy</h2>
        <ol className="list-decimal pl-6 space-y-4">
          <li>
            A &quot;Rating&quot; consists 0.5 to 5 Rating scale (with 0.5 being
            the lowest and 5 being the highest) and must include Feedback
            relating to a specific transaction between the Vendor and User.
          </li>
          <li>
            The Ratings must include a comment with reason for the rating being
            assigned.
          </li>
          <li>
            Only the Users & Vendors with an active Rabbit Mechanic Service
            account (i.e. the registered User) can provide Ratings and must be
            logged in to provide Ratings.
          </li>
          <li>
            The Ratings and their underneath Feedback shall be sent directly to
            Vendor & User and/or its duly authorized recipients.
          </li>
          <li>
            Rabbit Mechanic Service reserves its right to screen all the Ratings
            as well as underneath Feedback, as part of our superiority
            declaration processes.
          </li>
          <li>
            Rating feedback is only visible online to the User & Vendor who
            submitted it, the mechanic who provided it, and the vendor it
            pertains to.
          </li>
          <li>
            Rabbit Mechanic Service does NOT endorse any of the Vendors & Users,
            either through its Quality Rating Scores. The Scores and status are
            to be calculated based on User provided Ratings and the same are
            subject to make any changes without prior notice.
          </li>
          <li>
            In case the Users & Vendors are found to be abusing their accounts
            through inappropriate use of the Rating system may have their
            account access terminated by Rabbit Mechanic Service.
          </li>
          <li>
            Attempt of the Vendors & Users to improve their Quality Rating
            Scores through fake or artificial Ratings may have their listings
            removed by Rabbit Mechanic Service.
          </li>
          <li>
            Users and Vendors may change the Rating and associated Feedback as
            often as they choose to do so.
          </li>
          <li>
            Rabbit Mechanic Service strongly encourages both Vendors and Users
            to address any concerns or issues related to ratings and associated
            incidents directly with each other. However, in the event of a
            dispute regarding a rating, either party may request its removal by
            submitting a dispute form available online. This form will be
            reviewed by Rabbit Mechanic Service. A rating may be removed if one
            or more of the following conditions are met:
            <ol className="list-disc pl-8 mt-2 space-y-2">
              <li>
                No underneath Feedback was provided with the Shared Rating.
              </li>
              <li>Unfortunate language (i.e. swearing).</li>
              <li>Unfortunate sexual references.</li>
              <li>Cultural slurs.</li>
              <li>
                Ratings assigned in cases where no actual transaction between
                the User and the Vendor took place within the past 12 months,
                unless Rabbit Mechanic Service is made aware of other
                information that explains why not this is the case and is
                satisfied that, in such circumstances, the Rating should be
                removed.
              </li>
              <li>
                Vendor self rates its listing(s) or rates other Vendor listings.
              </li>
              <li>
                Rating Feedback includes any kind of screenplay or linkage.
              </li>
              <li>
                Rating Feedback refers to earlier event or practice of a diverse
                User.
              </li>
              <li>
                Rating Feedback includes political or the religious comments not
                related to a specific transaction.
              </li>
              <li>User provides the Rating cannot be contacted.</li>
              <li>
                User account that the Rating originates from contains invalid,
                missing or misleading contact information.
              </li>
              <li>
                In case Vendor sells business and is no longer involved in
                business in any way.
              </li>
              <li>
                If the Rating has been falsified or contrived in any manner
                whatsoever.
              </li>
              <li>The Rating is more than two (2) years old.</li>
            </ol>
          </li>
          <li>
            Notwithstanding Item 11, Rabbit Mechanic Service reserves the right
            to remove any rating at any time, at its sole discretion, if it
            deems such removal appropriate.
          </li>
        </ol>
      </div>
    </div>
  );
}
