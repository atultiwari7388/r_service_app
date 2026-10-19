import { Timestamp } from "firebase/firestore";

export interface MechanicProfile {
  uid: string;
  name?: string;
  userName?: string;
  workshopName?: string;
  email?: string;
  cellPhone?: string;
  telephone?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
  experience?: string;
  description?: string;
  perHourCharge?: number;
  languages?: Record<string, boolean>;
  active?: boolean;
  isEnabled?: boolean;
  fcmToken?: string;
  isMultiDeEnable?: boolean;
  profilePicture?: string;
  mDp?: string;
  selected_services?: string[];
  created_at?: Timestamp | any;
  createdAt?: Timestamp | any;
  updated_at?: Timestamp | any;
  wallet?: number;
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type LoginResultStatus =
  | "success"
  | "email_not_verified"
  | "customer_app_email"
  | "account_not_registered"
  | "account_deactivated"
  | "multi_device_restricted"
  | "error";

export interface LoginResult {
  status: LoginResultStatus;
  message?: string;
  user?: any;
  mechanicData?: MechanicProfile;
}
