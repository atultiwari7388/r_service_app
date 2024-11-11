import { VehicleTypes } from "@/types/vehicles";

interface SelectVehicleProps {
  vehicles: VehicleTypes[];
}

const FetchSelectVehicle: React.FC<SelectVehicleProps> = ({ vehicles }) => {
  return (
    <select className="w-full h-14 p-4 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F96176] transition">
      <option value="">Select A Service</option>
      {vehicles.map((vehicle, index) => (
        <option key={index} value={vehicle.vehicleNumber}>
          {vehicle.vehicleNumber}
        </option>
      ))}
    </select>
  );
};

export default FetchSelectVehicle;
