import { useGameContext } from '../../context/GameContext';
import { useAppContext } from '../../context/AppContext';
import { loadDeck } from '../../storage/localStorage';

export function GameControls() {
  const { state, dispatch } = useGameContext();
  const { dispatch: appDispatch } = useAppContext();

  function handleReset() {
    if (!confirm('ゲームをリセットしますか？')) return;
    const deck = loadDeck(state.deckId);
    if (deck) {
      dispatch({ type: 'INIT_GAME', deck });
    } else {
      dispatch({ type: 'RESET_GAME' });
    }
  }

  return (
    <div className="game-controls">
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => dispatch({ type: 'UNDO' })}
        disabled={state.history.length === 0}
      >
        ↩ Undo
      </button>
      {state.zoneConfigPresets.length > 1 && (
        <div className="preset-switcher">
          <span className="preset-switcher-label">レイアウト:</span>
          {state.zoneConfigPresets.map((p, i) => (
            <button
              key={i}
              className={`btn btn-sm ${i === state.activePresetIndex ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => dispatch({ type: 'SET_ZONE_PRESET', index: i })}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <button
        className={`btn btn-sm ${state.zoneConfigs.find(z => z.zoneId === 'grZone')?.visible ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => dispatch({ type: 'TOGGLE_ZONE_VISIBLE', zoneId: 'grZone' })}
      >GRゾーン</button>
      <button
        className={`btn btn-sm ${state.zoneConfigs.find(z => z.zoneId === 'superDimZone')?.visible ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => dispatch({ type: 'TOGGLE_ZONE_VISIBLE', zoneId: 'superDimZone' })}
      >超次元</button>
      <button className="btn btn-danger btn-sm" onClick={handleReset}>
        リセット
      </button>
      <button className="btn btn-ghost btn-sm" onClick={() => appDispatch({ type: 'NAVIGATE', page: 'deckList' })}>
        ← デッキ一覧
      </button>
    </div>
  );
}
