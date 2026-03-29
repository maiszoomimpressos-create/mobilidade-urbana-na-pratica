import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserAccountKind } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { ensureDefaultRideTypesForTenant } from '@/lib/tenant-default-ride-types'
import { findActivePartnerCentralForUser } from '@/lib/partner-active-central'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * POST /api/partner/register
 * Cria central pendente para o parceiro autenticado e vincula ao plano.
 *
 * body: { centralName, cityId?, cityName?, cityState?, planSlug }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !supabaseUser?.email) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const centralName = typeof body?.centralName === 'string' ? body.centralName.trim() : ''
    const cityId = typeof body?.cityId === 'string' ? body.cityId.trim() : ''
    const cityName = typeof body?.cityName === 'string' ? body.cityName.trim() : ''
    const cityState = typeof body?.cityState === 'string' ? body.cityState.trim() : ''
    const planSlug = typeof body?.planSlug === 'string' ? body.planSlug.trim() : ''
    /** Cadastro público (/parceiro + /planos) = Nossa Bandeira Mai Drive. White-label só via admin ou body explícito. */
    const rawType = typeof body?.tenantType === 'string' ? body.tenantType.trim().toLowerCase() : ''
    const tenantType =
      rawType === 'white-label' || rawType === 'whitelabel' ? 'white-label' : 'brand'

    if (!centralName) {
      return NextResponse.json({ error: 'Nome da central é obrigatório.' }, { status: 400 })
    }
    if (!cityId && (!cityName || !cityState)) {
      return NextResponse.json({ error: 'Informe cityId ou cidade + UF (estado).'}, { status: 400 })
    }

    const slug = slugify(centralName)
    if (!slug) {
      return NextResponse.json({ error: 'Nome inválido para gerar slug.' }, { status: 400 })
    }

    const existingSlug = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'Já existe uma central com este nome. Tente outro.' },
        { status: 409 }
      )
    }

    const normalizedEmail = supabaseUser.email.toLowerCase()

    let dbUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: { id: true },
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: supabaseUser.user_metadata?.full_name as string || supabaseUser.user_metadata?.name as string || null,
          accountKind: UserAccountKind.STANDARD,
        },
        select: { id: true },
      })
    }

    const existingActive = await findActivePartnerCentralForUser(dbUser.id)

    if (existingActive?.tenant) {
      return NextResponse.json({
        error: 'Você já possui uma central cadastrada.',
        tenant: {
          id: existingActive.tenant.id,
          name: existingActive.tenant.name,
          slug: existingActive.tenant.slug,
          approvalStatus: existingActive.tenant.approvalStatus,
        },
      }, { status: 409 })
    }

    let ownerRole = await prisma.role.findFirst({
      where: { slug: 'owner' },
      select: { id: true },
    })
    if (!ownerRole) {
      ownerRole = await prisma.role.create({
        data: {
          name: 'Dono da Central',
          slug: 'owner',
          description: 'Proprietário/administrador da central parceira.',
        },
        select: { id: true },
      })
    }

    const city = cityId
      ? await prisma.city.findUnique({
          where: { id: cityId },
        })
      : await prisma.city.findFirst({
          where: {
            name: { equals: cityName, mode: 'insensitive' },
            state: { equals: cityState, mode: 'insensitive' },
            country: 'BR',
          },
        })

    if (!city) {
      return NextResponse.json(
        {
          error: 'Cidade não cadastrada no sistema.',
          detail:
            'Solicite ao admin master cadastrar a cidade (nome + UF) antes de criar a central.',
        },
        { status: 400 }
      )
    }

    const existingTenantCity = await prisma.tenantCity.findFirst({
      where: { cityId: city.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { tenant: { select: { id: true, name: true, approvalStatus: true, isActive: true } } },
    })

    const hasApprovedCentralForCity =
      existingTenantCity?.tenant.approvalStatus === 'approved' && existingTenantCity?.tenant.isActive

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: centralName,
          slug,
          type: tenantType,
          approvalStatus: 'pending',
          isActive: false,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          approvalStatus: true,
        },
      })

      await tx.tenantUser.create({
        data: {
          userId: dbUser.id,
          tenantId: tenant.id,
          roleId: ownerRole.id,
          isActive: true,
        },
      })

      // Vincula a cidade à central solicitada (mesmo quando já existe outra central na cidade)
      await tx.tenantCity.create({
        data: {
          tenantId: tenant.id,
          cityId: city.id,
          isActive: true,
        },
      })

      await ensureDefaultRideTypesForTenant(tx, tenant.id, [city.id])

      if (planSlug) {
        const plan = await tx.plan.findFirst({
          where: { slug: planSlug, isActive: true },
          select: { id: true },
        })
        if (plan) {
          const now = new Date()
          const oneMonthLater = new Date(now)
          oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

          await tx.tenantPlan.create({
            data: {
              tenantId: tenant.id,
              planId: plan.id,
              status: 'pending',
              currentPeriodStart: now,
              currentPeriodEnd: oneMonthLater,
            },
          })
        }
      }

      return { tenant, hasApprovedCentralForCity }
    })

    return NextResponse.json({
      message: hasApprovedCentralForCity
        ? 'Já existe uma central aprovada nesta cidade. Sua solicitação foi registrada para análise.'
        : 'Central cadastrada com sucesso! Aguarde a aprovação.',
      tenant: result.tenant,
    }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : ''
    console.error('[partner/register] POST —', msg)
    console.error(stack)
    const missingApprovalStatus =
      msg.toLowerCase().includes('approvalstatus') &&
      (msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('não existe'))

    return NextResponse.json(
      missingApprovalStatus
        ? {
            error: 'Erro ao cadastrar central: migração pendente.',
            detail:
              'A tabela `tenants` ainda não tem a coluna `approvalStatus` no banco. Rode no Supabase SQL Editor o script: scripts/add_tenant_approval_status.sql',
          }
        : { error: 'Erro ao cadastrar central.', detail: msg },
      { status: 500 }
    )
  }
}
