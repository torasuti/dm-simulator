import { useState } from 'react';
import type { AbilityStockDef } from '../../types';
import { useGameContext } from '../../context/GameContext';

interface Props {
  group: AbilityStockDef;
  values: Record<string, number>;
  style?: React.CSSProperties;
}

function StockItem({ itemId, name, initialValue, value }: { itemId: string; name: string; initialValue: number; value: number }) {
  const { dispatch } = useGameContext();
  const [inputMode, setInputMode] = useState(false);
  const [inputVal, setInputVal] = useState('');

  function commitInput() {
    const v = parseInt(inputVal);
    if (!isNaN(v)) dispatch({ type: 'SET_ABILITY_STOCK', id: itemId, value: v });
    setInputMode(false);
  }

  return (
    <div className="ability-stock-item-row">
      {name && <div className="ability-stock-item-name">{name}</div>}
      <div className="ability-stock-body">
        <button
          className="ability-stock-btn"
          onClick={() => dispatch({ type: 'CHANGE_ABILITY_STOCK', id: itemId, delta: -1 })}
          disabled={value <= 0}
        >－</button>

        {inputMode ? (
          <input
            className="ability-stock-input"
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
            className="ability-stock-value"
            onClick={() => { setInputVal(String(value)); setInputMode(true); }}
            title="クリックで直接入力"
          >{value}</span>
        )}

        <button
          className="ability-stock-btn"
          onClick={() => dispatch({ type: 'CHANGE_ABILITY_STOCK', id: itemId, delta: 1 })}
        >＋</button>

        {value !== initialValue && (
          <button
            className="ability-stock-reset"
            onClick={() => dispatch({ type: 'SET_ABILITY_STOCK', id: itemId, value: initialValue })}
            title={`初期値(${initialValue})に戻す`}
          >↺</button>
        )}
      </div>
    </div>
  );
}

export function AbilityStockPanel({ group, values, style }: Props) {
  return (
    <div className="ability-stock-panel" style={style}>
      {group.name && <div className="ability-stock-name">{group.name}</div>}
      <div className="ability-stock-items">
        {group.stocks.map((item) => (
          <StockItem
            key={item.id}
            itemId={item.id}
            name={item.name}
            initialValue={item.initialValue}
            value={values[item.id] ?? item.initialValue}
          />
        ))}
      </div>
    </div>
  );
}
