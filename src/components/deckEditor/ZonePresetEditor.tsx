import { useState } from 'react';
import type { ZoneConfigPreset, ZoneConfig } from '../../types';
import { ZoneConfigEditor } from './ZoneConfigEditor';

interface Props {
  presets: ZoneConfigPreset[];
  onChange: (presets: ZoneConfigPreset[]) => void;
}

export function ZonePresetEditor({ presets, onChange }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [editingName, setEditingName] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState('');

  const current = presets[activeIndex] ?? presets[0];

  function updateCurrentConfigs(configs: ZoneConfig[]) {
    const next = presets.map((p, i) => (i === activeIndex ? { ...p, configs } : p));
    onChange(next);
  }

  function addPreset() {
    const newPreset: ZoneConfigPreset = {
      name: `設定${presets.length + 1}`,
      configs: current.configs.map((c) => ({ ...c })),
    };
    const next = [...presets, newPreset];
    onChange(next);
    setActiveIndex(next.length - 1);
  }

  function deletePreset(i: number) {
    if (presets.length <= 1) return;
    const next = presets.filter((_, idx) => idx !== i);
    onChange(next);
    setActiveIndex(Math.min(activeIndex, next.length - 1));
  }

  function startRename(i: number) {
    setEditingName(i);
    setNameInput(presets[i].name);
  }

  function commitRename() {
    if (editingName === null) return;
    const name = nameInput.trim() || presets[editingName].name;
    const next = presets.map((p, i) => (i === editingName ? { ...p, name } : p));
    onChange(next);
    setEditingName(null);
  }

  return (
    <div className="zone-preset-editor">
      <div className="zone-preset-tabs">
        {presets.map((p, i) => (
          <div key={i} className={`zone-preset-tab ${i === activeIndex ? 'active' : ''}`}>
            {editingName === i ? (
              <input
                className="zone-preset-name-input"
                value={nameInput}
                autoFocus
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingName(null); }}
              />
            ) : (
              <span className="zone-preset-tab-label" onClick={() => setActiveIndex(i)} onDoubleClick={() => startRename(i)}>
                {p.name}
              </span>
            )}
            {presets.length > 1 && (
              <button className="zone-preset-delete" onClick={() => deletePreset(i)} title="削除">✕</button>
            )}
          </div>
        ))}
        <button className="zone-preset-add" onClick={addPreset} title="設定を追加（現在の設定をコピー）">＋</button>
      </div>

      <p className="zone-preset-hint">タブ名をダブルクリックで名前変更。＋で現在の設定をコピーして追加。</p>

      {current && (
        <ZoneConfigEditor
          configs={current.configs}
          onChange={updateCurrentConfigs}
        />
      )}
    </div>
  );
}
