import { useGameContext } from '../../context/GameContext';
import { ZONE_DISPLAY_NAMES, MACRO_DEST_NAMES } from '../../constants/zones';
import { CardToken } from './CardToken';

export function EvolveOverlay() {
  const { state, dispatch } = useGameContext();
  const pending = state.pendingEvolve;
  if (!pending) return null;
  if (state.pendingMinimized) return null;

  const isSelectBase = pending.phase === 'selectBase';
  const sourceZone = isSelectBase ? pending.baseSource : pending.evolutionSource;
  const cards = state.board[sourceZone];

  const title = isSelectBase
    ? `進化の土台を選ぶ（${ZONE_DISPLAY_NAMES[pending.baseSource]}）→ ${MACRO_DEST_NAMES[pending.destination]}`
    : `進化させるカードを選ぶ（${ZONE_DISPLAY_NAMES[pending.evolutionSource]}）`;

  return (
    <div className="display-zone-overlay">
      <div className="display-zone-modal">
        <div className="overlay-title-row">
          <h2 className="display-zone-title">{title}</h2>
          <button className="overlay-minimize-btn" onClick={() => dispatch({ type: 'MINIMIZE_OVERLAY' })}>↙ 最小化</button>
        </div>

        <div className="display-zone-cards">
          {cards.length === 0 ? (
            <p style={{ color: '#888' }}>カードがありません</p>
          ) : (
            cards.map((card) => (
              <CardToken
                key={card.id}
                card={card}
                pickable
                onPick={() => {
                  if (isSelectBase) {
                    dispatch({ type: 'SELECT_EVOLVE_BASE', cardId: card.id });
                  } else {
                    dispatch({ type: 'SELECT_EVOLVE_EVOLUTION', cardId: card.id });
                  }
                }}
              />
            ))
          )}
        </div>

        <div className="display-zone-actions">
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'CANCEL_EVOLVE' })}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
