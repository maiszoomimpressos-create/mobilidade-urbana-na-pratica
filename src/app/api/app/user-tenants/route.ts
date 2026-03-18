import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface TenantInfo {
  id: string
  name: string
  slug: string
  logo: string | null
  linkedCity: {
    id: string
    name: string
    state: string
  } | null
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        canSwitch: false,
        tenants: [],
        message: 'Não autenticado',
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token)

    if (error || !supabaseUser?.email) {
      return NextResponse.json({
        canSwitch: false,
        tenants: [],
        message: 'Token inválido',
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
      include: {
        tenantUsers: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                isActive: true,
                tenantCities: {
                  where: { isActive: true },
                  take: 1,
                  select: {
                    city: {
                      select: {
                        id: true,
                        name: true,
                        state: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({
        canSwitch: false,
        tenants: [],
        message: 'Usuário não encontrado',
      })
    }

    const hasSwitchPermission = user.tenantUsers.some((tu) => {
      if (tu.role.slug === 'master') return true
      return tu.role.rolePermissions.some(
        (rp) => rp.permission.slug === 'switch_tenant'
      )
    })

    if (!hasSwitchPermission) {
      return NextResponse.json({
        canSwitch: false,
        tenants: [],
        message: 'Sem permissão para alternar centrais',
      })
    }

    const isMaster = user.tenantUsers.some((tu) => tu.role.slug === 'master')

    let tenants: TenantInfo[] = []

    if (isMaster) {
      const allTenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          tenantCities: {
            where: { isActive: true },
            take: 1,
            select: {
              city: {
                select: {
                  id: true,
                  name: true,
                  state: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      tenants = allTenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        logo: t.logo,
        linkedCity: t.tenantCities[0]?.city ?? null,
      }))
    } else {
      tenants = user.tenantUsers
        .filter((tu) => tu.tenant.isActive)
        .map((tu) => ({
          id: tu.tenant.id,
          name: tu.tenant.name,
          slug: tu.tenant.slug,
          logo: tu.tenant.logo,
          linkedCity: tu.tenant.tenantCities[0]?.city ?? null,
        }))
    }

    return NextResponse.json({
      canSwitch: tenants.length > 1,
      tenants,
      isMaster,
    })
  } catch (error) {
    console.error('[user-tenants]', error)
    return NextResponse.json({
      canSwitch: false,
      tenants: [],
      message: 'Erro interno',
    })
  }
}
