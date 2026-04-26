import { supabase } from '../lib/supabase';
import type { DeckDefinition } from '../types';

export async function loadDecksCloud(): Promise<DeckDefinition[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('data')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.data as DeckDefinition);
}

export async function loadDeckCloud(id: string): Promise<DeckDefinition | null> {
  const { data, error } = await supabase
    .from('decks')
    .select('data')
    .eq('id', id)
    .single();
  if (error) return null;
  return data?.data as DeckDefinition ?? null;
}

export async function saveDeckCloud(deck: DeckDefinition): Promise<void> {
  const { error } = await supabase
    .from('decks')
    .upsert({ id: deck.id, data: deck, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deleteDeckCloud(id: string): Promise<void> {
  const { error } = await supabase.from('decks').delete().eq('id', id);
  if (error) throw error;
}

function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function shareDeck(deck: DeckDefinition): Promise<string> {
  const id = generateShortId();
  const { error } = await supabase.from('shared_decks').insert({ id, data: deck });
  if (error) throw error;
  return id;
}

export async function loadSharedDeck(id: string): Promise<DeckDefinition | null> {
  const { data, error } = await supabase.from('shared_decks').select('data').eq('id', id).single();
  if (error) return null;
  return data?.data as DeckDefinition ?? null;
}
