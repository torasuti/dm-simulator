import { MACRO_DEST_NAMES } from '../../constants/zones';
import { useGameContext } from '../../context/GameContext';
import { CardToken } from './CardToken';

export function DisplayZoneOverlay() {
  const { state, dispatch } = useGameContext();
  const pending = state.pendingReveal;

  if (!pending) return null;
  if (state.pendingMinimized) return null;

  const { cards, clickOrder, destinations } = pending;
  const fallbackZone = destinations[destinations.length - 1];

  return (
    <div className="display-zone-overlay">
      <div className="display-zone-modal">
        <div className="overlay-title-row">
          <h2 className="display-zone-title">カードを選択してください</h2>
          <button className="overlay-minimize-btn" onClick={() => dispatch({ type: 'MINIMIZE_OVERLAY' })} title="最小化してボードを確認">
            ↙ 最小化
          </button>
        </div>

        <div className="display-zone-legend">
          {destinations.slice(0, -1).map((dest, i) => (
            <span key={i} className="legend-item">
              <span className="legend-num">{i + 1}クリック目</span>→
              <span className="legend-dest">{MACRO_DEST_NAMES[dest]}</span>
            </span>
          ))}
          <span className="legend-item">
            <span className="legend-num">残り全部</span>→
            <span className="legend-dest">{MACRO_DEST_NAMES[fallbackZone]}</span>
          </span>
        </div>

        <div className="display-zone-cards">
          {cards.map((card) => {
            const idx = clickOrder.indexOf(card.id);
            return (
              <CardToken
                key={card.id}
                card={card}
                selectable
                selectionIndex={idx >= 0 ? idx : undefined}
                onSelect={() => dispatch({ type: 'CLICK_REVEALED_CARD', cardId: card.id })}
              />
            );
          })}
        </div>

        <div className="display-zone-actions">
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'CONFIRM_REVEAL' })}>確定</button>
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'CANCEL_REVEAL' })}>キャンセル（山札に戻す）</button>
        </div>
      </div>
    </div>
  );
}
