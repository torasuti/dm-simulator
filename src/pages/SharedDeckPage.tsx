import { useState, useEffect } from 'react';
import { loadSharedDeck, saveDeckCloud } from '../storage/cloudStorage';
import { useAuth } from '../context/AuthContext';
import type { DeckDefinition } from '../types';
import { Button } from '../components/shared/Button';

interface Props {
  shareId: string;
}

export function SharedDeckPage({ shareId }: Props) {
  const { user } = useAuth();
  const [deck, setDeck] = useState<DeckDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    loadSharedDeck(shareId).then((d) => { setDeck(d); setLoading(false); });
  }, [shareId]);

  async function handleImport() {
    if (!deck) return;
    const newDeck: DeckDefinition = {
      ...deck,
      id: crypto.randomUUID(),
      name: deck.name + ' (インポート)',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveDeckCloud(newDeck);
    setImported(true);
  }

  function handleClose() {
    window.location.hash = '';
    window.location.reload();
  }

  if (loading) return <div className="page"><p>読み込み中...</p></div>;

  if (!deck) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
      <p>デッキが見つかりませんでした。</p>
      <Button variant="ghost" onClick={handleClose}>トップへ</Button>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: 480, margin: '0 auto', paddingTop: 40 }}>
      <h1 className="page-title">デッキ共有</h1>
      <div className="deck-card" style={{ marginBottom: 24 }}>
        <div className="deck-card-info">
          <span className="deck-name">{deck.name}</span>
          <span className="deck-meta">
            メイン {deck.cards.length}枚
            {(deck.grCards ?? []).length > 0 && ` / GR ${deck.grCards!.length}枚`}
            {(deck.superDimCards ?? []).length > 0 && ` / 超次元 ${deck.superDimCards!.length}枚`}
            {deck.macros.length > 0 && ` / マクロ ${deck.macros.length}個`}
          </span>
        </div>
      </div>

      {imported ? (
        <div>
          <p style={{ color: 'var(--color-success, #4caf50)', marginBottom: 16 }}>✓ インポートしました</p>
          <Button variant="primary" onClick={handleClose}>デッキ一覧へ</Button>
        </div>
      ) : user ? (
        <Button variant="primary" onClick={handleImport}>自分のデッキに追加</Button>
      ) : (
        <div>
          <p style={{ marginBottom: 16, color: 'var(--color-text-muted)' }}>インポートするにはログインが必要です。</p>
          <Button variant="ghost" onClick={handleClose}>ログイン画面へ</Button>
        </div>
      )}
    </div>
  );
}
