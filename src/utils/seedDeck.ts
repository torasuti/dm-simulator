import { loadDecks, saveDeck } from '../storage/localStorage';
import { createCard, createNewDeck } from './deckUtils';

const DEFAULT_DECK_CARDS: [string, number][] = [
  ['異端流し オニカマス', 3],
  ['サイバー・チューン', 4],
  ['水晶の記録 ゼノシャーク/クリスタル・メモリー', 1],
  ['♪立ち上がる 悪魔に天使 堕ちるかな', 4],
  ['デモンズ・ライト', 1],
  ['ポジトロン・サイン', 1],
  ['真気楼と誠偽感の決断', 4],
  ['黒神龍ブライゼナーガ', 1],
  ['ウェディング・ゲート', 4],
  ['ドレミ団の光魂Go!', 4],
  ['ブレイン・スラッシュ', 3],
  ['灰塵と天門の儀式', 1],
  ['爆藍月 Drache der\'Zen', 2],
  ['聖霊左神ジャスティス', 4],
  ['天命能装 ホーリーエンド/ナウ・オア・ネバー', 1],
  ['ブルー・インパルス/「真実を見せよ、ジョニー」', 2],
];

export function seedDefaultDeck() {
  const existing = loadDecks();
  if (existing.some((d) => d.name === 'サンプルデッキ')) return;

  const deck = createNewDeck('サンプルデッキ');
  for (const [name, count] of DEFAULT_DECK_CARDS) {
    for (let i = 0; i < count; i++) {
      deck.cards.push(createCard(name));
    }
  }
  saveDeck(deck);
}
