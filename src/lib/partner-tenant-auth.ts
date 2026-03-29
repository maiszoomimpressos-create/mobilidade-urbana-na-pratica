import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionForServer } from '@/lib/supabase-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * `users.id` (Prisma) do parceiro logado — Bearer ou cookie (previews Vercel).
 */
export async function getPartnerDbUserIdFromRequest(request: NextRequest): Promise<string | null> {
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
    email = session?.user?.email ?? null
  }

  if (!email) return null

  const dbUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true },
  })

  return dbUser?.id ?? null
}

export type PartnerAuthOk = { ok: true; tenantId: string }
export type PartnerAuthErr = { ok: false; response: NextResponse }

/**
 * Resolve o tenantId da central do usuário parceiro (Bearer ou cookie Supabase).
 */
export async function getPartnerTenantIdOrError(request: NextRequest): Promise<PartnerAuthOk | PartnerAuthErr> {
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
    email = session?.user?.email ?? null
  }

  if (!email) {
    return { ok: false, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }

  const dbUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true },
  })

  if (!dbUser) {
    return { ok: false, response: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }) }
  }

  const tenantUser = await prisma.tenantUser.findFirst({
    where: {
      userId: dbUser.id,
      isActive: true,
      tenant: { isActive: true },
    },
    select: { tenantId: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!tenantUser) {
    return { ok: false, response: NextResponse.json({ error: 'Central não encontrada' }, { status: 404 }) }
  }

  return { ok: true, tenantId: tenantUser.tenantId }
}
