export interface BarkingResultItem {
  uprn: number;
  bin_type: string;
  bin_name: string;
  collectionday: string;
  nextcollection: string;
  rescheduled: string;
  originalcollectionday: string;
  futurecollections: string[];
}

export interface BarkingApiResponse {
  results?: BarkingResultItem[];
  [key: string]: unknown;
}
