import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * PATCH /api/app/driver/status
 * Body: { isOnline: boolean }
 *
 * Atualiza o status do motorista logado (online/offline).
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !supabaseUser?.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const isOnline = typeof body?.isOnline === 'boolean' ? body.isOnline : null

    if (isOnline === null) {
      return NextResponse.json({ error: 'Parâmetro isOnline inválido.' }, { status: 400 })
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: supabaseUser.id },
      select: { id: true, status: true, isActive: true },
    })

    if (!driver || !driver.isActive) {
      return NextResponse.json({ error: 'Motorista não encontrado ou inativo.' }, { status: 404 })
    }

    const newStatus = isOnline ? 'online' : 'offline'

    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        status: newStatus,
      },
      select: { id: true },
    })

    return NextResponse.json({
      ok: true,
      status: newStatus,
    })
  } catch (error) {
    console.error('[app/driver/status] PATCH', error)
    return NextResponse.json({ error: 'Erro ao atualizar status do motorista.' }, { status: 500 })
  }
}

