export const StringParameters = {
  Config: {
    Cache: {
      Host: 'config/common/cache/host',
      Name: 'config/common/cache/name',
      User: 'config/common/cache/user',
    },
    OrdinanceSurvey: {
      ApiKey: 'config/OrdinanceSurvey/ApiKey',
      BaseUrl: 'config/OrdinanceSurvey/BaseUrl',
    },
    ApiKey: 'config/ApiKey'
  },
} as const;
