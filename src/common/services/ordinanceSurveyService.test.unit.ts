/* eslint-disable @typescript-eslint/unbound-method */
import type { ConfigurationService } from '@common/services/configurationService';
import axios from 'axios';
import httpErrors from 'http-errors';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdinanceSurveyService } from './ordinanceSurveyService';

vi.mock('axios');
const axiosMock = axios as Mocked<typeof axios>;

describe('OrdinanceSurveyService (with caching)', () => {
  let service: OrdinanceSurveyService;

  const configMock = {
    getParameter: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new OrdinanceSurveyService(configMock as unknown as ConfigurationService);

    configMock.getParameter
      .mockResolvedValueOnce('API_KEY') // ApiKey
      .mockResolvedValueOnce('https://os.test'); // BaseUrl
  });

  describe('caching behaviour', () => {
    const postcode = 'CF10 1AA';
    const cleaned = 'CF10 1AA';

    const apiResponse = {
      data: {
        results: [
          {
            DPA: {
              UPRN: '1001',
              BUILDING_NUMBER: '1',
              THOROUGHFARE_NAME: 'Example Road',
              POSTCODE: 'CF10 1AA',
              LOCAL_CUSTODIAN_CODE: 999,
            },
          },
        ],
      },
    };

    const mapped = [
      {
        addressFull: '1, Example Road, CF10 1AA',
        uprn: '1001',
        localCustodianCode: '999',
      },
    ];

    it('stores results in cache after first API call', async () => {
      axiosMock.get.mockResolvedValue(apiResponse);

      const result = await service.getPostcode(postcode);

      expect(result).toEqual(mapped);
      expect(service['cache'].get(cleaned)).toEqual(mapped);
    });

    it('returns cached results on subsequent calls and does not call axios again', async () => {
      axiosMock.get.mockResolvedValue(apiResponse);

      await service.getPostcode(postcode);
      const result = await service.getPostcode(postcode);

      expect(result).toEqual(mapped);
      expect(axiosMock.get).toHaveBeenCalledTimes(1);
    });

    it('throws postcodeNotFound and does NOT cache empty results', async () => {
      axiosMock.get.mockResolvedValue({
        data: { results: [] },
      });

      await expect(service.getPostcode(postcode)).rejects.toThrowError(new httpErrors.BadRequest('postcodeNotFound'));

      expect(service['cache'].has(cleaned)).toBe(false);
    });

    it('does not cache invalidPostcode errors', async () => {
      await expect(service.getPostcode('INVALID')).rejects.toThrowError(new httpErrors.BadRequest('invalidPostcode'));

      expect(service['cache'].has('INVALID')).toBe(false);
    });
  });
});
