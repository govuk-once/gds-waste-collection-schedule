import { ConfigurationService } from '@common/services/configurationService';
import { resolverTable } from '@common/services/councilSchedule/resolverTable';
import { InMemoryTTLCache, StringParameters } from '@common/utils';
import axios, { AxiosResponse } from 'axios';
import httpErrors from 'http-errors';

type DPA = {
  UPRN: string;
  BUILDING_NUMBER: string;
  THOROUGHFARE_NAME: string;
  POSTCODE: string;
  LOCAL_CUSTODIAN_CODE: number | string;
  SUB_BUILDING_NAME: string;
  BUILDING_NAME: string;
};

type OSResult = {
  DPA: DPA;
};

type OSApiResponse = {
  results: OSResult[];
};

export function mapDpaToAddressSchema(dpa: DPA) {
  const parts = [
    dpa.SUB_BUILDING_NAME,
    dpa.BUILDING_NAME,
    dpa.BUILDING_NUMBER,
    dpa.THOROUGHFARE_NAME,
    dpa.POSTCODE,
  ].filter(Boolean);

  return {
    addressFull: parts.join(', '),
    uprn: String(dpa.UPRN),
    localCustodianCode: String(dpa.LOCAL_CUSTODIAN_CODE),
  };
}

function normalisePostcode(raw: string): string {
  const cleaned = raw.replace(/\s+/g, '').toUpperCase();

  // Postcodes must be at least 5 chars (A9 9AA) and at most 7 (AA99 9AA)
  if (cleaned.length < 5 || cleaned.length > 7) {
    throw new httpErrors.BadRequest('invalidPostcode');
  }

  // Insert space before last 3 characters
  return cleaned.slice(0, -3) + ' ' + cleaned.slice(-3);
}

export class OrdinanceSurveyService {
  // Cache results for 1 hour (3600000 ms)
  private cache = new InMemoryTTLCache<string, ReturnType<typeof mapDpaToAddressSchema>[]>(3600000);

  constructor(protected config: ConfigurationService) {}

  public async getPostcode(postcode: string) {
    const normalised = normalisePostcode(decodeURIComponent(postcode).trim());

    const ukPostcodeRegex = /^([A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}|GIR 0AA)$/;

    if (!ukPostcodeRegex.test(normalised)) {
      throw new httpErrors.BadRequest('invalidPostcode');
    }

    if (this.cache.has(normalised)) {
      return this.cache.get(normalised)!;
    }

    const apiKey = await this.config.getParameter(StringParameters.Config.OrdinanceSurvey.ApiKey);
    const baseUrl = await this.config.getParameter(StringParameters.Config.OrdinanceSurvey.BaseUrl);

    const url = `${baseUrl}?postcode=${encodeURIComponent(normalised)}&key=${apiKey}`;

    const response: AxiosResponse<OSApiResponse> = await axios.get(url);

    if (!response.data?.results?.length) {
      throw new httpErrors.BadRequest('postcodeNotFound');
    }

    const mapped = response.data.results.map((item) => mapDpaToAddressSchema(item.DPA));

    for (const addr of mapped) {
      if (!resolverTable[addr.localCustodianCode]) {
        throw new httpErrors.BadRequest('councilNotSupported');
      }
    }

    this.cache.set(normalised, mapped);

    return mapped;
  }
}
