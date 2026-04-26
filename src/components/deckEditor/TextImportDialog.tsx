import { useState } from 'react';
import { Button } from '../shared/Button';

interface Props {
  onImport: (name: string, cardNames: string[]) => void;
  onClose: () => void;
}

export function TextImportDialog({ onImport, onClose }: Props) {
  const [deckName, setDeckName] = useState('');
  const [text, setText] = useState('');

  function handleImport() {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // 行頭の番号・記号を除去 ("1." "1:" "1 " "No.1" など)
    const cardNames = lines.map((l) =>
      l.replace(/^(No\.?\s*)?[\d０-９]+[\s.:．：、\t]+/, '').trim()
    ).filter((n) => n.length > 0);

    if (cardNames.length === 0) return;
    onImport(deckName.trim() || '新しいデッキ', cardNames);
  }

  const preview = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^(No\.?\s*)?[\d０-９]+[\s.:．：、\t]+/, '').trim())
    .filter((n) => n.length > 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">テキストからデッキ作成</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            className="text-input"
            placeholder="デッキ名"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
          />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            カード名を1行1枚で貼り付けてください。<br />
            行頭の番号（「1.」「No.1」など）は自動で除去されます。
          </p>
          <textarea
            className="text-input"
            style={{ height: 220, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
            placeholder={'1. 龍覇 ザ=デッドマン\n2. 龍覇 ザ=デッドマン\n3. ...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {preview.length > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {preview.length}枚 認識済み
            </p>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button variant="primary" onClick={handleImport} disabled={preview.length === 0}>
            デッキ作成
          </Button>
        </div>
      </div>
    </div>
  );
}
