import type { SpecialCardType } from '../types';

type TextDeckSection = 'main' | 'gr' | 'superDim';

interface ParsedEntry {
  index: number | null;
  order: number;
  name: string;
}

export interface ParsedTextDeck {
  name: string;
  cardNames: string[];
  grCardNames: string[];
  superDimCardNames: string[];
  specialCard: SpecialCardType;
}

const SLOT_NUMBER_RE = /(^|\s)\|?([1-9]|[1-5]\d|60)(?=\s|$)/g;

function toHalfWidthDigits(text: string): string {
  return text.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
}

function compact(text: string): string {
  return text.replace(/\s+/g, '');
}

function isNoiseLine(line: string): boolean {
  const value = compact(line);
  return (
    value === '' ||
    value === '有' ||
    value === '無' ||
    value === '有無' ||
    value === 'GR' ||
    value === '超GRゾーン有無' ||
    value === '超次元ゾーン有無'
  );
}

function detectSection(line: string): TextDeckSection | null {
  const value = compact(line);
  if (value.includes('超GRゾーン')) return 'gr';
  if (value.includes('超次元ゾーン')) return 'superDim';
  return null;
}

function detectSpecialCard(line: string): SpecialCardType | null {
  const value = compact(line);
  if (value.includes('滅亡の起源零無') || value.includes('零無有')) return 'zero';
  if (value.includes('ドルマゲドン') || value.includes('最終禁断')) return 'dolmagedon';
  if (
    (value.includes('FORBIDDENSTAR') || value.includes('世界最後の日') || value.includes('禁断')) &&
    !value.includes('有無')
  ) {
    return 'kindan';
  }
  return null;
}

function cleanCardName(raw: string): string {
  let name = raw
    .replace(/[｜|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  name = name.replace(/^(No\.?\s*)?\d+[\s.:．：、\t]+/, '').trim();

  // OCR text often adds a leading Japanese quote without the matching closer.
  if (name.startsWith('「') && !name.includes('」')) {
    name = name.slice(1).trim();
  }
  if (name.startsWith('『') && !name.includes('』')) {
    name = name.slice(1).trim();
  }

  if (isNoiseLine(name) || /^\d+$/.test(name)) return '';
  return name;
}

function parseIndexedEntries(line: string, nextOrder: () => number): ParsedEntry[] {
  const normalized = toHalfWidthDigits(line);
  const matches = [...normalized.matchAll(SLOT_NUMBER_RE)];
  if (matches.length === 0) return [];

  const entries: ParsedEntry[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[i + 1]?.index ?? normalized.length;
    const name = cleanCardName(normalized.slice(start, end));
    if (!name) continue;
    entries.push({
      index: Number(match[2]),
      order: nextOrder(),
      name,
    });
  }
  return entries;
}

function repeatEntries(name: string, count: number, nextOrder: () => number): ParsedEntry[] {
  return Array.from({ length: Math.max(1, Math.min(60, count)) }, () => ({
    index: null,
    order: nextOrder(),
    name,
  }));
}

function parseFreeformEntries(line: string, nextOrder: () => number): ParsedEntry[] {
  const cleaned = cleanCardName(toHalfWidthDigits(line));
  if (!cleaned) return [];

  const leadingCount = cleaned.match(/^(\d{1,2})\s*[xX×]\s+(.+)$/);
  if (leadingCount) {
    return repeatEntries(cleanCardName(leadingCount[2]), Number(leadingCount[1]), nextOrder);
  }

  const trailingCount = cleaned.match(/^(.+?)\s+[xX×]\s*(\d{1,2})$/);
  if (trailingCount) {
    return repeatEntries(cleanCardName(trailingCount[1]), Number(trailingCount[2]), nextOrder);
  }

  return [{ index: null, order: nextOrder(), name: cleaned }];
}

function namesFromEntries(entries: ParsedEntry[]): string[] {
  return [...entries]
    .sort((a, b) => {
      if (a.index !== null && b.index !== null) return a.index - b.index || a.order - b.order;
      if (a.index !== null) return -1;
      if (b.index !== null) return 1;
      return a.order - b.order;
    })
    .map((entry) => entry.name);
}

export function parseDeckText(text: string, fallbackName = '新しいデッキ'): ParsedTextDeck {
  const entries: Record<TextDeckSection, ParsedEntry[]> = {
    main: [],
    gr: [],
    superDim: [],
  };
  let section: TextDeckSection = 'main';
  let specialCard: SpecialCardType = 'none';
  let order = 0;
  const nextOrder = () => order++;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || isNoiseLine(line)) continue;

    const detectedSpecial = detectSpecialCard(line);
    if (detectedSpecial) {
      specialCard = detectedSpecial;
      continue;
    }

    const detectedSection = detectSection(line);
    if (detectedSection) {
      section = detectedSection;
      continue;
    }

    const indexed = parseIndexedEntries(line, nextOrder);
    const parsed = indexed.length > 0 ? indexed : parseFreeformEntries(line, nextOrder);
    entries[section].push(...parsed);
  }

  return {
    name: fallbackName.trim() || '新しいデッキ',
    cardNames: namesFromEntries(entries.main),
    grCardNames: namesFromEntries(entries.gr),
    superDimCardNames: namesFromEntries(entries.superDim),
    specialCard,
  };
}
