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
