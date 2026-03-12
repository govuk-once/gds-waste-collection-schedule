// ioc.ts
import { search } from '@aws-lambda-powertools/jmespath';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import 'reflect-metadata';
import { container } from 'tsyringe';

// Register singletons
container.register('Logger', {
  useValue: new Logger({
    serviceName: process.env.SERVICE_NAME ?? 'undefined',
    correlationIdSearchFn: search,
  }),
});

container.register('Tracer', { useValue: new Tracer() });

container.register('Metrics', {
  useValue: new Metrics({
    namespace: process.env.NAMESPACE_NAME ?? 'undefined',
    serviceName: process.env.SERVICE_NAME ?? 'undefined',
    defaultDimensions: { environment: process.env.ENVIRONMENT ?? 'undefined' },
  }),
});

// Factory that produces a Lambda handler lazily
export function registerHandler<T extends { handler: () => any }>(HandlerClass: new (...args: any[]) => T) {
  return async (event: any, context: any) => {
    const instance = container.resolve<T>(HandlerClass);
    const handlerFn = instance.handler();
    return handlerFn(event, context);
  };
}

export const ioc = container;
