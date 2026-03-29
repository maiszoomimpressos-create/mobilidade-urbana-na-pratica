import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionForServer } from '@/lib/supabase-auth'
import { createClient } from '@supabase/supabase-js'
import {
  listPartnerCentralLinksForUser,
  userHasActivePartnerCentral,
} from '@/lib/partner-active-central'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/partner/register-eligibility
 * Diagnóstico: por que /parceiro pode ou não cadastrar outra central.
 * Autenticação: Bearer (recomendado) ou cookie Supabase.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : ''

    let email: string | null = null

    if (bearerToken) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase.auth.getUser(bearerToken)
      if (!error && data?.user?.email) {
        email = data.user.email.toLowerCase()
      }
    }

    if (!email) {
      const session = await getSessionForServer()
      email = session?.user?.email?.trim().toLowerCase() ?? null
    }

    if (!email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true },
    })

    if (!dbUser) {
      return NextResponse.json({
        canRegister: true,
        reason: 'Usuário ainda não existe na tabela users — primeiro cadastro permitido.',
        links: [],
      })
    }

    const links = await listPartnerCentralLinksForUser(dbUser.id)
    const hasBlock = await userHasActivePartnerCentral(dbUser.id)

    return NextResponse.json({
      canRegister: !hasBlock,
      reason: hasBlock
        ? 'Existe vínculo ativo com central ativa (link + tenants.isActive). Desative a central e o vínculo ou rode o SQL de reconciliação.'
        : 'Nenhum bloqueio: pode cadastrar nova central.',
      userId: dbUser.id,
      email: dbUser.email,
      links,
    })
  } catch (error) {
    console.error('[partner/register-eligibility] GET', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
