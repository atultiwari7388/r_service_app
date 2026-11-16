import { Timestamp } from "firebase/firestore";

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  companyName: string;
  engineName?: string;
  myCompany?: string;
  mycomId?: string;
  vin?: string;
  licensePlate?: string;
  year?: string | null;
  active?: boolean;
  image?: string;
  isSet?: boolean;
  currentReading?: string;
  currentMiles?: string;
  hoursReading?: string;
  createdAt?: Timestamp | Date | any;
  updatedAt?: Timestamp | Date | any;
  isAssignedToOther?: boolean;
  sharingPending?: boolean;
  sharedWith?: {
    borrowerId?: string;
    borrowerName?: string;
    borrowerCompanyName?: string;
    borrowerEmail?: string;
  };
}

export interface DValue {
  brand: string;
  type: string;
  value: string;
}

export interface VehicleService {
  sId?: string;
  sName?: string;
  serviceId: string;
  serviceName: string;
  defaultNotificationValue: number;
  nextNotificationValue: number;
  subServices?: { sName: string }[];
  vType?: string;
  dValues?: DValue[];
  type?: string;
  isNotification?: boolean;
}
