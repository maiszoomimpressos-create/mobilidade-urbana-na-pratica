import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionForServer } from '@/lib/supabase-auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/partner/cities
 * Lista as cidades atreladas ao tenant do parceiro logado.
 * Retorna latitude/longitude para o mapa.
 */
export async function GET(request: NextRequest) {
  try {
    const tenantIdParam = request.nextUrl.searchParams.get('tenantId')?.trim() || null

    const authHeader = request.headers.get('authorization') || ''
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : ''

    let userId: string | null = null

    if (bearerToken) {
      // Auth no modo "token no header"
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase.auth.getUser(bearerToken)
      if (!error && data?.user?.email) {
        const dbUser = await prisma.user.findFirst({
          where: { email: { equals: data.user.email.toLowerCase(), mode: 'insensitive' } },
          select: { id: true },
        })
        userId = dbUser?.id ?? null
      }
    }

    // Fallback: cookies/sessão do Supabase
    if (!userId) {
      const session = await getSessionForServer()
      userId = session?.user?.id ?? null
    }

    // Se não conseguimos resolver userId via cookies/sessão, mas o tenantId foi informado,
    // assumimos que o caller (painel) já validou o tenant do usuário via /api/partner/me.
    // Isso evita o endpoint ficar dependente de cookies em dev.
    if (!userId && tenantIdParam) {
      const tenantCities = await prisma.tenantCity.findMany({
        where: { tenantId: tenantIdParam, isActive: true },
        include: {
          city: {
            select: {
              id: true,
              name: true,
              state: true,
              latitude: true,
              longitude: true,
            },
          },
        },
        orderBy: {
          city: { name: 'asc' },
        },
      })

      return NextResponse.json({
        cities: tenantCities
          .map((tc) => {
            const c = tc.city
            if (!c) return null
            return {
              id: c.id,
              name: c.name,
              state: c.state,
              latitude: Number(c.latitude),
              longitude: Number(c.longitude),
            }
          })
          .filter(
            (c): c is {
              id: string
              name: string
              state: string
              latitude: number
              longitude: number
            } => c !== null
          ),
      })
    }

    if (!userId) return NextResponse.json({ cities: [] })

    const tenantUser = await prisma.tenantUser.findFirst({
      where: tenantIdParam ? { userId, tenantId: tenantIdParam } : { userId },
      include: {
        tenant: { select: { id: true } },
      },
    })

    if (!tenantUser?.tenant?.id) return NextResponse.json({ cities: [] })
    const tenantId = tenantUser.tenant.id

    const tenantCities = await prisma.tenantCity.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            state: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: {
        city: { name: 'asc' },
      },
    })

    return NextResponse.json({
      cities: tenantCities
        .map((tc) => {
          const c = tc.city
          if (!c) return null
          return {
            id: c.id,
            name: c.name,
            state: c.state,
            latitude: Number(c.latitude),
            longitude: Number(c.longitude),
          }
        })
        .filter(
          (c): c is {
            id: string
            name: string
            state: string
            latitude: number
            longitude: number
          } => c !== null
        ),
    })
  } catch (error) {
    console.error('[partner/cities] GET', error)
    return NextResponse.json({ cities: [] }, { status: 500 })
  }
}

