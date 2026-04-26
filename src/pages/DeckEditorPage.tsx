import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { loadDeck, saveDeck } from '../storage/localStorage';
import type { DeckDefinition } from '../types';
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
  const [deck, setDeck] = useState<DeckDefinition | null>(null);
  const [tab, setTab] = useState<Tab>('cards');
  const [cardTab, setCardTab] = useState<CardTab>('main');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.editingDeckId) {
      setDeck(loadDeck(state.editingDeckId));
    }
  }, [state.editingDeckId]);

  function handleSave() {
    if (!deck) return;
    saveDeck({ ...deck, updatedAt: Date.now() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleBack() {
    if (deck) saveDeck({ ...deck, updatedAt: Date.now() });
    dispatch({ type: 'NAVIGATE', page: 'deckList' });
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
        <Button variant="primary" onClick={handleSave}>
          {saved ? '✓ 保存済み' : '保存'}
        </Button>
      </div>

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
