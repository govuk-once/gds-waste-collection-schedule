/* eslint-disable @typescript-eslint/unbound-method */
import { IAddressByPostcodeSchema } from '@project/lambdas/interfaces/index';
import httpErrors from 'http-errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetAddressByPostcode } from './handler';

describe('GetAddressByPostcode Handler', () => {
  let handler: GetAddressByPostcode;

  const observabilityMock = {
    logger: { info: vi.fn(), error: vi.fn() },
    tracer: { addServiceName: vi.fn(), putAnnotation: vi.fn() },
    metrics: { addMetric: vi.fn() },
  } as any;

  const configMock = {
    getParameter: vi.fn(),
  } as any;

  const ordinanceSurveyMock = {
    getPostcode: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    handler = new GetAddressByPostcode(observabilityMock, configMock, ordinanceSurveyMock);
  });

  describe('implementation', () => {
    it('throws BadRequest when postcode is missing', async () => {
      const event: any = { pathParameters: {} };

      await expect(handler.implementation(event, {} as any)).rejects.toBeInstanceOf(httpErrors.BadRequest);
    });

    it('propagates invalidPostcode error from OrdinanceSurveyService', async () => {
      const event: any = {
        pathParameters: { postcode: 'NOT_A_POSTCODE' },
      };

      const error = new httpErrors.BadRequest('invalidPostcode');
      ordinanceSurveyMock.getPostcode.mockRejectedValue(error);

      await expect(handler.implementation(event, {} as any)).rejects.toThrowError(error);
    });

    it('propagates postcodeNotFound error from OrdinanceSurveyService', async () => {
      const event: any = {
        pathParameters: { postcode: 'CF10 1AA' },
      };

      const error = new httpErrors.BadRequest('postcodeNotFound');
      ordinanceSurveyMock.getPostcode.mockRejectedValue(error);

      await expect(handler.implementation(event, {} as any)).rejects.toThrowError(error);
    });

    it('returns 200 and parsed addresses when postcode is valid', async () => {
      const event: any = {
        pathParameters: { postcode: 'CF10 1AA' },
      };

      const mockAddresses = [
        {
          addressFull: '1 Example Road',
          uprn: '123',
          localCustodianCode: '999',
        },
      ];

      ordinanceSurveyMock.getPostcode.mockResolvedValue(mockAddresses);

      const result = await handler.implementation(event, {} as any);

      expect(result.body).toEqual(mockAddresses.map((a) => IAddressByPostcodeSchema.parse(a)));
      expect(result.statusCode).toBe(200);
    });

    it('throws Zod error when OrdinanceSurveyService returns invalid schema', async () => {
      const event: any = {
        pathParameters: { postcode: 'CF10 1AA' },
      };

      ordinanceSurveyMock.getPostcode.mockResolvedValue([
        { uprn: '123' }, // invalid
      ]);

      await expect(handler.implementation(event, {} as any)).rejects.toThrow();
    });
  });
});
