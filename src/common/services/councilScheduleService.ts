import { ConfigurationService } from '@common/services/configurationService';
import httpErrors from 'http-errors';

import {
  getBarkingSchedule,
  getHarrowSchedule,
  getHDCSchedule,
  getRushmoorSchedule,
  getYorkSchedule,
} from '@common/services/councilSchedule/';

import { resolverTable } from '@common/services/councilSchedule/resolverTable';

const resolverFunctions = {
  york: getYorkSchedule,
  harrow: getHarrowSchedule,
  hdc: getHDCSchedule,
  barking: getBarkingSchedule,
  rushmoor: getRushmoorSchedule,
} as const;

export class CouncilScheduleService {
  constructor(private config: ConfigurationService) {}

  public async getSchedule(uprn: string, localCustodianCode: string) {
    const resolverName = resolverTable[localCustodianCode];

    if (!resolverName) {
      throw new httpErrors.BadRequest('councilNotSupported');
    }

    const resolver = resolverFunctions[resolverName as keyof typeof resolverFunctions];

    if (!resolver) {
      throw new httpErrors.BadRequest('resolverNotImplemented');
    }

    return resolver(uprn);
  }
}
