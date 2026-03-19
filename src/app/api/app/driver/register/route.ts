import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/app/driver/register
 * Adiciona o perfil de motorista ao usuário autenticado.
 * Se o usuário já tem Passenger, usa o mesmo tenant.
 * Caso contrário, usa o primeiro tenant ativo.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token)

    if (error || !supabaseUser?.id) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const existingDriver = await prisma.driver.findUnique({
      where: { userId: supabaseUser.id },
    })

    if (existingDriver) {
      return NextResponse.json({
        driver: existingDriver,
        message: 'Você já possui perfil de motorista.',
      })
    }

    let tenantId: string

    const passenger = await prisma.passenger.findUnique({
      where: { userId: supabaseUser.id },
      select: { tenantId: true },
    })

    if (passenger) {
      tenantId = passenger.tenantId
    } else {
      const firstTenant = await prisma.tenant.findFirst({
        where: { isActive: true },
        select: { id: true },
      })
      if (!firstTenant) {
        return NextResponse.json(
          { error: 'Nenhuma central disponível.' },
          { status: 400 }
        )
      }
      tenantId = firstTenant.id
    }

    const driver = await prisma.driver.create({
      data: {
        userId: supabaseUser.id,
        tenantId,
        status: 'offline',
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

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
        rating: null,
        totalRides: 0,
        isOnline: false,
        isApproved: true,
        vehicle: null,
        createdAt: driver.createdAt,
      },
      message: 'Perfil de motorista criado com sucesso!',
    })
  } catch (error) {
    console.error('[driver/register]', error)
    return NextResponse.json(
      { error: 'Erro ao criar perfil de motorista' },
      { status: 500 }
    )
  }
}
