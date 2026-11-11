import { Timestamp } from "firebase/firestore";
import { MechanicCurrentSubscription } from "./subscription";

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
  isSubscriptionPurchase?: boolean;
  currentSubscription?: MechanicCurrentSubscription;
  created_at?: Timestamp | any;
  createdAt?: Timestamp | any;
  updated_at?: Timestamp | any;
  wallet?: number;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  // Team Management & Dispatch Engine Fields
  role?: "owner" | "member";
  ownerId?: string;
  isTeamMember?: boolean;
  baseCity?: string;
  baseState?: string;
  allowDirectJobAcceptance?: boolean;
  inheritedSubscriptionOwnerId?: string;
  teamMembers?: string[];
  rating?: number;
  totalReviewsCount?: number;
  totalCompletedJobs?: number;
  currentActiveJobId?: string | null;
  activeJobStartedAt?: Timestamp | any | null;
  activeJobEstimatedMinutes?: number | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type LoginResultStatus =
  | "success"
  | "subscription_required"
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
  redirectUrl?: string;
}

export interface MechanicRegistrationData {
  name: string;
  workshopName: string;
  cellPhone: string;
  telephone?: string;
  email: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  dateOfBirth?: string;
  experience?: string;
  description?: string;
  password: string;
  languages: Record<string, boolean>;
}

export interface RegistrationResult {
  success: boolean;
  message?: string;
  user?: any;
  mechanicId?: string;
  email?: string;
}
