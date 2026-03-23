import type { ConfigurationService } from '@common/services/configurationService';
import httpErrors from 'http-errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the module BEFORE importing anything from it
vi.mock('@common/services/councilSchedule/', () => ({
  getYorkSchedule: vi.fn(),
  getHarrowSchedule: vi.fn(),
  getHDCSchedule: vi.fn(),
  getBarkingSchedule: vi.fn(),
  getRushmoorSchedule: vi.fn(),
}));

// Import the mocked functions
import * as resolvers from '@common/services/councilSchedule/';
import { CouncilScheduleService } from './councilScheduleService';

// Local mock type — avoids vi.Mock namespace entirely
type MockFn = ReturnType<typeof vi.fn>;

// Cast imported mocks safely
const getYorkSchedule = resolvers.getYorkSchedule as MockFn;
const getHarrowSchedule = resolvers.getHarrowSchedule as MockFn;
const getHDCSchedule = resolvers.getHDCSchedule as MockFn;
const getBarkingSchedule = resolvers.getBarkingSchedule as MockFn;
const getRushmoorSchedule = resolvers.getRushmoorSchedule as MockFn;

describe('CouncilScheduleService', () => {
  let service: CouncilScheduleService;

  const configMock = {
    getParameter: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CouncilScheduleService(configMock as unknown as ConfigurationService);
  });

  describe('getSchedule', () => {
    const uprn = '12345';

    const resolverMap = [
      { code: '2741', resolver: getYorkSchedule },
      { code: '5450', resolver: getHarrowSchedule },
      { code: '520', resolver: getHDCSchedule },
      { code: '5060', resolver: getBarkingSchedule },
      { code: '1750', resolver: getRushmoorSchedule },
    ];

    it.each(resolverMap)('calls the correct resolver for localCustodianCode $code', async ({ code, resolver }) => {
      const expected = [{ bin: 'blue' }];
      resolver.mockResolvedValueOnce(expected);

      const result = await service.getSchedule(uprn, code);

      expect(resolver).toHaveBeenCalledTimes(1);
      expect(resolver).toHaveBeenCalledWith(uprn);
      expect(result).toEqual(expected);
    });

    it('throws councilNotSupported for unknown localCustodianCode', async () => {
      await expect(service.getSchedule(uprn, '9999')).rejects.toThrowError(
        new httpErrors.BadRequest('councilNotSupported')
      );
    });
  });
});
