import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/app/driver/me
 * Retorna o perfil de motorista do usuário autenticado.
 * Se não tiver perfil de motorista, retorna null (o app pode chamar /register para criar).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ driver: null }, { status: 200 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token)

    if (error || !supabaseUser?.id) {
      return NextResponse.json({ driver: null }, { status: 200 })
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: supabaseUser.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        vehicles: {
          where: { isActive: true },
          take: 1,
        },
      },
    })

    if (!driver) {
      return NextResponse.json({ driver: null }, { status: 200 })
    }

    const name =
      (supabaseUser.user_metadata?.full_name as string) ||
      (supabaseUser.user_metadata?.name as string) ||
      ''
    const phone = (supabaseUser.user_metadata?.phone as string) || null

    return NextResponse.json({
      driver: {
        id: driver.id,
        userId: driver.userId,
        name,
        email: supabaseUser.email ?? '',
        phone,
        tenantId: driver.tenantId,
        tenantName: driver.tenant.name,
        tenantSlug: driver.tenant.slug,
        status: driver.status,
        isActive: driver.isActive,
        rating: driver.rating ? Number(driver.rating) : null,
        totalRides: driver.totalRides,
        isOnline: driver.status === 'online',
        isApproved: true, // TODO: aprovação por central
        vehicle: driver.vehicles[0] ?? null,
        createdAt: driver.createdAt,
      },
    })
  } catch (error) {
    console.error('[driver/me]', error)
    return NextResponse.json({ driver: null }, { status: 200 })
  }
}
