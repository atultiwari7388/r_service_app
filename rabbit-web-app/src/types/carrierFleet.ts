import { Timestamp } from "firebase/firestore";

export interface CarrierVehicleDoc {
  id: string; // ${shareId}_${vehicleId}
  shareId: string;
  shareCode: string;
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: "Truck" | "Trailer";
  companyName: string;
  vin?: string;
  
  // Lender (Owner A)
  fromId: string;
  fromEmail?: string;
  fromName?: string;
  fromCompanyName?: string;

  // Borrower / Carrier (Owner B)
  toId: string;
  toEmail?: string;
  toName?: string;
  toCompanyName?: string;

  initialMiles: number;
  currentMiles: number;
  status: "active" | "completed" | "terminated";
  startDate: string;
  expectedEndDate?: string;
  returnedDate?: string;
  returnNotes?: string;
  leaseTerms?: string;
  description?: string;

  createdAt: any;
  updatedAt: any;
}

export interface CarrierRecordDoc {
  id?: string;
  carrierVehicleDocId: string; // id in carriersVehicles
  vehicleId: string; // original vehicle ID
  vehicleNumber: string;
  vehicleType?: "Truck" | "Trailer";
  companyName?: string;
  vin?: string;

  fromId: string; // Owner A
  toId: string; // Owner B (Carrier)
  createdById: string; // UID of user who logged it
  createdByEmail?: string;
  createdByRole?: "Lender" | "Carrier" | "Owner" | "SubOwner";

  serviceName: string;
  selectedServices?: string[];
  workshopName?: string;
  cost?: number | string;
  miles?: number | string;
  hours?: number | string;
  note?: string;
  date: string;
  formattedDate?: string;
  receiptUrls?: string[];

  createdAt: any;
  updatedAt?: any;
}

export interface CarrierExpenseDoc {
  id?: string;
  carrierVehicleDocId: string;
  vehicleId: string;
  vehicleNumber: string;
  fromId: string;
  toId: string;
  createdById: string;
  createdByEmail?: string;
  
  category: string;
  amount: number | string;
  date: string;
  description?: string;
  paymentMethod?: string;
  receiptUrl?: string;

  createdAt: any;
  updatedAt?: any;
}
