import { Timestamp } from "firebase/firestore";

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
