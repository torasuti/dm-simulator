import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  GameState, BoardState, Card, ZoneId, DeckDefinition,
  MacroAction, PendingReveal, PendingPick, PendingEvolve, PendingMultiEvolve, PendingStack, PendingMultiStack, MacroDestination, ZoneConfigPreset, AbilityStockDef, SpecialCardType,
} from '../types';
import { shuffle } from '../utils/deckUtils';
import { ALL_ZONE_IDS, DEFAULT_CARD_MENU_CONFIG } from '../constants/zones';

const MAX_HISTORY = 20;

function emptyBoard(): BoardState {
  const board = {} as BoardState;
  for (const z of ALL_ZONE_IDS) board[z] = [];
  return board;
}

function snapshot(board: BoardState): BoardState {
  return Object.fromEntries(
    Object.entries(board).map(([k, v]) => [k, [...v]])
  ) as BoardState;
}

function applyDestination(board: BoardState, card: Card, dest: MacroDestination): void {
  if (card.isGR && dest !== 'battleZone' && dest !== 'grZoneBottom') {
    board.grZone = [...board.grZone, { ...card, isGR: false }];
    return;
  }
  if (card.isSuperDim && dest !== 'battleZone' && dest !== 'superDimZone') {
    board.superDimZone = [...board.superDimZone, { ...card, isSuperDim: false }];
    return;
  }
  if (card.stack && card.stack.length > 0 && dest !== 'battleZone' && dest !== 'shieldZone') {
    for (const c of [{ ...card, stack: undefined }, ...card.stack]) applyDestination(board, c, dest);
    return;
  }
  if (dest === 'deckTop' || dest === 'deckTopShuffle' || dest === 'deckTopOrder') {
    board.deck = [card, ...board.deck];
  } else if (dest === 'deckBottom' || dest === 'deckBottomShuffle' || dest === 'deckBottomOrder') {
    board.deck = [...board.deck, card];
  } else if (dest === 'grZoneBottom') {
    board.grZone = [...board.grZone, { ...card, isGR: false }];
  } else if (dest === 'superDimZone') {
    board.superDimZone = [...board.superDimZone, { ...card, isSuperDim: false }];
  } else {
    board[dest] = [...board[dest], card];
  }
}

function applyDestinationMultiple(board: BoardState, cards: Card[], dest: MacroDestination): void {
  if (dest === 'deckTop' || dest === 'deckTopShuffle' || dest === 'deckTopOrder') {
    board.deck = [...cards, ...board.deck];
  } else if (dest === 'deckBottom' || dest === 'deckBottomShuffle' || dest === 'deckBottomOrder') {
    board.deck = [...board.deck, ...cards];
  } else {
    board[dest] = [...board[dest], ...cards];
  }
}

export type GameAction =
  | { type: 'INIT_GAME'; deck: DeckDefinition }
  | { type: 'DRAW'; n: number }
  | { type: 'MOVE_TOP_TO_ZONE'; n: number; from: ZoneId; to: ZoneId | MacroDestination }
  | { type: 'MOVE_CARD'; cardId: string; from: ZoneId; to: ZoneId | MacroDestination }
  | { type: 'TAP_CARD'; zoneId: ZoneId; cardId: string }
  | { type: 'UNTAP_ALL'; zoneId: ZoneId }
  | { type: 'SHUFFLE_ZONE'; zoneId: ZoneId }
  | { type: 'BEGIN_REVEAL'; cards: Card[]; destinations: MacroDestination[]; remainingSteps: MacroAction[] }
  | { type: 'CLICK_REVEALED_CARD'; cardId: string }
  | { type: 'CONFIRM_REVEAL' }
  | { type: 'CANCEL_REVEAL' }
  | { type: 'BEGIN_PICK'; sources: ZoneId[]; destination: MacroDestination; maxCount: number | null; remainingSteps: MacroAction[] }
  | { type: 'SET_PICK_SOURCE'; source: ZoneId }
  | { type: 'TOGGLE_PICK_CARD'; cardId: string }
  | { type: 'CONFIRM_PICK' }
  | { type: 'CONFIRM_PICK_ORDERED'; cardIds: string[] }
  | { type: 'CANCEL_PICK' }
  | { type: 'SET_ZONE_PRESET'; index: number }
  | { type: 'MINIMIZE_OVERLAY' }
  | { type: 'RESTORE_OVERLAY' }
  | { type: 'BEGIN_EVOLVE'; baseSource: ZoneId; evolutionSource: ZoneId; destination: MacroDestination; remainingSteps: MacroAction[] }
  | { type: 'SELECT_EVOLVE_BASE'; cardId: string }
  | { type: 'SELECT_EVOLVE_EVOLUTION'; cardId: string }
  | { type: 'CANCEL_EVOLVE' }
  | { type: 'BEGIN_MULTI_EVOLVE'; evolutionSources: ZoneId[]; baseSources: ZoneId[]; destination: MacroDestination; baseCount: number | null; remainingSteps: MacroAction[] }
  | { type: 'SELECT_MULTI_EVOLVE_CARD'; cardId: string }
  | { type: 'SET_MULTI_EVOLVE_EVO_SOURCE'; source: ZoneId }
  | { type: 'SET_MULTI_EVOLVE_BASE_SOURCE'; source: ZoneId }
  | { type: 'TOGGLE_MULTI_EVOLVE_BASE'; cardId: string; zoneId: ZoneId }
  | { type: 'CONFIRM_MULTI_EVOLVE' }
  | { type: 'CANCEL_MULTI_EVOLVE' }
  | { type: 'CHANGE_ABILITY_STOCK'; id: string; delta: number }
  | { type: 'SET_ABILITY_STOCK'; id: string; value: number }
  | { type: 'GR_SUMMON' }
  | { type: 'BEGIN_STACK'; mode: 'top' | 'bottom'; sourceCardId: string; sourceZone: ZoneId }
  | { type: 'COMPLETE_STACK'; targetCardId: string; targetZone: ZoneId }
  | { type: 'CANCEL_STACK' }
  | { type: 'BEGIN_MULTI_STACK'; topCardId: string; topCardZone: ZoneId; availableDestinations: MacroDestination[] }
  | { type: 'SET_MULTI_STACK_SOURCE'; source: ZoneId }
  | { type: 'TOGGLE_MULTI_STACK_CARD'; cardId: string; zoneId: ZoneId }
  | { type: 'SET_MULTI_STACK_DEST'; destination: MacroDestination }
  | { type: 'CONFIRM_MULTI_STACK' }
  | { type: 'CANCEL_MULTI_STACK' }
  | { type: 'CHANGE_MACRO_COUNTER'; macroId: string; delta: number }
  | { type: 'SET_MACRO_COUNTER'; macroId: string; value: number }
  | { type: 'TOGGLE_ZONE_VISIBLE'; zoneId: ZoneId }
  | { type: 'KINDAN_PEEL' }
  | { type: 'DOLMAGEDON_DESTROY'; slot: number }
  | { type: 'ZERO_ACTIVATE'; ability: 'fukkatsu' | 'hakai' | 'graveyard' | 'hand' }
  | { type: 'UNDO' }
  | { type: 'RESET_GAME' };

const initialState: GameState = {
  deckId: '',
  deckName: '',
  board: emptyBoard(),
  zoneConfigs: [],
  zoneConfigPresets: [],
  activePresetIndex: 0,
  macros: [],
  cardMenuConfig: { ...DEFAULT_CARD_MENU_CONFIG, destinations: [...DEFAULT_CARD_MENU_CONFIG.destinations] },
  abilityStocks: [],
  abilityStockValues: {},
  history: [],
  pendingReveal: null,
  pendingPick: null,
  pendingEvolve: null,
  pendingMultiEvolve: null,
  pendingStack: null,
  pendingMultiStack: null,
  pendingMinimized: false,
  macroCounterValues: {},
  specialCard: 'none',
  kindanCards: [],
  dolmagedonSlots: [null, null, null, null],
  zeroUsed: { fukkatsu: false, hakai: false, graveyard: false, hand: false },
};

function pushHistory(state: GameState): GameState {
  const history = [...state.history, snapshot(state.board)].slice(-MAX_HISTORY);
  return { ...state, history };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': {
      const { deck } = action;
      const shuffled = shuffle(deck.cards.map((c) => ({ ...c, id: crypto.randomUUID(), tapped: false })));
      const board = emptyBoard();
      board.shieldZone = shuffled.slice(0, 5);
      board.hand = shuffled.slice(5, 10);
      board.deck = shuffled.slice(10);

      const specialCard: SpecialCardType = deck.specialCard ?? 'none';
      let kindanCards: Card[] = [];
      let dolmagedonSlots: (Card | null)[] = [null, null, null, null];
      const zeroUsed = { fukkatsu: false, hakai: false, graveyard: false, hand: false };
      if (specialCard === 'kindan') {
        kindanCards = board.deck.splice(0, 6);
      } else if (specialCard === 'dolmagedon') {
        dolmagedonSlots = [
          board.deck.splice(0, 1)[0] ?? null,
          board.deck.splice(0, 1)[0] ?? null,
          board.deck.splice(0, 1)[0] ?? null,
          board.deck.splice(0, 1)[0] ?? null,
        ];
      }

      const hasGR = (deck.grCards ?? []).length > 0;
      const hasSuperDim = (deck.superDimCards ?? []).length > 0;
      if (hasGR) {
        board.grZone = shuffle((deck.grCards ?? []).map((c) => ({ ...c, id: crypto.randomUUID(), tapped: false, isGR: false })));
      }
      if (hasSuperDim) {
        board.superDimZone = (deck.superDimCards ?? []).map((c) => ({ ...c, id: crypto.randomUUID(), tapped: false, isSuperDim: false }));
      }

      const presets: ZoneConfigPreset[] = (deck.zoneConfigPresets?.length
        ? deck.zoneConfigPresets.map((p) => ({ name: p.name, configs: p.configs.map((z) => ({ ...z })) }))
        : [{ name: '設定1', configs: deck.zoneConfigs.map((z) => ({ ...z })) }])
        .map((p) => ({
          ...p,
          configs: p.configs.map((z) => ({
            ...z,
            visible: z.visible,
          })),
        }));
      const abilityStocks: AbilityStockDef[] = (deck.abilityStocks ?? []).map((s) => ({ ...s, stocks: s.stocks.map((i) => ({ ...i })) }));
      const abilityStockValues: Record<string, number> = {};
      for (const group of abilityStocks) {
        for (const item of group.stocks) {
          abilityStockValues[item.id] = item.initialValue;
        }
      }
      const macroCounterValues: Record<string, number> = {};
      for (const macro of deck.macros) {
        if (macro.counter?.enabled) {
          macroCounterValues[macro.id] = macro.counter.initialValue;
        }
      }
      return {
        deckId: deck.id,
        deckName: deck.name,
        board,
        zoneConfigs: presets[0].configs.map((z) => ({ ...z })),
        zoneConfigPresets: presets,
        activePresetIndex: 0,
        macros: deck.macros.map((m) => ({ ...m })),
        cardMenuConfig: deck.cardMenuConfig
          ? { ...deck.cardMenuConfig, destinations: [...deck.cardMenuConfig.destinations] }
          : { ...DEFAULT_CARD_MENU_CONFIG, destinations: [...DEFAULT_CARD_MENU_CONFIG.destinations] },
        abilityStocks,
        abilityStockValues,
        history: [],
        pendingReveal: null,
        pendingPick: null,
        pendingEvolve: null,
        pendingMultiEvolve: null,
        pendingStack: null,
        pendingMultiStack: null,
        pendingMinimized: false,
        macroCounterValues,
        specialCard,
        kindanCards,
        dolmagedonSlots,
        zeroUsed,
      };
    }

    case 'DRAW': {
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const drawn = board.deck.splice(0, action.n);
      board.hand = [...board.hand, ...drawn];
      return { ...s, board };
    }

    case 'MOVE_TOP_TO_ZONE': {
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const moved = board[action.from].splice(0, action.n);
      if (action.to === 'deckTop' || action.to === 'deckBottom') {
        applyDestinationMultiple(board, moved, action.to as MacroDestination);
      } else {
        board[action.to as ZoneId] = [...board[action.to as ZoneId], ...moved];
      }
      return { ...s, board };
    }

    case 'MOVE_CARD': {
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const from = board[action.from];
      const idx = from.findIndex((c) => c.id === action.cardId);
      if (idx === -1) return state;
      let [card] = from.splice(idx, 1);
      if (action.from === 'grZone') card = { ...card, isGR: true };
      if (action.from === 'superDimZone') card = { ...card, isSuperDim: true };
      if (action.to === 'deckTop' || action.to === 'deckBottom' || action.to === 'grZoneBottom' || action.to === 'superDimZone') {
        applyDestination(board, card, action.to as MacroDestination);
      } else {
        const toZone = action.to as ZoneId;
        const cardsToPlace = (card.stack && card.stack.length > 0 && toZone !== 'battleZone' && toZone !== 'shieldZone')
          ? [{ ...card, stack: undefined }, ...card.stack]
          : [card];
        for (let c of cardsToPlace) {
          if (c.isGR && toZone !== 'battleZone' && toZone !== 'grZone') {
            board.grZone = [...board.grZone, { ...c, isGR: false }];
          } else if (c.isSuperDim && toZone !== 'battleZone' && toZone !== 'superDimZone') {
            board.superDimZone = [...board.superDimZone, { ...c, isSuperDim: false }];
          } else {
            if (toZone === 'grZone') c = { ...c, isGR: false };
            if (toZone === 'superDimZone') c = { ...c, isSuperDim: false };
            board[toZone] = [...board[toZone], c];
          }
        }
      }
      return { ...s, board };
    }

    case 'GR_SUMMON': {
      if (state.board.grZone.length === 0) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const [topCard] = board.grZone.splice(0, 1);
      board.battleZone = [...board.battleZone, { ...topCard, isGR: true }];
      return { ...s, board };
    }

    case 'TAP_CARD': {
      const s = pushHistory(state);
      const board = snapshot(s.board);
      board[action.zoneId] = board[action.zoneId].map((c) =>
        c.id === action.cardId ? { ...c, tapped: !c.tapped } : c
      );
      return { ...s, board };
    }

    case 'UNTAP_ALL': {
      const s = pushHistory(state);
      const board = snapshot(s.board);
      board[action.zoneId] = board[action.zoneId].map((c) => ({ ...c, tapped: false }));
      return { ...s, board };
    }

    case 'SHUFFLE_ZONE': {
      const s = pushHistory(state);
      const board = snapshot(s.board);
      board[action.zoneId] = shuffle(board[action.zoneId]);
      return { ...s, board };
    }

    case 'BEGIN_REVEAL': {
      const pending: PendingReveal = {
        destinations: action.destinations,
        cards: action.cards,
        clickOrder: [],
        remainingSteps: action.remainingSteps,
      };
      return { ...state, pendingReveal: pending };
    }

    case 'CLICK_REVEALED_CARD': {
      if (!state.pendingReveal) return state;
      const { clickOrder } = state.pendingReveal;
      if (clickOrder.includes(action.cardId)) {
        return {
          ...state,
          pendingReveal: { ...state.pendingReveal, clickOrder: clickOrder.filter((id) => id !== action.cardId) },
        };
      }
      return {
        ...state,
        pendingReveal: { ...state.pendingReveal, clickOrder: [...clickOrder, action.cardId] },
      };
    }

    case 'CONFIRM_REVEAL': {
      if (!state.pendingReveal) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const { destinations, cards, clickOrder } = state.pendingReveal;
      const fallbackDest = destinations[destinations.length - 1];

      board.displayZone = board.displayZone.filter((c) => !cards.some((rc) => rc.id === c.id));

      clickOrder.forEach((cardId, i) => {
        const card = cards.find((c) => c.id === cardId);
        if (!card) return;
        applyDestination(board, card, destinations[i] ?? fallbackDest);
      });

      const remaining = cards.filter((c) => !clickOrder.includes(c.id));
      if (fallbackDest === 'deckTopShuffle') {
        board.deck = [...shuffle([...remaining]), ...board.deck];
      } else if (fallbackDest === 'deckBottomShuffle') {
        board.deck = [...board.deck, ...shuffle([...remaining])];
      } else {
        remaining.forEach((card) => applyDestination(board, card, fallbackDest));
      }

      return { ...s, board, pendingReveal: null, pendingMinimized: false };
    }

    case 'CANCEL_REVEAL': {
      if (!state.pendingReveal) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const { cards } = state.pendingReveal;
      board.displayZone = board.displayZone.filter((c) => !cards.some((rc) => rc.id === c.id));
      board.deck = [...cards, ...board.deck];
      return { ...s, board, pendingReveal: null, pendingMinimized: false };
    }

    case 'BEGIN_PICK': {
      const pending: PendingPick = {
        sessionId: crypto.randomUUID(),
        sources: action.sources,
        activeSource: action.sources[0],
        destination: action.destination,
        maxCount: action.maxCount,
        selectedIds: [],
        remainingSteps: action.remainingSteps,
      };
      return { ...state, pendingPick: pending };
    }

    case 'SET_PICK_SOURCE': {
      if (!state.pendingPick) return state;
      return { ...state, pendingPick: { ...state.pendingPick, activeSource: action.source } };
    }

    case 'TOGGLE_PICK_CARD': {
      if (!state.pendingPick) return state;
      const { selectedIds, maxCount, activeSource } = state.pendingPick;
      if (selectedIds.includes(action.cardId)) {
        return {
          ...state,
          pendingPick: { ...state.pendingPick, selectedIds: selectedIds.filter((id) => id !== action.cardId) },
        };
      }
      // ループモード（maxCount=null）は無制限、確定は1枚ずつ即時
      if (maxCount === null) {
        const s = pushHistory(state);
        const board = snapshot(s.board);
        const card = board[activeSource].find((c) => c.id === action.cardId);
        if (!card) return state;
        board[activeSource] = board[activeSource].filter((c) => c.id !== action.cardId);
        applyDestination(board, card, state.pendingPick.destination);
        return { ...s, board };
      }
      return {
        ...state,
        pendingPick: { ...state.pendingPick, selectedIds: [...selectedIds, action.cardId] },
      };
    }

    case 'CONFIRM_PICK': {
      if (!state.pendingPick) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const { destination, selectedIds } = state.pendingPick;

      for (const cardId of selectedIds) {
        for (const zoneId of ALL_ZONE_IDS) {
          const idx = board[zoneId].findIndex((c) => c.id === cardId);
          if (idx !== -1) {
            const [card] = board[zoneId].splice(idx, 1);
            applyDestination(board, card, destination);
            break;
          }
        }
      }

      return { ...s, board, pendingPick: null, pendingMinimized: false };
    }

    case 'CONFIRM_PICK_ORDERED': {
      if (!state.pendingPick) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const { destination } = s.pendingPick!;
      for (const cardId of action.cardIds) {
        for (const zoneId of ALL_ZONE_IDS) {
          const idx = board[zoneId].findIndex((c) => c.id === cardId);
          if (idx !== -1) {
            const [card] = board[zoneId].splice(idx, 1);
            applyDestination(board, card, destination);
            break;
          }
        }
      }
      return { ...s, board, pendingPick: null, pendingMinimized: false };
    }

    case 'CANCEL_PICK':
      return { ...state, pendingPick: null, pendingMinimized: false };

    case 'MINIMIZE_OVERLAY':
      return { ...state, pendingMinimized: true };

    case 'RESTORE_OVERLAY':
      return { ...state, pendingMinimized: false };

    case 'SET_ZONE_PRESET': {
      const preset = state.zoneConfigPresets[action.index];
      if (!preset) return state;
      return {
        ...state,
        zoneConfigs: preset.configs.map((z) => ({ ...z })),
        activePresetIndex: action.index,
      };
    }

    case 'BEGIN_EVOLVE': {
      const pending: PendingEvolve = {
        phase: 'selectBase',
        baseSource: action.baseSource,
        evolutionSource: action.evolutionSource,
        destination: action.destination,
        baseCardId: null,
        remainingSteps: action.remainingSteps,
      };
      return { ...state, pendingEvolve: pending };
    }

    case 'SELECT_EVOLVE_BASE': {
      if (!state.pendingEvolve) return state;
      return {
        ...state,
        pendingEvolve: { ...state.pendingEvolve, phase: 'selectEvolution', baseCardId: action.cardId },
      };
    }

    case 'SELECT_EVOLVE_EVOLUTION': {
      if (!state.pendingEvolve || !state.pendingEvolve.baseCardId) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const { baseSource, evolutionSource, destination, baseCardId } = s.pendingEvolve!;

      const baseIdx = board[baseSource].findIndex((c) => c.id === baseCardId);
      if (baseIdx === -1) return state;
      const [baseCard] = board[baseSource].splice(baseIdx, 1);

      const evoIdx = board[evolutionSource].findIndex((c) => c.id === action.cardId);
      if (evoIdx === -1) return state;
      const [evoCard] = board[evolutionSource].splice(evoIdx, 1);

      // 進化カードのstackに下のカードをフラットに積む
      const evolvedCard: Card = {
        ...evoCard,
        tapped: baseCard.tapped,
        stack: [baseCard, ...(baseCard.stack ?? [])],
      };
      // baseCard自体のstackは親カードに移したので不要
      evolvedCard.stack = evolvedCard.stack!.map((c) => ({ ...c, stack: undefined }));

      applyDestination(board, evolvedCard, destination);
      return { ...s, board, pendingEvolve: null, pendingMinimized: false };
    }

    case 'CANCEL_EVOLVE':
      return { ...state, pendingEvolve: null, pendingMinimized: false };

    case 'BEGIN_MULTI_EVOLVE': {
      const pending: PendingMultiEvolve = {
        evolutionSources: action.evolutionSources,
        baseSources: action.baseSources,
        activeEvoSource: action.evolutionSources[0],
        destination: action.destination,
        evolutionCardId: null,
        selectedBases: [],
        activeBaseSource: action.baseSources[0] ?? 'battleZone',
        baseCount: action.baseCount,
        remainingSteps: action.remainingSteps,
      };
      return { ...state, pendingMultiEvolve: pending };
    }

    case 'SELECT_MULTI_EVOLVE_CARD': {
      if (!state.pendingMultiEvolve) return state;
      const { baseSources } = state.pendingMultiEvolve;
      const firstWithCards = baseSources.find((z) => state.board[z].length > 0) ?? baseSources[0] ?? 'battleZone';
      return {
        ...state,
        pendingMultiEvolve: {
          ...state.pendingMultiEvolve,
          evolutionCardId: action.cardId,
          activeBaseSource: firstWithCards,
        },
      };
    }

    case 'SET_MULTI_EVOLVE_EVO_SOURCE': {
      if (!state.pendingMultiEvolve) return state;
      return { ...state, pendingMultiEvolve: { ...state.pendingMultiEvolve, activeEvoSource: action.source } };
    }

    case 'SET_MULTI_EVOLVE_BASE_SOURCE': {
      if (!state.pendingMultiEvolve) return state;
      return { ...state, pendingMultiEvolve: { ...state.pendingMultiEvolve, activeBaseSource: action.source } };
    }

    case 'TOGGLE_MULTI_EVOLVE_BASE': {
      if (!state.pendingMultiEvolve) return state;
      const { selectedBases, baseCount, evolutionCardId, evolutionSources, destination } = state.pendingMultiEvolve;
      const exists = selectedBases.some((c) => c.cardId === action.cardId && c.zoneId === action.zoneId);
      const next = exists
        ? selectedBases.filter((c) => !(c.cardId === action.cardId && c.zoneId === action.zoneId))
        : [...selectedBases, { cardId: action.cardId, zoneId: action.zoneId }];

      if (!exists && baseCount !== null && next.length >= baseCount && evolutionCardId) {
        const s = pushHistory(state);
        const board = snapshot(s.board);
        const evoZone = evolutionSources.find((z) => board[z].some((c) => c.id === evolutionCardId)) ?? evolutionSources[0];
        const evoIdx = board[evoZone].findIndex((c) => c.id === evolutionCardId);
        if (evoIdx === -1) return state;
        const [evoCard] = board[evoZone].splice(evoIdx, 1);
        const baseCards: Card[] = [];
        for (const { cardId, zoneId } of next) {
          const idx = board[zoneId].findIndex((c) => c.id === cardId);
          if (idx !== -1) {
            const [card] = board[zoneId].splice(idx, 1);
            baseCards.push(card);
          }
        }
        const evolvedCard: Card = {
          ...evoCard,
          stack: [...baseCards, ...(evoCard.stack ?? [])].map((c) => ({ ...c, stack: undefined })),
        };
        applyDestination(board, evolvedCard, destination);
        return { ...s, board, pendingMultiEvolve: null, pendingMinimized: false };
      }

      return { ...state, pendingMultiEvolve: { ...state.pendingMultiEvolve, selectedBases: next } };
    }

    case 'CONFIRM_MULTI_EVOLVE': {
      if (!state.pendingMultiEvolve || !state.pendingMultiEvolve.evolutionCardId) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const { evolutionSources, destination, evolutionCardId, selectedBases } = s.pendingMultiEvolve!;
      const evoZone = evolutionSources.find((z) => board[z].some((c) => c.id === evolutionCardId)) ?? evolutionSources[0];

      const evoIdx = board[evoZone].findIndex((c) => c.id === evolutionCardId);
      if (evoIdx === -1) return state;
      const [evoCard] = board[evoZone].splice(evoIdx, 1);

      const baseCards: Card[] = [];
      for (const { cardId, zoneId } of selectedBases) {
        const idx = board[zoneId].findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          const [card] = board[zoneId].splice(idx, 1);
          baseCards.push(card);
        }
      }

      const evolvedCard: Card = {
        ...evoCard,
        stack: [...baseCards, ...(evoCard.stack ?? [])].map((c) => ({ ...c, stack: undefined })),
      };
      applyDestination(board, evolvedCard, destination);
      return { ...s, board, pendingMultiEvolve: null, pendingMinimized: false };
    }

    case 'CANCEL_MULTI_EVOLVE':
      return { ...state, pendingMultiEvolve: null, pendingMinimized: false };

    case 'CHANGE_ABILITY_STOCK': {
      const current = state.abilityStockValues[action.id] ?? 0;
      return {
        ...state,
        abilityStockValues: { ...state.abilityStockValues, [action.id]: Math.max(0, current + action.delta) },
      };
    }

    case 'SET_ABILITY_STOCK': {
      return {
        ...state,
        abilityStockValues: { ...state.abilityStockValues, [action.id]: Math.max(0, action.value) },
      };
    }

    case 'BEGIN_STACK': {
      const pending: PendingStack = {
        mode: action.mode,
        sourceCardId: action.sourceCardId,
        sourceZone: action.sourceZone,
      };
      return { ...state, pendingStack: pending };
    }

    case 'COMPLETE_STACK': {
      if (!state.pendingStack) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const { mode, sourceCardId, sourceZone } = s.pendingStack!;

      const srcIdx = board[sourceZone].findIndex((c) => c.id === sourceCardId);
      if (srcIdx === -1) return state;
      const [srcCard] = board[sourceZone].splice(srcIdx, 1);

      const tgtIdx = board[action.targetZone].findIndex((c) => c.id === action.targetCardId);
      if (tgtIdx === -1) return state;
      const targetCard = board[action.targetZone][tgtIdx];

      if (mode === 'top') {
        board[action.targetZone][tgtIdx] = {
          ...srcCard,
          tapped: targetCard.tapped,
          stack: [targetCard, ...(targetCard.stack ?? [])].map((c) => ({ ...c, stack: undefined })),
        };
      } else {
        board[action.targetZone][tgtIdx] = {
          ...targetCard,
          stack: [srcCard, ...(srcCard.stack ?? []), ...(targetCard.stack ?? [])].map((c) => ({ ...c, stack: undefined })),
        };
      }
      return { ...s, board, pendingStack: null };
    }

    case 'CANCEL_STACK':
      return { ...state, pendingStack: null };

    case 'BEGIN_MULTI_STACK': {
      const pending: PendingMultiStack = {
        topCardId: action.topCardId,
        topCardZone: action.topCardZone,
        selectedCards: [],
        activeSource: action.topCardZone,
        destination: null,
        availableDestinations: action.availableDestinations,
      };
      return { ...state, pendingMultiStack: pending };
    }

    case 'SET_MULTI_STACK_SOURCE': {
      if (!state.pendingMultiStack) return state;
      return { ...state, pendingMultiStack: { ...state.pendingMultiStack, activeSource: action.source } };
    }

    case 'TOGGLE_MULTI_STACK_CARD': {
      if (!state.pendingMultiStack) return state;
      const { selectedCards } = state.pendingMultiStack;
      const exists = selectedCards.some((c) => c.cardId === action.cardId && c.zoneId === action.zoneId);
      const next = exists
        ? selectedCards.filter((c) => !(c.cardId === action.cardId && c.zoneId === action.zoneId))
        : [...selectedCards, { cardId: action.cardId, zoneId: action.zoneId }];
      return { ...state, pendingMultiStack: { ...state.pendingMultiStack, selectedCards: next } };
    }

    case 'SET_MULTI_STACK_DEST': {
      if (!state.pendingMultiStack) return state;
      return { ...state, pendingMultiStack: { ...state.pendingMultiStack, destination: action.destination } };
    }

    case 'CONFIRM_MULTI_STACK': {
      if (!state.pendingMultiStack || !state.pendingMultiStack.destination) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const { topCardId, topCardZone, selectedCards, destination } = s.pendingMultiStack!;

      const topIdx = board[topCardZone].findIndex((c) => c.id === topCardId);
      if (topIdx === -1) return state;
      const [topCard] = board[topCardZone].splice(topIdx, 1);

      const stackedBelow: Card[] = [];
      for (const { cardId, zoneId } of selectedCards) {
        const idx = board[zoneId].findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          const [card] = board[zoneId].splice(idx, 1);
          stackedBelow.push(card);
        }
      }

      const newCard: Card = {
        ...topCard,
        stack: [...stackedBelow, ...(topCard.stack ?? [])].map((c) => ({ ...c, stack: undefined })),
      };
      applyDestination(board, newCard, destination);
      return { ...s, board, pendingMultiStack: null };
    }

    case 'CANCEL_MULTI_STACK':
      return { ...state, pendingMultiStack: null };

    case 'CHANGE_MACRO_COUNTER': {
      const current = state.macroCounterValues[action.macroId] ?? 0;
      return {
        ...state,
        macroCounterValues: { ...state.macroCounterValues, [action.macroId]: Math.max(0, current + action.delta) },
      };
    }

    case 'SET_MACRO_COUNTER': {
      return {
        ...state,
        macroCounterValues: { ...state.macroCounterValues, [action.macroId]: Math.max(0, action.value) },
      };
    }

    case 'TOGGLE_ZONE_VISIBLE': {
      const zoneConfigs = state.zoneConfigs.map((z) =>
        z.zoneId === action.zoneId ? { ...z, visible: !z.visible } : z
      );
      const zoneConfigPresets = state.zoneConfigPresets.map((p, i) =>
        i === state.activePresetIndex
          ? { ...p, configs: p.configs.map((z) => z.zoneId === action.zoneId ? { ...z, visible: !z.visible } : z) }
          : p
      );
      return { ...state, zoneConfigs, zoneConfigPresets };
    }

    case 'KINDAN_PEEL': {
      if (state.kindanCards.length === 0) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      const [top, ...rest] = s.kindanCards;
      board.graveyard = [...board.graveyard, top];
      return { ...s, board, kindanCards: rest };
    }

    case 'DOLMAGEDON_DESTROY': {
      const card = state.dolmagedonSlots[action.slot];
      if (!card) return state;
      const s = pushHistory(state);
      const board = snapshot(s.board);
      board.graveyard = [...board.graveyard, card];
      const dolmagedonSlots = [...s.dolmagedonSlots];
      dolmagedonSlots[action.slot] = null;
      return { ...s, board, dolmagedonSlots };
    }

    case 'ZERO_ACTIVATE': {
      return { ...state, zeroUsed: { ...state.zeroUsed, [action.ability]: true } };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const history = [...state.history];
      const prev = history.pop()!;
      return { ...state, board: prev, history, pendingReveal: null, pendingPick: null, pendingEvolve: null, pendingMultiEvolve: null, pendingStack: null, pendingMultiStack: null, pendingMinimized: false };
    }

    case 'RESET_GAME':
      return { ...state, board: emptyBoard(), history: [], pendingReveal: null, pendingPick: null, pendingEvolve: null, pendingMultiEvolve: null, pendingStack: null, pendingMultiStack: null, pendingMinimized: false };

    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
