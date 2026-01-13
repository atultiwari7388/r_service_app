// types/load.types.ts

export interface LoadData {
  // Basic Info
  loadNumber: string;
  status: string;
  isInvoiced: boolean;
  isLocked: boolean;

  // Customer & Financials
  customer: string;
  primaryFees: string;
  feeType: string;
  tenderedMiles: string;
  fuelSurcharge: string;
  targetRate: string;

  // Equipment Details
  vanType: string;
  length: string;
  weight: string;
  isHazmat: boolean;
  isTarpRequired: boolean;

  // Administrative Info
  bookingAuthority: string;
  salesAgent: string;
  bookingTerminal: string;
  commodity: string;
  declaredValue: string;
  agency: string;
  brokerageAgent: string;

  // Metrics
  revenue: string;
  profit: string;
  ratePerMile: string;
  flatRate: string;
  loadedMiles: string;
  detentionTracked: string;
  quantity: string;
  loadType: string;

  // Dispatch Info
  carrier: string;
  truck: string;
  trailer: string;
  driver: string;
  dispatcher: string;

  // Additional fields from PDF
  bolNumber?: string;
  poNumbers?: string[];
  pickupDate?: string;
  deliveryDate?: string;
  temperature?: string;
  equipmentType?: string;
  pickupInstructions?: string;
  deliveryInstructions?: string;
  customerContact?: {
    name: string;
    phone: string;
    email: string;
  };
  carrierContact?: {
    name: string;
    phone: string;
    email: string;
  };
  driverContact?: {
    name: string;
    phone: string;
    email: string;
  };
}

export interface Stop {
  type: "PICKUP" | "DELIVERY";
  number: number;
  date: string;
  timeWindow: string;
  locationName: string;
  address: string;
  cityStateZip: string;
  contact: string;
  qty: string;
  weight: string;
  instructions: string;
  puNumber?: string;
  soNumber?: string;
  miles: string;
  status: string;
  route: string;
  temp?: string;
  appointmentRef?: string;
  bolNumber?: string;
  poNumbers?: string[];
}

export interface LoadDocument {
  id: string;
  name: string;
  type: string;
  invoiceRequirement: boolean;
  expiryDate: string;
  daysRemaining: number | null;
  url?: string;
}

export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  company?: string;
  role?: string;
}

export interface FinancialDetails {
  rateAmount: number;
  rateType: "FLAT" | "PER_MILE";
  fuelSurcharge: number;
  accessorialCharges: number;
  totalAmount: number;
  paymentTerms: string;
  quickPayDiscount?: number;
}

export interface TemperatureInfo {
  setpoint: string;
  actual: string;
  unit: "F" | "C";
  isContinuous: boolean;
  tolerance?: string;
}

export interface InsuranceInfo {
  carrier: string;
  policyNumber: string;
  effectiveDate: string;
  expirationDate: string;
  autoLiability: string;
  cargoInsurance: string;
  generalLiability: string;
}
