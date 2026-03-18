import { BinColoursEnum } from '@common/models/binColoursEnum';
import { createMockContext, createMockEvent, createMockObservabilityService } from '@project/_testHelpers/mockHelpers';
import { IScheduleSchema } from '@project/lambdas/interfaces/ISchedule';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSchedule } from './handler';

describe('GetSchedule', () => {
  let handler: GetSchedule;

  beforeEach(() => {
    handler = new GetSchedule(createMockObservabilityService());
  });

  it('returns a 200 response with valid schedule items', async () => {
    const result = await handler.implementation(createMockEvent(), createMockContext());

    expect(result.statusCode).toBe(200);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(4);

    result.body.forEach((item) => {
      expect(() => IScheduleSchema.parse(item)).not.toThrow();
    });
  });

  it('produces correct bin colours and names', async () => {
    const result = await handler.implementation(createMockEvent(), createMockContext());

    const items = result.body;

    expect(items[0].binColour).toBe(BinColoursEnum.BLACK.toLowerCase());
    expect(items[1].binColour).toBe(BinColoursEnum.GREEN.toLowerCase());
    expect(items[2].binColour).toBe(BinColoursEnum.BLUE.toLowerCase());

    expect(items[0].binName).toBe('General Waste');
    expect(items[1].binName).toBe('Garden');
    expect(items[2].binName).toBe('Recycling');
  });

  it('includes today’s date for recycling entries', async () => {
    const today = new Date().toISOString().split('T')[0];

    const result = await handler.implementation(createMockEvent(), createMockContext());

    const recycling = result.body.filter((x) => x.binName === 'Recycling');

    expect(recycling.length).toBe(2);
    recycling.forEach((item) => {
      expect(item.date).toBe(today);
    });
  });

  it('computes weekday ISO dates correctly for General Waste and Garden', async () => {
    const result = await handler.implementation(createMockEvent(), createMockContext());

    const general = result.body[0];
    const garden = result.body[1];

    const today = new Date();
    const todayDay = today.getDay();

    const expectedTuesday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + ((2 - todayDay + 7) % 7))
      .toISOString()
      .split('T')[0];

    const expectedWednesday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + ((3 - todayDay + 7) % 7)
    )
      .toISOString()
      .split('T')[0];

    expect(general.date).toBe(expectedTuesday);
    expect(garden.date).toBe(expectedWednesday);
  });
});
