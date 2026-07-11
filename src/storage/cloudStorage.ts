import { CLOUD_FEATURES_ENABLED } from '../config/features';
import type { DeckDefinition } from '../types';
import { migrateDeck } from './localStorage';

const SHARE_ID_BYTES = 16;
const MAX_SHARE_ID_ATTEMPTS = 5;

async function getSupabase() {
  if (!CLOUD_FEATURES_ENABLED) throw new Error('Cloud storage is disabled in this build');
  const { supabase } = await import('../lib/supabase');
  return supabase;
}

async function requireUserId(): Promise<string> {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function loadDecksCloud(): Promise<DeckDefinition[]> {
  const supabase = await getSupabase();
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('decks')
    .select('data')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => migrateDeck(row.data as DeckDefinition));
}

export async function loadDeckCloud(id: string): Promise<DeckDefinition | null> {
  const supabase = await getSupabase();
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('decks')
    .select('data')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data?.data ? migrateDeck(data.data as DeckDefinition) : null;
}

export async function saveDeckCloud(deck: DeckDefinition): Promise<void> {
  const supabase = await getSupabase();
  const userId = await requireUserId();
  const { error } = await supabase
    .from('decks')
    .upsert({ id: deck.id, user_id: userId, data: deck, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deleteDeckCloud(id: string): Promise<void> {
  const supabase = await getSupabase();
  const userId = await requireUserId();
  const { error } = await supabase.from('decks').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

function generateShareId(): string {
  const bytes = new Uint8Array(SHARE_ID_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function shareDeck(deck: DeckDefinition): Promise<string> {
  const supabase = await getSupabase();
  for (let attempt = 0; attempt < MAX_SHARE_ID_ATTEMPTS; attempt++) {
    const id = generateShareId();
    const { error } = await supabase.from('shared_decks').insert({ id, data: deck });
    if (!error) return id;
    if (error.code !== '23505') throw error;
  }
  throw new Error('Failed to generate a unique share id');
}

export async function loadSharedDeck(id: string): Promise<DeckDefinition | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('shared_decks').select('data').eq('id', id).single();
  if (error) return null;
  return data?.data ? migrateDeck(data.data as DeckDefinition) : null;
}
