import { createClient } from '@supabase/supabase-js';

// Handle both Vite and Node.js environments
const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');

// Try new key names first, fall back to legacy names
const supabasePublishableKey = getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
const supabaseSecretKey = getEnv('VITE_SUPABASE_SECRET_KEY') || getEnv('VITE_SUPABASE_SERVICE_KEY');

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('Missing required Supabase environment variables');
}

// Regular client for most operations (limited by RLS)
const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Admin client for operations that need to bypass RLS (like user management)
// Only available in server-side contexts
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase;