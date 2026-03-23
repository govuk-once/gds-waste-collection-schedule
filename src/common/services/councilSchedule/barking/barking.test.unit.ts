/* eslint-disable @typescript-eslint/unbound-method */
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractColour, guessColour, normaliseBinName } from '../helpers';
import { getBarkingSchedule } from './';

// Lint‑safe mock type
type MockFn<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> = ReturnType<typeof vi.fn<T>>;

vi.mock('axios');
vi.mock('../helpers', () => ({
  extractColour: vi.fn(),
  guessColour: vi.fn(),
  normaliseBinName: vi.fn(),
}));

// Safe typed mocks
const axiosGet = axios.get as MockFn;
const mockExtract = extractColour as MockFn;
const mockGuess = guessColour as MockFn;
const mockNormalise = normaliseBinName as MockFn;

describe('getBarkingSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses nextcollection into a schedule entry', async () => {
    axiosGet.mockResolvedValue({
      data: {
        results: [
          {
            bin_name: 'Recycling',
            nextcollection: 'Tuesday 10 March 2026',
            futurecollections: [],
          },
        ],
      },
    });

    mockNormalise.mockReturnValue('recycling');
    mockExtract.mockReturnValue('green');
    mockGuess.mockReturnValue('green');

    const result = await getBarkingSchedule('12345');

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'recycling',
        binColour: 'green',
        binContent: undefined,
      },
    ]);
  });

  it('parses futurecollections when nextcollection is missing', async () => {
    axiosGet.mockResolvedValue({
      data: {
        results: [
          {
            bin_name: 'General Waste',
            nextcollection: undefined,
            futurecollections: ['Wednesday 11 March 2026'],
          },
        ],
      },
    });

    mockNormalise.mockReturnValue('general waste');
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('black');

    const result = await getBarkingSchedule('12345');

    expect(result).toEqual([
      {
        date: '2026-03-11',
        binName: 'general waste',
        binColour: 'black',
        binContent: undefined,
      },
    ]);
  });

  it('skips invalid dates in nextcollection and futurecollections', async () => {
    axiosGet.mockResolvedValue({
      data: {
        results: [
          {
            bin_name: 'Food',
            nextcollection: 'Not a real date',
            futurecollections: ['Bad date', 'Friday 13 March 2026'],
          },
        ],
      },
    });

    mockNormalise.mockReturnValue('food');
    mockExtract.mockReturnValue(undefined);
    mockGuess.mockReturnValue('brown');

    const result = await getBarkingSchedule('12345');

    expect(result).toEqual([
      {
        date: '2026-03-13',
        binName: 'food',
        binColour: 'brown',
        binContent: undefined,
      },
    ]);
  });

  it('returns empty array when results is missing', async () => {
    axiosGet.mockResolvedValue({ data: {} });

    const result = await getBarkingSchedule('12345');

    expect(result).toEqual([]);
  });

  it('handles missing futurecollections gracefully', async () => {
    axiosGet.mockResolvedValue({
      data: {
        results: [
          {
            bin_name: 'Garden',
            nextcollection: 'Monday 9 March 2026',
          },
        ],
      },
    });

    mockNormalise.mockReturnValue('garden');
    mockExtract.mockReturnValue('brown');
    mockGuess.mockReturnValue('brown');

    const result = await getBarkingSchedule('12345');

    expect(result).toEqual([
      {
        date: '2026-03-09',
        binName: 'garden',
        binColour: 'brown',
        binContent: undefined,
      },
    ]);
  });
});
