export interface HarrowCollectionEvent {
  binType: string;
  collected: string; // "true" | "false"
  eventType: string;
  eventSubType: string | null;
  eventTime: string; // ISO date
  canReportMissed: string; // "true" | "false"
  reportWindow: number;
}

export interface HarrowCollections {
  last?: HarrowCollectionEvent[];
  next?: HarrowCollectionEvent[];
  all?: HarrowCollectionEvent[];
  week?: Record<string, unknown>; // Week structure is large and not needed for schedule
}

export interface HarrowResults {
  collections?: HarrowCollections;
  gwaste?: Record<string, unknown>;
  ecal?: Record<string, unknown>;
  error?: unknown[];
}

export interface HarrowApiResponse {
  results?: HarrowResults;
  languagePack?: Record<string, string>;
}
