import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export type SessionUser = {
  id: string
  email: string
  name: string | null
  image?: string | null
}

export type SessionWithUser = {
  user: SessionUser
} | null

/**
 * Obtém a sessão atual (Supabase) e o usuário do nosso banco.
 * Se o usuário existir no Supabase mas não na tabela users, cria o registro.
 * Retorna formato compatível com o que o app usava com NextAuth.
 */
export async function getSessionForServer(): Promise<SessionWithUser> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session: supabaseSession },
  } = await supabase.auth.getSession()

  if (!supabaseSession?.user?.email) return null

  const email = supabaseSession.user.email
  const name =
    (supabaseSession.user.user_metadata?.full_name as string) ||
    (supabaseSession.user.user_metadata?.name as string) ||
    null

  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, image: true },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
      },
      select: { id: true, email: true, name: true, image: true },
    })
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
  }
}
