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
              SUB_BUILDING_NAME: 'Flat 2',
              BUILDING_NAME: 'The Oaks',
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
        addressFull: 'Flat 2, The Oaks, 1, Example Road, CF10 1AA',
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

    it('includes SUB_BUILDING_NAME and BUILDING_NAME when both are present', async () => {
      const apiResponseBoth = {
        data: {
          results: [
            {
              DPA: {
                UPRN: '3001',
                SUB_BUILDING_NAME: 'Flat 7',
                BUILDING_NAME: 'Rose Court',
                BUILDING_NUMBER: '22',
                THOROUGHFARE_NAME: 'Queen Street',
                POSTCODE: 'CF10 3AB',
                LOCAL_CUSTODIAN_CODE: 456,
              },
            },
          ],
        },
      };

      axiosMock.get.mockResolvedValue(apiResponseBoth);

      const result = await service.getPostcode('CF10 3AB');

      expect(result).toEqual([
        {
          addressFull: 'Flat 7, Rose Court, 22, Queen Street, CF10 3AB',
          uprn: '3001',
          localCustodianCode: '456',
        },
      ]);
    });

    it('omits SUB_BUILDING_NAME when empty but includes BUILDING_NAME', async () => {
      const apiResponseEmptySub = {
        data: {
          results: [
            {
              DPA: {
                UPRN: '3002',
                SUB_BUILDING_NAME: '',
                BUILDING_NAME: 'Rose Court',
                BUILDING_NUMBER: '22',
                THOROUGHFARE_NAME: 'Queen Street',
                POSTCODE: 'CF10 3AB',
                LOCAL_CUSTODIAN_CODE: 456,
              },
            },
          ],
        },
      };

      axiosMock.get.mockResolvedValue(apiResponseEmptySub);

      const result = await service.getPostcode('CF10 3AB');

      expect(result).toEqual([
        {
          addressFull: 'Rose Court, 22, Queen Street, CF10 3AB',
          uprn: '3002',
          localCustodianCode: '456',
        },
      ]);
    });

    it('omits BUILDING_NAME when empty but includes SUB_BUILDING_NAME', async () => {
      const apiResponseEmptyBuildingName = {
        data: {
          results: [
            {
              DPA: {
                UPRN: '3003',
                SUB_BUILDING_NAME: 'Flat 7',
                BUILDING_NAME: '',
                BUILDING_NUMBER: '22',
                THOROUGHFARE_NAME: 'Queen Street',
                POSTCODE: 'CF10 3AB',
                LOCAL_CUSTODIAN_CODE: 456,
              },
            },
          ],
        },
      };

      axiosMock.get.mockResolvedValue(apiResponseEmptyBuildingName);

      const result = await service.getPostcode('CF10 3AB');

      expect(result).toEqual([
        {
          addressFull: 'Flat 7, 22, Queen Street, CF10 3AB',
          uprn: '3003',
          localCustodianCode: '456',
        },
      ]);
    });

    it('omits SUB_BUILDING_NAME and BUILDING_NAME when both are empty', async () => {
      const apiResponseBothEmpty = {
        data: {
          results: [
            {
              DPA: {
                UPRN: '3004',
                SUB_BUILDING_NAME: '',
                BUILDING_NAME: '',
                BUILDING_NUMBER: '22',
                THOROUGHFARE_NAME: 'Queen Street',
                POSTCODE: 'CF10 3AB',
                LOCAL_CUSTODIAN_CODE: 456,
              },
            },
          ],
        },
      };

      axiosMock.get.mockResolvedValue(apiResponseBothEmpty);

      const result = await service.getPostcode('CF10 3AB');

      expect(result).toEqual([
        {
          addressFull: '22, Queen Street, CF10 3AB',
          uprn: '3004',
          localCustodianCode: '456',
        },
      ]);
    });

    it('handles missing SUB_BUILDING_NAME and BUILDING_NAME fields gracefully', async () => {
      const apiResponseMissing = {
        data: {
          results: [
            {
              DPA: {
                UPRN: '3005',
                BUILDING_NUMBER: '22',
                THOROUGHFARE_NAME: 'Queen Street',
                POSTCODE: 'CF10 3AB',
                LOCAL_CUSTODIAN_CODE: 456,
              },
            },
          ],
        },
      };

      axiosMock.get.mockResolvedValue(apiResponseMissing);

      const result = await service.getPostcode('CF10 3AB');

      expect(result).toEqual([
        {
          addressFull: '22, Queen Street, CF10 3AB',
          uprn: '3005',
          localCustodianCode: '456',
        },
      ]);
    });
  });
});
