import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionForServer } from '@/lib/supabase-auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/partner/me
 * Retorna a central do parceiro logado e seu status.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : ''

    let email: string | null = null

    if (bearerToken) {
      // Auth no modo "token no header" (mais confiável no browser)
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase.auth.getUser(bearerToken)
      if (!error && data?.user?.email) {
        email = data.user.email.toLowerCase()
      }
    }

    // Fallback: cookies/sessão do Supabase
    if (!email) {
      const session = await getSessionForServer()
      email = session?.user?.email ?? null
    }

    if (!email) return NextResponse.json({ tenant: null })

    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, name: true, email: true },
    })

    if (!dbUser) {
      return NextResponse.json({ tenant: null })
    }

    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId: dbUser.id, tenant: { isActive: true } },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            type: true,
            approvalStatus: true,
            isActive: true,
            createdAt: true,
          },
        },
        role: {
          select: { name: true, slug: true },
        },
      },
    })

    if (!tenantUser) {
      return NextResponse.json({ tenant: null })
    }

    const plan = await prisma.tenantPlan.findFirst({
      where: { tenantId: tenantUser.tenant.id },
      include: {
        plan: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      tenant: tenantUser.tenant,
      role: tenantUser.role,
      plan: plan?.plan ?? null,
      planStatus: plan?.status ?? null,
    })
  } catch (error) {
    console.error('[partner/me] GET', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
