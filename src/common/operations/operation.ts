import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { HandlerDependencies, initializeDependencies } from '@common/ioc';
import {
  type IMiddleware,
  type IRequestEvent,
  type IRequestResponse,
  type ITypedRequestEvent,
  type ITypedRequestResponse,
  requestValidatorMiddleware,
  responseValidatorMiddleware,
  serializeBodyToJson,
} from '@common/middlewares';
import { ObservabilityService } from '@common/services';
import { StringParameters } from '@common/utils/parameters';
import middy, { type MiddyfiedHandler } from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { ALBEvent, APIGatewayEvent, APIGatewayProxyEventV2, APIGatewayProxyResult, Context } from 'aws-lambda';
import type { z, ZodAny, ZodType } from 'zod';

export type RequestEvent = APIGatewayEvent | APIGatewayProxyEventV2 | ALBEvent;

export abstract class APIHandler<
  InputSchema extends ZodType = ZodAny,
  OutputSchema extends ZodType = ZodAny,
  InferredInputSchema = z.infer<InputSchema>,
  InferredOutputSchema = z.infer<OutputSchema>,
> {
  public abstract operationId: string;
  public abstract requestBodySchema: InputSchema;
  public abstract responseBodySchema: OutputSchema;

  constructor(
    protected observability: ObservabilityService,
    protected config: any 
  ) {}

  protected dependencies: (() => HandlerDependencies<object>)[] = [];

  public injectDependencies(dependencies?: () => HandlerDependencies<object>) {
    this.observability.logger.info(`IoC Injection setup!`);
    if (dependencies) {
      this.dependencies.push(dependencies);
    }
  }

  public implementation(
    _event: ITypedRequestEvent<InferredInputSchema>,
    _context: Context
  ): Promise<ITypedRequestResponse<InferredOutputSchema>> {
    throw new Error('Not Implemented');
  }

  private cachedApiKey: string | null = null;

  protected apiKeyMiddleware = () => ({
    before: async (request: any) => {
      if (!this.cachedApiKey) {
        this.cachedApiKey = await this.config.getParameter(
          StringParameters.Config.ApiKey
        );
      }

      const provided = request.event.headers?.['x-api-key'];

      if (!provided) {
        throw Object.assign(new Error('Missing API key'), { statusCode: 401 });
      }

      if (provided !== this.cachedApiKey) {
        throw Object.assign(new Error('Invalid API key'), { statusCode: 403 });
      }
    },
  });

  protected sanitizationMiddlewares(m: IMiddleware): IMiddleware {
    return m
      .use(httpHeaderNormalizer())
      .use(
        httpJsonBodyParser({
          disableContentTypeError: true,
        })
      )
      .use(httpEventNormalizer())
      .use(serializeBodyToJson())
      .use(httpErrorHandler());
  }
  
  /**
   * Custom JSON error middleware to ensure all thrown errors return JSON.
   */
  protected jsonErrorMiddleware = () => ({
    onError: (request: { error: unknown; response?: APIGatewayProxyResult }): APIGatewayProxyResult => {
      const err = request.error as { statusCode?: number; message?: string };

      const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;

      const message = typeof err.message === 'string' ? err.message : 'internalServerError';

      const response: APIGatewayProxyResult = {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
        }),
      };

      request.response = response;
      return response;
    },
  });

  /**
   * Observability middlewares.
   */
  protected observabilityMiddlewares(m: IMiddleware): IMiddleware {
    return m
      .use(
        injectLambdaContext(this.observability.logger, {
          correlationIdPath: 'requestContext.requestId',
        })
      )
      .use(captureLambdaHandler(this.observability.tracer))
      .use(
        logMetrics(this.observability.metrics, {
          captureColdStartMetric: true,
          throwOnEmptyMetrics: false,
        })
      );
  }

  /**
   * Request/response validation.
   */
  protected validationMiddlewares(m: IMiddleware): IMiddleware {
    return m
      .use(requestValidatorMiddleware(this.requestBodySchema))
      .use(responseValidatorMiddleware(this.responseBodySchema));
  }

  /**
   * Main middleware chain used by handler().
   */
  protected middlewares(m: IMiddleware): IMiddleware {
    // 1. Input cleanup
    m = m
      .use(httpHeaderNormalizer())
      .use(httpJsonBodyParser({ disableContentTypeError: true }))
      .use(httpEventNormalizer());

    // 2. Request validation and API key validation
    m = m.use(this.apiKeyMiddleware());
    m = m.use(requestValidatorMiddleware(this.requestBodySchema));

    // 3. Handler executes here

    // 4. Response validation
    m = m.use(responseValidatorMiddleware(this.responseBodySchema));

    // 5. Serialization + JSON error handling
    m = m.use(serializeBodyToJson()).use(this.jsonErrorMiddleware()).use(httpErrorHandler());

    // 6. Observability
    m = m
      .use(
        injectLambdaContext(this.observability.logger, {
          correlationIdPath: 'requestContext.requestId',
        })
      )
      .use(captureLambdaHandler(this.observability.tracer))
      .use(
        logMetrics(this.observability.metrics, {
          captureColdStartMetric: true,
          throwOnEmptyMetrics: false,
        })
      );

    return m;
  }

  /**
   * Final handler wrapper.
   */
  public handler(): MiddyfiedHandler<IRequestEvent, IRequestResponse> {
    this.observability.metrics.addMetric('API_CALL_TRIGGERED', MetricUnit.Count, 1);

    return this.middlewares(middy()).handler(async (event, context) => {
      await initializeDependencies(this, this.dependencies);

      return (await this.implementation(
        event as unknown as ITypedRequestEvent<InferredInputSchema>,
        context
      )) as IRequestResponse;
    });
  }
}
