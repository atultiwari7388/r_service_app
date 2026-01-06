// --- Dropdown Menu Component ---
interface DropdownMenuProps {
  loadId: string;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onAction: (action: string, loadId: string) => void;
}

interface LoadData {
  id: string;
  loadNumber: string;
  customer: string;
  type: "FTL" | "LTL" | "Reefer" | "Flatbed" | "Dry Van";
  status:
    | "Booked"
    | "Pre-Planned"
    | "Ready"
    | "Active"
    | "Completed"
    | "Missing BOL";
  truck: string;
  trailer: string;
  driver: string;
  pickupLocation: string;
  pickupDate: string;
  dropLocation: string;
  dropDate: string;
  distance: string;
  weight: string;
  rate: number;
  profit: number;
  progress: number;
  quantity: number;
  specialInstructions: string;
  documents: number;
}

interface Tab {
  id: string;
  label: string;
  count: number;
  color: string;
  bgColor: string;
}
