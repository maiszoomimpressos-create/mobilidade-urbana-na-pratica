import { getSessionForServer } from '@/lib/supabase-auth'
import { prisma } from '@/lib/prisma'

const MASTER_EMAIL = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL ?? 'maiszoomimpressos@gmail.com'

/**
 * Verifica se o usuário da sessão pode gerenciar provedores de mapa
 * (admin master ou gestor = role slug 'manager').
 */
export async function canManageMaps(): Promise<boolean> {
  const session = await getSessionForServer()
  if (!session?.user?.email) return false

  const email = session.user.email
  if (email === MASTER_EMAIL) return true

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      tenantUsers: {
        select: { role: { select: { slug: true } } },
      },
    },
  })
  if (!user) return false

  const hasManagerRole = user.tenantUsers.some((tu) => tu.role.slug === 'manager')
  return hasManagerRole
}
