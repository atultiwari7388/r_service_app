import { Timestamp } from "firebase/firestore";

export interface CompanyType {
  id: string;
  companyName: string;
  dot: string;
  mc: string;
  nsc?: string;
  cvor?: string;
  nir?: string;
  cbsa?: string;
  rfc?: string;
  ftp?: string;
  voln?: string;
  abn?: string;
  hva?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  isActive: boolean;
  created_at?: Timestamp | Date | any;
  updated_at?: Timestamp | Date | any;
}
