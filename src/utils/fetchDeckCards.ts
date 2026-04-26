import type { SpecialCardType } from '../types';

const FIRESTORE_KEY = 'AIzaSyCKhH2S_r29U5olfQC6AsXaaHNhqmJMR40'
const FIRESTORE_BASE = '/proxy/firestore'
const CARD_API_BASE = '/proxy/dm-cards'

function extractDeckId(url: string): string | null {
  try {
    const u = new URL(url)
    return u.searchParams.get('tcgrevo_deck_maker_deck_id')
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
    .filter((n) => !isNaN(n))
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
  const deckId = extractDeckId(url)
  if (!deckId) throw new Error('URLからデッキIDを取得できませんでした')

  const firestoreUrl = `/version/2/dm_decks/${deckId}?key=${FIRESTORE_KEY}`
  const fsRes = await fetch(`${FIRESTORE_BASE}${firestoreUrl}`)
  if (!fsRes.ok) throw new Error(`デッキデータの取得に失敗しました (${fsRes.status})`)
  const fsData = await fsRes.json()

  const deckName: string = fsData?.fields?.name?.stringValue
    ?? fsData?.fields?.deck_name?.stringValue
    ?? 'インポートデッキ'

  const mainValues: CardEntry[] = fsData?.fields?.main_cards?.arrayValue?.values ?? []
  const grValues: CardEntry[] = fsData?.fields?.gr_cards?.arrayValue?.values ?? []
  const superDimValues: CardEntry[] = fsData?.fields?.hyper_spatial_cards?.arrayValue?.values ?? []

  const mainIds = extractCardIds(mainValues)
  const grIds = extractCardIds(grValues)
  const superDimIds = extractCardIds(superDimValues)

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
