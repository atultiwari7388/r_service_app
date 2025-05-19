/* eslint-disable @next/next/no-img-element */
import { calculateDistance } from "@/utils/calculateLatLng";
import { HistoryItem, MechanicsOffer } from "@/types/types";

interface RequestAcceptHistoryCardProps {
  mechanic: MechanicsOffer;
  jobDetails: HistoryItem;
  onAcceptOffer: () => void;
  onPayment: () => void;
  onStartJob: () => void;
  selectedPaymentMode: string;
  setSelectedPaymentMode: (mode: string) => void;
}

export default function RequestAcceptHistoryCard({
  mechanic,
  jobDetails,
  onAcceptOffer,
  onPayment,
  onStartJob,
  selectedPaymentMode,
  setSelectedPaymentMode,
}: RequestAcceptHistoryCardProps) {
  const distance = calculateDistance(
    jobDetails.userLat,
    jobDetails.userLong,
    mechanic.latitude,
    mechanic.longitude
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-6">
        <div className="relative">
          <img
            src={mechanic.mDp || "/profile.png"}
            alt={mechanic.mName}
            className="w-20 h-20 rounded-full object-cover border-4 border-pink-100"
          />
          <div className="absolute -bottom-2 -right-2 bg-green-500 p-1 rounded-full">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-xl text-gray-800">
            {mechanic.mName}
          </h3>

          <div className="flex flex-wrap gap-3 mt-2">
            <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
              <i className="fas fa-clock mr-1"></i>
              {mechanic.time} mins
            </span>
            <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
              <i className="fas fa-map-marker-alt mr-1"></i>
              {distance} miles
            </span>
            <span className="bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {mechanic.rating}
            </span>
            {mechanic.languages.map((lang, i) => (
              <span
                key={i}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 flex-1">
          {jobDetails.fixPriceEnabled ? (
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Fix Price</span>
              <span className="text-xl font-bold text-green-600">
                ${mechanic.fixPrice}
              </span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">
                  Arrival Charges
                </span>
                <span className="text-lg font-bold text-green-600">
                  ${mechanic.arrivalCharges}
                </span>
              </div>
              <div className="border-t border-gray-200 my-3" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">
                  Per Hour Charges
                </span>
                <span className="text-lg font-bold text-green-600">
                  ${mechanic.perHourCharges}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center">
          {mechanic.status === 1 && (
            <button
              onClick={onAcceptOffer}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-2.5 rounded-full font-medium hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Accept Offer
            </button>
          )}

          {mechanic.status === 2 && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedPaymentMode("cash")}
                  className={`px-6 py-2 rounded-full ${
                    selectedPaymentMode === "cash"
                      ? "bg-[#F96176] text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Cash
                </button>
                <button
                  onClick={() => setSelectedPaymentMode("online")}
                  className={`px-6 py-2 rounded-full ${
                    selectedPaymentMode === "online"
                      ? "bg-[#F96176] text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Online
                </button>
              </div>
              {selectedPaymentMode && (
                <button
                  onClick={onPayment}
                  className="w-full bg-gradient-to-r from-[#F96176] to-[#F96176] text-white px-8 py-2.5 rounded-full hover:from-[#F96176] hover:to-[#F96176] transform hover:scale-105 transition-all duration-200"
                >
                  Process Payment
                </button>
              )}
            </div>
          )}

          {mechanic.status === 3 && (
            <button
              onClick={onStartJob}
              className="bg-gradient-to-r from-[#F96176] to-[#F96176] text-white px-8 py-2.5 rounded-full hover:from-[#F96176] hover:to-[#F96176] transform hover:scale-105 transition-all duration-200"
            >
              Start Job
            </button>
          )}

          {mechanic.status === 4 && (
            <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-2.5 rounded-full hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200">
              Ongoing
            </button>
          )}

          {mechanic.status === 5 && (
            <div className="text-green-600 font-medium text-lg">
              Job Completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
