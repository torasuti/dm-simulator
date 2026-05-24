import { useMemo, useState } from 'react';
import { Button } from '../shared/Button';
import { parseDeckText, type ParsedTextDeck } from '../../utils/textDeckParser';

interface Props {
  onImport: (deck: ParsedTextDeck) => void;
  onClose: () => void;
}

export function TextImportDialog({ onImport, onClose }: Props) {
  const [deckName, setDeckName] = useState('');
  const [text, setText] = useState('');
  const parsed = useMemo(() => parseDeckText(text, deckName.trim() || '新しいデッキ'), [text, deckName]);
  const totalCards = parsed.cardNames.length + parsed.grCardNames.length + parsed.superDimCardNames.length;

  function handleImport() {
    if (totalCards === 0) return;
    onImport(parsed);
  }

  const preview = parsed.cardNames.slice(0, 8);

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
            カード名を1行1枚、または番号付きのデッキリストを貼り付けてください。<br />
            複数列の番号表、GRゾーン、超次元ゾーンも読み取ります。
          </p>
          <textarea
            className="text-input"
            style={{ height: 220, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
            placeholder={'1 異端流し オニカマス 21 ウェディング・ゲート\n2 異端流し オニカマス 22 ウェディング・ゲート\n超GRゾーン\n1 堕魔 ドゥザイコ GR'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {totalCards > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              メイン {parsed.cardNames.length}枚
              {parsed.grCardNames.length > 0 && ` / GR ${parsed.grCardNames.length}枚`}
              {parsed.superDimCardNames.length > 0 && ` / 超次元 ${parsed.superDimCardNames.length}枚`}
              {parsed.specialCard !== 'none' && ` / 特殊 ${parsed.specialCard === 'zero' ? 'ゼーロ' : parsed.specialCard === 'dolmagedon' ? 'ドルマゲドン' : '禁断'}`}
              {preview.length > 0 && `（例: ${preview.join('、')}）`}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button variant="primary" onClick={handleImport} disabled={totalCards === 0}>
            デッキ作成
          </Button>
        </div>
      </div>
    </div>
  );
}
