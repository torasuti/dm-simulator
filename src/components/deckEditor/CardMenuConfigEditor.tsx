import type { CardMenuConfig, CardMenuLayout, MacroDestination, CardMenuStackAction } from '../../types';
import { CARD_MENU_DESTINATIONS, MACRO_DEST_NAMES } from '../../constants/zones';

const STACK_ACTION_NAMES: Record<CardMenuStackAction, string> = {
  stackTop: '上に重ねる',
  stackBottom: '下に重ねる',
  multiStack: '複数枚重ねる',
};

interface Props {
  config: CardMenuConfig;
  onChange: (config: CardMenuConfig) => void;
}

export function CardMenuConfigEditor({ config, onChange }: Props) {
  function toggleDest(dest: MacroDestination) {
    const has = config.destinations.includes(dest);
    const next = has
      ? config.destinations.filter((d) => d !== dest)
      : [...config.destinations, dest];
    const ordered = CARD_MENU_DESTINATIONS.filter((d) => next.includes(d));
    onChange({ ...config, destinations: ordered });
  }

  function toggleStack(action: CardMenuStackAction) {
    const current = config.stackActions ?? [];
    const next = current.includes(action) ? current.filter((a) => a !== action) : [...current, action];
    onChange({ ...config, stackActions: next });
  }

  function toggleMultiStackDest(dest: MacroDestination) {
    const current = config.multiStackDestinations ?? ['battleZone', 'shieldZone'];
    const next = current.includes(dest) ? current.filter((d) => d !== dest) : [...current, dest];
    const ordered = CARD_MENU_DESTINATIONS.filter((d) => next.includes(d));
    onChange({ ...config, multiStackDestinations: ordered });
  }

  return (
    <div className="card-menu-config">
      <h3 className="section-title">カードメニュー設定</h3>
      <p className="zone-config-hint">カードをクリックしたとき表示される送り先を選択してください。</p>

      <div className="card-menu-layout-row">
        <span>メニュー方向:</span>
        {(['vertical', 'horizontal'] as CardMenuLayout[]).map((l) => (
          <label key={l} className="config-toggle">
            <input type="radio" name="menuLayout" value={l}
              checked={config.layout === l}
              onChange={() => onChange({ ...config, layout: l })} />
            {l === 'vertical' ? '縦' : '横'}
          </label>
        ))}
      </div>

      <div className="card-menu-dest-list">
        {CARD_MENU_DESTINATIONS.map((dest) => (
          <label key={dest} className="config-toggle card-menu-dest-item">
            <input
              type="checkbox"
              checked={config.destinations.includes(dest)}
              onChange={() => toggleDest(dest)}
            />
            {MACRO_DEST_NAMES[dest]}
          </label>
        ))}
      </div>

      <div className="card-menu-stack-section">
        <p className="zone-config-hint" style={{ marginBottom: 6 }}>重ね合わせアクション（ダブルクリックメニューに表示）:</p>
        <div className="card-menu-dest-list">
          {(['stackTop', 'stackBottom', 'multiStack'] as CardMenuStackAction[]).map((action) => (
            <label key={action} className="config-toggle card-menu-dest-item">
              <input
                type="checkbox"
                checked={(config.stackActions ?? []).includes(action)}
                onChange={() => toggleStack(action)}
              />
              {STACK_ACTION_NAMES[action]}
            </label>
          ))}
        </div>
        {(config.stackActions ?? []).includes('multiStack') && (
          <div style={{ marginTop: 8, paddingLeft: 16 }}>
            <p className="zone-config-hint" style={{ marginBottom: 4 }}>「複数枚重ねる」の送り先ゾーン:</p>
            <div className="card-menu-dest-list">
              {CARD_MENU_DESTINATIONS.map((dest) => (
                <label key={dest} className="config-toggle card-menu-dest-item">
                  <input
                    type="checkbox"
                    checked={(config.multiStackDestinations ?? ['battleZone', 'shieldZone']).includes(dest)}
                    onChange={() => toggleMultiStackDest(dest)}
                  />
                  {MACRO_DEST_NAMES[dest]}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card-menu-preview">
        <span className="zone-config-hint">プレビュー:</span>
        <div className={`card-menu-preview-inner card-menu-${config.layout}`}>
          {config.destinations.map((dest) => (
            <div key={dest} className="card-menu-preview-item">→ {MACRO_DEST_NAMES[dest]}</div>
          ))}
          {(config.stackActions ?? []).map((action) => (
            <div key={action} className="card-menu-preview-item">{STACK_ACTION_NAMES[action]}</div>
          ))}
          <div className="card-menu-preview-item close-btn">✕</div>
        </div>
      </div>
    </div>
  );
}
