/* eslint-disable @typescript-eslint/unbound-method */
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractColour, guessColour, normaliseBinName, toIso } from '../helpers';
import { getRushmoorSchedule } from './';

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

describe('getRushmoorSchedule', () => {
  const uprn = '12345';
  const url = `https://test?selectedAddress=${uprn}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls axios with the correct URL', async () => {
    axiosGet.mockResolvedValue({ data: {} });

    await getRushmoorSchedule(uprn);

    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when NextCollection is missing', async () => {
    axiosGet.mockResolvedValue({ data: {} });

    const result = await getRushmoorSchedule(uprn);

    expect(result).toEqual([]);
  });

  it('maps all bins with valid dates into schedule entries', async () => {
    axiosGet.mockResolvedValue({
      data: {
        NextCollection: {
          RefuseCollectionBinDate: '2026-03-10',
          RecyclingCollectionDate: '2026-03-11',
          GardenWasteCollectionDate: '2026-03-12',
          FoodWasteCollectionDate: '2026-03-13',
        },
      },
    });

    mockToIso.mockImplementation((d: string) => d);
    mockNormalise.mockImplementation((name: string) => name.toLowerCase());
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('grey');

    const result = await getRushmoorSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'refuse',
        binColour: 'grey',
        binContent: undefined,
      },
      {
        date: '2026-03-11',
        binName: 'recycling',
        binColour: 'grey',
        binContent: undefined,
      },
      {
        date: '2026-03-12',
        binName: 'garden waste',
        binColour: 'grey',
        binContent: undefined,
      },
      {
        date: '2026-03-13',
        binName: 'food waste',
        binColour: 'grey',
        binContent: undefined,
      },
    ]);
  });

  it('skips bins with no date', async () => {
    axiosGet.mockResolvedValue({
      data: {
        NextCollection: {
          RefuseCollectionBinDate: null,
          RecyclingCollectionDate: '2026-03-11',
          GardenWasteCollectionDate: undefined,
          FoodWasteCollectionDate: '2026-03-13',
        },
      },
    });

    mockToIso.mockImplementation((d: string) => d);
    mockNormalise.mockImplementation((name: string) => name.toLowerCase());
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('grey');

    const result = await getRushmoorSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-11',
        binName: 'recycling',
        binColour: 'grey',
        binContent: undefined,
      },
      {
        date: '2026-03-13',
        binName: 'food waste',
        binColour: 'grey',
        binContent: undefined,
      },
    ]);
  });

  it('applies extractColour first, then falls back to guessColour', async () => {
    axiosGet.mockResolvedValue({
      data: {
        NextCollection: {
          RefuseCollectionBinDate: '2026-03-10',
        },
      },
    });

    mockToIso.mockReturnValue('2026-03-10');
    mockNormalise.mockReturnValue('refuse');
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('black');

    const result = await getRushmoorSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'refuse',
        binColour: 'black',
        binContent: undefined,
      },
    ]);
  });

  it('handles mixed valid and invalid dates correctly', async () => {
    axiosGet.mockResolvedValue({
      data: {
        NextCollection: {
          RefuseCollectionBinDate: '2026-03-10',
          RecyclingCollectionDate: null,
          GardenWasteCollectionDate: 'not-a-date',
          FoodWasteCollectionDate: '2026-03-13',
        },
      },
    });

    mockToIso.mockImplementation((d: string) => (d === 'not-a-date' ? undefined : d));
    mockNormalise.mockImplementation((name: string) => name.toLowerCase());
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('grey');

    const result = await getRushmoorSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'refuse',
        binColour: 'grey',
        binContent: undefined,
      },
      {
        date: undefined,
        binName: 'garden waste',
        binColour: 'grey',
        binContent: undefined,
      },
      {
        date: '2026-03-13',
        binName: 'food waste',
        binColour: 'grey',
        binContent: undefined,
      },
    ]);
  });
});
