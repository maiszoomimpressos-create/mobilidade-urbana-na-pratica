import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { z } from 'zod'

const bodySchema = z.object({
  token: z.string().min(1, 'Token inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = bodySchema.parse(body)

    const verification = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verification || verification.expires < new Date()) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado. Solicite um novo link de redefinição.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: verification.identifier },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado. Solicite um novo link de redefinição.' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: { token: verification.token },
      }),
    ])

    return NextResponse.json(
      { message: 'Senha alterada com sucesso. Faça login com a nova senha.' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[reset-password]', error)
    return NextResponse.json(
      { error: 'Erro ao redefinir senha. Tente novamente.' },
      { status: 500 }
    )
  }
}
