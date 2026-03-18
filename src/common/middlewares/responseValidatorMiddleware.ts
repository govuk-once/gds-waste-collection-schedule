import type { MiddlewareObj } from '@middy/core';
import type { APIGatewayEvent, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import httpError from 'http-errors';
import { type ZodType } from 'zod';

export const responseValidatorMiddleware = (
  bodySchema?: ZodType
): MiddlewareObj<APIGatewayEvent, Omit<APIGatewayProxyStructuredResultV2, 'body'> & { body: unknown }, Error> => ({
  after: (request): void => {
    if (!bodySchema) return;

    console.log('FULL REQUEST:', JSON.stringify(request, null, 2));
    const rawBody = request.response?.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      console.log(JSON.stringify(parsed.error.format(), null, 2));
      throw new httpError.ExpectationFailed('Response validation failed');
    }
  },
});
