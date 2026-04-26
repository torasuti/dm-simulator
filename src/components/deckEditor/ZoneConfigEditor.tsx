import type { ZoneConfig, DisplayMode } from '../../types';

interface Props {
  configs: ZoneConfig[];
  onChange: (configs: ZoneConfig[]) => void;
}

const DISPLAY_MODES: { value: DisplayMode; label: string }[] = [
  { value: 'stack', label: '重ね（枚数表示）' },
  { value: 'spread', label: '横並び' },
  { value: 'grid', label: 'グリッド' },
  { value: 'fan', label: 'ファン' },
  { value: 'counter', label: 'カウンター（アンタップ/合計）' },
  { value: 'row', label: '横1行（重ね）' },
];

const GRID_COLS = 6;

function n(v: string, min = 1, max = 10): number {
  return Math.max(min, Math.min(max, parseInt(v) || min));
}

function ZoneLayoutPreview({ configs }: { configs: ZoneConfig[] }) {
  const visible = configs.filter((c) => c.visible);

  // Build a 2D occupancy map to detect which cells are filled
  const cells: Array<{ cfg: ZoneConfig; col: number }> = [];
  visible.forEach((cfg) => {
    for (let c = cfg.layoutCol; c < cfg.layoutCol + cfg.colSpan && c <= GRID_COLS; c++) {
      cells.push({ cfg, col: c });
    }
  });

  // Compute max row used
  const maxRow = Math.max(...visible.map((c) => c.layoutRow), 3);

  const rows = Array.from({ length: maxRow }, (_, ri) => ri + 1);

  return (
    <div className="zone-layout-preview">
      <div
        className="zone-layout-preview-grid"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${maxRow}, 40px)` }}
      >
        {/* empty background cells */}
        {rows.map((row) =>
          Array.from({ length: GRID_COLS }, (_, ci) => (
            <div key={`bg-${row}-${ci}`} className="zone-preview-cell-bg" style={{ gridRow: row, gridColumn: ci + 1 }} />
          ))
        )}
        {/* zone cells */}
        {visible.map((cfg) => (
          <div
            key={cfg.zoneId}
            className="zone-preview-cell"
            style={{
              gridRow: cfg.layoutRow,
              gridColumn: `${cfg.layoutCol} / span ${Math.min(cfg.colSpan, GRID_COLS - cfg.layoutCol + 1)}`,
            }}
          >
            <span className="zone-preview-label">{cfg.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ZoneConfigEditor({ configs, onChange }: Props) {
  const sorted = [...configs].sort((a, b) => a.order - b.order);

  function update(zoneId: string, patch: Partial<ZoneConfig>) {
    onChange(configs.map((c) => (c.zoneId === zoneId ? { ...c, ...patch } : c)));
  }

  return (
    <div className="zone-config-editor">
      <p className="zone-config-hint">
        ボード上の配置を「行・列・幅」で指定できます（6列グリッド）。<br />
        例: 山札(行1,列1,幅1) + 墓地(行1,列6,幅1) で同じ行の左右に配置。
      </p>

      <ZoneLayoutPreview configs={configs} />

      <div className="zone-config-list">
        {sorted.map((cfg) => (
          <div key={cfg.zoneId} className={`zone-config-item ${!cfg.visible ? 'zone-hidden' : ''}`}>
            <div className="zone-config-row zone-config-header-row">
              <input
                type="text"
                value={cfg.displayName}
                onChange={(e) => update(cfg.zoneId, { displayName: e.target.value })}
                className="text-input zone-name-input"
              />
              <label className="config-toggle">
                <input
                  type="checkbox"
                  checked={cfg.visible}
                  onChange={(e) => update(cfg.zoneId, { visible: e.target.checked })}
                />
                表示
              </label>
            </div>

            <div className="zone-config-row">
              <label className="config-field">
                <span>表示モード</span>
                <select
                  value={cfg.displayMode}
                  onChange={(e) => update(cfg.zoneId, { displayMode: e.target.value as DisplayMode })}
                  className="select-input"
                >
                  {DISPLAY_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>

              {cfg.displayMode === 'grid' && (
                <label className="config-field">
                  <span>グリッド列数</span>
                  <input
                    type="number" min={1} max={20} value={cfg.gridCols}
                    onChange={(e) => update(cfg.zoneId, { gridCols: n(e.target.value, 1, 20) })}
                    className="text-input num-input"
                  />
                </label>
              )}

              <label className="config-toggle">
                <input
                  type="checkbox"
                  checked={cfg.allowTap}
                  onChange={(e) => update(cfg.zoneId, { allowTap: e.target.checked })}
                />
                タップ可
              </label>
            </div>

            <div className="zone-config-row">
              <label className="config-field">
                <span>行（1〜8）</span>
                <input
                  type="number" min={1} max={8} value={cfg.layoutRow}
                  onChange={(e) => update(cfg.zoneId, { layoutRow: n(e.target.value, 1, 8) })}
                  className="text-input num-input"
                />
              </label>
              <label className="config-field">
                <span>列（1〜6）</span>
                <input
                  type="number" min={1} max={6} value={cfg.layoutCol}
                  onChange={(e) => update(cfg.zoneId, { layoutCol: n(e.target.value, 1, 6) })}
                  className="text-input num-input"
                />
              </label>
              <label className="config-field">
                <span>幅（列数）</span>
                <input
                  type="number" min={1} max={6} value={cfg.colSpan}
                  onChange={(e) => update(cfg.zoneId, { colSpan: n(e.target.value, 1, 6) })}
                  className="text-input num-input"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
