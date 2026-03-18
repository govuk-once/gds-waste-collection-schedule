import { search } from '@aws-lambda-powertools/jmespath';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { CacheService, ConfigurationService, ObservabilityService } from '@common/services';
import { OrdinanceSurveyService } from '@common/services/ordinanceSurveyService';

enum Mode {
  SINGLETON,
  TIMEBOUND_SINGLETON,
  NEW_INSTANCE,
  CONTEXT,
}
const serviceCache = {} as Record<string, object>;
const ioc = <Instance>(key: string, mode: Mode, fn: () => Instance) => {
  return () => {
    // Create a single instance and always re-use it on subsequent requests
    if (mode == Mode.SINGLETON) {
      if (serviceCache[key] == undefined) {
        serviceCache[key] = fn() as object;
      }
      return serviceCache[key] as Instance;
    }
    // New instance
    if (mode == Mode.NEW_INSTANCE) {
      return fn();
    }

    throw new Error('Failed to resolve IOC, unexpected mode');
  };
};

// Observability
export const iocGetLogger = ioc(
  `Logger`,
  Mode.SINGLETON,
  () =>
    new Logger({
      serviceName: process.env.SERVICE_NAME ?? 'undefined',
      correlationIdSearchFn: search,
      // Prevent accidental logging of message contents
      jsonReplacerFn: (key, value) => {
        if (['NotificationTitle', 'NotificationBody', 'MessageTitle', 'MessageBody', 'clientCertPem'].includes(key)) {
          return `******`;
        }
        return value;
      },
    })
);
export const iocGetTracer = ioc(`Tracer`, Mode.SINGLETON, () => new Tracer());
export const iocGetMetrics = ioc(
  `Metrics`,
  Mode.SINGLETON,
  () =>
    new Metrics({
      namespace: process.env.NAMESPACE_NAME ?? 'undefined',
      serviceName: process.env.SERVICE_NAME ?? 'undefined',
      defaultDimensions: {
        environment: process.env.PREFIX ?? 'undefined',
      },
    })
);

export const iocGetObservabilityService = ioc(
  `ObservabilityService`,
  Mode.SINGLETON,
  () => new ObservabilityService(iocGetLogger(), iocGetMetrics(), iocGetTracer())
);

export const iocGetConfigurationService = ioc(
  `ConfigurationService`,
  Mode.SINGLETON,
  () => new ConfigurationService(iocGetObservabilityService())
);

export const iocGetCacheService = ioc(
  `CacheService`,
  Mode.SINGLETON,
  () => new CacheService(iocGetConfigurationService(), iocGetObservabilityService())
);

export const iocGetOrdinanceSurveyService = ioc(
  `OrdinanceSurveyService`,
  Mode.SINGLETON,
  () => new OrdinanceSurveyService(iocGetConfigurationService())
);

// Utility FN simplifying integration of dependencies which depend on config within handler
export const initializeDependencies = async <ClassInstance extends object, ClassProperty extends keyof ClassInstance>(
  target: ClassInstance,
  dependencies?: (() => { [key in ClassProperty]?: Promise<(typeof target)[key]> })[]
) => {
  // No dependencies supplied
  if (dependencies == undefined) {
    return target;
  }
  for (const dependency of dependencies) {
    for (const [property, promise] of Object.entries(dependency()) as [
      keyof ClassInstance,
      Promise<ClassInstance[keyof ClassInstance]>,
    ][]) {
      target[property] = await promise;
    }
  }
  return target;
};

export type HandlerDependencies<ClassInstance extends object> = {
  [key in keyof ClassInstance]?: Promise<ClassInstance[key]>;
};
