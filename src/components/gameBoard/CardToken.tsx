import { useState, useEffect, useRef } from 'react';
import type { Card, ZoneId, MacroDestination, CardMenuLayout, CardMenuStackAction } from '../../types';
import { MACRO_DEST_NAMES } from '../../constants/zones';

interface Props {
  card: Card;
  faceDown?: boolean;
  allowTap?: boolean;
  menuDestinations?: MacroDestination[];
  menuStackActions?: CardMenuStackAction[];
  menuLayout?: CardMenuLayout;
  onTap?: () => void;
  onMoveTo?: (to: ZoneId | MacroDestination) => void;
  onStackTop?: () => void;
  onStackBottom?: () => void;
  onMultiStack?: () => void;
  isStackTarget?: boolean;
  onStackTargetClick?: () => void;
  selectionIndex?: number;
  onSelect?: () => void;
  selectable?: boolean;
  pickable?: boolean;
  picked?: boolean;
  onPick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  stackViewOnly?: boolean;
}

export function CardToken({
  card, faceDown, allowTap, menuDestinations, menuStackActions, menuLayout = 'vertical',
  onTap, onMoveTo, onStackTop, onStackBottom, onMultiStack, isStackTarget, onStackTargetClick,
  selectionIndex, onSelect, selectable, pickable, picked, onPick, onDragStart, stackViewOnly,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewingStack, setViewingStack] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const stackDepth = card.stack?.length ?? 0;

  if (faceDown) {
    return (
      <div
        className={`card-token face-down${isStackTarget ? ' stack-target' : ''}`}
        draggable={!!onDragStart}
        onDragStart={(e) => { onDragStart?.(e); }}
        onClick={() => {
          if (isStackTarget) { onStackTargetClick?.(); return; }
          setMenuOpen(!menuOpen);
        }}
        onContextMenu={(e) => { e.preventDefault(); if (!isStackTarget) setMenuOpen(!menuOpen); }}
      >
        <span>●</span>
        {stackDepth > 0 && <span className="stack-badge">▲{stackDepth}</span>}
        {isStackTarget && <span className="stack-target-hint">▼</span>}
        {menuOpen && (
          <div
            ref={menuRef}
            className={`card-menu card-menu-${menuLayout}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {(menuDestinations ?? []).map((dest) => (
              <button key={dest} onClick={() => { onMoveTo?.(dest); setMenuOpen(false); }}>
                → {MACRO_DEST_NAMES[dest]}
              </button>
            ))}
            <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
          </div>
        )}
      </div>
    );
  }

  if (selectable) {
    return (
      <div
        className={`card-token selectable ${selectionIndex !== undefined ? 'selected' : ''}`}
        onClick={onSelect}
      >
        {selectionIndex !== undefined && <span className="selection-badge">{selectionIndex + 1}</span>}
        <span className="card-token-name">{card.name}</span>
        {stackDepth > 0 && <span className="stack-badge">▲{stackDepth}</span>}
      </div>
    );
  }

  if (pickable) {
    return (
      <div
        className={`card-token pickable ${picked ? 'picked' : ''}`}
        onClick={onPick}
      >
        {picked && <span className="pick-check">✓</span>}
        <span className="card-token-name">{card.name}</span>
        {stackDepth > 0 && <span className="stack-badge">▲{stackDepth}</span>}
      </div>
    );
  }

  const destinations = menuDestinations ?? [];
  const stackActions = menuStackActions ?? [];

  if (stackViewOnly && (card.stack?.length ?? 0) === 0) {
    return (
      <div className={`card-token ${card.tapped ? 'tapped' : ''}`} style={{ cursor: 'default' }}>
        <span className="card-token-name">{card.name}</span>
      </div>
    );
  }

  return (
    <div
      className={`card-token ${card.tapped ? 'tapped' : ''}${isStackTarget ? ' stack-target' : ''}`}
      draggable={!!onDragStart}
      onDragStart={(e) => { setMenuOpen(false); onDragStart?.(e); }}
      onClick={() => {
        if (isStackTarget) { onStackTargetClick?.(); return; }
        if (stackViewOnly) { setViewingStack(true); return; }
        if (allowTap) onTap?.();
        else setMenuOpen(!menuOpen);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!isStackTarget && !stackViewOnly) setMenuOpen(!menuOpen);
      }}
    >
      <span className="card-token-name">{card.name}</span>
      {stackDepth > 0 && <span className="stack-badge">▲{stackDepth}</span>}
      {isStackTarget && <span className="stack-target-hint">▼</span>}
      {menuOpen && (
        <div
          ref={menuRef}
          className={`card-menu card-menu-${menuLayout}`}
          onClick={(e) => e.stopPropagation()}
        >
          {allowTap && (
            <button onClick={() => { onTap?.(); setMenuOpen(false); }}>
              {card.tapped ? 'アンタップ' : 'タップ'}
            </button>
          )}
          {stackDepth > 0 && (
            <button onClick={() => { setViewingStack(true); setMenuOpen(false); }}>
              下を見る（{stackDepth}枚）
            </button>
          )}
          {destinations.map((dest) => (
            <button key={dest} onClick={() => { onMoveTo?.(dest); setMenuOpen(false); }}>
              → {MACRO_DEST_NAMES[dest]}
            </button>
          ))}
          {stackActions.includes('stackTop') && (
            <button onClick={() => { onStackTop?.(); setMenuOpen(false); }}>上に重ねる</button>
          )}
          {stackActions.includes('stackBottom') && (
            <button onClick={() => { onStackBottom?.(); setMenuOpen(false); }}>下に重ねる</button>
          )}
          {stackActions.includes('multiStack') && (
            <button onClick={() => { onMultiStack?.(); setMenuOpen(false); }}>複数枚重ねる</button>
          )}
          <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
      )}
      {viewingStack && card.stack && (
        <div className="stack-viewer" onClick={(e) => e.stopPropagation()}>
          <div className="stack-viewer-header">
            <span>重なっているカード</span>
            <button className="close-btn" onClick={() => setViewingStack(false)}>✕</button>
          </div>
          {card.stack.map((c, i) => (
            <div key={c.id} className="stack-viewer-row">
              <span className="stack-viewer-index">{i + 1}枚下</span>
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
