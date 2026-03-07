import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { z } from 'zod'
import crypto from 'crypto'

const bodySchema = z.object({
  email: z.string().email('Email inválido'),
})

const TOKEN_EXPIRY_HOURS = 1

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = bodySchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, password: true },
    })

    // Mesma resposta se o email existir ou não (evita vazamento de informação)
    const message =
      'Se existir uma conta com este email, você receberá um link para redefinir a senha em alguns minutos.'

    if (!user || !user.password) {
      return NextResponse.json({ message }, { status: 200 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
    const identifier = email.toLowerCase().trim()

    await prisma.verificationToken.deleteMany({
      where: { identifier },
    })

    await prisma.verificationToken.create({
      data: { identifier, token, expires },
    })

    const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin
    const resetLink = `${baseUrl}/redefinir-senha?token=${token}`

    const result = await sendPasswordResetEmail(email, resetLink)

    if (!result.ok) {
      console.error('[forgot-password] Falha ao enviar email:', result.error)
      return NextResponse.json(
        { message: 'Não foi possível enviar o email. Tente novamente mais tarde.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ message }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Email inválido', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[forgot-password]', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação. Tente novamente.' },
      { status: 500 }
    )
  }
}
