import { useState } from 'react';
import type { Card } from '../../types';
import { createCard } from '../../utils/deckUtils';
import { fetchDeckFromUrl } from '../../utils/fetchDeckCards';
import { Button } from '../shared/Button';

interface Props {
  cards: Card[];
  onChange: (cards: Card[]) => void;
  maxCards?: number;
  label?: string;
}

export function CardListEditor({ cards, onChange, maxCards, label }: Props) {
  const [input, setInput] = useState('');
  const [countInput, setCountInput] = useState('1');
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlProgress, setUrlProgress] = useState<{ current: number; total: number } | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  function handleAdd() {
    const name = input.trim();
    if (!name) return;
    const count = Math.max(1, Math.min(20, parseInt(countInput) || 1));
    const available = maxCards ? Math.max(0, maxCards - cards.length) : count;
    const newCards = Array.from({ length: Math.min(count, available) }, () => createCard(name));
    if (newCards.length === 0) return;
    onChange([...cards, ...newCards]);
    setInput('');
    setCountInput('1');
  }

  function handleBulkImport(text: string) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const newCards: Card[] = [];
    for (const line of lines) {
      const match = line.match(/^(\d+)[x×\s]+(.+)$/) || line.match(/^(.+?)\s+(\d+)$/);
      if (match) {
        const [, a, b] = match;
        const count = parseInt(a);
        const name = isNaN(count) ? a : b;
        const n = isNaN(count) ? parseInt(b) : count;
        Array.from({ length: Math.max(1, Math.min(20, n || 1)) }, () => newCards.push(createCard(name.trim())));
      } else {
        newCards.push(createCard(line));
      }
    }
    onChange([...cards, ...newCards]);
  }

  async function handleUrlImport() {
    const url = urlInput.trim();
    if (!url) return;
    setUrlLoading(true);
    setUrlError(null);
    setUrlProgress(null);
    try {
      const { cardNames } = await fetchDeckFromUrl(url, (current, total) => {
        setUrlProgress({ current, total });
      });
      const newCards = cardNames.map((name) => createCard(name));
      onChange([...cards, ...newCards]);
      setUrlInput('');
      setUrlProgress(null);
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : 'インポートに失敗しました');
    } finally {
      setUrlLoading(false);
    }
  }

  function handleRemoveLast(name: string) {
    const idx = [...cards].map((c) => c.name).lastIndexOf(name);
    if (idx === -1) return;
    const next = [...cards];
    next.splice(idx, 1);
    onChange(next);
  }

  function handleRemoveAll(name: string) {
    onChange(cards.filter((c) => c.name !== name));
  }

  const grouped = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.name] = (acc[c.name] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="card-list-editor">
      <div className="add-card-form">
        <input
          type="text"
          placeholder="カード名"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="text-input flex-1"
        />
        <input
          type="number"
          min={1}
          max={20}
          value={countInput}
          onChange={(e) => setCountInput(e.target.value)}
          className="text-input count-input"
        />
        <Button variant="primary" onClick={handleAdd}>追加</Button>
      </div>

      <details className="bulk-import">
        <summary>URLインポート（ガチまとめ）</summary>
        <div className="url-import-form">
          <input
            type="text"
            placeholder="https://gachi-matome.com/deckrecipe-detail-dm/?tcgrevo_deck_maker_deck_id=..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !urlLoading && handleUrlImport()}
            className="text-input flex-1"
            disabled={urlLoading}
          />
          <Button variant="primary" onClick={handleUrlImport} disabled={urlLoading || !urlInput.trim()}>
            {urlLoading ? '取得中...' : 'インポート'}
          </Button>
        </div>
        {urlProgress && (
          <p className="url-import-progress">
            取得中: {urlProgress.current} / {urlProgress.total}枚
          </p>
        )}
        {urlError && <p className="url-import-error">{urlError}</p>}
      </details>

      <details className="bulk-import">
        <summary>一括インポート（テキスト）</summary>
        <textarea
          placeholder={'4 ボルシャック・ドラゴン\n4x マナ・クライシス\nヘブンズ・ゲート 2'}
          className="bulk-textarea"
          onBlur={(e) => {
            if (e.target.value.trim()) {
              handleBulkImport(e.target.value);
              e.target.value = '';
            }
          }}
        />
      </details>

      <div className="card-count-total">
        {label ? `${label} — ` : ''}合計: {cards.length}枚{maxCards ? ` / ${maxCards}枚` : ''}
        {maxCards && cards.length >= maxCards ? <span style={{ color: 'var(--accent)', marginLeft: 8 }}>上限に達しています</span> : null}
      </div>

      <div className="card-list">
        {Object.entries(grouped).map(([name, count]) => (
          <div key={name} className="card-row">
            <span className="card-count-badge">{count}</span>
            <span className="card-name-text">{name}</span>
            <div className="card-row-actions">
              <button className="icon-btn" onClick={() => onChange([...cards, createCard(name)])}>＋</button>
              <button className="icon-btn" onClick={() => handleRemoveLast(name)}>－</button>
              <button className="icon-btn danger" onClick={() => handleRemoveAll(name)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
