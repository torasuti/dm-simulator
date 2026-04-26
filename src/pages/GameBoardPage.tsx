import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useGameContext } from '../context/GameContext';
import { loadDeck } from '../storage/localStorage';
import { ZonePanel } from '../components/gameBoard/ZonePanel';
import { MacroBar } from '../components/gameBoard/MacroBar';
import { GameControls } from '../components/gameBoard/GameControls';
import { DisplayZoneOverlay } from '../components/gameBoard/DisplayZoneOverlay';
import { PickZoneOverlay } from '../components/gameBoard/PickZoneOverlay';
import { EvolveOverlay } from '../components/gameBoard/EvolveOverlay';
import { MultiStackOverlay } from '../components/gameBoard/MultiStackOverlay';
import { MultiEvolveOverlay } from '../components/gameBoard/MultiEvolveOverlay';
import { SpecialPanel } from '../components/gameBoard/SpecialPanel';
import type { ZoneId, MacroDestination } from '../types';

export function GameBoardPage() {
  const { state: appState } = useAppContext();
  const { state, dispatch } = useGameContext();

  useEffect(() => {
    if (appState.selectedDeckId && state.deckId !== appState.selectedDeckId) {
      const deck = loadDeck(appState.selectedDeckId);
      if (deck) dispatch({ type: 'INIT_GAME', deck });
    }
  }, [appState.selectedDeckId]);

  const visibleZones = state.zoneConfigs.filter((z) => z.visible);
  const hasPending = !!(state.pendingReveal || state.pendingPick || state.pendingEvolve || state.pendingMultiEvolve || state.pendingMultiStack);
  const isMinimized = hasPending && state.pendingMinimized;
  const pendingStack = state.pendingStack;

  const pendingLabel = state.pendingReveal
    ? 'カード選択中'
    : state.pendingPick
    ? 'カード選択中'
    : state.pendingEvolve
    ? state.pendingEvolve.phase === 'selectBase' ? '進化：土台選択中' : '進化：進化先選択中'
    : state.pendingMultiEvolve
    ? state.pendingMultiEvolve.evolutionCardId === null ? '進化（複数枚）：進化カード選択中' : '進化（複数枚）：土台選択中'
    : state.pendingMultiStack
    ? '複数枚重ねる：カード選択中'
    : '';

  return (
    <div className="game-board-page">
      {isMinimized && (
        <div className="board-lock-bar">
          <span className="board-lock-label">⏸ {pendingLabel}</span>
          <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'RESTORE_OVERLAY' })}>
            ↗ 選択画面に戻る
          </button>
        </div>
      )}
      {pendingStack && (
        <div className="board-lock-bar stack-mode-bar">
          <span className="board-lock-label">
            {pendingStack.mode === 'top' ? '⬆ 上に重ねる先のカードをクリック' : '⬇ 下に重ねる先のカードをクリック'}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'CANCEL_STACK' })}>
            キャンセル
          </button>
        </div>
      )}

      <div className={`board-layout${isMinimized ? ' board-locked' : ''}`}>
        {visibleZones.map((cfg) => (
          <ZonePanel
            key={cfg.zoneId}
            config={cfg}
            cards={state.board[cfg.zoneId] ?? []}
            style={{ gridRow: cfg.layoutRow, gridColumn: `${cfg.layoutCol} / span ${cfg.colSpan}` }}
            cardMenuConfig={state.cardMenuConfig}
            locked={isMinimized}
            onTapCard={(cardId) => dispatch({ type: 'TAP_CARD', zoneId: cfg.zoneId, cardId })}
            onMoveCard={(cardId, to) => dispatch({ type: 'MOVE_CARD', cardId, from: cfg.zoneId, to: to as ZoneId | MacroDestination })}
            onUntapAll={() => dispatch({ type: 'UNTAP_ALL', zoneId: cfg.zoneId })}
            onDraw={cfg.zoneId === 'deck' ? () => dispatch({ type: 'DRAW', n: 1 }) : undefined}
            onBreak={cfg.zoneId === 'shieldZone' ? () => dispatch({ type: 'MOVE_TOP_TO_ZONE', n: 1, from: 'shieldZone', to: 'hand' }) : undefined}
            onGRSummon={cfg.zoneId === 'grZone' ? () => dispatch({ type: 'GR_SUMMON' }) : undefined}
            onShuffle={() => dispatch({ type: 'SHUFFLE_ZONE', zoneId: cfg.zoneId })}
            onDropCard={(cardId, from) => dispatch({ type: 'MOVE_CARD', cardId, from, to: cfg.zoneId })}
            pendingStack={pendingStack}
            onStackInit={(cardId, mode) => dispatch({ type: 'BEGIN_STACK', mode, sourceCardId: cardId, sourceZone: cfg.zoneId })}
            onStackTarget={(cardId) => dispatch({ type: 'COMPLETE_STACK', targetCardId: cardId, targetZone: cfg.zoneId })}
            onMultiStackInit={(cardId) => dispatch({ type: 'BEGIN_MULTI_STACK', topCardId: cardId, topCardZone: cfg.zoneId, availableDestinations: state.cardMenuConfig.multiStackDestinations ?? ['battleZone', 'shieldZone'] })}
          />
        ))}
        <SpecialPanel style={{ gridRow: 3, gridColumn: '6 / span 1' }} />
      </div>

      <MacroBar macros={state.macros} locked={hasPending || !!pendingStack} />
      <GameControls />
      <DisplayZoneOverlay />
      <PickZoneOverlay />
      <EvolveOverlay />
      <MultiEvolveOverlay />
      <MultiStackOverlay />
    </div>
  );
}
