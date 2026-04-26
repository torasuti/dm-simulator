import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { loadDeckCloud, saveDeckCloud, shareDeck, loadSharedDeck } from '../storage/cloudStorage';
import { loadDeck, saveDeck } from '../storage/localStorage';
import { useAuth } from '../context/AuthContext';
import type { DeckDefinition } from '../types';
import { createCard } from '../utils/deckUtils';
import { CardListEditor } from '../components/deckEditor/CardListEditor';
import { MacroEditor } from '../components/deckEditor/MacroEditor';
import { ZonePresetEditor } from '../components/deckEditor/ZonePresetEditor';
import { CardMenuConfigEditor } from '../components/deckEditor/CardMenuConfigEditor';
import { SpecialCardEditor } from '../components/deckEditor/SpecialCardEditor';
import { Button } from '../components/shared/Button';

type Tab = 'cards' | 'macros' | 'zones' | 'cardmenu';
type CardTab = 'main' | 'gr' | 'superDim' | 'special';

export function DeckEditorPage() {
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();
  const [deck, setDeck] = useState<DeckDefinition | null>(null);
  const [tab, setTab] = useState<Tab>('cards');
  const [cardTab, setCardTab] = useState<CardTab>('main');
  const [saved, setSaved] = useState(false);
  const [exportCode, setExportCode] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopyDone, setShareCopyDone] = useState(false);

  useEffect(() => {
    if (!state.editingDeckId) return;
    if (user) {
      loadDeckCloud(state.editingDeckId).then(setDeck);
    } else {
      setDeck(loadDeck(state.editingDeckId));
    }
  }, [state.editingDeckId, user]);

  async function handleSave() {
    if (!deck) return;
    const updated = { ...deck, updatedAt: Date.now() };
    user ? await saveDeckCloud(updated) : saveDeck(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleBack() {
    if (deck) {
      const updated = { ...deck, updatedAt: Date.now() };
      user ? await saveDeckCloud(updated) : saveDeck(updated);
    }
    dispatch({ type: 'NAVIGATE', page: 'deckList' });
  }

  async function handleShare() {
    if (!deck) return;
    setShareLoading(true);
    try {
      const id = await shareDeck({ ...deck, updatedAt: Date.now() });
      setShareUrl(`${window.location.origin}/#share=${id}`);
      setShareCopyDone(false);
    } catch {
      alert('共有に失敗しました');
    } finally {
      setShareLoading(false);
    }
  }

  async function handleExport() {
    if (!deck) return;
    setExportLoading(true);
    try {
      const id = await shareDeck({ ...deck, updatedAt: Date.now() });
      setExportCode(id);
      setCopyDone(false);
    } catch {
      alert('コードの生成に失敗しました');
    } finally {
      setExportLoading(false);
    }
  }

  function handleCopyCode() {
    if (!exportCode) return;
    navigator.clipboard.writeText(exportCode);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }

  async function handleImport() {
    const code = importText.trim();
    if (!code) return;
    setImportLoading(true);
    setImportError('');
    try {
      const imported = await loadSharedDeck(code);
      if (!imported) throw new Error('not found');
      const newDeck: DeckDefinition = {
        ...imported,
        id: crypto.randomUUID(),
        name: imported.name + ' (インポート)',
        cards: imported.cards.map((c) => createCard(c.name)),
        grCards: (imported.grCards ?? []).map((c) => createCard(c.name)),
        superDimCards: (imported.superDimCards ?? []).map((c) => createCard(c.name)),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      user ? await saveDeckCloud(newDeck) : saveDeck(newDeck);
      setImportOpen(false);
      setImportText('');
      setImportError('');
      dispatch({ type: 'EDIT_DECK', deckId: newDeck.id });
    } catch {
      setImportError('コードが無効です。正しい6文字のコードを入力してください。');
    } finally {
      setImportLoading(false);
    }
  }

  if (!deck) return <div className="page"><p>読み込み中...</p></div>;

  return (
    <div className="page deck-editor-page">
      <div className="editor-header">
        <Button variant="ghost" size="sm" onClick={handleBack}>← 戻る</Button>
        <input
          type="text"
          value={deck.name}
          onChange={(e) => setDeck({ ...deck, name: e.target.value })}
          className="text-input deck-title-input"
        />
        <Button variant="ghost" size="sm" onClick={handleShare} disabled={shareLoading}>{shareLoading ? '共有中...' : '🔗 URLで共有'}</Button>
        <Button variant="ghost" size="sm" onClick={handleExport} disabled={exportLoading}>{exportLoading ? '生成中...' : 'コード発行'}</Button>
        <Button variant="ghost" size="sm" onClick={() => { setImportOpen(true); setImportText(''); setImportError(''); }}>コードで取得</Button>
        <Button variant="primary" onClick={handleSave}>
          {saved ? '✓ 保存済み' : '保存'}
        </Button>
      </div>

      {shareUrl && (
        <div className="modal-backdrop" onClick={() => setShareUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="section-title">共有URL</h3>
            <p className="zone-config-hint">このURLを相手に送ってください。ログイン不要で確認・インポートできます。</p>
            <input
              readOnly
              value={shareUrl}
              className="text-input"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
              onFocus={(e) => e.target.select()}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" onClick={() => { navigator.clipboard.writeText(shareUrl); setShareCopyDone(true); setTimeout(() => setShareCopyDone(false), 2000); }}>
                {shareCopyDone ? '✓ コピー済み' : 'コピー'}
              </Button>
              <Button variant="ghost" onClick={() => setShareUrl(null)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}

      {exportCode && (
        <div className="modal-backdrop" onClick={() => setExportCode(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="section-title">デッキコード</h3>
            <p className="zone-config-hint">このコードを相手に送ってください。「コードで取得」から入力するとデッキを取得できます。</p>
            <input
              readOnly
              value={exportCode}
              className="text-input"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 24, textAlign: 'center', letterSpacing: 4 }}
              onFocus={(e) => e.target.select()}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" onClick={handleCopyCode}>{copyDone ? '✓ コピー済み' : 'コピー'}</Button>
              <Button variant="ghost" onClick={() => setExportCode(null)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="modal-backdrop" onClick={() => setImportOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="section-title">コードでデッキ取得</h3>
            <p className="zone-config-hint">6文字のデッキコードを入力してください。新しいデッキとして保存されます。</p>
            <input
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder="例: abc123"
              className="text-input"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 20, textAlign: 'center', letterSpacing: 4 }}
              maxLength={10}
              disabled={importLoading}
            />
            {importError && <p style={{ color: 'var(--color-danger)', marginTop: 4, fontSize: 13 }}>{importError}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" onClick={handleImport} disabled={!importText.trim() || importLoading}>
                {importLoading ? '取得中...' : '取得'}
              </Button>
              <Button variant="ghost" onClick={() => setImportOpen(false)}>キャンセル</Button>
            </div>
          </div>
        </div>
      )}

      <div className="tab-bar">
        <button className={`tab ${tab === 'cards' ? 'active' : ''}`} onClick={() => setTab('cards')}>
          カード
        </button>
        <button className={`tab ${tab === 'macros' ? 'active' : ''}`} onClick={() => setTab('macros')}>
          マクロ ({deck.macros.length}個)
        </button>
        <button className={`tab ${tab === 'zones' ? 'active' : ''}`} onClick={() => setTab('zones')}>
          ゾーン設定
        </button>
        <button className={`tab ${tab === 'cardmenu' ? 'active' : ''}`} onClick={() => setTab('cardmenu')}>
          カードメニュー
        </button>
      </div>

      <div className="tab-content">
        {tab === 'cards' && (
          <>
            <div className="card-subtab-bar">
              <button className={`tab ${cardTab === 'main' ? 'active' : ''}`} onClick={() => setCardTab('main')}>
                メインデッキ（{deck.cards.length}枚）
              </button>
              <button className={`tab ${cardTab === 'gr' ? 'active' : ''}`} onClick={() => setCardTab('gr')}>
                GRゾーン（{(deck.grCards ?? []).length}/12枚）
              </button>
              <button className={`tab ${cardTab === 'superDim' ? 'active' : ''}`} onClick={() => setCardTab('superDim')}>
                超次元ゾーン（{(deck.superDimCards ?? []).length}/8枚）
              </button>
              <button className={`tab ${cardTab === 'special' ? 'active' : ''}`} onClick={() => setCardTab('special')}>
                特殊
              </button>
            </div>
            {cardTab === 'main' && (
              <CardListEditor cards={deck.cards} onChange={(cards) => setDeck({ ...deck, cards })} />
            )}
            {cardTab === 'gr' && (
              <CardListEditor
                cards={deck.grCards ?? []}
                onChange={(grCards) => setDeck({ ...deck, grCards })}
                maxCards={12}
                label="GRゾーン（最大12枚）"
              />
            )}
            {cardTab === 'superDim' && (
              <CardListEditor
                cards={deck.superDimCards ?? []}
                onChange={(superDimCards) => setDeck({ ...deck, superDimCards })}
                maxCards={8}
                label="超次元ゾーン（最大8枚）"
              />
            )}
            {cardTab === 'special' && (
              <SpecialCardEditor
                value={deck.specialCard ?? 'none'}
                onChange={(specialCard) => setDeck({ ...deck, specialCard })}
              />
            )}
          </>
        )}
        {tab === 'macros' && (
          <MacroEditor macros={deck.macros} onChange={(macros) => setDeck({ ...deck, macros })} />
        )}
        {tab === 'zones' && (
          <ZonePresetEditor
            presets={deck.zoneConfigPresets?.length
              ? deck.zoneConfigPresets
              : [{ name: '設定1', configs: deck.zoneConfigs }]}
            onChange={(presets) => setDeck({
              ...deck,
              zoneConfigPresets: presets,
              zoneConfigs: presets[0].configs,
            })}
          />
        )}
        {tab === 'cardmenu' && (
          <CardMenuConfigEditor
            config={deck.cardMenuConfig}
            onChange={(cardMenuConfig) => setDeck({ ...deck, cardMenuConfig })}
          />
        )}
      </div>
    </div>
  );
}
