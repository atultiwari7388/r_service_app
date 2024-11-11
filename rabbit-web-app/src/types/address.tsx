import { Timestamp } from "firebase/firestore";

export interface LocationLatLng {
  latitude: number;
  longitude: number;
}

export interface AddressType {
  id: string;
  address: string;
  addressType: string;
  date: Timestamp;
  isAddressSelected: boolean;
  location: LocationLatLng;
}
