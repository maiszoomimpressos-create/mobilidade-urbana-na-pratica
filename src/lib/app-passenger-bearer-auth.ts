import { NextRequest, NextResponse } from 'next/server'
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type AppPassengerAuthFailure = { ok: false; response: NextResponse }

export type AppPassengerAuthOk = {
  ok: true
  supabaseUser: SupabaseUser
  passenger: { id: string; userId: string; tenantId: string }
}

export async function authenticateAppPassenger(
  request: NextRequest
): Promise<AppPassengerAuthOk | AppPassengerAuthFailure> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !supabaseUser?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Token inválido' }, { status: 401 }),
    }
  }

  const passenger = await prisma.passenger.findUnique({
    where: { userId: supabaseUser.id },
    select: { id: true, userId: true, tenantId: true, isActive: true },
  })

  if (!passenger) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Perfil de passageiro não encontrado. Faça login novamente.' },
        { status: 404 }
      ),
    }
  }

  if (!passenger.isActive) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Passageiro inativo.' }, { status: 403 }),
    }
  }

  return { ok: true, supabaseUser, passenger }
}

/**
 * Garante passageiro vinculado ao tenant da corrida (cria se não existir).
 */
export async function ensurePassengerForTenant(
  supabaseUserId: string,
  tenantId: string
): Promise<{ id: string; userId: string; tenantId: string }> {
  const existing = await prisma.passenger.findUnique({
    where: { userId: supabaseUserId },
    select: { id: true, userId: true, tenantId: true },
  })
  if (existing) {
    if (existing.tenantId !== tenantId) {
      return prisma.passenger.update({
        where: { id: existing.id },
        data: { tenantId },
        select: { id: true, userId: true, tenantId: true },
      })
    }
    return existing
  }

  return prisma.passenger.create({
    data: {
      userId: supabaseUserId,
      tenantId,
      isActive: true,
    },
    select: { id: true, userId: true, tenantId: true },
  })
}
