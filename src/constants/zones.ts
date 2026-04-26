import type { ZoneConfig, ZoneId, MacroDestination, CardMenuConfig } from '../types';

export const ALL_ZONE_IDS: ZoneId[] = [
  'deck', 'hand', 'battleZone', 'manaZone', 'graveyard', 'shieldZone', 'displayZone', 'grZone', 'superDimZone',
];

// board layout: 6列グリッド
// Row1: 山札(col1) | シールドゾーン(col2-6)
// Row2: バトルゾーン(col1-6)
// Row3: マナゾーン(col1-6)
// Row4: 手札(col1-5) | 墓地(col6)
export const DEFAULT_ZONE_CONFIGS: ZoneConfig[] = [
  { zoneId: 'deck',        displayName: '山札',           displayMode: 'stack',  gridCols: 1,  gridRows: 1, allowTap: false, visible: true,  order: 0, layoutRow: 3, layoutCol: 5, colSpan: 1 },
  { zoneId: 'shieldZone',  displayName: 'シールドゾーン', displayMode: 'grid',   gridCols: 5,  gridRows: 1, allowTap: false, visible: true,  order: 1, layoutRow: 1, layoutCol: 5, colSpan: 1 },
  { zoneId: 'battleZone',  displayName: 'バトルゾーン',   displayMode: 'spread', gridCols: 5,  gridRows: 2, allowTap: true,  visible: true,  order: 2, layoutRow: 1, layoutCol: 1, colSpan: 4 },
  { zoneId: 'manaZone',    displayName: 'マナゾーン',     displayMode: 'counter', gridCols: 10, gridRows: 1, allowTap: true,  visible: true,  order: 3, layoutRow: 2, layoutCol: 1, colSpan: 4 },
  { zoneId: 'hand',        displayName: '手札',           displayMode: 'spread', gridCols: 10, gridRows: 1, allowTap: false, visible: true,  order: 4, layoutRow: 3, layoutCol: 1, colSpan: 4 },
  { zoneId: 'graveyard',   displayName: '墓地',           displayMode: 'stack',  gridCols: 1,  gridRows: 1, allowTap: false, visible: true,  order: 5, layoutRow: 2, layoutCol: 5, colSpan: 1 },
  { zoneId: 'displayZone', displayName: '表示ゾーン',     displayMode: 'spread', gridCols: 10, gridRows: 1, allowTap: false, visible: false, order: 6, layoutRow: 5, layoutCol: 1, colSpan: 6 },
  { zoneId: 'grZone',      displayName: 'GRゾーン',       displayMode: 'stack',  gridCols: 1,  gridRows: 1, allowTap: false, visible: false, order: 7, layoutRow: 1, layoutCol: 6, colSpan: 1 },
  { zoneId: 'superDimZone',displayName: '超次元ゾーン',   displayMode: 'stack',  gridCols: 8,  gridRows: 1, allowTap: false, visible: false, order: 8, layoutRow: 2, layoutCol: 6, colSpan: 1 },
];

export const ZONE_DISPLAY_NAMES: Record<ZoneId, string> = {
  deck: '山札',
  hand: '手札',
  battleZone: 'バトルゾーン',
  manaZone: 'マナゾーン',
  graveyard: '墓地',
  shieldZone: 'シールドゾーン',
  displayZone: '表示ゾーン',
  grZone: 'GRゾーン',
  superDimZone: '超次元ゾーン',
};

export const MACRO_DESTINATIONS: MacroDestination[] = [
  'deckTopOrder', 'deckTopShuffle', 'deckBottomOrder', 'deckBottomShuffle', 'hand', 'battleZone', 'manaZone', 'graveyard', 'shieldZone', 'superDimZone',
];

export const DEFAULT_CARD_MENU_CONFIG: CardMenuConfig = {
  destinations: ['deckTop', 'deckBottom', 'hand', 'battleZone', 'manaZone', 'graveyard', 'shieldZone'],
  layout: 'vertical',
  stackActions: [],
};

export const MACRO_DEST_NAMES: Record<MacroDestination, string> = {
  deckTop: '山札の上',
  deckTopShuffle: '山上（シャッフル）',
  deckTopOrder: '山上（順番）',
  deckBottom: '山札の下',
  deckBottomShuffle: '山下（シャッフル）',
  deckBottomOrder: '山下（順番）',
  hand: '手札',
  battleZone: 'バトルゾーン',
  manaZone: 'マナゾーン',
  graveyard: '墓地',
  shieldZone: 'シールドゾーン',
  superDimZone: '超次元ゾーン',
  grZoneBottom: 'GRゾーンの下',
};
