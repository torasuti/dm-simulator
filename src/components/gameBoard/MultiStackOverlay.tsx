import { useGameContext } from '../../context/GameContext';
import { ZONE_DISPLAY_NAMES, MACRO_DEST_NAMES, ALL_ZONE_IDS } from '../../constants/zones';
import { CardToken } from './CardToken';
import type { ZoneId } from '../../types';

export function MultiStackOverlay() {
  const { state, dispatch } = useGameContext();
  const pending = state.pendingMultiStack;
  if (!pending) return null;

  const { topCardId, topCardZone, selectedCards, activeSource, destination, availableDestinations } = pending;

  const topCard = state.board[topCardZone].find((c) => c.id === topCardId);

  const sourcesWithCards = ALL_ZONE_IDS.filter((zoneId) => {
    const cards = state.board[zoneId];
    if (zoneId === topCardZone) return cards.some((c) => c.id !== topCardId);
    return cards.length > 0;
  });

  const activeCards = (state.board[activeSource] ?? []).filter((c) => c.id !== topCardId);

  const selectedCount = selectedCards.length;
  const canConfirm = destination !== null;

  return (
    <div className="display-zone-overlay">
      <div className="display-zone-modal" style={{ maxWidth: 640 }}>
        <div className="overlay-title-row">
          <h2 className="display-zone-title">
            複数枚重ねる
            {topCard && <span style={{ fontSize: '0.85em', marginLeft: 8, color: '#aaa' }}>（上：{topCard.name}）</span>}
          </h2>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: '0.85em', color: '#aaa' }}>下に重ねるカードをゾーンから選択してください（複数ゾーン可）</span>
        </div>

        {sourcesWithCards.length > 0 ? (
          <>
            <div className="pick-zone-tabs">
              {sourcesWithCards.map((zoneId) => {
                const count = (state.board[zoneId] ?? []).filter((c) => c.id !== topCardId).length;
                const selCount = selectedCards.filter((c) => c.zoneId === zoneId).length;
                return (
                  <button
                    key={zoneId}
                    className={`pick-zone-tab${activeSource === zoneId ? ' active' : ''}`}
                    onClick={() => dispatch({ type: 'SET_MULTI_STACK_SOURCE', source: zoneId as ZoneId })}
                  >
                    {ZONE_DISPLAY_NAMES[zoneId as ZoneId]}（{count}枚{selCount > 0 ? `・✓${selCount}` : ''}）
                  </button>
                );
              })}
            </div>

            <div className="display-zone-cards">
              {activeCards.length === 0 ? (
                <p style={{ color: '#888' }}>選べるカードがありません</p>
              ) : (
                activeCards.map((card) => {
                  const isPicked = selectedCards.some((c) => c.cardId === card.id && c.zoneId === activeSource);
                  return (
                    <CardToken
                      key={card.id}
                      card={card}
                      pickable
                      picked={isPicked}
                      onPick={() => dispatch({ type: 'TOGGLE_MULTI_STACK_CARD', cardId: card.id, zoneId: activeSource })}
                    />
                  );
                })
              )}
            </div>
          </>
        ) : (
          <p style={{ color: '#888', marginBottom: 12 }}>重ねるカードがありません</p>
        )}

        {selectedCount > 0 && (
          <div style={{ margin: '8px 0', fontSize: '0.85em', color: '#ccc' }}>
            選択中: {selectedCards.map((c) => {
              const card = state.board[c.zoneId]?.find((b) => b.id === c.cardId);
              return card?.name ?? '?';
            }).join('、')}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.85em', color: '#aaa', marginBottom: 6 }}>出すゾーン:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {availableDestinations.map((dest) => (
              <button
                key={dest}
                className={`btn btn-sm${destination === dest ? ' btn-primary' : ' btn-secondary'}`}
                onClick={() => dispatch({ type: 'SET_MULTI_STACK_DEST', destination: dest })}
              >
                {MACRO_DEST_NAMES[dest]}
              </button>
            ))}
          </div>
        </div>

        <div className="display-zone-actions" style={{ marginTop: 16 }}>
          <button
            className="btn btn-primary"
            disabled={!canConfirm}
            onClick={() => dispatch({ type: 'CONFIRM_MULTI_STACK' })}
          >
            確定（{selectedCount}枚を重ねて{destination ? MACRO_DEST_NAMES[destination] : '?'}へ）
          </button>
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'CANCEL_MULTI_STACK' })}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
