import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

const DB_OUTDATED_MSG =
  'O banco ainda não tem a coluna de imagem nos tipos de corrida. Rode `npx prisma db push` (ou no Supabase: ALTER TABLE tenant_ride_types ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;) e reinicie o servidor.'

const PRISMA_CLIENT_STALE_MSG =
  'O Prisma Client está desatualizado. Pare o `npm run dev`, rode `npx prisma generate` e suba o servidor de novo. Em seguida confira o banco com `npx prisma db push`.'

/**
 * Converte erros comuns do Prisma em resposta HTTP legível para o painel.
 */
export function nextResponseFromPrismaError(error: unknown, logLabel: string): NextResponse | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2022') {
      console.error(logLabel, error.message)
      return NextResponse.json({ error: DB_OUTDATED_MSG }, { status: 503 })
    }
  }

  /** Cliente gerado antes do campo `imageUrl` — Unknown arg `imageUrl` */
  if (error instanceof Prisma.PrismaClientValidationError) {
    const msg = error.message
    console.error(logLabel, msg)
    if (msg.includes('imageUrl') || msg.includes('Unknown arg')) {
      return NextResponse.json({ error: PRISMA_CLIENT_STALE_MSG }, { status: 503 })
    }
    return NextResponse.json(
      { error: 'Dados inválidos para o banco. Confira nome, preços e URL da imagem.' },
      { status: 400 }
    )
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    const msg = error.message
    console.error(logLabel, msg)
    if (/column|does not exist|imageUrl/i.test(msg)) {
      return NextResponse.json({ error: DB_OUTDATED_MSG }, { status: 503 })
    }
  }

  return null
}

/**
 * Mensagem genérica 500; em desenvolvimento inclui o texto do erro para depuração.
 */
export function nextResponseInternalError(error: unknown): NextResponse {
  const dev = process.env.NODE_ENV === 'development'
  const hint = dev && error instanceof Error ? error.message : null
  return NextResponse.json(
    {
      error: hint ? `Erro interno: ${hint}` : 'Erro interno',
    },
    { status: 500 }
  )
}
