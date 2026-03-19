export interface HdcCollection {
  date: string; // ISO date
  roundTypes: string[];
  slippedCollection: boolean;
}

export interface HdcContainer {
  type: string;
  isAssisted: boolean;
  capacity: number;
  binSackTotal: number;
  isBinStore: boolean;
}

export interface HdcApiResponse {
  collections?: HdcCollection[];
  roundTypes?: string[];
  isBinStore?: boolean;
  events?: unknown[];
  containers?: HdcContainer[];
  showFoodWasteCollectionsFrom?: string | null;
  timestamp?: string;
  [key: string]: unknown;
}
