import type { SpecialCardType } from '../types';

export async function fetchDeckFromUrl(): Promise<{
  deckName: string;
  cardNames: string[];
  grCardNames: string[];
  superDimCardNames: string[];
  specialCard: SpecialCardType;
}> {
  throw new Error('URLインポートは公開版では無効です');
}
