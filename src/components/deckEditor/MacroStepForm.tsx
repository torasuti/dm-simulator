import type { MacroAction, MacroDestination, ZoneId } from '../../types';
import { MACRO_DESTINATIONS, MACRO_DEST_NAMES, ZONE_DISPLAY_NAMES, ALL_ZONE_IDS } from '../../constants/zones';

interface Props {
  step: MacroAction;
  index: number;
  onChange: (step: MacroAction) => void;
  onRemove: () => void;
}

const SOURCE_ZONES: ZoneId[] = ALL_ZONE_IDS.filter((z) => z !== 'displayZone');

export function MacroStepForm({ step, index, onChange, onRemove }: Props) {
  function handleTypeChange(type: MacroAction['type']) {
    if (type === 'MOVE_TOP_TO_ZONE') onChange({ type: 'MOVE_TOP_TO_ZONE', n: 1, destination: 'graveyard' });
    else if (type === 'REVEAL_AND_SELECT') onChange({ type: 'REVEAL_AND_SELECT', n: 3, destinations: ['hand', 'graveyard', 'manaZone'] });
    else if (type === 'PICK_FROM_ZONE') onChange({ type: 'PICK_FROM_ZONE', sources: ['graveyard'], count: 1, destination: 'deckBottom' });
    else if (type === 'PICK_FROM_ZONE_LOOP') onChange({ type: 'PICK_FROM_ZONE_LOOP', sources: ['graveyard'], destination: 'deckBottom' });
    else if (type === 'SHUFFLE') onChange({ type: 'SHUFFLE', zoneId: 'deck' });
    else if (type === 'GR_SUMMON_MACRO') onChange({ type: 'GR_SUMMON_MACRO' });
    else if (type === 'MULTI_EVOLVE') onChange({ type: 'MULTI_EVOLVE', evolutionSources: ['hand'], baseSources: ['battleZone'], baseCount: 1, destination: 'battleZone' });
    else if (type === 'MULTI_EVOLVE_LOOP') onChange({ type: 'MULTI_EVOLVE_LOOP', evolutionSources: ['hand'], baseSources: ['battleZone'], destination: 'battleZone' });
  }

  return (
    <div className="macro-step">
      <span className="step-index">{index + 1}</span>

      <select value={step.type} onChange={(e) => handleTypeChange(e.target.value as MacroAction['type'])} className="select-input">
        <option value="MOVE_TOP_TO_ZONE">山上N枚を移動</option>
        <option value="REVEAL_AND_SELECT">山上N枚公開して選択</option>
        <option value="PICK_FROM_ZONE">ゾーンからN枚選んで移動</option>
        <option value="PICK_FROM_ZONE_LOOP">ゾーンから何枚でも選んで移動（✕で終了）</option>
        <option value="MULTI_EVOLVE">進化（枚数）</option>
        <option value="MULTI_EVOLVE_LOOP">進化（∞）</option>
        <option value="SHUFFLE">シャッフル</option>
        <option value="GR_SUMMON_MACRO">GR召喚</option>
      </select>

      {step.type === 'MOVE_TOP_TO_ZONE' && (
        <>
          <label className="step-inline">
            <span>枚数</span>
            <input type="number" min={1} max={20} value={step.n}
              onChange={(e) => onChange({ ...step, n: parseInt(e.target.value) || 1 })}
              className="text-input num-input" />
          </label>
          <label className="step-inline">
            <span>送り先</span>
            <select value={step.destination}
              onChange={(e) => onChange({ ...step, destination: e.target.value as MacroDestination })}
              className="select-input">
              {MACRO_DESTINATIONS.map((d) => <option key={d} value={d}>{MACRO_DEST_NAMES[d]}</option>)}
            </select>
          </label>
        </>
      )}

      {step.type === 'REVEAL_AND_SELECT' && (
        <>
          <label className="step-inline">
            <span>公開枚数</span>
            <input type="number" min={1} max={20} value={step.n}
              onChange={(e) => onChange({ ...step, n: parseInt(e.target.value) || 1 })}
              className="text-input num-input" />
          </label>
          <div className="destinations-editor">
            <span className="destinations-label">送り先（クリック順）:</span>
            {step.destinations.map((dest, i) => (
              <div key={i} className="destination-row">
                <span className="dest-index">{i < step.destinations.length - 1 ? `${i + 1}番目` : '残り全部'}</span>
                <select value={dest}
                  onChange={(e) => {
                    const next = [...step.destinations];
                    next[i] = e.target.value as MacroDestination;
                    onChange({ ...step, destinations: next });
                  }}
                  className="select-input">
                  {MACRO_DESTINATIONS.map((d) => <option key={d} value={d}>{MACRO_DEST_NAMES[d]}</option>)}
                </select>
                {i < step.destinations.length - 1 && (
                  <button className="icon-btn danger"
                    onClick={() => onChange({ ...step, destinations: step.destinations.filter((_, j) => j !== i) })}>✕</button>
                )}
              </div>
            ))}
            <button className="btn btn-secondary btn-sm"
              onClick={() => onChange({ ...step, destinations: [...step.destinations.slice(0, -1), 'hand', step.destinations[step.destinations.length - 1]] })}>
              ＋ 送り先を追加
            </button>
          </div>
        </>
      )}

      {(step.type === 'PICK_FROM_ZONE' || step.type === 'PICK_FROM_ZONE_LOOP') && (
        <>
          <div className="step-inline step-sources">
            <span>開くゾーン（複数可）</span>
            <div className="sources-checkboxes">
              {SOURCE_ZONES.map((z) => {
                const currentSources: ZoneId[] = (step as { sources?: ZoneId[] }).sources ?? [];
                return (
                  <label key={z} className="source-checkbox-label">
                    <input
                      type="checkbox"
                      checked={currentSources.includes(z)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...currentSources, z]
                          : currentSources.filter((s) => s !== z);
                        if (next.length > 0) onChange({ ...step, sources: next } as typeof step);
                      }}
                    />
                    {ZONE_DISPLAY_NAMES[z]}
                  </label>
                );
              })}
            </div>
          </div>
          {step.type === 'PICK_FROM_ZONE' && (
            <label className="step-inline">
              <span>選ぶ枚数</span>
              <input type="number" min={1} max={40} value={step.count}
                onChange={(e) => onChange({ ...step, count: parseInt(e.target.value) || 1 })}
                className="text-input num-input" />
            </label>
          )}
          <label className="step-inline">
            <span>送り先</span>
            <select value={step.destination}
              onChange={(e) => onChange({ ...step, destination: e.target.value as MacroDestination })}
              className="select-input">
              {MACRO_DESTINATIONS.map((d) => <option key={d} value={d}>{MACRO_DEST_NAMES[d]}</option>)}
            </select>
          </label>
        </>
      )}

      {(step.type === 'MULTI_EVOLVE' || step.type === 'MULTI_EVOLVE_LOOP') && (
        <>
          <div className="step-inline step-sources">
            <span>一番上のカードのゾーン（複数可）</span>
            <div className="sources-checkboxes">
              {SOURCE_ZONES.map((z) => (
                <label key={z} className="source-checkbox-label">
                  <input
                    type="checkbox"
                    checked={step.evolutionSources.includes(z)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...step.evolutionSources, z]
                        : step.evolutionSources.filter((s) => s !== z);
                      if (next.length > 0) onChange({ ...step, evolutionSources: next });
                    }}
                  />
                  {ZONE_DISPLAY_NAMES[z]}
                </label>
              ))}
            </div>
          </div>
          <div className="step-inline step-sources">
            <span>進化元ゾーン（複数可）</span>
            <div className="sources-checkboxes">
              {SOURCE_ZONES.map((z) => (
                <label key={z} className="source-checkbox-label">
                  <input
                    type="checkbox"
                    checked={step.baseSources.includes(z)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...step.baseSources, z]
                        : step.baseSources.filter((s) => s !== z);
                      if (next.length > 0) onChange({ ...step, baseSources: next });
                    }}
                  />
                  {ZONE_DISPLAY_NAMES[z]}
                </label>
              ))}
            </div>
          </div>
          {step.type === 'MULTI_EVOLVE' && (
            <label className="step-inline">
              <span>進化元枚数</span>
              <input type="number" min={1} max={10} value={step.baseCount}
                onChange={(e) => onChange({ ...step, baseCount: parseInt(e.target.value) || 1 })}
                className="text-input num-input" />
            </label>
          )}
          <label className="step-inline">
            <span>送り先</span>
            <select value={step.destination}
              onChange={(e) => onChange({ ...step, destination: e.target.value as MacroDestination })}
              className="select-input">
              {MACRO_DESTINATIONS.map((d) => <option key={d} value={d}>{MACRO_DEST_NAMES[d]}</option>)}
            </select>
          </label>
        </>
      )}

      {step.type === 'SHUFFLE' && (
        <label className="step-inline">
          <span>対象ゾーン</span>
          <select value={step.zoneId}
            onChange={(e) => onChange({ ...step, zoneId: e.target.value as ZoneId })}
            className="select-input">
            {SOURCE_ZONES.map((z) => <option key={z} value={z}>{ZONE_DISPLAY_NAMES[z]}</option>)}
          </select>
        </label>
      )}

      <button className="icon-btn danger step-remove" onClick={onRemove}>🗑</button>
    </div>
  );
}
