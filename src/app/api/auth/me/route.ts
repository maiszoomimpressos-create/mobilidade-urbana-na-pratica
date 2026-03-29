import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { UserAccountKind } from '@prisma/client'
import { getSessionForServer } from '@/lib/supabase-auth'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function isSchemaMismatch(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('p2022') ||
    m.includes('does not exist') ||
    m.includes('unknown column') ||
    m.includes('accountkind') ||
    (m.includes('column') && m.includes('not exist'))
  )
}

/**
 * GET /api/auth/me
 * Bearer primeiro (Vercel preview / cookies fracos); depois cookie via getSessionForServer.
 */
export async function GET(request: NextRequest) {
  try {
    let email: string | null = null

    const authHeader = request.headers.get('authorization') || ''
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

    if (bearer && supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase.auth.getUser(bearer)
      if (!error && data?.user?.email) {
        email = data.user.email.toLowerCase()
      }
    }

    if (!email) {
      const session = await getSessionForServer()
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      }
      email = session.user.email
    }

    const { prisma } = await import('@/lib/prisma')

    const tenantUsersInclude = {
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            mapUsageDashboardUrl: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    } as const

    const baseSelect = {
      id: true,
      email: true,
      name: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      tenantUsers: tenantUsersInclude,
    } as const

    let user
    try {
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { ...baseSelect, accountKind: true },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!isSchemaMismatch(msg)) throw err
      const fallback = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: baseSelect,
      })
      user = fallback
        ? { ...fallback, accountKind: UserAccountKind.STANDARD }
        : null
    }

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Erro ao buscar usuário:', error)

    const isDb =
      message.includes('connect') ||
      message.includes('ECONNREFUSED') ||
      message.includes('timeout') ||
      message.includes('P1001') ||
      message.includes('P1000')
    const isSupabase =
      message.includes('SUPABASE') ||
      message.includes('obrigatório') ||
      message.includes('obrigatórios') ||
      message.includes('SUPABASE_SERVICE_ROLE_MISSING')

    if (isDb) {
      return NextResponse.json(
        { error: 'Banco de dados indisponível. Verifique DATABASE_URL na Vercel.' },
        { status: 503 }
      )
    }
    if (isSupabase) {
      return NextResponse.json(
        { error: 'Configuração de autenticação ausente. Verifique variáveis Supabase na Vercel.' },
        { status: 503 }
      )
    }
    if (isSchemaMismatch(message)) {
      return NextResponse.json(
        {
          error: 'Banco desatualizado em relação ao código.',
          detail:
            'Rode `npx prisma db push` ou o SQL `scripts/sql/add-user-account-kind.sql` no Supabase.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 })
  }
}
