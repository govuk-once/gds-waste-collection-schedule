import { ScheduleItem } from '@common/services/councilSchedule/councilSchedule.types';
import axios from 'axios';
import { extractColour, normaliseBinName, toIso } from '../helpers';
import { YorkApiResponse, YorkServiceItem } from './';

export async function getYorkSchedule(uprn: string): Promise<ScheduleItem[]> {
  const url = `https://waste-api.york.gov.uk/api/Collections/GetBinCollectionDataForUprn/${uprn}`;
  const res = await axios.get<YorkApiResponse>(url);
  const raw = res.data;

  const items = Array.isArray(raw?.services) ? raw.services : [];

  return items.map((item: YorkServiceItem) => ({
    date: toIso(item?.nextCollection ?? undefined),
    binName: normaliseBinName(item?.service) ?? 'Unknown',
    binColour: extractColour(item?.binDescription ?? undefined),
    binContent: item?.wasteType ?? undefined,
  }));
}
