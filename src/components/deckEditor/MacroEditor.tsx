import { useState } from 'react';
import type { Macro, MacroAction } from '../../types';
import { MacroStepForm } from './MacroStepForm';
import { Button } from '../shared/Button';

interface Props {
  macros: Macro[];
  onChange: (macros: Macro[]) => void;
}

function newMacro(): Macro {
  return { id: crypto.randomUUID(), name: '新しいマクロ', steps: [] };
}

export function MacroEditor({ macros, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = macros.find((m) => m.id === editingId);

  function updateMacro(updated: Macro) {
    onChange(macros.map((m) => (m.id === updated.id ? updated : m)));
  }

  function handleAdd() {
    const m = newMacro();
    onChange([...macros, m]);
    setEditingId(m.id);
  }

  function handleDelete(id: string) {
    onChange(macros.filter((m) => m.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function addStep(type: MacroAction['type']) {
    if (!editing) return;
    let step: MacroAction;
    if (type === 'MOVE_TOP_TO_ZONE') step = { type: 'MOVE_TOP_TO_ZONE', n: 1, destination: 'graveyard' };
    else if (type === 'REVEAL_AND_SELECT') step = { type: 'REVEAL_AND_SELECT', n: 3, destinations: ['hand', 'graveyard', 'manaZone'] };
    else if (type === 'PICK_FROM_ZONE') step = { type: 'PICK_FROM_ZONE', sources: ['graveyard'], count: 1, destination: 'hand' };
    else if (type === 'SHUFFLE') step = { type: 'SHUFFLE', zoneId: 'deck' };
    else if (type === 'GR_SUMMON_MACRO') step = { type: 'GR_SUMMON_MACRO' };
    else if (type === 'MULTI_EVOLVE') step = { type: 'MULTI_EVOLVE', evolutionSources: ['hand'], baseSources: ['battleZone'], baseCount: 1, destination: 'battleZone' };
    else step = { type: 'PICK_FROM_ZONE_LOOP', sources: ['graveyard'], destination: 'hand' };
    updateMacro({ ...editing, steps: [...editing.steps, step] });
  }

  return (
    <div className="macro-editor">
      <div className="macro-list">
        {macros.map((m) => (
          <div key={m.id} className={`macro-item ${editingId === m.id ? 'active' : ''}`}>
            <span className="macro-item-name" onClick={() => setEditingId(m.id === editingId ? null : m.id)}>
              {m.name}
              <span className="macro-step-count">({m.steps.length}ステップ)</span>
            </span>
            <button className="icon-btn danger" onClick={() => handleDelete(m.id)}>🗑</button>
          </div>
        ))}
        <Button variant="primary" onClick={handleAdd}>＋ マクロ追加</Button>
      </div>

      {editing && (
        <div className="macro-detail">
          <div className="macro-name-row">
            <input
              type="text"
              value={editing.name}
              onChange={(e) => updateMacro({ ...editing, name: e.target.value })}
              className="text-input"
              placeholder="マクロ名"
            />
          </div>

          <div className="macro-counter-config">
            <label className="config-toggle" style={{ marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={editing.counter?.enabled ?? false}
                onChange={(e) => updateMacro({
                  ...editing,
                  counter: { enabled: e.target.checked, label: editing.counter?.label ?? '', initialValue: editing.counter?.initialValue ?? 0 },
                })}
              />
              カウンター表示
            </label>
            {editing.counter?.enabled && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                <input
                  className="text-input"
                  style={{ width: 120 }}
                  placeholder="ラベル（任意）"
                  value={editing.counter.label ?? ''}
                  onChange={(e) => updateMacro({ ...editing, counter: { ...editing.counter!, label: e.target.value } })}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>初期値:</span>
                <input
                  className="text-input num-input"
                  type="number"
                  min={0}
                  value={editing.counter.initialValue}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 0) updateMacro({ ...editing, counter: { ...editing.counter!, initialValue: v } });
                  }}
                />
              </div>
            )}
          </div>

          <div className="macro-steps">
            {editing.steps.map((step, i) => (
              <MacroStepForm
                key={i}
                step={step}
                index={i}
                onChange={(updated) => {
                  const steps = [...editing.steps];
                  steps[i] = updated;
                  updateMacro({ ...editing, steps });
                }}
                onRemove={() => {
                  updateMacro({ ...editing, steps: editing.steps.filter((_, j) => j !== i) });
                }}
              />
            ))}
          </div>

          <div className="add-step-buttons">
            <span>ステップ追加:</span>
            <Button size="sm" onClick={() => addStep('MOVE_TOP_TO_ZONE')}>山上移動</Button>
            <Button size="sm" onClick={() => addStep('REVEAL_AND_SELECT')}>公開選択</Button>
            <Button size="sm" onClick={() => addStep('PICK_FROM_ZONE')}>ゾーン選択</Button>
            <Button size="sm" onClick={() => addStep('MULTI_EVOLVE')}>進化</Button>
            <Button size="sm" onClick={() => addStep('SHUFFLE')}>シャッフル</Button>
            <Button size="sm" onClick={() => addStep('GR_SUMMON_MACRO')}>GR召喚</Button>
          </div>
        </div>
      )}
    </div>
  );
}
