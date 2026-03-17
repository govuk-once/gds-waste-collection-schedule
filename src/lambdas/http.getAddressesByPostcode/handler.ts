import {
  APIHandler,
  HandlerDependencies,
  iocGetConfigurationService,
  iocGetObservabilityService,
  iocGetOrdinanceSurveyService,
  type ITypedRequestEvent,
  type ITypedRequestResponse,
} from '@common';
import { ConfigurationService, ObservabilityService } from '@common/services';
import { OrdinanceSurveyService } from '@common/services/ordinanceSurveyService';
import httpResponseSerializer from '@middy/http-response-serializer';
import { IAddressByPostcodeSchema } from '@project/lambdas/interfaces/index';
import type { Context } from 'aws-lambda';
import httpErrors from 'http-errors';
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
    protected config: ConfigurationService,
    public ordinanceSurveyService: OrdinanceSurveyService,
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
    if (!postCode) {
      throw new httpErrors.BadRequest();
    }

    const addresses = await this.ordinanceSurveyService.getPostcode(postCode);

    console.log(addresses);
    return {
      body: addresses.map((item: any) => IAddressByPostcodeSchema.parse(item)),
      statusCode: 200,
    };
  }
}

export const handler = new GetAddressByPostcode(
  iocGetObservabilityService(),
  iocGetConfigurationService(),
  iocGetOrdinanceSurveyService()
)
  .handler()
  .use(
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
