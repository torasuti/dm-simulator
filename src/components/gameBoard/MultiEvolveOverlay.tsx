import { useGameContext } from '../../context/GameContext';
import { ZONE_DISPLAY_NAMES, MACRO_DEST_NAMES, ALL_ZONE_IDS } from '../../constants/zones';
import { CardToken } from './CardToken';
import type { ZoneId } from '../../types';

export function MultiEvolveOverlay() {
  const { state, dispatch } = useGameContext();
  const pending = state.pendingMultiEvolve;
  if (!pending || state.pendingMinimized) return null;

  const { evolutionSources, baseSources, activeEvoSource, destination, evolutionCardId, selectedBases, activeBaseSource, baseCount } = pending;
  const isSelectingEvolution = evolutionCardId === null;

  const evolutionCard = evolutionCardId
    ? evolutionSources.flatMap((z) => state.board[z]).find((c) => c.id === evolutionCardId)
    : null;

  const baseSourcesWithCards = baseSources.filter((z) => state.board[z].length > 0);

  const activeEvoCards = state.board[activeEvoSource] ?? [];
  const activeBaseCards = state.board[activeBaseSource] ?? [];

  return (
    <div className="display-zone-overlay">
      <div className="display-zone-modal" style={{ maxWidth: 640 }}>
        <div className="overlay-title-row">
          <h2 className="display-zone-title">
            {isSelectingEvolution
              ? `進化カードを選ぶ → ${MACRO_DEST_NAMES[destination]}`
              : `土台カードを選ぶ（複数可）`}
            {!isSelectingEvolution && evolutionCard && (
              <span style={{ fontSize: '0.85em', marginLeft: 8, color: '#aaa' }}>
                （進化：{evolutionCard.name}）
              </span>
            )}
          </h2>
          <button className="overlay-minimize-btn" onClick={() => dispatch({ type: 'MINIMIZE_OVERLAY' })}>↙ 最小化</button>
        </div>

        {isSelectingEvolution ? (
          <>
            {evolutionSources.length > 1 && (
              <div className="pick-zone-tabs">
                {evolutionSources.map((z) => (
                  <button
                    key={z}
                    className={`pick-zone-tab${activeEvoSource === z ? ' active' : ''}`}
                    onClick={() => dispatch({ type: 'SET_MULTI_EVOLVE_EVO_SOURCE', source: z as ZoneId })}
                  >
                    {ZONE_DISPLAY_NAMES[z as ZoneId]}（{state.board[z].length}枚）
                  </button>
                ))}
              </div>
            )}
            <div className="display-zone-cards">
              {activeEvoCards.length === 0 ? (
                <p style={{ color: '#888' }}>カードがありません</p>
              ) : (
                activeEvoCards.map((card) => (
                  <CardToken
                    key={card.id}
                    card={card}
                    pickable
                    onPick={() => dispatch({ type: 'SELECT_MULTI_EVOLVE_CARD', cardId: card.id })}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {baseSourcesWithCards.length > 0 ? (
              <>
                <div style={{ marginBottom: 6, fontSize: '0.85em', color: '#aaa' }}>
                  下に重ねる土台カードを選択（複数ゾーン可）
                </div>
                <div className="pick-zone-tabs">
                  {baseSourcesWithCards.map((zoneId) => {
                    const count = state.board[zoneId].length;
                    const selCount = selectedBases.filter((c) => c.zoneId === zoneId).length;
                    return (
                      <button
                        key={zoneId}
                        className={`pick-zone-tab${activeBaseSource === zoneId ? ' active' : ''}`}
                        onClick={() => dispatch({ type: 'SET_MULTI_EVOLVE_BASE_SOURCE', source: zoneId as ZoneId })}
                      >
                        {ZONE_DISPLAY_NAMES[zoneId as ZoneId]}（{count}枚{selCount > 0 ? `・✓${selCount}` : ''}）
                      </button>
                    );
                  })}
                </div>
                <div className="display-zone-cards">
                  {activeBaseCards.length === 0 ? (
                    <p style={{ color: '#888' }}>カードがありません</p>
                  ) : (
                    activeBaseCards.map((card) => {
                      const isPicked = selectedBases.some((c) => c.cardId === card.id && c.zoneId === activeBaseSource);
                      return (
                        <CardToken
                          key={card.id}
                          card={card}
                          pickable
                          picked={isPicked}
                          onPick={() => dispatch({ type: 'TOGGLE_MULTI_EVOLVE_BASE', cardId: card.id, zoneId: activeBaseSource })}
                        />
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <p style={{ color: '#888', marginBottom: 12 }}>土台にするカードがありません</p>
            )}

            {selectedBases.length > 0 && (
              <div style={{ margin: '8px 0', fontSize: '0.85em', color: '#ccc' }}>
                選択中{baseCount !== null ? `（${selectedBases.length}/${baseCount}枚）` : ''}: {selectedBases.map((c) => {
                  const card = state.board[c.zoneId]?.find((b) => b.id === c.cardId);
                  return card?.name ?? '?';
                }).join('、')}
              </div>
            )}
          </>
        )}

        <div className="display-zone-actions" style={{ marginTop: 16 }}>
          {!isSelectingEvolution && (
            <button
              className="btn btn-primary"
              onClick={() => dispatch({ type: 'CONFIRM_MULTI_EVOLVE' })}
            >
              確定（{selectedBases.length}枚を土台にして{MACRO_DEST_NAMES[destination]}へ）
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'CANCEL_MULTI_EVOLVE' })}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
