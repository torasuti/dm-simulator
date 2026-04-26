import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { loadDecks, saveDeck, deleteDeck } from '../storage/localStorage';
import { createNewDeck, cloneDeck, createCard } from '../utils/deckUtils';
import { fetchDeckFromUrl } from '../utils/fetchDeckCards';
import type { DeckDefinition } from '../types';
import { Button } from '../components/shared/Button';

export function DeckListPage() {
  const { dispatch } = useAppContext();
  const [decks, setDecks] = useState<DeckDefinition[]>([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlProgress, setUrlProgress] = useState<{ current: number; total: number } | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    setDecks(loadDecks());
  }, []);

  function handleCreate() {
    const name = newDeckName.trim() || '新しいデッキ';
    const deck = createNewDeck(name);
    saveDeck(deck);
    setDecks(loadDecks());
    setNewDeckName('');
    dispatch({ type: 'EDIT_DECK', deckId: deck.id });
  }

  async function handleUrlCreate() {
    const url = urlInput.trim();
    if (!url) return;
    setUrlLoading(true);
    setUrlError(null);
    setUrlProgress(null);
    try {
      const { deckName, cardNames, grCardNames, superDimCardNames, specialCard } = await fetchDeckFromUrl(url, (current, total) => {
        setUrlProgress({ current, total });
      });
      const deck = createNewDeck(deckName);
      deck.cards = cardNames.map((n) => createCard(n));
      if (grCardNames.length > 0) deck.grCards = grCardNames.map((n) => createCard(n));
      if (superDimCardNames.length > 0) deck.superDimCards = superDimCardNames.map((n) => createCard(n));
      deck.specialCard = specialCard;
      saveDeck(deck);
      setDecks(loadDecks());
      setUrlInput('');
      setUrlProgress(null);
      dispatch({ type: 'EDIT_DECK', deckId: deck.id });
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : 'インポートに失敗しました');
    } finally {
      setUrlLoading(false);
    }
  }

  function handleDelete(id: string) {
    if (!confirm('このデッキを削除しますか？')) return;
    deleteDeck(id);
    setDecks(loadDecks());
  }

  function handleDuplicate(deck: DeckDefinition) {
    const copy = cloneDeck(deck);
    saveDeck(copy);
    setDecks(loadDecks());
  }

  function handlePlay(id: string) {
    dispatch({ type: 'SELECT_DECK', deckId: id });
  }

  function handleEdit(id: string) {
    dispatch({ type: 'EDIT_DECK', deckId: id });
  }

  return (
    <div className="page deck-list-page">
      <h1 className="page-title">デュエマ 一人回し</h1>

      <div className="new-deck-form">
        <input
          type="text"
          placeholder="デッキ名を入力..."
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="text-input"
        />
        <Button variant="primary" onClick={handleCreate}>＋ 新規デッキ作成</Button>
      </div>

      <div className="url-create-form">
        <input
          type="text"
          placeholder="ガチまとめのURLを貼り付け..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !urlLoading && handleUrlCreate()}
          className="text-input"
          disabled={urlLoading}
        />
        <Button variant="secondary" onClick={handleUrlCreate} disabled={urlLoading || !urlInput.trim()}>
          {urlLoading ? `取得中 ${urlProgress ? `${urlProgress.current}/${urlProgress.total}` : ''}...` : '🔗 URLから作成'}
        </Button>
        {urlError && <p className="url-import-error">{urlError}</p>}
      </div>

      {decks.length === 0 ? (
        <div className="empty-state">
          <p>デッキがありません。新規作成してください。</p>
        </div>
      ) : (
        <div className="deck-grid">
          {decks.map((deck) => (
            <div key={deck.id} className="deck-card">
              <div className="deck-card-info">
                <span className="deck-name">{deck.name}</span>
                <span className="deck-meta">
                  メイン {deck.cards.length}枚
                  {(deck.grCards ?? []).length > 0 && ` / GR ${deck.grCards!.length}枚`}
                  {(deck.superDimCards ?? []).length > 0 && ` / 超次元 ${deck.superDimCards!.length}枚`}
                  {deck.specialCard && deck.specialCard !== 'none' && ` / ${deck.specialCard === 'kindan' ? '禁断' : deck.specialCard === 'dolmagedon' ? 'ドルマゲドン' : 'ゼーロ'}`}
                  {deck.macros.length > 0 && ` / マクロ ${deck.macros.length}個`}
                </span>
              </div>
              <div className="deck-card-actions">
                <Button variant="primary" size="sm" onClick={() => handlePlay(deck.id)}>▶ 対戦</Button>
                <Button variant="secondary" size="sm" onClick={() => handleEdit(deck.id)}>✏ 編集</Button>
                <Button variant="secondary" size="sm" onClick={() => handleDuplicate(deck)}>⎘ 複製</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(deck.id)}>🗑 削除</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
