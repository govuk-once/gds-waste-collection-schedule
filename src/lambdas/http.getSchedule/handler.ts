import {
  APIHandler,
  HandlerDependencies,
  iocGetObservabilityService,
  type ITypedRequestEvent,
  type ITypedRequestResponse,
} from '@common';
import { BinColoursEnum } from '@common/models/binColoursEnum';
import { ObservabilityService } from '@common/services';
import { IScheduleSchema } from '@project/lambdas/interfaces/ISchedule';
import type { Context } from 'aws-lambda';
import 'reflect-metadata';
import z from 'zod';

const requestBodySchema = z.unknown().optional().nullable();
const responseBodySchema = z.array(IScheduleSchema);

/* Lambda Request Example
{
  "pathParameters": {
    "uprn": "1234567890",
    "localCustodianCode": "BR"
  }  
}
*/
const getWeekdayIso = (targetDay: number, from = new Date()) => {
  const date = new Date(from);
  const day = date.getDay();

  const diff = (targetDay - day + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
};

export class GetSchedule extends APIHandler<typeof requestBodySchema, typeof responseBodySchema> {
  public operationId: string = 'getSchedule';
  public requestBodySchema = requestBodySchema;
  public responseBodySchema = responseBodySchema;

  constructor(
    protected observability: ObservabilityService,
    asyncDependencies?: () => HandlerDependencies<GetSchedule>
  ) {
    super(observability);
    this.injectDependencies(asyncDependencies);
  }

  public async implementation(
    _event: ITypedRequestEvent<z.infer<typeof requestBodySchema>>,
    _context: Context
  ): Promise<ITypedRequestResponse<z.infer<typeof responseBodySchema>>> {
    const binData = [
      {
        date: getWeekdayIso(2),
        binName: 'General Waste',
        binColour: BinColoursEnum.BLACK.toString().toLowerCase(),
        binContent: 'All Waste',
      },
      {
        date: getWeekdayIso(3),
        binName: 'Garden',
        binColour: BinColoursEnum.GREEN.toString().toLowerCase(),
        binContent: 'Garden Waste',
      },
      {
        date: new Date().toISOString().split('T')[0],
        binName: 'Recycling',
        binColour: BinColoursEnum.BLUE.toString().toLowerCase(),
        binContent: 'Paper',
      },
      {
        date: new Date().toISOString().split('T')[0],
        binName: 'Recycling',
        binContent: 'Plastics',
      },
    ];

    // Add a harmless await to satisfy require-await
    await Promise.resolve();

    return {
      body: binData.map((item) => IScheduleSchema.parse(item)),
      statusCode: 200,
    };
  }
}

export const handler = new GetSchedule(iocGetObservabilityService()).handler();
