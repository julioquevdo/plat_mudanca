// Layer 1 — Config
// Initializes and exports the Supabase client singleton.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ENV } from './env.js';

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
