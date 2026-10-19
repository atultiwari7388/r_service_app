import { Timestamp } from "firebase/firestore";

export interface MechanicOffer {
  mId: string;
  mName: string;
  mNumber: string;
  mDp: string;
  arrivalCharges: number | string;
  perHourCharges: number | string;
  fixPrice: number | string;
  time: string;
  latitude: number;
  longitude: number;
  status: number; // 1: offered/accepted by mechanic, 2: driver choosing payment, 3: driver confirmed/en route, 4: in progress, 5: completed, -1: cancelled
  rating?: string;
  reviewSubmitted?: boolean;
  languages?: string[];
  mechanicAddress?: string;
  offerAcceptedDate?: Timestamp | Date | any;
}

export interface FirestoreJob {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userPhoneNumber?: string;
  userPhoto?: string;
  userDeliveryAddress?: string;
  selectedService: string;
  companyName?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  userLat?: number;
  userLong?: number;
  status: number; // 0 = new, 1-4 = ongoing, 5 = completed, -1 = cancelled
  orderDate?: Timestamp | Date | any;
  date?: Timestamp | Date | any;
  nearByDistance?: number;
  isImageSelected?: boolean;
  images?: string[];
  fixPriceEnabled?: boolean;
  fixPrice?: number | string;
  myCompany?: string;
  payMode?: string;
  cancelReason?: string;
  cancelBy?: string;
  description?: string;
  mechanicsOffer?: MechanicOffer[];
  mRating?: number;
  mReview?: string;
  mReviewSubmitted?: boolean;
  calculatedDistance?: number;
}

export interface SubmitOfferParams {
  jobId: string;
  userId: string;
  arrivalCharges?: string | number;
  perHourCharges?: string | number;
  fixPrice?: string | number;
  arrivalTime: string;
}

export interface CompleteJobParams {
  jobId: string;
  userId: string;
  payMode?: string;
}

export interface CancelJobParams {
  jobId: string;
  userId: string;
  reason: string;
}

export interface SubmitRatingParams {
  jobId: string;
  userId: string;
  orderId: string;
  rating: number;
  review: string;
}
