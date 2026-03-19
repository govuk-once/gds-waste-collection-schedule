import {
  APIHandler,
  HandlerDependencies,
  iocGetConfigurationService,
  iocGetObservabilityService,
  type ITypedRequestEvent,
  type ITypedRequestResponse,
} from '@common';

import { ConfigurationService, CouncilScheduleService, ObservabilityService } from '@common/services';
import { ScheduleItem } from '@common/services/councilSchedule/councilSchedule.types';
import { IScheduleSchema } from '@project/lambdas/interfaces/ISchedule';

import type { Context } from 'aws-lambda';
import httpErrors from 'http-errors';
import 'reflect-metadata';
import z from 'zod';

const requestBodySchema = z.unknown().optional().nullable();
const responseBodySchema = z.array(IScheduleSchema);

export class GetSchedule extends APIHandler<typeof requestBodySchema, typeof responseBodySchema> {
  public operationId = 'getSchedule';
  public requestBodySchema = requestBodySchema;
  public responseBodySchema = responseBodySchema;

  constructor(
    protected observability: ObservabilityService,
    protected config: ConfigurationService,
    protected councilScheduleService: CouncilScheduleService,
    asyncDependencies?: () => HandlerDependencies<GetSchedule>
  ) {
    super(observability);
    this.injectDependencies(asyncDependencies);
  }

  public async implementation(
    event: ITypedRequestEvent<z.infer<typeof requestBodySchema>>,
    _context: Context
  ): Promise<ITypedRequestResponse<z.infer<typeof responseBodySchema>>> {
    const uprn = event.queryStringParameters?.uprn;
    const localCustodianCode = event.queryStringParameters?.localCustodianCode;

    if (!uprn || !localCustodianCode) {
      throw new httpErrors.BadRequest('missingParameter');
    }

    const schedule = await this.councilScheduleService.getSchedule(uprn, localCustodianCode);

    return {
      body: schedule.map((item: ScheduleItem) => IScheduleSchema.parse(item)),
      statusCode: 200,
    };
  }
}

export const handler = new GetSchedule(
  iocGetObservabilityService(),
  iocGetConfigurationService(),
  new CouncilScheduleService(iocGetConfigurationService())
).handler();
