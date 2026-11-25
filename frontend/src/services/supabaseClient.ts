import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xalhgjacioulkqcxfleu.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_27vwwZ7iYW9VpacAVnRDtw_2stlsB1T';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
