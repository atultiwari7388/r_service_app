import { Timestamp } from "firebase/firestore";

export interface LocationLatLng {
  latitude: number;
  longitude: number;
}

export interface AddressType {
  id: string;
  address: string;
  addressType: string;
  date: Timestamp;
  isAddressSelected: boolean;
  location: LocationLatLng;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
  name: string;
  email: string;
  address: string;
  phoneNumber: string;
  password: string;
}

export interface ForgotPasswordFormValues {
  email: string;
}

/** Profile */

export interface ProfileValues {
  active: boolean;
  address: string;
  createdBy: string;
  created_at: Timestamp;
  email: string;
  fcmToken: string;
  isLocationSet: boolean;
  isNotificationOn: boolean;
  isTeamMember: boolean;
  lastAddress: string;
  phoneNumber: string;
  profilePicture: string;
  role: string;
  uid: string;
  updated_at: Timestamp;
  userName: string;
  wallet: number;
}

/** Services */

export interface ServiceType {
  title: string;
  image_type: number;
  price_type: number;
  priority: number;
  image: string;
  isFeatured: boolean;
}

/** Vehicles */

export interface VehicleTypes {
  companyName: string;
  createdAt: Timestamp;
  isSet: boolean;
  licensePlate: string | null;
  vehicleNumber: string;
  vin: string | null;
  year: Timestamp;
}
