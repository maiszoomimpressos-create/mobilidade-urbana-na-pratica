import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UserAccountKind } from '@prisma/client'
import { getMasterAdminEmails } from '@/lib/master-admin-config'
import {
  accountKindAfterLoginSync,
  initialAccountKindForSignupMetadata,
} from '@/lib/user-account-kind-sync'

export type SessionUser = {
  id: string
  email: string
  name: string | null
  image?: string | null
  accountKind: UserAccountKind
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
  try {
    const supabase = await createSupabaseServerClient()
    /** No servidor, preferir getUser(): valida o JWT; getSession() só lê cookie e pode falhar em API routes (ex.: Vercel). */
    const { data: userData, error: userError } = await supabase.auth.getUser()
    const authUser = userData?.user

    let email: string | null = null
    let name: string | null = null
    let userMetadata: Record<string, unknown> = {}

    if (!userError && authUser?.email) {
      email = authUser.email.toLowerCase()
      name =
        (authUser.user_metadata?.full_name as string) ||
        (authUser.user_metadata?.name as string) ||
        null
      userMetadata = { ...(authUser.user_metadata as Record<string, unknown> | undefined) }
    } else {
      const {
        data: { session: supabaseSession },
      } = await supabase.auth.getSession()
      if (!supabaseSession?.user?.email) return null
      email = supabaseSession.user.email.toLowerCase()
      name =
        (supabaseSession.user.user_metadata?.full_name as string) ||
        (supabaseSession.user.user_metadata?.name as string) ||
        null
      userMetadata = {
        ...(supabaseSession.user.user_metadata as Record<string, unknown> | undefined),
      }
    }

    if (!email) return null

    const selectUser = {
      id: true,
      email: true,
      name: true,
      image: true,
      accountKind: true,
    } as const

    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: selectUser,
    })

    if (!user) {
      const masterEmails = getMasterAdminEmails()
      const isListedMaster = masterEmails.includes(email)
      user = await prisma.user.create({
        data: {
          email,
          name,
          accountKind: isListedMaster
            ? UserAccountKind.ADMIN_MASTER
            : initialAccountKindForSignupMetadata(userMetadata),
        },
        select: selectUser,
      })
    } else if (getMasterAdminEmails().includes(email) && user.accountKind !== UserAccountKind.ADMIN_MASTER) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { accountKind: UserAccountKind.ADMIN_MASTER },
        select: selectUser,
      })
    }

    const syncedKind = accountKindAfterLoginSync(user.accountKind, userMetadata)
    if (syncedKind !== null && syncedKind !== user.accountKind) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { accountKind: syncedKind },
        select: selectUser,
      })
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        accountKind: user.accountKind,
      },
    }
  } catch (err) {
    console.error('[getSessionForServer]', err)
    throw err
  }
}
