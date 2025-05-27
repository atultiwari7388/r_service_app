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
  perMileCharge: string;
  vehicleRange: string;
  city: string;
  state: string;
  country: string;
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
  id: string;
  companyName: string;
  createdAt: Timestamp;
  currentReading: string;
  dot: string;
  engineNumber: string;
  iccms: string;
  isSet: boolean;
  licensePlate: string | null;
  vehicleNumber: string;
  vehicleType: string;
  vin: string | null;
  year: Timestamp;
  active: boolean;
}

/** Mechanics Offer and User History Interface */

export interface MechanicsOffer {
  arrivalCharges: string;
  fixPrice: number;
  languages: string[];
  latitude: number;
  longitude: number;
  mDp: string;
  mId: string;
  mName: string;
  mNumber: string;
  mechanicAddress: string;
  offerAcceptedDate: Timestamp;
  perHourCharges: string;
  rating: string;
  reviewSubmitted: boolean;
  status: number;
  time: 10;
}

export interface HistoryItem {
  cancelBy: string;
  cancelReason: string;
  companyName: string;
  description: string;
  fixPriceEnabled: boolean;
  id: string;
  images: string[];
  isImageSelected: boolean;
  mRating: string;
  mReview: string;
  mReviewSubmitted: boolean;
  mechanicsOffer: MechanicsOffer[];
  nearByDistance: number;
  orderDate: Timestamp;
  orderId: string;
  ownerId: string;
  payMode: string;
  rating: string;
  review: string;
  reviewSubmitted: boolean;
  role: string;
  selectedService: string;
  status: number;
  userDeliveryAddress: string;
  userId: string;
  userLat: number;
  userLong: number;
  userName: string;
  userPhoneNumber: string;
  userPhoto: string;
  vehicleNumber: string;
}
