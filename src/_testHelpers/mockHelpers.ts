import type { ITypedRequestEvent } from '@common';
import type { ObservabilityService } from '@common/services/';
import type { Context } from 'aws-lambda';
import { vi } from 'vitest';

/**
 * ObservabilityService mock
 */
export const createMockObservabilityService = (overrides: Partial<ObservabilityService> = {}): ObservabilityService =>
  ({
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      trace: vi.fn(),
    },
    ...overrides,
  }) as unknown as ObservabilityService;

/**
 * ITypedRequestEvent mock
 * This satisfies:
 * - IRequestEvent (your custom wrapper)
 * - API Gateway v1 event
 * - API Gateway v2 event
 */
export const createMockEvent = (overrides: Partial<ITypedRequestEvent<unknown>> = {}): ITypedRequestEvent<unknown> => {
  const base: ITypedRequestEvent<unknown> = {
    body: undefined,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/',
    rawPath: '/',
    rawQueryString: '',
    routeKey: '$default',

    pathParameters: {},
    queryStringParameters: {},
    multiValueQueryStringParameters: {},

    resource: '/',
    stageVariables: {},

    requestContext: {
      // v1 fields
      accountId: '123456789012',
      apiId: 'test',
      authorizer: {},
      protocol: 'HTTP/1.1',
      httpMethod: 'GET',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'vitest',
        userArn: null,
      },
      path: '/',
      stage: 'test',
      requestId: 'test',
      requestTimeEpoch: Date.now(),
      resourceId: 'test',
      resourcePath: '/',

      // v2 fields
      domainName: 'example.com',
      domainPrefix: 'example',
      http: {
        method: 'GET',
        path: '/',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'vitest',
      },
      routeKey: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },

    version: '1.0',
  };

  return {
    ...base,
    ...overrides,
    requestContext: {
      ...base.requestContext,
      ...(overrides.requestContext ?? {}),
    },
  };
};

/**
 * AWS Lambda Context mock
 */
export const createMockContext = (overrides: Partial<Context> = {}): Context => {
  const base: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:test',
    memoryLimitInMB: '128',
    awsRequestId: 'test',
    logGroupName: 'test',
    logStreamName: 'test',
    getRemainingTimeInMillis: () => 1000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };

  return { ...base, ...overrides };
};
