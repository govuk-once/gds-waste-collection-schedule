/* eslint-disable @typescript-eslint/unbound-method */

import { IAddressByPostcodeSchema } from '@project/lambdas/interfaces/index';
import httpErrors from 'http-errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetAddressByPostcode } from './handler';

import type { ITypedRequestEvent } from '@common';
import type {
  ConfigurationService,
  ObservabilityService,
  OrdinanceSurveyService,
} from '@common/services';
import type { Context } from 'aws-lambda';

describe('GetAddressByPostcode Handler', () => {
  let handler: GetAddressByPostcode;

  // ---------------------------------------------------------------------------
  // Fully typed mocks (mock only what is used, then cast the whole object)
  // ---------------------------------------------------------------------------

  const observabilityMock = {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
    tracer: {
      addServiceName: vi.fn(),
      putAnnotation: vi.fn(),
    },
    metrics: {
      addMetric: vi.fn(),
    },
  } as unknown as ObservabilityService;

  const configMock = {
    getParameter: vi.fn(),
  } as unknown as ConfigurationService;

  // IMPORTANT: getPostcode must allow invalid return values for Zod test
  const ordinanceSurveyMock = {
    getPostcode: vi.fn<() => Promise<unknown>>(),
  } as unknown as OrdinanceSurveyService;

  // ---------------------------------------------------------------------------

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new GetAddressByPostcode(
      observabilityMock,
      configMock,
      ordinanceSurveyMock
    );
  });

  // ---------------------------------------------------------------------------

  describe('implementation', () => {
    it('throws BadRequest when postcode is missing', async () => {
      const event: ITypedRequestEvent<unknown> = {
        pathParameters: {},
      } as ITypedRequestEvent<unknown>;

      await expect(
        handler.implementation(event, {} as Context)
      ).rejects.toBeInstanceOf(httpErrors.BadRequest);
    });

    it('propagates invalidPostcode error from OrdinanceSurveyService', async () => {
      const event: ITypedRequestEvent<unknown> = {
        pathParameters: { postcode: 'NOT_A_POSTCODE' },
      } as unknown as ITypedRequestEvent<unknown>;

      const error = new httpErrors.BadRequest('invalidPostcode');
      vi.mocked(ordinanceSurveyMock.getPostcode).mockRejectedValue(error);

      await expect(
        handler.implementation(event, {} as Context)
      ).rejects.toThrowError(error);
    });

    it('propagates postcodeNotFound error from OrdinanceSurveyService', async () => {
      const event: ITypedRequestEvent<unknown> = {
        pathParameters: { postcode: 'CF10 1AA' },
      } as unknown as ITypedRequestEvent<unknown>;

      const error = new httpErrors.BadRequest('postcodeNotFound');
      vi.mocked(ordinanceSurveyMock.getPostcode).mockRejectedValue(error);

      await expect(
        handler.implementation(event, {} as Context)
      ).rejects.toThrowError(error);
    });

    it('returns 200 and parsed addresses when postcode is valid', async () => {
      const event: ITypedRequestEvent<unknown> = {
        pathParameters: { postcode: 'CF10 1AA' },
      } as unknown as ITypedRequestEvent<unknown>;

      const mockAddresses = [
        {
          addressFull: '1 Example Road',
          uprn: '123',
          localCustodianCode: '999',
        },
      ];

      vi.mocked(ordinanceSurveyMock.getPostcode).mockResolvedValue(
        mockAddresses
      );

      const result = await handler.implementation(event, {} as Context);

      expect(result.statusCode).toBe(200);
      expect(result.body).toEqual(
        mockAddresses.map((a) => IAddressByPostcodeSchema.parse(a))
      );
    });
  });
});
