import { createClient } from '@supabase/supabase-js';
import { CLOUD_FEATURES_ENABLED } from '../config/features';

const SUPABASE_URL = CLOUD_FEATURES_ENABLED ? import.meta.env.VITE_SUPABASE_URL as string : '';
const SUPABASE_ANON_KEY = CLOUD_FEATURES_ENABLED ? import.meta.env.VITE_SUPABASE_ANON_KEY as string : '';

if (!CLOUD_FEATURES_ENABLED || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase is not configured for this build');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
