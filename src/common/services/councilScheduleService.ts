import { ConfigurationService } from '@common/services';
import { councilTable } from '@common/services/councilSchedule/councilTable';
import httpErrors from 'http-errors';

export class CouncilScheduleService {
  constructor(private config: ConfigurationService) {}

  public async getSchedule(uprn: string, localCustodianCode: string) {
    const entry = councilTable[localCustodianCode];

    if (!entry) {
      throw new httpErrors.BadRequest('councilNotSupported');
    }

    return entry.resolver(uprn);
  }
}
