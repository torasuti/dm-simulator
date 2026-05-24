import type { SpecialCardType } from '../types';
import { DECK_URL_IMPORT_ENABLED } from '../config/features';

const FIRESTORE_KEY = DECK_URL_IMPORT_ENABLED ? import.meta.env.VITE_FIRESTORE_KEY as string : ''
const FIRESTORE_BASE = '/proxy/firestore'
const CARD_API_BASE = '/proxy/dm-cards'
const ALLOWED_DECK_URL_HOSTS = new Set(['gachi-matome.com', 'www.gachi-matome.com'])
const DECK_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/
const MAX_MAIN_CARDS = 60
const MAX_GR_CARDS = 12
const MAX_SUPER_DIM_CARDS = 8

function extractDeckId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' || !ALLOWED_DECK_URL_HOSTS.has(u.hostname)) return null
    const deckId = u.searchParams.get('tcgrevo_deck_maker_deck_id')
    if (!deckId || !DECK_ID_PATTERN.test(deckId)) return null
    return deckId
  } catch {
    return null
  }
}

async function fetchCardName(cardId: number, retries = 3): Promise<string | null> {
  const delays = [500, 1000, 1500]
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${CARD_API_BASE}/${cardId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data?.name) return data.name as string
    } catch {
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delays[i]))
    }
  }
  return null
}

type CardEntry = { mapValue?: { fields?: { main_card_id?: { integerValue?: string } } } }

function extractCardIds(values: CardEntry[]): number[] {
  return values
    .map((v) => parseInt(v.mapValue?.fields?.main_card_id?.integerValue ?? ''))
    .filter((n) => Number.isSafeInteger(n) && n > 0 && n <= 1_000_000)
}

async function fetchCardNames(
  ids: number[],
  offset: number,
  total: number,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const names: string[] = []
  for (let i = 0; i < ids.length; i++) {
    onProgress?.(offset + i + 1, total)
    const name = await fetchCardName(ids[i])
    if (name) names.push(name)
  }
  return names
}

export async function fetchDeckFromUrl(
  url: string,
  onProgress?: (current: number, total: number) => void
): Promise<{
  deckName: string
  cardNames: string[]
  grCardNames: string[]
  superDimCardNames: string[]
  specialCard: SpecialCardType
}> {
  if (!DECK_URL_IMPORT_ENABLED || !FIRESTORE_KEY) {
    throw new Error('URLインポートはこのビルドでは無効です')
  }
  const deckId = extractDeckId(url)
  if (!deckId) throw new Error('ガチまとめの有効なデッキURLを入力してください')

  const firestoreUrl = `/version/2/dm_decks/${encodeURIComponent(deckId)}?key=${encodeURIComponent(FIRESTORE_KEY)}`
  const fsRes = await fetch(`${FIRESTORE_BASE}${firestoreUrl}`)
  if (!fsRes.ok) throw new Error(`デッキデータの取得に失敗しました (${fsRes.status})`)
  const fsData = await fsRes.json()

  const deckName: string = fsData?.fields?.name?.stringValue
    ?? fsData?.fields?.deck_name?.stringValue
    ?? 'インポートデッキ'

  const mainValues: CardEntry[] = fsData?.fields?.main_cards?.arrayValue?.values ?? []
  const grValues: CardEntry[] = fsData?.fields?.gr_cards?.arrayValue?.values ?? []
  const superDimValues: CardEntry[] = fsData?.fields?.hyper_spatial_cards?.arrayValue?.values ?? []

  const mainIds = extractCardIds(mainValues).slice(0, MAX_MAIN_CARDS)
  const grIds = extractCardIds(grValues).slice(0, MAX_GR_CARDS)
  const superDimIds = extractCardIds(superDimValues).slice(0, MAX_SUPER_DIM_CARDS)

  if (mainIds.length === 0) throw new Error('カードIDが見つかりませんでした')

  const total = mainIds.length + grIds.length + superDimIds.length

  const cardNames = await fetchCardNames(mainIds, 0, total, onProgress)
  const grCardNames = await fetchCardNames(grIds, mainIds.length, total, onProgress)
  const superDimCardNames = await fetchCardNames(superDimIds, mainIds.length + grIds.length, total, onProgress)

  const isLegend = fsData?.fields?.legend?.booleanValue === true
  const isDorumagedon = fsData?.fields?.dorumagedon?.booleanValue === true
  const isZeron = fsData?.fields?.zeron?.booleanValue === true
  const specialCard: SpecialCardType =
    isLegend ? 'kindan' :
    isDorumagedon ? 'dolmagedon' :
    isZeron ? 'zero' : 'none'

  return { deckName, cardNames, grCardNames, superDimCardNames, specialCard }
}
