/* eslint-disable @typescript-eslint/unbound-method */
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractColour, normaliseBinName, toIso } from '../helpers';
import { getYorkSchedule } from './';

type MockFn<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> = ReturnType<typeof vi.fn<T>>;

// Mock external modules
vi.mock('axios');
vi.mock('../helpers', () => ({
  extractColour: vi.fn(),
  normaliseBinName: vi.fn(),
  toIso: vi.fn(),
}));

// Typed mock references
const axiosGet = axios.get as MockFn;
const mockExtract = extractColour as MockFn;
const mockNormalise = normaliseBinName as MockFn;
const mockToIso = toIso as MockFn;

describe('getYorkSchedule', () => {
  const uprn = '12345';
  const url = `https://test/${uprn}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls axios with the correct URL', async () => {
    axiosGet.mockResolvedValue({ data: {} });

    await getYorkSchedule(uprn);

    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when services is missing', async () => {
    axiosGet.mockResolvedValue({ data: {} });

    const result = await getYorkSchedule(uprn);

    expect(result).toEqual([]);
  });

  it('returns empty array when services is not an array', async () => {
    axiosGet.mockResolvedValue({ data: { services: {} } });

    const result = await getYorkSchedule(uprn);

    expect(result).toEqual([]);
  });

  it('maps each service item into a schedule entry', async () => {
    axiosGet.mockResolvedValue({
      data: {
        services: [
          {
            nextCollection: '2026-03-10',
            service: 'Recycling',
            binDescription: 'Green bin',
            wasteType: 'Dry Recycling',
          },
          {
            nextCollection: '2026-03-11',
            service: 'Refuse',
            binDescription: 'Black bin',
            wasteType: 'General Waste',
          },
        ],
      },
    });

    mockToIso.mockImplementation((d: string) => d);
    mockNormalise.mockImplementation((s: string) => s.toLowerCase());
    mockExtract.mockImplementation((desc: string) => (desc.includes('Green') ? 'green' : 'black'));

    const result = await getYorkSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'recycling',
        binColour: 'green',
        binContent: 'Dry Recycling',
      },
      {
        date: '2026-03-11',
        binName: 'refuse',
        binColour: 'black',
        binContent: 'General Waste',
      },
    ]);
  });

  it('uses "Unknown" when normaliseBinName returns undefined', async () => {
    axiosGet.mockResolvedValue({
      data: {
        services: [
          {
            nextCollection: '2026-03-10',
            service: undefined,
            binDescription: 'Blue bin',
            wasteType: 'Paper',
          },
        ],
      },
    });

    mockToIso.mockReturnValue('2026-03-10');
    mockNormalise.mockReturnValue(undefined);
    mockExtract.mockReturnValue('blue');

    const result = await getYorkSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'Unknown',
        binColour: 'blue',
        binContent: 'Paper',
      },
    ]);
  });

  it('handles missing binDescription and wasteType gracefully', async () => {
    axiosGet.mockResolvedValue({
      data: {
        services: [
          {
            nextCollection: '2026-03-10',
            service: 'Garden Waste',
            binDescription: undefined,
            wasteType: undefined,
          },
        ],
      },
    });

    mockToIso.mockReturnValue('2026-03-10');
    mockNormalise.mockReturnValue('garden waste');
    mockExtract.mockReturnValue(undefined);

    const result = await getYorkSchedule(uprn);

    expect(result).toEqual([
      {
        date: '2026-03-10',
        binName: 'garden waste',
        binColour: undefined,
        binContent: undefined,
      },
    ]);
  });

  it('passes undefined to toIso when nextCollection is missing', async () => {
    axiosGet.mockResolvedValue({
      data: {
        services: [
          {
            nextCollection: null,
            service: 'Recycling',
            binDescription: 'Green bin',
          },
        ],
      },
    });

    mockToIso.mockReturnValue(undefined);
    mockNormalise.mockReturnValue('recycling');
    mockExtract.mockReturnValue('green');

    const result = await getYorkSchedule(uprn);

    expect(mockToIso).toHaveBeenCalledWith(undefined);
    expect(result).toEqual([
      {
        date: undefined,
        binName: 'recycling',
        binColour: 'green',
        binContent: undefined,
      },
    ]);
  });
});
