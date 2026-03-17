import { ConfigurationService } from '@common/services/configurationService';
import { InMemoryTTLCache, StringParameters } from '@common/utils';
import axios, { AxiosResponse } from 'axios';
import httpErrors from 'http-errors';

type DPA = {
  UPRN: string;
  ADDRESS: string;
  LOCAL_CUSTODIAN_CODE: number | string;
};

type OSResult = {
  DPA: DPA;
};

type OSApiResponse = {
  results: OSResult[];
};

export function mapDpaToAddressSchema(dpa: DPA) {
  return {
    addressFull: dpa.ADDRESS,
    uprn: String(dpa.UPRN),
    localCustodianCode: String(dpa.LOCAL_CUSTODIAN_CODE),
  };
}

export class OrdinanceSurveyService {
  // Cache results for 1 hour (3600000 ms)
  private cache = new InMemoryTTLCache<string, ReturnType<typeof mapDpaToAddressSchema>[]>(3600000);

  constructor(protected config: ConfigurationService) {}

  public async getPostcode(postcode: string) {
    const cleaned = decodeURIComponent(postcode).trim().toUpperCase();

    const ukPostcodeRegex = /^([A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}|GIR 0AA)$/;

    if (!ukPostcodeRegex.test(cleaned)) {
      throw new httpErrors.BadRequest('invalidPostcode');
    }

    // Check cache first
    if (this.cache.has(cleaned)) {
      return this.cache.get(cleaned)!;
    }

    const apiKey = await this.config.getParameter(StringParameters.Config.OrdinanceSurvey.ApiKey);
    const baseUrl = await this.config.getParameter(StringParameters.Config.OrdinanceSurvey.BaseUrl);

    const url = `${baseUrl}?postcode=${encodeURIComponent(cleaned)}&key=${apiKey}`;

    const response: AxiosResponse<OSApiResponse> = await axios.get(url);

    if (!response.data?.results?.length) {
      throw new httpErrors.BadRequest('postcodeNotFound');
    }

    const mapped = response.data.results.map((item) => mapDpaToAddressSchema(item.DPA));

    // Cache the mapped result
    this.cache.set(cleaned, mapped);

    return mapped;
  }
}
