/* eslint-disable @typescript-eslint/unbound-method */
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractColour, guessColour, normaliseBinName, toIso } from '../helpers';
import { getHarrowSchedule } from './';

// Strongly typed mock function type
type MockFn<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> = ReturnType<typeof vi.fn<T>>;

// Mock external modules
vi.mock('axios');
vi.mock('../helpers', () => ({
  extractColour: vi.fn(),
  guessColour: vi.fn(),
  normaliseBinName: vi.fn(),
  toIso: vi.fn(),
}));

// Typed mock references
const axiosGet = axios.get as MockFn;
const mockExtract = extractColour as MockFn;
const mockGuess = guessColour as MockFn;
const mockNormalise = normaliseBinName as MockFn;
const mockToIso = toIso as MockFn;

describe('getHarrowSchedule', () => {
  const uprn = '12345';
  const url = `https://test/bins?u=${uprn}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls axios with the correct URL', async () => {
    axiosGet.mockResolvedValue({ data: {} });

    await getHarrowSchedule(uprn);

    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when collections is missing', async () => {
    axiosGet.mockResolvedValue({
      data: { results: {} },
    });

    const result = await getHarrowSchedule(uprn);

    expect(result).toEqual([]);
  });

  it('returns empty array when results is missing', async () => {
    axiosGet.mockResolvedValue({
      data: {},
    });

    const result = await getHarrowSchedule(uprn);

    expect(result).toEqual([]);
  });

  it('maps next collections into schedule items', async () => {
    axiosGet.mockResolvedValue({
      data: {
        results: {
          collections: {
            next: [
              { eventTime: '2026-03-10', binType: 'Recycling' },
              { eventTime: '2026-03-11', binType: 'General Waste' },
            ],
          },
        },
      },
    });

    mockToIso.mockImplementation((d: string) => d);
    mockNormalise.mockReturnValue('normalised');
    mockExtract.mockReturnValue('green');
    mockGuess.mockReturnValue('green');

    const result = await getHarrowSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'normalised',
        binColour: 'green',
        binContent: undefined,
      },
      {
        date: '2026-03-11',
        binName: 'normalised',
        binColour: 'green',
        binContent: undefined,
      },
    ]);
  });

  it('falls back to guessColour when extractColour returns undefined', async () => {
    axiosGet.mockResolvedValue({
      data: {
        results: {
          collections: {
            next: [{ eventTime: '2026-03-10', binType: 'Food' }],
          },
        },
      },
    });

    mockToIso.mockReturnValue('2026-03-10');
    mockNormalise.mockReturnValue('food');
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('brown');

    const result = await getHarrowSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'food',
        binColour: 'brown',
        binContent: undefined,
      },
    ]);
  });

  it('uses "Unknown" when normaliseBinName returns undefined', async () => {
    axiosGet.mockResolvedValue({
      data: {
        results: {
          collections: {
            next: [{ eventTime: '2026-03-10', binType: '???' }],
          },
        },
      },
    });

    mockToIso.mockReturnValue('2026-03-10');
    mockNormalise.mockReturnValue(undefined);
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('grey');

    const result = await getHarrowSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'Unknown',
        binColour: 'grey',
        binContent: undefined,
      },
    ]);
  });

  it('returns empty array when next is not an array', async () => {
    axiosGet.mockResolvedValue({
      data: {
        results: {
          collections: {
            next: null,
          },
        },
      },
    });

    const result = await getHarrowSchedule(uprn);

    expect(result).toEqual([]);
  });
});
