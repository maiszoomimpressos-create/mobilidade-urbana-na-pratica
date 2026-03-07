import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Verifica conexão com o banco e variáveis do Supabase.
 * Útil para diagnóstico após deploy (ex.: GET /api/health na Vercel).
 */
export async function GET() {
  const result: { db: string; supabaseEnv: string; ok: boolean } = {
    db: 'unknown',
    supabaseEnv: 'unknown',
    ok: false,
  }

  // 1) Banco de dados
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    result.db = 'ok'
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    result.db = `erro: ${msg.slice(0, 80)}`
  }

  // 2) Variáveis Supabase (não expor valores)
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  result.supabaseEnv = hasUrl && hasAnon ? 'ok' : `faltando: url=${hasUrl}, anon=${hasAnon}`

  result.ok = result.db === 'ok' && result.supabaseEnv === 'ok'

  const status = result.ok ? 200 : 503
  return NextResponse.json(result, { status })
}
