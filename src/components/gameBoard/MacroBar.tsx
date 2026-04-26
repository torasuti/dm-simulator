import { useState } from 'react';
import type { Macro } from '../../types';
import { useMacroRunner } from '../../hooks/useMacroRunner';
import { useGameContext } from '../../context/GameContext';

interface Props {
  macros: Macro[];
  locked?: boolean;
}

function MacroCounterWidget({ macro, value, locked }: { macro: Macro; value: number; locked?: boolean }) {
  const { dispatch } = useGameContext();
  const [inputMode, setInputMode] = useState(false);
  const [inputVal, setInputVal] = useState('');

  function commitInput() {
    const v = parseInt(inputVal);
    if (!isNaN(v)) dispatch({ type: 'SET_MACRO_COUNTER', macroId: macro.id, value: v });
    setInputMode(false);
  }

  const initial = macro.counter!.initialValue;

  return (
    <div className="macro-counter-widget">
      {macro.counter!.label && <span className="macro-counter-label">{macro.counter!.label}</span>}
      <button
        className="macro-counter-btn"
        disabled={locked || value <= 0}
        onClick={() => dispatch({ type: 'CHANGE_MACRO_COUNTER', macroId: macro.id, delta: -1 })}
      >－</button>
      {inputMode ? (
        <input
          className="macro-counter-input"
          type="number"
          min={0}
          value={inputVal}
          autoFocus
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commitInput}
          onKeyDown={(e) => { if (e.key === 'Enter') commitInput(); if (e.key === 'Escape') setInputMode(false); }}
        />
      ) : (
        <span
          className="macro-counter-value"
          title="クリックで直接入力"
          onClick={() => { if (!locked) { setInputVal(String(value)); setInputMode(true); } }}
        >{value}</span>
      )}
      <button
        className="macro-counter-btn"
        disabled={locked}
        onClick={() => dispatch({ type: 'CHANGE_MACRO_COUNTER', macroId: macro.id, delta: 1 })}
      >＋</button>
      {value !== initial && (
        <button
          className="macro-counter-reset"
          disabled={locked}
          title={`初期値(${initial})に戻す`}
          onClick={() => dispatch({ type: 'SET_MACRO_COUNTER', macroId: macro.id, value: initial })}
        >↺</button>
      )}
    </div>
  );
}

export function MacroBar({ macros, locked }: Props) {
  const { runMacro } = useMacroRunner();
  const { state } = useGameContext();

  if (macros.length === 0) {
    return (
      <div className="macro-bar empty">
        <span>マクロなし（デッキ編集から追加できます）</span>
      </div>
    );
  }

  return (
    <div className="macro-bar">
      <span className="macro-bar-label">マクロ:</span>
      {macros.map((macro) => (
        <div key={macro.id} className="macro-bar-item">
          <button
            className="macro-btn"
            disabled={locked}
            onClick={() => runMacro(macro)}
          >
            {macro.name}
          </button>
          {macro.counter?.enabled && (
            <MacroCounterWidget
              macro={macro}
              value={state.macroCounterValues[macro.id] ?? macro.counter.initialValue}
              locked={locked}
            />
          )}
        </div>
      ))}
    </div>
  );
}
