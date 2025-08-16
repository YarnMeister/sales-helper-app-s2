import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './env';

// Create Supabase client
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);

// Create admin client for server-side operations
export const supabaseAdmin = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceRoleKey
);
