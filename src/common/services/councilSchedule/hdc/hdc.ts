import { ScheduleItem } from '@common/services/councilSchedule/councilSchedule.types';
import axios from 'axios';
import { extractColour, guessColour, normaliseBinName, toIso } from '../helpers';
import { HdcApiResponse } from './';

export async function getHDCSchedule(uprn: string): Promise<ScheduleItem[]> {
  const url = `https://servicelayer3c.azure-api.net/wastecalendar/collection/search/${uprn}?authority=HDC&take=20`;
  const res = await axios.get<HdcApiResponse>(url);
  const raw = res.data;

  const items = Array.isArray(raw?.collections) ? raw.collections : [];

  const schedule = [];

  for (const entry of items) {
    const date = toIso(entry.date);

    // HDC can have multiple roundTypes for the same date
    for (const type of entry.roundTypes ?? []) {
      schedule.push({
        date,
        binName: normaliseBinName(type),
        binColour: extractColour(type) ?? guessColour(type),
        binContent: undefined,
      });
    }
  }

  return schedule;
}
