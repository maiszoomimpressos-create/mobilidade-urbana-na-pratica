import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { ensurePassengerForTenant } from '@/lib/app-passenger-bearer-auth'
import { resolveTenantForAppSlug } from '@/lib/tenant-resolve-app'
import { UserAccountKind } from '@prisma/client'
import { initialAccountKindForSignupMetadata } from '@/lib/user-account-kind-sync'
import { getMasterAdminEmails } from '@/lib/master-admin-config'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/auth/sync-passenger-registration
 * Bearer: após login ou cadastro com sessão — grava telefone/endereço no User e vincula passageiro à central preferida (metadata).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)
    if (error || !user?.email) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const meta = (user.user_metadata || {}) as Record<string, unknown>

    const phone =
      (typeof body?.phone === 'string' && body.phone) ||
      (typeof meta.phone === 'string' ? meta.phone : null)
    const homeAddress =
      (typeof body?.homeAddress === 'string' && body.homeAddress) ||
      (typeof meta.home_address === 'string' ? meta.home_address : null)
    const latRaw = body?.homeLatitude ?? meta.home_lat
    const lngRaw = body?.homeLongitude ?? meta.home_lng
    const lat = typeof latRaw === 'number' ? latRaw : latRaw != null ? Number(latRaw) : null
    const lng = typeof lngRaw === 'number' ? lngRaw : lngRaw != null ? Number(lngRaw) : null

    const tenantSlug =
      (typeof body?.tenantSlug === 'string' && body.tenantSlug.trim()) ||
      (typeof meta.preferred_tenant_slug === 'string' ? meta.preferred_tenant_slug.trim() : '')

    const email = user.email.toLowerCase()
    const name =
      (typeof meta?.full_name === 'string' && meta.full_name) ||
      (typeof meta?.name === 'string' && meta.name) ||
      null

    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, accountKind: true },
    })

    const dataProfile = {
      ...(phone ? { phone } : {}),
      ...(homeAddress ? { homeAddress } : {}),
      ...(lat != null && Number.isFinite(lat) ? { homeLatitude: lat } : {}),
      ...(lng != null && Number.isFinite(lng) ? { homeLongitude: lng } : {}),
    }

    if (!dbUser) {
      const masterEmails = getMasterAdminEmails()
      const isMaster = masterEmails.includes(email)
      await prisma.user.create({
        data: {
          email,
          name,
          accountKind: isMaster
            ? UserAccountKind.ADMIN_MASTER
            : initialAccountKindForSignupMetadata(meta),
          ...dataProfile,
        },
      })
    } else if (dbUser.accountKind !== UserAccountKind.ADMIN_MASTER) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: dataProfile,
      })
    }

    if (tenantSlug && user.id) {
      const tenant = await resolveTenantForAppSlug(tenantSlug)
      if (tenant) {
        await ensurePassengerForTenant(user.id, tenant.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[auth/sync-passenger-registration]', e)
    return NextResponse.json({ error: 'Erro ao sincronizar cadastro.' }, { status: 500 })
  }
}
