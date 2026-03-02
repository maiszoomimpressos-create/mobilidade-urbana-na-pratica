/**
 * Supabase - exportações centralizadas
 *
 * Uso:
 * - createClient() → componentes client (browser)
 * - createSupabaseServerClient() → Server Components, Route Handlers
 * - createSupabaseAdminClient() → operações admin (Storage, bypass RLS)
 */

export { createClient } from './client'
export {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from './server'
