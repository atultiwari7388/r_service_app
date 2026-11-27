import { Timestamp } from "firebase/firestore";
import type { AssignmentStatus } from "@/lib/jobWorkflow";
import type { AppliedCommission } from "@/lib/commission";

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
  // Dispatch & Team fields
  assignedMemberId?: string;
  assignedMemberName?: string;
  assignedMemberCity?: string;
  assignedMemberPhone?: string;
  isAssignedByOwner?: boolean;
  assignmentStatus?: AssignmentStatus | (string & {});
  memberAcceptedAt?: Timestamp | Date | any;
  memberDeclinedAt?: Timestamp | Date | any;
  finalDiagnosedAmount?: number;
  inspectionNotes?: string;
  inspectionCompletedAt?: Timestamp | Date | any;
  repairCompletedByTechnician?: boolean;
  repairFinishedAt?: Timestamp | Date | any;
  customerSignOff?: boolean;
  customerSignOffAt?: Timestamp | Date | any;
  isPaid?: boolean;
  paidAmount?: number;
  cancelReason?: string;
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
  status: number; // see lib/jobWorkflow.ts: 0 open, 2 en route, 3 on site, 4 work order, 5 completed, -1 cancelled
  orderDate?: Timestamp | Date | any;
  date?: Timestamp | Date | any;
  nearByDistance?: number;
  isImageSelected?: boolean;
  images?: string[];
  fixPriceEnabled?: boolean;
  fixPrice?: number | string;
  myCompany?: string;
  payMode?: "cash" | "online" | (string & {});
  cancelReason?: string;
  cancelBy?: string;
  description?: string;
  mechanicsOffer?: MechanicOffer[];
  mRating?: number;
  mReview?: string;
  mReviewSubmitted?: boolean;
  calculatedDistance?: number;
  finalDiagnosedAmount?: number;
  inspectionNotes?: string;
  inspectionCompletedAt?: Timestamp | Date | any;
  repairCompletedByTechnician?: boolean;
  repairFinishedAt?: Timestamp | Date | any;
  customerSignOff?: boolean;
  customerSignOffAt?: Timestamp | Date | any;
  isPaid?: boolean;
  paidAmount?: number;
  paidAt?: string | Timestamp | Date;
  paidCurrency?: string;
  reassignedAt?: Timestamp | Date | any;
  // Dispatch & Queueing fields
  assignedMemberId?: string;
  assignedMemberName?: string;
  assignedMemberCity?: string;
  assignedMemberPhone?: string;
  isAssignedByOwner?: boolean;
  ownerId?: string;
  mechanicId?: string;
  mId?: string;
  estimatedRepairMinutes?: number;
  activeJobStartedAt?: Timestamp | Date | any;
  handoverRequested?: boolean;
  handoverReason?: string;
  handoverRequestedAt?: Timestamp | Date | any;
  reassignedFromMemberId?: string;
  assignmentStatus?: AssignmentStatus | (string & {});
  memberAcceptedAt?: Timestamp | Date | any;
  memberDeclinedAt?: Timestamp | Date | any;
  arrivedAtLocation?: boolean;
  arrivedAt?: Timestamp | Date | any;
  // Commission & settlement (see lib/commission.ts)
  mechanicCommission?: number; // locked at inspection from the workshop owner's plan
  mechanicCommissionRule?: AppliedCommission;
  mechanicNetEarning?: number;
  customerServiceFee?: number; // locked at payment from the customer's plan
  customerServiceFeeRule?: AppliedCommission;
  totalAmountDue?: number; // work order + customer service fee
  settlementId?: string; // jobSettlements/{id}, written at customer sign-off (status lives there)
}

export interface SubmitOfferParams {
  jobId: string;
  userId: string;
  arrivalCharges?: string | number;
  perHourCharges?: string | number;
  fixPrice?: string | number;
  arrivalTime: string;
  // Team Dispatch
  assignedMemberId?: string;
  assignedMemberName?: string;
  assignedMemberCity?: string;
  assignedMemberPhone?: string;
}

export interface CompleteJobParams {
  jobId: string;
  userId: string;
  payMode?: "cash" | "online" | (string & {});
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
