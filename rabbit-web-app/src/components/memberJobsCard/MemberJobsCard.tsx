import React from "react";
import Image from "next/image";

interface MemberJobsCardProps {
  companyNameAndVehicleName: string;
  address: string;
  serviceName: string;
  jobId: string;
  imagePath: string;
  dateTime: string;
  status: string;
  charges: string;
  fixCharges: string;
  isImage: boolean;
}

const MemberJobsCard: React.FC<MemberJobsCardProps> = ({
  companyNameAndVehicleName,
  address,
  serviceName,
  jobId,
  imagePath,
  dateTime,
  status,
  charges,
  fixCharges,
  isImage,
}) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-4">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {companyNameAndVehicleName}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {serviceName} • {dateTime}
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            status === "Completed"
              ? "bg-green-100 text-green-800"
              : status === "Cancelled"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {status}
        </span>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {address}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Job ID</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {jobId}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Charges</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              Arrival: ${charges} • Fix: ${fixCharges}
            </dd>
          </div>
          {isImage && (
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Image</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="relative h-32 w-32 rounded-md overflow-hidden">
                  <Image
                    src={imagePath}
                    alt="Job image"
                    fill
                    className="object-cover"
                  />
                </div>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default MemberJobsCard;
