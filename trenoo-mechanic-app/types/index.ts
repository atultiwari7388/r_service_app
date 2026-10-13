export type WorkOrderStatus =
  | "bay_in_progress"
  | "scheduled"
  | "pending_parts"
  | "dot_inspection"
  | "ready_for_pickup"
  | "completed";

export type VehicleUnitType =
  | "Semi-Tractor (Class 8)"
  | "Dry Van Trailer"
  | "Refrigerated Reefer Trailer"
  | "Flatbed Trailer"
  | "Intermodal Container Chassis"
  | "Dump / Heavy Haul"
  | "Commercial Fleet Truck";

export interface FleetWorkOrder {
  id: string;
  orderNumber: string;
  unitNumber: string;
  vinOrPlate: string;
  vehicleType: VehicleUnitType;
  fleetCompany: string;
  primaryConcern: string;
  assignedBay: string;
  leadTechnician: string;
  status: WorkOrderStatus;
  estimatedLaborHours: number;
  totalCost: number;
  dateCreated: string;
  dotRequired: boolean;
}

export interface FleetInvoice {
  id: string;
  invoiceNumber: string;
  workOrderRef: string;
  fleetCompany: string;
  dotNumber?: string;
  items: {
    description: string;
    partsCost: number;
    laborHours: number;
    laborRate: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
}

export interface CheckItem {
  id: string;
  checkNumber: string;
  payee: string;
  memo: string;
  category: "parts_vendor" | "technician_payout" | "shop_overhead" | "equipment";
  amount: number;
  issueDate: string;
  status: "cleared" | "printed" | "void" | "pending";
}

export interface DotInspectionRecord {
  id: string;
  reportNumber: string;
  unitNumber: string;
  fleetCompany: string;
  inspectionType: "Annual DOT" | "90-Day BIT" | "Trailer Air-Brake" | "Lighting & Wiring";
  inspectorName: string;
  certificationNumber: string;
  result: "PASSED" | "FAILED" | "OUT_OF_SERVICE";
  defectsCount: number;
  dateConducted: string;
  expirationDate: string;
}

export interface TechnicianMember {
  id: string;
  name: string;
  title: string;
  specialty: "Heavy Duty Diesel" | "Trailer & Air Brakes" | "Hydraulics & PTO" | "DOT Inspector" | "Reefer Master";
  assignedBay: string;
  status: "in_bay" | "available" | "off_duty";
  aseCertified: boolean;
  phone: string;
}
