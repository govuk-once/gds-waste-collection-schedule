/* eslint-disable @typescript-eslint/unbound-method */
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractColour, guessColour, normaliseBinName, toIso } from '../helpers';
import { getHDCSchedule } from './';

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

describe('getHDCSchedule', () => {
  const uprn = '12345';
  const url = `https://test/search/${uprn}?authority=HDC&take=20`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls axios with the correct URL', async () => {
    axiosGet.mockResolvedValue({ data: {} });

    await getHDCSchedule(uprn);

    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when collections is missing', async () => {
    axiosGet.mockResolvedValue({ data: {} });

    const result = await getHDCSchedule(uprn);

    expect(result).toEqual([]);
  });

  it('returns empty array when collections is not an array', async () => {
    axiosGet.mockResolvedValue({ data: { collections: {} } });

    const result = await getHDCSchedule(uprn);

    expect(result).toEqual([]);
  });

  it('maps each roundType into a separate schedule entry', async () => {
    axiosGet.mockResolvedValue({
      data: {
        collections: [
          {
            date: '2026-03-10',
            roundTypes: ['Recycling', 'General Waste'],
          },
        ],
      },
    });

    mockToIso.mockReturnValue('2026-03-10');
    mockNormalise.mockImplementation((t: string) => t.toLowerCase());
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('grey');

    const result = await getHDCSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'recycling',
        binColour: 'grey',
        binContent: undefined,
      },
      {
        date: '2026-03-10',
        binName: 'general waste',
        binColour: 'grey',
        binContent: undefined,
      },
    ]);
  });

  it('skips entries with no roundTypes', async () => {
    axiosGet.mockResolvedValue({
      data: {
        collections: [{ date: '2026-03-10', roundTypes: [] }, { date: '2026-03-11' }],
      },
    });

    mockToIso.mockReturnValue('2026-03-10');

    const result = await getHDCSchedule(uprn);

    expect(result).toEqual([]);
  });

  it('applies extractColour first, then falls back to guessColour', async () => {
    axiosGet.mockResolvedValue({
      data: {
        collections: [
          {
            date: '2026-03-10',
            roundTypes: ['Garden'],
          },
        ],
      },
    });

    mockToIso.mockReturnValue('2026-03-10');
    mockNormalise.mockReturnValue('garden');
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('brown');

    const result = await getHDCSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'garden',
        binColour: 'brown',
        binContent: undefined,
      },
    ]);
  });

  it('handles multiple collection entries with multiple roundTypes', async () => {
    axiosGet.mockResolvedValue({
      data: {
        collections: [
          {
            date: '2026-03-10',
            roundTypes: ['Recycling'],
          },
          {
            date: '2026-03-11',
            roundTypes: ['Food', 'General Waste'],
          },
        ],
      },
    });

    mockToIso.mockImplementation((d: string) => d);
    mockNormalise.mockImplementation((t: string) => t.toLowerCase());
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('grey');

    const result = await getHDCSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'recycling',
        binColour: 'grey',
        binContent: undefined,
      },
      {
        date: '2026-03-11',
        binName: 'food',
        binColour: 'grey',
        binContent: undefined,
      },
      {
        date: '2026-03-11',
        binName: 'general waste',
        binColour: 'grey',
        binContent: undefined,
      },
    ]);
  });
});
