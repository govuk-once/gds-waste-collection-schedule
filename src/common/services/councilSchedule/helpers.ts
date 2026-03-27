import { BinColoursEnum } from '@common/models/binColoursEnum';

const colourAliases: Record<string, string> = {
  grey: 'silver',
};

export function toIso(value?: string) {
  if (!value) return new Date().toISOString().split('T')[0];
  if (value.includes('T')) return value.split('T')[0];
  if (value.includes('/')) return fromUkDate(value);
  return value;
}

export function fromUkDate(d?: string) {
  if (!d) return new Date().toISOString().split('T')[0];
  const [day, month, year] = d.split('/');
  return `${year}-${month}-${day}`;
}

export function extractColour(text?: string) {
  if (!text) return undefined;

  const lower = text.toLowerCase();

  // Normalise known aliases
  for (const [alias, canonical] of Object.entries(colourAliases)) {
    if (lower.includes(alias)) {
      return canonical;
    }
  }

  // Standard enum-based detection
  for (const colour of Object.values(BinColoursEnum)) {
    if (lower.includes(colour.toLowerCase())) {
      return colour.toLowerCase();
    }
  }

  return undefined;
}

export function guessColour(binName?: string) {
  if (!binName) return undefined;
  const lower = binName.toLowerCase();

  for (const colour of Object.values(BinColoursEnum)) {
    if (lower.includes(colour.toLowerCase())) {
      return colour.toLowerCase();
    }
  }
  return undefined;
}

export function normaliseBinName(name?: string): string {
  if (!name) return '';

  // Extract bracket content
  const match = name.match(/\((.*?)\)/);
  if (match) {
    const inside = match[1].trim();
    return inside.charAt(0).toUpperCase() + inside.slice(1).toLowerCase();
  }

  // Otherwise normalise the whole name
  const cleaned = name.trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}
