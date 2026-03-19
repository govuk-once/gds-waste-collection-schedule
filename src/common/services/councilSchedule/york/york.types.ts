export interface YorkServiceItem {
  service: string;
  lastCollected: string | null;
  nextCollection: string | null;
  frequency: string | null;
  binDescription: string | null;
  wasteType: string | null;
  collectedBy: string | null;
}

export interface YorkApiResponse {
  services?: YorkServiceItem[];
  [key: string]: unknown;
}
