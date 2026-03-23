/* eslint-disable @typescript-eslint/unbound-method */

import httpErrors from 'http-errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ITypedRequestEvent } from '@common';
import type { ConfigurationService, CouncilScheduleService, ObservabilityService } from '@common/services';
import type { Context } from 'aws-lambda';

import { IScheduleSchema } from '@project/lambdas/interfaces/ISchedule';
import { GetSchedule } from './handler';

describe('GetSchedule Handler', () => {
  let handler: GetSchedule;

  // ---------------------------------------------------------------------------
  // Fully typed mocks
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

  const councilScheduleMock = {
    getSchedule: vi.fn<() => Promise<unknown>>(),
  } as unknown as CouncilScheduleService;

  // ---------------------------------------------------------------------------

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new GetSchedule(observabilityMock, configMock, councilScheduleMock);
  });

  // ---------------------------------------------------------------------------

  describe('implementation', () => {
    it('throws BadRequest when uprn or localCustodianCode is missing', async () => {
      const event = {
        queryStringParameters: {},
      } as unknown as ITypedRequestEvent<unknown>;

      await expect(handler.implementation(event, {} as Context)).rejects.toBeInstanceOf(httpErrors.BadRequest);
    });

    it('propagates errors thrown by councilScheduleService.getSchedule', async () => {
      const event = {
        queryStringParameters: {
          uprn: '100024629',
          localCustodianCode: '5060',
        },
      } as unknown as ITypedRequestEvent<unknown>;

      const error = new httpErrors.BadRequest('councilNotSupported');
      vi.mocked(councilScheduleMock.getSchedule).mockRejectedValue(error);

      await expect(handler.implementation(event, {} as Context)).rejects.toThrowError(error);
    });

    it('returns 200 and parsed schedule when valid', async () => {
      const event = {
        queryStringParameters: {
          uprn: '100024629',
          localCustodianCode: '5060',
        },
      } as unknown as ITypedRequestEvent<unknown>;

      const mockSchedule = [
        {
          date: '2026-03-19',
          binName: 'Refuse',
          binColour: 'black',
          binContent: undefined,
        },
      ];

      vi.mocked(councilScheduleMock.getSchedule).mockResolvedValue(mockSchedule);

      const result = await handler.implementation(event, {} as Context);

      expect(result.statusCode).toBe(200);
      expect(result.body).toEqual(mockSchedule.map((s) => IScheduleSchema.parse(s)));
    });
  });
});
