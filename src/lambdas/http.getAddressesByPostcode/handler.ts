import {
  APIHandler,
  HandlerDependencies,
  iocGetObservabilityService,
  type ITypedRequestEvent,
  type ITypedRequestResponse,
} from '@common';
import { ObservabilityService } from '@common/services';
import httpResponseSerializer from '@middy/http-response-serializer';
import { IAddressByPostcodeSchema } from '@project/lambdas/interfaces/index';
import type { Context } from 'aws-lambda';
import 'reflect-metadata';
import z from 'zod';

const requestBodySchema = z.unknown().optional().nullable();
const responseBodySchema = z.array(IAddressByPostcodeSchema);

/* Lambda Request Example
{
  "pathParameters": {
    "postcode": "LL57 1AU"
  }  
}
*/

export class GetAddressByPostcode extends APIHandler<typeof requestBodySchema, typeof responseBodySchema> {
  public operationId: string = 'getAddressByPostcode';
  public requestBodySchema = requestBodySchema;
  public responseBodySchema = responseBodySchema;

  constructor(
    protected observability: ObservabilityService,
    asyncDependencies?: () => HandlerDependencies<GetAddressByPostcode>
  ) {
    super(observability);
    this.injectDependencies(asyncDependencies);
  }

  public async implementation(
    event: ITypedRequestEvent<z.infer<typeof requestBodySchema>>,
    context: Context
  ): Promise<ITypedRequestResponse<z.infer<typeof responseBodySchema>>> {
    const postCode = event.pathParameters?.postcode;
    const addresses = [
      {
        addressFull: '12 Bedway Lane, Bristol, B12 3ED',
        uprn: '1234567890',
        localCustodianCode: 'BR',
      },
      {
        addressFull: '13 Bedway Lane, Bristol, B12 3ED',
        uprn: '1234567891',
        localCustodianCode: 'BR',
      },
      {
        addressFull: '13 Bedway Lane, Bristol, B12 3ED',
        uprn: '1234567894',
        localCustodianCode: 'BR',
      },
    ];
    return {
      body: addresses.map((item) => IAddressByPostcodeSchema.parse(item)),
      statusCode: 200,
    };
  }
}

export const handler = new GetAddressByPostcode(iocGetObservabilityService()).handler().use(
  httpResponseSerializer({
    serializers: [
      {
        regex: /^application\/json$/,
        serializer: ({ body }) => JSON.stringify(body),
      },
    ],
    defaultContentType: 'application/json',
  })
);
