import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const configOk = /^https:\/\/.+\.supabase\.co\/?$/.test(SUPABASE_URL.trim()) && !SUPABASE_URL.includes('TU-PROYECTO') && SUPABASE_ANON_KEY.trim().length > 20;
export const sb = configOk ? createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim(), { auth: { persistSession: true, autoRefreshToken: true } }) : null;
