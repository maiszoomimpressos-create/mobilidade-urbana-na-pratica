import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ensurePassengerForTenant } from '@/lib/app-passenger-bearer-auth'
import { resolveTenantForAppSlug } from '@/lib/tenant-resolve-app'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/app/passenger/ensure
 * Body: { tenantSlug }
 * Cria ou atualiza vínculo do passageiro com a central (necessário para rastrear corridas).
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
    if (error || !user?.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const slug = typeof body?.tenantSlug === 'string' ? body.tenantSlug.trim() : ''
    if (!slug) {
      return NextResponse.json({ error: 'tenantSlug obrigatório.' }, { status: 400 })
    }

    const tenant = await resolveTenantForAppSlug(slug)
    if (!tenant) {
      return NextResponse.json({ error: 'Central não encontrada.' }, { status: 404 })
    }

    const passenger = await ensurePassengerForTenant(user.id, tenant.id)

    return NextResponse.json({
      ok: true,
      passengerId: passenger.id,
      tenantId: passenger.tenantId,
    })
  } catch (e) {
    console.error('[app/passenger/ensure] POST', e)
    return NextResponse.json({ error: 'Erro ao garantir perfil.' }, { status: 500 })
  }
}
