import type { DeckDefinition } from '../types';

function disabled(): never {
  throw new Error('Cloud storage is disabled in the public build');
}

export async function loadDecksCloud(): Promise<DeckDefinition[]> {
  disabled();
}

export async function loadDeckCloud(): Promise<DeckDefinition | null> {
  disabled();
}

export async function saveDeckCloud(): Promise<void> {
  disabled();
}

export async function deleteDeckCloud(): Promise<void> {
  disabled();
}

export async function shareDeck(): Promise<string> {
  disabled();
}

export async function loadSharedDeck(): Promise<DeckDefinition | null> {
  disabled();
}
