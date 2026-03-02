import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para uso no browser (componentes client).
 * Usa a chave anon - segura para expor no frontend.
 * Respeita Row Level Security (RLS) do Supabase.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios no .env'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
