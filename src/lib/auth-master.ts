import { getSessionForServer } from '@/lib/supabase-auth'
import { UserAccountKind } from '@prisma/client'
import { getMasterAdminEmails } from '@/lib/master-admin-config'

const DEV_BYPASS = process.env.NODE_ENV === 'development'

/**
 * Verifica se o usuário da sessão é o admin master.
 * - `User.accountKind === ADMIN_MASTER` no banco, ou
 * - e-mail em `NEXT_PUBLIC_MASTER_ADMIN_EMAIL` / `NEXT_PUBLIC_MASTER_ADMIN_EMAILS`.
 */
export async function isMasterAdmin(): Promise<boolean> {
  if (DEV_BYPASS) {
    return true
  }
  const session = await getSessionForServer()
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email) return false
  if (session?.user?.accountKind === UserAccountKind.ADMIN_MASTER) {
    return true
  }
  return getMasterAdminEmails().includes(email)
}
