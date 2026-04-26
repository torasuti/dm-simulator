import { useState, useRef, useLayoutEffect } from 'react';
import type { ZoneConfig, Card, ZoneId, MacroDestination, CardMenuConfig, PendingStack, CardMenuStackAction } from '../../types';
import { MACRO_DEST_NAMES } from '../../constants/zones';
import { CardToken } from './CardToken';
import { Modal } from '../shared/Modal';

interface Props {
  config: ZoneConfig;
  cards: Card[];
  style?: React.CSSProperties;
  cardMenuConfig: CardMenuConfig;
  onTapCard: (cardId: string) => void;
  onMoveCard: (cardId: string, to: ZoneId | MacroDestination) => void;
  onUntapAll: () => void;
  onShuffle: () => void;
  onDraw?: () => void;
  onBreak?: () => void;
  onGRSummon?: () => void;
  onDropCard?: (cardId: string, fromZone: ZoneId) => void;
  locked?: boolean;
  pendingStack?: PendingStack | null;
  onStackInit?: (cardId: string, mode: 'top' | 'bottom') => void;
  onStackTarget?: (cardId: string) => void;
  onMultiStackInit?: (cardId: string) => void;
}

export function ZonePanel({ config, cards, style, cardMenuConfig, onTapCard, onMoveCard, onUntapAll, onShuffle, onDraw, onBreak, onGRSummon, onDropCard, locked, pendingStack, onStackInit, onStackTarget, onMultiStackInit }: Props) {
  const [inspecting, setInspecting] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [rowOverlap, setRowOverlap] = useState(0);
  const dragCounter = useRef(0);
  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (config.displayMode !== 'row') return;
    const CARD_W = 76;
    const update = () => {
      const container = rowRef.current;
      if (!container) return;
      const W = container.clientWidth;
      const n = cards.length;
      if (n <= 1) { setRowOverlap(0); return; }
      const totalNormal = n * CARD_W + (n - 1) * 6;
      if (totalNormal <= W) { setRowOverlap(0); return; }
      const overlap = Math.min((n * CARD_W - W) / (n - 1), CARD_W - 20);
      setRowOverlap(Math.max(0, overlap));
    };
    update();
    const ro = new ResizeObserver(update);
    if (rowRef.current) ro.observe(rowRef.current);
    return () => ro.disconnect();
  }, [cards.length, config.displayMode]);

  function getCardDests(card: Card): MacroDestination[] {
    if (locked) return [];
    if (card.isGR) return ['grZoneBottom'];
    if (card.isSuperDim) return ['superDimZone'];
    return cardMenuConfig.destinations;
  }
  function getCardStackActions(card: Card): CardMenuStackAction[] {
    if (locked || card.isGR || card.isSuperDim) return [];
    return cardMenuConfig.stackActions ?? [];
  }

  const isStack = config.displayMode === 'stack';
  const isCounter = config.displayMode === 'counter';
  const isFaceDown = config.zoneId === 'shieldZone';

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOver(true);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOver(false);
    if (locked) return;
    const cardId = e.dataTransfer.getData('cardId');
    const fromZone = e.dataTransfer.getData('fromZone') as ZoneId;
    if (cardId && fromZone && fromZone !== config.zoneId) {
      onDropCard?.(cardId, fromZone);
    }
  };

  return (
    <div
      className={`zone-panel zone-${config.zoneId}${dragOver ? ' drag-over' : ''}`}
      data-mode={config.displayMode}
      data-zone-id={config.zoneId}
      style={style}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {isStack ? (
        <div className="zone-stack-layout">
          <div className="zone-stack-info">
            <span className="zone-label">{config.displayName}</span>
            {config.allowTap && <button className="btn btn-secondary btn-sm zone-stack-btn" onClick={onUntapAll}>アンタップ</button>}
            {config.zoneId === 'deck' && <button className="btn btn-secondary btn-sm zone-stack-btn" onClick={onDraw}>ドロー</button>}
            {config.zoneId === 'shieldZone' && <button className="btn btn-secondary btn-sm zone-stack-btn" onClick={onBreak} disabled={cards.length === 0}>ブレイク</button>}
            {config.zoneId === 'grZone' && <button className="btn btn-secondary btn-sm zone-stack-btn" onClick={onGRSummon} disabled={cards.length === 0}>GR召喚</button>}
          </div>
          <div className="stack-visual" onClick={() => setInspecting(true)}>
            {cards.length > 0 ? (
              <>
                <div className="stack-card-back" />
                <span className="stack-count">{cards.length}</span>
              </>
            ) : (
              <span className="empty-zone">空</span>
            )}
          </div>
        </div>
      ) : (
        <>
        <div className="zone-header">
          <span className="zone-label">{config.displayName}</span>
          <span className="zone-count">{cards.length}枚</span>
          <div className="zone-header-actions">
            {config.allowTap && <button className="btn btn-secondary btn-sm zone-header-btn" onClick={onUntapAll}>アンタップ</button>}
            {config.zoneId === 'deck' && <button className="btn btn-secondary btn-sm zone-header-btn" onClick={onDraw}>ドロー</button>}
            {config.zoneId === 'shieldZone' && <button className="btn btn-secondary btn-sm zone-header-btn" onClick={onBreak} disabled={cards.length === 0}>ブレイク</button>}
            {config.zoneId === 'deck' && <button className="icon-btn" onClick={onShuffle} title="シャッフル">🔀</button>}
            {(isFaceDown || isCounter) && cards.length > 0 && (
              <button className="icon-btn" onClick={() => setInspecting(true)} title="中身を見る">👁</button>
            )}
          </div>
        </div>

        <div
          className={`zone-cards zone-cards-${config.displayMode}`}
          ref={config.displayMode === 'row' ? rowRef : undefined}
          style={
            config.displayMode === 'grid' ? { '--grid-cols': config.gridCols } as React.CSSProperties :
            config.displayMode === 'row' ? { '--row-overlap': `${rowOverlap}px` } as React.CSSProperties :
            undefined
          }
        >
          {isCounter ? (
            <div className="mana-counter">
              <button
                className="mana-btn"
                title="マナを1使う（タップ）"
                disabled={!cards.some((c) => !c.tapped)}
                onClick={() => {
                  const card = cards.find((c) => !c.tapped);
                  if (card) onTapCard(card.id);
                }}
              >▲</button>
              <div className="mana-fraction">
                <span className="mana-available">{cards.filter((c) => !c.tapped).length}</span>
                <span className="mana-sep">/</span>
                <span className="mana-total">{cards.length}</span>
              </div>
              <button
                className="mana-btn"
                title="マナを1戻す（アンタップ）"
                disabled={!cards.some((c) => c.tapped)}
                onClick={() => {
                  const card = cards.find((c) => c.tapped);
                  if (card) onTapCard(card.id);
                }}
              >▼</button>
            </div>
          ) : (
          cards.map((card) => {
            const isTarget = !!pendingStack && pendingStack.sourceCardId !== card.id;
            return (
            <CardToken
              key={card.id}
              card={card}
              faceDown={isFaceDown}
              allowTap={locked ? false : config.allowTap}
              menuDestinations={getCardDests(card)}
              menuStackActions={pendingStack ? [] : getCardStackActions(card)}
              menuLayout={cardMenuConfig.layout}
              onTap={locked ? undefined : () => onTapCard(card.id)}
              onMoveTo={locked ? undefined : (to) => onMoveCard(card.id, to)}
              onStackTop={locked ? undefined : () => onStackInit?.(card.id, 'top')}
              onStackBottom={locked ? undefined : () => onStackInit?.(card.id, 'bottom')}
              onMultiStack={locked ? undefined : () => onMultiStackInit?.(card.id)}
              isStackTarget={isTarget}
              onStackTargetClick={isTarget ? () => onStackTarget?.(card.id) : undefined}
              onDragStart={locked || pendingStack ? undefined : (e) => {
                e.dataTransfer.setData('cardId', card.id);
                e.dataTransfer.setData('fromZone', config.zoneId);
                e.dataTransfer.effectAllowed = 'move';
              }}
              touchDragInfo={locked || pendingStack ? undefined : {
                cardId: card.id,
                fromZone: config.zoneId,
                label: isFaceDown ? '●' : card.name,
              }}
              stackViewOnly={locked}
            />
            );
          })
        )}
        </div>
        </>
      )}

      {inspecting && (
        <Modal
          title={`${config.displayName}（${cards.length}枚）`}
          onClose={() => { setInspecting(false); setRevealedIds(new Set()); }}
        >
          <div className="inspect-list">
            {cards.length === 0 ? (
              <p>カードがありません</p>
            ) : (
              cards.map((card, i) => {
                const isShield = config.zoneId === 'shieldZone';
                const revealed = revealedIds.has(card.id);
                const inspectDests = isShield
                  ? cardMenuConfig.destinations.filter((d) => d !== 'shieldZone')
                  : cardMenuConfig.destinations;
                return (
                  <div key={card.id} className="inspect-row">
                    <span className="inspect-index">{i + 1}</span>
                    <span className="inspect-name">{isShield && !revealed ? '●' : card.name}</span>
                    <div className="inspect-actions">
                      {isShield && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setRevealedIds((prev) => {
                            const next = new Set(prev);
                            revealed ? next.delete(card.id) : next.add(card.id);
                            return next;
                          })}
                        >{revealed ? '隠す' : 'カードを見る'}</button>
                      )}
                      {inspectDests.map((dest) => (
                        <button
                          key={dest}
                          className="btn btn-ghost btn-sm"
                          onClick={() => onMoveCard(card.id, dest)}
                        >
                          →{MACRO_DEST_NAMES[dest]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
