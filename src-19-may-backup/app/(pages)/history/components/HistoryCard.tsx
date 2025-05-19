import { HistoryItem } from "@/types/types";
import { Avatar } from "@nextui-org/react";
import React from "react";

interface HistoryCardProps {
  items: HistoryItem;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ items }) => {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-md mb-4 px-12 lg:mx-12 lg:mt-5">
      {/* Top Section: ID, Distance, Rating */}
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <p>
          <span className="font-semibold">ID:</span> {items.id}
        </p>
        <p>
          <span className="font-semibold">Distance:</span>{" "}
          {items.nearByDistance} miles
        </p>
        <p>
          <span className="font-semibold">Rating:</span> {items.rating}
        </p>
      </div>

      {/* User Info Section: Avatar, Name, Address */}
      <div className="flex items-center gap-3 mb-2">
        <Avatar
          src={items.userPhoto}
          alt={items.userName}
          className="w-12 h-12"
        />
        <div>
          <p className="text-lg font-bold">{items.userName}</p>
          <p className="text-sm text-gray-500">{items.userDeliveryAddress}</p>
        </div>
      </div>

      {/* Service Section */}
      <p className="text-gray-700">
        <span className="font-semibold">Service:</span> {items.selectedService}
      </p>

      {/* Vehicle Info */}
      <p className="text-gray-700">
        <span className="font-semibold">Vehicle:</span> {items.vehicleNumber}
      </p>

      {/* Mechanics Offer Section */}
      {Array.isArray(items.mechanicsOffer) &&
      items.mechanicsOffer.length > 0 ? (
        items.mechanicsOffer.map((offer, index) => (
          <div
            key={index}
            className="bg-gray-50 p-2 mt-2 rounded-lg shadow-inner"
          >
            {/* Check if offer status is between 2 and 5 */}
            {offer.status >= 2 && offer.status <= 5 && (
              <>
                <p className="text-gray-700">
                  <span className="font-semibold">Arrival Charges:</span> ₹
                  {offer.arrivalCharges}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Per Hour Charges:</span> ₹
                  {offer.perHourCharges}
                </p>
              </>
            )}
          </div>
        ))
      ) : (
        <p className="text-gray-500 italic">No mechanics offer available</p>
      )}

      {/* Payment Mode */}
      <p className="text-gray-700">
        <span className="font-semibold">Payment Mode:</span> {items.payMode}
      </p>

      {/* Status */}
      <p className="text-gray-700">
        <span className="font-semibold">Status:</span>
        {items.status === 5 ? (
          <span className="text-green-500 ml-1">Complete</span>
        ) : items.status === -1 ? (
          <span className="text-red-500 ml-1">Cancelled</span>
        ) : (
          <span className="text-yellow-500 ml-1">In Progress</span>
        )}
      </p>
    </div>
  );
};

export default HistoryCard;
