import type { DeckDefinition, ZoneConfig, MacroAction, AbilityStockDef } from '../types';
import { DEFAULT_ZONE_CONFIGS, DEFAULT_CARD_MENU_CONFIG } from '../constants/zones';

const DECKS_KEY = 'dm_decks';

function migrateZoneConfig(cfg: ZoneConfig): ZoneConfig {
  const def = DEFAULT_ZONE_CONFIGS.find((d) => d.zoneId === cfg.zoneId);
  return {
    ...cfg,
    layoutRow: cfg.layoutRow ?? def?.layoutRow ?? 1,
    layoutCol: cfg.layoutCol ?? def?.layoutCol ?? 1,
    colSpan: cfg.colSpan ?? def?.colSpan ?? 1,
  };
}

function migrateMacroStep(step: MacroAction): MacroAction {
  if (step.type === 'PICK_FROM_ZONE' || step.type === 'PICK_FROM_ZONE_LOOP') {
    const s = step as MacroAction & { source?: string };
    if (!step.sources && s.source) {
      return { ...step, sources: [s.source as import('../types').ZoneId] } as MacroAction;
    }
  }
  return step;
}

function migrateAbilityStock(s: AbilityStockDef): AbilityStockDef {
  const old = s as AbilityStockDef & { initialValue?: number };
  if (old.initialValue !== undefined && !s.stocks) {
    return {
      id: s.id,
      name: '',
      layoutRow: s.layoutRow,
      layoutCol: s.layoutCol,
      colSpan: s.colSpan,
      stocks: [{ id: s.id, name: old.name, initialValue: old.initialValue }],
    };
  }
  return s;
}

function migrateDeck(deck: DeckDefinition): DeckDefinition {
  const baseMenu = deck.cardMenuConfig ?? DEFAULT_CARD_MENU_CONFIG;
  return {
    ...deck,
    zoneConfigs: deck.zoneConfigs.map(migrateZoneConfig),
    cardMenuConfig: {
      stackActions: [],
      ...baseMenu,
      destinations: baseMenu.destinations ?? [...DEFAULT_CARD_MENU_CONFIG.destinations],
    },
    macros: deck.macros.map((m) => ({ ...m, steps: m.steps.map(migrateMacroStep) })),
    abilityStocks: (deck.abilityStocks ?? []).map(migrateAbilityStock),
    grCards: deck.grCards ?? [],
    superDimCards: deck.superDimCards ?? [],
  };
}

export function loadDecks(): DeckDefinition[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as DeckDefinition[]).map(migrateDeck);
  } catch {
    return [];
  }
}

export function saveDecks(decks: DeckDefinition[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function loadDeck(id: string): DeckDefinition | null {
  return loadDecks().find((d) => d.id === id) ?? null;
}

export function saveDeck(deck: DeckDefinition): void {
  const decks = loadDecks();
  const idx = decks.findIndex((d) => d.id === deck.id);
  if (idx >= 0) {
    decks[idx] = deck;
  } else {
    decks.push(deck);
  }
  saveDecks(decks);
}

export function deleteDeck(id: string): void {
  saveDecks(loadDecks().filter((d) => d.id !== id));
}
