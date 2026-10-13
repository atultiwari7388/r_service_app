export interface MockJob {
  id: string;
  vehicleType: "Truck" | "Semi-trailer" | "Heavy-duty vehicle";
  vehicleModel: string;
  category:
    | "Engine Repair"
    | "Brake Inspection"
    | "Tire Replacement"
    | "Emergency Roadside Assistance";
  customerName: string;
  location: string;
  requestedDateTime: string;
  estimatedDistance: string;
  estimatedPayment: number;
  priority: "High" | "Urgent" | "Normal";
  status: "Pending" | "Scheduled" | "In Progress" | "Accepted";
  issueDescription: string;
  requiredParts?: string[];
  contactPhone?: string;
  isMockData: true;
}

export const MOCK_UPCOMING_JOBS: MockJob[] = [
  {
    id: "TRK-8921",
    vehicleType: "Truck",
    vehicleModel: "Kenworth T680 Semi-Tractor",
    category: "Engine Repair",
    customerName: "Swift Transport Logistics",
    location: "Sector 37 Commercial Freight Terminal, Gurugram",
    requestedDateTime: "Today • 02:30 PM",
    estimatedDistance: "4.8 km away",
    estimatedPayment: 540,
    priority: "High",
    status: "Pending",
    issueDescription:
      "Cummins X15 active fault code SPN 4364 (DEF dosing valve low pressure & amber check engine light). Requires diagnostic scanning, sensor flush, and manual forced regen.",
    requiredParts: ["DEF Dosing Valve Gasket", "Diagnostic Harness", "NOx Sensor Socket"],
    contactPhone: "+91 98765 43210",
    isMockData: true,
  },
  {
    id: "TRL-4109",
    vehicleType: "Semi-trailer",
    vehicleModel: "Great Dane 53' Reefer Trailer",
    category: "Emergency Roadside Assistance",
    customerName: "Prime Cold Chain Inc.",
    location: "Highway MM 14 Shoulder, Delhi-Jaipur Expressway",
    requestedDateTime: "Today • 03:15 PM",
    estimatedDistance: "8.2 km away",
    estimatedPayment: 1150,
    priority: "Urgent",
    status: "In Progress",
    issueDescription:
      "Thermo King refrigeration alarm code 17 (Engine temp spiking above safe threshold). Perishable frozen cargo aboard. Needs immediate mobile coolant leak repair and drive belt inspection.",
    requiredParts: ["Reefer Alternator Belt", "Heavy-Duty Coolant 5L", "Thermostat Sensor"],
    contactPhone: "+91 98123 45678",
    isMockData: true,
  },
  {
    id: "HVD-3310",
    vehicleType: "Heavy-duty vehicle",
    vehicleModel: "Freightliner Cascadia 126",
    category: "Brake Inspection",
    customerName: "JB Hunt Intermodal",
    location: "Commercial Logistics Yard, Bay 4",
    requestedDateTime: "Tomorrow • 09:00 AM",
    estimatedDistance: "12.5 km away",
    estimatedPayment: 680,
    priority: "Normal",
    status: "Scheduled",
    issueDescription:
      "Routine 90-day commercial brake stroke measurement, S-cam bushing wear inspection, and air brake chamber pressure test prior to interstate dispatch.",
    requiredParts: ["Type 30 Brake Chamber Diaphragm", "Brake Shoe Return Springs"],
    contactPhone: "+91 97234 56789",
    isMockData: true,
  },
];
