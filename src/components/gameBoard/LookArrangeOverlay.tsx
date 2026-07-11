import { MACRO_DEST_NAMES } from '../../constants/zones';
import { useGameContext } from '../../context/GameContext';
import type { Card } from '../../types';

function cardById(cards: Card[], id: string): Card | undefined {
  return cards.find((card) => card.id === id);
}

export function LookArrangeOverlay() {
  const { state, dispatch } = useGameContext();
  const pending = state.pendingLookArrange;

  if (!pending || state.pendingMinimized) return null;

  const orderedCards = pending.order
    .map((id) => cardById(pending.cards, id))
    .filter((card): card is Card => !!card);

  return (
    <div className="look-arrange-overlay">
      <div className="look-arrange-modal">
        <div className="overlay-title-row">
          <h2 className="display-zone-title">山札を見て振り分ける</h2>
          <button
            className="overlay-minimize-btn"
            onClick={() => dispatch({ type: 'MINIMIZE_OVERLAY' })}
            title="最小化して盤面を確認"
          >
            最小化
          </button>
        </div>

        <div className="look-arrange-help">
          <span>送り先を選び、山札の上/下へ戻すカードは上下で順番を調整できます。</span>
        </div>

        <div className="look-arrange-list">
          {orderedCards.map((card, i) => {
            const assigned = pending.assignments[card.id] ?? pending.destinations[0];
            return (
              <div key={card.id} className="look-arrange-row">
                <div className="look-arrange-order">
                  <button
                    className="icon-btn"
                    disabled={i === 0}
                    onClick={() => dispatch({ type: 'MOVE_LOOK_CARD', cardId: card.id, direction: -1 })}
                    title="上へ"
                  >
                    ↑
                  </button>
                  <span>{i + 1}</span>
                  <button
                    className="icon-btn"
                    disabled={i === orderedCards.length - 1}
                    onClick={() => dispatch({ type: 'MOVE_LOOK_CARD', cardId: card.id, direction: 1 })}
                    title="下へ"
                  >
                    ↓
                  </button>
                </div>

                <div className="look-arrange-card">
                  <span className="look-arrange-card-name">{card.name}</span>
                </div>

                <div className="look-arrange-dests">
                  {pending.destinations.map((dest) => (
                    <button
                      key={dest}
                      className={`btn btn-sm ${assigned === dest ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => dispatch({ type: 'SET_LOOK_DESTINATION', cardId: card.id, destination: dest })}
                    >
                      {MACRO_DEST_NAMES[dest]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="display-zone-actions">
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'CONFIRM_LOOK_ARRANGE' })}>確定</button>
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'CANCEL_LOOK_ARRANGE' })}>キャンセル（山札に戻す）</button>
        </div>
      </div>
    </div>
  );
}
