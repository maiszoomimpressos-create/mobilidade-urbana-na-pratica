import { NextRequest, NextResponse } from 'next/server'
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type AppDriverAuthFailure = { ok: false; response: NextResponse }

export type AppDriverAuthOk = {
  ok: true
  supabaseUser: SupabaseUser
  driver: {
    id: string
    userId: string
    tenantId: string
    status: string
    isActive: boolean
  }
}

/**
 * Valida Bearer Supabase e retorna o motorista ativo (isActive) do banco.
 * Não exige status online — cada rota aplica a regra que precisar.
 */
export async function authenticateAppDriver(
  request: NextRequest
): Promise<AppDriverAuthOk | AppDriverAuthFailure> {
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

  const driver = await prisma.driver.findUnique({
    where: { userId: supabaseUser.id },
    select: {
      id: true,
      userId: true,
      tenantId: true,
      status: true,
      isActive: true,
    },
  })

  if (!driver) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Motorista não encontrado.' }, { status: 404 }),
    }
  }

  if (!driver.isActive) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Motorista inativo.' }, { status: 403 }),
    }
  }

  return { ok: true, supabaseUser, driver }
}
