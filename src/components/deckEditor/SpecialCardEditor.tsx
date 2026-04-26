import type { SpecialCardType } from '../../types';

interface Props {
  value: SpecialCardType;
  onChange: (v: SpecialCardType) => void;
}

const OPTIONS: { value: SpecialCardType; label: string; desc: string }[] = [
  { value: 'none', label: 'なし', desc: '特殊カードなし' },
  { value: 'kindan', label: '禁断', desc: 'ゲーム開始時に山札から6枚配置。はがすで1枚ずつ墓地へ' },
  { value: 'dolmagedon', label: 'ドルマゲドン', desc: 'ゲーム開始時に山札から1枚ずつ4スロットへ。各ボタンで墓地へ' },
  { value: 'zero', label: 'ゼーロ', desc: '復活・破壊・墓地・手札の各効果を1回ずつ発動可能' },
];

export function SpecialCardEditor({ value, onChange }: Props) {
  return (
    <div className="special-card-editor">
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
        特殊カードはいずれか一つのみ採用できます。
      </p>
      {OPTIONS.map((opt) => (
        <label key={opt.value} className={`special-card-option${value === opt.value ? ' selected' : ''}`}>
          <input
            type="radio"
            name="specialCard"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <div>
            <span className="special-card-name">{opt.label}</span>
            <span className="special-card-desc">{opt.desc}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
