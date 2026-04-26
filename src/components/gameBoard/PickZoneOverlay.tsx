import { useState, useEffect } from 'react';
import { useGameContext } from '../../context/GameContext';
import { ZONE_DISPLAY_NAMES, MACRO_DEST_NAMES } from '../../constants/zones';
import { CardToken } from './CardToken';
import { shuffle } from '../../utils/deckUtils';

export function PickZoneOverlay() {
  const { state, dispatch } = useGameContext();
  const pending = state.pendingPick;

  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  useEffect(() => {
    setOrderedIds([]);
  }, [pending?.sessionId]);

  if (!pending) return null;
  if (state.pendingMinimized) return null;

  const { sources, activeSource, destination, maxCount } = pending;
  const isLoop = maxCount === null;
  const isOrderedDest = destination === 'deckTop' || destination === 'deckBottom';
  const cards = state.board[activeSource];
  const isShieldSource = activeSource === 'shieldZone';

  const title = isLoop
    ? `${ZONE_DISPLAY_NAMES[activeSource]}から選択 → ${MACRO_DEST_NAMES[destination]}（✕で終了）`
    : `${ZONE_DISPLAY_NAMES[activeSource]}から${maxCount}枚選択 → ${MACRO_DEST_NAMES[destination]}`;

  const zoneTabs = sources.length > 1 ? (
    <div className="pick-zone-tabs">
      {sources.map((z) => (
        <button
          key={z}
          className={`pick-zone-tab ${z === activeSource ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_PICK_SOURCE', source: z })}
        >
          {ZONE_DISPLAY_NAMES[z]}
        </button>
      ))}
    </div>
  ) : null;

  // ループモードは既存の即時送り動作を維持
  if (isLoop) {
    return (
      <div className="display-zone-overlay">
        <div className="display-zone-modal">
          <div className="overlay-title-row">
            <h2 className="display-zone-title">{title}</h2>
            <button className="overlay-minimize-btn" onClick={() => dispatch({ type: 'MINIMIZE_OVERLAY' })}>↙ 最小化</button>
          </div>
          {zoneTabs}
          <div className="display-zone-cards">
            {cards.length === 0 ? (
              <p style={{ color: '#888' }}>カードがありません</p>
            ) : (
              cards.map((card) => (
                <CardToken
                  key={card.id}
                  card={card}
                  faceDown={isShieldSource}
                  pickable
                  onPick={() => dispatch({ type: 'TOGGLE_PICK_CARD', cardId: card.id })}
                />
              ))
            )}
          </div>
          <div className="display-zone-actions">
            <button className="btn btn-danger" onClick={() => dispatch({ type: 'CANCEL_PICK' })}>
              ✕ 終了
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 非ループモード：ローカルで順番管理
  function toggleCard(cardId: string) {
    setOrderedIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  }

  function moveUp(i: number) {
    if (i === 0) return;
    setOrderedIds((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  function moveDown(i: number) {
    setOrderedIds((prev) => {
      if (i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  }

  function confirmOrdered() {
    dispatch({ type: 'CONFIRM_PICK_ORDERED', cardIds: orderedIds });
  }

  function confirmShuffled() {
    dispatch({ type: 'CONFIRM_PICK_ORDERED', cardIds: shuffle([...orderedIds]) });
  }

  const reachedMax = maxCount !== null && orderedIds.length >= maxCount;

  return (
    <div className="display-zone-overlay">
      <div className="display-zone-modal pick-ordered-modal">
        <div className="overlay-title-row">
          <h2 className="display-zone-title">{title}</h2>
          <button className="overlay-minimize-btn" onClick={() => dispatch({ type: 'MINIMIZE_OVERLAY' })}>↙ 最小化</button>
        </div>
        {zoneTabs}
        <p className="pick-progress">選択中: {orderedIds.length} / {maxCount}枚</p>

        <div className="pick-ordered-layout">
          {/* 左：選択元カード */}
          <div className="pick-source-area">
            <div className="pick-area-label">選択元（{ZONE_DISPLAY_NAMES[activeSource]}）</div>
            <div className="display-zone-cards">
              {cards.length === 0 ? (
                <p style={{ color: '#888' }}>カードがありません</p>
              ) : (
                cards.map((card) => (
                  <CardToken
                    key={card.id}
                    card={card}
                    faceDown={isShieldSource}
                    pickable
                    picked={orderedIds.includes(card.id)}
                    onPick={() => !reachedMax || orderedIds.includes(card.id) ? toggleCard(card.id) : undefined}
                  />
                ))
              )}
            </div>
          </div>

          {/* 右：選択済み順番リスト（deckTop/Bottom のときのみ） */}
          {isOrderedDest && orderedIds.length > 0 && (
            <div className="pick-order-area">
              <div className="pick-area-label">
                送り先順（{MACRO_DEST_NAMES[destination]}）
                <span className="pick-area-hint">
                  {destination === 'deckTop' ? '→ 上が先に引かれる' : '→ 上が一番下に'}
                </span>
              </div>
              <div className="pick-order-list">
                {orderedIds.map((cardId, i) => {
                  // 全ゾーンから検索
                  let card = null;
                  let fromZone = activeSource;
                  for (const zoneId of sources) {
                    const found = state.board[zoneId].find((c) => c.id === cardId);
                    if (found) { card = found; fromZone = zoneId; break; }
                  }
                  if (!card) return null;
                  return (
                    <div key={cardId} className="pick-order-row">
                      <span className="pick-order-num">{i + 1}</span>
                      <span className="pick-order-name">{card.name}</span>
                      {sources.length > 1 && (
                        <span className="pick-order-zone">{ZONE_DISPLAY_NAMES[fromZone]}</span>
                      )}
                      <div className="pick-order-btns">
                        <button className="icon-btn" onClick={() => moveUp(i)} disabled={i === 0}>▲</button>
                        <button className="icon-btn" onClick={() => moveDown(i)} disabled={i === orderedIds.length - 1}>▼</button>
                        <button className="icon-btn danger" onClick={() => toggleCard(cardId)}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="display-zone-actions">
          {isOrderedDest ? (
            <>
              <button
                className="btn btn-primary"
                onClick={confirmOrdered}
                disabled={orderedIds.length === 0}
              >
                確定（この順番で）
              </button>
              <button
                className="btn btn-secondary"
                onClick={confirmShuffled}
                disabled={orderedIds.length === 0}
              >
                🔀 シャッフルして確定
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={confirmOrdered}
              disabled={orderedIds.length === 0}
            >
              確定（{orderedIds.length}枚）
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'CANCEL_PICK' })}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
