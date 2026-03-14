import { getSessionForServer } from '@/lib/supabase-auth'

const MASTER_EMAIL = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL ?? 'maiszoomimpressos@gmail.com'

/**
 * Verifica se o usuário da sessão é o admin master.
 */
export async function isMasterAdmin(): Promise<boolean> {
  const session = await getSessionForServer()
  return session?.user?.email === MASTER_EMAIL
}
