import { ScheduleItem } from '@common/services/councilSchedule/councilSchedule.types';
import axios from 'axios';
import { extractColour, guessColour, normaliseBinName, toIso } from '../helpers';
import { RushmoorApiResponse } from './';

export async function getRushmoorSchedule(uprn: string): Promise<ScheduleItem[]> {
  const url = `https://www.rushmoor.gov.uk/Umbraco/Api/BinLookUpWorkAround/Get?selectedAddress=${uprn}`;
  const res = await axios.get<RushmoorApiResponse>(url);
  const raw = res.data;

  const next = raw?.NextCollection;
  if (!next) return [];

  const schedule = [];

  const bins = [
    { name: 'Refuse', date: next.RefuseCollectionBinDate },
    { name: 'Recycling', date: next.RecyclingCollectionDate },
    { name: 'Garden Waste', date: next.GardenWasteCollectionDate },
    { name: 'Food Waste', date: next.FoodWasteCollectionDate },
  ];

  for (const bin of bins) {
    if (!bin.date) continue;

    schedule.push({
      date: toIso(bin.date),
      binName: normaliseBinName(bin.name),
      binColour: extractColour(bin.name) ?? guessColour(bin.name),
      binContent: undefined,
    });
  }

  return schedule;
}
