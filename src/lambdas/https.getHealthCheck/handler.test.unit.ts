import { beforeEach, describe, expect, it } from 'vitest';
import z from 'zod';

import { GetHealthcheck } from './handler';

// Shared test helpers
import { createMockContext, createMockEvent, createMockObservabilityService } from '@project/_testHelpers/mockHelpers';

describe('GetHealthcheck', () => {
  let handler: GetHealthcheck;

  beforeEach(() => {
    const obs = createMockObservabilityService();
    handler = new GetHealthcheck(obs);
  });

  it('returns a 200 OK response', async () => {
    const event = createMockEvent();
    const context = createMockContext();

    const result = await handler.implementation(event, context);

    expect(result.statusCode).toBe(200);
  });

  it('returns a body with status "ok"', async () => {
    const event = createMockEvent();
    const context = createMockContext();

    const result = await handler.implementation(event, context);

    expect(result.body).toEqual({ status: 'ok' });
  });

  it('response matches the Zod response schema', async () => {
    const event = createMockEvent();
    const context = createMockContext();

    const result = await handler.implementation(event, context);

    const schema = z.object({ status: z.string() });

    expect(() => schema.parse(result.body)).not.toThrow();
  });

  it('does not use request body or context', async () => {
    const event = createMockEvent({ body: { ignored: true } });
    const context = createMockContext({ awsRequestId: 'ignored' });

    const result = await handler.implementation(event, context);

    expect(result.body.status).toBe('ok');
  });
});
