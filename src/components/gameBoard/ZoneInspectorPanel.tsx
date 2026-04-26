import { useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import { ZONE_DISPLAY_NAMES } from '../../constants/zones';
import type { ZoneId } from '../../types';

const INSPECT_ZONES: ZoneId[] = ['deck', 'hand', 'battleZone', 'manaZone', 'graveyard', 'shieldZone', 'displayZone'];

interface Props {
  open: boolean;
}

export function ZoneInspectorPanel({ open }: Props) {
  const { state } = useGameContext();
  const [expandedZone, setExpandedZone] = useState<ZoneId | null>(null);

  if (!open) return null;

  return (
    <div className="zone-inspector-side">
      <div className="zone-inspector-side-title">ゾーン確認</div>
      {INSPECT_ZONES.map((zoneId) => {
        const cards = state.board[zoneId];
        const isExpanded = expandedZone === zoneId;
        return (
          <div key={zoneId} className="zone-inspector-item">
            <div
              className="zone-inspector-header"
              onClick={() => setExpandedZone(isExpanded ? null : zoneId)}
            >
              <span className="zone-inspector-name">{ZONE_DISPLAY_NAMES[zoneId]}</span>
              <span className="zone-inspector-count">{cards.length}枚</span>
              <span className="zone-inspector-toggle">{isExpanded ? '▲' : '▼'}</span>
            </div>
            {isExpanded && (
              <div className="zone-inspector-cards">
                {cards.length === 0 ? (
                  <span className="zone-inspector-empty">空</span>
                ) : (
                  cards.map((c, i) => (
                    <div key={c.id} className="zone-inspector-card">
                      <span className="zone-inspector-idx">{i + 1}</span>
                      <span className="zone-inspector-card-name">{c.name}</span>
                      {c.tapped && <span className="zone-inspector-tapped">T</span>}
                      {(c.stack?.length ?? 0) > 0 && <span className="zone-inspector-stack">▲{c.stack!.length}</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
