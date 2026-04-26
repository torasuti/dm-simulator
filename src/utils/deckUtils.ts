import type { Card, DeckDefinition } from '../types';
import { DEFAULT_ZONE_CONFIGS, DEFAULT_CARD_MENU_CONFIG } from '../constants/zones';

export function createCard(name: string): Card {
  return { id: crypto.randomUUID(), name, tapped: false };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createNewDeck(name: string): DeckDefinition {
  const configs = DEFAULT_ZONE_CONFIGS.map((c) => ({ ...c }));
  return {
    id: crypto.randomUUID(),
    name,
    cards: [],
    macros: [],
    zoneConfigs: configs,
    zoneConfigPresets: [{ name: '設定1', configs: configs.map((c) => ({ ...c })) }],
    cardMenuConfig: { ...DEFAULT_CARD_MENU_CONFIG, destinations: [...DEFAULT_CARD_MENU_CONFIG.destinations] },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function cloneDeck(deck: DeckDefinition): DeckDefinition {
  return {
    ...deck,
    id: crypto.randomUUID(),
    name: `${deck.name} (コピー)`,
    cards: deck.cards.map((c) => ({ ...c, id: crypto.randomUUID() })),
    macros: deck.macros.map((m) => ({
      ...m,
      id: crypto.randomUUID(),
      steps: m.steps.map((s) => ({ ...s })),
    })),
    zoneConfigs: deck.zoneConfigs.map((z) => ({ ...z })),
    zoneConfigPresets: (deck.zoneConfigPresets ?? [{ name: '設定1', configs: deck.zoneConfigs }]).map((p) => ({
      name: p.name,
      configs: p.configs.map((z) => ({ ...z })),
    })),
    cardMenuConfig: { ...deck.cardMenuConfig, destinations: [...deck.cardMenuConfig.destinations] },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
