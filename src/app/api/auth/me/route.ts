import { NextRequest, NextResponse } from 'next/server'
import { getSessionForServer } from '@/lib/supabase-auth'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const session = await getSessionForServer()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        tenantUsers: {
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
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
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
    const isSupabase = message.includes('SUPABASE') || message.includes('obrigatório')

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

    return NextResponse.json(
      { error: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    )
  }
}
