export type ZoneId =
  | 'deck'
  | 'hand'
  | 'battleZone'
  | 'manaZone'
  | 'graveyard'
  | 'shieldZone'
  | 'displayZone'
  | 'grZone'
  | 'superDimZone';

export type DisplayMode = 'stack' | 'spread' | 'grid' | 'fan' | 'counter' | 'row';

// マクロ・カードメニュー共通の送り先
export type MacroDestination =
  | 'hand'
  | 'battleZone'
  | 'manaZone'
  | 'graveyard'
  | 'shieldZone'
  | 'deckTop'
  | 'deckBottom'
  | 'deckTopShuffle'
  | 'deckTopOrder'
  | 'deckBottomShuffle'
  | 'deckBottomOrder'
  | 'superDimZone'
  | 'grZoneBottom';

export interface Card {
  id: string;
  name: string;
  tapped: boolean;
  stack?: Card[]; // 進化で重なった下のカード（index 0 が直下）
  isGR?: boolean;       // GRゾーン出身カード（GRゾーン外にいる間true）
  isSuperDim?: boolean; // 超次元ゾーン出身カード（超次元ゾーン外にいる間true）
}

export interface ZoneConfig {
  zoneId: ZoneId;
  displayName: string;
  displayMode: DisplayMode;
  gridCols: number;
  gridRows: number;
  allowTap: boolean;
  visible: boolean;
  order: number;
  layoutRow: number;
  layoutCol: number;
  colSpan: number;
}

// カードメニューの設定
export type CardMenuLayout = 'vertical' | 'horizontal';
export type CardMenuStackAction = 'stackTop' | 'stackBottom' | 'multiStack';

export interface CardMenuConfig {
  destinations: MacroDestination[];
  layout: CardMenuLayout;
  stackActions?: CardMenuStackAction[];
  multiStackDestinations?: MacroDestination[];
}

// マクロアクション
export interface DrawAction {
  type: 'DRAW';
  n: number;
}

export interface MoveTopToZoneAction {
  type: 'MOVE_TOP_TO_ZONE';
  n: number;
  destination: MacroDestination;
}

export interface RevealAndSelectAction {
  type: 'REVEAL_AND_SELECT';
  n: number;
  destinations: MacroDestination[];
}

// ゾーンを開いてN枚選んで送る
export interface PickFromZoneAction {
  type: 'PICK_FROM_ZONE';
  sources: ZoneId[];
  count: number;
  destination: MacroDestination;
}

// ゾーンを開いてXを押すまで何枚でも選んで送る
export interface PickFromZoneLoopAction {
  type: 'PICK_FROM_ZONE_LOOP';
  sources: ZoneId[];
  destination: MacroDestination;
}

export interface EvolveAction {
  type: 'EVOLVE';
  baseSource: ZoneId;
  evolutionSource: ZoneId;
  destination: MacroDestination;
}

export interface ShuffleAction {
  type: 'SHUFFLE';
  zoneId: ZoneId;
}

export interface GRSummonAction {
  type: 'GR_SUMMON_MACRO';
}

export interface MultiEvolveAction {
  type: 'MULTI_EVOLVE';
  evolutionSources: ZoneId[];
  baseSources: ZoneId[];
  baseCount: number;
  destination: MacroDestination;
}

export interface MultiEvolveLoopAction {
  type: 'MULTI_EVOLVE_LOOP';
  evolutionSources: ZoneId[];
  baseSources: ZoneId[];
  destination: MacroDestination;
}

export type MacroAction =
  | MoveTopToZoneAction
  | RevealAndSelectAction
  | PickFromZoneAction
  | PickFromZoneLoopAction
  | ShuffleAction
  | GRSummonAction
  | MultiEvolveAction
  | MultiEvolveLoopAction;

export type SpecialCardType = 'none' | 'kindan' | 'dolmagedon' | 'zero';

export interface MacroCounter {
  enabled: boolean;
  label?: string;
  initialValue: number;
}

export interface Macro {
  id: string;
  name: string;
  steps: MacroAction[];
  counter?: MacroCounter;
}

export interface ZoneConfigPreset {
  name: string;
  configs: ZoneConfig[];
}

export interface AbilityStockItem {
  id: string;
  name: string;
  initialValue: number;
}

export interface AbilityStockDef {
  id: string;
  name: string; // グループ名
  layoutRow: number;
  layoutCol: number;
  colSpan: number;
  stocks: AbilityStockItem[];
}

export interface PendingStack {
  mode: 'top' | 'bottom';
  sourceCardId: string;
  sourceZone: ZoneId;
}

export interface PendingMultiStack {
  topCardId: string;
  topCardZone: ZoneId;
  selectedCards: { cardId: string; zoneId: ZoneId }[];
  activeSource: ZoneId;
  destination: MacroDestination | null;
  availableDestinations: MacroDestination[];
}

export interface DeckDefinition {
  id: string;
  name: string;
  cards: Card[];
  grCards?: Card[];
  superDimCards?: Card[];
  macros: Macro[];
  zoneConfigs: ZoneConfig[];
  zoneConfigPresets?: ZoneConfigPreset[];
  cardMenuConfig: CardMenuConfig;
  abilityStocks?: AbilityStockDef[];
  specialCard?: SpecialCardType;
  createdAt: number;
  updatedAt: number;
}

export type BoardState = Record<ZoneId, Card[]>;

export interface PendingReveal {
  destinations: MacroDestination[];
  cards: Card[];
  clickOrder: string[];
  remainingSteps: MacroAction[];
}

// ゾーンからカードを選ぶ待機状態
export interface PendingPick {
  sessionId: string;
  sources: ZoneId[];
  activeSource: ZoneId;
  destination: MacroDestination;
  maxCount: number | null; // null = ループモード（無制限）
  selectedIds: string[];
  remainingSteps: MacroAction[];
}

export interface PendingEvolve {
  phase: 'selectBase' | 'selectEvolution';
  baseSource: ZoneId;
  evolutionSource: ZoneId;
  destination: MacroDestination;
  baseCardId: string | null;
  remainingSteps: MacroAction[];
}

export interface PendingMultiEvolve {
  evolutionSources: ZoneId[];
  baseSources: ZoneId[];
  activeEvoSource: ZoneId;
  destination: MacroDestination;
  evolutionCardId: string | null;
  selectedBases: { cardId: string; zoneId: ZoneId }[];
  activeBaseSource: ZoneId;
  baseCount: number | null;
  remainingSteps: MacroAction[];
}

export interface GameState {
  deckId: string;
  deckName: string;
  board: BoardState;
  zoneConfigs: ZoneConfig[];
  zoneConfigPresets: ZoneConfigPreset[];
  activePresetIndex: number;
  macros: Macro[];
  cardMenuConfig: CardMenuConfig;
  abilityStocks: AbilityStockDef[];
  abilityStockValues: Record<string, number>;
  history: BoardState[];
  pendingReveal: PendingReveal | null;
  pendingPick: PendingPick | null;
  pendingEvolve: PendingEvolve | null;
  pendingMultiEvolve: PendingMultiEvolve | null;
  pendingStack: PendingStack | null;
  pendingMultiStack: PendingMultiStack | null;
  pendingMinimized: boolean;
  macroCounterValues: Record<string, number>;
  specialCard: SpecialCardType;
  kindanCards: Card[];
  dolmagedonSlots: (Card | null)[];
  zeroUsed: { fukkatsu: boolean; hakai: boolean; graveyard: boolean; hand: boolean };
}

export type AppPage = 'deckList' | 'game' | 'deckEditor';

export interface AppState {
  page: AppPage;
  selectedDeckId: string | null;
  editingDeckId: string | null;
}
