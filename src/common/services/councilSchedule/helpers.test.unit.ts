import { BinColoursEnum } from '@common/models/binColoursEnum';
import { describe, expect, it } from 'vitest';
import { extractColour, fromUkDate, guessColour, normaliseBinName, toIso } from './helpers';

describe('toIso', () => {
  it('returns today when value is undefined', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(toIso()).toBe(today);
  });

  it('strips time component when value contains T', () => {
    expect(toIso('2026-03-10T12:00:00')).toBe('2026-03-10');
  });

  it('parses UK date format dd/mm/yyyy', () => {
    expect(toIso('10/03/2026')).toBe('2026-03-10');
  });

  it('returns value unchanged when already ISO without T', () => {
    expect(toIso('2026-03-10')).toBe('2026-03-10');
  });
});

describe('fromUkDate', () => {
  it('returns today when input is undefined', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(fromUkDate()).toBe(today);
  });

  it('converts dd/mm/yyyy to yyyy-mm-dd', () => {
    expect(fromUkDate('10/03/2026')).toBe('2026-03-10');
  });
});

describe('extractColour', () => {
  it('returns undefined when text is missing', () => {
    expect(extractColour()).toBeUndefined();
  });

  it('detects alias colours (grey → silver)', () => {
    expect(extractColour('Grey bin')).toBe('silver');
  });

  it('detects colours from BinColoursEnum', () => {
    const colour = Object.values(BinColoursEnum)[0];
    const lower = colour.toLowerCase();
    expect(extractColour(`This is a ${lower} bin`)).toBe(lower);
  });

  it('returns undefined when no colour matches', () => {
    expect(extractColour('mystery bin')).toBeUndefined();
  });
});

describe('guessColour', () => {
  it('returns undefined when binName is missing', () => {
    expect(guessColour()).toBeUndefined();
  });

  it('detects colours from BinColoursEnum', () => {
    const colour = Object.values(BinColoursEnum)[0];
    const lower = colour.toLowerCase();
    expect(guessColour(`my ${lower} bin`)).toBe(lower);
  });

  it('returns undefined when no colour matches', () => {
    expect(guessColour('unknown bin')).toBeUndefined();
  });
});

describe('normaliseBinName', () => {
  it('capitalises first letter and lowercases the rest', () => {
    expect(normaliseBinName('RECYCLING')).toBe('Recycling');
    expect(normaliseBinName('gEnErAl')).toBe('General');
  });
});
