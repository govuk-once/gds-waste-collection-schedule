import type { IRequestEvent, ITypedRequestResponse } from '@common/middlewares/interfaces';
import type { MiddlewareObj } from '@middy/core';

export const serializeBodyToJson = (
  pretty: boolean = false
): MiddlewareObj<IRequestEvent, ITypedRequestResponse<string>, Error> => ({
  after: (request): void => {
    const response = request.response;
    if (!response) return;

    // Ensure Content-Type is set
    response.headers = {
      ...(response.headers ?? {}),
      'Content-Type': 'application/json',
    };

    const body = response.body;

    // Avoid double-serializing strings
    if (typeof body === 'string') {
      return;
    }

    // Serialize anything JSON-compatible (objects, arrays, primitives, null)
    response.body = pretty ? JSON.stringify(body, null, 2) : JSON.stringify(body);
  },
});
