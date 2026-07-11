import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CLOUD_FEATURES_ENABLED, DECK_URL_IMPORT_ENABLED, PUBLIC_DECK_LIMIT } from '../config/features';
import { loadDecksCloud, saveDeckCloud, deleteDeckCloud } from '../storage/cloudStorage';
import { loadDecks, saveDeck, deleteDeck } from '../storage/localStorage';
import { createNewDeck, cloneDeck, createCard } from '../utils/deckUtils';
import type { DeckDefinition } from '../types';
import type { ParsedTextDeck } from '../utils/textDeckParser';
import { Button } from '../components/shared/Button';
import { TextImportDialog } from '../components/deckEditor/TextImportDialog';

export function DeckListPage() {
  const { dispatch } = useAppContext();
  const { user, signOut } = useAuth();
  const cloudUser = CLOUD_FEATURES_ENABLED ? user : null;
  const [decks, setDecks] = useState<DeckDefinition[]>([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlProgress, setUrlProgress] = useState<{ current: number; total: number } | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [textImportOpen, setTextImportOpen] = useState(false);
  const deckLimitReached = PUBLIC_DECK_LIMIT !== null && decks.length >= PUBLIC_DECK_LIMIT;

  async function refreshDecks() {
    setListLoading(true);
    try {
      setDecks(cloudUser ? await loadDecksCloud() : loadDecks());
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => { refreshDecks(); }, [cloudUser]);

  async function handleCreate() {
    if (deckLimitReached) return;
    const name = newDeckName.trim() || '新しいデッキ';
    const deck = createNewDeck(name);
    if (cloudUser) {
      await saveDeckCloud(deck);
    } else {
      saveDeck(deck);
    }
    setNewDeckName('');
    dispatch({ type: 'EDIT_DECK', deckId: deck.id });
  }

  async function handleTextImport(parsed: ParsedTextDeck) {
    if (deckLimitReached) return;
    const deck = createNewDeck(parsed.name);
    deck.cards = parsed.cardNames.map((name) => createCard(name));
    deck.grCards = parsed.grCardNames.map((name) => createCard(name));
    deck.superDimCards = parsed.superDimCardNames.map((name) => createCard(name));
    deck.specialCard = parsed.specialCard;
    if (cloudUser) {
      await saveDeckCloud(deck);
    } else {
      saveDeck(deck);
    }
    setTextImportOpen(false);
    dispatch({ type: 'EDIT_DECK', deckId: deck.id });
  }

  async function handleUrlCreate() {
    const url = urlInput.trim();
    if (!url) return;
    setUrlLoading(true);
    setUrlError(null);
    setUrlProgress(null);
    try {
      const { fetchDeckFromUrl } = await import('../utils/fetchDeckCards');
      const { deckName, cardNames, grCardNames, superDimCardNames, specialCard } = await fetchDeckFromUrl(url, (current, total) => {
        setUrlProgress({ current, total });
      });
      const deck = createNewDeck(deckName);
      deck.cards = cardNames.map((n) => createCard(n));
      if (grCardNames.length > 0) deck.grCards = grCardNames.map((n) => createCard(n));
      if (superDimCardNames.length > 0) deck.superDimCards = superDimCardNames.map((n) => createCard(n));
      deck.specialCard = specialCard;
      if (cloudUser) {
        await saveDeckCloud(deck);
      } else {
        saveDeck(deck);
      }
      setUrlInput('');
      setUrlProgress(null);
      dispatch({ type: 'EDIT_DECK', deckId: deck.id });
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : 'インポートに失敗しました');
    } finally {
      setUrlLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('このデッキを削除しますか？')) return;
    if (cloudUser) {
      await deleteDeckCloud(id);
    } else {
      deleteDeck(id);
    }
    await refreshDecks();
  }

  async function handleDuplicate(deck: DeckDefinition) {
    if (deckLimitReached) return;
    const copy = cloneDeck(deck);
    if (cloudUser) {
      await saveDeckCloud(copy);
    } else {
      saveDeck(copy);
    }
    await refreshDecks();
  }

  function handlePlay(id: string) {
    dispatch({ type: 'SELECT_DECK', deckId: id });
  }

  function handleEdit(id: string) {
    dispatch({ type: 'EDIT_DECK', deckId: id });
  }

  const filteredDecks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return decks;
    return decks.filter((deck) => deck.name.toLowerCase().includes(q));
  }, [decks, searchQuery]);

  return (
    <div className="page deck-list-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 className="page-title" style={{ margin: 0 }}>デュエマ 一人回し</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {CLOUD_FEATURES_ENABLED && cloudUser ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{cloudUser.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>ログアウト</Button>
            </>
          ) : CLOUD_FEATURES_ENABLED ? (
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'NAVIGATE', page: 'login' })}>ログイン</Button>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>公開版</span>
          )}
        </div>
      </div>

      <div className="new-deck-form">
        <input
          type="text"
          placeholder="デッキ名を入力..."
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="text-input"
        />
        <Button variant="primary" onClick={handleCreate} disabled={deckLimitReached}>＋ 新規デッキ作成</Button>
        <Button variant="secondary" onClick={() => setTextImportOpen(true)} disabled={deckLimitReached}>
          テキストから作成
        </Button>
      </div>

      {PUBLIC_DECK_LIMIT !== null && (
        <p style={{ margin: '0 0 12px', color: deckLimitReached ? 'var(--color-danger)' : 'var(--color-text-muted)', fontSize: 13 }}>
          公開版のデッキ数: {decks.length} / {PUBLIC_DECK_LIMIT}
        </p>
      )}

      {DECK_URL_IMPORT_ENABLED && (
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
      )}

      {decks.length > 0 && (
        <div className="deck-list-toolbar">
          <input
            type="search"
            placeholder="デッキを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-input deck-search-input"
          />
          <span className="deck-list-count">
            {filteredDecks.length} / {decks.length}
          </span>
        </div>
      )}

      {listLoading ? (
        <div className="empty-state"><p>読み込み中...</p></div>
      ) : decks.length === 0 ? (
        <div className="empty-state">
          <p>デッキがありません。新規作成してください。</p>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="empty-state compact">
          <p>一致するデッキがありません。</p>
        </div>
      ) : (
        <div className="deck-grid">
          {filteredDecks.map((deck) => (
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
                <Button variant="secondary" size="sm" onClick={() => handleDuplicate(deck)} disabled={deckLimitReached}>⎘ 複製</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(deck.id)}>🗑 削除</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {textImportOpen && (
        <TextImportDialog
          onImport={handleTextImport}
          onClose={() => setTextImportOpen(false)}
        />
      )}
    </div>
  );
}
