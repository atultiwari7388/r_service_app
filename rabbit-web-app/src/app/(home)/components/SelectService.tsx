// ServiceSelect.tsx
import { ServiceType } from "@/types/services";
import React from "react";

interface ServiceSelectProps {
  services: ServiceType[];
}

const SelectService: React.FC<ServiceSelectProps> = ({ services }) => {
  return (
    <select className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition">
      <option value="">Select A Service</option>
      {services.map((service, index) => (
        <option key={index} value={service.title}>
          {service.title}
        </option>
      ))}
    </select>
  );
};

export default SelectService;
