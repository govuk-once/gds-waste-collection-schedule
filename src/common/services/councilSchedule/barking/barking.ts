import { ScheduleItem } from '@common/services/councilSchedule/councilSchedule.types';
import axios from 'axios';
import { extractColour, guessColour, normaliseBinName } from '../helpers';
import { BarkingApiResponse } from './';

function parseHumanDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;

  // Example: "Tuesday 10 March 2026"
  const parts = dateStr.split(' ');
  if (parts.length < 4) return undefined;

  const [_, day, month, year] = parts;
  const parsed = new Date(`${day} ${month} ${year}`);

  if (isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString().split('T')[0];
}

export async function getBarkingSchedule(uprn: string): Promise<ScheduleItem[]> {
  const url = `https://www.lbbd.gov.uk/rest/bin/${uprn}`;
  const res = await axios.get<BarkingApiResponse>(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json,text/html,*/*',
      'Accept-Language': 'en-GB,en;q=0.9',
      Referer: 'https://www.lbbd.gov.uk/',
    },
  });
  const raw = res.data;

  const items = Array.isArray(raw?.results) ? raw.results : [];
  const schedule = [];

  for (const item of items) {
    const next = parseHumanDate(item.nextcollection);

    if (next) {
      schedule.push({
        date: next,
        binName: normaliseBinName(item.bin_name ?? item.bin_type),
        binColour: extractColour(item.bin_name) ?? guessColour(item.bin_name),
        binContent: undefined,
      });
    }

    for (const future of item.futurecollections ?? []) {
      const parsed = parseHumanDate(future);
      if (!parsed) continue;

      schedule.push({
        date: parsed,
        binName: normaliseBinName(item.bin_name ?? item.bin_type),
        binColour: extractColour(item.bin_name) ?? guessColour(item.bin_name),
        binContent: undefined,
      });
    }
  }

  return schedule;
}
