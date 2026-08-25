import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';
import type { Database } from './types';

const neonAuthUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;
const neonDataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;

if (!neonAuthUrl || !neonDataApiUrl) {
  throw new Error(
    'Missing Neon configuration. Set NEXT_PUBLIC_NEON_AUTH_URL and NEXT_PUBLIC_NEON_DATA_API_URL.'
  );
}

/**
 * Kept as `supabase` temporarily so existing service imports do not need to
 * change at once. This is a Neon client: Neon Auth issues the session and
 * Neon Data API handles all database requests.
 */
export const supabase = createClient<Database>({
  auth: {
    url: neonAuthUrl,
    adapter: SupabaseAuthAdapter(),
  },
  dataApi: {
    url: neonDataApiUrl,
  },
});
