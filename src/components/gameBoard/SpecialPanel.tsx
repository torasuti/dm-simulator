import { useGameContext } from '../../context/GameContext';

const DOLMAGEDON_LABELS = ['破壊', 'スレイヤー', 'パワー', '爆発'];

export function SpecialPanel({ style }: { style?: React.CSSProperties }) {
  const { state, dispatch } = useGameContext();
  const { specialCard } = state;
  if (specialCard === 'none') return null;

  const panelName =
    specialCard === 'kindan' ? '禁断' :
    specialCard === 'dolmagedon' ? 'ドルマゲドン' : 'ゼーロ';

  function handleZero(ability: 'fukkatsu' | 'hakai' | 'graveyard' | 'hand') {
    if (state.zeroUsed[ability]) return;
    dispatch({ type: 'ZERO_ACTIVATE', ability });
    if (ability === 'fukkatsu') {
      dispatch({ type: 'MOVE_TOP_TO_ZONE', n: 2, from: 'deck', to: 'graveyard' });
    } else if (ability === 'hakai') {
      dispatch({ type: 'BEGIN_PICK', sources: ['graveyard'], destination: 'hand', maxCount: 1, remainingSteps: [] });
    } else if (ability === 'hand') {
      dispatch({ type: 'GR_SUMMON' });
    }
  }

  return (
    <div className="zone-panel special-panel" style={style}>
      <div className="zone-header">
        <span className="zone-label">{panelName}</span>
      </div>

      {specialCard === 'kindan' && (
        <div className="zone-stack-layout">
          <div className="zone-stack-info">
            <button
              className="btn btn-secondary btn-sm zone-stack-btn"
              onClick={() => dispatch({ type: 'KINDAN_PEEL' })}
              disabled={state.kindanCards.length === 0}
            >はがす</button>
          </div>
          <div className="stack-visual">
            {state.kindanCards.length > 0 ? (
              <>
                <div className="stack-card-back" />
                <span className="stack-count">{state.kindanCards.length}</span>
              </>
            ) : (
              <span className="empty-zone">空</span>
            )}
          </div>
        </div>
      )}

      {specialCard === 'dolmagedon' && (
        <div className="dolmagedon-slots">
          {DOLMAGEDON_LABELS.map((label, i) => (
            <div key={i} className="dolmagedon-slot">
              <span className={`dolmagedon-slot-indicator${state.dolmagedonSlots[i] ? ' filled' : ''}`} />
              <button
                className="btn btn-secondary btn-sm dolmagedon-btn"
                onClick={() => dispatch({ type: 'DOLMAGEDON_DESTROY', slot: i })}
                disabled={!state.dolmagedonSlots[i]}
              >{label}</button>
            </div>
          ))}
        </div>
      )}

      {specialCard === 'zero' && (
        <div className="zero-abilities">
          {(['fukkatsu', 'hakai', 'graveyard', 'hand'] as const).map((ability) => {
            const labels: Record<string, string> = { fukkatsu: '復活', hakai: '破壊', graveyard: '墓地', hand: '手札' };
            const used = state.zeroUsed[ability];
            return (
              <button
                key={ability}
                className={`btn btn-sm zero-ability-btn${used ? ' used' : ''}`}
                onClick={() => handleZero(ability)}
                disabled={used}
              >
                {labels[ability]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
