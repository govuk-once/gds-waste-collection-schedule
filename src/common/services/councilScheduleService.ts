import { ConfigurationService } from '@common/services/configurationService';
import httpErrors from 'http-errors';

import {
  getBarkingSchedule,
  getHarrowSchedule,
  getHDCSchedule,
  getRushmoorSchedule,
  getYorkSchedule,
} from '@common/services/councilSchedule/';
import { ScheduleItem } from '@common/services/councilSchedule/councilSchedule.types';

export class CouncilScheduleService {
  constructor(private config: ConfigurationService) {}

  private resolvers: Record<string, (uprn: string) => Promise<ScheduleItem[]>> = {
    '2741': getYorkSchedule,
    '5450': getHarrowSchedule,
    '520': getHDCSchedule,
    '5060': getBarkingSchedule,
    '1750': getRushmoorSchedule,
  };

  public async getSchedule(uprn: string, localCustodianCode: string) {
    const resolver = this.resolvers[localCustodianCode];

    if (!resolver) {
      throw new httpErrors.BadRequest('councilNotSupported');
    }

    return resolver(uprn);
  }
}
