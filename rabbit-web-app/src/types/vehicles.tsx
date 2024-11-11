import { Timestamp } from "firebase/firestore";

export interface VehicleTypes {
  companyName: string;
  createdAt: Timestamp;
  isSet: boolean;
  licensePlate: string | null;
  vehicleNumber: string;
  vin: string | null;
  year: Timestamp;
}
