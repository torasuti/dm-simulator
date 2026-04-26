import type { ZoneId } from '../types';

interface DragState {
  cardId: string;
  fromZone: ZoneId;
}

let activeState: DragState | null = null;
let ghostEl: HTMLElement | null = null;

export function startTouchDrag(cardId: string, fromZone: ZoneId, x: number, y: number, label: string) {
  activeState = { cardId, fromZone };
  removeGhost();
  const el = document.createElement('div');
  el.className = 'touch-drag-ghost';
  el.textContent = label;
  document.body.appendChild(el);
  ghostEl = el;
  moveTouchGhost(x, y);
}

export function moveTouchGhost(x: number, y: number) {
  if (ghostEl) {
    ghostEl.style.left = `${x - 44}px`;
    ghostEl.style.top = `${y - 16}px`;
  }
}

export function endTouchDrag(x: number, y: number): { cardId: string; fromZone: ZoneId; toZone: ZoneId | null } | null {
  const state = activeState;
  activeState = null;
  removeGhost();
  if (!state) return null;
  const el = document.elementFromPoint(x, y);
  const zoneEl = el?.closest('[data-zone-id]');
  const toZone = (zoneEl?.getAttribute('data-zone-id') as ZoneId) ?? null;
  return { cardId: state.cardId, fromZone: state.fromZone, toZone };
}

export function isActiveTouchDrag() {
  return activeState !== null;
}

function removeGhost() {
  if (ghostEl) {
    ghostEl.remove();
    ghostEl = null;
  }
}
