export interface RushmoorNextCollection {
  CollectionDay: string;
  CollectionSchedule: string;
  RefuseCollectionBinDate: string | null;
  RefuseBinExceptionMessage: string;
  RecyclingCollectionDate: string | null;
  RecyclingExceptionMessage: string;
  GardenWasteCollectionDate: string | null;
  GardenWasteExceptionMessage: string;
  FoodWasteCollectionDate: string | null;
  FoodWasteExceptionMessage: string;
}

export interface RushmoorPreviousCollection {
  CollectionDay: string;
  CollectionSchedule: string;
  RefuseCollectionBinDate: string | null;
  RefuseBinExceptionMessage: string;
  RecyclingCollectionDate: string | null;
  RecyclingExceptionMessage: string;
  GardenWasteCollectionDate: string | null;
  GardenWasteExceptionMessage: string;
  FoodWasteCollectionDate: string | null;
  FoodWasteExceptionMessage: string;
}

export interface RushmoorApiResponse {
  UPRN: string;
  NextCollection: RushmoorNextCollection;
  PreviousCollection: RushmoorPreviousCollection;
  BulkCollectionDetails: unknown;
  [key: string]: unknown;
}
