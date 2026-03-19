import { ScheduleItem } from '@common/services/councilSchedule/councilSchedule.types';
import axios from 'axios';
import { extractColour, guessColour, normaliseBinName, toIso } from '../helpers';
import { HarrowApiResponse, HarrowCollectionEvent } from './';

export async function getHarrowSchedule(uprn: string): Promise<ScheduleItem[]> {
  const url = `https://www.harrow.gov.uk/ajax/bins?u=${uprn}`;
  const res = await axios.get<HarrowApiResponse>(url);
  const raw = res.data;

  const collections = raw?.results?.collections;
  if (!collections) return [];

  // Harrow has multiple lists; we want the "next" list for upcoming collections
  const next = Array.isArray(collections.next) ? collections.next : [];

  return next.map((item: HarrowCollectionEvent) => ({
    date: toIso(item?.eventTime),
    binName: normaliseBinName(item?.binType) ?? 'Unknown',
    binColour: extractColour(item?.binType) ?? guessColour(item?.binType),
    binContent: undefined,
  }));
}
